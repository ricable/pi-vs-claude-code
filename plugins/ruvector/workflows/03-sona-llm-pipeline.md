# Workflow 3: Self-Learning LLM Pipeline (SONA)

> Back to [RuVector Hub](../SKILL.md)

**Goal:** Build a self-learning LLM orchestration system with 100% routing accuracy, recursive query decomposition, and SONA adaptive learning.

### Step 1: Install Components

```bash
npm install @ruvector/ruvllm @ruvector/sona @ruvector/tiny-dancer @ruvector/attention
```

### Step 2: Initialize RuvLLM with Claude Code Routing

```typescript
import { RuvLLM } from '@ruvector/ruvllm';

const llm = new RuvLLM({
  modelPath: '~/.ruvllm/models/ruvltra-claude-code-0.5b-q4_k_m.gguf',
  sonaEnabled: true,
});

// Intelligent agent routing (60+ agent types, 100% hybrid accuracy)
const route = await llm.route('implement OAuth2 authentication');
console.log(route.agent);      // 'security-architect'
console.log(route.confidence); // 0.98
console.log(route.tier);       // 2 (Haiku-level complexity)

// Multi-agent team routing for complex tasks
const team = await llm.routeComplex('build full-stack app with auth');
// → [system-architect, backend-dev, coder, security-architect, tester]
```

### Step 3: Use RLM for Complex Queries

```typescript
import { RlmController } from '@ruvector/ruvllm';

const rlm = new RlmController({
  maxDepth: 5,
  retrievalTopK: 10,
  enableCache: true,
  enableReflection: true,
  minQualityScore: 0.8,
});

// Add knowledge to memory
await rlm.addMemory('OAuth2 uses access tokens with short TTL and refresh tokens.');
await rlm.addMemory('JWT tokens should be stored in httpOnly cookies.');

// Recursive query decomposition + synthesis
const answer = await rlm.query('What are the causes AND solutions for auth token leaks?');
console.log(answer.text);           // Comprehensive synthesized answer
console.log(answer.sources);        // Source attributions
console.log(answer.qualityScore);   // 0.0-1.0

// Streaming
for await (const event of rlm.queryStream('Explain OAuth2 flows')) {
  if (event.type === 'token') process.stdout.write(event.text);
}
```

### Step 4: Route Tasks with FastGRNN

```typescript
import { TinyDancer } from '@ruvector/tiny-dancer';

const dancer = new TinyDancer({
  routes: ['code', 'chat', 'analysis'],
  hiddenSize: 64,
  uncertaintyThreshold: 0.3,
});

// 10-microsecond routing
const decision = await dancer.route(taskEmbedding);
// → { route: 'code', latency: 10.5, uncertain: false }
```

### Step 5: Learn from Feedback (SONA)

```typescript
import { SONA } from '@ruvector/sona';

const sona = new SONA({
  learningRate: 0.01,
  ewcLambda: 0.5,
  loraRank: 8,
});

// Predict
const pred = await sona.predict(input);

// Evaluate and adapt
const reward = evaluateOutput(pred, expected);
await sona.adapt(input, { reward, expected });

// Consolidate periodically (prevent catastrophic forgetting)
await sona.consolidate();
```

RuvLLM also provides built-in SONA learning — every successful routing is stored in HNSW-indexed memory:

```typescript
// First time: Full inference (~50ms)
await llm.route('implement OAuth2'); // → security-architect (97%)
// Later: Memory hit (<25μs, learned from success)
await llm.route('add OAuth2 flow');  // → security-architect (99%, cached)
const stats = llm.sonaStats();       // Learning statistics
```

### Step 6: Apply Attention Mechanisms

```typescript
import { FlashAttention, MultiHeadAttention } from '@ruvector/attention';

// FlashAttention for long sequences (2.49x-7.47x speedup)
const flash = new FlashAttention({ heads: 8, dim: 64, blockSize: 256 });
const output = await flash.forward(Q, K, V);

// MultiHeadAttention for complex patterns
const mha = new MultiHeadAttention({ modelDim: 512, heads: 8 });
```

### Step 7: SIMD-Accelerated Batch Operations

```typescript
import { simd } from '@ruvector/ruvllm/simd';

// 4x faster vector operations with AVX2/NEON
const similarity = simd.batchCosineSimilarity(query, targets);
const attended = simd.flashAttention(q, k, v, scale);
```

### Step 8: Cost-Optimized Routing

```typescript
import { SONARouter, CostOptimizer } from '@ruvector/sona';

const router = new SONARouter({
  models: ['claude-sonnet', 'gpt-4o-mini', 'gemini-flash'],
  costWeights: { 'claude-sonnet': 0.015, 'gpt-4o-mini': 0.0002, 'gemini-flash': 0.0001 },
});

const optimizer = new CostOptimizer({ budget: 5.0, qualityFloor: 0.7 });

const decision = await router.route({
  task: 'code review',
  complexity: 0.9,
  constraints: optimizer.getConstraints(),
});

// Learn from outcome
const result = await callModel(decision.model, input);
await router.feedback(decision, { reward: evaluateResult(result) });
```

**Related skills:** `ruvector-ruvllm`, `ruvector-sona`, `ruvector-sona-pkg`, `ruvector-tiny-dancer`, `ruvector-attention`, `ruvector-router`
