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

## Teams (22 defined) — `.pi/agents/teams.yaml`

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

## Chains (11 defined) — `.pi/agents/agent-chain.yaml`

| Chain | Description |
|-------|-------------|
| `plan-build-review` | Standard dev cycle: planner → builder → reviewer |
| `expert-build` | Domain expert: planner → coder → reviewer |
| `provider-research` | RAG research: ruvector → researcher → planner |
| `learn-improve` | Pattern-aware: scout → ruvector → coder |
| `full-swarm` | Coordinator dispatches parallel experts |
| `mega-swarm` | All experts → reviewer → documenter |
| `telecom-analysis` | RRM → throughput → learning |

## Quick Commands

```bash
# Core sessions
just pi                   # Plain Pi
just ext-agent-team       # Multi-agent dispatcher
just ext-orchestration    # Provider routing + swarm
just ext-learning         # Self-learning extension
just ext-mega             # All extensions combined

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
