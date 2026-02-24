---
name: claude-flow-swarm-coordination
description: >
  Multi-agent swarm coordination with 4 topologies (hierarchical, mesh, star, ring),
  hive-mind Byzantine consensus, auto-scaling, and specialized strategies. Use when
  orchestrating multiple agents for complex tasks requiring parallel execution,
  fault tolerance, or coordinated decision-making.
---

# Swarm Coordination

## Initialize a Swarm

```bash
# Standard hierarchical swarm (recommended for coding)
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized

# Mesh swarm for research
npx @claude-flow/cli@latest swarm init --topology mesh --max-agents 6 --strategy collaborative

# V3 mode with all features
npx @claude-flow/cli@latest swarm init --v3-mode --topology hierarchical
```

## Topology Selection Matrix

| Factor | Hierarchical | Mesh | Star | Ring |
|--------|-------------|------|------|------|
| Communication | Top-down | Peer-to-peer | Hub-spoke | Sequential |
| Fault tolerance | Medium | High | Low (hub is SPOF) | Low |
| Coordination | Strong | Eventual | Centralized | Token-based |
| Best for | Coding tasks | Research, brainstorm | Simple delegation | Pipeline processing |
| Max agents | 6-8 | 4-6 | 3-10 | 4-8 |
| Consensus | Raft | Gossip | Central | Token-passing |

### Hierarchical (Default)

Leader coordinates workers. Best for structured coding tasks with clear ownership.

```
       Leader
      /  |   \
  Coder Tester Reviewer
```

### Mesh

Every agent communicates with every other. Best for research and collaborative exploration.

```
  A --- B
  |\ /|
  | X  |
  |/ \|
  C --- D
```

### Star

Central hub delegates to spoke agents. Simple but hub is single point of failure.

### Ring

Token-passing for sequential pipeline processing. Each agent processes and passes to next.

## Execution Rules

1. **ALL agent Task calls in ONE message** - parallel execution
2. **Always `run_in_background: true`** for agent tasks
3. **STOP after spawning** - do NOT poll or check status
4. **Wait for results** - agents report back automatically
5. **Review ALL results** before proceeding

## Swarm Management

```bash
# Check swarm status
npx @claude-flow/cli@latest swarm status

# Scale up/down
npx @claude-flow/cli@latest swarm scale --count 10
npx @claude-flow/cli@latest swarm scale --count 4

# Stop swarm
npx @claude-flow/cli@latest swarm stop
```

## Hive-Mind Consensus

Byzantine fault-tolerant consensus for swarm-wide decisions:

```bash
# Initialize hive-mind
npx @claude-flow/cli@latest hive-mind init --consensus raft

# Propose a decision
npx @claude-flow/cli@latest hive-mind propose --topic "architecture-choice" --options "monolith,microservices,serverless"

# Vote
npx @claude-flow/cli@latest hive-mind vote --topic "architecture-choice" --choice "microservices"

# Check consensus status
npx @claude-flow/cli@latest hive-mind status --topic "architecture-choice"
```

## Common Swarm Patterns

### Development Swarm (6 agents)
```
Leader: planner
Workers: coder x2, tester, reviewer, researcher
Topology: hierarchical
Strategy: specialized
```

### Research Swarm (4 agents)
```
All peers: researcher x4
Topology: mesh
Strategy: collaborative
```

### Testing Swarm (5 agents)
```
Leader: tester
Workers: tester x3, reviewer
Topology: hierarchical
Strategy: specialized
```

### Analysis Swarm (4 agents)
```
Hub: analyzer
Spokes: researcher, performance-engineer, security-architect
Topology: star
Strategy: specialized
```

## Anti-Drift Rules

- Keep maxAgents at 6-8 for tight coordination
- Use `raft` consensus for hive-mind (leader maintains authoritative state)
- Run frequent checkpoints via `post-task` hooks
- Keep shared memory namespace for all agents
- Use specialized strategy for clear role boundaries
