---
name: "intelligent-routing"
description: "Semantic intent routing, FastGRNN neural routing (10us), CLI self-learning hooks, circuit breaker patterns, and RVF META_SEG-backed routing state."
---

# Intelligent Routing

> Consolidated from: `@ruvector/router`, `@ruvector/tiny-dancer`, `@ruvector/cli`. Part of the [RuVector Plugin](../../SKILL.md).

## RVF Integration

Routing state and learned patterns persist inside RVF files. The `META_SEG` stores key-value routing configuration, while `VEC_SEG` holds semantic route embeddings. RVF's `WITNESS_SEG` provides an audit trail of every routing decision for compliance and debugging. Domain profiles (`.rvtext` extension) optimize the file for language model embeddings.

## Package Overview

| Package | Purpose | Runtime |
|---------|---------|---------|
| `@ruvector/router` | Semantic intent routing with HNSW, SIMD | Node.js |
| `@ruvector/tiny-dancer` | FastGRNN neural router, 10us latency | Node.js |
| `@ruvector/cli` | CLI with self-learning hooks, Q-learning routing | Node.js |

## Core API

### SemanticRouter

```typescript
import { SemanticRouter } from '@ruvector/router';
const router = new SemanticRouter({ dimensions: 384, threshold: 0.7, embeddingModel: 'all-MiniLM-L6-v2' });

await router.addRoute('greeting', ['hello', 'hi', 'good morning']);
await router.addRoute('order_status', ['where is my order', 'track package']);

const match = await router.route('hello there');       // { route: 'greeting', score: 0.92 }
const topK = await router.routeTopK('help me', 3);
const batch = await router.routeBatch(['hello', 'bye']);
```

### TinyDancer (FastGRNN -- 10us)

```typescript
import { TinyDancer } from '@ruvector/tiny-dancer';
const dancer = new TinyDancer({
  routes: ['haiku', 'sonnet', 'opus'],
  hiddenSize: 64, uncertaintyThreshold: 0.3,
  circuitBreaker: true, failureThreshold: 5, recoveryTimeMs: 30000,
});

const result = await dancer.route(taskEmbedding);  // { route, latencyUs: 10, uncertain }
await dancer.reload(newWeights);                   // Hot-reload, zero downtime
dancer.healthCheck();                               // { state: 'closed', failures: 0 }
```

### CircuitBreaker

```typescript
import { CircuitBreaker } from '@ruvector/tiny-dancer';
const breaker = new CircuitBreaker({ failureThreshold: 5, recoveryTimeMs: 30000 });
// States: 'closed' -> 'open' -> 'half-open'
const result = await breaker.execute(riskyFn);
```

### CLI Self-Learning Hooks

```bash
npx @ruvector/cli@latest hooks pre-task --task "implement auth"
npx @ruvector/cli@latest hooks post-task --task "implement auth" --success true --reward 0.95
npx @ruvector/cli@latest route --task "fix bug" --strategy q-learn
npx @ruvector/cli@latest hooks metrics
```

## Common Patterns

### Intent-Based Agent Dispatch

```typescript
const router = new SemanticRouter({ threshold: 0.6 });
await router.addRoute('code_review', ['review this code', 'check for bugs']);
await router.addRoute('testing', ['write tests', 'unit test']);
const match = await router.route(taskDescription);
dispatchToAgent(match.route, task);
```

### RuvLLM Claude Code Routing (100% accuracy)

`@ruvector/ruvllm` v2.4.1 provides purpose-built routing for Claude Code with 60+ agent types and hybrid keyword + embedding strategy:

```typescript
import { RuvLLM } from '@ruvector/ruvllm';

const llm = new RuvLLM({ model: 'ruv/ruvltra', sonaEnabled: true });

// Single agent routing
const route = await llm.route('implement OAuth2 authentication');
// → { agent: 'security-architect', confidence: 0.98, tier: 2 }

// Multi-agent team routing
const team = await llm.routeComplex('build full-stack app with auth');
// → [system-architect, backend-dev, coder, security-architect, tester]

// Confidence-aware escalation:
// >0.9 = use agent | 0.7-0.9 = human confirmation | <0.7 = escalate tier
```

**3-Tier Model:** Tier 1 Booster (<1ms, $0) → Tier 2 Haiku (~500ms, $0.0002) → Tier 3 Opus (2-5s, $0.015)

## Related

- [Workflow](../../workflows/02-self-learning-hooks.md)
- [SONA LLM Pipeline](../../workflows/03-sona-llm-pipeline.md)
- [LLM Training](../../workflows/12-llm-training.md)
- [RVF Cognitive Containers](../../workflows/15-rvf-cognitive-containers.md)
