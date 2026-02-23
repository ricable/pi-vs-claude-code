# pi-vs-cc

A collection of [Pi Coding Agent](https://github.com/mariozechner/pi-coding-agent) customized instances. _Why?_ To showcase what it looks like to hedge against the leader in the agentic coding market, Claude Code. Here we showcase how you can customize the UI, agent orchestration tools, safety auditing, and cross-agent integrations. 

<div align="center">
  <img src="./images/pi-logo.png" alt="pi-vs-cc" width="700">
</div>

---

## Prerequisites

All three are required:

| Tool            | Purpose                   | Install                                                    |
| --------------- | ------------------------- | ---------------------------------------------------------- |
| **Bun** ≥ 1.3.2 | Runtime & package manager | [bun.sh](https://bun.sh)                                   |
| **just**        | Task runner               | `brew install just`                                        |
| **pi**          | Pi Coding Agent CLI       | [Pi docs](https://github.com/mariozechner/pi-coding-agent) |

---

## API Keys

Pi does **not** auto-load `.env` files — API keys must be present in your shell's environment **before** you launch Pi. A sample file is provided:

```bash
cp .env.sample .env   # copy the template
# open .env and fill in your keys
```

`.env.sample` covers the four most popular providers:

| Provider         | Variable             | Get your key                                                                                               |
| ---------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| OpenAI           | `OPENAI_API_KEY`     | [platform.openai.com](https://platform.openai.com/api-keys)                                                |
| Anthropic        | `ANTHROPIC_API_KEY`  | [console.anthropic.com](https://console.anthropic.com/settings/keys)                                       |
| Google           | `GEMINI_API_KEY`     | [aistudio.google.com](https://aistudio.google.com/app/apikey)                                              |
| OpenRouter       | `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai/keys)                                                                |
| Many Many Others | `***`                | [Pi Providers docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/providers.md) |

### Sourcing your keys

Pick whichever approach fits your workflow:

**Option A — Source manually each session:**
```bash
source .env && pi
```

**Option B — One-liner alias (add to `~/.zshrc` or `~/.bashrc`):**
```bash
alias pi='source $(pwd)/.env && pi'
```

**Option C — Use the `just` task runner (auto-wired via `set dotenv-load`):**
```bash
just pi           # .env is loaded automatically for every just recipe
just ext-minimal  # works for all recipes, not just `pi`
```

---

## Installation

```bash
bun install
```

---

## Extensions

| Extension               | File                                | Description                                                                                                                                                |
| ----------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **pure-focus**          | `extensions/pure-focus.ts`          | Removes the footer bar and status line entirely — pure distraction-free mode                                                                               |
| **minimal**             | `extensions/minimal.ts`             | Compact footer showing model name and a 10-block context usage meter `[###-------] 30%`                                                                    |
| **cross-agent**         | `extensions/cross-agent.ts`         | Scans `.claude/`, `.gemini/`, `.codex/` dirs for commands, skills, and agents and registers them in Pi                                                     |
| **purpose-gate**        | `extensions/purpose-gate.ts`        | Prompts you to declare session intent on startup; shows a persistent purpose widget and blocks prompts until answered                                      |
| **tool-counter**        | `extensions/tool-counter.ts`        | Rich two-line footer: model + context meter + token/cost stats on line 1, cwd/branch + per-tool call tally on line 2                                       |
| **tool-counter-widget** | `extensions/tool-counter-widget.ts` | Live-updating above-editor widget showing per-tool call counts with background colors                                                                      |
| **subagent-widget**     | `extensions/subagent-widget.ts`     | `/sub <task>` command that spawns background Pi subagents; each gets its own streaming live-progress widget                                                |
| **tilldone**            | `extensions/tilldone.ts`            | Task discipline system — define tasks before starting work; tracks completion state across steps; shows persistent task list in footer with live progress  |
| **agent-team**          | `extensions/agent-team.ts`          | Dispatcher-only orchestrator with multi-agent grid dashboard and persistent HNSW vector memory (via `@ruvector/rvf-node`)                    |
| **ruvector**            | `extensions/ruvector.ts`            | Document/code indexing + semantic search for RAG — chunks files into `.rvf/docs.json` VectorDB, tools: `rvf_index_path`, `rvf_search`, `rvf_get_chunk` |
| **opencode**            | `extensions/opencode.ts`            | Routes coding tasks to a local `opencode serve` instance via `@opencode-ai/sdk` — tools: `oc_run` (one-shot CLI), `oc_create_session`, `oc_send_message` |
| **orchestration**       | `extensions/orchestration.ts`       | Provider routing (Gemini/Codex/RuvLLM/auto) + swarm coordination — tools: `gemini_run`, `codex_run`, `ruvllm_run`, `auto_route`, `swarm_init`, `swarm_dispatch`, `conflict_check` |
| **learning**            | `extensions/learning.ts`            | AgentDB + ReasoningBank + SONA three-tier self-learning — auto-captures episodes on `agent_end`, tools: `reflexion_store_episode`, `skill_create`, `sona_adapt` |
| **system-select**       | `extensions/system-select.ts`       | `/system` command to interactively switch between agent personas/system prompts from `.pi/agents/`, `.claude/agents/`, `.gemini/agents/`, `.codex/agents/` |
| **damage-control**      | `extensions/damage-control.ts`      | Real-time safety auditing — intercepts dangerous bash patterns and enforces path-based access controls from `.pi/damage-control-rules.yaml`                |
| **agent-chain**         | `extensions/agent-chain.ts`         | Sequential pipeline orchestrator — chains multiple agents where each step's output feeds into the next step's prompt; use `/chain` to select and run       |
| **pi-pi**               | `extensions/pi-pi.ts`               | Meta-agent that builds Pi agents using parallel research experts for documentation                                                                         |
| **session-replay**      | `extensions/session-replay.ts`      | Scrollable timeline overlay of session history - showcasing customizable dialog UI                                                                         |
| **theme-cycler**        | `extensions/theme-cycler.ts`        | Keyboard shortcuts (Ctrl+X/Ctrl+Q) and `/theme` command to cycle/switch between custom themes                                                              |

---


## Usage

### Run a single extension

```bash
pi -e extensions/<name>.ts
```

### Stack multiple extensions

Extensions compose — pass multiple `-e` flags:

```bash
pi -e extensions/minimal.ts -e extensions/cross-agent.ts
```

### Use `just` recipes

`just` wraps the most useful combinations. Run `just` with no arguments to list all available recipes:

```bash
just
```

Common recipes:

```bash
just pi                     # Plain Pi, no extensions
just ext-pure-focus         # Distraction-free mode
just ext-minimal            # Minimal context meter footer
just ext-cross-agent        # Cross-agent command loading + minimal footer
just ext-purpose-gate       # Purpose gate + minimal footer
just ext-tool-counter       # Rich two-line footer with tool tally
just ext-tool-counter-widget # Per-tool widget above the editor
just ext-subagent-widget    # Subagent spawner with live progress widgets
just ext-tilldone           # Task discipline system with live progress tracking
just ext-agent-team         # Multi-agent orchestration grid dashboard
just ext-ruvector           # Document indexing + semantic search (RAG)
just ext-opencode           # OpenCode server integration (requires opencode serve)
just ext-vector-team        # ruvector + opencode + agent-team combined
just ext-system-select      # Agent persona switcher via /system command
just ext-damage-control     # Safety auditing + minimal footer
just ext-agent-chain        # Sequential pipeline orchestrator with step chaining
just ext-pi-pi              # Meta-agent that builds Pi agents using parallel experts
just ext-orchestration      # Provider routing (gemini/codex/ruvllm) + swarm
just ext-learning           # AgentDB + ReasoningBank + SONA self-learning
just ext-mega               # All extensions combined (orchestration+learning+team+ruvector)
just ext-backend-team       # Backend development team session
just ext-telecom            # Telecom analysis team session
just sync-agents            # Sync .pi/agents/ → .claude/agents/
just ext-session-replay     # Scrollable timeline overlay of session history
just ext-theme-cycler       # Theme cycler + minimal footer
just all                    # Open every extension in its own terminal window
```

The `open` recipe allows you to spin up a new terminal window with any combination of stacked extensions (omit `.ts`):

```bash
just open purpose-gate minimal tool-counter-widget
```

---

## Project Structure

```
pi-vs-cc/
├── extensions/              # Pi extension source files (.ts)
│   ├── agent-team.ts        # Multi-agent dispatcher + HNSW memory
│   ├── orchestration.ts     # Provider routing (gemini/codex/ruvllm) + swarm
│   ├── learning.ts          # AgentDB + ReasoningBank + SONA self-learning
│   ├── ruvector.ts          # Document indexing + semantic search (RAG)
│   ├── opencode.ts          # OpenCode server integration
│   └── ...                  # Other extensions (14 total)
├── scripts/
│   └── sync-agents.ts       # One-way .pi/agents/ → .claude/agents/ sync
├── agents-yaml/agents/      # Telecom YAML agent definitions (source of truth)
├── .pi/
│   ├── agents/
│   │   ├── experts/         # 61 domain expert agents
│   │   │   ├── backend/     # postgres, mongodb, redis, graphql, rust, python
│   │   │   ├── frontend/    # react, vue, threejs, tailwind, accessibility
│   │   │   ├── infra/       # docker, kubernetes, aws, terraform, observability, cicd
│   │   │   ├── security/    # auth, owasp, devsecops
│   │   │   ├── testing/     # cypress, jest, playwright
│   │   │   ├── mobile/      # react-native, swift, kotlin
│   │   │   ├── science/     # ml-researcher, data-scientist, bioinformatics, physicist, statistician
│   │   │   ├── business/    # product-manager, analyst, marketer, finance
│   │   │   └── telecom/     # 26 telecom agents in 9 subdirectories
│   │   ├── providers/       # gemini, codex, ruvllm
│   │   ├── pi-pi/           # Expert agents for the pi-pi meta-agent
│   │   ├── factory.md       # Agent factory — generates new agents on demand
│   │   ├── domains.yaml     # Template classes + agent registry manifest
│   │   ├── agent-chain.yaml # Pipeline definitions (11 chains)
│   │   ├── teams.yaml       # Team definitions (22 teams)
│   │   └── *.md             # Core agent personas (14 agents)
│   ├── skills/              # Custom skills — MUST use <name>/SKILL.md layout
│   ├── themes/              # Custom themes (.json) used by theme-cycler
│   ├── damage-control-rules.yaml
│   └── settings.json        # Pi workspace settings (theme, prompts, mcpServers)
├── .rvf/                    # RVF vector storage — gitignored ephemeral state
│   ├── patterns.json        # agent-team task pattern memory
│   ├── docs.json            # ruvector document/code chunk index
│   └── learning/            # SONA + ReasoningBank storage
│       ├── episodes.json    # ReflexionMemory episodes
│       ├── skills.json      # SkillLibrary
│       └── sona-weights.json # SONA adaptive weights
├── justfile                 # just task definitions (28 recipes)
├── CLAUDE.md                # Agent registry, guidelines, and tool reference
├── THEME.md                 # Color token conventions for extension authors
└── TOOLS.md                 # Built-in tool function signatures
```

---


## Orchestrating Multi-Agent Workflows

Pi's architecture makes it easy to coordinate multiple autonomous agents. This playground includes several powerful multi-agent extensions:

### Subagent Widget (`/sub`)
The `subagent-widget` extension allows you to offload isolated tasks to background Pi agents while you continue working in the main terminal. Typing `/sub <task>` spawns a headless subagent that reports its streaming progress via a persistent, live-updating UI widget above your editor.

### Agent Teams (`/team`)
The `agent-team` orchestrator operates as a dispatcher. Instead of answering prompts directly, the primary agent reviews your request, selects a specialist from a defined roster, and delegates the work via a `dispatch_agent` tool.

- Teams are configured in `.pi/agents/teams.yaml` where each top-level key is a team name containing a list of agent names (e.g., `frontend: [planner, builder, bowser]`).
- Individual agent personas (e.g., `builder.md`, `reviewer.md`) live in `.pi/agents/`.
- **pi-pi Meta-Agent**: The `pi-pi` team specifically delegates tasks to specialized Pi framework experts (`ext-expert.md`, `theme-expert.md`, `tui-expert.md`) located in `.pi/agents/pi-pi/` to build high-quality Pi extensions using parallel research.
  - **Web Crawling Fallbacks**: To ingest the latest framework documentation dynamically, these experts use `firecrawl` as their default modern page crawler, but are explicitly programmed to safely fall back to the native `curl` baked into their bash toolset if Firecrawl fails or is unavailable.

#### Agent Team Features

**Commands:**
| Command | Description |
|---------|-------------|
| `/team` | Select a team to work with |
| `/agents-list` | List active agents and status |
| `/agents-grid <1-6>` | Set grid column count |
| `/memory-stats` | Show pattern memory statistics |

**Tools:**
| Tool | Description |
|------|-------------|
| `dispatch_agent` | Send a task to a specialist agent |
| `orchestrate` | Dispatch multiple agents in parallel |
| `swarm_status` | View all active agents |
| `store_pattern` | Save successful task patterns to memory |
| `search_patterns` | Find similar past tasks |
| `get_pattern` | Retrieve a pattern by ID |

**RVF Memory System:**
The extension includes a persistent memory system backed by `@ruvector/rvf-node` HNSW vector storage:
- Patterns persisted to `.rvf/patterns.json`; HNSW index rebuilt from disk on session start
- Hash-based embeddings (384-dim placeholder — upgrade to ruvllm when available)
- O(log n) HNSW search via `VectorDB.withDimensions(384)` (replaces O(n) linear scan)
- Tag-filtered search: wider HNSW query + JS post-filter

**Built-in Teams (22):**
| Team | Agents |
|------|--------|
| `dev` | coordinator, coder, planner, researcher, reviewer, tester |
| `swarm` | coordinator, coder, planner, researcher, reviewer, tester |
| `full` | scout, planner, builder, reviewer, documenter, red-team |
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
| `vector` | ruvector, scout, planner |
| `local` | ruvector, coder, planner, reviewer |
| `research` | researcher, coordinator |

**Built-in Agents (88+):**

Core agents:
| Agent | Description |
|-------|-------------|
| `coordinator` | Hierarchical swarm coordination |
| `coder` | Implementation and refactoring |
| `planner` | Architecture and planning |
| `researcher` | Web research and information |
| `reviewer` | Code review and quality |
| `tester` | Test creation and validation |
| `ruvector` | Vector knowledge — semantic search and document indexing |
| `factory` | Generates new domain expert agents on demand |

Domain experts (61 agents across 9 categories):
| Category | Agents |
|----------|--------|
| Backend (6) | `postgres`, `mongodb`, `redis`, `graphql`, `rust`, `python` |
| Frontend (5) | `react`, `vue`, `threejs`, `tailwind`, `accessibility` |
| Infra (6) | `docker`, `kubernetes`, `aws`, `terraform`, `observability`, `cicd` |
| Security (3) | `auth`, `owasp`, `devsecops` |
| Testing (3) | `cypress`, `jest`, `playwright` |
| Mobile (3) | `react-native`, `swift`, `kotlin` |
| Science (5) | `ml-researcher`, `data-scientist`, `bioinformatics`, `physicist`, `statistician` |
| Business (4) | `product-manager`, `analyst`, `marketer`, `finance` |
| Telecom (26) | `mobility`, `throughput`, `rrm`, `antenna`, `beam`, `power`, `coverage`, `5g-nr`, `4g-lte`, and 17 more |

Provider agents (3):
| Agent | Description |
|-------|-------------|
| `gemini` | Routes tasks to Google Gemini CLI/API |
| `codex` | Routes tasks to OpenAI Codex CLI |
| `ruvllm` | Local model specialist — privacy-first, no internet |

### RuVector Extension (`rvf_*` tools)

The `ruvector` extension provides a semantic knowledge base for RAG — index files/directories and retrieve relevant chunks by meaning, not keyword.

```bash
# In the Pi TUI:
/rvf-index .              # index entire project into .rvf/docs.json
/rvf-index src/           # index a subtree
/rvf-search "auth flow"   # semantic search, top-5 results
/rvf-stats                # total chunks, files, last indexed path
/rvf-clear                # wipe the index
```

LLM-callable tools:
| Tool | Description |
|------|-------------|
| `rvf_index_path(path, label?)` | Chunk + embed files into knowledge base |
| `rvf_search(query, k?)` | Semantic search, returns file:line + similarity score |
| `rvf_get_chunk(id)` | Retrieve full text of a chunk by ID |

- Chunks are ~500 chars with 50-char overlap; stored in `.rvf/docs.json`
- HNSW index rebuilt from disk on each `session_start`
- Run standalone: `pi -e extensions/ruvector.ts`
- Or stack with agent-team for the `vector` and `local` teams

### OpenCode Integration (`oc_*` tools)

The `opencode` extension routes coding tasks to a running `opencode serve` instance. Pi handles conversation; opencode executes file writes and code generation.

```bash
# Start opencode server first:
opencode serve    # listens on http://127.0.0.1:4096

# Connect from Pi TUI:
OC_BASE_URL=http://127.0.0.1:4096 pi -e extensions/opencode.ts
# or after startup:
/oc-connect http://127.0.0.1:4096
/oc-session      # create a session
/oc-status       # check reachability
```

LLM-callable tools:
| Tool | Description |
|------|-------------|
| `oc_run(prompt, files?)` | One-shot via `opencode run --attach` — best for file writes |
| `oc_create_session(name?)` | Start a stateful session (multi-turn coding) |
| `oc_send_message(id, content)` | Send to a session, get response |
| `oc_list_sessions()` | List all sessions on the server |

**When to use each:**
- `oc_run` — quick one-shot tasks: "write X to Y", "refactor Z" — no session overhead, uses CLI
- `oc_send_message` — multi-turn: set context, then iterate ("now add tests", "fix that bug")

### Orchestration Extension (`/provider`, `/swarm`, `/route`)

The `orchestration` extension provides multi-provider routing and swarm coordination. It auto-detects provider availability and routes tasks to the best LLM.

```bash
# In the Pi TUI:
/providers            # list all providers with availability
/provider gemini      # set active provider
/route "complex research task"  # see which provider would handle it
/swarm hierarchical   # initialize swarm topology
```

Provider tools:
| Tool | Description |
|------|-------------|
| `gemini_run(prompt, files?, model?)` | Route to Gemini CLI for research/reasoning |
| `codex_run(prompt, files?, model?)` | Route to Codex CLI for code generation |
| `ruvllm_run(prompt, model?)` | Route to local RuvLLM (privacy-first, no internet) |
| `auto_route(prompt, priority?)` | Auto-select: keywords + complexity heuristic |

Swarm tools:
| Tool | Description |
|------|-------------|
| `swarm_init(topology, maxAgents?)` | Set up swarm topology (hierarchical/mesh/ring/star) |
| `swarm_dispatch(agentId, task)` | Dispatch task to a specific agent |
| `swarm_broadcast(message)` | Broadcast to all active agents |
| `conflict_check(files)` | Detect file conflicts (low/medium/high/critical) |

### Learning Extension (`/learn-stats`, `/remember`, `/skills`)

The `learning` extension provides self-improving agents via SONA three-tier learning. Every completed agent run is automatically captured as an episode and used to improve future predictions.

```bash
/learn-stats          # show episode count, skill count, SONA stats
/remember "auth flow" # search past episodes for similar work
/skills               # list all extracted skills
/forget               # clear all learning data
```

SONA three-tier learning:
- **Tier 1 (<1ms)**: MicroLoRA — instant pattern weight updates on every `agent_end`
- **Tier 2 (~100ms)**: Consolidation — cluster episodes, auto-extract skills
- **Tier 3 (async)**: Deep optimization — full HNSW reindex + weight recalculation

Learning tools:
| Tool | Description |
|------|-------------|
| `reflexion_store_episode(task, critique, outcome)` | Store a learning episode |
| `reflexion_retrieve(query, k?)` | Search similar past episodes |
| `skill_create(name, description, code)` | Create a reusable skill |
| `skill_search(query, k?)` | Find skills by similarity |
| `sona_adapt(query, response, quality)` | Manual SONA weight adaptation |
| `sona_stats()` | View learning statistics |

Storage: `.rvf/learning/` (episodes.json, skills.json, sona-weights.json)

### Agent Chains (`/chain`)
Unlike the dynamic dispatcher, `agent-chain` acts as a sequential pipeline orchestrator. Workflows are defined in `.pi/agents/agent-chain.yaml` where the output of one agent becomes the input (`$INPUT`) to the next.
- Workflows are defined as a list of `steps`, where each step specifies an `agent` and a `prompt`. 
- The `$INPUT` variable injects the previous step's output (or the user's initial prompt for the first step), and `$ORIGINAL` always contains the user's initial prompt.
- Example: The `plan-build-review` pipeline feeds your prompt to the `planner`, passes the plan to the `builder`, and finally sends the code to the `reviewer`.

---

## Safety Auditing & Damage Control

The `damage-control` extension provides real-time security hooks to prevent catastrophic mistakes when agents execute bash commands or modify files. It uses Pi's `tool_call` event to intercept and evaluate every action against `.pi/damage-control-rules.yaml`.

- **Dangerous Commands**: Uses regex (`bashToolPatterns`) to block destructive commands like `rm -rf`, `git reset --hard`, `aws s3 rm --recursive`, or `DROP DATABASE`. Some rules strictly block execution, while others (`ask: true`) pause execution to prompt you for confirmation.
- **Zero Access Paths**: Prevents the agent from reading or writing sensitive files (e.g., `.env`, `~/.ssh/`, `*.pem`).
- **Read-Only Paths**: Allows reading but blocks modifying system files or lockfiles (`package-lock.json`, `/etc/`).
- **No-Delete Paths**: Allows modifying but prevents deleting critical project configuration (`.git/`, `Dockerfile`, `README.md`).

---

## Extension Author Reference

Companion docs cover the conventions used across all extensions in this repo:

- **[COMPARISON.md](COMPARISON.md)** — Feature-by-feature comparison of Claude Code vs Pi Agent across 12 categories (design philosophy, tools, hooks, SDK, enterprise, and more).
- **[RESERVED_KEYS.md](RESERVED_KEYS.md)** — Pi reserved keybindings, overridable keys, and safe keys for extension authors.
- **[THEME.md](THEME.md)** — Color language: which Pi theme tokens (`success`, `accent`, `warning`, `dim`, `muted`) map to which UI roles, with examples.
- **[TOOLS.md](TOOLS.md)** — Function signatures for the built-in tools available inside extensions (`read`, `bash`, `edit`, `write`).

---

## Hooks & Events

Side-by-side comparison of lifecycle hooks in [Claude Code](https://docs.anthropic.com/en/docs/claude-code/hooks) vs [Pi Agent](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md#events).

| Category            | Claude Code                                                      | Pi Agent                                                                                                                | Available In |
| ------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------ |
| **Session**         | `SessionStart`, `SessionEnd`                                     | `session_start`, `session_shutdown`                                                                                     | Both         |
| **Input**           | `UserPromptSubmit`                                               | `input`                                                                                                                 | Both         |
| **Tool**            | `PreToolUse`, `PostToolUse`, `PostToolUseFailure`                | `tool_call`, `tool_result`, `tool_execution_start`, `tool_execution_update`, `tool_execution_end`                       | Both         |
| **Bash**            | —                                                                | `BashSpawnHook`, `user_bash`                                                                                            | Pi           |
| **Permission**      | `PermissionRequest`                                              | —                                                                                                                       | CC           |
| **Compact**         | `PreCompact`                                                     | `session_before_compact`, `session_compact`                                                                             | Both         |
| **Branching**       | —                                                                | `session_before_fork`, `session_fork`, `session_before_switch`, `session_switch`, `session_before_tree`, `session_tree` | Pi           |
| **Agent / Turn**    | —                                                                | `before_agent_start`, `agent_start`, `agent_end`, `turn_start`, `turn_end`                                              | Pi           |
| **Message**         | —                                                                | `message_start`, `message_update`, `message_end`                                                                        | Pi           |
| **Model / Context** | —                                                                | `model_select`, `context`                                                                                               | Pi           |
| **Sub-agents**      | `SubagentStart`, `SubagentStop`, `TeammateIdle`, `TaskCompleted` | —                                                                                                                       | CC           |
| **Config**          | `ConfigChange`                                                   | —                                                                                                                       | CC           |
| **Worktree**        | `WorktreeCreate`, `WorktreeRemove`                               | —                                                                                                                       | CC           |
| **System**          | `Stop`, `Notification`                                           | —                                                                                                                       | CC           |



## Resources

## Pi Documentation

| Doc                                                                                                     | Description                        |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| [Mario's Twitter](https://x.com/badlogicgames)                                                          | Creator of Pi Coding Agent         |
| [README.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md)              | Overview and getting started       |
| [sdk.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/sdk.md)               | TypeScript SDK reference           |
| [rpc.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/rpc.md)               | RPC protocol specification         |
| [json.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/json.md)             | JSON event stream format           |
| [providers.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/providers.md)   | API keys and provider setup        |
| [models.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/models.md)         | Custom models (Ollama, vLLM, etc.) |
| [extensions.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md) | Extension system                   |
| [skills.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md)         | Skills (Agent Skills standard)     |
| [settings.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/settings.md)     | Configuration                      |
| [compaction.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/compaction.md) | Context compaction                 |


## Master Agentic Coding
> Prepare for the future of software engineering

Learn tactical agentic coding patterns with [Tactical Agentic Coding](https://agenticengineer.com/tactical-agentic-coding?y=pivscc)

Follow the [IndyDevDan YouTube channel](https://www.youtube.com/@indydevdan) to improve your agentic coding advantage.
