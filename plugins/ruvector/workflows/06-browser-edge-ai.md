# Workflow 6: Browser & Edge AI

> Back to [RuVector Hub](../SKILL.md)

**Goal:** Run vector search, graph queries, and neural inference entirely in the browser with zero server dependency.

### Step 1: Choose Edge Runtime

| Package | Size | Features |
|---------|------|----------|
| `@ruvector/wasm` | ~200KB | Vector search only |
| `@ruvector/rvlite` | ~2.3MB | SQL + SPARQL + Cypher + GNN |
| `@ruvector/edge` | varies | Web Workers + P2P networking |
| `@ruvector/edge-full` | varies | Everything (vectors + graph + neural + DAG) |
| `@ruvector/edge-net` | varies | Distributed compute with WASM crypto |

### Step 2: Initialize WASM

```typescript
import init, { WasmVectorDB } from '@ruvector/wasm';

await init();
const db = new WasmVectorDB(384);
db.insert(0, embedding, JSON.stringify({ title: 'Hello' }));
db.buildIndex();
const results = db.search(queryVector, 10);
```

### Step 3: Add Graph Queries (Browser)

```typescript
import { WasmGraphDB } from '@ruvector/graph-wasm';

const graph = new WasmGraphDB();
graph.addVertex('user', '{"name":"Alice"}');
graph.query("MATCH (n:user) RETURN n");
```

### Step 4: Browser Neural Inference

```typescript
import { WasmGNN } from '@ruvector/gnn-wasm';

const gnn = new WasmGNN({ layers: ['gcn', 'gat'], hiddenDim: 64 });
const embeddings = gnn.forward(nodeFeatures, edgeIndex);
```

### Step 5: Local Embeddings (No API)

```typescript
import { EmbeddingModel } from '@ruvector/onnx-embeddings-wasm';

const model = await EmbeddingModel.load('all-MiniLM-L6-v2');
const embeddings = await model.embed(['Hello world', 'Search query']);
const similarity = cosineSimilarity(embeddings[0], embeddings[1]);
```

### Step 6: P2P Distributed Search

```typescript
import { EdgeSwarm } from '@ruvector/edge';

const swarm = new EdgeSwarm({
  workers: 4,
  vectorDimensions: 384,
  enableP2P: true,
  signalingServer: 'wss://signal.example.com',
});

await swarm.start();
const results = await swarm.distributedSearch(query, { topK: 20 });
```

### Step 7: Browser LLM Inference

```typescript
import { WasmLLM } from '@ruvector/ruvllm-wasm';

const llm = new WasmLLM({ model: 'tinyllama-1.1b-q4', maxTokens: 256 });
const response = await llm.generate('Explain quantum computing');

// Streaming
for await (const token of llm.stream('Write a poem')) {
  process.stdout.write(token);
}
```

**Related skills:** `ruvector-wasm`, `ruvector-rvlite`, `ruvector-edge`, `ruvector-edge-net`, `ruvector-edge-full`, `ruvector-gnn-wasm`, `ruvector-graph-wasm`, `ruvector-onnx-embeddings-wasm`, `ruvector-ruvllm-wasm`, `ruvector-attention-wasm`, `ruvector-attention-wasm-pkg`, `ruvector-attention-unified-wasm`
