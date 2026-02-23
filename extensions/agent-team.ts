/**
 * Agent Team — Dispatcher-only orchestrator with grid dashboard
 *
 * The primary Pi agent has NO codebase tools. It can ONLY delegate work
 * to specialist agents via the `dispatch_agent` tool. Each specialist
 * maintains its own Pi session for cross-invocation memory.
 *
 * Loads agent definitions from agents/*.md, .claude/agents/*.md, .pi/agents/*.md.
 * Teams are defined in .pi/agents/teams.yaml — on boot a select dialog lets
 * you pick which team to work with. Only team members are available for dispatch.
 *
 * Commands:
 *   /agents-team          — switch active team
 *   /agents-list          — list loaded agents
 *   /agents-grid N        — set column count (default 2)
 *
 * Usage: pi -e extensions/agent-team.ts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { Text, type AutocompleteItem, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { spawn } from "child_process";
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { join, resolve } from "path";
import { applyExtensionDefaults } from "./themeMap.ts";
import { VectorDB } from "@ruvector/rvf-node";

// ── Types ────────────────────────────────────────

interface AgentDef {
	name: string;
	description: string;
	tools: string;
	systemPrompt: string;
	file: string;
}

interface AgentState {
	def: AgentDef;
	status: "idle" | "running" | "done" | "error";
	task: string;
	toolCount: number;
	elapsed: number;
	lastWork: string;
	contextPct: number;
	sessionFile: string | null;
	runCount: number;
	timer?: ReturnType<typeof setInterval>;
}

// ── RVF Memory System ─────────────────────────────────────────────────────────

interface Pattern {
	id: string;
	task: string;
	input: string;
	output: string;
	reward: number;
	success: boolean;
	tokens: number;
	latency: number;
	timestamp: number;
	tags: string[];
	vector?: number[]; // unused in HNSW implementation, kept for API compatibility
}

const DIMENSION = 384; // RVF standard dimension

class RvfMemoryStore {
	private db: VectorDB;
	private patterns: Map<string, Pattern> = new Map();
	private tagsIndex: Map<string, Set<string>> = new Map();
	private dimension = DIMENSION;
	private loadPromise: Promise<void>;

	constructor(
		private namespace: string,
		private storageDir?: string
	) {
		this.db = VectorDB.withDimensions(this.dimension);
		this.loadPromise = this.loadFromDisk();
	}

	// Hash-based embedding (placeholder — upgrade to ruvllm when available)
	private computeEmbedding(text: string): Float32Array {
		const hash = this.simpleHash(text);
		const rng = this.seededRandom(hash);
		const vector = new Float32Array(this.dimension);
		for (let i = 0; i < this.dimension; i++) {
			vector[i] = rng() * 2 - 1;
		}
		const mag = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
		for (let i = 0; i < vector.length; i++) {
			vector[i] /= mag;
		}
		return vector;
	}

	private simpleHash(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = ((hash << 5) - hash) + str.charCodeAt(i);
			hash |= 0;
		}
		return Math.abs(hash);
	}

	private seededRandom(seed: number): () => number {
		let s = seed;
		return () => {
			s = (s * 1103515245 + 12345) & 0x7fffffff;
			return s / 0x7fffffff;
		};
	}

	async storePattern(pattern: Omit<Pattern, "id" | "vector" | "timestamp">): Promise<string> {
		await this.loadPromise;
		const id = `${this.namespace}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
		const fullPattern: Pattern = {
			...pattern,
			id,
			timestamp: Date.now(),
		};
		const vector = this.computeEmbedding(pattern.task + " " + pattern.input);
		await this.db.insert({ id, vector, metadata: fullPattern });
		this.patterns.set(id, fullPattern);
		for (const tag of pattern.tags) {
			if (!this.tagsIndex.has(tag)) {
				this.tagsIndex.set(tag, new Set());
			}
			this.tagsIndex.get(tag)!.add(id);
		}
		this.saveToDisk();
		return id;
	}

	async searchPatterns(query: string, k: number = 5, tags?: string[]): Promise<Pattern[]> {
		await this.loadPromise;
		const queryVector = this.computeEmbedding(query);
		if (tags && tags.length > 0) {
			// Search wider, then filter by tags
			const results = await this.db.search({ vector: queryVector, k: k * 10 });
			return results
				.map(r => r.metadata as Pattern)
				.filter(p => p && tags.some(tag => p.tags.includes(tag)))
				.slice(0, k);
		}
		const results = await this.db.search({ vector: queryVector, k });
		return results.map(r => r.metadata as Pattern).filter(Boolean);
	}

	async getPattern(id: string): Promise<Pattern | null> {
		await this.loadPromise;
		return this.patterns.get(id) || null;
	}

	async deletePattern(id: string): Promise<boolean> {
		await this.loadPromise;
		const pattern = this.patterns.get(id);
		if (!pattern) return false;
		for (const tag of pattern.tags) {
			this.tagsIndex.get(tag)?.delete(id);
		}
		this.patterns.delete(id);
		try { await this.db.delete(id); } catch {}
		this.saveToDisk();
		return true;
	}

	async getStats(): Promise<{ total: number; byTag: Record<string, number>; avgReward: number }> {
		await this.loadPromise;
		const byTag: Record<string, number> = {};
		let totalReward = 0;
		let count = 0;
		for (const pattern of this.patterns.values()) {
			totalReward += pattern.reward;
			count++;
			for (const tag of pattern.tags) {
				byTag[tag] = (byTag[tag] || 0) + 1;
			}
		}
		return {
			total: this.patterns.size,
			byTag,
			avgReward: count > 0 ? totalReward / count : 0,
		};
	}

	private storagePath(): string {
		return this.storageDir
			? join(this.storageDir, `${this.namespace}.json`)
			: join(".rvf", `${this.namespace}.json`);
	}

	private saveToDisk(): void {
		if (!this.storageDir) return;
		try {
			if (!existsSync(this.storageDir)) {
				mkdirSync(this.storageDir, { recursive: true });
			}
			writeFileSync(this.storagePath(), JSON.stringify(Array.from(this.patterns.values()), null, 2));
		} catch {}
	}

	private async loadFromDisk(): Promise<void> {
		if (!this.storageDir) return;
		try {
			const path = this.storagePath();
			if (!existsSync(path)) return;
			const data: Pattern[] = JSON.parse(readFileSync(path, "utf-8"));
			const inserts = data.map(p => {
				this.patterns.set(p.id, p);
				for (const tag of p.tags || []) {
					if (!this.tagsIndex.has(tag)) {
						this.tagsIndex.set(tag, new Set());
					}
					this.tagsIndex.get(tag)!.add(p.id);
				}
				const vector = this.computeEmbedding(p.task + " " + p.input);
				return this.db.insert({ id: p.id, vector, metadata: p });
			});
			await Promise.all(inserts);
		} catch {}
	}
}

// ── Display Name Helper ──────────────────────────

function displayName(name: string): string {
	return name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// ── Teams YAML Parser ────────────────────────────

function parseTeamsYaml(raw: string): Record<string, string[]> {
	const teams: Record<string, string[]> = {};
	let current: string | null = null;
	for (const line of raw.split("\n")) {
		const teamMatch = line.match(/^(\S[^:]*):$/);
		if (teamMatch) {
			current = teamMatch[1].trim();
			teams[current] = [];
			continue;
		}
		const itemMatch = line.match(/^\s+-\s+(.+)$/);
		if (itemMatch && current) {
			teams[current].push(itemMatch[1].trim());
		}
	}
	return teams;
}

// ── Frontmatter Parser ───────────────────────────

function parseAgentFile(filePath: string): AgentDef | null {
	try {
		const raw = readFileSync(filePath, "utf-8");
		const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
		if (!match) return null;

		const frontmatter: Record<string, string> = {};
		for (const line of match[1].split("\n")) {
			const idx = line.indexOf(":");
			if (idx > 0) {
				frontmatter[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
			}
		}

		if (!frontmatter.name) return null;

		return {
			name: frontmatter.name,
			description: frontmatter.description || "",
			tools: frontmatter.tools || "read,grep,find,ls",
			systemPrompt: match[2].trim(),
			file: filePath,
		};
	} catch {
		return null;
	}
}

function scanAgentDirs(cwd: string): AgentDef[] {
	const dirs = [
		join(cwd, "agents"),
		join(cwd, ".claude", "agents"),
		join(cwd, ".pi", "agents"),
	];

	const agents: AgentDef[] = [];
	const seen = new Set<string>();

	for (const dir of dirs) {
		if (!existsSync(dir)) continue;
		try {
			for (const file of readdirSync(dir)) {
				if (!file.endsWith(".md")) continue;
				const fullPath = resolve(dir, file);
				const def = parseAgentFile(fullPath);
				if (def && !seen.has(def.name.toLowerCase())) {
					seen.add(def.name.toLowerCase());
					agents.push(def);
				}
			}
		} catch {}
	}

	return agents;
}

// ── Extension ────────────────────────────────────

export default function (pi: ExtensionAPI) {
	const agentStates: Map<string, AgentState> = new Map();
	let allAgentDefs: AgentDef[] = [];
	let teams: Record<string, string[]> = {};
	let activeTeamName = "";
	let gridCols = 2;
	let widgetCtx: any;
	let sessionDir = "";
	let contextWindow = 0;

	function loadAgents(cwd: string) {
		// Create session storage dir
		sessionDir = join(cwd, ".pi", "agent-sessions");
		if (!existsSync(sessionDir)) {
			mkdirSync(sessionDir, { recursive: true });
		}

		// Load all agent definitions
		allAgentDefs = scanAgentDirs(cwd);

		// Load teams from .pi/agents/teams.yaml
		const teamsPath = join(cwd, ".pi", "agents", "teams.yaml");
		if (existsSync(teamsPath)) {
			try {
				teams = parseTeamsYaml(readFileSync(teamsPath, "utf-8"));
			} catch {
				teams = {};
			}
		} else {
			teams = {};
		}

		// If no teams defined, create a default "all" team
		if (Object.keys(teams).length === 0) {
			teams = { all: allAgentDefs.map(d => d.name) };
		}
	}

	function activateTeam(teamName: string) {
		activeTeamName = teamName;
		const members = teams[teamName] || [];
		const defsByName = new Map(allAgentDefs.map(d => [d.name.toLowerCase(), d]));

		agentStates.clear();
		for (const member of members) {
			const def = defsByName.get(member.toLowerCase());
			if (!def) continue;
			const key = def.name.toLowerCase().replace(/\s+/g, "-");
			const sessionFile = join(sessionDir, `${key}.json`);
			agentStates.set(def.name.toLowerCase(), {
				def,
				status: "idle",
				task: "",
				toolCount: 0,
				elapsed: 0,
				lastWork: "",
				contextPct: 0,
				sessionFile: existsSync(sessionFile) ? sessionFile : null,
				runCount: 0,
			});
		}

		// Auto-size grid columns based on team size
		const size = agentStates.size;
		gridCols = size <= 3 ? size : size === 4 ? 2 : 3;
	}

	// ── Grid Rendering ───────────────────────────

	function renderCard(state: AgentState, colWidth: number, theme: any): string[] {
		const w = colWidth - 2;
		const truncate = (s: string, max: number) => s.length > max ? s.slice(0, max - 3) + "..." : s;

		const statusColor = state.status === "idle" ? "dim"
			: state.status === "running" ? "accent"
			: state.status === "done" ? "success" : "error";
		const statusIcon = state.status === "idle" ? "○"
			: state.status === "running" ? "●"
			: state.status === "done" ? "✓" : "✗";

		const name = displayName(state.def.name);
		const nameStr = theme.fg("accent", theme.bold(truncate(name, w)));
		const nameVisible = Math.min(name.length, w);

		const statusStr = `${statusIcon} ${state.status}`;
		const timeStr = state.status !== "idle" ? ` ${Math.round(state.elapsed / 1000)}s` : "";
		const statusLine = theme.fg(statusColor, statusStr + timeStr);
		const statusVisible = statusStr.length + timeStr.length;

		// Context bar: 5 blocks + percent
		const filled = Math.ceil(state.contextPct / 20);
		const bar = "#".repeat(filled) + "-".repeat(5 - filled);
		const ctxStr = `[${bar}] ${Math.ceil(state.contextPct)}%`;
		const ctxLine = theme.fg("dim", ctxStr);
		const ctxVisible = ctxStr.length;

		const workRaw = state.task
			? (state.lastWork || state.task)
			: state.def.description;
		const workText = truncate(workRaw, Math.min(50, w - 1));
		const workLine = theme.fg("muted", workText);
		const workVisible = workText.length;

		const top = "┌" + "─".repeat(w) + "┐";
		const bot = "└" + "─".repeat(w) + "┘";
		const border = (content: string, visLen: number) =>
			theme.fg("dim", "│") + content + " ".repeat(Math.max(0, w - visLen)) + theme.fg("dim", "│");

		return [
			theme.fg("dim", top),
			border(" " + nameStr, 1 + nameVisible),
			border(" " + statusLine, 1 + statusVisible),
			border(" " + ctxLine, 1 + ctxVisible),
			border(" " + workLine, 1 + workVisible),
			theme.fg("dim", bot),
		];
	}

	function updateWidget() {
		if (!widgetCtx) return;

		widgetCtx.ui.setWidget("agent-team", (_tui: any, theme: any) => {
			const text = new Text("", 0, 1);

			return {
				render(width: number): string[] {
					if (agentStates.size === 0) {
						text.setText(theme.fg("dim", "No agents found. Add .md files to agents/"));
						return text.render(width);
					}

					const cols = Math.min(gridCols, agentStates.size);
					const gap = 1;
					const colWidth = Math.floor((width - gap * (cols - 1)) / cols);
					const agents = Array.from(agentStates.values());
					const rows: string[][] = [];

					for (let i = 0; i < agents.length; i += cols) {
						const rowAgents = agents.slice(i, i + cols);
						const cards = rowAgents.map(a => renderCard(a, colWidth, theme));

						while (cards.length < cols) {
							cards.push(Array(6).fill(" ".repeat(colWidth)));
						}

						const cardHeight = cards[0].length;
						for (let line = 0; line < cardHeight; line++) {
							rows.push(cards.map(card => card[line] || ""));
						}
					}

					const output = rows.map(cols => cols.join(" ".repeat(gap)));
					text.setText(output.join("\n"));
					return text.render(width);
				},
				invalidate() {
					text.invalidate();
				},
			};
		});
	}

	// ── Dispatch Agent (returns Promise) ─────────

	function dispatchAgent(
		agentName: string,
		task: string,
		ctx: any,
	): Promise<{ output: string; exitCode: number; elapsed: number }> {
		const key = agentName.toLowerCase();
		const state = agentStates.get(key);
		if (!state) {
			return Promise.resolve({
				output: `Agent "${agentName}" not found. Available: ${Array.from(agentStates.values()).map(s => displayName(s.def.name)).join(", ")}`,
				exitCode: 1,
				elapsed: 0,
			});
		}

		if (state.status === "running") {
			return Promise.resolve({
				output: `Agent "${displayName(state.def.name)}" is already running. Wait for it to finish.`,
				exitCode: 1,
				elapsed: 0,
			});
		}

		state.status = "running";
		state.task = task;
		state.toolCount = 0;
		state.elapsed = 0;
		state.lastWork = "";
		state.runCount++;
		updateWidget();

		const startTime = Date.now();
		state.timer = setInterval(() => {
			state.elapsed = Date.now() - startTime;
			updateWidget();
		}, 1000);

		const model = ctx.model
			? `${ctx.model.provider}/${ctx.model.id}`
			: "openrouter/google/gemini-3-flash-preview";

		// Session file for this agent
		const agentKey = state.def.name.toLowerCase().replace(/\s+/g, "-");
		const agentSessionFile = join(sessionDir, `${agentKey}.json`);

		// Build args — first run creates session, subsequent runs resume
		const args = [
			"--mode", "json",
			"-p",
			"--no-extensions",
			"--model", model,
			"--tools", state.def.tools,
			"--thinking", "off",
			"--append-system-prompt", state.def.systemPrompt,
			"--session", agentSessionFile,
		];

		// Continue existing session if we have one
		if (state.sessionFile) {
			args.push("-c");
		}

		args.push(task);

		const textChunks: string[] = [];

		return new Promise((resolve) => {
			const proc = spawn("pi", args, {
				stdio: ["ignore", "pipe", "pipe"],
				env: { ...process.env },
			});

			let buffer = "";

			proc.stdout!.setEncoding("utf-8");
			proc.stdout!.on("data", (chunk: string) => {
				buffer += chunk;
				const lines = buffer.split("\n");
				buffer = lines.pop() || "";
				for (const line of lines) {
					if (!line.trim()) continue;
					try {
						const event = JSON.parse(line);
						if (event.type === "message_update") {
							const delta = event.assistantMessageEvent;
							if (delta?.type === "text_delta") {
								textChunks.push(delta.delta || "");
								const full = textChunks.join("");
								const last = full.split("\n").filter((l: string) => l.trim()).pop() || "";
								state.lastWork = last;
								updateWidget();
							}
						} else if (event.type === "tool_execution_start") {
							state.toolCount++;
							updateWidget();
						} else if (event.type === "message_end") {
							const msg = event.message;
							if (msg?.usage && contextWindow > 0) {
								state.contextPct = ((msg.usage.input || 0) / contextWindow) * 100;
								updateWidget();
							}
						} else if (event.type === "agent_end") {
							const msgs = event.messages || [];
							const last = [...msgs].reverse().find((m: any) => m.role === "assistant");
							if (last?.usage && contextWindow > 0) {
								state.contextPct = ((last.usage.input || 0) / contextWindow) * 100;
								updateWidget();
							}
						}
					} catch {}
				}
			});

			proc.stderr!.setEncoding("utf-8");
			proc.stderr!.on("data", () => {});

			proc.on("close", (code) => {
				if (buffer.trim()) {
					try {
						const event = JSON.parse(buffer);
						if (event.type === "message_update") {
							const delta = event.assistantMessageEvent;
							if (delta?.type === "text_delta") textChunks.push(delta.delta || "");
						}
					} catch {}
				}

				clearInterval(state.timer);
				state.elapsed = Date.now() - startTime;
				state.status = code === 0 ? "done" : "error";

				// Mark session file as available for resume
				if (code === 0) {
					state.sessionFile = agentSessionFile;
				}

				const full = textChunks.join("");
				state.lastWork = full.split("\n").filter((l: string) => l.trim()).pop() || "";
				updateWidget();

				ctx.ui.notify(
					`${displayName(state.def.name)} ${state.status} in ${Math.round(state.elapsed / 1000)}s`,
					state.status === "done" ? "success" : "error"
				);

				resolve({
					output: full,
					exitCode: code ?? 1,
					elapsed: state.elapsed,
				});
			});

			proc.on("error", (err) => {
				clearInterval(state.timer);
				state.status = "error";
				state.lastWork = `Error: ${err.message}`;
				updateWidget();
				resolve({
					output: `Error spawning agent: ${err.message}`,
					exitCode: 1,
					elapsed: Date.now() - startTime,
				});
			});
		});
	}

	// ── dispatch_agent Tool (registered at top level) ──

	pi.registerTool({
		name: "dispatch_agent",
		label: "Dispatch Agent",
		description: "Dispatch a task to a specialist agent. The agent will execute the task and return the result. Use the system prompt to see available agent names.",
		parameters: Type.Object({
			agent: Type.String({ description: "Agent name (case-insensitive)" }),
			task: Type.String({ description: "Task description for the agent to execute" }),
		}),

		async execute(_toolCallId, params, _signal, onUpdate, ctx) {
			const { agent, task } = params as { agent: string; task: string };

			try {
				if (onUpdate) {
					onUpdate({
						content: [{ type: "text", text: `Dispatching to ${agent}...` }],
						details: { agent, task, status: "dispatching" },
					});
				}

				const result = await dispatchAgent(agent, task, ctx);

				const truncated = result.output.length > 8000
					? result.output.slice(0, 8000) + "\n\n... [truncated]"
					: result.output;

				const status = result.exitCode === 0 ? "done" : "error";
				const summary = `[${agent}] ${status} in ${Math.round(result.elapsed / 1000)}s`;

				return {
					content: [{ type: "text", text: `${summary}\n\n${truncated}` }],
					details: {
						agent,
						task,
						status,
						elapsed: result.elapsed,
						exitCode: result.exitCode,
						fullOutput: result.output,
					},
				};
			} catch (err: any) {
				return {
					content: [{ type: "text", text: `Error dispatching to ${agent}: ${err?.message || err}` }],
					details: { agent, task, status: "error", elapsed: 0, exitCode: 1, fullOutput: "" },
				};
			}
		},

		renderCall(args, theme) {
			const agentName = (args as any).agent || "?";
			const task = (args as any).task || "";
			const preview = task.length > 60 ? task.slice(0, 57) + "..." : task;
			return new Text(
				theme.fg("toolTitle", theme.bold("dispatch_agent ")) +
				theme.fg("accent", agentName) +
				theme.fg("dim", " — ") +
				theme.fg("muted", preview),
				0, 0,
			);
		},

		renderResult(result, options, theme) {
			const details = result.details as any;
			if (!details) {
				const text = result.content[0];
				return new Text(text?.type === "text" ? text.text : "", 0, 0);
			}

			// Streaming/partial result while agent is still running
			if (options.isPartial || details.status === "dispatching") {
				return new Text(
					theme.fg("accent", `● ${details.agent || "?"}`) +
					theme.fg("dim", " working..."),
					0, 0,
				);
			}

			const icon = details.status === "done" ? "✓" : "✗";
			const color = details.status === "done" ? "success" : "error";
			const elapsed = typeof details.elapsed === "number" ? Math.round(details.elapsed / 1000) : 0;
			const header = theme.fg(color, `${icon} ${details.agent}`) +
				theme.fg("dim", ` ${elapsed}s`);

			if (options.expanded && details.fullOutput) {
				const output = details.fullOutput.length > 4000
					? details.fullOutput.slice(0, 4000) + "\n... [truncated]"
					: details.fullOutput;
				return new Text(header + "\n" + theme.fg("muted", output), 0, 0);
			}

			return new Text(header, 0, 0);
		},
	});

	// ── RVF Memory Store Instance ────────────────

	let memoryStore: RvfMemoryStore | null = null;

	function getMemoryStore(cwd: string): RvfMemoryStore {
		if (!memoryStore) {
			const storageDir = join(cwd, ".rvf");
			memoryStore = new RvfMemoryStore("patterns", storageDir);
		}
		return memoryStore;
	}

	// ── Memory Tools ──────────────────────────────

	pi.registerTool({
		name: "store_pattern",
		label: "Store Pattern",
		description: "Store a successful task pattern in memory for future retrieval",
		parameters: Type.Object({
			task: Type.String({ description: "Task description" }),
			input: Type.String({ description: "Input that led to success" }),
			output: Type.String({ description: "The output/result" }),
			reward: Type.Number({ description: "Reward score (0-1)" }),
			success: Type.Boolean({ description: "Whether the task succeeded" }),
			tokens: Type.Number({ description: "Tokens used" }),
			latency: Type.Number({ description: "Latency in ms" }),
			tags: Type.Array(Type.String(), { description: "Tags for categorization" }),
		}),

		async execute(_toolCallId, params, _signal, onUpdate, ctx) {
			const { task, input, output, reward, success, tokens, latency, tags } = params as any;
			const store = getMemoryStore(ctx.cwd);

			try {
				const id = await store.storePattern({
					task,
					input,
					output,
					reward,
					success,
					tokens,
					latency,
					tags,
				});

				return {
					content: [{ type: "text", text: `Pattern stored: ${id}` }],
					details: { id, status: "stored" },
				};
			} catch (err: any) {
				return {
					content: [{ type: "text", text: `Error storing pattern: ${err?.message || err}` }],
					details: { status: "error" },
				};
			}
		},

		renderCall(args, theme) {
			const task = (args as any).task || "";
			const preview = task.length > 40 ? task.slice(0, 37) + "..." : task;
			return new Text(
				theme.fg("toolTitle", theme.bold("store_pattern ")) +
				theme.fg("muted", preview),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const text = result.content[0];
			return new Text(
				theme.fg("success", text?.type === "text" ? text.text : ""),
				0, 0,
			);
		},
	});

	pi.registerTool({
		name: "search_patterns",
		label: "Search Patterns",
		description: "Search stored patterns by similarity",
		parameters: Type.Object({
			query: Type.String({ description: "Search query" }),
			k: Type.Number({ description: "Number of results (default 5)" }),
			tags: Type.Optional(Type.Array(Type.String(), { description: "Filter by tags" })),
		}),

		async execute(_toolCallId, params, _signal, onUpdate, ctx) {
			const { query, k = 5, tags } = params as any;
			const store = getMemoryStore(ctx.cwd);

			try {
				const patterns = await store.searchPatterns(query, k, tags);

				if (patterns.length === 0) {
					return {
						content: [{ type: "text", text: "No patterns found" }],
						details: { patterns: [], count: 0 },
					};
				}

				const results = patterns.map(p => ({
					id: p.id,
					task: p.task,
					success: p.success,
					reward: p.reward,
					timestamp: p.timestamp,
				}));

				return {
					content: [{
						type: "text",
						text: `Found ${patterns.length} patterns:\n${results.map(r => `- ${r.task.slice(0, 50)}... (${r.success ? "✓" : "✗"})`).join("\n")}`,
					}],
					details: { patterns: results, count: patterns.length },
				};
			} catch (err: any) {
				return {
					content: [{ type: "text", text: `Error searching patterns: ${err?.message || err}` }],
					details: { status: "error" },
				};
			}
		},

		renderCall(args, theme) {
			const query = (args as any).query || "";
			const preview = query.length > 40 ? query.slice(0, 37) + "..." : query;
			return new Text(
				theme.fg("toolTitle", theme.bold("search_patterns ")) +
				theme.fg("muted", preview),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			if (!details || details.count === 0) {
				return new Text(theme.fg("dim", "No patterns found"), 0, 0);
			}
			return new Text(
				theme.fg("success", `${details.count} patterns found`),
				0, 0,
			);
		},
	});

	pi.registerTool({
		name: "get_pattern",
		label: "Get Pattern",
		description: "Retrieve a specific pattern by ID",
		parameters: Type.Object({
			id: Type.String({ description: "Pattern ID" }),
		}),

		async execute(_toolCallId, params, _signal, onUpdate, ctx) {
			const { id } = params as any;
			const store = getMemoryStore(ctx.cwd);

			try {
				const pattern = await store.getPattern(id);

				if (!pattern) {
					return {
						content: [{ type: "text", text: `Pattern not found: ${id}` }],
						details: { found: false },
					};
				}

				return {
					content: [{
						type: "text",
						text: `Task: ${pattern.task}\nInput: ${pattern.input}\nOutput: ${pattern.output.slice(0, 200)}...\nSuccess: ${pattern.success}, Reward: ${pattern.reward}`,
					}],
					details: { pattern, found: true },
				};
			} catch (err: any) {
				return {
					content: [{ type: "text", text: `Error retrieving pattern: ${err?.message || err}` }],
					details: { status: "error" },
				};
			}
		},

		renderCall(args, theme) {
			const id = (args as any).id || "";
			return new Text(
				theme.fg("toolTitle", theme.bold("get_pattern ")) +
				theme.fg("accent", id.slice(0, 20)),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			if (!details?.found) {
				return new Text(theme.fg("error", "Pattern not found"), 0, 0);
			}
			return new Text(theme.fg("success", "Pattern retrieved"), 0, 0);
		},
	});

	// ── Swarm Tools ───────────────────────────────

	pi.registerTool({
		name: "swarm_status",
		label: "Swarm Status",
		description: "Get status of all active swarm agents",
		parameters: Type.Object({}),

		async execute(_toolCallId, _params, _signal, onUpdate, _ctx) {
			const agents = Array.from(agentStates.values()).map(s => ({
				name: displayName(s.def.name),
				status: s.status,
				task: s.task || s.def.description,
				elapsed: s.elapsed,
				runCount: s.runCount,
			}));

			return {
				content: [{
					type: "text",
					text: agents.length === 0
						? "No agents in swarm"
						: `Active Agents (${agents.length}):\n${agents.map(a => `${a.name}: ${a.status}${a.task ? ` - ${a.task.slice(0, 30)}...` : ""}`).join("\n")}`,
				}],
				details: { agents, count: agents.length },
			};
		},

		renderCall(_args, theme) {
			return new Text(
				theme.fg("toolTitle", theme.bold("swarm_status")),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			return new Text(
				theme.fg("accent", `${details?.count || 0} agents`),
				0, 0,
			);
		},
	});

	pi.registerTool({
		name: "orchestrate",
		label: "Orchestrate",
		description: "Orchestrate multiple agents in parallel for a complex task",
		parameters: Type.Object({
			task: Type.String({ description: "Main task description" }),
			agents: Type.Array(Type.String(), { description: "Agent names to dispatch" }),
		}),

		async execute(_toolCallId, params, _signal, onUpdate, ctx) {
			const { task, agents } = params as any;

			if (!agents || agents.length === 0) {
				return {
					content: [{ type: "text", text: "No agents specified for orchestration" }],
					details: { status: "error" },
				};
			}

			// Dispatch all agents in parallel
			const results = await Promise.all(
				agents.map(agent => dispatchAgent(agent, task, ctx))
			);

			const summary = results.map((r, i) => ({
				agent: agents[i],
				success: r.exitCode === 0,
				elapsed: r.elapsed,
			}));

			return {
				content: [{
					type: "text",
					text: `Orchestrated ${agents.length} agents:\n${summary.map(s => `${s.agent}: ${s.success ? "✓" : "✗"} (${Math.round(s.elapsed / 1000)}s)`).join("\n")}`,
				}],
				details: { summary, status: "complete" },
			};
		},

		renderCall(args, theme) {
			const agents = (args as any).agents || [];
			return new Text(
				theme.fg("toolTitle", theme.bold("orchestrate ")) +
				theme.fg("accent", agents.join(", ")),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			const successCount = details?.summary?.filter((s: any) => s.success).length || 0;
			const total = details?.summary?.length || 0;
			const icon = successCount === total ? "✓" : successCount > 0 ? "◐" : "✗";
			const color = successCount === total ? "success" : successCount > 0 ? "accent" : "error";

			return new Text(theme.fg(color, `${icon} ${successCount}/${total} agents`), 0, 0);
		},
	});

	// ── Commands ─────────────────────────────────

	pi.registerCommand("agents-team", {
		description: "Select a team to work with",
		handler: async (_args, ctx) => {
			widgetCtx = ctx;
			const teamNames = Object.keys(teams);
			if (teamNames.length === 0) {
				ctx.ui.notify("No teams defined in .pi/agents/teams.yaml", "warning");
				return;
			}

			const options = teamNames.map(name => {
				const members = teams[name].map(m => displayName(m));
				return `${name} — ${members.join(", ")}`;
			});

			const choice = await ctx.ui.select("Select Team", options);
			if (choice === undefined) return;

			const idx = options.indexOf(choice);
			const name = teamNames[idx];
			activateTeam(name);
			updateWidget();
			ctx.ui.setStatus("agent-team", `Team: ${name} (${agentStates.size})`);
			ctx.ui.notify(`Team: ${name} — ${Array.from(agentStates.values()).map(s => displayName(s.def.name)).join(", ")}`, "info");
		},
	});

	pi.registerCommand("agents-list", {
		description: "List all loaded agents",
		handler: async (_args, _ctx) => {
			widgetCtx = _ctx;
			const names = Array.from(agentStates.values())
				.map(s => {
					const session = s.sessionFile ? "resumed" : "new";
					return `${displayName(s.def.name)} (${s.status}, ${session}, runs: ${s.runCount}): ${s.def.description}`;
				})
				.join("\n");
			_ctx.ui.notify(names || "No agents loaded", "info");
		},
	});

	pi.registerCommand("agents-grid", {
		description: "Set grid columns: /agents-grid <1-6>",
		getArgumentCompletions: (prefix: string): AutocompleteItem[] | null => {
			const items = ["1", "2", "3", "4", "5", "6"].map(n => ({
				value: n,
				label: `${n} columns`,
			}));
			const filtered = items.filter(i => i.value.startsWith(prefix));
			return filtered.length > 0 ? filtered : items;
		},
		handler: async (args, _ctx) => {
			widgetCtx = _ctx;
			const n = parseInt(args?.trim() || "", 10);
			if (n >= 1 && n <= 6) {
				gridCols = n;
				_ctx.ui.notify(`Grid set to ${gridCols} columns`, "info");
				updateWidget();
			} else {
				_ctx.ui.notify("Usage: /agents-grid <1-6>", "error");
			}
		},
	});

	pi.registerCommand("memory-stats", {
		description: "Show memory pattern statistics",
		handler: async (_args, _ctx) => {
			const store = getMemoryStore(_ctx.cwd);
			const stats = await store.getStats();

			_ctx.ui.notify(
				`Memory Stats:\n` +
				`- Total patterns: ${stats.total}\n` +
				`- Average reward: ${stats.avgReward.toFixed(2)}\n` +
				`- Tags: ${Object.entries(stats.byTag).map(([k, v]) => `${k}: ${v}`).join(", ")}`,
				"info",
			);
		},
	});

	pi.registerCommand("team", {
		description: "Select a team to work with (shorthand for /agents-team)",
		handler: async (_args, _ctx) => {
			// Trigger the same flow as agents-team
			const teamNames = Object.keys(teams);
			if (teamNames.length === 0) {
				_ctx.ui.notify("No teams defined in .pi/agents/teams.yaml", "warning");
				return;
			}

			const options = teamNames.map(name => {
				const members = teams[name].map(m => displayName(m));
				return `${name} — ${members.join(", ")}`;
			});

			const choice = await _ctx.ui.select("Select Team", options);
			if (choice === undefined) return;

			const idx = options.indexOf(choice);
			const name = teamNames[idx];
			activateTeam(name);
			updateWidget();
			_ctx.ui.setStatus("agent-team", `Team: ${name} (${agentStates.size})`);
			_ctx.ui.notify(`Team: ${name} — ${Array.from(agentStates.values()).map(s => displayName(s.def.name)).join(", ")}`, "info");
		},
	});

	// ── System Prompt Override ───────────────────

	pi.on("before_agent_start", async (_event, _ctx) => {
		// Build dynamic agent catalog from active team only
		const agentCatalog = Array.from(agentStates.values())
			.map(s => `### ${displayName(s.def.name)}\n**Dispatch as:** \`${s.def.name}\`\n${s.def.description}\n**Tools:** ${s.def.tools}`)
			.join("\n\n");

		const teamMembers = Array.from(agentStates.values()).map(s => displayName(s.def.name)).join(", ");

		return {
			systemPrompt: `You are a dispatcher agent. You coordinate specialist agents to accomplish tasks.
You do NOT have direct access to the codebase. You MUST delegate all work through
agents using the dispatch_agent tool.

## Active Team: ${activeTeamName}
Members: ${teamMembers}
You can ONLY dispatch to agents listed below. Do not attempt to dispatch to agents outside this team.

## How to Work
- Analyze the user's request and break it into clear sub-tasks
- Choose the right agent(s) for each sub-task
- Dispatch tasks using the dispatch_agent tool
- Review results and dispatch follow-up agents if needed
- If a task fails, try a different agent or adjust the task description
- Summarize the outcome for the user

## Memory Tools (for learning from experience)
- **store_pattern**: Store successful task patterns for future retrieval
  - Use after successful agent dispatches to learn from success
  - Tags help categorize: "auth", "api", "refactor", "bugfix", etc.
- **search_patterns**: Find similar past tasks
  - Use before complex tasks to find relevant patterns
  - Retrieves top-k most similar successful approaches
- **get_pattern**: Retrieve full pattern details by ID

## Swarm Tools
- **swarm_status**: View all active agents and their status
- **orchestrate**: Dispatch multiple agents in parallel for complex tasks
  - Useful for parallel sub-tasks that don't depend on each other

## Rules
- NEVER try to read, write, or execute code directly — you have no such tools
- ALWAYS use dispatch_agent to get work done
- You can chain agents: use scout to explore, then builder to implement
- You can dispatch the same agent multiple times with different tasks
- Keep tasks focused — one clear objective per dispatch
- Use memory tools to learn from successful patterns

## Agents

${agentCatalog}`,
		};
	});

	// ── Session Start ────────────────────────────

	pi.on("session_start", async (_event, _ctx) => {
		applyExtensionDefaults(import.meta.url, _ctx);
		// Clear widgets from previous session
		if (widgetCtx) {
			widgetCtx.ui.setWidget("agent-team", undefined);
		}
		widgetCtx = _ctx;
		contextWindow = _ctx.model?.contextWindow || 0;

		// Initialize memory store
		getMemoryStore(_ctx.cwd);

		// Wipe old agent session files so subagents start fresh
		const sessDir = join(_ctx.cwd, ".pi", "agent-sessions");
		if (existsSync(sessDir)) {
			for (const f of readdirSync(sessDir)) {
				if (f.endsWith(".json")) {
					try { unlinkSync(join(sessDir, f)); } catch {}
				}
			}
		}

		loadAgents(_ctx.cwd);

		// Default to first team — use /agents-team to switch
		const teamNames = Object.keys(teams);
		if (teamNames.length > 0) {
			activateTeam(teamNames[0]);
		}

		// Lock down to dispatcher + memory + swarm tools (tools registered at top level)
		pi.setActiveTools([
			"dispatch_agent",
			"store_pattern",
			"search_patterns",
			"get_pattern",
			"swarm_status",
			"orchestrate",
		]);

		_ctx.ui.setStatus("agent-team", `Team: ${activeTeamName} (${agentStates.size})`);
		const members = Array.from(agentStates.values()).map(s => displayName(s.def.name)).join(", ");
		_ctx.ui.notify(
			`Team: ${activeTeamName} (${members})\n` +
			`Team sets loaded from: .pi/agents/teams.yaml\n\n` +
			`/team               Select a team\n` +
			`/agents-team        Select a team (alias)\n` +
			`/agents-list        List active agents and status\n` +
			`/agents-grid <1-6>  Set grid column count\n` +
			`/memory-stats       Show pattern memory stats\n\n` +
			`Tools: dispatch_agent, store_pattern, search_patterns, swarm_status, orchestrate`,
			"info",
		);
		updateWidget();

		// Footer: model | team | context bar
		_ctx.ui.setFooter((_tui, theme, _footerData) => ({
			dispose: () => {},
			invalidate() {},
			render(width: number): string[] {
				const model = _ctx.model?.id || "no-model";
				const usage = _ctx.getContextUsage();
				const pct = usage ? usage.percent : 0;
				const filled = Math.round(pct / 10);
				const bar = "#".repeat(filled) + "-".repeat(10 - filled);

				const left = theme.fg("dim", ` ${model}`) +
					theme.fg("muted", " · ") +
					theme.fg("accent", activeTeamName);
				const right = theme.fg("dim", `[${bar}] ${Math.round(pct)}% `);
				const pad = " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(right)));

				return [truncateToWidth(left + pad + right, width)];
			},
		}));
	});
}
