# Agent Coordination

> Part of the [RuVector Plugin](../SKILL.md). See also: [attention](attention.md), [data-generation](data-generation.md).

## AgentCoordinator Setup

```typescript
import { AgentCoordinator, VectorMemory, TaskRouter } from '@ruvector/agentic-integration';

const coordinator = new AgentCoordinator({
  memory: { dimensions: 1536, metric: 'cosine' },
  maxAgents: 10,
  taskTimeout: 30_000,
  routingStrategy: 'capability', // 'capability' | 'round-robin' | 'load-balanced'
});
```

## Capability-Based Routing

```typescript
// Register agents with capabilities
coordinator.registerAgent({
  id: 'researcher',
  capabilities: ['search', 'summarize'],
  model: 'claude-sonnet-4-5-20250929',
  maxConcurrent: 3,
  priority: 10,
});

coordinator.registerAgent({
  id: 'coder',
  capabilities: ['code', 'debug', 'test'],
  model: 'claude-sonnet-4-5-20250929',
});

// Configure task router with rules
const router = new TaskRouter({ strategy: 'capability', fallback: 'round-robin' });
router.addRule({ capability: 'code', preferAgent: 'coder' });
router.addRule({ capability: 'search', preferAgent: 'researcher' });
```

## Task Dispatch and Shared Memory

```typescript
// Dispatch task to best-fit agent
const result = await coordinator.dispatch({
  description: 'Implement user authentication',
  requiredCapabilities: ['code'],
  context: relevantDocs,
  priority: 5,
});

// Shared vector memory: store, search, get, delete
await coordinator.memory.store('auth-pattern', embedding, { text: 'JWT with refresh tokens' });
const relevant = await coordinator.memory.search(queryEmbedding, 5);
```

## DAG Workflow Scheduling

```typescript
import { DAG } from '@ruvector/rudag';

const dag = new DAG();
dag.addNode('compile', { weight: 10 });
dag.addNode('test', { weight: 5 });
dag.addNode('deploy', { weight: 3 });
dag.addEdge('compile', 'test');
dag.addEdge('test', 'deploy');

// Critical path analysis
const path = dag.criticalPath();
// { path: ['compile', 'test', 'deploy'], totalWeight: 18 }

// Parallel execution levels
const levels = dag.parallelLevels();
// [['compile'], ['test'], ['deploy']]

// Schedule with concurrency limit
const schedule = dag.schedule({ maxParallel: 4 });

// Execute with async runner
await dag.execute(async (nodeId, data) => {
  return await runTask(nodeId);
}, { maxParallel: 4 });
```

## CRDT Economy

```typescript
import init, { CreditEconomy, CRDTCounter } from '@ruvector/economy-wasm';
await init();

const economy = new CreditEconomy({
  nodeId: 'orchestrator',
  initialSupply: 1_000_000,
  mintAuthority: 'system',
  maxSupply: Infinity,
  transferFee: 0,  // basis points
});

// Mint credits to agents
economy.mint('agent-coder', 1000);
economy.mint('agent-researcher', 500);

// Transfer between agents
economy.transfer('agent-coder', 'agent-researcher', 200);

// Check balances
economy.balance('agent-coder');       // 800
economy.balance('agent-researcher');   // 700

// CRDT merge -- conflict-free, commutative, idempotent
const remoteState = getRemoteNodeState();
economy.merge(remoteState);
const state = economy.exportState();  // replicate to other nodes
```

## Events

Events: `task:dispatched`, `task:completed`, `task:failed`, `agent:registered`, `agent:idle`, `memory:stored`.

## Source Packages

- [@ruvector/agentic-integration](https://www.npmjs.com/package/@ruvector/agentic-integration) -- Agent coordination, routing, shared memory
- [@ruvector/rudag](https://www.npmjs.com/package/@ruvector/rudag) -- DAG scheduling, critical path, topological sort
- [@ruvector/economy-wasm](https://www.npmjs.com/package/@ruvector/economy-wasm) -- CRDT credit economy
