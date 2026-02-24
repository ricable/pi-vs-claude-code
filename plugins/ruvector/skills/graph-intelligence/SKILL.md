---
name: "graph-intelligence"
description: "Graph databases (Node.js + WASM), GNN layers (GraphConv, GAT), Cypher queries, graph algorithms, synthetic graph generation, and RVF GRAPH_SEG for portable graph state."
---

# Graph Intelligence

> Consolidated from: `@ruvector/gnn`, `@ruvector/gnn-wasm`, `@ruvector/graph-node`, `@ruvector/graph-wasm`, `@ruvector/graph-data-generator`. Part of the [RuVector Plugin](../../SKILL.md).

## RVF Graph State (GRAPH_SEG)

Pre-trained GNN models, dynamic graph embeddings, and relationship structures seal into RVF files via `GRAPH_SEG`. This replaces the need for separate graph databases -- one `.rvf` file carries vectors, graph adjacency, edge weights, and graph state together.

| Use Case | What Ships in RVF |
|----------|-------------------|
| Fraud detection | GNN anomaly model + transaction embeddings + witness chain |
| Supply chain monitoring | Pathway graph + supplier embeddings + LoRA updates |
| Knowledge graph RAG | Entity embeddings + relationship graph + query index |
| Molecular interaction | GNN state + molecular embeddings + quantum sketches |

## Package Overview

| Package | Purpose | Runtime |
|---------|---------|---------|
| `@ruvector/graph-node` | Graph DB with Cypher, hypergraph, PageRank | Node.js (NAPI) |
| `@ruvector/graph-wasm` | Graph DB for browser/edge (~150KB) | WASM |
| `@ruvector/gnn` | GNN pipeline: GraphConv, GATLayer | Node.js |
| `@ruvector/gnn-wasm` | GNN inference in browser/edge | WASM |
| `@ruvector/graph-data-generator` | Synthetic graph generation, AI properties | Node.js |

## Core API

### GraphDB (Node.js)

```typescript
import { GraphDB } from '@ruvector/graph-node';
const gdb = new GraphDB({ persistPath: './graph-data', enableCypher: true, enableHypergraph: true });

await gdb.addVertex('user', { name: 'Alice' });
await gdb.addEdge('user:1', 'user:2', 'KNOWS', { since: 2024 });
await gdb.query("MATCH (a)-[:KNOWS]->(b) RETURN a.name, b.name");
await gdb.shortestPath('user:1', 'user:5');
await gdb.pageRank({ iterations: 20 });
```

### WasmGraphDB (browser/edge)

```typescript
import init, { WasmGraphDB } from '@ruvector/graph-wasm';
await init();
const gdb = new WasmGraphDB();
gdb.addVertex('user', JSON.stringify({ name: 'Alice' }));
gdb.addEdge('user:0', 'user:1', 'KNOWS');
gdb.query("MATCH (a)-[:KNOWS]->(b) RETURN a, b");
```

### GNN Pipeline

```typescript
import { GNN, GraphConv, GATLayer } from '@ruvector/gnn';
const gnn = new GNN({
  layers: [GraphConv(128), GATLayer(64, { heads: 4 }), GraphConv(numClasses)],
  activation: 'relu', dropout: 0.5,
});
await gnn.train(graphData, { epochs: 200, earlyStopping: { patience: 10 } });
const embeddings = await gnn.forward(graphData);
```

### GNN WASM

```typescript
import init, { WasmGNN } from '@ruvector/gnn-wasm';
await init();
const gnn = new WasmGNN({ layers: ['gcn', 'gat', 'sage'], hiddenDim: 64, outputDim: 32, simd: true });
gnn.loadWeights(modelBuffer);
const output = gnn.forward(nodeFeatures, edgeIndex);
```

### GraphGenerator

```typescript
import { GraphGenerator } from '@ruvector/graph-data-generator';
const gen = new GraphGenerator({
  nodes: 10000, density: 0.01, topology: 'scale-free', // also: small-world, random, hierarchical
  labels: ['User', 'Post'], seed: 42,
});
await gen.generate();
await gen.export('cypher', './seed.cypher');  // Also: json, graphml, csv, dot
const social = GraphGenerator.template('social-network', { users: 500 });
```

## Common Patterns

### Knowledge Graph for RAG

```typescript
await gdb.query("CREATE (t:Topic {name: 'ML'})");
await gdb.query("CREATE (c:Concept {name: 'Neural Networks'})");
await gdb.query("MATCH (t:Topic {name:'ML'}),(c:Concept {name:'Neural Networks'}) CREATE (t)-[:CONTAINS]->(c)");
```

## Related

- [Workflow](../../workflows/04-graph-neural-networks.md)
- [RVF Cognitive Containers](../../workflows/15-rvf-cognitive-containers.md)
