# Attention Mechanisms

> Part of the [RuVector Plugin](../SKILL.md). See also: [neuromorphic](neuromorphic.md), [postgres](postgres.md).

## Mechanism Selection Guide

| Type | Package | Complexity | Use Case |
|------|---------|-----------|----------|
| Flash | `attention` / `attention-wasm` | O(N) memory | Large-context, causal LM |
| Linear | `attention` / `attention-wasm` | O(N) compute | 100K+ token contexts |
| MultiHead | `attention` / `attention-wasm` | Standard | General transformer layers |
| Cross | `attention` / `attention-wasm` | Standard | Encoder-decoder, RAG |
| Hyperbolic | `attention-wasm-pkg` | Poincare ball | Hierarchical / tree data |
| DAG | `attention-unified-wasm` | Graph-aware | Workflow dependencies |
| Graph (GAT) | `attention-unified-wasm` | Node features | Knowledge graphs, GNNs |
| Mamba SSM | `attention-unified-wasm` | State-space | Sequential, generation |
| Sparse | `attention-unified-wasm` | Block-sparse | Long docs, strided |
| MoE / RoPE / ALiBi | `attention-unified-wasm` | Specialized | Position encoding variants |

Full list of 18+ types via `UnifiedAttention.list()`.

## Node.js API

```typescript
import { FlashAttention, MultiHeadAttention, CrossAttention, LinearAttention } from '@ruvector/attention';

// Flash Attention (2.49x-7.47x speedup, O(N) memory)
const flash = new FlashAttention({ heads: 8, dim: 64, blockSize: 256, causal: true });
const out = await flash.forward(Q, K, V);
const scores = await flash.attentionScores(Q, K);

// Multi-Head Attention
const mha = new MultiHeadAttention({ modelDim: 512, heads: 8, dropout: 0.1 });
const mhaOut = await mha.forward(Q, K, V);

// Cross Attention (two different sequences)
const cross = new CrossAttention({ queryDim: 512, keyDim: 768, heads: 8 });

// Linear Attention (O(N) -- handles 100K+ tokens)
const linear = new LinearAttention({ dim: 64, heads: 8, featureMap: 'elu' });
```

## WASM API (Browser + Edge)

```typescript
import init, { WasmFlashAttention, WasmMultiHeadAttention } from '@ruvector/attention-wasm';
await init();

const attn = new WasmFlashAttention({ heads: 8, dim: 64, simd: true });
const output = attn.forward(Q, K, V);          // returns Float32Array
console.log(`Memory: ${attn.getMemoryUsage().heapUsed} bytes`);
attn.dispose();  // free WASM memory
```

## Unified WASM (18+ Mechanisms)

```typescript
import init, { UnifiedAttention, DAGAttention, GraphAttention, MambaSSM } from '@ruvector/attention-unified-wasm';
await init();

// Switch mechanism by name
const flash = UnifiedAttention.forward(q, k, v, { type: 'flash', seqLen: 128, dim: 256, causal: true });
const sparse = UnifiedAttention.forward(q, k, v, { type: 'sparse', seqLen: 128, dim: 256, sparsityPattern: 'strided', blockSize: 16 });

// DAG-structured attention
const dagOut = DAGAttention.forward(q, k, v, { seqLen: 128, dim: 256, adjacency, topologicalSort: true });

// Graph Attention Network (GAT)
const graphOut = GraphAttention.forward(nodeFeatures, {
  numNodes: 100, featureDim: 64, edges, numHeads: 4, edgeDropout: 0.1,
});

// Mamba SSM (selective state-space)
const mamba = new MambaSSM({ modelDim: 256, stateDim: 16, expandFactor: 2 });
const seqOut = mamba.forward(input, { seqLen: 128 });
const token = mamba.stepDecoding(singleToken);  // autoregressive generation
mamba.free();
```

## Hyperbolic Attention

```typescript
import init, { HyperbolicAttention } from 'ruvector-attention-wasm';
await init();

const out = HyperbolicAttention.forward(q, k, v, {
  seqLen: 64, dim: 256, curvature: -1.0, numHeads: 4,
});
```

## Benchmarking

```typescript
// Node.js
const result = await flash.benchmark(4096);
console.log(`Seq 4096: ${result.opsPerSecond} ops/s, ${result.memoryMB} MB`);

// WASM
const wasmResult = wasmAttn.benchmark(4096);
```

## Agent Coordination via Attention

```typescript
const coordinator = new MultiHeadAttention({ modelDim: 256, heads: 4 });
const agentStates = stackAgentEmbeddings(agents);
const coordinated = await coordinator.forward(agentStates, agentStates, agentStates);
// coordinated[i] = attention-weighted blend of all agent states
```

## Source Packages

- [@ruvector/attention](https://www.npmjs.com/package/@ruvector/attention) -- Node.js attention (Flash, MHA, Cross, Linear)
- [@ruvector/attention-wasm](https://www.npmjs.com/package/@ruvector/attention-wasm) -- WASM SIMD attention for browser/edge
- [@ruvector/attention-unified-wasm](https://www.npmjs.com/package/@ruvector/attention-unified-wasm) -- 18+ mechanisms unified API
- [ruvector-attention-wasm](https://www.npmjs.com/package/ruvector-attention-wasm) -- Hyperbolic + Flash + MHA WASM
