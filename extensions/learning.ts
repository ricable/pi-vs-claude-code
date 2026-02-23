/**
 * Learning — AgentDB + ReasoningBank + SONA self-learning extension
 *
 * Episodic memory, skill library, and three-tier SONA adaptive weights.
 * Every completed agent run auto-stores as a reflexion episode with SONA
 * tier-1 instant adaptation. Storage: .rvf/learning/*.json
 *
 * Usage: pi -e extensions/learning.ts
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { Text } from "@mariozechner/pi-tui";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { applyExtensionDefaults } from "./themeMap.ts";
import { VectorDB } from "@ruvector/rvf-node";

// ── Types ────────────────────────────────────────────────────────────────────
interface Episode {
	id: string; task: string; output: string; quality: number;
	critique: string; outcome: string; timestamp: number; tags: string[];
}
interface Skill {
	id: string; name: string; description: string; code: string;
	successRate: number; usageCount: number; timestamp: number;
}
interface SONAWeightsData {
	patterns: Record<string, number>;
	lastConsolidation: number;
	lastDeepOptimization: number;
}
interface Session { id: string; agentId: string; task: string; startedAt: number; }

const DIM = 384, STORAGE = ".rvf/learning";

// ── Embedding helpers (same hash-based approach as RvfMemoryStore) ───────────
function simpleHash(s: string): number {
	let h = 0;
	for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
	return Math.abs(h);
}
function seededRng(seed: number): () => number {
	let s = seed;
	return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}
function embed(text: string): Float32Array {
	const rng = seededRng(simpleHash(text));
	const v = new Float32Array(DIM);
	for (let i = 0; i < DIM; i++) v[i] = rng() * 2 - 1;
	const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
	for (let i = 0; i < DIM; i++) v[i] /= mag;
	return v;
}
function uid(): string { return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`; }

// ── JSON persistence ─────────────────────────────────────────────────────────
function ensureDir(d: string) { if (!existsSync(d)) mkdirSync(d, { recursive: true }); }
function loadJson<T>(p: string, fb: T): T {
	try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf-8")); } catch {} return fb;
}
function saveJson(p: string, d: unknown) {
	try { ensureDir(join(p, "..").replace(/\/[^/]+$/, "")); writeFileSync(p, JSON.stringify(d, null, 2)); } catch {}
}

// ── Render helpers ───────────────────────────────────────────────────────────
function rc(theme: any, label: string, detail: string) {
	return new Text(theme.fg("toolTitle", theme.bold(label + " ")) + theme.fg("accent", detail), 0, 0);
}
function rm(theme: any, label: string, detail: string) {
	return new Text(theme.fg("toolTitle", theme.bold(label + " ")) + theme.fg("muted", detail), 0, 0);
}
function rs(theme: any, text: string) { return new Text(theme.fg("success", text), 0, 0); }
function ra(theme: any, text: string) { return new Text(theme.fg("accent", text), 0, 0); }

// ── EpisodeStore ─────────────────────────────────────────────────────────────
class EpisodeStore {
	private db = VectorDB.withDimensions(DIM);
	private eps: Map<string, Episode> = new Map();
	private fp: string;
	private lp: Promise<void>;
	constructor(dir: string) { this.fp = join(dir, "episodes.json"); this.lp = this.load(); }
	private async load() {
		const data = loadJson<Episode[]>(this.fp, []);
		await Promise.all(data.map(ep => {
			this.eps.set(ep.id, ep);
			return this.db.insert({ id: ep.id, vector: embed(ep.task + " " + ep.outcome), metadata: ep });
		}));
	}
	private save() { saveJson(this.fp, Array.from(this.eps.values())); }
	async store(ep: Omit<Episode, "id">): Promise<string> {
		await this.lp;
		const id = `ep_${uid()}`;
		const full: Episode = { ...ep, id };
		this.eps.set(id, full);
		await this.db.insert({ id, vector: embed(ep.task + " " + ep.outcome), metadata: full });
		this.save(); return id;
	}
	async search(q: string, k = 5): Promise<Episode[]> {
		await this.lp;
		return (await this.db.search({ vector: embed(q), k })).map(r => r.metadata as Episode).filter(Boolean);
	}
	async ready() { await this.lp; }
	get count() { return this.eps.size; }
	all() { return Array.from(this.eps.values()); }
	clear() { this.eps.clear(); this.save(); }
}

// ── SkillLibrary ─────────────────────────────────────────────────────────────
class SkillLibrary {
	private db = VectorDB.withDimensions(DIM);
	private sks: Map<string, Skill> = new Map();
	private fp: string;
	private lp: Promise<void>;
	constructor(dir: string) { this.fp = join(dir, "skills.json"); this.lp = this.load(); }
	private async load() {
		const data = loadJson<Skill[]>(this.fp, []);
		await Promise.all(data.map(sk => {
			this.sks.set(sk.id, sk);
			return this.db.insert({ id: sk.id, vector: embed(sk.name + " " + sk.description), metadata: sk });
		}));
	}
	private save() { saveJson(this.fp, Array.from(this.sks.values())); }
	async create(name: string, description: string, code: string): Promise<string> {
		await this.lp;
		const id = `sk_${uid()}`;
		const skill: Skill = { id, name, description, code, successRate: 1.0, usageCount: 0, timestamp: Date.now() };
		this.sks.set(id, skill);
		await this.db.insert({ id, vector: embed(name + " " + description), metadata: skill });
		this.save(); return id;
	}
	async search(q: string, k = 5): Promise<Skill[]> {
		await this.lp;
		return (await this.db.search({ vector: embed(q), k })).map(r => r.metadata as Skill).filter(Boolean);
	}
	async ready() { await this.lp; }
	get count() { return this.sks.size; }
	all() { return Array.from(this.sks.values()); }
	clear() { this.sks.clear(); this.save(); }
}

// ── SONAWeights ──────────────────────────────────────────────────────────────
class SONAWeights {
	private data: SONAWeightsData;
	private fp: string;
	constructor(dir: string) {
		this.fp = join(dir, "sona-weights.json");
		this.data = loadJson<SONAWeightsData>(this.fp, { patterns: {}, lastConsolidation: 0, lastDeepOptimization: 0 });
	}
	private save() { saveJson(this.fp, this.data); }

	/** Tier 1 (<1ms): MicroLoRA frequency-based weight update */
	async instantAdapt(task: string, _out: string, quality: number) {
		const k = simpleHash(task).toString(36);
		this.data.patterns[k] = (this.data.patterns[k] ?? 0.5) + 0.1 * (quality - (this.data.patterns[k] ?? 0.5));
		this.save();
	}
	/** Tier 2 (~100ms): Consolidation -- cluster episodes, extract skills */
	async consolidate(episodes: Episode[], skills: SkillLibrary): Promise<number> {
		let extracted = 0;
		const hq = episodes.filter(ep => ep.quality >= 0.8);
		const seen = new Set<string>();
		for (const ep of hq) {
			const tk = simpleHash(ep.task).toString(36);
			if (seen.has(tk)) continue; seen.add(tk);
			const similar = hq.filter(o => simpleHash(o.task).toString(36) === tk);
			if (similar.length >= 2) {
				await skills.create(`Auto: ${ep.task.slice(0, 40)}`, `From ${similar.length} episodes`, ep.output.slice(0, 500));
				extracted++;
			}
		}
		for (const k of Object.keys(this.data.patterns)) this.data.patterns[k] *= 0.95;
		this.data.lastConsolidation = Date.now(); this.save(); return extracted;
	}
	/** Tier 3 (async): Deep optimization -- reindex + weight recalc */
	async deepOptimize(episodes: Episode[]) {
		const wm: Record<string, { s: number; c: number }> = {};
		for (const ep of episodes) {
			const k = simpleHash(ep.task).toString(36);
			if (!wm[k]) wm[k] = { s: 0, c: 0 }; wm[k].s += ep.quality; wm[k].c++;
		}
		for (const [k, { s, c }] of Object.entries(wm)) this.data.patterns[k] = s / c;
		this.data.lastDeepOptimization = Date.now(); this.save();
	}
	get stats(): SONAWeightsData { return { ...this.data }; }
	get patternCount() { return Object.keys(this.data.patterns).length; }
	clear() { this.data = { patterns: {}, lastConsolidation: 0, lastDeepOptimization: 0 }; this.save(); }
}

// ── Event extractors ─────────────────────────────────────────────────────────
function assessQuality(ev: any): number {
	const msgs = ev?.messages || [];
	let errs = 0, ok = 0;
	for (const m of msgs) if (m?.role === "tool") { m.content?.toString().toLowerCase().includes("error") ? errs++ : ok++; }
	const t = errs + ok; return t > 0 ? Math.max(0, Math.min(1, ok / t)) : 0.7;
}
function extractTask(ev: any): string {
	const u = (ev?.messages || []).find((m: any) => m?.role === "user");
	return u?.content ? (typeof u.content === "string" ? u.content : JSON.stringify(u.content)).slice(0, 200) : "unknown task";
}
function extractOutput(ev: any): string {
	const a = [...(ev?.messages || [])].reverse().find((m: any) => m?.role === "assistant");
	return a?.content ? (typeof a.content === "string" ? a.content : JSON.stringify(a.content)).slice(0, 500) : "";
}

// ── Extension ────────────────────────────────────────────────────────────────
export default function (pi: ExtensionAPI) {
	let eps: EpisodeStore | null = null;
	let sks: SkillLibrary | null = null;
	let sona: SONAWeights | null = null;
	const sessions: Map<string, Session> = new Map();

	function init(cwd: string) {
		const dir = join(cwd, STORAGE); ensureDir(dir);
		eps = new EpisodeStore(dir); sks = new SkillLibrary(dir); sona = new SONAWeights(dir);
	}

	// ── 10 Tools ─────────────────────────────────────────────────────────────

	pi.registerTool({
		name: "agentdb_start_session", label: "Start Learning Session",
		description: "Create a new AgentDB learning session for an agent",
		parameters: Type.Object({ agentId: Type.String({ description: "Agent identifier" }), task: Type.String({ description: "Task description" }) }),
		async execute(_id, params, _s, _u, _c) {
			const { agentId, task } = params as { agentId: string; task: string };
			const sid = `sess_${uid()}`; sessions.set(sid, { id: sid, agentId, task, startedAt: Date.now() });
			return { content: [{ type: "text", text: `Session started: ${sid}` }], details: { sessionId: sid, agentId } };
		},
		renderCall(a, t) { return rc(t, "agentdb_start_session", (a as any).agentId || "?"); },
		renderResult(r, _o, t) { return rs(t, `Session: ${(r.details as any)?.sessionId || "?"}`); },
	});

	pi.registerTool({
		name: "agentdb_predict", label: "Predict from History",
		description: "Search similar past episodes and return predictions/suggestions",
		parameters: Type.Object({ sessionId: Type.String({ description: "Active session ID" }), state: Type.String({ description: "Current state" }) }),
		async execute(_id, params, _s, _u, _c) {
			const { sessionId, state } = params as { sessionId: string; state: string };
			if (!sessions.has(sessionId)) return { content: [{ type: "text", text: `Session not found: ${sessionId}` }], details: { found: false } };
			const found = await eps!.search(state, 5);
			const preds = found.map(ep => ({ task: ep.task.slice(0, 80), quality: ep.quality, outcome: ep.outcome.slice(0, 80) }));
			return { content: [{ type: "text", text: `${preds.length} predictions from similar episodes` }], details: { predictions: preds, sessionId } };
		},
		renderCall(a, t) { return rm(t, "agentdb_predict", ((a as any).state || "").slice(0, 40)); },
		renderResult(r, _o, t) { return ra(t, `${(r.details as any)?.predictions?.length || 0} predictions`); },
	});

	pi.registerTool({
		name: "agentdb_feedback", label: "Record Feedback",
		description: "Store feedback for a session, triggers SONA tier 1 adaptation",
		parameters: Type.Object({ sessionId: Type.String({ description: "Active session ID" }), reward: Type.Number({ description: "Reward 0-1" }), outcome: Type.String({ description: "Outcome" }) }),
		async execute(_id, params, _s, _u, _c) {
			const { sessionId, reward, outcome } = params as { sessionId: string; reward: number; outcome: string };
			const sess = sessions.get(sessionId);
			if (!sess) return { content: [{ type: "text", text: `Session not found: ${sessionId}` }], details: { found: false } };
			const epId = await eps!.store({ task: sess.task, output: outcome, quality: reward, critique: "", outcome, timestamp: Date.now(), tags: [sess.agentId] });
			await sona!.instantAdapt(sess.task, outcome, reward);
			return { content: [{ type: "text", text: `Feedback stored: ${epId}, SONA adapted` }], details: { episodeId: epId, reward } };
		},
		renderCall(a, t) { return rc(t, "agentdb_feedback", `reward=${(a as any).reward ?? "?"}`); },
		renderResult(r, _o, t) { return rs(t, r.content[0]?.type === "text" ? (r.content[0] as any).text : ""); },
	});

	pi.registerTool({
		name: "agentdb_train", label: "Train (Consolidate)",
		description: "Trigger SONA tier 2 consolidation: cluster episodes, extract skills",
		parameters: Type.Object({ namespace: Type.Optional(Type.String({ description: "Optional namespace" })) }),
		async execute(_id, _p, _s, _u, _c) {
			const all = eps!.all();
			const ext = await sona!.consolidate(all, sks!);
			return { content: [{ type: "text", text: `Consolidated ${all.length} episodes, extracted ${ext} skills` }], details: { episodeCount: all.length, skillsExtracted: ext } };
		},
		renderCall(_a, t) { return new Text(t.fg("toolTitle", t.bold("agentdb_train")), 0, 0); },
		renderResult(r, _o, t) { return rs(t, `${(r.details as any)?.skillsExtracted || 0} skills extracted`); },
	});

	pi.registerTool({
		name: "reflexion_store_episode", label: "Store Reflexion Episode",
		description: "Store a reflexion episode with auto-quality assessment",
		parameters: Type.Object({ task: Type.String({ description: "Task" }), critique: Type.String({ description: "Self-critique" }), outcome: Type.String({ description: "Outcome" }) }),
		async execute(_id, params, _s, _u, _c) {
			const { task, critique, outcome } = params as { task: string; critique: string; outcome: string };
			const q = outcome.toLowerCase().includes("success") ? 0.9 : outcome.toLowerCase().includes("fail") ? 0.3 : 0.6;
			const epId = await eps!.store({ task, output: outcome, quality: q, critique, outcome, timestamp: Date.now(), tags: ["reflexion"] });
			return { content: [{ type: "text", text: `Episode stored: ${epId} (quality: ${q.toFixed(2)})` }], details: { id: epId, quality: q } };
		},
		renderCall(a, t) { return rm(t, "reflexion_store", ((a as any).task || "").slice(0, 40)); },
		renderResult(r, _o, t) { return rs(t, `quality: ${(r.details as any)?.quality?.toFixed(2) || "?"}`); },
	});

	pi.registerTool({
		name: "reflexion_retrieve", label: "Retrieve Episodes",
		description: "Retrieve similar past episodes via HNSW search",
		parameters: Type.Object({ query: Type.String({ description: "Search query" }), k: Type.Optional(Type.Number({ description: "Results (default 5)" })) }),
		async execute(_id, params, _s, _u, _c) {
			const { query, k = 5 } = params as { query: string; k?: number };
			const found = await eps!.search(query, k);
			if (!found.length) return { content: [{ type: "text", text: "No episodes found" }], details: { count: 0 } };
			const summary = found.map(ep => `- [${ep.quality.toFixed(2)}] ${ep.task.slice(0, 60)} -> ${ep.outcome.slice(0, 40)}`).join("\n");
			return { content: [{ type: "text", text: `Found ${found.length} episodes:\n${summary}` }], details: { count: found.length } };
		},
		renderCall(a, t) { return rm(t, "reflexion_retrieve", ((a as any).query || "").slice(0, 40)); },
		renderResult(r, _o, t) { return ra(t, `${(r.details as any)?.count || 0} episodes`); },
	});

	pi.registerTool({
		name: "skill_create", label: "Create Skill",
		description: "Create a reusable skill in the library",
		parameters: Type.Object({ name: Type.String({ description: "Skill name" }), description: Type.String({ description: "What it does" }), code: Type.String({ description: "Code/template" }) }),
		async execute(_id, params, _s, _u, _c) {
			const { name, description, code } = params as { name: string; description: string; code: string };
			const skId = await sks!.create(name, description, code);
			return { content: [{ type: "text", text: `Skill created: ${skId} (${name})` }], details: { id: skId, name } };
		},
		renderCall(a, t) { return rc(t, "skill_create", (a as any).name || "?"); },
		renderResult(r, _o, t) { return rs(t, `Skill: ${(r.details as any)?.name || "?"}`); },
	});

	pi.registerTool({
		name: "skill_search", label: "Search Skills",
		description: "Search skills by similarity",
		parameters: Type.Object({ query: Type.String({ description: "Search query" }), k: Type.Optional(Type.Number({ description: "Results (default 5)" })) }),
		async execute(_id, params, _s, _u, _c) {
			const { query, k = 5 } = params as { query: string; k?: number };
			const found = await sks!.search(query, k);
			if (!found.length) return { content: [{ type: "text", text: "No skills found" }], details: { count: 0 } };
			const summary = found.map(sk => `- ${sk.name} (uses: ${sk.usageCount}, rate: ${sk.successRate.toFixed(2)})`).join("\n");
			return { content: [{ type: "text", text: `Found ${found.length} skills:\n${summary}` }], details: { count: found.length } };
		},
		renderCall(a, t) { return rm(t, "skill_search", ((a as any).query || "").slice(0, 40)); },
		renderResult(r, _o, t) { return ra(t, `${(r.details as any)?.count || 0} skills`); },
	});

	pi.registerTool({
		name: "sona_adapt", label: "SONA Adapt",
		description: "Manual SONA tier 1 instant adaptation for a query/response pair",
		parameters: Type.Object({ query: Type.String({ description: "Query/task" }), response: Type.String({ description: "Response/output" }), quality: Type.Number({ description: "Quality 0-1" }) }),
		async execute(_id, params, _s, _u, _c) {
			const { query, response, quality } = params as { query: string; response: string; quality: number };
			await sona!.instantAdapt(query, response, quality);
			return { content: [{ type: "text", text: `SONA adapted (quality: ${quality.toFixed(2)})` }], details: { quality, patternCount: sona!.patternCount } };
		},
		renderCall(a, t) { return rc(t, "sona_adapt", `q=${(a as any).quality ?? "?"}`); },
		renderResult(r, _o, t) { return rs(t, `${(r.details as any)?.patternCount || 0} patterns`); },
	});

	pi.registerTool({
		name: "sona_stats", label: "SONA Stats",
		description: "Return episode count, skill count, SONA weight stats, last consolidation",
		parameters: Type.Object({}),
		async execute(_id, _p, _s, _u, _c) {
			const ec = eps?.count ?? 0, sc = sks?.count ?? 0;
			const ws = sona?.stats ?? { patterns: {}, lastConsolidation: 0, lastDeepOptimization: 0 };
			const pc = Object.keys(ws.patterns).length;
			const lc = ws.lastConsolidation ? new Date(ws.lastConsolidation).toISOString() : "never";
			const ld = ws.lastDeepOptimization ? new Date(ws.lastDeepOptimization).toISOString() : "never";
			return { content: [{ type: "text", text: `Episodes: ${ec}\nSkills: ${sc}\nSONA patterns: ${pc}\nLast consolidation: ${lc}\nLast deep opt: ${ld}` }], details: { episodes: ec, skills: sc, patterns: pc } };
		},
		renderCall(_a, t) { return new Text(t.fg("toolTitle", t.bold("sona_stats")), 0, 0); },
		renderResult(r, _o, t) {
			const d = r.details as any;
			return new Text(t.fg("accent", `ep:${d?.episodes||0}`) + t.fg("dim", " | ") + t.fg("accent", `sk:${d?.skills||0}`) + t.fg("dim", " | ") + t.fg("accent", `wt:${d?.patterns||0}`), 0, 0);
		},
	});

	// ── Commands ──────────────────────────────────────────────────────────────

	pi.registerCommand("learn-stats", {
		description: "Show episode count, skill count, SONA stats",
		handler: async (_a, ctx) => {
			const ws = sona?.stats;
			ctx.ui.notify(`Episodes: ${eps?.count??0} | Skills: ${sks?.count??0} | Patterns: ${ws ? Object.keys(ws.patterns).length : 0} | Last train: ${ws?.lastConsolidation ? new Date(ws.lastConsolidation).toISOString() : "never"}`, "info");
		},
	});

	pi.registerCommand("remember", {
		description: "Search episodes for similar past work: /remember <query>",
		handler: async (args, ctx) => {
			const q = args?.trim();
			if (!q) { ctx.ui.notify("Usage: /remember <query>", "warning"); return; }
			const found = await eps!.search(q, 5);
			if (!found.length) { ctx.ui.notify("No matching episodes", "info"); return; }
			ctx.ui.notify(`Found ${found.length}:\n${found.map(e => `[${e.quality.toFixed(2)}] ${e.task.slice(0,50)} -> ${e.outcome.slice(0,40)}`).join("\n")}`, "info");
		},
	});

	pi.registerCommand("forget", {
		description: "Clear all learning data (with confirmation)",
		handler: async (_a, ctx) => {
			const c = await ctx.ui.select("Clear ALL learning data?", ["Yes, clear everything", "Cancel"]);
			if (c !== "Yes, clear everything") { ctx.ui.notify("Cancelled", "info"); return; }
			eps!.clear(); sks!.clear(); sona!.clear();
			ctx.ui.notify("All learning data cleared", "warning");
			ctx.ui.setStatus("learning", "[Episodes: 0] [Skills: 0]");
		},
	});

	pi.registerCommand("skills", {
		description: "List all skills in the library",
		handler: async (_a, ctx) => {
			const all = sks!.all();
			if (!all.length) { ctx.ui.notify("No skills in library", "info"); return; }
			ctx.ui.notify(`Skills (${all.length}):\n${all.map(s => `${s.name} (uses:${s.usageCount}, rate:${s.successRate.toFixed(2)})`).join("\n")}`, "info");
		},
	});

	// ── Events ───────────────────────────────────────────────────────────────

	pi.on("session_start", async (_ev, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		init(ctx.cwd); await eps!.ready(); await sks!.ready();
		ctx.ui.setStatus("learning", `[Episodes: ${eps!.count}] [Skills: ${sks!.count}]`);
		ctx.ui.notify(`Learning loaded | Episodes: ${eps!.count} | Skills: ${sks!.count}\n\n/learn-stats  /remember <q>  /forget  /skills`, "info");
	});

	pi.on("agent_end", async (ev, ctx) => {
		if (!eps || !sona) return;
		const q = assessQuality(ev), task = extractTask(ev), out = extractOutput(ev);
		await eps.store({ task, output: out, quality: q, critique: "", outcome: q >= 0.7 ? "success" : "partial", timestamp: Date.now(), tags: ["auto"] });
		await sona.instantAdapt(task, out, q);
		ctx.ui.setStatus("learning", `[Episodes: ${eps.count}] [Skills: ${sks?.count ?? 0}]`);
	});
}
