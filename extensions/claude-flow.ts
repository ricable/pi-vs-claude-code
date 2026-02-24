/**
 * Claude-Flow — Swarm coordination via claude-flow CLI
 *
 * Bridges the claude-flow CLI into Pi as tools and commands, enabling
 * multi-agent swarm orchestration with strategies (development, research,
 * analysis, testing, optimization, maintenance), distributed memory,
 * monitoring, and agent management — all from within a Pi session.
 *
 * Tools:
 *   cf_swarm_start    — Launch a swarm with strategy + options
 *   cf_swarm_status   — Check swarm / system status
 *   cf_swarm_stop     — Stop a running swarm
 *   cf_swarm_scale    — Scale agent count up/down
 *   cf_memory_store   — Store key-value in swarm memory
 *   cf_memory_search  — Semantic search across swarm memory
 *   cf_memory_stats   — Memory statistics
 *   cf_agent_list     — List all agents
 *   cf_agent_info     — Get agent details
 *   cf_monitor        — Snapshot of swarm monitoring output
 *
 * Commands:
 *   /cf-swarm <objective>   — Quick-launch a swarm (auto strategy)
 *   /cf-status              — Show swarm status
 *   /cf-stop                — Stop the swarm
 *   /cf-agents              — List active agents
 *   /cf-memory <query>      — Search swarm memory
 *   /cf-strategies          — List available strategies
 *
 * Usage: pi -e extensions/claude-flow.ts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { Text } from "@mariozechner/pi-tui";
import { spawn, execFileSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { applyExtensionDefaults } from "./themeMap.ts";
import { VectorDB } from "@ruvector/rvf-node";

// ── Constants ─────────────────────────────────────────────────────────────────

// CLI-valid strategies (claude-flow v3.1+). "auto" is handled locally — we map it to "adaptive".
const CLI_STRATEGIES = ["specialized", "balanced", "adaptive", "research", "development", "testing", "optimization", "maintenance", "analysis"] as const;
const STRATEGIES = ["auto", ...CLI_STRATEGIES] as const;
const MODES = ["centralized", "distributed", "hierarchical", "mesh", "hybrid"] as const;

type Strategy = typeof STRATEGIES[number];
type CliStrategy = typeof CLI_STRATEGIES[number];
type Mode = typeof MODES[number];

/** Map user-facing strategy to CLI-valid strategy */
function toCliStrategy(s: Strategy): CliStrategy {
	return s === "auto" ? "adaptive" : s as CliStrategy;
}

const CF_BIN = "claude-flow";
const RVF_DIM = 384;
const RVF_DIR = ".rvf";
const RVF_FILE = "claude-flow.json";

// ── RVF Memory System ─────────────────────────────────────────────────────────

interface SwarmEntry {
	id: string;
	key: string;
	value: string;
	namespace: string;
	type: "memory" | "event" | "belief" | "result";
	timestamp: number;
	swarmId?: string;
	strategy?: string;
	tags: string[];
}

function rvfHash(s: string): number {
	let h = 0;
	for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
	return Math.abs(h);
}

function rvfRng(seed: number): () => number {
	let s = seed;
	return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

function rvfEmbed(text: string): Float32Array {
	const rng = rvfRng(rvfHash(text));
	const v = new Float32Array(RVF_DIM);
	for (let i = 0; i < RVF_DIM; i++) v[i] = rng() * 2 - 1;
	const mag = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
	for (let i = 0; i < RVF_DIM; i++) v[i] /= mag;
	return v;
}

function rvfUid(): string {
	return `cf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

class RvfSwarmStore {
	private db = VectorDB.withDimensions(RVF_DIM);
	private entries: Map<string, SwarmEntry> = new Map();
	private storagePath: string;
	private loadPromise: Promise<void>;

	constructor(private cwd: string) {
		this.storagePath = join(cwd, RVF_DIR, RVF_FILE);
		this.loadPromise = this.load();
	}

	private async load(): Promise<void> {
		try {
			if (!existsSync(this.storagePath)) return;
			const data: SwarmEntry[] = JSON.parse(readFileSync(this.storagePath, "utf-8"));
			const inserts = data.map(e => {
				this.entries.set(e.id, e);
				return this.db.insert({
					id: e.id,
					vector: rvfEmbed(e.key + " " + e.value),
					metadata: e,
				});
			});
			await Promise.all(inserts);
		} catch {}
	}

	private save(): void {
		try {
			const dir = join(this.cwd, RVF_DIR);
			if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
			writeFileSync(this.storagePath, JSON.stringify(Array.from(this.entries.values()), null, 2));
		} catch {}
	}

	async store(entry: Omit<SwarmEntry, "id" | "timestamp">): Promise<string> {
		await this.loadPromise;
		const id = rvfUid();
		const full: SwarmEntry = { ...entry, id, timestamp: Date.now() };
		const vector = rvfEmbed(entry.key + " " + entry.value);
		await this.db.insert({ id, vector, metadata: full });
		this.entries.set(id, full);
		this.save();
		return id;
	}

	async search(query: string, k = 10, namespace?: string): Promise<Array<SwarmEntry & { score: number }>> {
		await this.loadPromise;
		const vector = rvfEmbed(query);
		const results = await this.db.search({ vector, k: namespace ? k * 5 : k });
		let entries = results
			.map(r => ({ ...(r.metadata as SwarmEntry), score: r.score ?? 0 }))
			.filter(Boolean);
		if (namespace) {
			entries = entries.filter(e => e.namespace === namespace).slice(0, k);
		}
		return entries;
	}

	async getByKey(key: string, namespace?: string): Promise<SwarmEntry | null> {
		await this.loadPromise;
		for (const e of this.entries.values()) {
			if (e.key === key && (!namespace || e.namespace === namespace)) return e;
		}
		return null;
	}

	async stats(): Promise<{ total: number; byNamespace: Record<string, number>; byType: Record<string, number> }> {
		await this.loadPromise;
		const byNamespace: Record<string, number> = {};
		const byType: Record<string, number> = {};
		for (const e of this.entries.values()) {
			byNamespace[e.namespace] = (byNamespace[e.namespace] || 0) + 1;
			byType[e.type] = (byType[e.type] || 0) + 1;
		}
		return { total: this.entries.size, byNamespace, byType };
	}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isCfAvailable(): boolean {
	try {
		execFileSync(CF_BIN, ["--version"], { stdio: "ignore", timeout: 5_000 });
		return true;
	} catch {
		return false;
	}
}

function cfExec(args: string[], timeoutMs = 30_000): Promise<{ stdout: string; stderr: string; code: number }> {
	return new Promise((resolve) => {
		const stdout: string[] = [];
		const stderr: string[] = [];
		const proc = spawn(CF_BIN, args, {
			stdio: ["ignore", "pipe", "pipe"],
			env: { ...process.env, NO_COLOR: "1" },
		});

		const timer = setTimeout(() => {
			proc.kill("SIGTERM");
			resolve({ stdout: stdout.join(""), stderr: "Timeout after " + (timeoutMs / 1000) + "s", code: 124 });
		}, timeoutMs);

		proc.stdout?.setEncoding("utf-8");
		proc.stdout?.on("data", (d: string) => stdout.push(d));
		proc.stderr?.setEncoding("utf-8");
		proc.stderr?.on("data", (d: string) => stderr.push(d));
		proc.on("close", (code) => {
			clearTimeout(timer);
			resolve({ stdout: stdout.join(""), stderr: stderr.join(""), code: code ?? 1 });
		});
		proc.on("error", (e) => {
			clearTimeout(timer);
			resolve({ stdout: "", stderr: e.message, code: 1 });
		});
	});
}

/** Fire-and-forget background process (for --background swarm starts) */
function cfSpawnBackground(args: string[]): number | null {
	try {
		const proc = spawn(CF_BIN, args, {
			stdio: "ignore",
			detached: true,
			env: { ...process.env, NO_COLOR: "1" },
		});
		proc.unref();
		return proc.pid ?? null;
	} catch {
		return null;
	}
}

function cleanAnsi(s: string): string {
	return s.replace(/\x1b\[[0-9;]*m/g, "");
}

function strategyEmoji(s: Strategy): string {
	const map: Record<Strategy, string> = {
		auto: "🎯", development: "🛠", research: "🔬",
		analysis: "📊", testing: "🧪", optimization: "⚡",
		maintenance: "🔧",
	};
	return map[s] || "🐝";
}

function unavailableResult() {
	return {
		content: [{ type: "text" as const, text: "claude-flow CLI not found.\nInstall: npm i -g @claude-flow/cli@latest" }],
		details: { status: "unavailable" },
	};
}

// ── Extension ─────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
	let activeSwarmPid: number | null = null;
	let activeSwarmId: string | null = null;
	let lastStrategy: Strategy = "auto";
	let lastObjective = "";

	// ── RVF Store Instance ────────────────────────────────────────────────────
	const rvf = new RvfSwarmStore(process.cwd());

	/** Extract swarm ID from CLI output (e.g. "swarm-mlzrk8xk") */
	function extractSwarmId(output: string): string | null {
		const m = output.match(/swarm-[a-z0-9]+/i);
		return m ? m[0] : null;
	}

	// ── Tool: cf_swarm_start ──────────────────────────────────────────────────

	pi.registerTool({
		name: "cf_swarm_start",
		label: "CF Swarm Start",
		description:
			"Launch a claude-flow swarm for a complex task. Supports strategies: " +
			STRATEGIES.join(", ") +
			". Options include coordination mode, max agents, monitoring, review, testing, parallel execution, and background mode for long-running tasks.",
		parameters: Type.Object({
			objective: Type.String({ description: "The task/objective for the swarm" }),
			strategy: Type.Optional(Type.Union(STRATEGIES.map(s => Type.Literal(s)), { description: "Swarm strategy (default: auto)" })),
			mode: Type.Optional(Type.Union(MODES.map(m => Type.Literal(m)), { description: "Coordination mode (default: centralized)" })),
			maxAgents: Type.Optional(Type.Number({ description: "Max concurrent agents (default: 5)" })),
			background: Type.Optional(Type.Boolean({ description: "Run in background for long tasks" })),
			monitor: Type.Optional(Type.Boolean({ description: "Enable real-time monitoring" })),
			review: Type.Optional(Type.Boolean({ description: "Enable peer review process" })),
			testing: Type.Optional(Type.Boolean({ description: "Include automated testing" })),
			parallel: Type.Optional(Type.Boolean({ description: "Enable parallel execution" })),
			distributed: Type.Optional(Type.Boolean({ description: "Enable distributed coordination" })),
			encryption: Type.Optional(Type.Boolean({ description: "Enable data encryption" })),
			verbose: Type.Optional(Type.Boolean({ description: "Detailed logging" })),
			dryRun: Type.Optional(Type.Boolean({ description: "Preview config without executing" })),
		}),

		async execute(_id, params, _signal, onUpdate, _ctx) {
			if (!isCfAvailable()) return unavailableResult();

			const {
				objective, strategy = "auto", mode, maxAgents, background = false,
				monitor, review, testing, parallel, distributed, encryption, verbose, dryRun,
			} = params as {
				objective: string; strategy?: Strategy; mode?: Mode; maxAgents?: number;
				background?: boolean; monitor?: boolean; review?: boolean; testing?: boolean;
				parallel?: boolean; distributed?: boolean; encryption?: boolean;
				verbose?: boolean; dryRun?: boolean;
			};

			lastStrategy = strategy;
			lastObjective = objective;
			const cliStrat = toCliStrategy(strategy);

			const args = ["swarm", "start", "--objective", objective, "--strategy", cliStrat];
			if (mode) args.push("--mode", mode);
			if (maxAgents) args.push("--max-agents", String(maxAgents));
			if (background) args.push("--background");
			if (monitor) args.push("--monitor");
			if (review) args.push("--review");
			if (testing) args.push("--testing");
			if (parallel) args.push("--parallel");
			if (distributed) args.push("--distributed");
			if (encryption) args.push("--encryption");
			if (verbose) args.push("--verbose");
			if (dryRun) args.push("--dry-run");

			if (onUpdate) {
				onUpdate({
					content: [{ type: "text", text: `${strategyEmoji(strategy)} Starting ${strategy} swarm: ${objective.slice(0, 60)}...` }],
					details: {},
				});
			}

			if (background && !dryRun) {
				const pid = cfSpawnBackground(args);
				activeSwarmPid = pid;
				// Store swarm launch event in RVF
				await rvf.store({
					key: `swarm_start_${Date.now()}`, value: objective,
					namespace: "swarm", type: "event",
					swarmId: undefined, strategy, tags: ["swarm", "start", strategy, "background"],
				});
				return {
					content: [{ type: "text", text: `${strategyEmoji(strategy)} Swarm launched in background\nPID: ${pid || "unknown"}\nStrategy: ${strategy} (CLI: ${cliStrat})\nObjective: ${objective}\n\nUse cf_swarm_status to check progress.\n📦 Stored in RVF: .rvf/claude-flow.json` }],
					details: { status: "background", pid, strategy, objective },
				};
			}

			const result = await cfExec(args, dryRun ? 10_000 : 120_000);
			const output = cleanAnsi((result.stdout || result.stderr).trim()) || "(no output)";

			// Capture swarm ID from output for stop/scale operations
			if (result.code === 0 && !dryRun) {
				activeSwarmId = extractSwarmId(output);
			}

			// Store in RVF
			if (!dryRun) {
				await rvf.store({
					key: `swarm_start_${activeSwarmId || Date.now()}`, value: objective,
					namespace: "swarm", type: "event",
					swarmId: activeSwarmId || undefined, strategy,
					tags: ["swarm", "start", strategy, ...(result.code === 0 ? ["success"] : ["error"])],
				});
			}

			return {
				content: [{ type: "text", text: `${strategyEmoji(strategy)} ${dryRun ? "[DRY RUN] " : ""}${strategy} swarm\n\n${output}${!dryRun ? "\n\n📦 RVF: .rvf/claude-flow.json" : ""}` }],
				details: {
					status: result.code === 0 ? "started" : "error",
					strategy, objective, exitCode: result.code,
					swarmId: activeSwarmId,
					dryRun: !!dryRun, background: false,
				},
			};
		},

		renderCall(args, theme) {
			const a = args as any;
			const strategy = a.strategy || "auto";
			const preview = (a.objective || "").slice(0, 40);
			return new Text(
				theme.fg("toolTitle", theme.bold("cf_swarm_start ")) +
				theme.fg("accent", `[${strategy}] `) +
				theme.fg("muted", preview),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const d = result.details as any;
			if (d?.status === "unavailable") return new Text(theme.fg("error", "claude-flow not installed"), 0, 0);
			if (d?.status === "background") return new Text(theme.fg("success", `Background PID ${d.pid}`), 0, 0);
			const color = d?.status === "started" ? "success" : "error";
			return new Text(theme.fg(color, `${d?.strategy}: ${d?.status}`), 0, 0);
		},
	});

	// ── Tool: cf_swarm_status ─────────────────────────────────────────────────

	pi.registerTool({
		name: "cf_swarm_status",
		label: "CF Swarm Status",
		description: "Get current status of the claude-flow system: swarm state, agent counts, task progress, and memory usage.",
		parameters: Type.Object({
			verbose: Type.Optional(Type.Boolean({ description: "Show detailed status" })),
		}),

		async execute(_id, params, _signal, _onUpdate, _ctx) {
			if (!isCfAvailable()) return unavailableResult();
			const { verbose } = params as { verbose?: boolean };
			const args = ["status"];
			if (verbose) args.push("--verbose");
			const result = await cfExec(args, 10_000);
			const output = cleanAnsi((result.stdout || result.stderr).trim()) || "(no output)";
			return {
				content: [{ type: "text", text: output }],
				details: { status: result.code === 0 ? "ok" : "error", exitCode: result.code },
			};
		},

		renderCall(_args, theme) {
			return new Text(theme.fg("toolTitle", theme.bold("cf_swarm_status")), 0, 0);
		},
		renderResult(result, _options, theme) {
			const d = result.details as any;
			const color = d?.status === "ok" ? "success" : "error";
			return new Text(theme.fg(color, d?.status || "?"), 0, 0);
		},
	});

	// ── Tool: cf_swarm_stop ───────────────────────────────────────────────────

	pi.registerTool({
		name: "cf_swarm_stop",
		label: "CF Swarm Stop",
		description: "Stop a running claude-flow swarm. Uses the tracked swarm ID from the last start, or specify one explicitly.",
		parameters: Type.Object({
			swarmId: Type.Optional(Type.String({ description: "Swarm ID to stop (auto-detected if omitted)" })),
		}),

		async execute(_id, params, _signal, _onUpdate, _ctx) {
			if (!isCfAvailable()) return unavailableResult();
			const { swarmId } = params as { swarmId?: string };
			const id = swarmId || activeSwarmId;
			if (!id) {
				return {
					content: [{ type: "text", text: "No active swarm ID tracked. Use cf_swarm_status to find the swarm ID, or pass swarmId explicitly." }],
					details: { status: "error" },
				};
			}
			const result = await cfExec(["swarm", "stop", id], 10_000);
			activeSwarmPid = null;
			activeSwarmId = null;
			const output = cleanAnsi((result.stdout || result.stderr).trim()) || "Swarm stopped.";
			return {
				content: [{ type: "text", text: output }],
				details: { status: result.code === 0 ? "stopped" : "error", swarmId: id },
			};
		},

		renderCall(_args, theme) {
			return new Text(theme.fg("toolTitle", theme.bold("cf_swarm_stop")), 0, 0);
		},
		renderResult(result, _options, theme) {
			const d = result.details as any;
			return new Text(theme.fg(d?.status === "stopped" ? "success" : "error", d?.status || "?"), 0, 0);
		},
	});

	// ── Tool: cf_swarm_scale ──────────────────────────────────────────────────

	pi.registerTool({
		name: "cf_swarm_scale",
		label: "CF Swarm Scale",
		description: "Scale the number of agents in a running swarm up or down.",
		parameters: Type.Object({
			count: Type.Number({ description: "Target agent count" }),
			swarmId: Type.Optional(Type.String({ description: "Swarm ID (auto-detected if omitted)" })),
		}),

		async execute(_id, params, _signal, _onUpdate, _ctx) {
			if (!isCfAvailable()) return unavailableResult();
			const { count, swarmId } = params as { count: number; swarmId?: string };
			const id = swarmId || activeSwarmId;
			if (!id) {
				return {
					content: [{ type: "text", text: "No active swarm ID tracked. Start a swarm first or pass swarmId." }],
					details: { status: "error" },
				};
			}
			const result = await cfExec(["swarm", "scale", id, "--agents", String(count)], 10_000);
			const output = cleanAnsi((result.stdout || result.stderr).trim()) || `Scaled to ${count} agents.`;
			return {
				content: [{ type: "text", text: output }],
				details: { status: result.code === 0 ? "scaled" : "error", count, swarmId: id },
			};
		},

		renderCall(args, theme) {
			return new Text(
				theme.fg("toolTitle", theme.bold("cf_swarm_scale ")) +
				theme.fg("accent", String((args as any).count || "?")),
				0, 0,
			);
		},
		renderResult(result, _options, theme) {
			const d = result.details as any;
			return new Text(theme.fg(d?.status === "scaled" ? "success" : "error", `${d?.status} → ${d?.count}`), 0, 0);
		},
	});

	// ── Tool: cf_memory_store ─────────────────────────────────────────────────

	pi.registerTool({
		name: "cf_memory_store",
		label: "CF Memory Store",
		description: "Store a key-value pair in claude-flow distributed memory. Optionally specify a namespace for organization.",
		parameters: Type.Object({
			key: Type.String({ description: "Memory key" }),
			value: Type.String({ description: "Value to store" }),
			namespace: Type.Optional(Type.String({ description: "Memory namespace (default: swarm)" })),
		}),

		async execute(_id, params, _signal, _onUpdate, _ctx) {
			if (!isCfAvailable()) return unavailableResult();
			const { key, value, namespace } = params as { key: string; value: string; namespace?: string };
			const args = ["memory", "store", "-k", key, "-v", value];
			if (namespace) args.push("--namespace", namespace);
			const result = await cfExec(args, 10_000);
			const output = cleanAnsi((result.stdout || result.stderr).trim()) || `Stored: ${key}`;
			return {
				content: [{ type: "text", text: output }],
				details: { status: result.code === 0 ? "stored" : "error", key, namespace },
			};
		},

		renderCall(args, theme) {
			return new Text(
				theme.fg("toolTitle", theme.bold("cf_memory_store ")) +
				theme.fg("accent", (args as any).key || "?"),
				0, 0,
			);
		},
		renderResult(result, _options, theme) {
			const d = result.details as any;
			return new Text(theme.fg(d?.status === "stored" ? "success" : "error", `${d?.key}: ${d?.status}`), 0, 0);
		},
	});

	// ── Tool: cf_memory_search ────────────────────────────────────────────────

	pi.registerTool({
		name: "cf_memory_search",
		label: "CF Memory Search",
		description: "Semantic search across claude-flow distributed memory. Returns relevant entries matching the query.",
		parameters: Type.Object({
			query: Type.String({ description: "Search query" }),
			namespace: Type.Optional(Type.String({ description: "Namespace to search (default: all)" })),
			limit: Type.Optional(Type.Number({ description: "Max results (default: 10)" })),
		}),

		async execute(_id, params, _signal, _onUpdate, _ctx) {
			if (!isCfAvailable()) return unavailableResult();
			const { query, namespace, limit } = params as { query: string; namespace?: string; limit?: number };
			const args = ["memory", "search", "--query", query];
			if (namespace) args.push("--namespace", namespace);
			if (limit) args.push("--limit", String(limit));
			const result = await cfExec(args, 15_000);
			const output = cleanAnsi((result.stdout || result.stderr).trim()) || "(no results)";
			return {
				content: [{ type: "text", text: output }],
				details: { status: result.code === 0 ? "ok" : "error", query },
			};
		},

		renderCall(args, theme) {
			const q = ((args as any).query || "").slice(0, 40);
			return new Text(
				theme.fg("toolTitle", theme.bold("cf_memory_search ")) +
				theme.fg("muted", q),
				0, 0,
			);
		},
		renderResult(result, _options, theme) {
			const d = result.details as any;
			return new Text(theme.fg(d?.status === "ok" ? "success" : "error", d?.status || "?"), 0, 0);
		},
	});

	// ── Tool: cf_memory_stats ─────────────────────────────────────────────────

	pi.registerTool({
		name: "cf_memory_stats",
		label: "CF Memory Stats",
		description: "Show memory statistics for the claude-flow system.",
		parameters: Type.Object({}),

		async execute(_id, _params, _signal, _onUpdate, _ctx) {
			if (!isCfAvailable()) return unavailableResult();
			const result = await cfExec(["memory", "stats"], 10_000);
			const output = cleanAnsi((result.stdout || result.stderr).trim()) || "(no stats)";
			return {
				content: [{ type: "text", text: output }],
				details: { status: result.code === 0 ? "ok" : "error" },
			};
		},

		renderCall(_args, theme) {
			return new Text(theme.fg("toolTitle", theme.bold("cf_memory_stats")), 0, 0);
		},
		renderResult(result, _options, theme) {
			const d = result.details as any;
			return new Text(theme.fg(d?.status === "ok" ? "success" : "error", d?.status || "?"), 0, 0);
		},
	});

	// ── Tool: cf_agent_list ───────────────────────────────────────────────────

	pi.registerTool({
		name: "cf_agent_list",
		label: "CF Agent List",
		description: "List all agents in the claude-flow system with their status.",
		parameters: Type.Object({}),

		async execute(_id, _params, _signal, _onUpdate, _ctx) {
			if (!isCfAvailable()) return unavailableResult();
			const result = await cfExec(["agent", "list"], 10_000);
			const output = cleanAnsi((result.stdout || result.stderr).trim()) || "(no agents)";
			return {
				content: [{ type: "text", text: output }],
				details: { status: result.code === 0 ? "ok" : "error" },
			};
		},

		renderCall(_args, theme) {
			return new Text(theme.fg("toolTitle", theme.bold("cf_agent_list")), 0, 0);
		},
		renderResult(result, _options, theme) {
			const d = result.details as any;
			return new Text(theme.fg(d?.status === "ok" ? "success" : "error", d?.status || "?"), 0, 0);
		},
	});

	// ── Tool: cf_agent_info ───────────────────────────────────────────────────

	pi.registerTool({
		name: "cf_agent_info",
		label: "CF Agent Info",
		description: "Get detailed information about a specific claude-flow agent.",
		parameters: Type.Object({
			agentId: Type.String({ description: "Agent ID to inspect" }),
		}),

		async execute(_id, params, _signal, _onUpdate, _ctx) {
			if (!isCfAvailable()) return unavailableResult();
			const { agentId } = params as { agentId: string };
			const result = await cfExec(["agent", "info", agentId], 10_000);
			const output = cleanAnsi((result.stdout || result.stderr).trim()) || `(no info for ${agentId})`;
			return {
				content: [{ type: "text", text: output }],
				details: { status: result.code === 0 ? "ok" : "error", agentId },
			};
		},

		renderCall(args, theme) {
			return new Text(
				theme.fg("toolTitle", theme.bold("cf_agent_info ")) +
				theme.fg("accent", (args as any).agentId || "?"),
				0, 0,
			);
		},
		renderResult(result, _options, theme) {
			const d = result.details as any;
			return new Text(theme.fg(d?.status === "ok" ? "success" : "error", d?.agentId || "?"), 0, 0);
		},
	});

	// ── Tool: cf_monitor ──────────────────────────────────────────────────────

	pi.registerTool({
		name: "cf_monitor",
		label: "CF Monitor",
		description: "Get a snapshot of claude-flow monitoring output: agent activity, task progress, and resource usage.",
		parameters: Type.Object({
			focus: Type.Optional(Type.String({ description: "Focus area: swarm, agents, tasks, memory" })),
		}),

		async execute(_id, params, _signal, _onUpdate, _ctx) {
			if (!isCfAvailable()) return unavailableResult();
			const { focus } = params as { focus?: string };
			// Use status --verbose as a monitor snapshot (monitor is interactive/streaming)
			const args = ["status", "--verbose"];
			if (focus) args.push("--focus", focus);
			const result = await cfExec(args, 10_000);
			const output = cleanAnsi((result.stdout || result.stderr).trim()) || "(no data)";
			return {
				content: [{ type: "text", text: output }],
				details: { status: result.code === 0 ? "ok" : "error", focus },
			};
		},

		renderCall(args, theme) {
			const focus = (args as any).focus;
			return new Text(
				theme.fg("toolTitle", theme.bold("cf_monitor")) +
				(focus ? theme.fg("dim", ` [${focus}]`) : ""),
				0, 0,
			);
		},
		renderResult(result, _options, theme) {
			const d = result.details as any;
			return new Text(theme.fg(d?.status === "ok" ? "success" : "error", d?.status || "?"), 0, 0);
		},
	});

	// ── Commands ──────────────────────────────────────────────────────────────

	pi.registerCommand("cf-swarm", {
		description: "Quick-launch swarm: /cf-swarm [strategy:]<objective>  (e.g. /cf-swarm development:Build REST API)",
		handler: async (args, ctx) => {
			const input = args?.trim();
			if (!input) {
				ctx.ui.notify("Usage: /cf-swarm [strategy:]<objective>\nStrategies: " + STRATEGIES.join(", "), "error");
				return;
			}

			let strategy: Strategy = "auto";
			let objective = input;

			// Parse optional strategy prefix
			const colonIdx = input.indexOf(":");
			if (colonIdx > 0) {
				const prefix = input.slice(0, colonIdx).toLowerCase();
				if (STRATEGIES.includes(prefix as Strategy)) {
					strategy = prefix as Strategy;
					objective = input.slice(colonIdx + 1).trim();
				}
			}

			if (!isCfAvailable()) {
				ctx.ui.notify("claude-flow CLI not found. Install: npm i -g @claude-flow/cli@latest", "error");
				return;
			}

			const cliStrat = toCliStrategy(strategy);
			ctx.ui.notify(`${strategyEmoji(strategy)} Launching ${strategy} swarm (CLI: ${cliStrat})...\n${objective}`, "info");
			lastStrategy = strategy;
			lastObjective = objective;

			const result = await cfExec(["swarm", "start", "--objective", objective, "--strategy", cliStrat], 120_000);
			const output = cleanAnsi((result.stdout || result.stderr).trim());
			if (result.code === 0) {
				activeSwarmId = extractSwarmId(output);
			}
			ctx.ui.notify(output || "Swarm started.", result.code === 0 ? "success" : "error");
		},
	});

	pi.registerCommand("cf-status", {
		description: "Show claude-flow system status",
		handler: async (_args, ctx) => {
			if (!isCfAvailable()) {
				ctx.ui.notify("claude-flow CLI not found.", "error");
				return;
			}
			const result = await cfExec(["status"], 10_000);
			ctx.ui.notify(cleanAnsi((result.stdout || result.stderr).trim()) || "(no output)", "info");
		},
	});

	pi.registerCommand("cf-stop", {
		description: "Stop the running swarm: /cf-stop [swarm-id]",
		handler: async (args, ctx) => {
			if (!isCfAvailable()) {
				ctx.ui.notify("claude-flow CLI not found.", "error");
				return;
			}
			const id = args?.trim() || activeSwarmId;
			if (!id) {
				ctx.ui.notify("No active swarm ID. Use /cf-status to find it, or: /cf-stop <swarm-id>", "error");
				return;
			}
			const result = await cfExec(["swarm", "stop", id], 10_000);
			activeSwarmPid = null;
			activeSwarmId = null;
			ctx.ui.notify(cleanAnsi((result.stdout || result.stderr).trim()) || "Swarm stopped.", "info");
		},
	});

	pi.registerCommand("cf-agents", {
		description: "List claude-flow agents",
		handler: async (_args, ctx) => {
			if (!isCfAvailable()) {
				ctx.ui.notify("claude-flow CLI not found.", "error");
				return;
			}
			const result = await cfExec(["agent", "list"], 10_000);
			ctx.ui.notify(cleanAnsi((result.stdout || result.stderr).trim()) || "(no agents)", "info");
		},
	});

	pi.registerCommand("cf-memory", {
		description: "Search swarm memory: /cf-memory <query>",
		handler: async (args, ctx) => {
			const query = args?.trim();
			if (!query) {
				ctx.ui.notify("Usage: /cf-memory <search query>", "error");
				return;
			}
			if (!isCfAvailable()) {
				ctx.ui.notify("claude-flow CLI not found.", "error");
				return;
			}
			const result = await cfExec(["memory", "search", "--query", query], 15_000);
			ctx.ui.notify(cleanAnsi((result.stdout || result.stderr).trim()) || "(no results)", "info");
		},
	});

	pi.registerCommand("cf-strategies", {
		description: "List available swarm strategies",
		handler: async (_args, ctx) => {
			const lines = STRATEGIES.map(s => `  ${strategyEmoji(s)} ${s}`).join("\n");
			const modes = MODES.join(", ");
			ctx.ui.notify(
				`Swarm Strategies:\n${lines}\n\nCoordination Modes: ${modes}\n\nUsage: /cf-swarm [strategy:]<objective>`,
				"info",
			);
		},
	});

	// ── Events ────────────────────────────────────────────────────────────────

	pi.on("session_start", async (_event, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);

		const available = isCfAvailable();
		const icon = available ? "●" : "○";
		ctx.ui.setStatus("claude-flow", `CF: ${icon} ${available ? "ready" : "not found"}`);

		ctx.ui.notify(
			`🐝 Claude-Flow integration loaded ${available ? "(CLI ready)" : "(CLI not found)"}\n\n` +
			`Tools: cf_swarm_start, cf_swarm_status, cf_swarm_stop, cf_swarm_scale\n` +
			`       cf_memory_store, cf_memory_search, cf_memory_stats\n` +
			`       cf_agent_list, cf_agent_info, cf_monitor\n\n` +
			`Commands:\n` +
			`  /cf-swarm <objective>    Launch swarm (prefix strategy: e.g. development:Build API)\n` +
			`  /cf-status               System status\n` +
			`  /cf-stop                 Stop swarm\n` +
			`  /cf-agents               List agents\n` +
			`  /cf-memory <query>       Search memory\n` +
			`  /cf-strategies           List strategies`,
			"info",
		);
	});

	pi.on("before_agent_start", async (_event, _ctx) => {
		const strategyInfo = lastObjective
			? `Active swarm: ${lastStrategy} — ${lastObjective}`
			: "No active swarm";

		return {
			appendSystemPrompt: [
				"\n\n## Claude-Flow Swarm Integration",
				strategyInfo,
				"",
				"You have access to claude-flow swarm coordination tools:",
				"",
				"**Swarm lifecycle:**",
				"- cf_swarm_start: Launch a swarm with strategy + options (development, research, analysis, testing, optimization, maintenance)",
				"- cf_swarm_status: Check system status (agents, tasks, memory)",
				"- cf_swarm_stop: Stop a running swarm",
				"- cf_swarm_scale: Scale agent count up/down",
				"",
				"**Memory (distributed KV + semantic search):**",
				"- cf_memory_store: Store key-value with optional namespace",
				"- cf_memory_search: Semantic search across swarm memory",
				"- cf_memory_stats: View memory statistics",
				"",
				"**Agent management:**",
				"- cf_agent_list: List all agents and status",
				"- cf_agent_info: Inspect a specific agent",
				"- cf_monitor: Monitoring snapshot",
				"",
				"**Strategies guide:**",
				"- development: Code implementation with review + testing cycles",
				"- research: Information gathering, analysis, synthesis",
				"- analysis: Data processing, pattern identification",
				"- testing: Comprehensive QA and security auditing",
				"- optimization: Performance tuning, refactoring",
				"- maintenance: System updates, bug fixes, dependency updates",
				"- auto: Let claude-flow choose based on task analysis",
				"",
				"For long-running tasks, use background:true to avoid timeouts.",
				"For enterprise workloads, combine: parallel + distributed + review + testing + encryption.",
			].join("\n"),
		};
	});
}
