/**
 * Provider Router — TinyDancer neural model routing + pi-ai integration
 *
 * Routes tasks to the best AI model provider using TinyDancer neural network
 * for intelligent provider selection. Supports Google, OpenAI, Anthropic, and OpenRouter.
 *
 * This extension handles MODEL PROVIDERS (pi-ai), while orchestration.ts handles
 * CLI tools (gemini/codex/ruvllm CLI). Keep them separate.
 *
 * Routing modes:
 *   tiny-dancer — Neural routing via FastGRNN model
 *   keyword     — Rule-based routing by keywords
 *   manual      — User-specified provider
 *   auto        — Default, uses tiny-dancer if available, falls back to keyword
 *
 * Commands:
 *   /router              — Show router status
 *   /router-mode <mode>  — Set routing mode (tiny-dancer/keyword/manual/auto)
 *   /router-candidates  — List available provider candidates
 *
 * Usage: pi -e extensions/provider-router.ts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { Text } from "@mariozechner/pi-tui";
import { complete, getModel, type Model, type Message } from "@mariozechner/pi-ai";

// TinyDancer import - will fail gracefully if not available
let TinyDancer: any = null;
try {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	TinyDancer = require("@ruvector/tiny-dancer");
	console.log("[provider-router] TinyDancer module loaded:", typeof TinyDancer);
} catch (e) {
	console.log("[provider-router] TinyDancer require failed:", e);
	// TinyDancer not installed - will use keyword fallback
}

// ── Types ─────────────────────────────────────────────────────────────────────

type RouterMode = "tiny-dancer" | "keyword" | "manual" | "auto";
type ProviderName = "google" | "openai" | "anthropic" | "openrouter";

interface Candidate {
	provider: ProviderName;
	model: string;
	description: string;
}

interface RouterState {
	mode: RouterMode;
	manualProvider?: ProviderName;
	manualModel?: string;
	lastProvider?: string;
	lastModel?: string;
	lastLatency?: number;
	lastConfidence?: number;
	tinyDancer?: any;
	routerInitialized: boolean;
}

// Default provider candidates
const CANDIDATES: Candidate[] = [
	{ provider: "google", model: "gemini-2.5-pro", description: "Google Gemini - Best for research, reasoning" },
	{ provider: "openai", model: "gpt-5-mini", description: "OpenAI GPT - Fast coding tasks" },
	{ provider: "anthropic", model: "claude-sonnet-4-20250514", description: "Anthropic Claude - Balanced performance" },
	{ provider: "openrouter", model: "google/gemini-2.0-flash-exp", description: "OpenRouter - Cost-effective" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function toAgentIds(candidates: Candidate[]): string[] {
	return candidates.map((c) => `${c.provider}/${c.model}`);
}

function routeByKeyword(prompt: string, candidates: Candidate[]): { candidate: Candidate; reason: string } {
	const lower = prompt.toLowerCase();

	// Keyword-based routing
	if (/\b(research|analysis|deep|reasoning)\b/.test(lower)) {
		const gemini = candidates.find((c) => c.provider === "google");
		if (gemini) return { candidate: gemini, reason: "Keywords: research/analysis/deep/reasoning -> Gemini" };
	}
	if (/\b(code|coding|fast|quick)\b/.test(lower)) {
		const openai = candidates.find((c) => c.provider === "openai");
		if (openai) return { candidate: openai, reason: "Keywords: code/coding/fast/quick -> OpenAI" };
	}
	if (/\b(write|creative|story|narrative)\b/.test(lower)) {
		const anthropic = candidates.find((c) => c.provider === "anthropic");
		if (anthropic) return { candidate: anthropic, reason: "Keywords: write/creative/story -> Claude" };
	}

	// Default: use first available
	const defaultCand = candidates[0];
	return { candidate: defaultCand, reason: `Default: ${defaultCand.provider}/${defaultCand.model}` };
}

async function initTinyDancer(): Promise<any | null> {
	if (!TinyDancer) {
		console.log("[provider-router] TinyDancer not in require cache");
		return null;
	}

	try {
		console.log("[provider-router] Creating TinyDancer instance...");
		const td = new TinyDancer({
			modelPath: "./.rvf/tiny-dancer/router.db",
			enableMetrics: true,
		});
		console.log("[provider-router] TinyDancer instance created, calling init...");
		await td.init();
		console.log("[provider-router] TinyDancer initialized successfully!");
		return td;
	} catch (e) {
		console.warn("[provider-router] TinyDancer init failed:", e);
		return null;
	}
}

// ── Extension ────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
	const state: RouterState = {
		mode: "auto",
		routerInitialized: false,
	};

	// Initialize TinyDancer on load
	(async () => {
		state.tinyDancer = await initTinyDancer();
		state.routerInitialized = true;
	})();

	// ── Status Bar ─────────────────────────────────────────────────────────

	const STATUS_KEYS = {
		ROUTER: "pvd-router",
		PROVIDER: "pvd-provider",
		LATENCY: "pvd-latency",
		CONFIDENCE: "pvd-confidence",
	};

	function updateStatusBar(ctx: any) {
		if (!ctx?.hasUI) {
			console.log("[provider-router] hasUI false, skipping status bar update");
			return;
		}

		const mode = state.mode;
		const provider = state.lastProvider || "—";
		const model = state.lastModel ? state.lastModel.split("/").pop() : "—";
		const latency = state.lastLatency ? `${state.lastLatency}ms` : "—";
		const confidence = state.lastConfidence ? `${(state.lastConfidence * 100).toFixed(0)}%` : "—";

		console.log(`[provider-router] Updating status bar: mode=${mode}, provider=${provider}, latency=${latency}`);

		ctx.ui.setStatus(STATUS_KEYS.ROUTER, `⌬ ${mode}`);
		ctx.ui.setStatus(STATUS_KEYS.PROVIDER, `${provider}:${model}`);
		ctx.ui.setStatus(STATUS_KEYS.LATENCY, `⏱ ${latency}`);
		ctx.ui.setStatus(STATUS_KEYS.CONFIDENCE, `◎ ${confidence}`);
	}

	// ── Route Tool ────────────────────────────────────────────────────────

	pi.registerTool({
		name: "route_model_and_run",
		label: "Route Model & Run",
		description:
			"Route a prompt to the best AI model using TinyDancer neural routing, then execute. " +
			"Supports Google Gemini, OpenAI GPT, Anthropic Claude, and OpenRouter.",
		parameters: Type.Object({
			prompt: Type.String({ description: "Prompt to route and execute" }),
			messages: Type.Optional(
				Type.Array(
					Type.Object({
						role: Type.String(),
						content: Type.String(),
					}),
				),
			),
			forceProvider: Type.Optional(
				Type.Union([
					Type.Literal("google"),
					Type.Literal("openai"),
					Type.Literal("anthropic"),
					Type.Literal("openrouter"),
				]),
			),
			forceModel: Type.Optional(Type.String()),
		}),

		async execute(_id, params, _signal, onUpdate, _ctx) {
			const { prompt, messages, forceProvider, forceModel } = params as {
				prompt: string;
				messages?: { role: string; content: string }[];
				forceProvider?: ProviderName;
				forceModel?: string;
			};

			let selectedProvider: ProviderName;
			let selectedModel: string;
			let confidence = 1.0;
			let routingReason = "";

			// Determine mode
			const effectiveMode = state.mode === "auto" ? (state.tinyDancer ? "tiny-dancer" : "keyword") : state.mode;

			// Manual override
			if (state.mode === "manual" || forceProvider) {
				selectedProvider = forceProvider || state.manualProvider || "google";
				selectedModel = forceModel || state.manualModel || CANDIDATES.find((c) => c.provider === selectedProvider)?.model || "gemini-2.5-pro";
				routingReason = `Manual: ${selectedProvider}/${selectedModel}`;
			}
			// TinyDancer neural routing
			else if (effectiveMode === "tiny-dancer" && state.tinyDancer) {
				try {
					const result = await state.tinyDancer.route({
						query: prompt,
						agents: toAgentIds(CANDIDATES),
						context: { length: prompt.length, mode: effectiveMode },
					});

					const [provider, modelId] = result.agent.split("/");
					selectedProvider = provider as ProviderName;
					selectedModel = modelId;
					confidence = result.confidence || 1.0;
					routingReason = `TinyDancer: ${result.agent} (${(confidence * 100).toFixed(0)}%)`;
				} catch (e) {
					// Fallback to keyword
					const kw = routeByKeyword(prompt, CANDIDATES);
					selectedProvider = kw.candidate.provider;
					selectedModel = kw.candidate.model;
					routingReason = `Fallback: ${kw.reason}`;
				}
			}
			// Keyword-based routing
			else {
				const kw = routeByKeyword(prompt, CANDIDATES);
				selectedProvider = kw.candidate.provider;
				selectedModel = kw.candidate.model;
				routingReason = kw.reason;
			}

			// Update state
			state.lastProvider = selectedProvider;
			state.lastModel = `${selectedProvider}/${selectedModel}`;
			state.lastConfidence = confidence;
			updateStatusBar(_ctx);

			if (onUpdate) {
				onUpdate({
					content: [{ type: "text", text: `[Router] ${routingReason}\nExecuting...` }],
					details: { provider: selectedProvider, model: selectedModel, confidence },
				});
			}

			// Execute via pi-ai
			const startTime = Date.now();
			try {
				const model = getModel(selectedProvider as any, selectedModel as any);

				// Build messages
				const msgs: Message[] = messages || [{ role: "user", content: prompt }];

				const result = await complete(model, {
					messages: msgs,
				});

				const latency = Date.now() - startTime;
				state.lastLatency = latency;
				updateStatusBar(_ctx);

				// Extract text content
				const textContent = result.content
					.filter((b) => b.type === "text")
					.map((b) => (b as any).text)
					.join("\n");

				return {
					content: [{ type: "text", text: textContent || "(no text response)" }],
					details: {
						provider: selectedProvider,
						model: selectedModel,
						latency,
						confidence,
						routingReason,
						status: "done",
					},
				};
			} catch (e: any) {
				const latency = Date.now() - startTime;
				state.lastLatency = latency;
				updateStatusBar(_ctx);

				return {
					content: [
						{
							type: "text",
							text: `Router error: ${e.message || String(e)}\n\nFallback: Try using a different provider or model.`,
						},
					],
					details: {
						provider: selectedProvider,
						model: selectedModel,
						latency,
						confidence,
						routingReason,
						status: "error",
						error: e.message || String(e),
					},
				};
			}
		},

		renderCall(args, theme) {
			const prompt = (args as any).prompt || "";
			const preview = prompt.length > 40 ? prompt.slice(0, 37) + "..." : prompt;
			const mode = state.mode;
			return new Text(
				theme.fg("toolTitle", theme.bold("route_model_and_run ")) +
				theme.fg("dim", `[${mode}] `) +
				theme.fg("muted", preview),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			if (details?.status === "error") {
				return new Text(
					theme.fg("error", `${details.provider}:${details.model?.split("/").pop()} `) +
					theme.fg("dim", `${details.latency}ms`),
					0, 0,
				);
			}
			return new Text(
				theme.fg("success", `${details?.provider}:${details?.model?.split("/").pop()} `) +
				theme.fg("dim", `${details?.latency}ms${details?.confidence ? ` (${(details.confidence * 100).toFixed(0)}%)` : ""}`),
				0, 0,
			);
		},
	});

	// ── Route Only Tool ───────────────────────────────────────────────────

	pi.registerTool({
		name: "route_only",
		label: "Route Only",
		description: "Route a prompt to the best provider WITHOUT executing. Returns routing decision.",
		parameters: Type.Object({
			prompt: Type.String({ description: "Prompt to analyze for routing" }),
		}),

		async execute(_id, params, _signal, _onUpdate, _ctx) {
			const { prompt } = params as { prompt: string };

			const effectiveMode = state.mode === "auto" ? (state.tinyDancer ? "tiny-dancer" : "keyword") : state.mode;
			let selectedProvider: ProviderName;
			let selectedModel: string;
			let confidence = 1.0;
			let routingReason = "";

			if (state.mode === "manual" || state.manualProvider) {
				selectedProvider = state.manualProvider || "google";
				selectedModel = state.manualModel || CANDIDATES.find((c) => c.provider === selectedProvider)?.model || "gemini-2.5-pro";
				routingReason = `Manual: ${selectedProvider}/${selectedModel}`;
			} else if (effectiveMode === "tiny-dancer" && state.tinyDancer) {
				try {
					const result = await state.tinyDancer.route({
						query: prompt,
						agents: toAgentIds(CANDIDATES),
						context: { length: prompt.length },
					});
					const [provider, modelId] = result.agent.split("/");
					selectedProvider = provider as ProviderName;
					selectedModel = modelId;
					confidence = result.confidence || 1.0;
					routingReason = `TinyDancer: ${result.agent} (${(confidence * 100).toFixed(0)}%)`;
				} catch {
					const kw = routeByKeyword(prompt, CANDIDATES);
					selectedProvider = kw.candidate.provider;
					selectedModel = kw.candidate.model;
					routingReason = kw.reason;
				}
			} else {
				const kw = routeByKeyword(prompt, CANDIDATES);
				selectedProvider = kw.candidate.provider;
				selectedModel = kw.candidate.model;
				routingReason = kw.reason;
			}

			return {
				content: [
					{
						type: "text",
						text: `Routing: ${selectedProvider}/${selectedModel}\nReason: ${routingReason}\nMode: ${effectiveMode}`,
					},
				],
				details: { provider: selectedProvider, model: selectedModel, confidence, mode: effectiveMode },
			};
		},

		renderCall(args, theme) {
			const prompt = (args as any).prompt || "";
			const preview = prompt.length > 40 ? prompt.slice(0, 37) + "..." : prompt;
			return new Text(theme.fg("toolTitle", theme.bold("route_only ")) + theme.fg("muted", preview), 0, 0);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			return new Text(
				theme.fg("accent", `${details?.provider}/${details?.model?.split("/").pop()} `) +
				theme.fg("dim", `(${(details?.confidence * 100).toFixed(0)}%)`),
				0, 0,
			);
		},
	});

	// ── Commands ────────────────────────────────────────────────────────────

	pi.registerCommand("router", {
		description: "Show router status",
		handler: async (_args, ctx) => {
			const mode = state.mode;
			const tdStatus = state.tinyDancer ? "● initialized" : "○ not available";
			const lastRoute = state.lastProvider ? `${state.lastProvider}/${state.lastModel?.split("/").pop()}` : "none";

			ctx.ui.notify(
				`Provider Router Status\n\n` +
				`Mode: ${mode}\n` +
				`TinyDancer: ${tdStatus}\n` +
				`Last route: ${lastRoute}\n` +
				`Last latency: ${state.lastLatency ? `${state.lastLatency}ms` : "—"}\n` +
				`Last confidence: ${state.lastConfidence ? `${(state.lastConfidence * 100).toFixed(0)}%` : "—"}\n\n` +
				`Use /router-mode <mode> to change\n` +
				`Use /router-candidates to see providers`,
				"info",
			);
		},
	});

	pi.registerCommand("router-mode", {
		description: "Set routing mode: /router-mode <tiny-dancer|keyword|manual|auto>",
		handler: async (args, ctx) => {
			const modeInput = args?.trim().toLowerCase() || "";

			// If no mode provided, show current mode
			if (!modeInput) {
				ctx.ui.notify(`Current router mode: ${state.mode}\n\nUse /router-mode <mode> to change.\nValid modes: tiny-dancer, keyword, manual, auto`, "info");
				return;
			}

			const mode = modeInput as RouterMode;
			const valid: RouterMode[] = ["tiny-dancer", "keyword", "manual", "auto"];

			if (!valid.includes(mode)) {
				ctx.ui.notify(`Invalid mode: ${modeInput}\nChoose: ${valid.join(", ")}`, "error");
				return;
			}

			// For tiny-dancer mode, check if available; for auto, always allow (falls back to keyword)
			if (mode === "tiny-dancer" && !state.tinyDancer) {
				ctx.ui.notify("TinyDancer not available. Using keyword mode instead.", "warning");
				state.mode = "keyword";
			} else {
				state.mode = mode;
			}

			updateStatusBar(ctx);
			ctx.ui.notify(`Router mode set to: ${state.mode}`, "success");
		},
	});

	pi.registerCommand("router-candidates", {
		description: "List available provider candidates",
		handler: async (_args, ctx) => {
			const lines = CANDIDATES.map(
				(c, i) => `${i + 1}. ${c.provider}/${c.model}\n   ${c.description}`,
			);

			ctx.ui.notify(`Provider Candidates\n\n${lines.join("\n\n")}`, "info");
		},
	});

	// ── Events ─────────────────────────────────────────────────────────────

	pi.on("session_start", async (_event, ctx) => {
		// Reset state
		state.mode = "auto";
		state.manualProvider = undefined;
		state.manualModel = undefined;
		state.lastProvider = undefined;
		state.lastModel = undefined;
		state.lastLatency = undefined;
		state.lastConfidence = undefined;

		// Initialize status bar with new keys
		console.log("[provider-router] Session start, initializing status bar, hasUI:", ctx.hasUI);
		ctx.ui.setStatus(STATUS_KEYS.ROUTER, "⌬ auto");
		ctx.ui.setStatus(STATUS_KEYS.PROVIDER, "—:—");
		ctx.ui.setStatus(STATUS_KEYS.LATENCY, "⏱ —");
		ctx.ui.setStatus(STATUS_KEYS.CONFIDENCE, "◎ —");

		ctx.ui.notify(
			`Provider Router extension loaded\n\n` +
			`Tools:\n` +
			`- route_model_and_run: Route + execute via pi-ai\n` +
			`- route_only: Route without executing\n\n` +
			`Commands:\n` +
			`- /router: Show router status\n` +
			`- /router-mode <mode>: Set mode (tiny-dancer/keyword/manual/auto)\n` +
			`- /router-candidates: List providers\n\n` +
			`Status bar shows: provider, model, latency, confidence`,
			"info",
		);
	});

	pi.on("before_agent_start", async (_event, _ctx) => {
		const mode = state.mode;
		const hasTD = !!state.tinyDancer;
		const effectiveMode = mode === "auto" ? (hasTD ? "tiny-dancer" : "keyword") : mode;

		return {
			appendSystemPrompt: [
				"\n\n## Provider Router Context",
				`Routing mode: ${effectiveMode}`,
				`TinyDancer available: ${hasTD}`,
				state.lastProvider ? `Last provider: ${state.lastProvider}/${state.lastModel}` : "No routing history",
				"",
				"Available routing tools:",
				"- route_model_and_run: Route prompt via TinyDancer/keyword, then execute via pi-ai",
				"- route_only: Get routing decision without executing",
				"",
				"Routing modes:",
				"- tiny-dancer: Neural FastGRNN routing (requires model at .rvf/tiny-dancer/router.db)",
				"- keyword: Rule-based by keywords (research->Gemini, code->OpenAI, write->Claude)",
				"- manual: User-specified provider",
				"- auto: Default, uses TinyDancer if available, else keyword",
				"",
				"Provider candidates:",
				...CANDIDATES.map((c) => `- ${c.provider}/${c.model}: ${c.description}`),
			].join("\n"),
		};
	});
}
