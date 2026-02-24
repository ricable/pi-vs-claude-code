# Workflow 13: Attention Mechanisms (39 Types)

> Back to [RuVector Hub](../SKILL.md)

**Goal:** Select and apply the optimal attention mechanism for your use case.

### Selection Guide

| Mechanism | Complexity | Best For |
|-----------|------------|----------|
| FlashAttention | O(n^2) time, O(n) mem | Long sequences, limited memory |
| LinearAttention | O(n*d) | 8K+ tokens, real-time streaming |
| MultiHeadAttention | O(n^2*h) | BERT/GPT-style transformers |
| HyperbolicAttention | O(n^2) | Hierarchical data, taxonomies |
| GraphRoPE | O(n^2) | Position-aware graph transformers |
| MoEAttention | O(n*k) | Large models, sparse expert routing |
| SparseAttention | O(n*s) | Long documents, low-memory |
| CrossAttention | O(n*m) | Image-text, encoder-decoder |
| MinCut-Gated | O(n^2) | 50% compute reduction |
| Mamba SSM | O(n) | Linear-time sequences |

### Usage

```typescript
// Node.js
import { FlashAttention } from '@ruvector/attention';
const attn = new FlashAttention({ heads: 8, dim: 64, blockSize: 256 });
const output = await attn.forward(Q, K, V);

// Browser (WASM)
import { UnifiedAttention, availableMechanisms } from '@ruvector/attention-unified-wasm';
const attn = new UnifiedAttention('flash');
console.log(attn.supportsSequences()); // true

// CLI
npx ruvector attention list
npx ruvector attention benchmark
npx ruvector attention compute -t flash -d 128
```

**Related skills:** `ruvector-attention`, `ruvector-attention-wasm`, `ruvector-attention-wasm-pkg`, `ruvector-attention-unified-wasm`
