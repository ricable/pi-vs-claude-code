# Topology Selection Guide

## Quick Decision Matrix

| Your Task | Recommended | Agents | Why |
|-----------|------------|--------|-----|
| Build a feature | Hierarchical | 6-8 | Clear ownership, leader coordinates |
| Research a topic | Mesh | 4-6 | Peer collaboration, shared findings |
| Simple delegation | Star | 3-10 | Hub distributes, collects results |
| Data pipeline | Ring | 4-8 | Sequential processing stages |
| Unknown/complex | Hierarchical | 6-8 | Safe default, most flexible |

## Hierarchical Topology

```
        Leader (planner)
       /    |    \
   Coder  Tester  Reviewer
   /   \
Coder  Coder
```

**Consensus**: Raft (leader-based)
**Communication**: Top-down directives, bottom-up reports
**Fault tolerance**: Medium (leader is coordinator, not SPOF since workers continue)
**Scaling**: Add workers under leader, up to max-agents

**Best for**:
- Feature development with clear task decomposition
- Code review workflows (reviewer needs all context)
- TDD workflows (tester validates coder output)

**Anti-patterns**:
- Too many levels of hierarchy (keep to 2 levels max)
- Bottleneck at leader (distribute decision-making)

## Mesh Topology

```
  Agent-A --- Agent-B
  |  \    /   |
  |   \  /    |
  |    \/     |
  |    /\     |
  |   /  \    |
  |  /    \   |
  Agent-C --- Agent-D
```

**Consensus**: Gossip (eventual consistency)
**Communication**: Every agent talks to every other
**Fault tolerance**: High (no single point of failure)
**Scaling**: Limited by O(n^2) communication overhead

**Best for**:
- Research and exploration tasks
- Brainstorming where every perspective matters
- Redundancy-critical workflows

**Anti-patterns**:
- More than 6 agents (communication overhead explodes)
- Tasks requiring strict ordering

## Star Topology

```
       Agent-A
       /
  Hub ---Agent-B
       \
       Agent-C
```

**Consensus**: Central (hub decides)
**Communication**: Hub-to-spoke only
**Fault tolerance**: Low (hub is SPOF)
**Scaling**: Easy to add spokes

**Best for**:
- Simple task delegation (map-reduce pattern)
- Aggregation workflows
- When one coordinator needs all results

**Anti-patterns**:
- Hub becomes bottleneck with many spokes
- Tasks requiring inter-spoke communication

## Ring Topology

```
  Agent-A --> Agent-B --> Agent-C --> Agent-D
     ^                                  |
     |__________________________________|
```

**Consensus**: Token-passing
**Communication**: Sequential, next-in-ring only
**Fault tolerance**: Low (broken link stops pipeline)
**Scaling**: Linear, each stage adds latency

**Best for**:
- Pipeline processing (parse -> transform -> validate -> deploy)
- Sequential workflows where each stage builds on previous
- Data transformation chains

**Anti-patterns**:
- Tasks requiring parallel execution
- High fan-out workloads

## Strategy Options

| Strategy | Description | Use With |
|----------|-------------|----------|
| `specialized` | Each agent has distinct role | Hierarchical, Star |
| `collaborative` | Agents share similar roles | Mesh |
| `competitive` | Agents race for best solution | Mesh, Star |
| `pipeline` | Sequential processing chain | Ring |

## Configuration

```bash
# Hierarchical (default for coding)
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized

# Mesh (for research)
npx @claude-flow/cli@latest swarm init --topology mesh --max-agents 5 --strategy collaborative

# Star (for simple delegation)
npx @claude-flow/cli@latest swarm init --topology star --max-agents 6 --strategy specialized

# Ring (for pipelines)
npx @claude-flow/cli@latest swarm init --topology ring --max-agents 4 --strategy pipeline
```
