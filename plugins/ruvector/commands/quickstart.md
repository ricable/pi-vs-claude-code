# Quickstart

> Part of the [RuVector Plugin](../SKILL.md). See also: [vector-search](vector-search.md), [self-learning](self-learning.md).

## Install

```bash
# All-in-one (recommended)
npm install ruvector

# RVF cognitive containers (Rust CLI)
cargo install rvf-cli

# RVF Node.js SDK
npm install @ruvector/rvf-node

# RVF MCP server (for AI agents)
npx @ruvector/rvf-mcp-server --transport stdio

# Interactive installer
npx ruvector install

# Or standalone packages
npm install @ruvector/core @ruvector/node @ruvector/wasm
```

## RVF: Single-File AI Deployment

RVF is the recommended way to store and deploy vector data. One `.rvf` file replaces databases, model registries, and container images.

```bash
rvf create vectors.rvf --dimension 384
rvf ingest vectors.rvf --input data.json --format json
rvf query  vectors.rvf --vector "0.1,0.2,..." --k 10
rvf status vectors.rvf
rvf serve  vectors.rvf --port 8080          # REST API server
rvf derive parent.rvf child.rvf --type filter  # Git-like branching
rvf launch vectors.rvf                      # Boot as Linux microservice
```

```javascript
// Node.js
const { RvfDatabase } = require('@ruvector/rvf-node');
const db = RvfDatabase.create('vectors.rvf', { dimension: 384 });
db.ingestBatch(new Float32Array(384), [1]);
const results = db.query(new Float32Array(384), 10);
db.close();
```

## CLI: Create, Insert, Index, Search

```bash
# Create a new database
npx ruvector@latest create --dimensions 384 --metric cosine

# Insert vectors from file
npx ruvector@latest insert --file embeddings.json

# Insert a single vector
npx ruvector@latest insert --id vec-1 --vector "[0.1, 0.2, 0.3]"

# Build HNSW index
npx ruvector@latest index build --ef-construction 200 --m 16

# Search
npx ruvector@latest search --query "[0.1, 0.2, 0.3]" --top-k 10

# Check database info
npx ruvector@latest info
npx ruvector@latest count
```

## Programmatic API

```typescript
import { VectorDB } from '@ruvector/core';

// 1. Create database
const db = new VectorDB({
  dimensions: 384,
  metric: 'cosine',        // 'cosine' | 'euclidean' | 'dot'
  efConstruction: 200,
  m: 16,
});

// 2. Insert vectors
await db.insert('vec-1', [0.1, 0.2, ...], { label: 'example' });

// 3. Batch insert (50k+ inserts/sec)
await db.batchInsert([
  { id: 'v1', vector: [0.1, 0.2, ...], metadata: { tag: 'a' } },
  { id: 'v2', vector: [0.3, 0.4, ...], metadata: { tag: 'b' } },
]);

// 4. Build HNSW index
await db.buildIndex({ efConstruction: 200, m: 16 });

// 5. Search
const results = await db.search(queryVector, {
  topK: 10,
  filter: { category: 'science' },
  threshold: 0.7,
});

// 6. Persist to disk
await db.save('./data');

// 7. Load from disk
const loaded = await VectorDB.load('./data');
```

## Benchmark

```bash
npx ruvector@latest bench --dimensions 384 --count 10000
npx ruvector@latest bench --mode search --queries 1000
npx ruvector@latest bench --mode mixed --duration 60
```

## Server Mode

```bash
npx ruvector@latest serve --port 8080
npx ruvector@latest serve --port 8080 --persist ./data --auth-token $RV_TOKEN
```

## Performance

| Operation | Value |
|-----------|-------|
| Insert throughput | 50,000+ vectors/sec |
| Search latency (10k) | < 1ms |
| Supported metrics | cosine, euclidean, dot product |
| Max dimensions | 4096 |
| Persistence | Disk-backed with memory-mapped I/O |

## Source Packages

- [ruvector](https://www.npmjs.com/package/ruvector) -- unified CLI entry point
- [@ruvector/core](https://www.npmjs.com/package/@ruvector/core) -- HNSW vector indexing engine
- [@ruvector/rvf-node](https://www.npmjs.com/package/@ruvector/rvf-node) -- RVF cognitive container SDK
- [@ruvector/rvf-mcp-server](https://www.npmjs.com/package/@ruvector/rvf-mcp-server) -- MCP server for AI agents
- [rvf-cli](https://crates.io/crates/rvf-cli) -- Rust CLI (17 subcommands)
