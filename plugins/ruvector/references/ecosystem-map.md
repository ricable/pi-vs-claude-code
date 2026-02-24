# RuVector Ecosystem Map

DDD bounded contexts and package dependency graph for the RuVector ecosystem.

---

## Bounded Contexts

### 0. RVF Cognitive Containers

The canonical binary format and deployment primitive across the entire ecosystem.

**RVF (RuVector Format)** is not just a file format -- it is a new deployment primitive. A single `.rvf` file is completely self-contained: no installation, no external services, no container layers. It replaces the need for separate vector databases, model registries, container images, graph stores, LLMs/GGUF, and audit logs. Copy one file and run it anywhere -- from embedded silicon to browsers to servers -- unchanged, in milliseconds.

**Rust Crates (crates.io):**
- `rvf-types` -- 20 segment types, headers, enums (`no_std`)
- `rvf-wire` -- Wire format read/write (`no_std`)
- `rvf-manifest` -- Two-level manifest, FileIdentity, COW pointers
- `rvf-quant` -- Scalar, product, and binary quantization
- `rvf-index` -- HNSW progressive indexing (Layer A/B/C)
- `rvf-crypto` -- SHAKE-256, Ed25519, ML-DSA-65 (post-quantum), witness chains
- `rvf-runtime` -- Full store API, COW engine, membership filters, compaction
- `rvf-kernel` -- Linux kernel builder, initramfs, Docker pipeline
- `rvf-ebpf` -- BPF C compiler (XDP, socket filter, TC)
- `rvf-launch` -- QEMU microvm launcher, KVM/TCG, QMP
- `rvf-server` -- HTTP REST + TCP streaming server
- `rvf-import` -- JSON, CSV, NumPy importers
- `rvf-cli` -- Unified CLI with 17 subcommands

**npm Packages (npmjs.org):**
- `@ruvector/rvf` -- Unified TypeScript SDK
- `@ruvector/rvf-node` -- Node.js N-API native bindings
- `@ruvector/rvf-wasm` -- WASM browser package (~46 KB)
- `@ruvector/rvf-mcp-server` -- MCP server for AI agents

**What's Inside a .rvf File (20 segment types):**

| Segment | What It Does |
|---------|-------------|
| VEC_SEG + INDEX_SEG | Vector embeddings + HNSW progressive index |
| OVERLAY_SEG | LoRA adapter deltas, MicroLoRA patches |
| GRAPH_SEG | GNN adjacency, edge weights, graph state |
| SKETCH_SEG | Quantum state (VQE snapshots, syndrome tables) |
| WITNESS_SEG | Tamper-evident audit trails |
| CRYPTO_SEG | ML-DSA-65 (post-quantum) + Ed25519 signatures |
| KERNEL_SEG | Compressed Linux microkernel (boots in <125ms) |
| EBPF_SEG | XDP/TC/socket programs for kernel acceleration |
| WASM_SEG | 5.5 KB query microkernel for browsers |
| COW_MAP + MEMBERSHIP | Git-like branching with visibility control |
| DELTA_SEG | Sparse delta patches for LoRA overlays |
| META_IDX_SEG | Metadata inverted indexes for filtered search |

**Responsibilities:**
- Single-file deployment of complete AI systems
- COW branching (2.6ms for 10K vecs, child = 162 bytes)
- Self-booting Linux microservice (<125ms cold start)
- Browser queries via 5.5 KB WASM (no backend)
- eBPF kernel-level acceleration (sub-microsecond)
- Cryptographic witness chains (tamper-evident audit)
- Post-quantum signatures (ML-DSA-65)
- DNA-style lineage provenance

**Dependencies:** None (foundational substrate layer)

---

### 1. Data Infrastructure

Core vector storage, indexing, and persistence layer.

**Packages:**
- `ruvector` -- Unified hub with auto-detection
- `@ruvector/core` -- HNSW vector indexing engine (Rust NAPI)
- `@ruvector/node` -- Native Rust NAPI bindings with SIMD
- `@ruvector/wasm` -- WebAssembly bindings for browser/edge
- `@ruvector/core-pkg` -- Core engine (alternative packaging)
- `@ruvector/graph-node` -- Native graph DB with Cypher
- `@ruvector/graph-wasm` -- WASM graph DB for browser
- `@ruvector/rudag` -- Fast DAG library (Rust/WASM)
- `@ruvector/raft` -- Raft consensus protocol
- `@ruvector/replication` -- Vector clock replication

**Responsibilities:**
- Vector insert, search, delete, persistence
- HNSW index construction and optimization
- Graph storage and Cypher query execution
- DAG operations and topological sorting
- Consensus and data replication

**Dependencies:** None (foundational layer)

---

### 2. Learning

Self-optimizing neural architectures and LLM orchestration.

**Packages:**
- `@ruvector/sona` -- SONA with LoRA, EWC++, ReasoningBank
- `@ruvector/sona-pkg` -- SONA (alternative packaging)
- `@ruvector/ruvllm` -- Self-learning LLM orchestration
- `@ruvector/ruvllm-cli` -- LLM inference CLI
- `@ruvector/ruvllm-wasm` -- Browser-based LLM inference
- `@ruvector/attention` -- FlashAttention, MultiHead, Cross, Linear

**Responsibilities:**
- Runtime model adaptation (LoRA fine-tuning)
- Elastic weight consolidation (EWC++)
- ReasoningBank pattern storage and retrieval
- Multi-provider LLM routing and orchestration
- Attention mechanism computation

**Dependencies:** Data Infrastructure (for HNSW memory store)

---

### 3. RANO Optimization

Intelligent routing and intent matching for agent orchestration.

**Packages:**
- `@ruvector/router` -- Semantic router with HNSW intent matching
- `@ruvector/tiny-dancer` -- FastGRNN neural router (10us latency)
- `@ruvector/gnn` -- Graph Neural Networks (GraphConv, GATLayer)
- `@ruvector/gnn-wasm` -- WASM GNN for browser inference

**Responsibilities:**
- Semantic intent routing
- Ultra-low-latency model selection
- Graph-based embeddings and node classification
- Circuit breaker fault tolerance

**Dependencies:** Data Infrastructure (HNSW indexes), Learning (SONA adaptation)

---

### 4. Distributed Systems

Clustering, sharding, replication, and burst scaling.

**Packages:**
- `@ruvector/cluster` -- Distributed clustering with auto-sharding
- `@ruvector/replication` -- Vector clock replication with CRDTs
- `@ruvector/burst-scaling` -- Adaptive scaling (10-50x traffic spikes)
- `@ruvector/raft` -- Raft consensus for leader election

**Responsibilities:**
- Automatic shard distribution (consistent hashing)
- Multi-node replication with conflict resolution
- Worker pool auto-scaling and backpressure
- Leader election and log replication

**Dependencies:** Data Infrastructure (core storage per shard)

---

### 5. Edge / WASM Runtime

Client-side and edge-deployed AI workloads.

**Packages:**
- `@ruvector/edge` -- Edge AI swarms with P2P networking
- `@ruvector/edge-net` -- Distributed compute network
- `@ruvector/edge-full` -- Complete WASM edge toolkit
- `@ruvector/onnx-embeddings-wasm` -- ONNX embedding generation

**Responsibilities:**
- Browser-based vector search
- P2P networking (WebRTC)
- Client-side neural inference (ONNX)
- Offline-first AI capabilities
- Encrypted communication (AES-256-GCM)

**Dependencies:** Data Infrastructure (WASM bindings), RANO Optimization (routing)

---

### 6. Neuromorphic Computing

Brain-inspired neural networks and exotic AI mechanisms.

**Packages:**
- `@ruvector/spiking-neural` -- SNN engine with SIMD (Izhikevich, LIF)
- `@ruvector/nervous-system-wasm` -- HDC, BTSP, spiking nets in WASM
- `@ruvector/exotic-wasm` -- Neural DAOs, Morphogenetic networks
- `@ruvector/learning-wasm` -- MicroLoRA weight adaptation (<100us)

**Responsibilities:**
- Spiking neural network simulation
- Spike-Timing Dependent Plasticity (STDP)
- Hyperdimensional computing
- Real-time weight adaptation at the edge

**Dependencies:** Edge / WASM Runtime (WASM execution)

---

### 7. Agent Orchestration

Multi-agent coordination and workflow management.

**Packages:**
- `@ruvector/agentic-integration` -- Agent coordination with vector memory
- `@ruvector/rudag` -- DAG-based workflow scheduling
- `@ruvector/economy-wasm` -- CRDT credit economy for agents

**Responsibilities:**
- Agent registration and task dispatch
- Capability-based routing
- Shared vector memory across agents
- Credit-based resource allocation
- Workflow DAG execution

**Dependencies:** Data Infrastructure (shared memory), RANO Optimization (task routing), Learning (SONA)

---

### 8. Attention Mechanisms

Specialized attention implementations across runtimes.

**Packages:**
- `@ruvector/attention` -- Native attention (Flash, MultiHead, Cross, Linear)
- `@ruvector/attention-wasm` -- WASM attention with SIMD
- `@ruvector/attention-wasm-pkg` -- WASM attention (alt packaging)
- `@ruvector/attention-unified-wasm` -- 18+ attention mechanisms unified

**Responsibilities:**
- Flash Attention (2.49x-7.47x speedup, 50% memory reduction)
- Multi-head and cross attention
- Linear O(n) attention approximation
- Agent coordination via attention

**Dependencies:** None (standalone computation layer)

---

### 9. Data Generation & Math

Synthetic data, scientific OCR, and mathematical primitives.

**Packages:**
- `@ruvector/agentic-synth` -- Synthetic data generator for AI/ML
- `@ruvector/graph-data-generator` -- Synthetic graph data
- `@ruvector/scipix` -- Scientific document OCR (LaTeX, MathML)
- `@ruvector/math-wasm` -- Optimal Transport, Fisher metrics
- `@ruvector/math-wasm-scoped` -- Scoped math-wasm

**Responsibilities:**
- Q&A pair generation for RAG evaluation
- Synthetic embedding generation with cluster structure
- Scientific document parsing
- Wasserstein distance computation
- Information geometry (Fisher-Rao)

**Dependencies:** None (utility layer)

---

## Infrastructure Services

Cross-cutting packages that serve multiple bounded contexts.

| Package | Purpose |
|---------|---------|
| `@ruvector/cli` | CLI with hooks, routing, benchmarking |
| `@ruvector/server` | HTTP/gRPC server for vector DB |
| `@ruvector/extensions` | Embedding pipelines, admin UI, versioning |
| `@ruvector/rvlite` | Standalone DB (SQL/SPARQL/Cypher) |
| `@ruvector/postgres-cli` | PostgreSQL AI vector database CLI |

---

## Dependency Graph

```
              +-----------------------------+
              |  RVF Cognitive Containers   |
              |  rvf-cli, rvf-runtime,      |
              |  rvf-node, rvf-wasm,        |
              |  rvf-mcp-server (13 crates) |
              +-----------+-----------------+
                          |
                    +-----------------------+
                    |  Data Infrastructure  |
                    |  core, node, wasm,    |
                    |  graph-node, raft     |
                    +-----------+-----------+
                                |
              +-----------------+------------------+
              |                 |                  |
    +---------v------+  +-------v--------+  +------v---------+
    |    Learning    |  |   Distributed  |  | Edge / WASM    |
    |  sona, ruvllm, |  |  cluster,      |  | edge, edge-net,|
    |  attention     |  |  replication,  |  | edge-full,     |
    +--------+-------+  |  burst-scaling |  | onnx-embeddings|
             |          +-------+--------+  +------+---------+
             |                  |                  |
    +--------v-------+         |          +--------v---------+
    | RANO Optim.    |---------+          |  Neuromorphic    |
    | router, tiny-  |                    |  spiking-neural, |
    | dancer, gnn    |                    |  nervous-system, |
    +--------+-------+                    |  exotic, learning|
             |                            +------------------+
    +--------v-------+
    | Agent Orch.    |     +--------------------+
    | agentic-integ, |     | Data Gen & Math    |
    | rudag, economy |     | agentic-synth,     |
    +----------------+     | scipix, math-wasm  |
                           +--------------------+

    +---------------------------------------------+
    |          Infrastructure Services             |
    |  cli, server, extensions, rvlite, postgres   |
    +---------------------------------------------+
```
