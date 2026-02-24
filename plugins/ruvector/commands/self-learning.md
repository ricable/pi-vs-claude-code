# Self-Learning

> Part of the [RuVector Plugin](../SKILL.md). See also: [quickstart](quickstart.md), [llm-pipeline](llm-pipeline.md).

## Hooks: Init and Install

```bash
# Initialize hooks configuration
npx @ruvector/cli@latest hooks init

# Install hooks into Claude Code
npx @ruvector/cli@latest hooks install

# Pre-task hook: get agent suggestion before starting
npx @ruvector/cli@latest hooks pre-task --task "implement auth"

# Post-task hook: record outcome for learning
npx @ruvector/cli@latest hooks post-task --task "implement auth" \
  --success true --reward 0.95 --critique "Good test coverage"

# View learning metrics
npx @ruvector/cli@latest hooks metrics

# Bootstrap learning from existing project
npx @ruvector/cli@latest hooks pretrain --repo ./my-project
```

## Q-Learning Agent Routing

```bash
# Route a task to the best agent
npx @ruvector/cli@latest route --task "review code" --agents 5

# Route with Q-learning strategy
npx @ruvector/cli@latest route --task "fix bug" --strategy q-learn

# Explain why a specific routing decision was made
npx @ruvector/cli@latest route explain --task "write tests"
```

## Semantic Router (Programmatic)

```typescript
import { SemanticRouter } from '@ruvector/router';

const router = new SemanticRouter({
  dimensions: 384,
  metric: 'cosine',
  threshold: 0.7,
  embeddingModel: 'all-MiniLM-L6-v2',
  defaultRoute: 'fallback',
  efSearch: 100,
});

// Add routes with example utterances
await router.addRoute('code_review', ['review this code', 'check for bugs']);
await router.addRoute('testing', ['write tests', 'unit test', 'test coverage']);
await router.addRoute('docs', ['write documentation', 'update readme']);

// Route a task
const match = await router.route('please review my pull request');
// { route: 'code_review', score: 0.92, metadata: {} }

// Top-K candidates
const matches = await router.routeTopK('can you help me test', 3);

// Batch routing
const results = await router.routeBatch(['hello', 'write tests', 'help me']);

// Configuration
router.setThreshold(0.8);
router.setDefaultRoute('unknown');
router.setEfSearch(200);
```

## SONA: Self-Optimizing Neural Architecture

```typescript
import { SONA } from '@ruvector/sona';

const sona = new SONA({
  learningRate: 0.01,
  ewcLambda: 0.5,        // EWC++ regularization (prevents forgetting)
  loraRank: 8,            // LoRA adapter rank
  loraAlpha: 16,          // LoRA scaling factor
  dimensions: 128,
  reasoningBank: true,    // Enable pattern storage
  maxPatterns: 10000,
});

// Adapt to new input-feedback pair
const result = await sona.adapt(taskInput, { reward: 0.95, expected: taskOutput });

// Generate prediction
const prediction = await sona.predict(newInput);

// Periodically consolidate to prevent catastrophic forgetting
await sona.consolidate();

// Save/load model state
await sona.save('./model');
await sona.load('./model');
```

## ReasoningBank: Pattern Storage

```typescript
import { ReasoningBank } from '@ruvector/sona';

const bank = new ReasoningBank({ maxPatterns: 10000 });

// Store a successful pattern
await bank.store({
  task: 'implement authentication',
  input: requirements,
  output: generatedCode,
  reward: 0.95,
});

// Search for similar past patterns
const similar = await bank.search('authentication flow', { k: 5, minReward: 0.8 });

// Prune low-quality patterns
const removed = await bank.prune(0.5); // Remove patterns with reward < 0.5

// Get statistics
const stats = bank.getStats();
```

## EWC++ and LoRA Components

```typescript
import { EWCPlusPlus, LoRAAdapter } from '@ruvector/sona';

// EWC++: Elastic Weight Consolidation
const ewc = new EWCPlusPlus({
  lambda: 0.5,          // Regularization strength
  gamma: 0.99,          // Fisher information decay
  onlineMode: true,     // Incremental updates
});

// LoRA: Low-Rank Adaptation
const adapter = new LoRAAdapter({
  rank: 8,
  alpha: 16,
  dropout: 0.0,
  targetModules: ['query', 'value'],
});
```

## Self-Learning Loop (End-to-End)

```bash
# 1. Before task: get agent suggestion
npx @ruvector/cli@latest hooks pre-task --task "implement feature X"

# 2. Execute the task (agent does the work)

# 3. After task: record outcome for learning
npx @ruvector/cli@latest hooks post-task --task "implement feature X" \
  --success true --reward 0.95 --critique "Good test coverage"

# 4. View accumulated learning
npx @ruvector/cli@latest hooks metrics
```

## Router Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dimensions` | `number` | `384` | Vector dimensions |
| `threshold` | `number` | `0.7` | Minimum match score |
| `embeddingModel` | `string` | `'all-MiniLM-L6-v2'` | Embedding model |
| `defaultRoute` | `string` | `undefined` | Fallback route |
| `efSearch` | `number` | `100` | HNSW search quality |

## Source Packages

- [@ruvector/cli](https://www.npmjs.com/package/@ruvector/cli) -- CLI with self-learning hooks
- [@ruvector/sona](https://www.npmjs.com/package/@ruvector/sona) -- SONA adaptive learning, EWC++, LoRA, ReasoningBank
- [@ruvector/router](https://www.npmjs.com/package/@ruvector/router) -- Semantic router with HNSW intent matching
