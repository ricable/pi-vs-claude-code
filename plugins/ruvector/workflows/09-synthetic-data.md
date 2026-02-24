# Workflow 9: Synthetic Data Generation

> Back to [RuVector Hub](../SKILL.md)

**Goal:** Generate unlimited, high-quality synthetic data for training, testing, and evaluation.

### Step 1: Generate Q&A Pairs

```typescript
import { AgenticSynth } from '@ruvector/agentic-synth';

const gen = new AgenticSynth({ model: 'gemini-pro' });
const qa = await gen.generateQA(documents, { count: 1000, difficulty: 'hard' });
```

### Step 2: Synthetic Embeddings

```bash
npx @ruvector/agentic-synth embeddings --count 10000 --dims 384 --clusters 20
```

### Step 3: Multi-Turn Conversations

```typescript
const convos = await gen.generateConversations({
  count: 50,
  turns: 5,
  personas: ['developer', 'reviewer'],
});
```

### Step 4: Schema-Based Datasets

```typescript
const users = await gen.generate({
  schema: {
    name: 'string',
    email: 'email',
    age: 'number:18-65',
    role: ['admin', 'user', 'guest'],
  },
  count: 10000,
});
```

### Step 5: Graph Data

```typescript
import { GraphGenerator } from '@ruvector/graph-data-generator';

const gen = new GraphGenerator({
  nodes: 10000,
  topology: 'scale-free',
  density: 0.1,
});
const graph = await gen.generate();
await gen.export('graphml', './test-graph.xml');
```

**Related skills:** `ruvector-agentic-synth`, `ruvector-graph-data-generator`
