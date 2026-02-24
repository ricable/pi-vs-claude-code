---
description: "RuVector hub: 45+ packages, 70+ Rust crates, and RVF cognitive containers for vector search, GNN, LLM routing, distributed systems, edge/WASM, self-learning hooks, agent coordination, and single-file AI deployment."
---

# RuVector Unified Workflow

The vector database that gets smarter the more you use it. This skill orchestrates the full RuVector ecosystem: 45+ npm packages, 70+ Rust crates, RVF cognitive containers, and specialized Claude Code skills into coherent workflows.

## RVF: The Deployment Primitive

**RVF (RuVector Format)** is not just a file format -- it is a new deployment primitive. A single `.rvf` file is completely self-contained: no installation, no external services, no container layers. It replaces the need for separate vector databases, model registries, container images, graph stores, LLMs/GGUF, and audit logs in a single tiny, ultra-fast file. Copy one file and run it anywhere -- from embedded silicon to browsers to servers to cloud environments -- unchanged, in milliseconds.

| What's Inside | RVF Segment | What It Replaces |
|---------------|-------------|-----------------|
| Built-in runtime | WASM_SEG (5.5 KB) / KERNEL_SEG | Docker, container runtimes |
| Vector data + HNSW index | VEC_SEG + INDEX_SEG | Pinecone, Milvus, Qdrant |
| Model deltas (LoRA) | OVERLAY_SEG | Model registries |
| Graph state (GNN) | GRAPH_SEG | Neo4j, graph databases |
| Quantum state | SKETCH_SEG | Not portable elsewhere |
| Audit trail | WITNESS_SEG | External audit logs |
| Cryptographic signatures | CRYPTO_SEG (ML-DSA-65/Ed25519) | External signing services |
| eBPF acceleration | EBPF_SEG | External kernel modules |
| COW branching | COW_MAP + MEMBERSHIP | Full data copies |
| Metadata filters | META_IDX_SEG | External filter indexes |

```
rvf create vectors.rvf --dimension 384
rvf ingest vectors.rvf --input data.json --format json
rvf query  vectors.rvf --vector "0.1,0.2,..." --k 10
rvf serve  vectors.rvf --port 8080
rvf derive parent.rvf child.rvf --type filter   # COW branch
rvf launch vectors.rvf                           # Boot as microservice
```

**Packages:** `rvf-cli` (Rust), `@ruvector/rvf` (TypeScript SDK), `@ruvector/rvf-node` (N-API), `@ruvector/rvf-wasm` (browser), `@ruvector/rvf-mcp-server` (AI agents)

## Quick Reference

| Task | Command |
|------|---------|
| Install (all-in-one) | `npm install ruvector` |
| Interactive installer | `npx ruvector install` |
| RVF CLI (Rust) | `cargo install rvf-cli` |
| RVF SDK (Node.js) | `npm install @ruvector/rvf-node` |
| RVF MCP server | `npx @ruvector/rvf-mcp-server --transport stdio` |
| CLI tools | `npx @ruvector/cli@latest` |
| Self-learning hooks | `npx @ruvector/cli hooks init && npx @ruvector/cli hooks install` |
| Start server | `npx @ruvector/server@latest --port 8080` |
| PostgreSQL extension | `docker run -d -p 5432:5432 ruvnet/ruvector-postgres:latest` |

---

## Workflow Guide

| Goal | Workflow | Key Packages |
|------|----------|-------------|
| Deploy RVF cognitive container | [RVF Deployment](workflows/15-rvf-cognitive-containers.md) | rvf-cli, @ruvector/rvf, @ruvector/rvf-node |
| Set up vector database | [Vector DB Setup](workflows/01-vector-db-setup.md) | ruvector, @ruvector/core, @ruvector/node |
| Self-learning hooks for Claude Code | [Self-Learning Hooks](workflows/02-self-learning-hooks.md) | @ruvector/cli |
| LLM pipeline with adaptive learning | [SONA LLM Pipeline](workflows/03-sona-llm-pipeline.md) | @ruvector/sona, @ruvector/ruvllm, @ruvector/tiny-dancer |
| Graph-powered search & GNN | [Graph Neural Networks](workflows/04-graph-neural-networks.md) | @ruvector/gnn, @ruvector/graph-node |
| Distributed fault-tolerant cluster | [Distributed Cluster](workflows/05-distributed-cluster.md) | @ruvector/raft, @ruvector/cluster |
| Browser/edge AI with zero server | [Browser & Edge AI](workflows/06-browser-edge-ai.md) | @ruvector/wasm, @ruvector/edge |
| Brain-inspired AI systems | [Neuromorphic Computing](workflows/07-neuromorphic-computing.md) | @ruvector/spiking-neural |
| Add vectors to PostgreSQL | [PostgreSQL Extension](workflows/08-postgres-extension.md) | @ruvector/postgres-cli |
| Generate synthetic training data | [Synthetic Data](workflows/09-synthetic-data.md) | @ruvector/agentic-synth |
| Multi-agent coordination | [Multi-Agent Coordination](workflows/10-multi-agent-coord.md) | @ruvector/agentic-integration |
| Scientific document OCR | [Scientific Documents](workflows/11-scientific-docs.md) | @ruvector/scipix |
| LLM training & fine-tuning | [LLM Training](workflows/12-llm-training.md) | @ruvector/ruvllm |
| Attention mechanisms (39 types) | [Attention Mechanisms](workflows/13-attention-mechanisms.md) | @ruvector/attention |
| Math computing (optimal transport) | [Math Computing](workflows/14-math-computing.md) | @ruvector/math-wasm |

---

## Domain Skills

| Domain | Skill | Consolidates |
|--------|-------|-------------|
| RVF Cognitive Containers | [data-infrastructure](skills/data-infrastructure/SKILL.md) | rvf-cli, @ruvector/rvf, rvf-node, rvf-wasm, rvf-mcp-server |
| Data Infrastructure | [data-infrastructure](skills/data-infrastructure/SKILL.md) | core, node, wasm, rvlite, server, postgres-cli, extensions |
| Learning Pipeline | [learning-pipeline](skills/learning-pipeline/SKILL.md) | sona, ruvllm (v2.4.1: RLM, 100% routing, SIMD), attention, learning-wasm |
| Intelligent Routing | [intelligent-routing](skills/intelligent-routing/SKILL.md) | router, tiny-dancer, cli hooks |
| Graph Intelligence | [graph-intelligence](skills/graph-intelligence/SKILL.md) | gnn, graph-node, graph-wasm, graph-data-gen |
| Distributed Systems | [distributed-systems](skills/distributed-systems/SKILL.md) | raft, cluster, replication, burst-scaling |
| Edge/WASM Runtime | [edge-wasm-runtime](skills/edge-wasm-runtime/SKILL.md) | edge, edge-net, edge-full, all *-wasm |
| Neuromorphic Computing | [neuromorphic-computing](skills/neuromorphic-computing/SKILL.md) | spiking-neural, nervous-system, exotic |
| Data Generation | [data-generation](skills/data-generation/SKILL.md) | agentic-synth, graph-data-gen, scipix |
| Agent Coordination | [agent-coordination](skills/agent-coordination/SKILL.md) | agentic-integration, rudag, economy |

---

## Architecture: Complete Ecosystem Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RuVector Ecosystem (45+ packages)                 │
├─────────────────────────────────────────────────────────────────────┤
│  RVF COGNITIVE CONTAINER LAYER (canonical binary format)            │
│                                                                     │
│  rvf-cli (18 cmds)  │  @ruvector/rvf (SDK)  │  @ruvector/rvf-node  │
│  @ruvector/rvf-wasm │  @ruvector/rvf-mcp-server  │  13 Rust crates │
│                                                                     │
│  20 segment types: VEC, INDEX, OVERLAY (LoRA), GRAPH (GNN),        │
│  KERNEL (self-boot), EBPF (kernel accel), WASM (5.5KB browser),    │
│  WITNESS (audit), CRYPTO (PQ sigs), COW_MAP, MEMBERSHIP, DELTA    │
├──────────────────┬──────────────────┬───────────────────────────────┤
│  DATA LAYER      │  LEARNING LAYER  │  DEPLOYMENT LAYER             │
│                  │                  │                               │
│  @ruvector/core  │  @ruvector/sona  │  @ruvector/server (HTTP/gRPC) │
│  @ruvector/node  │  @ruvector/ruvllm│  @ruvector/postgres-cli       │
│  @ruvector/wasm  │  @ruvector/gnn   │  @ruvector/cluster            │
│  @ruvector/rvlite│  @ruvector/attn  │  @ruvector/raft               │
│  ruvector-ext    │  @ruvector/tiny  │  @ruvector/replication        │
│                  │  @ruvector/router│  @ruvector/burst-scaling       │
├──────────────────┼──────────────────┼───────────────────────────────┤
│  EDGE/WASM       │  BIO-INSPIRED    │  TOOLS & DATA                 │
│                  │                  │                               │
│  @ruvector/edge  │  spiking-neural  │  @ruvector/agentic-synth      │
│  edge-net        │  nervous-sys-wasm│  @ruvector/graph-data-gen     │
│  edge-full       │  exotic-wasm     │  @ruvector/scipix             │
│  gnn-wasm        │  learning-wasm   │  @ruvector/rudag              │
│  graph-wasm      │  economy-wasm    │  @ruvector/ruvllm-cli         │
│  attn-*-wasm     │  math-wasm       │  @ruvector/agentic-integration│
│  onnx-emb-wasm   │                  │  @ruvector/cli (hooks)        │
│  ruvllm-wasm     │                  │                               │
└──────────────────┴──────────────────┴───────────────────────────────┘
```

## Intelligence Engine

The Intelligence Engine implements adaptive learning through Q-learning (9 algorithms), HNSW semantic memory, and SONA continual learning.

| Component | Description |
|-----------|-------------|
| **Q-Learning** | α=0.1, γ=0.95, ε=0.1. 9 algorithms: Q-Learning, Double-Q, SARSA, Actor-Critic, PPO, Monte Carlo, TD-Lambda, Decision Transformer, Multi-Armed Bandit |
| **SONA** | Micro-LoRA + EWC++ enables sub-50ms learning without full model retraining |
| **HNSW Memory** | 384d embeddings, 150x-12,500x faster retrieval vs linear scan |
| **Agent Routing** | `route(task, context)` → optimal agent via SONA-computed routing weights |
| **Embeddings** | ONNX MiniLM-L6-v2 model, 384d, 8-15ms per embedding |
| **Storage** | JSON (`.ruvector/intelligence.json`), PostgreSQL (`intelligence` schema), VectorDB (HNSW), FastAgentDB (episodes) |
| **MCP Server** | 30+ tools via Model Context Protocol with stdio transport |

## Deployment Modes (6)

| Mode | Stack | Use Case |
|------|-------|----------|
| **Edge** | rvLite (2MB), WASM (5.5KB) | Offline-first, embedded |
| **Server** | HTTP REST, gRPC | Standard deployment |
| **PostgreSQL** | pgrx extension, HNSW + IVFFlat indexes | Database integration |
| **Kubernetes** | StatefulSet, PersistentVolume | Container orchestration |
| **Cloud Run** | Auto-scaling | Serverless |
| **Cognitive Container** | `.rvf` format, eBPF, KERNEL_SEG | Self-booting (<125ms) |

## DDD Bounded Contexts

| Context | Packages | Responsibility |
|---------|----------|----------------|
| **RVF Cognitive Containers** | rvf-cli, @ruvector/rvf, rvf-node, rvf-wasm, rvf-mcp-server, 13 Rust crates | Single-file deployment, COW branching, witness chains, self-booting, eBPF acceleration |
| **Data Infrastructure** | core, node, wasm, rvlite, raft, cluster, replication, server, postgres-cli, extensions | Vector storage, indexing, persistence, distribution |
| **Learning** | sona, sona-pkg, ruvllm, ruvllm-cli, ruvllm-wasm, attention (all), learning-wasm | Adaptive optimization, LLM orchestration, attention |
| **Routing** | router, tiny-dancer, cli (hooks) | Task dispatch, agent selection, intent matching |
| **Graph Intelligence** | gnn, gnn-wasm, graph-node, graph-wasm, graph-data-generator | Graph queries, neural networks, knowledge graphs |
| **Edge/WASM Runtime** | edge, edge-net, edge-full, wasm, rvlite, all *-wasm packages | Browser/edge execution, P2P networking |
| **Neuromorphic** | spiking-neural, nervous-system-wasm, exotic-wasm, economy-wasm | Bio-inspired computing, emergent behavior |
| **Data Generation** | agentic-synth, graph-data-generator, scipix | Synthetic data, OCR, test data |
| **Agent Coordination** | agentic-integration, rudag, economy-wasm | Multi-agent orchestration, task scheduling |
| **Math/Science** | math-wasm, math-wasm-scoped, onnx-embeddings-wasm | Optimal transport, geometry, embeddings |

## Performance Quick Reference

| Operation | Latency | Throughput |
|-----------|---------|------------|
| RVF Cold Boot (4KB manifest) | 1.6us | - |
| RVF COW Branch (10K vecs) | 2.6ms | child = 162 bytes |
| RVF CowMap Lookup | 28ns | - |
| RVF Membership Filter | 23-33ns | - |
| RVF Snapshot Freeze | 30-52ns | - |
| RVF WASM Runtime | - | 5.5 KB binary |
| HNSW Search (k=10, 384d) | 61us | 16,400 QPS |
| Batch Insert | - | 50,000+/sec |
| FastGRNN Route | 10us | - |
| RuvLLM Cache Lookup | 23.5ns | 42.5M/s |
| RuvLLM E2E Routing | <1ms | 1K+/s |
| RuvLLM RLM Query | 50-200ms | 5-20/s |
| Flash Attention | 2.49-7.47x speedup | - |
| MicroLoRA Adapt | <100us | - |
| WASM Vector Search (10k) | <5ms | - |
| Cosine Distance (1536d) | 143ns | 7M ops/sec |
| Dot Product (384d) | 33ns | 30M ops/sec |

---

## References

- [CLI Commands](references/commands.md)
- [API Reference](references/api-reference.md)
- [Ecosystem Map](references/ecosystem-map.md)
- [npm Packages](references/npm-packages.md)
- [Performance Benchmarks](references/performance-benchmarks.md)
- [Installation Guide](_shared/installation-guide.md)

---

## Skill Cross-Reference

All 45+ individual skills in `.claude/skills/ruvector-*/` can be invoked independently. This unified workflow composes them into production-ready pipelines. Each workflow maps to the specific skills listed in its "Related skills" section.

| Category | Count | Skills |
|----------|-------|--------|
| RVF Format | 5 | rvf-cli, @ruvector/rvf, rvf-node, rvf-wasm, rvf-mcp-server |
| Core DB | 6 | core, core-pkg, node, wasm, rvlite, ruvector |
| Learning | 6 | sona, sona-pkg, ruvllm, ruvllm-cli, ruvllm-wasm, learning-wasm |
| Attention | 4 | attention, attention-wasm, attention-wasm-pkg, attention-unified-wasm |
| Graph | 5 | gnn, gnn-wasm, graph-node, graph-wasm, graph-data-generator |
| Routing | 3 | router, tiny-dancer, cli |
| Distributed | 4 | raft, cluster, replication, burst-scaling |
| Edge/WASM | 5 | edge, edge-net, edge-full, onnx-embeddings-wasm, math-wasm |
| Bio-Inspired | 4 | spiking-neural, nervous-system-wasm, exotic-wasm, economy-wasm |
| Tools | 5 | server, extensions, agentic-synth, agentic-integration, scipix |
| Math/Other | 3 | math-wasm-scoped, rudag, postgres-cli |
