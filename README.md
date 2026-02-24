# Pi Swarm Platform — Dynamic Multi-Provider, Multi-Agent Coding

This repository turns **Pi Coding Agent** into a coordinated swarm platform with:

- multi-agent orchestration
- dynamic provider/model routing (Gemini / Codex / RuvLLM / OpenRouter)
- RVF vector memory (`.rvf/`)
- self-learning (AgentDB + Reflexion + SONA)
- team and chain execution across domain experts

> Primary use case: run multiple coordinated Pi coding agents and dynamically choose the best provider/model per task.

---

## 1) What you get

### Core orchestration extensions

- `extensions/orchestration.ts`
  - Provider tools: `gemini_run`, `codex_run`, `ruvllm_run`, `auto_route`
  - Swarm tools: `swarm_init`, `swarm_dispatch`, `swarm_broadcast`, `conflict_check`
- `extensions/agent-team.ts`
  - Dispatcher model with team selection + agent grid + RVF memory patterns
- `extensions/agent-chain.ts`
  - Sequential pipelines (`planner -> coder -> reviewer -> tester`, etc.)
- `extensions/claude-flow.ts`
  - Claude-Flow CLI bridge for swarm lifecycle, memory, agents, monitoring
- `extensions/learning.ts`
  - AgentDB + Reflexion + SONA (adaptive learning)
- `extensions/ruvector.ts`
  - Document indexing / semantic retrieval over `.rvf/docs.json`

### Agent inventory

- Core agents in `.pi/agents/*.md`
- Domain experts in `.pi/agents/experts/*`
- Provider agents in `.pi/agents/providers/*`
- Team definitions in `.pi/agents/teams.yaml`
- Chain definitions in `.pi/agents/agent-chain.yaml`

---

## 2) Prerequisites

Install:

- **Bun**
- **just**
- **Pi Coding Agent CLI** (`pi`)
- Optional provider CLIs:
  - `gemini`
  - `codex`
  - local `ruvllm` server (if using local inference)
  - `claude-flow` CLI (for `extensions/claude-flow.ts`)

Install dependencies:

```bash
bun install
```

---

## 3) API keys / env setup

Pi does not auto-load `.env` unless your launcher does. Use one of:

```bash
source .env && pi
```

or run through `just` recipes (dotenv enabled there).

Typical variables:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `OPENROUTER_API_KEY`

---

## 4) Quick start modes

### Plain Pi

```bash
just pi
```

### Provider routing + swarm tools

```bash
just ext-orchestration
```

### Multi-agent dispatcher grid

```bash
just ext-agent-team
```

### Learning memory mode

```bash
just ext-learning
```

### Full stack (recommended for coordinated systems)

```bash
just ext-mega
```

---

## 5) Dynamic provider/model routing

There are two levels:

1. **Session model selection** (Pi runtime model)
2. **Tool-level routing** (choose provider per subtask)

---

### 5.1 Session-level model selection

Launch Pi with a specific model:

```bash
pi --model openrouter/google/gemini-3.1-pro -e extensions/orchestration.ts
```

You can replace with any configured provider/model:

- `openrouter/google/gemini-3.1-pro`
- `openrouter/anthropic/claude-sonnet-4`
- `openrouter/openai/gpt-5-mini`
- local / custom provider IDs

> Current default fallback in several agent-runner extensions is now `openrouter/google/gemini-3.1-pro`.

---

### 5.2 Tool-level provider routing (inside one session)

With `extensions/orchestration.ts`, call tools directly:

- `gemini_run(prompt, files?, model?)`
- `codex_run(prompt, files?, model?)`
- `ruvllm_run(prompt, model?)`
- `auto_route(prompt, priority?)`

This lets one parent agent dynamically split workload:

- research tasks -> Gemini
- code transforms -> Codex
- local/private inference -> RuvLLM
- unknown/mixed -> `auto_route`

Example workflow:

1. `auto_route("Investigate API auth best practices", "quality")`
2. `codex_run("Implement middleware based on findings", ["src/auth.ts"])`
3. `gemini_run("Review security assumptions and edge cases")`

---

## 6) Running multiple coordinated Pi agents

You have 4 main orchestration patterns.

---

### Pattern A — Team dispatcher (`agent-team`)

```bash
pi -e extensions/agent-team.ts
```

Then use dispatcher tools to fan out tasks to selected team experts.

Best for:

- domain decomposition
- parallel specialist execution
- persistent agent session memory
- RVF task-pattern recall

---

### Pattern B — Sequential chains (`agent-chain`)

```bash
pi -e extensions/agent-chain.ts
```

Run predefined chain pipelines from `.pi/agents/agent-chain.yaml`.

Best for:

- deterministic multi-step flows
- handoff-based quality gates
- reproducible build/test/review loops

---

### Pattern C — Provider+swarm routing (`orchestration`)

```bash
pi -e extensions/orchestration.ts -e extensions/learning.ts
```

Use provider routing tools and swarm dispatch together, with learning feedback loops.

Best for:

- dynamic cost/quality balancing
- provider fallback
- adaptive behavior via memory signals

---

### Pattern D — Claude-Flow bridge (`claude-flow`)

```bash
pi -e extensions/claude-flow.ts
```

Tools exposed:

- `cf_swarm_start`
- `cf_swarm_status`
- `cf_swarm_stop`
- `cf_swarm_scale`
- `cf_memory_store`
- `cf_memory_search`
- `cf_memory_stats`
- `cf_agent_list`
- `cf_agent_info`
- `cf_monitor`

Commands exposed:

- `/cf-swarm`
- `/cf-status`
- `/cf-stop`
- `/cf-agents`
- `/cf-memory`
- `/cf-strategies`

---

## 7) Dynamic model switching across coordinated agents

A practical approach:

1. Parent coordinator runs with strong planner model (e.g. Gemini 3.1 Pro).
2. Subtasks route by tool/provider:
   - architecture/research -> Gemini
   - implementation/refactor -> Codex
   - offline/private -> RuvLLM
3. Reviewer/tester agents run with quality-oriented models.
4. Store outcomes in RVF/learning memory to improve future routing.

### Example command stack

```bash
pi \
  -e extensions/orchestration.ts \
  -e extensions/agent-team.ts \
  -e extensions/learning.ts \
  --model openrouter/google/gemini-3.1-pro
```

Now in one session you can:

- dispatch specialist agents
- route each subtask to different providers
- capture reward feedback via learning tools

---

## 8) RVF memory layout

Persistent vector data lives under `.rvf/`:

```text
.rvf/
├── docs.json
├── patterns.json
└── learning/
    ├── episodes.json
    ├── skills.json
    └── sona-weights.json
```

Used by:

- `ruvector.ts` (RAG chunks)
- `agent-team.ts` (pattern memory)
- `learning.ts` (episodes/skills/weights)
- swarm/coordination workflows that persist retrieval context

---

## 9) Provider/model operations cheat sheet

### Check provider tool availability

- `gemini_run` fails gracefully if Gemini CLI missing
- `codex_run` fails gracefully if Codex CLI missing
- `ruvllm_run` requires local server availability

### Force a provider

Use explicit tool calls (`gemini_run` / `codex_run` / `ruvllm_run`) for hard routing.

### Let system choose

Use `auto_route(prompt, priority)`:

- `priority: "speed"` for quick turnaround
- `priority: "quality"` for stronger reasoning/review

### Override model per run

Where tool supports `model`, pass explicit model ID.

---

## 10) End-to-end examples

### Example 1 — Fullstack feature with dynamic providers

1. Start:

```bash
just ext-mega
```

2. In session:

- Planner agent decomposes feature
- `gemini_run` for design/research
- `codex_run` for implementation
- `cf_monitor` or swarm status tools for progress
- `agentdb_feedback` after task completion

### Example 2 — Security audit swarm

```bash
pi -e extensions/claude-flow.ts -e extensions/learning.ts
```

Then:

- `cf_swarm_start` with `strategy: "testing"`, `review: true`, `testing: true`
- run checks
- persist findings via memory/learning tools

### Example 3 — Offline local-first execution

```bash
pi -e extensions/orchestration.ts
```

Use `ruvllm_run` for local inference; combine with `agent-team` for multi-agent local workflows.

---

## 11) Recommended launch profiles

### Research-heavy

```bash
pi -e extensions/orchestration.ts -e extensions/ruvector.ts --model openrouter/google/gemini-3.1-pro
```

### Build + test pipeline

```bash
pi -e extensions/agent-chain.ts -e extensions/learning.ts --model openrouter/google/gemini-3.1-pro
```

### Large coordinated swarm

```bash
pi -e extensions/agent-team.ts -e extensions/orchestration.ts -e extensions/learning.ts -e extensions/claude-flow.ts
```

---

## 12) Troubleshooting

### CLI not found errors

Install missing CLI and ensure it is on PATH.

### No provider responses

Check API keys are exported in current shell before launch.

### Memory appears empty

Confirm `.rvf/` exists and extension with memory support is loaded.

### Model ID errors

Verify model exists for your provider endpoint (OpenRouter / native provider / local backend).

---

## 13) Security notes

- Never hardcode secrets in extension files.
- Never commit `.env`.
- Validate and sanitize file/path inputs when extending tools.
- Prefer least-privilege tool sets for spawned subagents.

---

## 14) Useful commands

```bash
# list recipes
just

# core sessions
just pi
just ext-agent-team
just ext-orchestration
just ext-learning
just ext-mega

# sync agents to Claude-compatible format
just sync-agents
bun scripts/sync-agents.ts
```

---

If you want, I can also generate a **provider/model decision matrix** (latency/cost/quality routing policy) and add it as a dedicated section in this README.