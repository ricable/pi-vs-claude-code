# Vector Search

> Part of the [RuVector Plugin](../SKILL.md). See also: [quickstart](quickstart.md), [edge-wasm](edge-wasm.md).

## VectorDB Constructor Options

```typescript
import { VectorDB } from '@ruvector/core';

const db = new VectorDB({
  dimensions: 384,           // Required: vector dimensionality
  metric: 'cosine',          // 'cosine' | 'euclidean' | 'dot'
  efConstruction: 200,       // HNSW build quality (higher = better recall, slower insert)
  m: 16,                     // HNSW max connections per layer (higher = more memory)
  persistPath: './data',     // Optional: auto-persist on changes
  maxElements: 100_000,      // Pre-allocate capacity
});
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dimensions` | `number` | Required | Vector dimensionality (max 4096) |
| `metric` | `'cosine' \| 'euclidean' \| 'dot'` | `'cosine'` | Distance metric |
| `efConstruction` | `number` | `200` | HNSW construction parameter |
| `m` | `number` | `16` | Max connections per HNSW layer |
| `persistPath` | `string` | `undefined` | Auto-persistence directory |
| `maxElements` | `number` | `10000` | Pre-allocated capacity |

## Insert Operations

```typescript
// Single insert
await db.insert('vec-1', [0.1, 0.2, ...], { label: 'example' });

// Batch insert (50k+ inserts/sec with Rust NAPI)
await db.batchInsert([
  { id: 'v1', vector: [0.1, ...], metadata: { tag: 'a' } },
  { id: 'v2', vector: [0.2, ...], metadata: { tag: 'b' } },
]);

// Upsert (insert or update)
await db.upsert('vec-1', [0.3, 0.4, ...], { label: 'updated' });
```

## Search with Filters

```typescript
const results = await db.search(queryVector, {
  topK: 10,
  efSearch: 100,              // Higher = better recall, slower search
  filter: { category: 'science', year: { $gte: 2023 } },
  includeMetadata: true,
  includeVectors: false,
  threshold: 0.7,             // Minimum similarity score
});

// Result shape
// [{ id: string, score: number, metadata?: object, vector?: number[] }]
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `topK` | `number` | `10` | Number of results |
| `efSearch` | `number` | `50` | HNSW search quality |
| `filter` | `object` | `undefined` | Metadata filter |
| `includeMetadata` | `boolean` | `true` | Return metadata |
| `includeVectors` | `boolean` | `false` | Return raw vectors |
| `threshold` | `number` | `0.0` | Minimum similarity |

## HNSW Tuning

| Parameter | Effect | Tradeoff |
|-----------|--------|----------|
| `efConstruction` | Higher = better recall at build time | Slower insert |
| `m` | Higher = better recall, more memory | Memory usage |
| `efSearch` | Higher = better recall at query time | Slower search |

```typescript
// Build HNSW index with custom parameters
await db.buildIndex({ efConstruction: 200, m: 16 });

// Optimize for a specific recall target
await db.optimizeIndex({ targetRecall: 0.99 });

// Get index info
const info = await db.indexInfo();
// { built: true, elements: 50000, efConstruction: 200, m: 16 }

// Rebuild index
await db.buildIndex({ efConstruction: 400, m: 32 }); // Higher quality
```

## Native Node.js (SIMD-Accelerated)

```typescript
import { RuVector } from '@ruvector/node';

const rv = new RuVector({
  dimensions: 384,
  metric: 'cosine',
  useSIMD: true,          // SSE4.2, AVX2, AVX-512, NEON
  efConstruction: 200,
  m: 16,
});

// Direct SIMD distance computation
const distance = rv.cosineDistance(vectorA, vectorB);
const euclidean = rv.euclideanDistance(vectorA, vectorB);
const dot = rv.dotProduct(vectorA, vectorB);
```

## WASM Variant

```typescript
import init, { WasmVectorDB } from '@ruvector/wasm';

await init(); // Must initialize WASM module first

const db = new WasmVectorDB(384); // dimensions only
db.insert('doc-1', new Float32Array(384), JSON.stringify({ title: 'Hello' }));
db.buildIndex();
const results = db.search(new Float32Array(384), 10);

// Serialization for IndexedDB / network transfer
const bytes = db.serialize();
const restored = WasmVectorDB.deserialize(bytes);
```

**WASM differences from native:**
- Metadata passed as JSON strings, not objects
- `~200KB` gzipped bundle size
- `< 5ms` search latency (vs `< 0.5ms` native SIMD)
- Max ~100k vectors (browser memory limit)
- Runs in browsers, Cloudflare Workers, Deno, Bun

## Persistence

```typescript
// Manual save/load
await db.save('./data');
const db = await VectorDB.load('./data');

// Auto-persist on changes
const db = new VectorDB({ dimensions: 384, persistPath: './data' });
```

## Delete and Update

```typescript
await db.delete('vec-1');
await db.deleteMany(['vec-1', 'vec-2']);
await db.updateMetadata('vec-1', { label: 'new-label' });
```

## Source Packages

- [@ruvector/core](https://www.npmjs.com/package/@ruvector/core) -- HNSW engine (50k+ inserts/sec)
- [ruvector-core](https://www.npmjs.com/package/ruvector-core) -- Rust NAPI bindings
- [@ruvector/node](https://www.npmjs.com/package/@ruvector/node) -- Native SIMD-accelerated Node.js
- [@ruvector/wasm](https://www.npmjs.com/package/@ruvector/wasm) -- WebAssembly bindings
