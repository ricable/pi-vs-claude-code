# Edge & WASM

> Part of the [RuVector Plugin](../SKILL.md). See also: [vector-search](vector-search.md), [graph-intelligence](graph-intelligence.md).

## WASM Initialization

```typescript
import init, { WasmVectorDB } from '@ruvector/wasm';

// Must initialize WASM module before any operations
await init();
const db = new WasmVectorDB(384, 'cosine'); // dimensions, metric
```

## WasmVectorDB

```typescript
// Insert (metadata as JSON string)
db.insert('doc-1', new Float32Array(384).fill(0.1), JSON.stringify({ title: 'Hello' }));

// Batch insert
db.batchInsert([
  ['doc-1', new Float32Array(384), JSON.stringify({ tag: 'a' })],
  ['doc-2', new Float32Array(384), JSON.stringify({ tag: 'b' })],
]);

// Build index and search
db.buildIndex();
const results = db.search(new Float32Array(384).fill(0.2), 10);
// [{ id: string, score: number, metadata?: string }]

// Serialization (for IndexedDB, localStorage, network)
const bytes = db.serialize();
const restored = WasmVectorDB.deserialize(bytes);
```

## Browser Usage

```html
<script type="module">
  import init, { WasmVectorDB } from '@ruvector/wasm';

  async function main() {
    await init();
    const db = new WasmVectorDB(384);
    db.insert('doc-1', new Float32Array(384).fill(0.1));
    db.buildIndex();
    const results = db.search(new Float32Array(384).fill(0.2), 5);
    console.log(results);
  }
  main();
</script>
```

## Web Workers (EdgeSwarm)

```typescript
import { EdgeSwarm } from '@ruvector/edge';

const swarm = new EdgeSwarm({
  workers: 4,                    // Number of Web Workers
  vectorDimensions: 384,
  enableP2P: true,               // Enable peer-to-peer
  enableNeural: true,            // Enable ONNX inference
  signalingServer: 'wss://signal.example.com',
  maxPeers: 10,
});

await swarm.start();

// Vector operations across workers
await swarm.vectorInsert('doc-1', vector, metadata);
const results = await swarm.search(queryVector, 10);

// Neural inference
await swarm.loadModel('model.onnx');
const output = await swarm.infer(inputTensor);
```

## P2P Distributed Search

```typescript
// Distributed search across peers
const results = await swarm.distributedSearch(queryVector, {
  topK: 20,
  peerTimeout: 5000,
});

// Peer management
await swarm.connect(peerId);
await swarm.disconnect(peerId);
await swarm.sendToPeer(peerId, data);
swarm.onPeerMessage((peerId, data) => { /* handle */ });
const peers = swarm.getPeers();
```

## EdgeNetwork (Distributed Compute)

```typescript
import { EdgeNetwork } from '@ruvector/edge-net';

const net = new EdgeNetwork({
  peers: ['wss://node-1.example.com', 'wss://node-2.example.com'],
  nodeId: 'my-node',
  encryption: 'aes-256-gcm',
  topology: 'mesh',           // 'mesh' | 'star' | 'ring'
  maxPeers: 50,
});

await net.join();

// Distribute workloads
const result = await net.submit({
  type: 'map-reduce',
  data: largeDataset,
  mapFn: (chunk) => process(chunk),
  reduceFn: (results) => aggregate(results),
  timeout: 30000,
});

// Distributed vector search
const searchResult = await net.submit({
  type: 'distributed-search',
  query: queryVector,
  topK: 20,
  mergeStrategy: 'score',
});

// Real-time monitoring
net.on('peer:join', (peerId) => console.log(`${peerId} joined`));
net.on('peer:leave', (peerId) => console.log(`${peerId} left`));
```

## ONNX Local Embeddings

```typescript
import { EmbeddingModel, generateEmbeddings, cosineSimilarity } from 'ruvector-onnx-embeddings-wasm';

// Load model (works in browser and Node.js)
const model = await EmbeddingModel.load('all-MiniLM-L6-v2', {
  quantized: false,
  simd: true,
});

// Generate embeddings
const embeddings = await model.embed(['Hello world', 'Hi earth']);

// Compare similarity
const score = cosineSimilarity(embeddings[0], embeddings[1]);

// Batch processing with parallel workers
const results = await generateEmbeddings(thousandTexts, {
  model: 'all-MiniLM-L6-v2',
  batchSize: 64,
  numWorkers: 4,
});

model.dispose(); // Free WASM memory
```

**Supported models:** `all-MiniLM-L6-v2` (384d), `all-mpnet-base-v2` (768d), `bge-small-en-v1.5` (384d), `gte-small` (384d)

## EdgeRuntime (Full Toolkit)

```typescript
import { EdgeRuntime } from '@ruvector/edge-full';

const rt = new EdgeRuntime({
  vectorDimensions: 384,
  enableGraph: true,
  enableNeural: true,
  enableDAG: true,
  workers: 4,
  persistToIndexedDB: false,
});
await rt.start();

// Vector search subsystem
await rt.vectors.insert('doc-1', vector, metadata);
const results = await rt.vectors.search(queryVector, 10);

// Graph DB subsystem (Cypher)
await rt.graph.query("CREATE (n:Person {name: 'Alice'})");
const graphResult = await rt.graph.query("MATCH (n:Person) RETURN n");

// Neural inference subsystem
await rt.neural.loadModel('/models/classifier.onnx');
const output = await rt.neural.infer(inputTensor);

// DAG workflow engine
const workflow = {
  nodes: [
    { id: 'embed', fn: embedText },
    { id: 'search', fn: searchVectors, deps: ['embed'] },
    { id: 'rank', fn: rerankResults, deps: ['search'] },
  ],
};
await rt.dag.execute(workflow);

// Multi-language queries
await rt.sql("SELECT id, metadata FROM vectors WHERE score > 0.8");
await rt.sparql("SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10");
```

## Package Size Comparison

| Package | Bundle Size | Search Latency | Max Vectors | Runtime |
|---------|-------------|----------------|-------------|---------|
| `@ruvector/wasm` | ~200KB gz | < 5ms (10k) | ~100k | Browser, Workers, Deno, Bun |
| `@ruvector/graph-wasm` | ~150KB gz | - | - | Browser, Workers, Deno, Bun |
| `@ruvector/edge` | - | < 5ms | ~100k | Browser (Web Workers + P2P) |
| `@ruvector/edge-full` | - | < 5ms | ~100k | Browser (all-in-one) |
| `@ruvector/node` (native) | N/A | < 0.5ms (SIMD) | Millions | Node.js only |

## Cloudflare Workers Example

```typescript
import init, { WasmVectorDB } from '@ruvector/wasm';

export default {
  async fetch(request) {
    await init();
    const db = WasmVectorDB.deserialize(await VECTORS_KV.get('index', 'arrayBuffer'));
    const query = await request.json();
    const results = db.search(new Float32Array(query.vector), 5);
    return Response.json(results);
  }
};
```

## Source Packages

- [@ruvector/wasm](https://www.npmjs.com/package/@ruvector/wasm) -- WASM vector DB bindings
- [@ruvector/edge](https://www.npmjs.com/package/@ruvector/edge) -- Edge AI swarms with P2P and Web Workers
- [@ruvector/edge-net](https://www.npmjs.com/package/@ruvector/edge-net) -- Distributed compute network
- [@ruvector/edge-full](https://www.npmjs.com/package/@ruvector/edge-full) -- Complete WASM edge toolkit
- [ruvector-onnx-embeddings-wasm](https://www.npmjs.com/package/ruvector-onnx-embeddings-wasm) -- ONNX local embeddings
