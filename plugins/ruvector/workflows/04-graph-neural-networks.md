# Workflow 4: Graph Neural Networks & Knowledge Graphs

> Back to [RuVector Hub](../SKILL.md)

**Goal:** Build graph-powered search that learns from usage with GNN layers and Cypher queries.

### Step 1: Create Graph Database

```typescript
import { GraphDB } from '@ruvector/graph-node';

const graph = new GraphDB({
  persistPath: './knowledge.db',
  enableCypher: true,
  enableHypergraph: true,
});
```

### Step 2: Build Knowledge Graph

```typescript
// Create entities
await graph.addVertex('person', { name: 'Alice', embedding: aliceVec });
await graph.addVertex('person', { name: 'Bob', embedding: bobVec });
await graph.addEdge('person:1', 'person:2', 'KNOWS', { since: 2020 });

// Or use Cypher
await graph.query(`
  CREATE (a:Person {name: 'Alice'})-[:KNOWS {since: 2020}]->(b:Person {name: 'Bob'})
`);
```

### Step 3: Apply GNN Layers

```typescript
import { GNN } from '@ruvector/gnn';

const gnn = new GNN({
  layers: [GraphConv(64), GATLayer(32)],
  activation: 'relu',
  dropout: 0.5,
});

// Train GNN
const result = await gnn.train(graphData, { epochs: 100, lr: 0.001 });

// Generate graph embeddings
const embeddings = await gnn.forward(nodeFeatures);
```

### Step 4: GNN-Enhanced Search

```
Query → HNSW Index → GNN Layer → Enhanced Results
              ↑                      │
              └──── learns from ─────┘
```

The GNN layer applies multi-head attention to weigh which neighbors matter, updates representations based on graph structure, and reinforces frequently-accessed paths.

### Step 5: Graph Algorithms

```typescript
const pagerank = await graph.pageRank();
const communities = await graph.connectedComponents();
const path = await graph.shortestPath('person:1', 'person:5');
const central = await graph.degreeCentrality();
```

### Step 6: Synthetic Graph Data (for testing)

```typescript
import { GraphGenerator } from '@ruvector/graph-data-generator';

const gen = new GraphGenerator({
  nodes: 10000,
  density: 0.1,
  topology: 'scale-free',
});
const testGraph = await gen.generate();
await gen.export('cypher', './test-graph.cypher');
```

**Related skills:** `ruvector-gnn`, `ruvector-gnn-wasm`, `ruvector-graph-node`, `ruvector-graph-wasm`, `ruvector-graph-data-generator`
