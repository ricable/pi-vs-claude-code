/**
 * RuVector — Document indexing + semantic search for RAG
 *
 * Chunks and embeds files into a VectorDB (.rvf/docs.json)
 * for retrieval-augmented generation. Separate from agent-team
 * memory (which tracks task patterns — this is for code + docs).
 *
 * Commands:
 *   /rvf-index <path>   — index a path into the knowledge base
 *   /rvf-search <query> — semantic search over indexed content
 *   /rvf-stats          — show index stats
 *   /rvf-clear          — clear the index
 *
 * Tools (LLM-callable):
 *   rvf_index_path(path, label?)
 *   rvf_search(query, k?)
 *   rvf_get_chunk(id)
 *
 * Usage: pi -e extensions/ruvector.ts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { Text } from "@mariozechner/pi-tui";
import { VectorDB } from "@ruvector/rvf-node";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { applyExtensionDefaults } from "./themeMap.ts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Chunk {
	id: string;
	file: string;
	line: number;
	label: string;
	chunkIndex: number;
	text: string;
	timestamp: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DIMENSION = 384;
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const DOCS_FILE = "docs.json";

const TEXT_EXTENSIONS = new Set([
	".ts", ".tsx", ".js", ".jsx", ".py", ".md", ".txt", ".json",
	".yaml", ".yml", ".toml", ".sh", ".css", ".html", ".rs", ".go",
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function simpleHash(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 5) - hash) + str.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
	let s = seed;
	return () => {
		s = (s * 1103515245 + 12345) & 0x7fffffff;
		return s / 0x7fffffff;
	};
}

// Hash-based embedding (placeholder — upgrade to ruvllm when available)
function computeEmbedding(text: string): Float32Array {
	const hash = simpleHash(text);
	const rng = seededRandom(hash);
	const vector = new Float32Array(DIMENSION);
	for (let i = 0; i < DIMENSION; i++) {
		vector[i] = rng() * 2 - 1;
	}
	const mag = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
	for (let i = 0; i < vector.length; i++) {
		vector[i] /= mag;
	}
	return vector;
}

function chunkText(text: string): string[] {
	const chunks: string[] = [];
	let start = 0;
	while (start < text.length) {
		chunks.push(text.slice(start, start + CHUNK_SIZE));
		start += CHUNK_SIZE - CHUNK_OVERLAP;
	}
	return chunks;
}

function isTextFile(filePath: string): boolean {
	return TEXT_EXTENSIONS.has(extname(filePath).toLowerCase());
}

function collectFiles(dirOrFile: string): string[] {
	const files: string[] = [];
	try {
		const stat = statSync(dirOrFile);
		if (stat.isFile()) {
			if (isTextFile(dirOrFile)) files.push(dirOrFile);
		} else if (stat.isDirectory()) {
			for (const name of readdirSync(dirOrFile)) {
				if (name.startsWith(".") || name === "node_modules") continue;
				files.push(...collectFiles(join(dirOrFile, name)));
			}
		}
	} catch {}
	return files;
}

// ── Extension ─────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
	let db: VectorDB | null = null;
	const chunks: Map<string, Chunk> = new Map();
	let storageDir = "";
	let lastIndexedPath = "";
	let initPromise: Promise<void> = Promise.resolve();

	function docsPath(): string {
		return join(storageDir, DOCS_FILE);
	}

	function saveToDisk(): void {
		if (!storageDir) return;
		try {
			if (!existsSync(storageDir)) mkdirSync(storageDir, { recursive: true });
			writeFileSync(docsPath(), JSON.stringify(Array.from(chunks.values()), null, 2));
		} catch {}
	}

	async function loadFromDisk(): Promise<void> {
		if (!storageDir || !db) return;
		try {
			if (!existsSync(docsPath())) return;
			const data: Chunk[] = JSON.parse(readFileSync(docsPath(), "utf-8"));
			const inserts = data.map(chunk => {
				chunks.set(chunk.id, chunk);
				const vector = computeEmbedding(chunk.text);
				return db!.insert({ id: chunk.id, vector, metadata: chunk });
			});
			await Promise.all(inserts);
		} catch {}
	}

	async function indexPath(filePath: string, label?: string): Promise<{ indexed: number; files: number }> {
		if (!db) return { indexed: 0, files: 0 };
		const files = collectFiles(filePath);
		let indexed = 0;
		for (const file of files) {
			try {
				const content = readFileSync(file, "utf-8");
				const fileChunks = chunkText(content);
				const inserts = fileChunks.map((text, i) => {
					const chunkId = `chunk_${simpleHash(file + i + text).toString(36)}`;
					const chunk: Chunk = {
						id: chunkId,
						file,
						line: i * (CHUNK_SIZE - CHUNK_OVERLAP),
						label: label || file,
						chunkIndex: i,
						text,
						timestamp: Date.now(),
					};
					chunks.set(chunkId, chunk);
					const vector = computeEmbedding(text);
					return db!.insert({ id: chunkId, vector, metadata: chunk });
				});
				await Promise.all(inserts);
				indexed += fileChunks.length;
			} catch {}
		}
		saveToDisk();
		lastIndexedPath = filePath;
		return { indexed, files: files.length };
	}

	// ── Tools ─────────────────────────────────────────────────────────────────

	pi.registerTool({
		name: "rvf_index_path",
		label: "RVF Index Path",
		description: "Index a file or directory into the vector knowledge base for semantic search",
		parameters: Type.Object({
			path: Type.String({ description: "File or directory path to index" }),
			label: Type.Optional(Type.String({ description: "Label/tag for the indexed content" })),
		}),

		async execute(_id, params, _signal, onUpdate, ctx) {
			await initPromise;
			const { path, label } = params as { path: string; label?: string };
			const absPath = path.startsWith("/") ? path : join(ctx.cwd, path);
			if (!existsSync(absPath)) {
				return {
					content: [{ type: "text", text: `Path not found: ${path}` }],
					details: { status: "error" },
				};
			}
			if (onUpdate) {
				onUpdate({ content: [{ type: "text", text: `Indexing ${path}...` }], details: {} });
			}
			const result = await indexPath(absPath, label);
			return {
				content: [{ type: "text", text: `Indexed ${result.indexed} chunks from ${result.files} files in ${path}` }],
				details: { indexed: result.indexed, files: result.files, path },
			};
		},

		renderCall(args, theme) {
			const path = (args as any).path || "";
			return new Text(
				theme.fg("toolTitle", theme.bold("rvf_index_path ")) +
				theme.fg("accent", path),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			if (details?.status === "error") {
				const text = result.content[0];
				return new Text(theme.fg("error", text?.type === "text" ? text.text : "error"), 0, 0);
			}
			return new Text(
				theme.fg("success", `${details?.indexed || 0} chunks indexed`),
				0, 0,
			);
		},
	});

	pi.registerTool({
		name: "rvf_search",
		label: "RVF Search",
		description: "Semantic search over indexed documents and code",
		parameters: Type.Object({
			query: Type.String({ description: "Search query" }),
			k: Type.Optional(Type.Number({ description: "Number of results (default 5)" })),
		}),

		async execute(_id, params, _signal, _onUpdate, _ctx) {
			await initPromise;
			const { query, k = 5 } = params as { query: string; k?: number };
			if (!db || chunks.size === 0) {
				return {
					content: [{ type: "text", text: "Knowledge base is empty. Use rvf_index_path to index files first." }],
					details: { results: [], count: 0 },
				};
			}
			const vector = computeEmbedding(query);
			const results = await db.search({ vector, k });
			if (results.length === 0) {
				return {
					content: [{ type: "text", text: "No results found" }],
					details: { results: [], count: 0 },
				};
			}
			const formatted = results.map(r => {
				const chunk = r.metadata as Chunk;
				return `[${chunk.file}:${chunk.line}] (${(r.similarity * 100).toFixed(0)}%)\n${chunk.text.slice(0, 200)}`;
			}).join("\n\n---\n\n");
			return {
				content: [{ type: "text", text: formatted }],
				details: {
					results: results.map(r => ({ id: r.id, similarity: r.similarity, chunk: r.metadata })),
					count: results.length,
				},
			};
		},

		renderCall(args, theme) {
			const query = (args as any).query || "";
			const preview = query.length > 40 ? query.slice(0, 37) + "..." : query;
			return new Text(
				theme.fg("toolTitle", theme.bold("rvf_search ")) +
				theme.fg("muted", preview),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			if (!details || details.count === 0) {
				return new Text(theme.fg("dim", "No results"), 0, 0);
			}
			return new Text(theme.fg("success", `${details.count} results`), 0, 0);
		},
	});

	pi.registerTool({
		name: "rvf_get_chunk",
		label: "RVF Get Chunk",
		description: "Get the full content of a specific chunk by ID",
		parameters: Type.Object({
			id: Type.String({ description: "Chunk ID from rvf_search results" }),
		}),

		async execute(_id, params, _signal, _onUpdate, _ctx) {
			await initPromise;
			const { id } = params as { id: string };
			const chunk = chunks.get(id);
			if (!chunk) {
				return {
					content: [{ type: "text", text: `Chunk not found: ${id}` }],
					details: { found: false },
				};
			}
			return {
				content: [{ type: "text", text: `[${chunk.file}:${chunk.line}]\n${chunk.text}` }],
				details: { chunk, found: true },
			};
		},

		renderCall(args, theme) {
			const id = (args as any).id || "";
			return new Text(
				theme.fg("toolTitle", theme.bold("rvf_get_chunk ")) +
				theme.fg("accent", id.slice(0, 20)),
				0, 0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as any;
			if (!details?.found) return new Text(theme.fg("error", "Not found"), 0, 0);
			return new Text(theme.fg("success", "Chunk retrieved"), 0, 0);
		},
	});

	// ── Commands ──────────────────────────────────────────────────────────────

	pi.registerCommand("rvf-index", {
		description: "Index a path into the knowledge base: /rvf-index <path>",
		handler: async (args, ctx) => {
			await initPromise;
			const path = args?.trim();
			if (!path) {
				ctx.ui.notify("Usage: /rvf-index <path>", "error");
				return;
			}
			const absPath = path.startsWith("/") ? path : join(ctx.cwd, path);
			if (!existsSync(absPath)) {
				ctx.ui.notify(`Path not found: ${path}`, "error");
				return;
			}
			ctx.ui.notify(`Indexing ${path}...`, "info");
			const result = await indexPath(absPath);
			ctx.ui.notify(`Indexed ${result.indexed} chunks from ${result.files} files`, "success");
			ctx.ui.setStatus("rvf", `${chunks.size} chunks · ${path}`);
		},
	});

	pi.registerCommand("rvf-search", {
		description: "Semantic search over indexed content: /rvf-search <query>",
		handler: async (args, ctx) => {
			await initPromise;
			const query = args?.trim();
			if (!query) {
				ctx.ui.notify("Usage: /rvf-search <query>", "error");
				return;
			}
			if (!db || chunks.size === 0) {
				ctx.ui.notify("Knowledge base is empty. Use /rvf-index first.", "warning");
				return;
			}
			const vector = computeEmbedding(query);
			const results = await db.search({ vector, k: 5 });
			if (results.length === 0) {
				ctx.ui.notify("No results found", "warning");
				return;
			}
			const lines = results.map(r => {
				const chunk = r.metadata as Chunk;
				return `${chunk.file}:${chunk.line} (${(r.similarity * 100).toFixed(0)}%)\n  ${chunk.text.slice(0, 100)}...`;
			}).join("\n\n");
			ctx.ui.notify(`Results for "${query}":\n\n${lines}`, "info");
		},
	});

	pi.registerCommand("rvf-stats", {
		description: "Show knowledge base statistics",
		handler: async (_args, ctx) => {
			await initPromise;
			const fileSet = new Set(Array.from(chunks.values()).map(c => c.file));
			const labelSet = new Set(Array.from(chunks.values()).map(c => c.label).filter(l => l !== l));
			ctx.ui.notify(
				`RVF Knowledge Base:\n` +
				`- Total chunks: ${chunks.size}\n` +
				`- Unique files: ${fileSet.size}\n` +
				`- Last indexed: ${lastIndexedPath || "none"}`,
				"info",
			);
		},
	});

	pi.registerCommand("rvf-clear", {
		description: "Clear the knowledge base index",
		handler: async (_args, ctx) => {
			db = VectorDB.withDimensions(DIMENSION);
			chunks.clear();
			lastIndexedPath = "";
			saveToDisk();
			ctx.ui.notify("Knowledge base cleared", "info");
			ctx.ui.setStatus("rvf", "0 chunks");
		},
	});

	// ── Session Start ─────────────────────────────────────────────────────────

	pi.on("session_start", async (_event, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		storageDir = join(ctx.cwd, ".rvf");
		db = VectorDB.withDimensions(DIMENSION);
		chunks.clear();
		initPromise = loadFromDisk();
		await initPromise;

		ctx.ui.setStatus("rvf", `${chunks.size} chunks${lastIndexedPath ? ` · ${lastIndexedPath}` : ""}`);
		ctx.ui.notify(
			`RVF Knowledge Base loaded (${chunks.size} chunks)\n\n` +
			`/rvf-index <path>   Index files into knowledge base\n` +
			`/rvf-search <query> Semantic search\n` +
			`/rvf-stats          Show stats\n` +
			`/rvf-clear          Clear index\n\n` +
			`Tools: rvf_index_path, rvf_search, rvf_get_chunk`,
			"info",
		);
	});
}
