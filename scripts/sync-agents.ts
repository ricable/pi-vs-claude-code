/**
 * sync-agents.ts — One-way sync: .pi/agents/ → .claude/agents/
 *
 * Mirrors all agent .md files from Pi format to Claude Code format.
 * Preserves system prompt body, maps frontmatter fields.
 *
 * Usage: bun scripts/sync-agents.ts
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "fs";
import { join, basename, relative } from "path";

const PROJECT_ROOT = join(import.meta.dir, "..");
const PI_AGENTS_DIR = join(PROJECT_ROOT, ".pi", "agents");
const CLAUDE_AGENTS_DIR = join(PROJECT_ROOT, ".claude", "agents");

interface AgentFrontmatter {
	name: string;
	description: string;
	model: string;
	tools: string;
}

function parseFrontmatter(raw: string): { fields: AgentFrontmatter; body: string } | null {
	const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
	if (!match) return null;

	const fields: Record<string, string> = {};
	for (const line of match[1].split("\n")) {
		const idx = line.indexOf(":");
		if (idx > 0) {
			fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
		}
	}

	if (!fields.name) return null;

	return {
		fields: {
			name: fields.name,
			description: fields.description || "",
			model: fields.model || "auto",
			tools: fields.tools || "read,grep,find,ls",
		},
		body: match[2].trim(),
	};
}

function toClaudeFormat(fields: AgentFrontmatter, body: string): string {
	// Claude Code agents use the same .md frontmatter format
	// but may use slightly different tool names
	const toolMap: Record<string, string> = {
		read: "Read",
		write: "Write",
		edit: "Edit",
		bash: "Bash",
		grep: "Grep",
		glob: "Glob",
		find: "Glob",
		ls: "Bash",
	};

	const piTools = fields.tools.split(",").map(t => t.trim());
	const claudeTools = [...new Set(piTools.map(t => toolMap[t] || t))];

	return `---
name: ${fields.name}
description: ${fields.description}
tools: ${claudeTools.join(",")}
---
${body}
`;
}

function scanAndSync(srcDir: string, destDir: string, stats: { synced: number; skipped: number; errors: number }) {
	if (!existsSync(srcDir)) return;

	for (const entry of readdirSync(srcDir)) {
		const srcPath = join(srcDir, entry);
		const st = statSync(srcPath);

		if (st.isDirectory()) {
			// Skip non-agent directories
			if (["agent-sessions"].includes(entry)) continue;
			scanAndSync(srcPath, destDir, stats);
			continue;
		}

		if (!entry.endsWith(".md")) continue;

		// Skip non-agent files
		if (["factory.md"].includes(entry)) continue;

		try {
			const raw = readFileSync(srcPath, "utf-8");
			const parsed = parseFrontmatter(raw);
			if (!parsed) {
				stats.skipped++;
				continue;
			}

			const claudeContent = toClaudeFormat(parsed.fields, parsed.body);
			const destPath = join(destDir, `${parsed.fields.name}.md`);

			// Only write if content changed
			if (existsSync(destPath)) {
				const existing = readFileSync(destPath, "utf-8");
				if (existing === claudeContent) {
					stats.skipped++;
					continue;
				}
			}

			writeFileSync(destPath, claudeContent);
			const rel = relative(PROJECT_ROOT, srcPath);
			console.log(`  synced: ${rel} → .claude/agents/${parsed.fields.name}.md`);
			stats.synced++;
		} catch (err: any) {
			console.error(`  error: ${entry}: ${err.message}`);
			stats.errors++;
		}
	}
}

// Main
console.log("Syncing .pi/agents/ → .claude/agents/\n");

if (!existsSync(CLAUDE_AGENTS_DIR)) {
	mkdirSync(CLAUDE_AGENTS_DIR, { recursive: true });
}

const stats = { synced: 0, skipped: 0, errors: 0 };

// Sync top-level agents
scanAndSync(PI_AGENTS_DIR, CLAUDE_AGENTS_DIR, stats);

// Sync experts subdirectories
const expertsDir = join(PI_AGENTS_DIR, "experts");
if (existsSync(expertsDir)) {
	scanAndSync(expertsDir, CLAUDE_AGENTS_DIR, stats);
}

// Sync providers
const providersDir = join(PI_AGENTS_DIR, "providers");
if (existsSync(providersDir)) {
	scanAndSync(providersDir, CLAUDE_AGENTS_DIR, stats);
}

console.log(`\nDone: ${stats.synced} synced, ${stats.skipped} unchanged, ${stats.errors} errors`);
