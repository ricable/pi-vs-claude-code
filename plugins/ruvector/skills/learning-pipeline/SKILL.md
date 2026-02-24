---
name: "learning-pipeline"
description: "Self-optimizing neural architectures, LLM orchestration, attention mechanisms, edge-compatible MicroLoRA adaptation, and RVF OVERLAY_SEG for sealed LoRA distribution."
---

# Learning Pipeline

> Consolidated from: `@ruvector/sona`, `ruvector-sona`, `@ruvector/ruvllm`, `@ruvector/attention`, `@ruvector/learning-wasm`. Part of the [RuVector Plugin](../../SKILL.md).

## RVF Integration: Sealed LoRA Distribution

Learning artifacts ship inside RVF cognitive containers via `OVERLAY_SEG`. Instead of distributing model weights + adapter + config separately, ship a signed bootable artifact. No one can swap LoRA weights without breaking the cryptographic signature.

| RVF Segment | Learning Use |
|-------------|-------------|
| `OVERLAY_SEG` | LoRA adapter deltas, MicroLoRA patches |
| `VEC_SEG` | LLM KV cache, experience replay embeddings |
| `WITNESS_SEG` | Audit trail of all training/adaptation operations |
| `DELTA_SEG` (0x23) | Sparse delta patches for incremental model updates |

**Use cases:** Enterprise custom LLM per tenant, offline personal AI, industrial domain expert systems, sealed model versioning for regulatory compliance.

## Package Overview

| Package | Version | Purpose | Runtime |
|---------|---------|---------|---------|
| `@ruvector/sona` | - | SONA adaptive learning, LoRA, EWC++, ReasoningBank | Node.js |
| `ruvector-sona` | - | SONA for LLM routing, two-tier LoRA, cost optimizer | Node.js |
| `@ruvector/ruvllm` | 2.4.1 | Self-learning LLM orchestration, RLM recursive retrieval, 100% routing accuracy, SIMD inference | Node.js + N-API |
| `@ruvector/attention` | - | Flash/Multi-Head/Cross/Linear attention | Node.js |
| `@ruvector/learning-wasm` | - | MicroLoRA adaptation, sub-100us latency | WASM |

## Core API

### RuvLLM (v2.4.1) — LLM Orchestration + Claude Code Routing

Purpose-built LLM runtime for Claude Code agent orchestration with 100% routing accuracy via hybrid keyword + embedding strategy.

```typescript
import { RuvLLM } from '@ruvector/ruvllm';

const llm = new RuvLLM({
  modelPath: '~/.ruvllm/models/ruvltra-claude-code-0.5b-q4_k_m.gguf',
  sonaEnabled: true,
});

// Query
const response = await llm.query('Explain quantum computing');
console.log(response.text);

// Streaming
for await (const chunk of llm.stream(prompt)) { process.stdout.write(chunk); }

// Claude Code agent routing (60+ agent types)
const route = await llm.route('implement OAuth2 authentication');
// → { agent: 'security-architect', confidence: 0.98, tier: 2 }

// Multi-agent team routing
const team = await llm.routeComplex('build full-stack app with auth');
// → [system-architect, backend-dev, coder, security-architect, tester]

// Memory-augmented (HNSW-indexed, <25μs recall)
llm.addMemory('OAuth patterns use JWT refresh tokens', { domain: 'auth' });
const results = llm.searchMemory('token refresh', 5);

// SONA self-learning stats
const stats = llm.sonaStats();
```

**3-Tier Intelligent Routing:**

| Tier | Handler | Latency | Cost |
|------|---------|---------|------|
| 1 | Booster (WASM) | <1ms | $0 |
| 2 | Haiku | ~500ms | $0.0002 |
| 3 | Opus | 2-5s | $0.015 |

**Confidence-Aware Escalation:** >0.9 = use agent, 0.7-0.9 = human confirmation, <0.7 = escalate tier.

### RLM (Recursive Language Model)

Recursive query decomposition — unlike traditional RAG that retrieves once, RLM breaks complex questions into sub-queries and synthesizes coherent answers.

```typescript
import { RlmController } from '@ruvector/ruvllm';

const rlm = new RlmController({
  maxDepth: 5,
  retrievalTopK: 10,
  enableCache: true,
});

// Add knowledge to memory
await rlm.addMemory('TypeScript adds static typing to JavaScript.');

// Query with recursive retrieval
const answer = await rlm.query('What are causes and solutions for type errors in React?');
console.log(answer.text);           // Comprehensive synthesized answer
console.log(answer.sources);        // Source attributions
console.log(answer.qualityScore);   // 0.0-1.0

// Streaming
for await (const event of rlm.queryStream('Explain machine learning')) {
  if (event.type === 'token') process.stdout.write(event.text);
}

// Self-reflection mode (iterative refinement until quality >= threshold)
const reflectiveRlm = new RlmController({
  enableReflection: true,
  maxReflectionIterations: 2,
  minQualityScore: 0.8,
});
```

**RLM Configuration:**

```typescript
interface RlmConfig {
  maxDepth?: number;              // Max recursion depth (default: 3)
  maxSubQueries?: number;         // Max sub-queries per level (default: 5)
  tokenBudget?: number;           // Token budget (default: 4096)
  enableCache?: boolean;          // Enable caching (default: true)
  cacheTtl?: number;              // Cache TTL in ms (default: 300000)
  retrievalTopK?: number;         // Memory spans to retrieve (default: 10)
  minQualityScore?: number;       // Min quality threshold (default: 0.7)
  enableReflection?: boolean;     // Enable self-reflection (default: false)
  maxReflectionIterations?: number; // Max reflection loops (default: 2)
}
```

### SIMD Acceleration

```typescript
import { simd } from '@ruvector/ruvllm/simd';

// 4x faster vector operations with AVX2/NEON
const similarity = simd.batchCosineSimilarity(query, targets);
const attended = simd.flashAttention(q, k, v, scale);
```

### SONA

```typescript
import { SONA } from '@ruvector/sona';
const sona = new SONA({ learningRate: 0.01, ewcLambda: 0.5, loraRank: 8, reasoningBank: true });

await sona.adapt(input, feedback);          // Online adaptation
const pred = await sona.predict(input);     // Inference
await sona.consolidate();                   // EWC++ anti-forgetting
const patterns = await sona.getPatterns('auth flow', 5); // ReasoningBank
```

### SONARouter (LLM model selection)

```typescript
import { SONARouter } from 'ruvector-sona';
const router = new SONARouter({
  models: ['claude-sonnet', 'gpt-4o-mini', 'gemini-flash'],
  costWeights: { 'claude-sonnet': 0.015, 'gpt-4o-mini': 0.0002 },
});
const decision = await router.route({ task: 'code review', complexity: 0.9 });
await router.feedback(decision, { reward: 0.95 });
```

### Attention Mechanisms

```typescript
import { FlashAttention, MultiHeadAttention, LinearAttention } from '@ruvector/attention';
const flash = new FlashAttention({ heads: 8, dim: 64 }); // 2.49x-7.47x speedup
const mha = new MultiHeadAttention({ modelDim: 512, heads: 8 });
const linear = new LinearAttention({ dim: 64, heads: 8 }); // O(n) for 100K+ contexts
const output = await flash.forward(Q, K, V);
```

### MicroLoRA (WASM, sub-100us)

```typescript
import init, { MicroLoRA } from '@ruvector/learning-wasm';
await init();
const adapter = new MicroLoRA({ inputDim: 768, outputDim: 768, rank: 2, learningRate: 0.001 });
const loss = adapter.adapt(input, target);
const adaptedWeights = adapter.apply(baseWeights);
```

## All RuvLLM Exports

```typescript
import {
  // Core
  RuvLLM, RuvLLMConfig,
  // RLM
  RlmController, RlmConfig, RlmAnswer, MemorySpan, StreamToken,
  // Training
  RlmTrainer, ContrastiveTrainer, createRlmTrainer,
  DEFAULT_RLM_CONFIG, FAST_RLM_CONFIG, THOROUGH_RLM_CONFIG,
  // SONA Learning
  SonaCoordinator, TrajectoryBuilder,
  // LoRA
  LoraAdapter, LoraManager,
  // Benchmarks
  ModelComparisonBenchmark, RoutingBenchmark, EmbeddingBenchmark,
} from '@ruvector/ruvllm';
```

## CLI (ruvllm)

```bash
ruvllm route "add unit tests for auth module"   # Route task to agent
ruvllm query --stream "Explain machine learning" # Streaming query
ruvllm download ruv/ruvltra                      # Download models from HF
ruvllm bench ./models/model.gguf                 # Run benchmarks
ruvllm eval --model ./model.gguf --subset lite   # SWE-Bench evaluation
```

## Performance (M4 Pro)

| Operation | Latency | Throughput |
|-----------|---------|------------|
| Query decomposition | 340 ns | 2.9M/s |
| Cache lookup | 23.5 ns | 42.5M/s |
| Embedding (384d) | 293 ns | 3.4M/s |
| Memory search (10k) | 0.4 ms | 2.5K/s |
| End-to-end routing | <1 ms | 1K+/s |
| Full RLM query | 50-200 ms | 5-20/s |

## Routing Accuracy

| Strategy | RuvLTRA | Qwen Base | OpenAI |
|----------|---------|-----------|--------|
| Embedding Only | 45% | 40% | 52% |
| Keyword Only | 78% | 78% | N/A |
| Hybrid | **100%** | 95% | N/A |

## Models (HuggingFace)

Repository: [huggingface.co/ruv/ruvltra](https://huggingface.co/ruv/ruvltra)

| Model | Size | Purpose |
|-------|------|---------|
| ruvltra-claude-code-0.5b-q4_k_m | 398 MB | Agent routing (100% hybrid accuracy) |
| ruvltra-small-0.5b-q4_k_m | ~400 MB | Embeddings |
| ruvltra-medium-1.1b-q4_k_m | ~1 GB | Full inference |

```typescript
import { downloadModel } from '@ruvector/ruvllm';
await downloadModel('ruv/ruvltra', { quantization: 'q4_k_m' });
// Or auto-download on first use:
const llm = new RuvLLM({ model: 'ruv/ruvltra' });
```

## Common Patterns

### Continual Learning Agent

```typescript
const sona = new SONA({ learningRate: 0.01, ewcLambda: 0.5 });
for (const task of taskStream) {
  const pred = await sona.predict(task.input);
  await sona.adapt(task.input, { reward: score(pred), expected: task.expected });
  if (count % 100 === 0) await sona.consolidate();
}
```

### Memory-Augmented Routing

```typescript
const llm = new RuvLLM({ model: 'ruv/ruvltra', sonaEnabled: true });
// First time: Full inference (~50ms)
await llm.route('implement OAuth2'); // → security-architect (97%)
// Later: Memory hit (<25μs, learned from success)
await llm.route('add OAuth2 flow');  // → security-architect (99%, cached)
```

## Related

- [Workflow](../../workflows/03-sona-llm-pipeline.md)
- [LLM Training Workflow](../../workflows/12-llm-training.md)
- [RVF Cognitive Containers](../../workflows/15-rvf-cognitive-containers.md)
