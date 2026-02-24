# RuVector API Reference

TypeScript API index grouped by domain. Constructor signatures, key methods, and return types.

---

## RVF Cognitive Containers

### RvfDatabase (`@ruvector/rvf-node`) — 19 N-API Methods

```typescript
import { RvfDatabase } from '@ruvector/rvf';

const db = RvfDatabase.create('vectors.rvf', {
  dimension: number,              // Required (e.g., 384)
  metric?: 'cosine' | 'euclidean' | 'dot',  // Default: 'cosine'
});
// Or open existing:
const db = RvfDatabase.open('vectors.rvf');          // read-write
const db = RvfDatabase.openReadonly('vectors.rvf');   // read-only
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `create` | `static (path: string, opts: RvfOptions)` | `RvfDatabase` |
| `open` | `static (path: string)` | `RvfDatabase` |
| `openReadonly` | `static (path: string)` | `RvfDatabase` |
| `ingestBatch` | `(vectors: Float32Array, ids: number[])` | `void` |
| `query` | `(vector: Float32Array, k: number)` | `QueryResult[]` |
| `delete` | `(ids: number[])` | `void` |
| `deleteByFilter` | `(filter: object)` | `void` |
| `compact` | `()` | `void` |
| `status` | `()` | `{ count, dimension, metric }` |
| `close` | `()` | `void` |
| `fileId` | `()` | `string` (UUID) |
| `parentId` | `()` | `string \| null` (UUID of parent if derived) |
| `lineageDepth` | `()` | `number` |
| `dimension` | `()` | `number` |
| `derive` | `(path: string)` | `RvfDatabase` (COW-branch) |
| `embedKernel` | `(bytes: Buffer)` | `void` |
| `extractKernel` | `()` | `Buffer \| null` |
| `embedEbpf` | `(bytes: Buffer)` | `void` |
| `extractEbpf` | `()` | `Buffer \| null` |
| `segments` | `()` | `SegmentInfo[]` |

### WasmRvfStore (`@ruvector/rvf-wasm`) — 29 WASM Exports

```typescript
import init, { RvfStore } from '@ruvector/rvf-wasm';
await init();

const store = RvfStore.create(384, 'cosine');
```

| Category | Functions |
|----------|-----------|
| **Control plane** (10) | `rvf_create`, `rvf_open`, `rvf_close`, `rvf_ingest`, `rvf_query`, `rvf_delete`, `rvf_status`, `rvf_compact`, `rvf_derive`, `rvf_segments` |
| **Tile compute** (14) | `tile_dot_f32`, `tile_cosine_f32`, `tile_l2_f32`, `tile_dot_f16`, `tile_cosine_f16`, `tile_l2_f16`, `tile_topk`, `tile_quantize_sq8`, `tile_dequantize_sq8`, `tile_scan_filtered`, `tile_merge_topk`, `tile_batch_distance`, `tile_prefetch`, `tile_accumulate` |
| **Segment parsing** (3) | `parse_segment_header`, `parse_vec_header`, `parse_manifest` |
| **Memory** (2) | `rvf_alloc`, `rvf_free` |

### RVF Rust API (`rvf-runtime`)

```rust
use rvf_runtime::{RvfStore, options::{RvfOptions, QueryOptions, DistanceMetric}};

let mut store = RvfStore::create("vectors.rvf", RvfOptions {
    dimension: 384,
    metric: DistanceMetric::Cosine,
    ..Default::default()
})?;

store.ingest_batch(&[&embedding], &[1], None)?;
let results = store.query(&query, 10, &QueryOptions::default())?;
let child = store.derive("child.rvf", DerivationType::Filter, None)?;
store.embed_kernel(arch, ktype, flags, &kernel_image, 8080, None)?;
store.close()?;
```

### RVF Rust Crate Structure (13 crates)

| Crate | Description |
|-------|-------------|
| `rvf-types` | Wire types, segment headers, `no_std` compatible |
| `rvf-wire` | Serialization/deserialization |
| `rvf-manifest` | Level0Root manifest parsing |
| `rvf-index` | HNSW index operations |
| `rvf-quant` | Quantization codebooks |
| `rvf-crypto` | Signing, verification, key management |
| `rvf-runtime` | Full runtime (store, ingest, query, derive) |
| `rvf-kernel` | Linux microkernel builder |
| `rvf-launch` | QEMU launcher for self-booting files |
| `rvf-ebpf` | eBPF compiler and loader |
| `rvf-server` | HTTP API server (axum) |
| `rvf-import` | Import from external formats |
| `rvf-cli` | CLI binary (18 subcommands) |

### RVF MCP Tools (`@ruvector/rvf-mcp-server`)

| Tool | Description |
|------|-------------|
| `rvf_create_store` | Create a new RVF vector store |
| `rvf_open_store` | Open existing (read-write or read-only) |
| `rvf_close_store` | Close and release writer lock |
| `rvf_ingest` | Insert vectors with optional metadata |
| `rvf_query` | k-NN similarity search with metadata filters |
| `rvf_delete` | Delete vectors by ID |
| `rvf_delete_filter` | Delete matching a metadata filter |
| `rvf_compact` | Compact to reclaim dead space |
| `rvf_status` | Get dimensions, vector count, etc. |
| `rvf_list_stores` | List all open stores |

---

## Core DB

### VectorDB (`@ruvector/core`)

```typescript
import { VectorDB } from '@ruvector/core';

const db = new VectorDB({
  dimensions: number,           // Required
  metric?: 'cosine' | 'euclidean' | 'dot',  // Default: 'cosine'
  efConstruction?: number,      // Default: 200
  m?: number,                   // Default: 16
  persistPath?: string,
  maxElements?: number,         // Default: 10000
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `insert` | `(id: string, vector: Float32Array \| number[], metadata?: object)` | `Promise<void>` |
| `batchInsert` | `(items: Array<{ id, vector, metadata? }>)` | `Promise<void>` |
| `search` | `(query: number[], options?: SearchOptions)` | `Promise<SearchResult[]>` |
| `buildIndex` | `(opts?: { efConstruction?, m? })` | `Promise<void>` |
| `delete` | `(id: string)` | `Promise<void>` |
| `save` | `(path: string)` | `Promise<void>` |
| `stats` | `()` | `Promise<DBStats>` |

### RuVector (`@ruvector/node`)

```typescript
import { RuVector } from '@ruvector/node';

const rv = new RuVector({
  dimensions: number,
  metric?: 'cosine' | 'euclidean' | 'dot',
  useSIMD?: boolean,            // Default: true
  efConstruction?: number,
  m?: number,
  maxElements?: number,
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `insert` | `(id: string, vector: Float32Array, metadata?: object)` | `Promise<void>` |
| `batchInsert` | `(items: Array<{ id, vector, metadata? }>)` | `Promise<void>` |
| `search` | `(query: Float32Array, options?: SearchOptions)` | `Promise<SearchResult[]>` |
| `distance` | `(a: Float32Array, b: Float32Array)` | `number` |
| `cosineDistance` | `(a: Float32Array, b: Float32Array)` | `number` |

### WasmVectorDB (`@ruvector/wasm`)

```typescript
import init, { WasmVectorDB } from '@ruvector/wasm';
await init();

const db = new WasmVectorDB(dimensions: number, metric?: string);
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `insert` | `(id: string, vector: Float32Array, metadata?: string)` | `void` |
| `search` | `(query: Float32Array, topK: number)` | `SearchResult[]` |
| `buildIndex` | `()` | `void` |
| `serialize` | `()` | `Uint8Array` |
| `deserialize` | `static (bytes: Uint8Array)` | `WasmVectorDB` |

---

## Learning

### SONA (`@ruvector/sona`)

```typescript
import { SONA } from '@ruvector/sona';

const sona = new SONA({
  learningRate?: number,        // Default: 0.01
  ewcLambda?: number,           // Default: 0.5
  loraRank?: number,            // Default: 8
  loraAlpha?: number,           // Default: 16
  dimensions?: number,          // Default: 128
  reasoningBank?: boolean,      // Default: true
  maxPatterns?: number,         // Default: 10000
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `adapt` | `(input, feedback)` | `Promise<AdaptResult>` |
| `predict` | `(input)` | `Promise<Prediction>` |
| `consolidate` | `()` | `Promise<void>` |
| `save` | `(path: string)` | `Promise<void>` |
| `getPatterns` | `(query: string, k?: number)` | `Promise<Pattern[]>` |

### RuvLLM (`@ruvector/ruvllm` v2.4.1)

Purpose-built LLM runtime for Claude Code agent orchestration with 100% routing accuracy.

```typescript
import { RuvLLM } from '@ruvector/ruvllm';

const llm = new RuvLLM({
  modelPath?: string,           // GGUF model path (auto-downloads if missing)
  model?: string,               // Model name (e.g., 'ruv/ruvltra')
  sonaEnabled?: boolean,        // Enable SONA self-learning
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `query` | `(prompt: string, params?: GenerateParams)` | `Promise<Response>` |
| `stream` | `(prompt: string, params?: GenerateParams)` | `AsyncIterable<string>` |
| `route` | `(task: string)` | `Promise<RoutingResult>` — `{ agent, confidence, tier }` |
| `routeComplex` | `(task: string)` | `Promise<AgentTeam[]>` — multi-agent teams |
| `loadModel` | `(path: string)` | `Promise<void>` |
| `addMemory` | `(text: string, metadata?: object)` | `number` |
| `searchMemory` | `(query: string, topK?: number)` | `MemoryResult[]` |
| `sonaStats` | `()` | `SonaStats \| null` |
| `adapt` | `(input: Float32Array, quality: number)` | `void` |

### RlmController (`@ruvector/ruvllm` v2.4.1)

Recursive Language Model — decomposes complex queries into sub-queries and synthesizes coherent answers.

```typescript
import { RlmController } from '@ruvector/ruvllm';

const rlm = new RlmController({
  maxDepth?: number,              // Default: 3
  maxSubQueries?: number,         // Default: 5
  tokenBudget?: number,           // Default: 4096
  enableCache?: boolean,          // Default: true
  cacheTtl?: number,              // Default: 300000
  retrievalTopK?: number,         // Default: 10
  minQualityScore?: number,       // Default: 0.7
  enableReflection?: boolean,     // Default: false
  maxReflectionIterations?: number, // Default: 2
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `query` | `(input: string)` | `Promise<RlmAnswer>` — `{ text, sources, qualityScore, confidence }` |
| `queryStream` | `(input: string)` | `AsyncGenerator<StreamToken>` |
| `addMemory` | `(text: string, metadata?: object)` | `Promise<string>` |
| `searchMemory` | `(query: string, topK?: number)` | `Promise<MemorySpan[]>` |
| `clearCache` | `()` | `void` |
| `getCacheStats` | `()` | `{ size, entries }` |
| `updateConfig` | `(config: Partial<RlmConfig>)` | `void` |
| `getConfig` | `()` | `Required<RlmConfig>` |

### ContrastiveTrainer (`@ruvector/ruvllm` v2.4.1)

```typescript
import { ContrastiveTrainer } from '@ruvector/ruvllm';

const trainer = new ContrastiveTrainer({
  modelPath: string,
  loraRank?: number,       // Default: 8
  loraAlpha?: number,      // Default: 16
  learningRate?: number,   // Default: 1e-4
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `train` | `(pairs: TripletPair[], opts?: { epochs })` | `Promise<TrainResult>` |
| `save` | `(path: string)` | `Promise<void>` |

### SIMD (`@ruvector/ruvllm/simd`)

```typescript
import { simd } from '@ruvector/ruvllm/simd';
```

| Function | Signature | Description |
|----------|-----------|-------------|
| `batchCosineSimilarity` | `(query, targets)` | 4x faster with AVX2/NEON |
| `flashAttention` | `(q, k, v, scale)` | SIMD-accelerated attention |

### All RuvLLM Exports

```typescript
import {
  RuvLLM, RuvLLMConfig,
  RlmController, RlmConfig, RlmAnswer, MemorySpan, StreamToken,
  RlmTrainer, ContrastiveTrainer, createRlmTrainer,
  DEFAULT_RLM_CONFIG, FAST_RLM_CONFIG, THOROUGH_RLM_CONFIG,
  SonaCoordinator, TrajectoryBuilder,
  LoraAdapter, LoraManager,
  ModelComparisonBenchmark, RoutingBenchmark, EmbeddingBenchmark,
} from '@ruvector/ruvllm';
```

### FlashAttention (`@ruvector/attention`)

```typescript
import { FlashAttention } from '@ruvector/attention';

const attn = new FlashAttention({
  heads: number,                // Default: 8
  dim: number,                  // Default: 64
  blockSize?: number,           // Default: 256
  causal?: boolean,             // Default: false
  dropout?: number,             // Default: 0.0
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `forward` | `(Q, K, V, mask?)` | `Promise<Tensor>` |
| `attentionScores` | `(Q, K)` | `Promise<Tensor>` |
| `benchmark` | `(seqLen: number)` | `Promise<BenchmarkResult>` |

### MultiHeadAttention (`@ruvector/attention`)

```typescript
const mha = new MultiHeadAttention({
  modelDim: number,
  heads?: number,               // Default: 8
  dropout?: number,             // Default: 0.0
  bias?: boolean,               // Default: true
});
```

### CrossAttention (`@ruvector/attention`)

```typescript
const cross = new CrossAttention({
  queryDim: number,
  keyDim: number,
  heads?: number,               // Default: 8
});
```

---

## Routing

### SemanticRouter (`@ruvector/router`)

```typescript
import { SemanticRouter } from '@ruvector/router';

const router = new SemanticRouter({
  dimensions?: number,          // Default: 384
  metric?: string,              // Default: 'cosine'
  threshold?: number,           // Default: 0.7
  embeddingModel?: string,      // Default: 'all-MiniLM-L6-v2'
  defaultRoute?: string,
  efSearch?: number,            // Default: 100
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `addRoute` | `(name: string, utterances: string[])` | `Promise<void>` |
| `route` | `(input: string)` | `Promise<RouteMatch>` |
| `routeTopK` | `(input: string, k: number)` | `Promise<RouteMatch[]>` |
| `routeBatch` | `(inputs: string[])` | `Promise<RouteMatch[]>` |
| `removeRoute` | `(name: string)` | `void` |

### TinyDancer (`@ruvector/tiny-dancer`)

```typescript
import { TinyDancer } from '@ruvector/tiny-dancer';

const dancer = new TinyDancer({
  routes: string[],
  hiddenSize?: number,          // Default: 64
  inputSize?: number,           // Default: 128
  uncertaintyThreshold?: number, // Default: 0.3
  circuitBreaker?: boolean,     // Default: true
  failureThreshold?: number,    // Default: 5
  recoveryTimeMs?: number,      // Default: 30000
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `route` | `(embedding)` | `Promise<RouteResult>` |
| `routeBatch` | `(embeddings)` | `Promise<RouteResult[]>` |
| `reload` | `(weights)` | `Promise<void>` |
| `train` | `(data, labels)` | `Promise<TrainResult>` |
| `healthCheck` | `()` | `HealthStatus` |

---

## Graph

### GNN (`@ruvector/gnn`)

```typescript
import { GNN, GraphConv, GATLayer } from '@ruvector/gnn';

const gnn = new GNN({
  layers: Layer[],              // e.g. [GraphConv(64), GATLayer(32)]
  activation?: string,          // Default: 'relu'
  dropout?: number,             // Default: 0.0
  optimizer?: string,           // Default: 'adam'
  learningRate?: number,        // Default: 0.01
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `forward` | `(graphData: GraphData)` | `Promise<Tensor>` |
| `train` | `(data, options)` | `Promise<TrainResult>` |
| `predict` | `(features)` | `Promise<Tensor>` |
| `save` | `(path: string)` | `Promise<void>` |
| `summary` | `()` | `string` |

### GraphConv (`@ruvector/gnn`)

```typescript
const layer = GraphConv(outChannels: number, {
  aggregation?: 'mean' | 'sum' | 'max',
  bias?: boolean,
  normalize?: boolean,
});
```

### GATLayer (`@ruvector/gnn`)

```typescript
const layer = GATLayer(outChannels: number, {
  heads?: number,               // Default: 1
  concat?: boolean,             // Default: true
  negativeSlope?: number,       // Default: 0.2
});
```

### GraphDB (`@ruvector/graph-node`)

```typescript
import { GraphDB } from '@ruvector/graph-node';

const gdb = new GraphDB({
  persistPath?: string,
  enableCypher?: boolean,       // Default: true
  enableHypergraph?: boolean,   // Default: false
  maxVertices?: number,         // Default: 10000
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `addVertex` | `(label: string, props: object)` | `Promise<string>` |
| `addEdge` | `(from: string, to: string, label: string, props?)` | `Promise<string>` |
| `query` | `(cypher: string, params?)` | `Promise<QueryResult>` |
| `shortestPath` | `(from: string, to: string)` | `Promise<Path>` |
| `pageRank` | `(opts?)` | `Promise<RankMap>` |

---

## Distributed

### RaftNode (`@ruvector/raft`)

```typescript
import { RaftNode } from '@ruvector/raft';

const node = new RaftNode({
  id: string,
  peers: string[],
  electionTimeout?: [number, number],   // Default: [150, 300]
  heartbeatInterval?: number,            // Default: 50
  transport?: 'tcp' | 'websocket' | 'memory',
  address?: string,
  dataDir?: string,
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `start` | `()` | `Promise<void>` |
| `propose` | `(command: object)` | `Promise<void>` |
| `isLeader` | `()` | `boolean` |
| `getLeader` | `()` | `string \| null` |
| `addPeer` | `(id: string, address: string)` | `Promise<void>` |

### ClusterManager (`@ruvector/cluster`)

```typescript
import { ClusterManager } from '@ruvector/cluster';

const cluster = new ClusterManager({
  nodeId: string,
  listenPort?: number,           // Default: 9100
  seedNodes?: string[],
  shardCount?: number,           // Default: 8
  replicationFactor?: number,    // Default: 1
  consensus?: 'raft' | 'gossip', // Default: 'raft'
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `start` | `()` | `Promise<void>` |
| `insert` | `(vectors: VectorRecord[])` | `Promise<InsertResult>` |
| `search` | `(query: Float32Array, k: number, opts?)` | `Promise<SearchResult[]>` |
| `rebalance` | `()` | `Promise<RebalanceResult>` |
| `status` | `()` | `Promise<ClusterStatus>` |

### ReplicationManager (`@ruvector/replication`)

```typescript
import { ReplicationManager } from '@ruvector/replication';

const mgr = new ReplicationManager({
  nodes: NodeConfig[],
  localNodeId: string,
  replicationFactor?: number,    // Default: 3
  consistencyLevel?: 'one' | 'quorum' | 'all',
  conflictResolution?: 'last-write-wins' | 'vector-clock' | 'custom',
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `start` | `()` | `Promise<void>` |
| `write` | `(key: string, value, opts?)` | `Promise<void>` |
| `read` | `(key: string, opts?)` | `Promise<any>` |
| `getConflicts` | `()` | `Conflict[]` |
| `resolve` | `(key: string, strategy, fn?)` | `Promise<void>` |

### BurstScaler (`@ruvector/burst-scaling`)

```typescript
import { BurstScaler } from '@ruvector/burst-scaling';

const scaler = new BurstScaler({
  baseWorkers?: number,          // Default: 4
  maxWorkers?: number,           // Default: 64
  scaleUpThreshold?: number,     // Default: 0.8
  scaleDownThreshold?: number,   // Default: 0.2
  maxQueueSize?: number,         // Default: 10000
  targetLatencyMs?: number,      // Default: 100
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `wrap` | `<T,R>(handler: (T) => Promise<R>)` | `(T) => Promise<R>` |
| `metrics` | `()` | `ScalerMetrics` |
| `setLimits` | `(config: Partial<ScalerConfig>)` | `void` |
| `pause` / `resume` | `()` | `void` |
| `shutdown` | `()` | `Promise<void>` |

---

## Edge

### EdgeSwarm (`@ruvector/edge`)

```typescript
import { EdgeSwarm } from '@ruvector/edge';

const swarm = new EdgeSwarm({
  workers?: number,
  vectorDimensions?: number,     // Default: 384
  enableP2P?: boolean,           // Default: false
  enableNeural?: boolean,        // Default: false
  signalingServer?: string,
  maxPeers?: number,             // Default: 10
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `start` | `()` | `Promise<void>` |
| `vectorInsert` | `(id, vector, metadata)` | `Promise<void>` |
| `search` | `(query, topK)` | `Promise<SearchResult[]>` |
| `distributedSearch` | `(query, opts)` | `Promise<SearchResult[]>` |
| `infer` | `(input)` | `Promise<Tensor>` |

---

## Neuromorphic

### SpikingNetwork (`@ruvector/spiking-neural`)

```typescript
import { SpikingNetwork } from '@ruvector/spiking-neural';

const network = new SpikingNetwork({
  dt?: number,                   // Default: 0.5
  simd?: boolean,                // Default: true
  recordSpikes?: boolean,        // Default: true
  seed?: number,                 // Default: 42
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `addLayer` | `(config: LayerConfig)` | `string` |
| `connect` | `(from: string, to: string, config)` | `void` |
| `enableSTDP` | `(config: STDPConfig)` | `void` |
| `simulate` | `(input: Float32Array, steps: number)` | `SimResult` |
| `spikeTrains` | `()` | `number[][]` |

### MicroLoRA (`@ruvector/learning-wasm`)

```typescript
import { MicroLoRA } from '@ruvector/learning-wasm';

const adapter = new MicroLoRA({
  inputDim: number,
  outputDim: number,
  rank?: number,                 // Default: 2
  alpha?: number,                // Default: 1.0
  learningRate?: number,         // Default: 0.001
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `adapt` | `(input: Float32Array, target: Float32Array)` | `number` (loss) |
| `adaptBatch` | `(examples: Array<{ input, target }>)` | `number` (avg loss) |
| `apply` | `(weights: Float32Array)` | `Float32Array` |
| `delta` | `()` | `Float32Array` |
| `save` | `()` | `Uint8Array` |

---

## Agents

### AgentCoordinator (`@ruvector/agentic-integration`)

```typescript
import { AgentCoordinator } from '@ruvector/agentic-integration';

const coordinator = new AgentCoordinator({
  memory?: { dimensions: number, metric?: string },
  maxAgents?: number,            // Default: 10
  taskTimeout?: number,          // Default: 30000
  routingStrategy?: 'capability' | 'round-robin' | 'load-balanced',
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `registerAgent` | `(config: AgentConfig)` | `void` |
| `dispatch` | `(taskSpec)` | `Promise<DispatchResult>` |
| `memory.store` | `(key, embedding, meta?)` | `Promise<void>` |
| `memory.search` | `(query, k)` | `Promise<SearchResult[]>` |
| `broadcast` | `(message)` | `void` |

### DAG (`@ruvector/rudag`)

```typescript
import { DAG } from '@ruvector/rudag';

const dag = new DAG();
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `addNode` | `(id: string, data?: object)` | `void` |
| `addEdge` | `(from: string, to: string)` | `void` |
| `topologicalSort` | `()` | `string[]` |
| `criticalPath` | `()` | `{ path: string[], totalWeight: number }` |
| `hasCycle` | `()` | `boolean` |
| `schedule` | `(opts?: { maxParallel })` | `string[][]` |
| `execute` | `(fn, opts?)` | `Promise<void>` |

### CreditEconomy (`@ruvector/economy-wasm`)

```typescript
import { CreditEconomy } from '@ruvector/economy-wasm';

const economy = new CreditEconomy({
  nodeId: string,
  initialSupply?: number,        // Default: 0
  mintAuthority?: string,        // Default: 'system'
  maxSupply?: number,            // Default: Infinity
  transferFee?: number,          // Default: 0
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `mint` | `(agentId: string, amount: number)` | `MintResult` |
| `transfer` | `(from: string, to: string, amount: number)` | `TransferResult` |
| `balance` | `(agentId: string)` | `number` |
| `merge` | `(remoteState: Uint8Array)` | `void` |
| `exportState` | `()` | `Uint8Array` |

---

## Data Generation

### SynthGenerator (`@ruvector/agentic-synth`)

```typescript
import { SynthGenerator } from '@ruvector/agentic-synth';

const gen = new SynthGenerator({
  seed?: number,
  locale?: string,               // Default: 'en'
  batchSize?: number,            // Default: 100
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `generateQA` | `(docs: string[], opts)` | `Promise<QAPair[]>` |
| `generateEmbeddings` | `(opts)` | `EmbeddingDataset` |
| `generateConversations` | `(opts)` | `Promise<Conversation[]>` |
| `generateDataset` | `(opts)` | `Record<string, unknown>[]` |
| `generateText` | `(opts)` | `Promise<string[]>` |

### Scipix (`@ruvector/scipix`)

```typescript
import { Scipix } from '@ruvector/scipix';

const scipix = new Scipix({
  model?: 'scientific-v2' | 'equation-only' | 'handwriting',
  device?: 'cpu' | 'gpu',
  languages?: string[],          // Default: ['en']
  confidence?: number,           // Default: 0.8
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `recognize` | `(input: string \| Buffer)` | `Promise<RecognitionResult>` |
| `toLatex` | `(input: string \| Buffer)` | `Promise<string[]>` |
| `toMathML` | `(input: string \| Buffer)` | `Promise<string[]>` |
| `processPDF` | `(path: string, opts?)` | `Promise<PageResult[]>` |
| `batch` | `(inputs: string[])` | `Promise<RecognitionResult[]>` |

---

## Math

### WassersteinDistance (`@ruvector/math-wasm`)

```typescript
import { WassersteinDistance, SinkhornSolver, FisherMetric, ProductManifold } from '@ruvector/math-wasm';
```

| Function | Signature | Returns |
|----------|-----------|---------|
| `WassersteinDistance.compute` | `(p: Float64Array, q: Float64Array, order?: number)` | `number` |
| `FisherMetric.distance` | `(p: Float64Array, q: Float64Array)` | `number` |
| `FisherMetric.naturalGradient` | `(params, gradient)` | `Float64Array` |
| `ProductManifold.geodesic` | `(a: Float64Array, b: Float64Array, t: number)` | `Float64Array` |
| `ProductManifold.distance` | `(a: Float64Array, b: Float64Array)` | `number` |

### SinkhornSolver (`@ruvector/math-wasm`)

```typescript
const solver = new SinkhornSolver({
  epsilon?: number,              // Default: 0.01
  maxIter?: number,              // Default: 100
  tolerance?: number,            // Default: 1e-9
});
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `solve` | `(costMatrix, p, q)` | `TransportResult` |
