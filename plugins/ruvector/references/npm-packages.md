# RuVector npm Packages

Categorized index of all RuVector npm packages including RVF cognitive container packages.

---

## RVF Cognitive Containers

| Package | Description | Key Export |
|---------|-------------|------------|
| [`@ruvector/rvf`](https://www.npmjs.com/package/@ruvector/rvf) | Unified TypeScript SDK for RVF cognitive containers | `RvfStore` |
| [`@ruvector/rvf-node`](https://www.npmjs.com/package/@ruvector/rvf-node) | Node.js N-API native bindings with lineage, kernel/eBPF, inspection | `RvfDatabase` |
| [`@ruvector/rvf-wasm`](https://www.npmjs.com/package/@ruvector/rvf-wasm) | WASM browser package (~46 KB control plane, 5.5 KB microkernel) | `WasmRvfStore` |
| [`@ruvector/rvf-mcp-server`](https://www.npmjs.com/package/@ruvector/rvf-mcp-server) | MCP server for AI agents (Claude Code, Cursor) with 10 tools | `MCP server` |

**Also available as 13 Rust crates on crates.io:** `rvf-types`, `rvf-wire`, `rvf-manifest`, `rvf-quant`, `rvf-index`, `rvf-crypto`, `rvf-runtime`, `rvf-kernel`, `rvf-ebpf`, `rvf-launch`, `rvf-server`, `rvf-import`, `rvf-cli`

---

## Core DB

| Package | Description | Key Export |
|---------|-------------|------------|
| [`ruvector`](https://www.npmjs.com/package/ruvector) | Unified hub with CLI and auto native/WASM detection | `VectorDB` |
| [`@ruvector/core`](https://www.npmjs.com/package/@ruvector/core) | HNSW vector indexing engine (50k+ inserts/sec, Rust NAPI) | `VectorDB` |
| [`@ruvector/node`](https://www.npmjs.com/package/@ruvector/node) | Rust NAPI bindings with SIMD-accelerated distance computation | `RuVector` |
| [`@ruvector/wasm`](https://www.npmjs.com/package/@ruvector/wasm) | WebAssembly vector DB for browser and edge runtimes | `WasmVectorDB` |
| [`@ruvector/core-pkg`](https://www.npmjs.com/package/@ruvector/core-pkg) | HNSW vector database core (alternative packaging) | `VectorDB` |

## CLI / Hooks

| Package | Description | Key Export |
|---------|-------------|------------|
| [`@ruvector/cli`](https://www.npmjs.com/package/@ruvector/cli) | CLI with self-learning hooks, HNSW search, and agent routing | CLI binary |

## LLM

| Package | Description | Key Export |
|---------|-------------|------------|
| [`@ruvector/ruvllm`](https://www.npmjs.com/package/@ruvector/ruvllm) v2.4.1 | Self-learning LLM orchestration: RLM recursive retrieval, 100% hybrid routing accuracy, SONA self-learning, SIMD inference, Claude Code native routing (60+ agents) | `RuvLLM`, `RlmController` |
| [`@ruvector/ruvllm-cli`](https://www.npmjs.com/package/@ruvector/ruvllm-cli) | LLM inference CLI with GGUF models, OpenAI-compatible server | CLI binary |
| [`@ruvector/ruvllm-wasm`](https://www.npmjs.com/package/@ruvector/ruvllm-wasm) | Browser-based LLM inference with WebGPU acceleration | `RuvLLMWasm` |

## Learning

| Package | Description | Key Export |
|---------|-------------|------------|
| [`@ruvector/sona`](https://www.npmjs.com/package/@ruvector/sona) | Self-Optimizing Neural Architecture with LoRA, EWC++, ReasoningBank | `SONA` |
| [`@ruvector/sona-pkg`](https://www.npmjs.com/package/@ruvector/sona-pkg) | SONA adaptive learning for LLM routers (alternative packaging) | `SONA` |

## Routing

| Package | Description | Key Export |
|---------|-------------|------------|
| [`@ruvector/router`](https://www.npmjs.com/package/@ruvector/router) | Semantic router with HNSW SIMD-accelerated intent matching | `SemanticRouter` |
| [`@ruvector/tiny-dancer`](https://www.npmjs.com/package/@ruvector/tiny-dancer) | FastGRNN neural router with 10us latency, circuit breaker, hot-reload | `TinyDancer` |

## Attention

| Package | Description | Key Export |
|---------|-------------|------------|
| [`@ruvector/attention`](https://www.npmjs.com/package/@ruvector/attention) | FlashAttention (2.49x-7.47x speedup), MultiHead, Cross, Linear attention | `FlashAttention` |
| [`@ruvector/attention-wasm`](https://www.npmjs.com/package/@ruvector/attention-wasm) | WASM attention mechanisms with SIMD acceleration | `FlashAttention` |
| [`@ruvector/attention-wasm-pkg`](https://www.npmjs.com/package/@ruvector/attention-wasm-pkg) | WASM attention for transformers and LLMs (alternative packaging) | `MultiHeadAttention` |
| [`@ruvector/attention-unified-wasm`](https://www.npmjs.com/package/@ruvector/attention-unified-wasm) | Unified 18+ attention mechanisms (DAG, Graph, Mamba SSM, Flash, Sparse) | `UnifiedAttention` |

## Graph

| Package | Description | Key Export |
|---------|-------------|------------|
| [`@ruvector/gnn`](https://www.npmjs.com/package/@ruvector/gnn) | Graph Neural Network bindings (GraphConv, GATLayer, GNN pipeline) | `GNN` |
| [`@ruvector/gnn-wasm`](https://www.npmjs.com/package/@ruvector/gnn-wasm) | WASM GNN layers for browser and edge inference | `GraphConv` |
| [`@ruvector/graph-node`](https://www.npmjs.com/package/@ruvector/graph-node) | Native graph DB with Cypher queries, hypergraph support, algorithms | `GraphDB` |
| [`@ruvector/graph-wasm`](https://www.npmjs.com/package/@ruvector/graph-wasm) | WASM graph DB with Cypher API for browser and edge | `GraphDB` |
| [`@ruvector/graph-data-generator`](https://www.npmjs.com/package/@ruvector/graph-data-generator) | Synthetic graph data generator with configurable topology | `GraphGenerator` |

## Distributed

| Package | Description | Key Export |
|---------|-------------|------------|
| [`@ruvector/raft`](https://www.npmjs.com/package/@ruvector/raft) | Raft consensus with leader election, log replication, fault tolerance | `RaftNode` |
| [`@ruvector/cluster`](https://www.npmjs.com/package/@ruvector/cluster) | Distributed clustering with auto-sharding and Raft consensus | `ClusterManager` |
| [`@ruvector/replication`](https://www.npmjs.com/package/@ruvector/replication) | Data replication with vector clocks, CRDTs, conflict resolution | `ReplicationManager` |
| [`@ruvector/burst-scaling`](https://www.npmjs.com/package/@ruvector/burst-scaling) | Adaptive burst scaling for 10-50x traffic spikes | `BurstScaler` |

## Edge

| Package | Description | Key Export |
|---------|-------------|------------|
| [`@ruvector/edge`](https://www.npmjs.com/package/@ruvector/edge) | Edge AI swarms with P2P networking, vector search, neural inference | `EdgeSwarm` |
| [`@ruvector/edge-net`](https://www.npmjs.com/package/@ruvector/edge-net) | Distributed compute network with WASM cryptographic security | `EdgeNetwork` |
| [`@ruvector/edge-full`](https://www.npmjs.com/package/@ruvector/edge-full) | Complete WASM edge toolkit (vector, graph, neural, DAG, multi-query) | `EdgeRuntime` |
| [`@ruvector/onnx-embeddings-wasm`](https://www.npmjs.com/package/@ruvector/onnx-embeddings-wasm) | Portable WASM embedding generation using ONNX Runtime | `ONNXEmbedder` |

## Neuromorphic

| Package | Description | Key Export |
|---------|-------------|------------|
| [`@ruvector/spiking-neural`](https://www.npmjs.com/package/@ruvector/spiking-neural) | Spiking Neural Networks with SIMD, Izhikevich/LIF models, STDP | `SpikingNetwork` |
| [`@ruvector/nervous-system-wasm`](https://www.npmjs.com/package/@ruvector/nervous-system-wasm) | Bio-inspired AI: Hyperdimensional Computing, BTSP, spiking nets | `NervousSystem` |
| [`@ruvector/exotic-wasm`](https://www.npmjs.com/package/@ruvector/exotic-wasm) | Exotic AI: Neural Autonomous Orgs, Morphogenetic Networks, Time Crystals | `NeuralDAO` |
| [`@ruvector/learning-wasm`](https://www.npmjs.com/package/@ruvector/learning-wasm) | Ultra-fast MicroLoRA weight adaptation (<100us, rank-2 LoRA) | `MicroLoRA` |

## Agents

| Package | Description | Key Export |
|---------|-------------|------------|
| [`@ruvector/agentic-integration`](https://www.npmjs.com/package/@ruvector/agentic-integration) | Multi-agent coordination with shared vector memory and task routing | `AgentCoordinator` |
| [`@ruvector/rudag`](https://www.npmjs.com/package/@ruvector/rudag) | Fast DAG library with topological sort, critical path, scheduling | `DAG` |
| [`@ruvector/economy-wasm`](https://www.npmjs.com/package/@ruvector/economy-wasm) | CRDT-based credit economy for distributed agent networks | `CreditEconomy` |

## Data Generation

| Package | Description | Key Export |
|---------|-------------|------------|
| [`@ruvector/agentic-synth`](https://www.npmjs.com/package/@ruvector/agentic-synth) | Synthetic data generator for AI/ML training and RAG evaluation | `SynthGenerator` |
| [`@ruvector/graph-data-generator`](https://www.npmjs.com/package/@ruvector/graph-data-generator) | Synthetic graph data with configurable topology and properties | `GraphGenerator` |
| [`@ruvector/scipix`](https://www.npmjs.com/package/@ruvector/scipix) | Scientific document OCR (LaTeX, MathML, structured text extraction) | `Scipix` |

## Math

| Package | Description | Key Export |
|---------|-------------|------------|
| [`@ruvector/math-wasm`](https://www.npmjs.com/package/@ruvector/math-wasm) | Optimal Transport, Information Geometry, Product Manifold (WASM) | `WassersteinDistance` |
| [`@ruvector/math-wasm-scoped`](https://www.npmjs.com/package/@ruvector/math-wasm-scoped) | Scoped version of math-wasm under @ruvector namespace | `WassersteinDistance` |

## Infrastructure

| Package | Description | Key Export |
|---------|-------------|------------|
| [`@ruvector/server`](https://www.npmjs.com/package/@ruvector/server) | HTTP/gRPC vector database server with REST API and auth | `VectorServer` |
| [`@ruvector/extensions`](https://www.npmjs.com/package/@ruvector/extensions) | Embedding pipelines, admin UI, data export, temporal versioning | `Extensions` |
| [`@ruvector/rvlite`](https://www.npmjs.com/package/@ruvector/rvlite) | Standalone vector DB with SQL, SPARQL, and Cypher query support | `RVLite` |
| [`@ruvector/postgres-cli`](https://www.npmjs.com/package/@ruvector/postgres-cli) | PostgreSQL AI vector database CLI (53+ SQL functions, pgvector-compat) | CLI binary |
