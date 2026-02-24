---
name: "agent-coordination"
description: "Multi-agent orchestration with shared vector memory, DAG scheduling, CRDT-based credit economy, and RVF-backed agent brains."
---

# Agent Coordination

> Consolidated from: `@ruvector/agentic-integration`, `@ruvector/rudag`, `@ruvector/economy-wasm`. Part of the [RuVector Plugin](../../SKILL.md).

## RVF Agent Memory & MCP Integration

Agents use RVF files as portable, sealed memory units. The `@ruvector/rvf-mcp-server` MCP server lets Claude Code, Cursor, and other AI tools create, query, and manage vector stores directly via the Model Context Protocol.

| MCP Tool | Description |
|----------|-------------|
| `rvf_create_store` | Create a new RVF vector store |
| `rvf_open_store` | Open existing store (read-write or read-only) |
| `rvf_ingest` | Insert vectors with optional metadata |
| `rvf_query` | k-NN similarity search with metadata filters |
| `rvf_compact` | Compact store to reclaim dead space |
| `rvf_status` | Get store status (dimensions, vector count) |

```bash
# Add MCP server to Claude Code
npx @ruvector/rvf-mcp-server --transport stdio
```

**Agentic RVF units** combine ruvLLM inference, MicroLoRA, vector search, GNN, quantum state, and witness chain into self-booting agent brains. Use cases: autonomous edge agents, air-gapped research agents, satellite-based anomaly detection.

## Package Overview

| Package | Purpose | Runtime |
|---------|---------|---------|
| `@ruvector/agentic-integration` | Agent coordinator, shared vector memory, task routing | Node.js |
| `@ruvector/rudag` | DAG scheduling, topological sort, critical path | Rust/WASM |
| `@ruvector/economy-wasm` | CRDT credit economy, conflict-free token transfers | WASM |

## Core API

### AgentCoordinator

```typescript
import { AgentCoordinator } from '@ruvector/agentic-integration';
const coordinator = new AgentCoordinator({
  memory: { dimensions: 1536, metric: 'cosine' },
  maxAgents: 10, taskTimeout: 30_000,
  routingStrategy: 'capability', // also: 'round-robin', 'load-balanced'
});

coordinator.registerAgent({ id: 'coder', capabilities: ['code', 'debug', 'test'], maxConcurrent: 3 });
coordinator.registerAgent({ id: 'researcher', capabilities: ['search', 'summarize'] });

const result = await coordinator.dispatch({
  description: 'Implement user auth', requiredCapabilities: ['code'], priority: 5,
});

await coordinator.memory.store('auth-pattern', embedding, { text: 'JWT with refresh tokens' });
const relevant = await coordinator.memory.search(queryEmbedding, 5);
coordinator.connectClaudeFlow({ endpoint: 'http://localhost:3000' });
```

### DAG

```typescript
import { DAG } from '@ruvector/rudag';
const dag = new DAG();
dag.addNode('compile', { weight: 10 }); dag.addNode('test', { weight: 5 });
dag.addEdge('compile', 'test');

dag.topologicalSort();       // ['compile', 'test']
dag.criticalPath();          // { path: [...], totalWeight: 15 }
dag.parallelLevels();        // [['compile'], ['test']]
dag.hasCycle();              // false

await dag.execute(async (nodeId) => runTask(nodeId), { maxParallel: 4 });
```

### CreditEconomy (CRDT)

```typescript
import init, { CreditEconomy } from '@ruvector/economy-wasm';
await init();
const economy = new CreditEconomy({ nodeId: 'orchestrator', initialSupply: 1_000_000 });

economy.mint('agent-coder', 1000);
economy.transfer('agent-coder', 'agent-researcher', 200);
economy.balance('agent-coder');     // 800

economy.merge(remoteState);         // Conflict-free CRDT sync
const state = economy.exportState();
```

## Common Patterns

### Agentic RAG Pipeline

```typescript
coordinator.registerAgent({ id: 'retriever', capabilities: ['search'] });
coordinator.registerAgent({ id: 'generator', capabilities: ['generate'] });
const context = await coordinator.dispatch({ requiredCapabilities: ['search'] });
const answer = await coordinator.dispatch({ requiredCapabilities: ['generate'], context: [context.output] });
```

### CI/CD Pipeline DAG

```typescript
const pipeline = new DAG();
pipeline.addNode('lint'); pipeline.addNode('test'); pipeline.addNode('build');
pipeline.addEdge('lint', 'build'); pipeline.addEdge('test', 'build');
pipeline.parallelLevels(); // [['lint', 'test'], ['build']]
```

## Related

- [Commands](../../commands/agent-coordination.md)
- [Workflow](../../workflows/10-multi-agent-coord.md)
- [RVF Cognitive Containers](../../workflows/15-rvf-cognitive-containers.md)
