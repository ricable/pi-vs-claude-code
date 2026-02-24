---
name: claude-flow
description: >
  Enterprise AI agent orchestration workflow using Ruflo v3. Use this skill when orchestrating
  multi-agent swarms, managing HNSW vector memory, configuring self-learning hooks, running
  MCP servers, performing security scans, deploying agents, or following SPARC methodology.
  Triggers on: (1) Agent spawning and lifecycle management, (2) Swarm coordination across
  topologies (hierarchical, mesh, star, ring), (3) Memory operations (store, search, HNSW indexing),
  (4) Hook configuration and ReasoningBank learning, (5) MCP tool execution with 213+ tools,
  (6) Security scanning and AIDefence, (7) Performance benchmarking, (8) Deployment and rollback,
  (9) SPARC workflow phases, (10) Any multi-agent coordination task.
---

# Claude Flow v3 - Enterprise AI Orchestration

Unified workflow for the Ruflo v3 platform. This skill synthesizes 25+ claude-flow sub-skills
into actionable workflows with decision trees.

## Quick Start

```bash
# Install and start
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest
npx @claude-flow/cli@latest daemon start
npx @claude-flow/cli@latest doctor --fix

# Initialize a project
npx @claude-flow/cli@latest init --wizard

# Spawn an agent
npx @claude-flow/cli@latest agent spawn -t coder --name my-coder

# Start a swarm
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

## Workflow Decision Tree

Choose workflow based on task complexity:

| Task Type | Workflow | Sub-Skill |
|-----------|----------|-----------|
| Single agent task | Agent spawn + execute | [setup](skills/setup/SKILL.md) |
| Multi-agent collaboration | Swarm init + coordinate | [swarm-coordination](skills/swarm-coordination/SKILL.md) |
| Knowledge persistence | Memory store/search | [memory-management](skills/memory-management/SKILL.md) |
| Pattern learning | Hooks + ReasoningBank | [hooks-learning](skills/hooks-learning/SKILL.md) |
| Security audit | Scan + defend | [security-defence](skills/security-defence/SKILL.md) |
| Tool integration | MCP server + providers | [mcp-integration](skills/mcp-integration/SKILL.md) |
| Production deploy | Release + rollback | [deployment-ops](skills/deployment-ops/SKILL.md) |

## 3-Tier Model Routing (ADR-026)

Before spawning agents, check for routing recommendations:

| Tier | Handler | Latency | Cost | When to Use |
|------|---------|---------|------|-------------|
| 1 | Agent Booster (WASM) | <1ms | $0 | Simple transforms: var to const, add types, rename. Use Edit tool directly |
| 2 | Haiku | ~500ms | $0.0002 | Complexity <30%: simple tasks, formatting, basic refactors |
| 3 | Sonnet/Opus | 2-5s | $0.003+ | Complexity >30%: architecture, security review, complex reasoning |

When `[AGENT_BOOSTER_AVAILABLE]` appears, skip LLM and use Edit tool directly.
When `[TASK_MODEL_RECOMMENDATION]` appears, use the recommended tier.

## Core Workflow: Swarm Execution

Standard pattern for multi-agent tasks:

```
1. Initialize swarm topology
   npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8

2. Spawn agents (ALL in ONE message, run_in_background: true)
   Task tool: coder, tester, reviewer agents in parallel

3. STOP - do NOT poll or check status
   Wait for agent results to arrive

4. Review ALL results together
   Synthesize outputs, resolve conflicts

5. Store patterns in memory
   npx @claude-flow/cli@latest memory store --key "pattern-name" --value "learned pattern"
```

## Agent Catalog (60+ Types)

**Core**: coder, reviewer, tester, planner, researcher
**Security**: security-architect, security-auditor, pii-detector, aidefence-guardian
**Swarm**: hierarchical-coordinator, mesh-coordinator, adaptive-coordinator
**GitHub**: pr-manager, code-review-swarm, issue-tracker, release-manager
**SPARC**: sparc-coord, specification, pseudocode, architecture, refinement
**Memory**: memory-specialist, swarm-memory-manager, reasoningbank-learner
**Performance**: performance-engineer, performance-optimizer, perf-analyzer

Full catalog: [references/agent-catalog.md](references/agent-catalog.md)

## Topology Selection

| Topology | Best For | Agents | Consensus |
|----------|----------|--------|-----------|
| Hierarchical | Coding, structured tasks | 6-8 | Raft (leader-based) |
| Mesh | Research, peer collaboration | 4-6 | Gossip |
| Star | Hub-and-spoke, central coordinator | 3-10 | Central |
| Ring | Pipeline processing, sequential | 4-8 | Token-passing |

Default: **hierarchical** with **specialized** strategy for coding tasks.

Detailed guide: [references/topology-guide.md](references/topology-guide.md)

## Memory Operations

```bash
# Store a pattern
npx @claude-flow/cli@latest memory store --key "auth-pattern" --value "JWT with refresh tokens" --namespace patterns --tags "auth,security"

# Semantic search (HNSW-indexed, 150x faster)
npx @claude-flow/cli@latest memory search --query "authentication patterns" --limit 5

# Retrieve specific key
npx @claude-flow/cli@latest memory retrieve --key "auth-pattern" --namespace patterns

# List all in namespace
npx @claude-flow/cli@latest memory list --namespace patterns --limit 10
```

## CLI Command Reference

26 commands, 140+ subcommands. Most used:

| Command | Key Subcommands | Purpose |
|---------|----------------|---------|
| `init` | `--wizard`, `--v3-mode` | Project setup |
| `agent` | `spawn`, `list`, `stop`, `exec` | Agent lifecycle |
| `swarm` | `init`, `status`, `scale`, `stop` | Multi-agent coordination |
| `memory` | `store`, `search`, `retrieve`, `list` | HNSW vector memory |
| `hooks` | `add`, `list`, `enable`, `disable` | Event-driven automation |
| `hive-mind` | `init`, `propose`, `vote`, `status` | Byzantine consensus |
| `task` | `create`, `assign`, `status`, `complete` | Task management |
| `session` | `start`, `save`, `restore`, `list` | Session state |

Full reference: [references/cli-commands.md](references/cli-commands.md)

## MCP Tools (213+)

Start the MCP server:
```bash
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest
```

Tool categories: coordination (swarm/agent/task), monitoring (metrics/bottleneck/performance),
memory (store/search/HNSW), GitHub (repo/PR/issue), workers (12 specialized).

Full catalog: [references/mcp-tools.md](references/mcp-tools.md)

## Security Workflow

```bash
# Full security scan
npx @claude-flow/cli@latest security scan --deep

# AIDefence analysis
npx @claude-flow/cli@latest security defend --input "user text" --level strict

# PII detection
npx @claude-flow/cli@latest security scan --pii

# Secret scanning
npx @claude-flow/cli@latest security secrets --path ./src
```

Details: [security-defence skill](skills/security-defence/SKILL.md)

## Health Check

Run diagnostics:
```bash
npx @claude-flow/cli@latest doctor --fix
```

Or use the bundled script:
```bash
bash plugins/claude-flow/scripts/health-check.sh
```

## SPARC Methodology

Five-phase development workflow:

1. **Specification** - Requirements analysis, constraint identification
2. **Pseudocode** - Algorithm design, logic flow
3. **Architecture** - System design, component boundaries
4. **Refinement** - Iterative improvement, optimization
5. **Completion** - Integration testing, deployment

Each phase maps to specialized agents: `specification`, `pseudocode`, `architecture`, `refinement`, `sparc-coder`.

## Self-Learning Pipeline

Hooks capture execution patterns via ReasoningBank:

```
RETRIEVE -> JUDGE -> DISTILL -> CONSOLIDATE
```

1. **RETRIEVE**: Find similar past patterns (HNSW search)
2. **JUDGE**: Evaluate outcome (success/failure/partial)
3. **DISTILL**: Extract reusable pattern
4. **CONSOLIDATE**: Merge into long-term memory (EWC++ prevents forgetting)

Details: [hooks-learning skill](skills/hooks-learning/SKILL.md)
