# Workflow 1: Vector Database Setup

> Back to [RuVector Hub](../SKILL.md)

**Goal:** Set up a production vector database with HNSW indexing, metadata filtering, and persistence.

### Step 1: Choose Runtime

| Runtime | Package | Best For |
|---------|---------|----------|
| Node.js (JS) | `ruvector` or `@ruvector/core` | General apps, prototyping |
| Node.js (native SIMD) | `@ruvector/node` | Production, max performance |
| Browser/Edge | `@ruvector/wasm` | Offline-first, client-side |
| Embedded/Standalone | `@ruvector/rvlite` or `rvlite` | IoT, mobile, edge |
| PostgreSQL | `@ruvector/postgres-cli` | Enterprise, existing Postgres |
| HTTP/gRPC API | `@ruvector/server` | Microservice architecture |

### Step 2: Initialize

```bash
# Node.js
npm install ruvector
npx ruvector@latest create --dimensions 384

# Native SIMD
npm install @ruvector/node

# PostgreSQL
docker run -d --name ruvector-pg \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 \
  ruvnet/ruvector-postgres:latest
```

### Step 3: Insert & Index

```typescript
import { VectorDB } from 'ruvector';

const db = new VectorDB({ dimensions: 384, metric: 'cosine' });

// Single insert
await db.insert('doc-1', embedding, { title: 'Hello World' });

// Batch insert (50k+/sec)
await db.batchInsert(items);

// Build HNSW index
await db.buildIndex({ efConstruction: 200, m: 16 });
```

### Step 4: Search

```typescript
const results = await db.search(queryVector, {
  topK: 10,
  filter: { category: 'docs' },
  efSearch: 100,
});
```

### Step 5: Persist

```typescript
await db.save('./vectors.db');
const loaded = await VectorDB.load('./vectors.db');
```

**Related skills:** `ruvector-core`, `ruvector-core-pkg`, `ruvector-node`, `ruvector-wasm`, `ruvector-rvlite`, `ruvector-server`, `ruvector-postgres-cli`, `ruvector-extensions`
