---
name: "data-infrastructure"
description: "Vector database engines, RVF cognitive containers, persistence, server modes, and PostgreSQL extension across Node.js, WASM, Rust, and embedded runtimes."
---

# Data Infrastructure

> Consolidated from: `@ruvector/core`, `@ruvector/node`, `@ruvector/wasm`, `@ruvector/rvlite`, `@ruvector/server`, `@ruvector/postgres-cli`, `ruvector-extensions`, plus RVF format packages. Part of the [RuVector Plugin](../../SKILL.md).

## RVF: Single-File Deployment Primitive

**RVF (RuVector Format)** is the canonical binary format across the RuVector ecosystem. A single `.rvf` file is completely self-contained -- no installation, no external services, no container layers. It replaces separate vector databases, model registries, container images, graph stores, and audit logs in one ultra-fast file that runs anywhere unchanged.

### RVF Packages

| Package | Purpose | Runtime |
|---------|---------|---------|
| `rvf-cli` | Unified CLI with 17 subcommands (create, ingest, query, serve, derive, launch) | Rust |
| `@ruvector/rvf` | Unified TypeScript SDK | Node.js |
| `@ruvector/rvf-node` | Node.js N-API native bindings with lineage, kernel, eBPF | Node.js (Rust NAPI) |
| `@ruvector/rvf-wasm` | WASM browser package (~46 KB control plane, ~5.5 KB microkernel) | WASM |
| `@ruvector/rvf-mcp-server` | MCP server for AI agents (Claude Code, Cursor) | Node.js |

### RVF Segment Architecture (20 types)

| Segment | Code | Purpose |
|---------|------|---------|
| MANIFEST_SEG | 0x00 | Level0Root manifest with file metadata |
| VEC_SEG | 0x01 | Raw vector data (f32, f16, bf16, int8) |
| INDEX_SEG | 0x02 | HNSW progressive index (Layer A/B/C: 70%->85%->95% recall) |
| META_SEG | 0x03 | Vector metadata (JSON, CBOR) |
| QUANT_SEG | 0x04 | Quantization codebooks (scalar/PQ/binary) |
| OVERLAY_SEG | 0x05 | LoRA adapter deltas, MicroLoRA patches |
| GRAPH_SEG | 0x06 | GNN adjacency, edge weights, graph state |
| TENSOR_SEG | 0x07 | Dense tensor data |
| WASM_SEG | 0x08 | Embedded WASM modules (5.5 KB microkernel) |
| MODEL_SEG | 0x09 | ML model weights |
| CRYPTO_SEG | 0x0A | ML-DSA-65 (post-quantum) + Ed25519 signatures |
| WITNESS_SEG | 0x0B | Tamper-evident audit trails, attestation records |
| CONFIG_SEG | 0x0C | Runtime configuration |
| CUSTOM_SEG | 0x0D | User-defined segment |
| KERNEL_SEG | 0x0E | Compressed Linux microkernel (self-booting <125ms) |
| EBPF_SEG | 0x0F | XDP/TC/socket programs for kernel-level acceleration |
| COW_MAP_SEG | 0x20 | Cluster ownership map for COW branching |
| REFCOUNT_SEG | 0x21 | Cluster reference counts |
| MEMBERSHIP_SEG | 0x22 | Branch membership/visibility filter |
| DELTA_SEG | 0x23 | Sparse delta patches (LoRA overlays) |

### RVF Rust Crates (13)

`rvf-types` (wire types, no_std), `rvf-wire` (serde), `rvf-manifest` (Level0Root), `rvf-index` (HNSW), `rvf-quant` (codebooks), `rvf-crypto` (signing), `rvf-runtime` (full store), `rvf-kernel` (microkernel builder), `rvf-launch` (QEMU launcher), `rvf-ebpf` (compiler/loader), `rvf-server` (axum HTTP), `rvf-import` (external formats), `rvf-cli` (18 subcommands)

### RVF Quick Start

```typescript
// Node.js
const { RvfDatabase } = require('@ruvector/rvf-node');
const db = RvfDatabase.create('vectors.rvf', { dimension: 384 });
db.ingestBatch(new Float32Array(384), [1]);
const results = db.query(new Float32Array(384), 10);
console.log(db.fileId());       // unique UUID
console.log(db.segments());     // [{ type, id, size }]
db.close();
```

```bash
# CLI
rvf create vectors.rvf --dimension 384
rvf ingest vectors.rvf --input data.json --format json
rvf query  vectors.rvf --vector "0.1,0.2,..." --k 10
rvf derive parent.rvf child.rvf --type filter  # COW branch (2.6ms for 10K vecs)
rvf serve  vectors.rvf --port 8080
rvf launch vectors.rvf                          # Boot as Linux microservice
```

### RVF Performance

| Metric | Value |
|--------|-------|
| Cold boot (4 KB manifest) | 1.6us |
| COW branch creation (10K vecs) | 2.6ms (child = 162 bytes) |
| COW branch creation (100K vecs) | 6.8ms (child = 162 bytes) |
| CowMap lookup | 28ns |
| Membership filter contains() | 23-33ns |
| Snapshot freeze | 30-52ns |
| WASM binary (microkernel) | 5.5 KB |
| WASM binary (control plane) | ~46 KB |
| Progressive recall@10 (Layer A) | >= 0.70 |
| Full recall@10 (Layer C) | >= 0.95 |

---

## Package Overview

| Package | Purpose | Runtime |
|---------|---------|---------|
| `@ruvector/core` | HNSW vector indexing, 50k+ inserts/sec | Node.js (Rust NAPI) |
| `@ruvector/node` | SIMD-accelerated search, zero-copy ops | Node.js (Rust NAPI) |
| `@ruvector/wasm` | Browser/edge vector search (~200KB) | WASM |
| `@ruvector/rvlite` | Embedded DB with SQL/SPARQL/Cypher | WASM |
| `@ruvector/server` | HTTP/gRPC server with REST API | Node.js |
| `@ruvector/postgres-cli` | PostgreSQL extension, 53+ SQL functions | PostgreSQL |
| `ruvector-extensions` | Embeddings, admin UI, export, versioning | Node.js |

## Core API

### Constructors

```typescript
import { VectorDB } from '@ruvector/core';
const db = new VectorDB({ dimensions: 384, metric: 'cosine', efConstruction: 200, m: 16, persistPath: './data' });

import { RuVector } from '@ruvector/node';
const rv = new RuVector({ dimensions: 384, metric: 'cosine', useSIMD: true }); // SSE4.2/AVX2/NEON

import init, { WasmVectorDB } from '@ruvector/wasm';
await init(); const wdb = new WasmVectorDB(384, 'cosine'); // Browser/edge

import { RVLite } from '@ruvector/rvlite';
const lite = new RVLite({ dimensions: 384, enableSQL: true, enableCypher: true }); // Multi-query
```

### Key Methods (shared across engines)

```typescript
await db.insert(id, vector, metadata);
await db.batchInsert(items);                    // 50k+ inserts/sec
const results = await db.search(queryVec, { topK: 10, filter, threshold });
await db.buildIndex({ efConstruction: 200 });
await db.save('./data');
const loaded = await VectorDB.load('./data');
```

### Server & Extensions

```typescript
import { createServer } from '@ruvector/server';
const server = createServer({ port: 8080, grpcPort: 50051, persistPath: './data', authToken: process.env.RV_TOKEN });
await server.start(); // REST: POST /api/v1/collections/:name/search

import { EmbeddingPipeline, Exporter, TemporalIndex } from 'ruvector-extensions';
const embedder = new EmbeddingPipeline({ model: 'all-MiniLM-L6-v2' });
const vectors = await embedder.embed(texts);
await new Exporter().toParquet(index, './export.parquet'); // Also: CSV, JSON, NDJSON
```

## Common Patterns

### Runtime Selection

| Need | Package | Latency |
|------|---------|---------|
| Max throughput (server) | `@ruvector/node` | < 0.5ms (SIMD) |
| General Node.js | `@ruvector/core` | < 1ms |
| Browser / Cloudflare | `@ruvector/wasm` | < 5ms |
| Multi-query embedded | `@ruvector/rvlite` | < 5ms |
| Production service | `@ruvector/server` | REST/gRPC |
| PostgreSQL workloads | `@ruvector/postgres-cli` | SQL |

### RVF vs Traditional Approaches

| | RVF | Traditional |
|---|---|---|
| **Deployment** | Single file, zero deps | Server + storage + config |
| **Branching** | COW at cluster granularity (2.6ms) | Copy entire collection |
| **Multi-tenant** | Membership filter on shared index | Separate collections |
| **Edge deploy** | `scp file.rvf host:` + boot | Install + configure + import |
| **Provenance** | Cryptographic witness chain | External audit logs |
| **Compute** | Embedded kernel + eBPF + WASM | N/A |
| **Crash safety** | Append-only (no WAL needed) | Needs WAL |

## Related

- [Commands](../../commands/vector-search.md)
- [Workflow](../../workflows/01-vector-db-setup.md)
- [PostgreSQL Workflow](../../workflows/08-postgres-extension.md)
- [RVF Cognitive Containers](../../workflows/15-rvf-cognitive-containers.md)
