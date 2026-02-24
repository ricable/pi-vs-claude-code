# Workflow 15: RVF Cognitive Containers

Deploy, manage, and orchestrate RVF (RuVector Format) cognitive containers -- the deployment primitive that replaces separate vector databases, model registries, container images, graph stores, and audit logs with a single self-contained file.

---

## What is RVF?

RVF is not just a file format. It is a new deployment primitive. A single `.rvf` file is completely self-contained -- no installation, no external services, no container layers. Copy one file and run it anywhere: from embedded silicon to browsers to servers to cloud environments, unchanged, in milliseconds.

**What happens inside that one file, in order of execution:**

1. **Built-in runtime** -- Runs anywhere: browser via WASM (5.5 KB), kernel-level via eBPF, or its own Linux microkernel in milliseconds
2. **Cryptographic trust** -- Verifies itself before execution. Signatures bind runtime to data. Optional TEE attestation
3. **Vector data** -- AI's memory: embeddings for language, vision, audio, signals, or learned state
4. **Progressive search** -- Similarity search works immediately (70% recall) and improves to 95%+ as deeper layers load
5. **Metadata filters** -- Structured rules applied inside similarity search
6. **Graph state** -- Relationship structure for reasoning and inference
7. **Model updates** -- MicroLoRA patches without copying full models
8. **RVCOW branching** -- Git-style branching for intelligence. Share everything, store only changes
9. **Audit history** -- Tamper-evident witness chain recording every mutation and query

---

## Quick Start

### Install

```bash
# Rust CLI
cargo install rvf-cli

# Node.js SDK
npm install @ruvector/rvf-node

# WASM (browser)
rustup target add wasm32-unknown-unknown
cargo build -p rvf-wasm --target wasm32-unknown-unknown --release

# MCP Server (for AI agents)
npx @ruvector/rvf-mcp-server --transport stdio
```

### Create, Populate, Query

```bash
rvf create vectors.rvf --dimension 384
rvf ingest vectors.rvf --input data.json --format json
rvf query  vectors.rvf --vector "0.1,0.2,..." --k 10
rvf status vectors.rvf --json
```

### Node.js

```javascript
const { RvfDatabase } = require('@ruvector/rvf-node');

const db = RvfDatabase.create('vectors.rvf', { dimension: 384 });
db.ingestBatch(new Float32Array(384), [1]);
const results = db.query(new Float32Array(384), 10);
console.log(db.fileId());       // unique UUID
console.log(db.segments());     // [{ type, id, size }]
db.close();
```

### Browser (WASM)

```html
<script type="module">
  import init, { WasmRvfStore } from './rvf_wasm.js';
  await init();
  const store = WasmRvfStore.create(384);
  store.ingest(1, new Float32Array(384));
  const results = store.query(new Float32Array(384), 10);
</script>
```

### Rust

```rust
use rvf_runtime::{RvfStore, options::{RvfOptions, QueryOptions, DistanceMetric}};

let mut store = RvfStore::create("vectors.rvf", RvfOptions {
    dimension: 384,
    metric: DistanceMetric::Cosine,
    ..Default::default()
})?;

store.ingest_batch(&[&embedding], &[1], None)?;
let results = store.query(&query, 10, &QueryOptions::default())?;
store.close()?;
```

---

## Workflow: Sealed Domain Intelligence Unit

Build a complete AI system as a single deployable file:

### Step 1: Create and Populate

```bash
rvf create domain.rvf --dimension 384
rvf ingest domain.rvf --input corpus-embeddings.json --format json
```

### Step 2: Add Model Deltas (LoRA)

```rust
store.embed_overlay(&lora_adapter_deltas)?;  // OVERLAY_SEG
```

### Step 3: Add Graph State

```rust
store.embed_graph(&gnn_adjacency, &edge_weights)?;  // GRAPH_SEG
```

### Step 4: Embed Runtime

```bash
rvf embed-kernel domain.rvf --arch x86_64    # Self-booting Linux microservice
rvf embed-ebpf domain.rvf --program hot-lookup.c  # Kernel acceleration
```

### Step 5: Sign and Attest

The file now verifies itself before execution. Signatures bind the kernel to the data:

```bash
rvf verify-witness domain.rvf       # Verify tamper-evident chain
rvf verify-attestation domain.rvf   # Verify kernel binding
```

### Step 6: Deploy Anywhere

```bash
# As a server microservice
rvf launch domain.rvf               # Boots Linux in <125ms

# As a REST API
rvf serve domain.rvf --port 8080

# In a browser (same file, no conversion)
# Just load with rvf_wasm.js

# Air-gapped / edge
scp domain.rvf edge-device:~/
```

---

## Workflow: COW Branching for Multi-Tenant

### Step 1: Create Parent Store

```bash
rvf create parent.rvf --dimension 384
rvf ingest parent.rvf --input shared-corpus.json --format json
```

### Step 2: Derive Tenant Branches

```bash
rvf derive parent.rvf tenant-a.rvf --type filter  # 2.6ms, child = 162 bytes
rvf derive parent.rvf tenant-b.rvf --type filter
```

### Step 3: Set Visibility

```bash
rvf filter tenant-a.rvf --include "1,2,3,100,200"  # Only these vectors visible
rvf filter tenant-b.rvf --exclude "1,2,3"           # Everything except these
```

### Step 4: Freeze Snapshots

```bash
rvf freeze tenant-a.rvf  # Immutable snapshot (metadata-only, no copy)
```

A 1M-vector parent (~512 MB) with 100 modified vectors produces a child of ~2.5 MB.

---

## Workflow: MCP Agent Integration

### Step 1: Add MCP Server to Claude Code

```json
{
  "mcpServers": {
    "rvf": {
      "command": "npx",
      "args": ["@ruvector/rvf-mcp-server", "--transport", "stdio"]
    }
  }
}
```

### Step 2: Agent Creates and Queries Stores

Available MCP tools:

| Tool | Description |
|------|-------------|
| `rvf_create_store` | Create a new RVF vector store |
| `rvf_open_store` | Open existing (read-write or read-only) |
| `rvf_ingest` | Insert vectors with optional metadata |
| `rvf_query` | k-NN similarity search with metadata filters |
| `rvf_compact` | Compact store to reclaim dead space |
| `rvf_status` | Get dimensions, vector count, etc. |
| `rvf_list_stores` | List all open stores |

---

## 20 Segment Types Reference

| Segment | Code | Purpose |
|---------|------|---------|
| MANIFEST_SEG | 0x00 | Level0Root manifest with file metadata |
| VEC_SEG | 0x01 | Raw vector data (f32, f16, bf16, int8) |
| INDEX_SEG | 0x02 | HNSW progressive index (Layer A/B/C) |
| META_SEG | 0x03 | Vector metadata (JSON, CBOR) |
| QUANT_SEG | 0x04 | Quantization codebooks (scalar/PQ/binary) |
| OVERLAY_SEG | 0x05 | LoRA adapter deltas, MicroLoRA patches |
| GRAPH_SEG | 0x06 | Property graph adjacency data |
| TENSOR_SEG | 0x07 | Dense tensor data |
| WASM_SEG | 0x08 | Embedded WASM modules |
| MODEL_SEG | 0x09 | ML model weights |
| CRYPTO_SEG | 0x0A | Signatures and key material (ML-DSA-65/Ed25519) |
| WITNESS_SEG | 0x0B | Append-only witness/audit chain |
| CONFIG_SEG | 0x0C | Runtime configuration |
| CUSTOM_SEG | 0x0D | User-defined segment |
| KERNEL_SEG | 0x0E | Linux microkernel image |
| EBPF_SEG | 0x0F | eBPF programs (XDP/TC/socket) |
| COW_MAP_SEG | 0x20 | Copy-on-write cluster map |
| REFCOUNT_SEG | 0x21 | Cluster reference counts |
| MEMBERSHIP_SEG | 0x22 | Branch membership filter |
| DELTA_SEG | 0x23 | Sparse delta patches (LoRA) |

---

## Domain Profiles

| Extension | Profile | Optimized For |
|-----------|---------|---------------|
| `.rvf` | Generic | General-purpose vectors |
| `.rvdna` | RVDNA | Genomic sequence embeddings |
| `.rvtext` | RVText | Language model embeddings |
| `.rvgraph` | RVGraph | Graph/network node embeddings |
| `.rvvis` | RVVision | Image/vision model embeddings |

---

## Where It Runs

| Environment | How | Latency |
|-------------|-----|---------|
| Server | Full HNSW index, millions of vectors | Sub-millisecond queries |
| Browser | 5.5 KB WASM microkernel | Same file, no backend |
| Edge / IoT | Lightweight rvlite API | Tiny footprint |
| TEE enclave | Confidential Core attestation | Cryptographic proof |
| Bare metal / VM | KERNEL_SEG boots Linux | < 125 ms cold start |
| Linux kernel | EBPF_SEG hot-path acceleration | Sub-microsecond |

---

## Performance

| Metric | Value |
|--------|-------|
| Cold boot | 1.6us |
| COW branch (10K vecs) | 2.6ms |
| COW branch (100K vecs) | 6.8ms |
| CowMap lookup | 28ns |
| Membership filter | 23-33ns |
| Snapshot freeze | 30-52ns |
| WASM microkernel | 5.5 KB |
| WASM control plane | ~46 KB |
| Progressive recall (Layer A) | >= 0.70 |
| Full recall (Layer C) | >= 0.95 |

---

---

## N-API Methods (Node.js) — 19 Methods

| Method | Description |
|--------|-------------|
| `RvfDatabase.create(path, opts)` | Create new RVF file |
| `RvfDatabase.open(path)` | Open existing (read-write) |
| `RvfDatabase.openReadonly(path)` | Open existing (read-only) |
| `db.ingestBatch(vectors, ids)` | Insert vectors by batch |
| `db.query(vector, k)` | k-NN search |
| `db.delete(ids)` | Delete vectors by ID |
| `db.deleteByFilter(filter)` | Delete vectors matching filter |
| `db.compact()` | Compact and reclaim space |
| `db.status()` | File status (count, dimension, metric) |
| `db.close()` | Close file handle |
| `db.fileId()` | UUID of this file |
| `db.parentId()` | UUID of parent (if derived) |
| `db.lineageDepth()` | Derivation depth |
| `db.derive(path)` | COW-branch to new file |
| `db.embedKernel(bytes)` | Embed Linux kernel image |
| `db.extractKernel()` | Extract kernel image |
| `db.embedEbpf(bytes)` | Embed eBPF program |
| `db.extractEbpf()` | Extract eBPF program |
| `db.segments()` | List all segments |

---

## WASM Exports — 29 Functions

| Category | Count | Functions |
|----------|-------|-----------|
| Control plane | 10 | `rvf_create`, `rvf_open`, `rvf_close`, `rvf_ingest`, `rvf_query`, `rvf_delete`, `rvf_status`, `rvf_compact`, `rvf_derive`, `rvf_segments` |
| Tile compute | 14 | `tile_dot_f32`, `tile_cosine_f32`, `tile_l2_f32`, `tile_dot_f16`, `tile_cosine_f16`, `tile_l2_f16`, `tile_topk`, `tile_quantize_sq8`, `tile_dequantize_sq8`, `tile_scan_filtered`, `tile_merge_topk`, `tile_batch_distance`, `tile_prefetch`, `tile_accumulate` |
| Segment parsing | 3 | `parse_segment_header`, `parse_vec_header`, `parse_manifest` |
| Memory | 2 | `rvf_alloc`, `rvf_free` |

---

## Rust Crate Structure (13 crates)

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

---

## Example .rvf Files (45 pre-built)

45 example files (~11 MB total) demonstrating every segment type and use case:

```bash
# Download examples
git clone --depth 1 --filter=blob:none --sparse https://github.com/ruvnet/ruvector.git
cd ruvector && git sparse-checkout set examples/rvf/output

# Generate locally
cd crates/rvf && cargo run --example generate_all
```

| Category | Files |
|----------|-------|
| **Core** | `basic_store.rvf` (152 KB), `semantic_search.rvf` (755 KB), `rag_pipeline.rvf` (303 KB), `embedding_cache.rvf` (755 KB), `quantization.rvf` (1.5 MB), `progressive_index.rvf` (2.5 MB), `filtered_search.rvf` (255 KB), `recommendation.rvf` (102 KB) |
| **AI Agents** | `agent_memory.rvf` (32 KB), `swarm_knowledge.rvf` (86 KB), `experience_replay.rvf` (27 KB), `tool_cache.rvf` (26 KB), `mcp_in_rvf.rvf` (32 KB), `ruvbot.rvf` (51 KB), `claude_code_appliance.rvf` (17 KB), `ruvllm_inference.rvf` (133 KB) |
| **COW Branching** | `lineage_parent.rvf` (52 KB), `lineage_child.rvf` (26 KB), `reasoning_parent.rvf` (5.6 KB), `reasoning_child.rvf` (8.1 KB), `reasoning_grandchild.rvf` (162 B) |
| **Compute** | `self_booting.rvf` (31 KB), `linux_microkernel.rvf` (15 KB), `ebpf_accelerator.rvf` (153 KB), `browser_wasm.rvf` (14 KB) |
| **Security** | `tee_attestation.rvf` (102 KB), `zero_knowledge.rvf` (52 KB), `sealed_engine.rvf` (208 KB), `access_control.rvf` (77 KB) |
| **Domain** | `financial_signals.rvf` (202 KB), `medical_imaging.rvf` (302 KB), `legal_discovery.rvf` (903 KB), `multimodal_fusion.rvf` (804 KB), `hyperbolic_taxonomy.rvf` (23 KB), `network_telemetry.rvf` (16 KB) |
| **Infra** | `postgres_bridge.rvf` (152 KB), `serverless.rvf` (509 KB), `edge_iot.rvf` (27 KB), `dedup_detector.rvf` (153 KB), `compacted.rvf` (77 KB) |
| **Multi-node** | `network_sync_a/b.rvf` (52 KB each), `agent_handoff_a.rvf` (31 KB), `agent_handoff_b.rvf` (11 KB) |

---

## Advanced: Self-Booting Microservice (Rust)

Create a single `.rvf` file that contains vectors AND a bootable kernel:

```rust
use rvf_runtime::{RvfStore, RvfOptions, QueryOptions};
use rvf_runtime::options::DistanceMetric;
use rvf_types::kernel::{KernelArch, KernelType};

// 1. Create store with vectors
let mut store = RvfStore::create("bootable.rvf", RvfOptions {
    dimension: 128, metric: DistanceMetric::L2, ..Default::default()
})?;
store.ingest_batch(&vectors, &ids, None)?;

// 2. Embed kernel — file now boots as a microservice
store.embed_kernel(
    KernelArch::X86_64 as u8,
    KernelType::Hermit as u8,
    0x0018,  // HAS_QUERY_API | HAS_NETWORKING
    &kernel_image,
    8080,
    Some("console=ttyS0 quiet"),
)?;

// 3. Verify everything is in one file
let (header, image) = store.extract_kernel()?.unwrap();
store.close()?;
// Result: 31 KB file with vectors + kernel + witness chain
```

---

## Related Skills

- [Data Infrastructure](../skills/data-infrastructure/SKILL.md) -- RVF packages and APIs
- [Edge/WASM Runtime](../skills/edge-wasm-runtime/SKILL.md) -- Browser deployment
- [Learning Pipeline](../skills/learning-pipeline/SKILL.md) -- OVERLAY_SEG for LoRA
- [Distributed Systems](../skills/distributed-systems/SKILL.md) -- COW branching
- [Agent Coordination](../skills/agent-coordination/SKILL.md) -- MCP integration
- [Graph Intelligence](../skills/graph-intelligence/SKILL.md) -- GRAPH_SEG
- [Neuromorphic Computing](../skills/neuromorphic-computing/SKILL.md) -- SKETCH_SEG
- [Data Generation](../skills/data-generation/SKILL.md) -- Data importers

## Related References

- [API Reference](../references/api-reference.md)
- [CLI Commands](../references/commands.md)
- [Performance Benchmarks](../references/performance-benchmarks.md)
- [npm Packages](../references/npm-packages.md)
- [Ecosystem Map](../references/ecosystem-map.md)
