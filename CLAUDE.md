# Claude Code Configuration — Pi Swarm Platform

## Behavioral Rules (Always Enforced)

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- NEVER save working files, text/mds, or tests to the root folder
- Never continuously check status after spawning a swarm — wait for results
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files

## File Organization

- NEVER save to root folder — use the directories below
- Use `/extensions` for Pi extension source files (.ts)
- Use `/scripts` for utility scripts (sync, build, etc.)
- Use `/.pi/agents/experts/{domain}/` for domain expert agents
- Use `/.pi/agents/providers/` for provider routing agents
- Use `/references` for reference source code (read-only)
- Use `/agents-yaml` for YAML agent definitions (source of truth for telecom)

## Project Architecture

This is a **Pi Coding Agent extension playground** transformed into a distributed swarm platform with 88+ domain expert agents, self-learning via SONA/ReasoningBank, and multi-provider routing.

### Project Config

- **Runtime**: Bun + Pi Coding Agent CLI
- **Topology**: hierarchical-mesh
- **Max Agents**: 15 per swarm
- **Memory**: HNSW vector store via @ruvector/rvf-node
- **Learning**: SONA three-tier (instantAdapt / consolidate / deepOptimize)
- **Providers**: Gemini CLI, Codex CLI, RuvLLM (local)

## Agent Registry (88+ agents)

### Core Agents (14) — `.pi/agents/*.md`
`coordinator`, `coder`, `planner`, `researcher`, `reviewer`, `tester`, `scout`, `builder`, `documenter`, `red-team`, `bowser`, `plan-reviewer`, `ruvector`, `factory`

### Domain Experts (61) — `.pi/agents/experts/`

| Domain | Agents | Location |
|--------|--------|----------|
| **Backend** (6) | postgres, mongodb, redis, graphql, rust, python | `experts/backend/` |
| **Frontend** (5) | react, vue, threejs, tailwind, accessibility | `experts/frontend/` |
| **Infra** (6) | docker, kubernetes, aws, terraform, observability, cicd | `experts/infra/` |
| **Security** (3) | auth, owasp, devsecops | `experts/security/` |
| **Testing** (3) | cypress, jest, playwright | `experts/testing/` |
| **Mobile** (3) | react-native, swift, kotlin | `experts/mobile/` |
| **Science** (5) | ml-researcher, data-scientist, bioinformatics, physicist, statistician | `experts/science/` |
| **Business** (4) | product-manager, analyst, marketer, finance | `experts/business/` |
| **Telecom** (26) | mobility, neighbor, throughput, link-adaptation, carrier-aggregation, rrm, learning, 4g-lte, 5g-nr, antenna, power, beam, interference, loadbalance, energy, coverage, admission, capacity, alarm, resilience, enm-api, + 5 SPARC agents | `experts/telecom/` |

### Provider Agents (3) — `.pi/agents/providers/`
`gemini`, `codex`, `ruvllm`

## Extensions

| Extension | File | Purpose |
|-----------|------|---------|
| **orchestration** | `extensions/orchestration.ts` | Provider routing (gemini/codex/ruvllm/auto) + swarm coordination |
| **learning** | `extensions/learning.ts` | AgentDB + ReasoningBank + SONA self-learning |
| **agent-team** | `extensions/agent-team.ts` | Dispatcher orchestrator with grid dashboard + HNSW memory |
| **ruvector** | `extensions/ruvector.ts` | Document indexing + semantic search (RAG) |
| **opencode** | `extensions/opencode.ts` | Routes to local opencode server |
| **cross-agent** | `extensions/cross-agent.ts` | Scans .claude/.gemini/.codex + experts/ + providers/ dirs |
| **agent-chain** | `extensions/agent-chain.ts` | Sequential pipeline orchestrator |
| **claude-flow** | `extensions/claude-flow.ts` | Claude-Flow CLI swarm coordination (strategies, memory, monitoring) |
| **provider-router** | `extensions/provider-router.ts` | TinyDancer neural routing + pi-ai model providers (Google/OpenAI/Anthropic/OpenRouter) |

### Claude-Flow Tools
| Tool | Description |
|------|-------------|
| `cf_swarm_start(objective, strategy?, ...)` | Launch swarm with strategy + options (dev/research/analysis/testing/opt/maintenance) |
| `cf_swarm_status(verbose?)` | System status: swarm, agents, tasks, memory |
| `cf_swarm_stop()` | Stop running swarm |
| `cf_swarm_scale(count)` | Scale agent count |
| `cf_memory_store(key, value, namespace?)` | Store in distributed memory |
| `cf_memory_search(query, namespace?, limit?)` | Semantic search across swarm memory |
| `cf_memory_stats()` | Memory statistics |
| `cf_agent_list()` | List all agents |
| `cf_agent_info(agentId)` | Agent details |
| `cf_monitor(focus?)` | Monitoring snapshot |

### Orchestration Tools
| Tool | Description |
|------|-------------|
| `gemini_run(prompt, files?, model?)` | Route to Gemini CLI |
| `codex_run(prompt, files?, model?)` | Route to Codex CLI |
| `ruvllm_run(prompt, model?)` | Route to local RuvLLM (localhost:8080) |
| `auto_route(prompt, priority?)` | Auto-select provider by keywords/complexity |
| `swarm_init(topology, maxAgents?)` | Initialize swarm topology |
| `swarm_dispatch(agentId, task)` | Dispatch task to agent |
| `swarm_broadcast(message)` | Broadcast to all agents |
| `conflict_check(files)` | Check for file conflicts |

### Learning Tools
| Tool | Description |
|------|-------------|
| `agentdb_start_session(agentId, task)` | Start learning session |
| `agentdb_predict(sessionId, state)` | Get predictions from past episodes |
| `agentdb_feedback(sessionId, reward, outcome)` | Store feedback + SONA adapt |
| `agentdb_train(namespace?)` | Trigger SONA tier 2 consolidation |
| `reflexion_store_episode(task, critique, outcome)` | Store reflexion episode |
| `reflexion_retrieve(query, k?)` | Search past episodes |
| `skill_create(name, description, code)` | Create reusable skill |
| `skill_search(query, k?)` | Search skills |
| `sona_adapt(query, response, quality)` | Manual SONA adaptation |
| `sona_stats()` | Learning statistics |

## Teams (28 defined) — `.pi/agents/teams.yaml`

| Team | Members |
|------|---------|
| `dev` | coordinator, coder, planner, researcher, reviewer, tester |
| `backend-team` | postgres, mongodb, redis, graphql |
| `frontend-team` | react, vue, tailwind |
| `fullstack-team` | react, postgres, docker, auth, jest |
| `security-team` | auth, owasp, devsecops, red-team |
| `infra-team` | docker, kubernetes, aws, terraform |
| `science-team` | ml-researcher, data-scientist, statistician |
| `business-team` | product-manager, analyst, finance |
| `providers` | gemini, codex, ruvllm |
| `telecom-ran` | rrm, throughput, mobility, alarm, learning |
| `telecom-integrity` | antenna, power, beam, interference, coverage |
| `mega-swarm` | coordinator, planner, coder, reviewer, tester, researcher |
| `domain-factory` | factory, coordinator, reviewer |
| `cf-development` | coordinator, coder, reviewer, tester, documenter |
| `cf-research` | researcher, coordinator, planner, scout |
| `cf-analysis` | researcher, planner, coordinator, reviewer |
| `cf-testing` | tester, reviewer, red-team, coder |
| `cf-optimization` | coder, reviewer, tester, planner |
| `cf-enterprise` | coordinator, coder, reviewer, tester, red-team, planner, documenter |

## Chains (15 defined) — `.pi/agents/agent-chain.yaml`

| Chain | Description |
|-------|-------------|
| `plan-build-review` | Standard dev cycle: planner → builder → reviewer |
| `expert-build` | Domain expert: planner → coder → reviewer |
| `provider-research` | RAG research: ruvector → researcher → planner |
| `learn-improve` | Pattern-aware: scout → ruvector → coder |
| `full-swarm` | Coordinator dispatches parallel experts |
| `mega-swarm` | All experts → reviewer → documenter |
| `telecom-analysis` | RRM → throughput → learning |
| `cf-dev-cycle` | CF development: planner → coder → reviewer → tester |
| `cf-research-synthesis` | CF research: scout → researcher → planner synthesis |
| `cf-security-audit` | CF testing: scout → red-team → tester → reviewer |
| `cf-optimize` | CF optimization: scout → coder → tester → reviewer |

## Quick Commands

```bash
# Core sessions
just pi                   # Plain Pi
just ext-agent-team       # Multi-agent dispatcher
just ext-orchestration    # CLI provider routing + swarm
pi -e extensions/provider-router.ts  # TinyDancer neural routing + pi-ai
just ext-learning         # Self-learning extension
just ext-mega             # All extensions combined

# Claude-Flow swarm sessions
pi -e extensions/claude-flow.ts                          # Standalone CF integration
pi -e extensions/claude-flow.ts -e extensions/agent-team.ts  # CF + agent dispatch
pi -e extensions/claude-flow.ts -e extensions/orchestration.ts -e extensions/learning.ts  # CF + providers + learning

# Domain teams
just ext-backend-team     # Backend development session
just ext-telecom          # Telecom analysis session

# Utilities
just sync-agents          # Sync .pi/agents/ → .claude/agents/
bun scripts/sync-agents.ts  # Direct sync execution
```

## Build & Validate

```bash
# Compile check (extensions are loaded at runtime by Pi, not pre-built)
bun build extensions/orchestration.ts --target=bun --outdir /tmp/check --external "@mariozechner/*" --external "@sinclair/*" --external "@ruvector/*"
bun build extensions/learning.ts --target=bun --outdir /tmp/check --external "@mariozechner/*" --external "@sinclair/*" --external "@ruvector/*"

# Sync agents to Claude Code format
bun scripts/sync-agents.ts
```

## Storage Layout

```
.rvf/
├── docs.json           # ruvector document chunks
├── patterns.json       # agent-team task patterns
└── learning/           # SONA + ReasoningBank
    ├── episodes.json   # ReflexionMemory episodes
    ├── skills.json     # SkillLibrary
    └── sona-weights.json  # SONA adaptive weights
```

## Security Rules

- NEVER hardcode API keys, secrets, or credentials in source files
- NEVER commit .env files or any file containing secrets
- Always validate user input at system boundaries
- Always sanitize file paths to prevent directory traversal

## Concurrency: 1 MESSAGE = ALL RELATED OPERATIONS

- All operations MUST be concurrent/parallel in a single message
- ALWAYS batch ALL file reads/writes/edits in ONE message
- ALWAYS spawn ALL background agents in ONE message
- After spawning, STOP — do NOT poll or check status

## Agent Definition Format

All agents use `.md` files with YAML frontmatter:

```markdown
---
name: agent-name
description: One-line description
model: auto
tools: read,write,edit,bash,grep,find,ls
---
System prompt body describing the agent's specialty and approach.
```

## Adding New Agents

1. Create `.pi/agents/experts/{domain}/{name}.md` with frontmatter + system prompt
2. Add to relevant team in `.pi/agents/teams.yaml`
3. Run `bun scripts/sync-agents.ts` to mirror to `.claude/agents/`
4. Or use the factory agent: dispatch to `factory` with a description of the new agent


# Pi vs CC — Extension Playground

Pi Coding Agent extension examples and experiments.

## Tooling
- **Package manager**: `bun` (not npm/yarn/pnpm)
- **Task runner**: `just` (see justfile)
- **Extensions run via**: `pi -e extensions/<name>.ts`

## Project Structure
- `extensions/` — Pi extension source files (.ts)
- `specs/` — Feature specifications
- `.pi/agents/` — Agent definitions (.md) and teams.yaml for agent-team extension
- `.pi/skills/` — Custom skills — **must be in subdirectories**: `.pi/skills/<name>/SKILL.md`
- `.pi/agent-sessions/` — Ephemeral session files (gitignored)
- `.pi/settings.json` — Pi workspace settings (theme, prompts, mcpServers)
- `.rvf/` — RVF persistent vector storage (gitignored): `patterns.json`, `docs.json`

## Conventions
- Extensions are standalone .ts files loaded by Pi's jiti runtime
- Available imports: `@mariozechner/pi-coding-agent`, `@mariozechner/pi-tui`, `@mariozechner/pi-ai`, `@sinclair/typebox`, plus any deps in package.json
- Register tools at the top level of the extension function (not inside event handlers)
- Use `isToolCallEventType()` for type-safe tool_call event narrowing

## Dependencies (package.json)
```json
{
  "@ruvector/rvf-node":      "^0.1.7",   // HNSW vector DB — VectorDB class
  "@ruvector/rvf-mcp-server":"^0.1.3",   // MCP server for LLM-native vector ops
  "@opencode-ai/sdk":        "^1.2.10",  // OpenCode SDK — createOpencodeClient
  "yaml":                    "^2.8.0"
}
```

---

## Strict Code Guidelines

### Skills file layout
Skills **must** live in a named subdirectory, not as flat files:
```
.pi/skills/<name>/SKILL.md   ✓ correct
.pi/skills/<name>.md          ✗ causes "name does not match parent directory" warning
```

### @ruvector/rvf-node — VectorDB API

```typescript
import { VectorDB } from "@ruvector/rvf-node";

// Factory is SYNCHRONOUS — use in constructors
const db = VectorDB.withDimensions(384);

// All operations are ASYNC
await db.insert({ id: "x", vector: new Float32Array(384), metadata: { ... } });
const results = await db.search({ vector: new Float32Array(384), k: 5 });
// results: Array<{ id: string, similarity: number, metadata: Record<string,any> }>
await db.delete("x");
```

**Async-init pattern for classes** — use `loadPromise` so the constructor stays synchronous but callers always wait for initialization:
```typescript
class Store {
  private db = VectorDB.withDimensions(384);
  private loadPromise: Promise<void>;
  constructor() { this.loadPromise = this.loadFromDisk(); }
  async publicMethod() {
    await this.loadPromise;   // ← always await before using db
    ...
  }
  private async loadFromDisk(): Promise<void> { ... }
}
```

**Persistence pattern**: VectorDB is in-memory only. Save metadata to `.rvf/<name>.json` on write; on load, re-`insert` each entry to rebuild the HNSW index.

**Tag-filtered search**: VectorDB has no native tag filter. Search with `k * 10` and filter results in JS:
```typescript
const results = await db.search({ vector, k: k * 10 });
return results.map(r => r.metadata as T).filter(p => tags.some(t => p.tags.includes(t))).slice(0, k);
```

### @opencode-ai/sdk — Client API

```typescript
// CORRECT import — no default export
import { createOpencodeClient } from "@opencode-ai/sdk/client";

const client = createOpencodeClient({ baseUrl: "http://127.0.0.1:4096" });
// Note: baseUrl (lowercase) not baseURL

// All methods return HeyAPI { data, error } — destructure data:
const { data: sessions } = await client.session.list();
const { data: session } = await client.session.create({ body: { title: "name" } });

// Send a message (method is .prompt, not .sendMessage):
const { data } = await client.session.prompt({
  path: { id: sessionId },
  body: { parts: [{ type: "text", text: "task" }] },
});

// Useful options:
// noReply: true       — inject context without triggering AI response
// --attach flag       — for opencode CLI, attach to running server
```

**Wrong** (will crash with "_sdk.default is not a constructor"):
```typescript
import Opencode from "@opencode-ai/sdk";       // ✗ no default export
new Opencode({ baseURL: "..." });              // ✗ not a constructor
client.session.create({ title: "..." });       // ✗ body must be wrapped: { body: { title } }
```

### opencode CLI (one-shot tasks)

```bash
# Start server (keep running):
opencode serve    # listens on http://127.0.0.1:4096

# One-shot task attached to running server:
opencode run "write a snake game to snake.py" --attach --server=http://127.0.0.1:4096
opencode run "refactor this file" -f src/utils.ts --attach

# Connect Pi extension to non-default port:
OC_BASE_URL=http://127.0.0.1:4096 pi -e extensions/opencode.ts
# or inside Pi TUI:
/oc-connect http://127.0.0.1:4096
```

### RVF Storage
- `.rvf/patterns.json` — agent-team task pattern memory (managed by agent-team.ts)
- `.rvf/docs.json` — document/code chunk index (managed by ruvector.ts)
- Both are **gitignored** ephemeral state — safe to delete to reset

---

## Extension Commands Reference

### agent-team.ts
| Command | Description |
|---------|-------------|
| `/team` | Select active team |
| `/agents-team` | Alias for /team |
| `/agents-list` | List agents and run count |
| `/agents-grid <1-6>` | Set grid columns |
| `/memory-stats` | Show RVF pattern memory stats |

### ruvector.ts
| Command | Description |
|---------|-------------|
| `/rvf-index <path>` | Chunk + embed files into `.rvf/docs` |
| `/rvf-search <query>` | Semantic search over indexed content |
| `/rvf-stats` | Show index size and last indexed path |
| `/rvf-clear` | Clear the knowledge base index |

### opencode.ts
| Command | Description |
|---------|-------------|
| `/oc-connect <url?>` | Connect to opencode server |
| `/oc-session` | Create or show active session |
| `/oc-status` | Check server reachability |

---

## Teams (`.pi/agents/teams.yaml`)

| Team | Members |
|------|---------|
| `dev` | coordinator, coder, planner, researcher, reviewer, tester |
| `swarm` | coordinator, coder, planner, researcher, reviewer, tester |
| `research` | researcher, coordinator |
| `full` | scout, planner, builder, reviewer, documenter, red-team |
| `vector` | ruvector, scout, planner |
| `local` | ruvector, coder, planner, reviewer |

---

## MCP Servers (`.pi/settings.json`)

```json
{
  "mcpServers": {
    "rvf": {
      "command": "npx",
      "args": ["@ruvector/rvf-mcp-server", "--transport", "stdio"],
      "env": { "RUVECTOR_BACKEND": "rvf" }
    }
  }
}
```
