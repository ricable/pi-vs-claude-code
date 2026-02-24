# RuVector Performance Benchmarks

Collected performance numbers from across the RuVector ecosystem.

---

## RVF Cognitive Container Performance

Source: `rvf-runtime`, `rvf-cli`

| Metric | Value | Conditions |
|--------|-------|------------|
| Cold boot (4 KB manifest read) | **1.6 us** | Single pread, 4 KB root manifest |
| First query recall@10 (Layer A) | >= 0.70 | Progressive index, immediate |
| Full quality recall@10 (Layer C) | >= 0.95 | Full HNSW graph loaded |
| WASM binary (tile microkernel) | **5.5 KB** | Cognitum tiles |
| WASM binary (control plane) | **~46 KB** | Full in-memory store |
| COW branch creation (10K vecs) | **2.6 ms** | Child file = 162 bytes |
| COW branch creation (100K vecs) | **6.8 ms** | Child file = 162 bytes |
| COW read (local cluster) | 1,348 ns/vector | pread-based |
| COW read (inherited from parent) | 1,442 ns/vector | Parent fallback |
| Write coalescing (32 vecs, 1 cluster) | **654 us** | 1 COW event |
| CowMap lookup | **28 ns** | Cluster ownership check |
| Membership filter contains() | **23-33 ns** | Branch visibility check |
| Snapshot freeze | **30-52 ns** | Metadata-only operation |
| Segment header size | 64 bytes | Cache-line aligned |
| Minimum file overhead | < 256 bytes | Minimal .rvf file |

### RVF CLI Commands

```bash
rvf create vectors.rvf --dimension 384
rvf ingest vectors.rvf --input data.json --format json
rvf query  vectors.rvf --vector "0.1,0.2,..." --k 10
rvf status vectors.rvf --json
rvf inspect vectors.rvf              # Show all 20 segment types
rvf compact vectors.rvf              # Reclaim deleted space
rvf derive parent.rvf child.rvf      # COW branch
rvf serve  vectors.rvf --port 8080   # HTTP server
rvf launch vectors.rvf               # Boot as Linux microVM
rvf verify-witness vectors.rvf       # Verify audit chain
```

### RVF vs Alternatives

| Feature | RVF | Annoy | FAISS | Qdrant | Milvus | SQLite |
|---------|-----|-------|-------|--------|--------|--------|
| Single-file | Yes | Yes | No | No | No | Yes |
| Crash-safe (no WAL) | Yes | No | No | No | No | No |
| Progressive loading | Yes (3 layers) | No | No | No | No | N/A |
| COW branching | Yes (cluster-level) | No | No | No | No | No |
| WASM support | Yes (5.5 KB) | No | No | No | No | Via wasm |
| Self-booting kernel | Yes (real Linux) | No | No | No | No | No |
| eBPF acceleration | Yes (XDP/TC) | No | No | No | No | No |
| Post-quantum sigs | Yes (ML-DSA-65) | No | No | No | No | No |
| TEE attestation | Yes | No | No | No | No | No |
| Lineage provenance | Yes (DNA-style) | No | No | No | No | No |

---

## HNSW Vector Search

Source: `@ruvector/core`, `@ruvector/node`

| Metric | Value | Conditions |
|--------|-------|------------|
| Insert throughput | 50,000+ vectors/sec | Batch insert, Rust NAPI |
| Search latency (10k vectors) | < 1ms | cosine metric, ef_search=50 |
| Search latency (SIMD) | < 0.5ms | @ruvector/node with SSE4.2/AVX2 |
| Max dimensions | 4,096 | All distance metrics |
| Supported SIMD | SSE4.2, AVX2, AVX-512, NEON | Auto-detected |
| Memory model | Zero-copy | Rust NAPI bindings |
| Persistence | Memory-mapped I/O | Disk-backed |

### HNSW Parameters

| Parameter | Recommended | Effect |
|-----------|-------------|--------|
| `efConstruction` | 200 | Higher = better recall, slower build |
| `m` | 16 | Higher = better recall, more memory |
| `efSearch` | 50-200 | Higher = better recall, slower search |

---

## WASM Vector Search

Source: `@ruvector/wasm`

| Metric | Value | Conditions |
|--------|-------|------------|
| Search latency | < 5ms | 10k vectors, browser |
| Bundle size | ~200KB | gzipped |
| Max vectors | ~100k | Browser memory limit |
| Serialization | Binary (Uint8Array) | IndexedDB-compatible |
| Supported runtimes | Browser, Cloudflare Workers, Deno, Bun | WASM |

---

## FastGRNN Routing

Source: `@ruvector/tiny-dancer`

| Metric | Value | Conditions |
|--------|-------|------------|
| Routing latency | 10us | Single routing decision |
| Hidden size | 32-64 | Configurable |
| Circuit breaker recovery | 30s | Default recovery time |
| Warmup requests | 100 | Before full confidence |
| Model hot-reload | Zero downtime | Weight swap |

---

## Flash Attention

Source: `@ruvector/attention`

| Metric | Value | Conditions |
|--------|-------|------------|
| Speed improvement | 2.49x - 7.47x | vs. standard attention |
| Memory reduction | ~50% | IO-aware tiling |
| Block size | 256 | Default, configurable |
| Causal masking | Supported | No overhead |
| Linear attention | O(n) | vs O(n^2) standard |

---

## MicroLoRA Adaptation

Source: `@ruvector/learning-wasm`

| Metric | Value | Conditions |
|--------|-------|------------|
| Adaptation latency | < 100us | Rank-2 LoRA, WASM |
| Supported ranks | 1-8 | Lower = faster |
| Runtime | Browser + Node.js | WebAssembly |
| GPU requirement | None | CPU-only |
| Weight application | `W' = W + alpha * B * A` | Standard LoRA |

---

## SIMD Distance Computation

Source: `@ruvector/node`

| Metric | Value | Conditions |
|--------|-------|------------|
| Cosine distance | SIMD-accelerated | Auto-detected ISA |
| Euclidean distance | SIMD-accelerated | L2 norm |
| Dot product | SIMD-accelerated | Inner product |
| SIMD backends | SSE4.2, AVX2, AVX-512, ARM NEON | Platform-specific |

---

## Spiking Neural Networks

Source: `@ruvector/spiking-neural`

| Metric | Value | Conditions |
|--------|-------|------------|
| SIMD acceleration | Yes | Auto-enabled |
| Timestep resolution | 0.5ms | Default `dt` |
| Neuron models | Izhikevich, LIF, Hodgkin-Huxley, Poisson | Configurable |
| STDP learning | Online | Spike-timing dependent |
| Max synaptic delay | 20ms | Default |

### CLI Benchmarks

```bash
npx @ruvector/spiking-neural sim --neurons 10000 --steps 1000
npx @ruvector/spiking-neural sim --neurons 1000 --output spikes.json
```

---

## Semantic Routing

Source: `@ruvector/router`

| Metric | Value | Conditions |
|--------|-------|------------|
| Routing latency | < 1ms | SIMD-accelerated HNSW |
| Embedding support | ONNX, OpenAI, custom | Pluggable |
| Max routes | Unlimited | Memory-bound |
| Multilingual | Yes | With multilingual model |
| Threshold tuning | Per-route | Configurable |

---

## Distributed Systems

Source: `@ruvector/cluster`, `@ruvector/burst-scaling`

| Metric | Value | Conditions |
|--------|-------|------------|
| Burst scaling | 10-50x | Auto-provisioned workers |
| Base workers | 4 | Default minimum |
| Max workers | 64 | Configurable |
| Circuit breaker recovery | 30s | Default |
| Scatter-gather search | Per-shard timeout | Configurable |

---

## PostgreSQL Extension

Source: `@ruvector/postgres-cli`

| Metric | Value | Conditions |
|--------|-------|------------|
| SQL functions | 53+ | Dense, sparse, hyperbolic, GNN, attention |
| Index types | HNSW, IVFFlat | pgvector-compatible |
| Quantization | int8, binary, product, scalar | Memory reduction |
| Vector types | Dense, Sparse, Hyperbolic | All supported |

### Benchmark Commands

```bash
npx @ruvector/postgres-cli@latest bench --type insert --count 100000 --dimensions 768
npx @ruvector/postgres-cli@latest bench --type search --queries 10000 --top-k 10
npx @ruvector/postgres-cli@latest bench --type hnsw --ef-values "50,100,200" --count 50000
npx @ruvector/postgres-cli@latest bench --type sparse --count 5000 --sparsity 0.95
```

---

## LLM Inference

Source: `@ruvector/ruvllm-cli`

| Metric | Output |
|--------|--------|
| Tokens/sec (prompt) | Model-dependent |
| Tokens/sec (generation) | Model-dependent |
| Time to first token | Model-dependent |
| GPU backends | Metal (macOS), CUDA (Linux/Win), Vulkan |
| Quantization support | q2_k through f16 |

### Benchmark Command

```bash
npx @ruvector/ruvllm-cli@latest bench --model ./model.gguf --iterations 10 --gpu
```

---

## Summary Table

| Component | Key Metric | Value |
|-----------|-----------|-------|
| RVF Cold Boot | Latency | 1.6us |
| RVF COW Branch (10K) | Latency | 2.6ms |
| RVF CowMap Lookup | Latency | 28ns |
| RVF WASM Runtime | Size | 5.5 KB |
| HNSW Insert | Throughput | 50k+ vectors/sec |
| HNSW Search | Latency (10k) | < 1ms |
| SIMD Search | Latency | < 0.5ms |
| WASM Search | Latency (10k) | < 5ms |
| FastGRNN Route | Latency | 10us |
| Flash Attention | Speedup | 2.49x-7.47x |
| Flash Attention | Memory | -50% |
| MicroLoRA | Adaptation | < 100us |
| Semantic Route | Latency | < 1ms |
| Burst Scaling | Capacity | 10-50x |
| WASM Bundle | Size | ~200KB gzipped |
