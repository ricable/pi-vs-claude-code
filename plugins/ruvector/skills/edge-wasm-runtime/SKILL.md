---
name: "edge-wasm-runtime"
description: "Browser/edge AI with RVF cognitive containers, P2P swarms, distributed compute, all-in-one WASM runtime, and Web Worker parallelism."
---

# Edge & WASM Runtime

> Consolidated from: `@ruvector/edge`, `@ruvector/edge-net`, `@ruvector/edge-full`, `@ruvector/rvf-wasm`. Also references: wasm, graph-wasm, gnn-wasm, learning-wasm, economy-wasm. Part of the [RuVector Plugin](../../SKILL.md).

## RVF in the Browser

RVF files run natively in any browser via a 5.5 KB WASM microkernel (`WASM_SEG`) or a ~46 KB control plane. No backend required. The same `.rvf` file that boots a Linux microservice on a server also serves queries in a browser tab -- no conversion, no re-indexing.

```html
<script type="module">
  import init, { WasmRvfStore } from './rvf_wasm.js';
  await init();
  const store = WasmRvfStore.create(384);
  store.ingest(1, new Float32Array(384));
  const results = store.query(new Float32Array(384), 10);
  console.log(results); // [{ id, distance }]
</script>
```

| RVF WASM Target | Size | Use Case |
|-----------------|------|----------|
| Tile microkernel | 5.5 KB | Minimal queries, Cognitum tiles |
| Control plane | ~46 KB | Full in-memory store + query + segments |
| Progressive index | Layer A first | 70% recall immediately, 95%+ as it loads |

## Package Overview

| Package | Purpose | Runtime |
|---------|---------|---------|
| `@ruvector/rvf-wasm` | RVF cognitive containers in browser (~46 KB) | WASM |
| `@ruvector/edge` | P2P AI swarms, Web Workers, vector search | Browser |
| `@ruvector/edge-net` | Distributed compute, mesh networking, AES-256 | Browser/Edge |
| `@ruvector/edge-full` | All-in-one: vectors + graph + neural + DAG + SQL | Browser/Edge |

## Core API

### EdgeSwarm (P2P browser AI)

```typescript
import { EdgeSwarm } from '@ruvector/edge';
const swarm = new EdgeSwarm({
  workers: 4, vectorDimensions: 384,
  enableP2P: true, enableNeural: true, signalingServer: 'wss://signal.example.com',
});
await swarm.start();
await swarm.vectorInsert('doc-1', vector, metadata);
const results = await swarm.search(queryVector, 10);
const distributed = await swarm.distributedSearch(queryVector, { topK: 20, peerTimeout: 5000 });
await swarm.loadModel('classifier.onnx');
const prediction = await swarm.infer(input);
```

### EdgeNetwork (distributed compute)

```typescript
import { EdgeNetwork } from '@ruvector/edge-net';
const net = new EdgeNetwork({
  peers: ['wss://node-1.example.com'], encryption: 'aes-256-gcm',
  topology: 'mesh', maxPeers: 50, // also: 'star', 'ring'
});
await net.join();
const result = await net.submit({
  type: 'map-reduce', data: largeDataset,
  mapFn: (chunk) => process(chunk), reduceFn: (results) => aggregate(results),
});
```

### EdgeRuntime (all-in-one)

```typescript
import { EdgeRuntime } from '@ruvector/edge-full';
const rt = new EdgeRuntime({
  vectorDimensions: 384, enableGraph: true, enableNeural: true, enableDAG: true, workers: 4,
});
await rt.start();

await rt.vectors.search(queryVector, 10);                        // Vector search
await rt.graph.query("MATCH (n:Person) RETURN n");               // Cypher
await rt.neural.loadModel('/models/embedder.onnx');              // ONNX inference
await rt.dag.execute({ nodes: [                                  // DAG workflow
  { id: 'embed', fn: embedText },
  { id: 'search', fn: searchVectors, deps: ['embed'] },
]});
await rt.sql("SELECT id FROM vectors WHERE score > 0.8");       // SQL
```

## Common Patterns

### Full RAG in Browser

```typescript
const rt = new EdgeRuntime({ vectorDimensions: 384, enableNeural: true });
await rt.start();
await rt.neural.loadModel('/models/embedder.onnx');
for (const doc of docs) {
  const vec = await rt.neural.infer(tokenize(doc.text));
  await rt.vectors.insert(doc.id, vec, { text: doc.text });
}
const results = await rt.vectors.search(queryVec, 5);
```

### RVF Edge Deployment

The same `.rvf` file works across all edge targets:

| Environment | How | Latency |
|-------------|-----|---------|
| Browser | WASM_SEG (5.5 KB microkernel) | Same file, no backend |
| Edge / IoT | Lightweight `rvlite` API | Tiny footprint |
| TEE enclave | Confidential Core attestation | Cryptographic proof |
| Cognitum tiles | 64 KB WASM tiles | Custom silicon |

## Related

- [Workflow](../../workflows/06-browser-edge-ai.md)
- [RVF Cognitive Containers](../../workflows/15-rvf-cognitive-containers.md)
