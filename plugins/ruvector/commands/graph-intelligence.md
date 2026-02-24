# Graph Intelligence

> Part of the [RuVector Plugin](../SKILL.md). See also: [vector-search](vector-search.md), [edge-wasm](edge-wasm.md).

## GraphDB Setup

```typescript
import { GraphDB } from '@ruvector/graph-node';

const gdb = new GraphDB({
  persistPath: './graph-data',
  enableCypher: true,
  enableHypergraph: false,
  maxVertices: 10000,
});
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `persistPath` | `string` | In-memory | Persistence directory |
| `enableCypher` | `boolean` | `true` | Enable Cypher query engine |
| `enableHypergraph` | `boolean` | `false` | Edges connecting 3+ vertices |
| `maxVertices` | `number` | `10000` | Pre-allocate vertex capacity |

## Vertex and Edge Operations

```typescript
// Add vertex with label and properties
const id = await gdb.addVertex('user', { name: 'Alice', age: 30 });

// Get, update, delete vertex
const vertex = await gdb.getVertex(id);
await gdb.updateVertex(id, { age: 31 });
await gdb.deleteVertex(id); // Removes connected edges too

// List vertices by label
const users = await gdb.getVerticesByLabel('user');

// Add edge with label and properties
const edgeId = await gdb.addEdge('user:1', 'user:2', 'KNOWS', { since: 2024 });
const edges = await gdb.getEdges('user:1', 'user:2');
await gdb.deleteEdge(edgeId);
```

## Cypher Queries

```typescript
// Create nodes
await gdb.query("CREATE (n:Person {name: 'Alice', age: 30})");

// Match and return
const result = await gdb.query("MATCH (n:Person) WHERE n.age > 25 RETURN n");

// Create relationships
await gdb.query(
  "MATCH (a:Person {name:'Alice'}), (b:Person {name:'Bob'}) CREATE (a)-[:KNOWS]->(b)"
);

// Pattern matching
const result = await gdb.query(
  "MATCH (a)-[:KNOWS]->(b)-[:KNOWS]->(c) RETURN DISTINCT c.name"
);

// Parameterized queries
const result = await gdb.query(
  "MATCH (n:Person {name: $name}) RETURN n",
  { name: 'Alice' }
);

// Recommendation pattern
const recs = await gdb.query(`
  MATCH (u:User {id: $userId})-[:PURCHASED]->(p)<-[:PURCHASED]-(other)-[:PURCHASED]->(rec)
  WHERE NOT (u)-[:PURCHASED]->(rec)
  RETURN rec.name, count(*) AS score ORDER BY score DESC LIMIT 5
`, { userId: 'user-123' });
```

## Graph Algorithms

```typescript
// Neighbors with depth
const neighbors = await gdb.neighbors('user:1', { direction: 'out', depth: 2 });

// Shortest path
const path = await gdb.shortestPath('user:1', 'user:5');

// All paths (bounded)
const paths = await gdb.allPaths('user:1', 'user:5', { maxDepth: 5 });

// PageRank
const ranks = await gdb.pageRank({ iterations: 20, damping: 0.85 });

// Connected components
const components = await gdb.connectedComponents();

// Degree centrality
const centrality = await gdb.degreeCentrality();
```

## GNN Layers: GraphConv and GATLayer

```typescript
import { GNN, GraphConv, GATLayer } from '@ruvector/gnn';

// Compose a GNN pipeline
const gnn = new GNN({
  layers: [GraphConv(128), GATLayer(64, { heads: 4 }), GraphConv(numClasses)],
  activation: 'relu',     // 'relu' | 'elu' | 'leaky_relu' | 'sigmoid'
  dropout: 0.5,
  optimizer: 'adam',
  learningRate: 0.01,
});

// GraphConv options
GraphConv(64, {
  aggregation: 'mean',   // 'mean' | 'sum' | 'max'
  bias: true,
  normalize: false,
});

// GATLayer options (Graph Attention)
GATLayer(32, {
  heads: 4,
  concat: true,
  negativeSlope: 0.2,
  dropout: 0.0,
});
```

## GNN Training and Inference

```typescript
// Graph data structure
const graphData = {
  nodeFeatures: new Float32Array([...]),   // [numNodes, numFeatures]
  edgeIndex: [[0, 1, 2], [1, 2, 0]],      // Source and target indices
  edgeWeights: new Float32Array([...]),     // Optional
  labels: new Int32Array([...]),            // Optional
};

// Train
const result = await gnn.train(graphData, {
  epochs: 200,
  validationSplit: 0.2,
  earlyStopping: { patience: 10 },
});
console.log(`Accuracy: ${result.accuracy}`);

// Forward pass
const embeddings = await gnn.forward(graphData);

// Graph-level embedding (readout)
const graphEmbedding = await gnn.readout(embeddings, 'mean');

// Save/load
await gnn.save('./gnn-model');
await gnn.load('./gnn-model');
```

## Synthetic Graph Generation

```typescript
import { GraphGenerator } from '@ruvector/graph-data-generator';

const gen = new GraphGenerator({
  nodes: 1000,
  density: 0.1,
  topology: 'scale-free',   // 'scale-free' | 'small-world' | 'random' | 'hierarchical'
  labels: ['Person', 'Company', 'Product'],
  edgeLabels: ['KNOWS', 'WORKS_AT', 'PURCHASED'],
  seed: 42,
});

const graph = await gen.generate();
const stats = gen.stats();
// { nodes: 1000, edges: 4500, avgDegree: 9, density: 0.009, components: 1 }

// Templates
const social = GraphGenerator.template('social-network', { users: 500, avgFriends: 10 });
const kg = GraphGenerator.template('knowledge-graph', { topics: 100, conceptsPerTopic: 20 });

// Export
await gen.export('json', './output.json');
await gen.export('cypher', './output.cypher');
await gen.export('graphml', './output.xml');
await gen.export('csv', './output/');          // vertices.csv + edges.csv
```

## WASM Graph (Browser)

```typescript
import init, { WasmGraphDB } from '@ruvector/graph-wasm';

await init();
const gdb = new WasmGraphDB();

gdb.addVertex('user', JSON.stringify({ name: 'Alice' }));
gdb.addEdge('user:0', 'user:1', 'KNOWS');
const result = gdb.query("MATCH (a)-[:KNOWS]->(b) RETURN a, b");

// Serialization
const bytes = gdb.serialize();
const restored = WasmGraphDB.deserialize(bytes);
```

## Source Packages

- [@ruvector/gnn](https://www.npmjs.com/package/@ruvector/gnn) -- GraphConv, GATLayer, GNN pipelines
- [@ruvector/graph-node](https://www.npmjs.com/package/@ruvector/graph-node) -- Native graph DB with Cypher
- [@ruvector/graph-wasm](https://www.npmjs.com/package/@ruvector/graph-wasm) -- WASM graph DB for browsers
- [@ruvector/graph-data-generator](https://www.npmjs.com/package/@ruvector/graph-data-generator) -- Synthetic graph generation
