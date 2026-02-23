/**
 * OpenCode — Route coding tasks to a local opencode server
 *
 * Integrates @opencode-ai/sdk to delegate complex coding tasks
 * to an opencode instance (which may use ruvllm for local
 * Apple Silicon inference). Pi handles conversation + memory;
 * opencode handles code generation sub-tasks.
 *
 * Commands:
 *   /oc-connect <baseUrl?> — connect to opencode server (default http://localhost:3000)
 *   /oc-session            — create or show current opencode session
 *   /oc-status             — show connection status
 *
 * Tools (LLM-callable):
 *   oc_run(prompt, file?)          — one-shot via CLI (fastest, no session needed)
 *   oc_create_session(name?)
 *   oc_send_message(sessionId, content)
 *   oc_list_sessions()
 *
 * Config: set OC_BASE_URL env var to change default server URL.
 *
 * Usage: pi -e extensions/opencode.ts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { Text } from "@mariozechner/pi-tui";
import { createOpencodeClient } from "@opencode-ai/sdk/client";
import { spawn } from "child_process";
import { applyExtensionDefaults } from "./themeMap.ts";

type OpencodeClient = ReturnType<typeof createOpencodeClient>;

// ── Extension ─────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
	let client: OpencodeClient | null = null;
	let baseUrl = process.env.OC_BASE_URL || "http://localhost:3000";
	let activeSessionId: string | null = null;

	function initClient(url?: string): void {
		if (url) baseUrl = url;
		client = createOpencodeClient({ baseUrl });
	}

	async function listSessions(): Promise<any[]> {
		const res = await client!.session.list();
		return (res.data as any[]) ?? [];
	}

	// Run `opencode run <prompt>` via CLI, attaching to the running server.
	// This is the simplest pattern: no session management, just fire-and-forget.
	function runCli(prompt: string, files: string[]): Promise<string> {
		return new Promise((resolve) => {
			const args = ["run", prompt, "--attach", `--server=${baseUrl}`];
			for (const f of files) args.push("-f", f);

			const chunks: string[] = [];
			const proc = spawn("opencode", args, {
				stdio: ["ignore", "pipe", "pipe"],
				env: { ...process.env },
			});
			proc.stdout?.setEncoding("utf-8");
			proc.stdout?.on("data", (d: string) => chunks.push(d));
			proc.stderr?.setEncoding("utf-8");
			proc.stderr?.on("data", (d: string) => chunks.push(d));
			proc.on("close", () => resolve(chunks.join("")));
			proc.on("error", (e) => resolve(`Error: ${e.message}`));
		});
	}

	// ── Tools ─────────────────────────────────────────────────────────────────

	pi.registerTool({
		name: "oc_run",
		label: "OC Run",
		description: "One-shot coding task via opencode CLI. Best for file writes, refactors, analysis. Attaches to the running opencode server.",
		parameters: Type.Object({
			prompt: Type.String({ description: "Task for opencode to execute" }),
			files: Type.Optional(Type.Array(Type.String(), { description: "File paths to attach as context" })),
		}),

		async execute(_id, params, _signal, onUpdate, _ctx) {
			const { prompt, files = [] } = params as { prompt: string; files?: string[] };
			if (onUpdate) {
				onUpdate({ content: [{ type: "text", text: `opencode run: ${prompt.slice(0, 60)}...` }], details: {} });
			}
			const output = await runCli(prompt, files);
			return {
				content: [{ type: "text", text: output || "(no output)" }],
				details: { prompt, status: "done" },
			};
		},

		renderCall(args, theme) {
			const prompt = (args as any).prompt || "";
			const preview = prompt.length > 50 ? prompt.slice(0, 47) + "..." : prompt;
			return new Text(
				theme.fg("toolTitle", theme.bold("oc_run ")) +
				theme.fg("muted", preview),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const output = result.content[0];
			const text = output?.type === "text" ? output.text : "";
			const preview = text.split("\n").filter(Boolean).pop() || "done";
			return new Text(theme.fg("success", preview.slice(0, 60)), 0, 0);
		},
	});

	pi.registerTool({
		name: "oc_create_session",
		label: "OC Create Session",
		description: "Create a new opencode session for coding tasks",
		parameters: Type.Object({
			name: Type.Optional(Type.String({ description: "Session name/title" })),
		}),

		async execute(_id, params, _signal, _onUpdate, _ctx) {
			if (!client) initClient();
			try {
				const res = await client!.session.create({
					body: { title: (params as any).name },
				});
				const session = res.data as any;
				activeSessionId = session?.id ?? null;
				return {
					content: [{ type: "text", text: `Session created: ${session?.id}` }],
					details: { session, status: "created" },
				};
			} catch (err: any) {
				return {
					content: [{ type: "text", text: `Failed to create session: ${err?.message || err}` }],
					details: { status: "error" },
				};
			}
		},

		renderCall(args, theme) {
			const name = (args as any).name || "unnamed";
			return new Text(
				theme.fg("toolTitle", theme.bold("oc_create_session ")) +
				theme.fg("accent", name),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			if (details?.status === "error") {
				const text = result.content[0];
				return new Text(theme.fg("error", text?.type === "text" ? text.text : "error"), 0, 0);
			}
			const id = details?.session?.id?.slice(0, 12) ?? "?";
			return new Text(theme.fg("success", `Session: ${id}...`), 0, 0);
		},
	});

	pi.registerTool({
		name: "oc_send_message",
		label: "OC Send Message",
		description: "Send a message to an opencode session and get the response",
		parameters: Type.Object({
			sessionId: Type.String({ description: "Session ID to send the message to" }),
			content: Type.String({ description: "Message content" }),
		}),

		async execute(_id, params, _signal, onUpdate, _ctx) {
			if (!client) initClient();
			const { sessionId, content } = params as { sessionId: string; content: string };
			if (onUpdate) {
				onUpdate({ content: [{ type: "text", text: "Sending to opencode..." }], details: {} });
			}
			try {
				const res = await client!.session.prompt({
					path: { id: sessionId },
					body: {
						parts: [{ type: "text", text: content }],
					},
				});
				const data = res.data as any;
				// Extract text from response parts
				const text = Array.isArray(data?.parts)
					? data.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("")
					: JSON.stringify(data);
				return {
					content: [{ type: "text", text: text || "Message sent (no text response)" }],
					details: { sessionId, status: "sent" },
				};
			} catch (err: any) {
				return {
					content: [{ type: "text", text: `Error: ${err?.message || err}` }],
					details: { status: "error", sessionId },
				};
			}
		},

		renderCall(args, theme) {
			const content = (args as any).content || "";
			const preview = content.length > 40 ? content.slice(0, 37) + "..." : content;
			return new Text(
				theme.fg("toolTitle", theme.bold("oc_send_message ")) +
				theme.fg("muted", preview),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			if (details?.status === "error") {
				return new Text(theme.fg("error", "Send failed"), 0, 0);
			}
			return new Text(theme.fg("success", "Message sent"), 0, 0);
		},
	});

	pi.registerTool({
		name: "oc_list_sessions",
		label: "OC List Sessions",
		description: "List existing opencode sessions",
		parameters: Type.Object({}),

		async execute(_id, _params, _signal, _onUpdate, _ctx) {
			if (!client) initClient();
			try {
				const sessions = await listSessions();
				if (!sessions.length) {
					return {
						content: [{ type: "text", text: "No sessions found" }],
						details: { sessions: [], count: 0 },
					};
				}
				const list = sessions
					.map((s: any) => `${String(s.id).slice(0, 12)}... — ${s.title || "untitled"}`)
					.join("\n");
				return {
					content: [{ type: "text", text: `Sessions (${sessions.length}):\n${list}` }],
					details: { sessions, count: sessions.length },
				};
			} catch (err: any) {
				return {
					content: [{ type: "text", text: `Failed to list sessions: ${err?.message || err}` }],
					details: { status: "error" },
				};
			}
		},

		renderCall(_args, theme) {
			return new Text(theme.fg("toolTitle", theme.bold("oc_list_sessions")), 0, 0);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			return new Text(
				theme.fg("accent", `${details?.count || 0} sessions`),
				0, 0,
			);
		},
	});

	// ── Commands ──────────────────────────────────────────────────────────────

	pi.registerCommand("oc-connect", {
		description: "Connect to opencode server: /oc-connect <baseUrl?>",
		handler: async (args, ctx) => {
			const url = args?.trim() || "http://localhost:3000";
			initClient(url);
			const reachable = await listSessions().then(() => true).catch(() => false);
			if (reachable) {
				ctx.ui.notify(`Connected to opencode at ${url}`, "success");
				ctx.ui.setStatus("opencode", `● ${url}`);
			} else {
				ctx.ui.notify(`opencode not reachable at ${url} (will retry on next tool call)`, "warning");
				ctx.ui.setStatus("opencode", `○ ${url}`);
			}
		},
	});

	pi.registerCommand("oc-session", {
		description: "Create or show current opencode session",
		handler: async (_args, ctx) => {
			if (!client) initClient();
			if (activeSessionId) {
				ctx.ui.notify(`Active session: ${activeSessionId}`, "info");
				return;
			}
			try {
				const res = await client!.session.create({
					body: { title: `pi-session-${Date.now()}` },
				});
				const session = res.data as any;
				activeSessionId = session?.id ?? null;
				ctx.ui.notify(`New session created: ${session?.id}`, "success");
				ctx.ui.setStatus("opencode", `● ${baseUrl} · ${String(session?.id).slice(0, 8)}...`);
			} catch (err: any) {
				ctx.ui.notify(`Failed to create session: ${err?.message || err}`, "error");
			}
		},
	});

	pi.registerCommand("oc-status", {
		description: "Show opencode connection status",
		handler: async (_args, ctx) => {
			if (!client) initClient();
			const reachable = await listSessions().then(() => true).catch(() => false);
			const icon = reachable ? "●" : "○";
			const status = reachable ? "Connected" : "Not reachable";
			ctx.ui.notify(
				`OpenCode Status:\n` +
				`- Server: ${baseUrl}\n` +
				`- Status: ${icon} ${status}\n` +
				`- Active session: ${activeSessionId || "none"}`,
				reachable ? "info" : "warning",
			);
			ctx.ui.setStatus("opencode", `${icon} ${baseUrl}`);
		},
	});

	// ── Session Start ─────────────────────────────────────────────────────────

	pi.on("session_start", async (_event, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		baseUrl = process.env.OC_BASE_URL || "http://localhost:3000";
		activeSessionId = null;
		initClient();
		ctx.ui.setStatus("opencode", `○ ${baseUrl}`);
		ctx.ui.notify(
			`OpenCode integration loaded\n` +
			`Server: ${baseUrl} (set OC_BASE_URL to override)\n\n` +
			`/oc-connect <url>   Connect to server\n` +
			`/oc-session         Create or resume a session\n` +
			`/oc-status          Check connection\n\n` +
			`Tools:\n` +
			`  oc_run(prompt, files?)          one-shot CLI task\n` +
			`  oc_create_session(name?)        start stateful session\n` +
			`  oc_send_message(id, content)    send to session\n` +
			`  oc_list_sessions()              list sessions`,
			"info",
		);
	});
}
