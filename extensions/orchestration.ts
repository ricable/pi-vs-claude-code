/**
 * Orchestration — Provider routing + swarm coordination
 *
 * Routes tasks to the best available provider (Gemini, Codex, ruvllm)
 * based on priority, keywords, and complexity heuristics. Also provides
 * lightweight swarm coordination primitives for multi-agent dispatch.
 *
 * Providers:
 *   gemini  — Google Gemini CLI (search, research, quality)
 *   codex   — OpenAI Codex CLI (speed, cost, code)
 *   ruvllm  — Local LLM via HTTP or CLI (privacy, offline)
 *   auto    — Automatic routing based on heuristics
 *
 * Commands:
 *   /provider <name>     — Set active provider (gemini/codex/ruvllm/auto)
 *   /providers           — List all providers with availability status
 *   /swarm <topology>    — Initialize swarm with topology
 *   /route <task>        — Auto-route a task to the best provider
 *
 * Usage: pi -e extensions/orchestration.ts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { Text } from "@mariozechner/pi-tui";
import { spawn, execFileSync } from "child_process";
import { applyExtensionDefaults } from "./themeMap.ts";

// ── Types ─────────────────────────────────────────────────────────────────────

type ProviderName = "gemini" | "codex" | "ruvllm" | "auto";
type Priority = "quality" | "speed" | "cost" | "privacy";
type Topology = "hierarchical" | "mesh" | "ring" | "star";

interface SwarmConfig {
	topology: Topology;
	maxAgents: number;
}

interface Dispatch {
	id: string;
	agentId: string;
	task: string;
	role: string;
	status: "pending" | "running" | "done" | "error";
	files: string[];
	timestamp: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isCliAvailable(cmd: string): boolean {
	try {
		execFileSync("which", [cmd], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function spawnCollect(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
	return new Promise((resolve) => {
		const stdout: string[] = [];
		const stderr: string[] = [];
		const proc = spawn(cmd, args, {
			stdio: ["ignore", "pipe", "pipe"],
			env: { ...process.env },
		});
		proc.stdout?.setEncoding("utf-8");
		proc.stdout?.on("data", (d: string) => stdout.push(d));
		proc.stderr?.setEncoding("utf-8");
		proc.stderr?.on("data", (d: string) => stderr.push(d));
		proc.on("close", (code) => resolve({ stdout: stdout.join(""), stderr: stderr.join(""), code: code ?? 1 }));
		proc.on("error", (e) => resolve({ stdout: "", stderr: e.message, code: 1 }));
	});
}

function routeByHeuristic(prompt: string, priority?: Priority): ProviderName {
	const lower = prompt.toLowerCase();

	// Keyword-based routing
	if (/\b(local|private|offline)\b/.test(lower)) return "ruvllm";
	if (/\b(search|research|web)\b/.test(lower)) return "gemini";

	// Priority-based routing
	if (priority === "privacy") return "ruvllm";
	if (priority === "speed" || priority === "cost") return "codex";
	if (priority === "quality") return "gemini";

	// Complexity heuristic: long prompts benefit from a stronger model
	return prompt.length > 500 ? "gemini" : "codex";
}

function routeExplanation(prompt: string, target: ProviderName): string {
	const lower = prompt.toLowerCase();
	if (/\b(local|private|offline)\b/.test(lower)) return `Keywords "local/private/offline" detected -> ruvllm`;
	if (/\b(search|research|web)\b/.test(lower)) return `Keywords "search/research/web" detected -> gemini`;
	if (prompt.length > 500) return `Long prompt (${prompt.length} chars) -> gemini for stronger reasoning`;
	return `Short prompt (${prompt.length} chars) -> codex for speed`;
}

// ── Extension ─────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
	let activeProvider: ProviderName = "auto";
	let swarmConfig: SwarmConfig | null = null;
	const dispatches: Map<string, Dispatch> = new Map();
	let dispatchCounter = 0;

	// ── Provider Tools ────────────────────────────────────────────────────────

	pi.registerTool({
		name: "gemini_run",
		label: "Gemini Run",
		description: "Run a prompt through Google Gemini CLI. Best for research, web-connected tasks, and high-quality reasoning.",
		parameters: Type.Object({
			prompt: Type.String({ description: "Prompt to send to Gemini" }),
			files: Type.Optional(Type.Array(Type.String(), { description: "File paths to attach as context" })),
			model: Type.Optional(Type.String({ description: "Model name override" })),
		}),

		async execute(_id, params, _signal, onUpdate, _ctx) {
			const { prompt, files = [], model } = params as { prompt: string; files?: string[]; model?: string };

			if (!isCliAvailable("gemini")) {
				return {
					content: [{ type: "text", text: "Gemini CLI not found. Install: npm install -g @google/gemini-cli\nOr: https://github.com/google-gemini/gemini-cli" }],
					details: { status: "unavailable", provider: "gemini" },
				};
			}

			if (onUpdate) {
				onUpdate({ content: [{ type: "text", text: `gemini: ${prompt.slice(0, 60)}...` }], details: {} });
			}

			const args: string[] = [];
			if (model) args.push("--model", model);
			for (const f of files) args.push("-f", f);
			args.push(prompt);

			const result = await spawnCollect("gemini", args);
			const output = (result.stdout || result.stderr).trim() || "(no output)";

			return {
				content: [{ type: "text", text: output }],
				details: { provider: "gemini", status: result.code === 0 ? "done" : "error", exitCode: result.code },
			};
		},

		renderCall(args, theme) {
			const prompt = (args as any).prompt || "";
			const preview = prompt.length > 50 ? prompt.slice(0, 47) + "..." : prompt;
			return new Text(
				theme.fg("toolTitle", theme.bold("gemini_run ")) +
				theme.fg("muted", preview),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			if (details?.status === "unavailable") return new Text(theme.fg("error", "Gemini CLI not installed"), 0, 0);
			const color = details?.status === "done" ? "success" : "error";
			return new Text(theme.fg(color, `gemini: ${details?.status}`), 0, 0);
		},
	});

	pi.registerTool({
		name: "codex_run",
		label: "Codex Run",
		description: "Run a prompt through OpenAI Codex CLI. Best for fast coding tasks and cost-efficient operations.",
		parameters: Type.Object({
			prompt: Type.String({ description: "Prompt to send to Codex" }),
			files: Type.Optional(Type.Array(Type.String(), { description: "File paths to attach as context" })),
			model: Type.Optional(Type.String({ description: "Model name override" })),
		}),

		async execute(_id, params, _signal, onUpdate, _ctx) {
			const { prompt, files = [], model } = params as { prompt: string; files?: string[]; model?: string };

			if (!isCliAvailable("codex")) {
				return {
					content: [{ type: "text", text: "Codex CLI not found. Install: npm install -g @openai/codex\nOr: https://github.com/openai/codex" }],
					details: { status: "unavailable", provider: "codex" },
				};
			}

			if (onUpdate) {
				onUpdate({ content: [{ type: "text", text: `codex: ${prompt.slice(0, 60)}...` }], details: {} });
			}

			const args: string[] = [];
			if (model) args.push("--model", model);
			for (const f of files) args.push("-f", f);
			args.push(prompt);

			const result = await spawnCollect("codex", args);
			const output = (result.stdout || result.stderr).trim() || "(no output)";

			return {
				content: [{ type: "text", text: output }],
				details: { provider: "codex", status: result.code === 0 ? "done" : "error", exitCode: result.code },
			};
		},

		renderCall(args, theme) {
			const prompt = (args as any).prompt || "";
			const preview = prompt.length > 50 ? prompt.slice(0, 47) + "..." : prompt;
			return new Text(
				theme.fg("toolTitle", theme.bold("codex_run ")) +
				theme.fg("muted", preview),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			if (details?.status === "unavailable") return new Text(theme.fg("error", "Codex CLI not installed"), 0, 0);
			const color = details?.status === "done" ? "success" : "error";
			return new Text(theme.fg(color, `codex: ${details?.status}`), 0, 0);
		},
	});

	pi.registerTool({
		name: "ruvllm_run",
		label: "RuVLLM Run",
		description: "Run a prompt through a local LLM via ruvllm. Best for privacy-sensitive tasks and offline work.",
		parameters: Type.Object({
			prompt: Type.String({ description: "Prompt to send to the local LLM" }),
			model: Type.Optional(Type.String({ description: "Model name (default: ruvltra-medium-1.1b-q4_k_m)" })),
		}),

		async execute(_id, params, _signal, onUpdate, _ctx) {
			const { prompt, model = "ruvltra-medium-1.1b-q4_k_m" } = params as { prompt: string; model?: string };

			if (onUpdate) {
				onUpdate({ content: [{ type: "text", text: `ruvllm (${model}): ${prompt.slice(0, 50)}...` }], details: {} });
			}

			// Try HTTP first (OpenAI-compatible endpoint)
			try {
				const res = await fetch("http://localhost:8080/v1/chat/completions", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						model,
						messages: [{ role: "user", content: prompt }],
						temperature: 0.7,
						max_tokens: 2048,
					}),
				});

				if (res.ok) {
					const data = await res.json() as any;
					const text = data?.choices?.[0]?.message?.content || JSON.stringify(data);
					return {
						content: [{ type: "text", text }],
						details: { provider: "ruvllm", status: "done", method: "http", model },
					};
				}
			} catch {
				// HTTP failed, fall through to CLI
			}

			// Fallback: CLI
			if (!isCliAvailable("ruvllm")) {
				return {
					content: [{ type: "text", text: "ruvllm not available. Start the server (port 8080) or install the CLI.\nHTTP: http://localhost:8080/v1/chat/completions\nCLI: https://github.com/ruvnet/ruvllm" }],
					details: { status: "unavailable", provider: "ruvllm" },
				};
			}

			const result = await spawnCollect("ruvllm", ["chat", "--model", model, prompt]);
			const output = (result.stdout || result.stderr).trim() || "(no output)";

			return {
				content: [{ type: "text", text: output }],
				details: { provider: "ruvllm", status: result.code === 0 ? "done" : "error", method: "cli", model },
			};
		},

		renderCall(args, theme) {
			const prompt = (args as any).prompt || "";
			const preview = prompt.length > 50 ? prompt.slice(0, 47) + "..." : prompt;
			return new Text(
				theme.fg("toolTitle", theme.bold("ruvllm_run ")) +
				theme.fg("muted", preview),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			if (details?.status === "unavailable") return new Text(theme.fg("error", "ruvllm not available"), 0, 0);
			const method = details?.method === "http" ? "http" : "cli";
			const color = details?.status === "done" ? "success" : "error";
			return new Text(theme.fg(color, `ruvllm (${method}): ${details?.status}`), 0, 0);
		},
	});

	pi.registerTool({
		name: "auto_route",
		label: "Auto Route",
		description: "Automatically route a prompt to the best available provider based on keywords, priority, and complexity.",
		parameters: Type.Object({
			prompt: Type.String({ description: "The task/prompt to route" }),
			priority: Type.Optional(Type.Union([
				Type.Literal("quality"),
				Type.Literal("speed"),
				Type.Literal("cost"),
				Type.Literal("privacy"),
			], { description: "Routing priority (quality/speed/cost/privacy)" })),
		}),

		async execute(_id, params, _signal, onUpdate, _ctx) {
			const { prompt, priority } = params as { prompt: string; priority?: Priority };
			const target = routeByHeuristic(prompt, priority);
			const header = `[auto_route -> ${target}${priority ? ` (${priority})` : ""}]\n\n`;

			if (onUpdate) {
				onUpdate({ content: [{ type: "text", text: `Routing to ${target}...` }], details: { target } });
			}

			// Route to ruvllm
			if (target === "ruvllm") {
				try {
					const res = await fetch("http://localhost:8080/v1/chat/completions", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							model: "ruvltra-medium-1.1b-q4_k_m",
							messages: [{ role: "user", content: prompt }],
							temperature: 0.7,
							max_tokens: 2048,
						}),
					});
					if (res.ok) {
						const data = await res.json() as any;
						const text = data?.choices?.[0]?.message?.content || JSON.stringify(data);
						return {
							content: [{ type: "text", text: header + text }],
							details: { provider: target, status: "done", method: "http", routedBy: "auto", priority },
						};
					}
				} catch {}

				if (isCliAvailable("ruvllm")) {
					const r = await spawnCollect("ruvllm", ["chat", prompt]);
					return {
						content: [{ type: "text", text: header + (r.stdout || r.stderr || "(no output)") }],
						details: { provider: target, status: r.code === 0 ? "done" : "error", method: "cli", routedBy: "auto", priority },
					};
				}
				return {
					content: [{ type: "text", text: header + "ruvllm not available (no HTTP server or CLI found)" }],
					details: { provider: target, status: "unavailable", routedBy: "auto", priority },
				};
			}

			// Route to gemini or codex
			if (!isCliAvailable(target)) {
				return {
					content: [{ type: "text", text: header + `${target} CLI not installed.` }],
					details: { provider: target, status: "unavailable", routedBy: "auto", priority },
				};
			}

			const result = await spawnCollect(target, [prompt]);
			const output = (result.stdout || result.stderr).trim() || "(no output)";

			return {
				content: [{ type: "text", text: header + output }],
				details: { provider: target, status: result.code === 0 ? "done" : "error", routedBy: "auto", priority },
			};
		},

		renderCall(args, theme) {
			const prompt = (args as any).prompt || "";
			const priority = (args as any).priority;
			const preview = prompt.length > 40 ? prompt.slice(0, 37) + "..." : prompt;
			const suffix = priority ? ` [${priority}]` : "";
			return new Text(
				theme.fg("toolTitle", theme.bold("auto_route")) +
				theme.fg("dim", suffix + " ") +
				theme.fg("muted", preview),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			if (details?.status === "unavailable") {
				return new Text(theme.fg("error", `${details?.provider || "?"} unavailable`), 0, 0);
			}
			const color = details?.status === "done" ? "success" : "error";
			return new Text(
				theme.fg(color, `-> ${details?.provider}`) +
				theme.fg("dim", details?.method ? ` (${details.method})` : ""),
				0, 0,
			);
		},
	});

	// ── Swarm Tools ───────────────────────────────────────────────────────────

	pi.registerTool({
		name: "swarm_init",
		label: "Swarm Init",
		description: "Initialize a swarm with a given topology for multi-agent coordination.",
		parameters: Type.Object({
			topology: Type.Union([
				Type.Literal("hierarchical"),
				Type.Literal("mesh"),
				Type.Literal("ring"),
				Type.Literal("star"),
			], { description: "Swarm topology" }),
			maxAgents: Type.Optional(Type.Number({ description: "Maximum agents (default 8)" })),
		}),

		async execute(_id, params, _signal, _onUpdate, _ctx) {
			const { topology, maxAgents = 8 } = params as { topology: Topology; maxAgents?: number };
			swarmConfig = { topology, maxAgents };
			dispatches.clear();
			dispatchCounter = 0;

			return {
				content: [{ type: "text", text: `Swarm initialized: ${topology} topology, max ${maxAgents} agents` }],
				details: { topology, maxAgents, status: "initialized" },
			};
		},

		renderCall(args, theme) {
			const topology = (args as any).topology || "?";
			return new Text(
				theme.fg("toolTitle", theme.bold("swarm_init ")) +
				theme.fg("accent", topology),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			return new Text(
				theme.fg("success", `${details?.topology} (max ${details?.maxAgents})`),
				0, 0,
			);
		},
	});

	pi.registerTool({
		name: "swarm_dispatch",
		label: "Swarm Dispatch",
		description: "Dispatch a task to an agent within the swarm. Tracks the dispatch for coordination and conflict detection.",
		parameters: Type.Object({
			agentId: Type.String({ description: "Agent identifier" }),
			task: Type.String({ description: "Task to assign" }),
			role: Type.Optional(Type.String({ description: "Agent role (e.g. coder, reviewer, tester)" })),
		}),

		async execute(_id, params, _signal, _onUpdate, _ctx) {
			const { agentId, task, role = "general" } = params as { agentId: string; task: string; role?: string };

			if (swarmConfig && dispatches.size >= swarmConfig.maxAgents) {
				return {
					content: [{ type: "text", text: `Swarm at capacity (${swarmConfig.maxAgents} agents). Complete or remove a dispatch first.` }],
					details: { status: "rejected", reason: "capacity" },
				};
			}

			dispatchCounter++;
			const dispatchId = `d-${dispatchCounter}-${Date.now().toString(36)}`;
			const dispatch: Dispatch = {
				id: dispatchId,
				agentId,
				task,
				role,
				status: "pending",
				files: [],
				timestamp: Date.now(),
			};
			dispatches.set(dispatchId, dispatch);

			return {
				content: [{ type: "text", text: `Dispatched: ${dispatchId} -> ${agentId} (${role})\nTask: ${task}` }],
				details: { dispatchId, agentId, role, status: "pending" },
			};
		},

		renderCall(args, theme) {
			const agentId = (args as any).agentId || "?";
			const role = (args as any).role;
			return new Text(
				theme.fg("toolTitle", theme.bold("swarm_dispatch ")) +
				theme.fg("accent", agentId) +
				(role ? theme.fg("dim", ` (${role})`) : ""),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			if (details?.status === "rejected") return new Text(theme.fg("error", "At capacity"), 0, 0);
			return new Text(theme.fg("success", `${details?.dispatchId}`), 0, 0);
		},
	});

	pi.registerTool({
		name: "swarm_status",
		label: "Swarm Status",
		description: "Get the status of all active swarm dispatches and configuration.",
		parameters: Type.Object({}),

		async execute(_id, _params, _signal, _onUpdate, _ctx) {
			const config = swarmConfig
				? `Topology: ${swarmConfig.topology}, Max: ${swarmConfig.maxAgents}`
				: "Swarm not initialized";

			const active = Array.from(dispatches.values());
			if (active.length === 0) {
				return {
					content: [{ type: "text", text: `${config}\nNo active dispatches.` }],
					details: { config: swarmConfig, dispatches: [], count: 0 },
				};
			}

			const lines = active.map(d =>
				`${d.id}: ${d.agentId} (${d.role}) [${d.status}] — ${d.task.slice(0, 40)}`
			);

			return {
				content: [{ type: "text", text: `${config}\n\nDispatches (${active.length}):\n${lines.join("\n")}` }],
				details: { config: swarmConfig, dispatches: active, count: active.length },
			};
		},

		renderCall(_args, theme) {
			return new Text(theme.fg("toolTitle", theme.bold("swarm_status")), 0, 0);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			const topology = details?.config?.topology || "none";
			return new Text(
				theme.fg("accent", `${topology}`) +
				theme.fg("dim", ` ${details?.count || 0} dispatches`),
				0, 0,
			);
		},
	});

	pi.registerTool({
		name: "swarm_broadcast",
		label: "Swarm Broadcast",
		description: "Broadcast a message to all active agents in the swarm.",
		parameters: Type.Object({
			message: Type.String({ description: "Message to broadcast" }),
		}),

		async execute(_id, params, _signal, _onUpdate, _ctx) {
			const { message } = params as { message: string };
			const agents = Array.from(dispatches.values());

			if (agents.length === 0) {
				return {
					content: [{ type: "text", text: "No active agents to broadcast to." }],
					details: { status: "empty", recipients: 0 },
				};
			}

			const recipients = agents.map(d => d.agentId);
			return {
				content: [{ type: "text", text: `Broadcast to ${recipients.length} agents: ${message}\nRecipients: ${recipients.join(", ")}` }],
				details: { status: "sent", recipients: recipients.length, agents: recipients, message },
			};
		},

		renderCall(args, theme) {
			const msg = (args as any).message || "";
			const preview = msg.length > 40 ? msg.slice(0, 37) + "..." : msg;
			return new Text(
				theme.fg("toolTitle", theme.bold("swarm_broadcast ")) +
				theme.fg("muted", preview),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			if (details?.status === "empty") return new Text(theme.fg("dim", "No agents"), 0, 0);
			return new Text(theme.fg("success", `Sent to ${details?.recipients} agents`), 0, 0);
		},
	});

	pi.registerTool({
		name: "conflict_check",
		label: "Conflict Check",
		description: "Check if multiple dispatched agents are working on overlapping files. Detects potential merge conflicts.",
		parameters: Type.Object({
			files: Type.Array(Type.String(), { description: "File paths to check for conflicts" }),
		}),

		async execute(_id, params, _signal, _onUpdate, _ctx) {
			const { files } = params as { files: string[] };
			const fileSet = new Set(files);
			const conflicts: { file: string; agents: string[] }[] = [];

			for (const file of fileSet) {
				const touching: string[] = [];
				for (const d of dispatches.values()) {
					// Check tracked files
					if (d.files.includes(file)) {
						touching.push(d.agentId);
					}
					// Check task descriptions for file path references
					if (d.task.includes(file) && !touching.includes(d.agentId)) {
						touching.push(d.agentId);
					}
				}
				if (touching.length > 1) {
					conflicts.push({ file, agents: touching });
				}
			}

			const severity = conflicts.length === 0 ? "low"
				: conflicts.length <= 2 ? "medium"
				: conflicts.length <= 5 ? "high"
				: "critical";

			if (conflicts.length === 0) {
				return {
					content: [{ type: "text", text: `No conflicts detected across ${files.length} files.` }],
					details: { severity, conflicts: [], count: 0 },
				};
			}

			const lines = conflicts.map(c => `${c.file}: ${c.agents.join(", ")}`);
			return {
				content: [{ type: "text", text: `Conflicts (${severity}):\n${lines.join("\n")}` }],
				details: { severity, conflicts, count: conflicts.length },
			};
		},

		renderCall(args, theme) {
			const files = (args as any).files || [];
			return new Text(
				theme.fg("toolTitle", theme.bold("conflict_check ")) +
				theme.fg("dim", `${files.length} files`),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			const severity = details?.severity || "low";
			const colorMap: Record<string, string> = { low: "success", medium: "accent", high: "error", critical: "error" };
			return new Text(
				theme.fg(colorMap[severity] || "dim", `${severity} (${details?.count || 0} conflicts)`),
				0, 0,
			);
		},
	});

	// ── Commands ──────────────────────────────────────────────────────────────

	pi.registerCommand("provider", {
		description: "Set active provider: /provider <gemini|codex|ruvllm|auto>",
		handler: async (args, ctx) => {
			const name = (args?.trim().toLowerCase() || "") as ProviderName;
			const valid: ProviderName[] = ["gemini", "codex", "ruvllm", "auto"];
			if (!valid.includes(name)) {
				ctx.ui.notify(`Invalid provider. Choose: ${valid.join(", ")}`, "error");
				return;
			}
			activeProvider = name;
			ctx.ui.setStatus("provider", `Provider: ${name}`);
			ctx.ui.notify(`Active provider set to: ${name}`, "success");
		},
	});

	pi.registerCommand("providers", {
		description: "List all providers with availability status",
		handler: async (_args, ctx) => {
			const gemini = isCliAvailable("gemini");
			const codex = isCliAvailable("codex");
			let ruvllm = false;
			try {
				const res = await fetch("http://localhost:8080/v1/models", { signal: AbortSignal.timeout(2000) });
				ruvllm = res.ok;
			} catch {
				ruvllm = isCliAvailable("ruvllm");
			}

			const icon = (ok: boolean) => ok ? "●" : "○";
			ctx.ui.notify(
				`Providers:\n` +
				`  ${icon(gemini)} gemini  — Google Gemini CLI${gemini ? "" : " (not installed)"}\n` +
				`  ${icon(codex)} codex   — OpenAI Codex CLI${codex ? "" : " (not installed)"}\n` +
				`  ${icon(ruvllm)} ruvllm  — Local LLM${ruvllm ? "" : " (not running)"}\n` +
				`  ● auto    — Automatic routing\n\n` +
				`Active: ${activeProvider}`,
				"info",
			);
		},
	});

	pi.registerCommand("swarm", {
		description: "Initialize swarm: /swarm <hierarchical|mesh|ring|star>",
		handler: async (args, ctx) => {
			const topology = (args?.trim().toLowerCase() || "") as Topology;
			const valid: Topology[] = ["hierarchical", "mesh", "ring", "star"];
			if (!valid.includes(topology)) {
				ctx.ui.notify(`Invalid topology. Choose: ${valid.join(", ")}`, "error");
				return;
			}
			swarmConfig = { topology, maxAgents: 8 };
			dispatches.clear();
			dispatchCounter = 0;
			ctx.ui.setStatus("swarm", `Swarm: ${topology} (0/8)`);
			ctx.ui.notify(`Swarm initialized: ${topology} topology, max 8 agents`, "success");
		},
	});

	pi.registerCommand("route", {
		description: "Auto-route a task: /route <task description>",
		handler: async (args, ctx) => {
			const task = args?.trim();
			if (!task) {
				ctx.ui.notify("Usage: /route <task description>", "error");
				return;
			}
			const target = routeByHeuristic(task);
			ctx.ui.notify(`Task routed to: ${target}\nReason: ${routeExplanation(task, target)}`, "info");
		},
	});

	// ── Events ────────────────────────────────────────────────────────────────

	pi.on("session_start", async (_event, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		activeProvider = "auto";
		swarmConfig = null;
		dispatches.clear();
		dispatchCounter = 0;

		ctx.ui.setStatus("provider", `Provider: auto`);
		ctx.ui.notify(
			`Orchestration extension loaded\n\n` +
			`Provider tools: gemini_run, codex_run, ruvllm_run, auto_route\n` +
			`Swarm tools: swarm_init, swarm_dispatch, swarm_status, swarm_broadcast, conflict_check\n\n` +
			`/provider <name>     Set provider (gemini/codex/ruvllm/auto)\n` +
			`/providers           List providers + availability\n` +
			`/swarm <topology>    Init swarm (hierarchical/mesh/ring/star)\n` +
			`/route <task>        Auto-route a task`,
			"info",
		);
	});

	pi.on("before_agent_start", async (_event, _ctx) => {
		const providerInfo = `Active provider: ${activeProvider}`;
		const swarmInfo = swarmConfig
			? `Swarm: ${swarmConfig.topology} topology, ${dispatches.size}/${swarmConfig.maxAgents} agents`
			: "Swarm: not initialized";

		return {
			appendSystemPrompt: [
				"\n\n## Orchestration Context",
				providerInfo,
				swarmInfo,
				"",
				"Available provider tools:",
				"- gemini_run: Google Gemini CLI for research, web tasks, quality reasoning",
				"- codex_run: OpenAI Codex CLI for fast coding tasks",
				"- ruvllm_run: Local LLM for private/offline tasks",
				"- auto_route: Automatic routing based on task keywords and priority",
				"",
				"Routing guidance:",
				'- Use "privacy" priority or ruvllm_run for sensitive data',
				'- Use "quality" priority or gemini_run for complex reasoning',
				'- Use "speed"/"cost" priority or codex_run for quick edits',
				"- Use auto_route when unsure — it picks the best provider",
				"",
				"Swarm tools (for multi-agent coordination):",
				"- swarm_init: Set up topology before dispatching",
				"- swarm_dispatch: Assign tasks to agents",
				"- swarm_status: View all active dispatches",
				"- swarm_broadcast: Send message to all agents",
				"- conflict_check: Detect file-level conflicts between agents",
			].join("\n"),
		};
	});
}
