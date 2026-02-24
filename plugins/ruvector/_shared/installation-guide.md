# RuVector Installation Guide

Complete installation reference for the RuVector ecosystem (45+ npm packages, 13 Rust crates, 4 RVF packages).

## Recommended: Hub Install

Install the unified hub package that includes all core modules:

```bash
npm install ruvector
```

This gives you `VectorDB`, CLI commands, and automatic native/WASM runtime detection.

## RVF Cognitive Containers

RVF is the canonical binary format for the entire ecosystem. Install the Rust CLI and/or Node.js SDK:

```bash
# Rust CLI (17 subcommands: create, ingest, query, serve, derive, launch, etc.)
cargo install rvf-cli

# Node.js SDK (N-API native bindings)
npm install @ruvector/rvf-node

# WASM (browser, ~46 KB)
npm install @ruvector/rvf-wasm

# MCP Server (for Claude Code, Cursor, AI agents)
npx @ruvector/rvf-mcp-server --transport stdio

# TypeScript SDK
npm install @ruvector/rvf
```

Also available as **13 Rust crates** on crates.io: `rvf-types`, `rvf-wire`, `rvf-manifest`, `rvf-quant`, `rvf-index`, `rvf-crypto`, `rvf-runtime`, `rvf-kernel`, `rvf-ebpf`, `rvf-launch`, `rvf-server`, `rvf-import`, `rvf-cli`

```toml
# Cargo.toml
[dependencies]
rvf-runtime = "0.1"    # Full store API
rvf-types   = "0.1"    # Types only (no_std)
rvf-crypto  = "0.1"    # Signatures + witness chains
```

## Interactive Installer

Choose packages interactively:

```bash
npx ruvector install
```

## Individual Packages

### Core DB

| Package | Install | Description |
|---------|---------|-------------|
| `ruvector` | `npm i ruvector` | Unified hub with CLI and auto-detection |
| `@ruvector/core` | `npm i @ruvector/core` | HNSW vector indexing engine (50k+ inserts/sec) |
| `@ruvector/node` | `npm i @ruvector/node` | Rust NAPI bindings with SIMD acceleration |
| `@ruvector/wasm` | `npm i @ruvector/wasm` | WebAssembly bindings for browser/edge |
| `@ruvector/core-pkg` | `npm i @ruvector/core-pkg` | Core HNSW engine (alternative packaging) |

### CLI / Hooks

| Package | Install | Description |
|---------|---------|-------------|
| `@ruvector/cli` | `npm i @ruvector/cli` | CLI with self-learning hooks and agent routing |

### LLM

| Package | Install | Description |
|---------|---------|-------------|
| `@ruvector/ruvllm` | `npm i @ruvector/ruvllm` | Self-learning LLM orchestration with SONA |
| `@ruvector/ruvllm-cli` | `npm i @ruvector/ruvllm-cli` | LLM inference CLI (GGUF, OpenAI-compat) |
| `@ruvector/ruvllm-wasm` | `npm i @ruvector/ruvllm-wasm` | Browser-based LLM inference with WebGPU |

### Learning

| Package | Install | Description |
|---------|---------|-------------|
| `@ruvector/sona` | `npm i @ruvector/sona` | Self-Optimizing Neural Architecture (LoRA, EWC++) |
| `@ruvector/sona-pkg` | `npm i @ruvector/sona-pkg` | SONA adaptive learning (alternative packaging) |

### Routing

| Package | Install | Description |
|---------|---------|-------------|
| `@ruvector/router` | `npm i @ruvector/router` | Semantic router with HNSW intent matching |
| `@ruvector/tiny-dancer` | `npm i @ruvector/tiny-dancer` | FastGRNN neural router (10us latency) |

### Attention

| Package | Install | Description |
|---------|---------|-------------|
| `@ruvector/attention` | `npm i @ruvector/attention` | FlashAttention, MultiHead, Cross, Linear |
| `@ruvector/attention-wasm` | `npm i @ruvector/attention-wasm` | WASM attention with SIMD acceleration |
| `@ruvector/attention-wasm-pkg` | `npm i @ruvector/attention-wasm-pkg` | WASM attention (alternative packaging) |
| `@ruvector/attention-unified-wasm` | `npm i @ruvector/attention-unified-wasm` | Unified 18+ attention mechanisms in WASM |

### Graph

| Package | Install | Description |
|---------|---------|-------------|
| `@ruvector/gnn` | `npm i @ruvector/gnn` | Graph Neural Networks (GraphConv, GATLayer) |
| `@ruvector/gnn-wasm` | `npm i @ruvector/gnn-wasm` | WASM GNN layers for browser inference |
| `@ruvector/graph-node` | `npm i @ruvector/graph-node` | Native graph DB with Cypher queries |
| `@ruvector/graph-wasm` | `npm i @ruvector/graph-wasm` | WASM graph DB for browser/edge |
| `@ruvector/graph-data-generator` | `npm i @ruvector/graph-data-generator` | Synthetic graph data generator |

### Distributed

| Package | Install | Description |
|---------|---------|-------------|
| `@ruvector/raft` | `npm i @ruvector/raft` | Raft consensus with leader election |
| `@ruvector/cluster` | `npm i @ruvector/cluster` | Distributed clustering and auto-sharding |
| `@ruvector/replication` | `npm i @ruvector/replication` | Data replication with vector clocks |
| `@ruvector/burst-scaling` | `npm i @ruvector/burst-scaling` | Adaptive burst scaling (10-50x spikes) |

### Edge

| Package | Install | Description |
|---------|---------|-------------|
| `@ruvector/edge` | `npm i @ruvector/edge` | Edge AI swarms with P2P networking |
| `@ruvector/edge-net` | `npm i @ruvector/edge-net` | Distributed compute network with crypto |
| `@ruvector/edge-full` | `npm i @ruvector/edge-full` | Complete WASM edge toolkit (all-in-one) |
| `@ruvector/onnx-embeddings-wasm` | `npm i @ruvector/onnx-embeddings-wasm` | Portable ONNX embedding generation |

### Neuromorphic

| Package | Install | Description |
|---------|---------|-------------|
| `@ruvector/spiking-neural` | `npm i @ruvector/spiking-neural` | Spiking Neural Networks with SIMD |
| `@ruvector/nervous-system-wasm` | `npm i @ruvector/nervous-system-wasm` | Bio-inspired AI: HDC, BTSP, spiking nets |
| `@ruvector/exotic-wasm` | `npm i @ruvector/exotic-wasm` | Exotic AI: Neural DAOs, Morphogenetic nets |
| `@ruvector/learning-wasm` | `npm i @ruvector/learning-wasm` | MicroLoRA weight adaptation (<100us) |

### Agents

| Package | Install | Description |
|---------|---------|-------------|
| `@ruvector/agentic-integration` | `npm i @ruvector/agentic-integration` | Multi-agent coordination with vector memory |
| `@ruvector/rudag` | `npm i @ruvector/rudag` | Fast DAG library (topo sort, critical path) |
| `@ruvector/economy-wasm` | `npm i @ruvector/economy-wasm` | CRDT-based credit economy for agents |

### Data Generation

| Package | Install | Description |
|---------|---------|-------------|
| `@ruvector/agentic-synth` | `npm i @ruvector/agentic-synth` | Synthetic data generator for AI/ML |
| `@ruvector/graph-data-generator` | `npm i @ruvector/graph-data-generator` | Synthetic graph data generator |
| `@ruvector/scipix` | `npm i @ruvector/scipix` | Scientific document OCR (LaTeX, MathML) |

### Math

| Package | Install | Description |
|---------|---------|-------------|
| `@ruvector/math-wasm` | `npm i @ruvector/math-wasm` | Optimal Transport, Fisher metrics (WASM) |
| `@ruvector/math-wasm-scoped` | `npm i @ruvector/math-wasm-scoped` | Scoped version of math-wasm |

### Infrastructure

| Package | Install | Description |
|---------|---------|-------------|
| `@ruvector/server` | `npm i @ruvector/server` | HTTP/gRPC vector database server |
| `@ruvector/extensions` | `npm i @ruvector/extensions` | Embedding pipelines, admin UI, versioning |
| `@ruvector/rvlite` | `npm i @ruvector/rvlite` | Standalone DB with SQL/SPARQL/Cypher |
| `@ruvector/postgres-cli` | `npm i @ruvector/postgres-cli` | PostgreSQL AI vector database CLI |

## Runtime Requirements

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | Required for all packages |
| Rust toolchain | Latest stable | Required for native NAPI builds (`@ruvector/core`, `@ruvector/node`) |
| Docker | 20+ | Required for `@ruvector/postgres-cli` |
| Python 3 | 3.10+ | Optional, for training scripts |

## WASM Setup for Browsers

WASM packages (`@ruvector/wasm`, `@ruvector/attention-wasm`, etc.) require initialization:

```typescript
import init, { WasmVectorDB } from '@ruvector/wasm';

// Initialize WASM module before use
await init();

const db = new WasmVectorDB(384);
```

For bundlers (Vite, Webpack), configure WASM file handling:

```javascript
// vite.config.js
export default {
  optimizeDeps: {
    exclude: ['@ruvector/wasm']
  }
};
```

## Docker Setup (PostgreSQL)

```bash
# Install and start PostgreSQL with RuVector extension
npx @ruvector/postgres-cli@latest install
npx @ruvector/postgres-cli@latest start
npx @ruvector/postgres-cli@latest extension
```

Or with Docker directly:

```bash
docker run -d --name ruvector-pg \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  ruvector/postgres:latest
```

## Verification

```bash
# Verify hub install
npx ruvector@latest info

# Verify RVF CLI
rvf --help
rvf create test.rvf --dimension 384
rvf status test.rvf --json

# Verify RVF Node.js
node -e "const { RvfDatabase } = require('@ruvector/rvf-node'); const db = RvfDatabase.create('test.rvf', { dimension: 384 }); console.log('RVF OK:', db.fileId()); db.close();"

# Verify CLI
npx @ruvector/cli@latest --version

# Verify PostgreSQL
npx @ruvector/postgres-cli@latest status

# Run a quick benchmark
npx ruvector@latest bench --dimensions 384 --count 1000

# Verify WASM in Node.js
node -e "import('@ruvector/wasm').then(m => m.default()).then(() => console.log('WASM OK'))"
```
