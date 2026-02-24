---
name: "data-generation"
description: "Synthetic data for AI/ML training (Q&A, embeddings, conversations), graph data generation, scientific document OCR, and RVF data importers (JSON, CSV, NumPy)."
---

# Data Generation

> Consolidated from: `@ruvector/agentic-synth`, `@ruvector/graph-data-generator`, `@ruvector/scipix`. Part of the [RuVector Plugin](../../SKILL.md).

## RVF Data Import

The `rvf-import` crate and CLI support importing data directly into RVF cognitive containers from JSON, CSV, and NumPy (.npy) formats:

```bash
rvf create vectors.rvf --dimension 384
rvf ingest vectors.rvf --input data.json --format json
rvf ingest vectors.rvf --input embeddings.npy --format npy
rvf ingest vectors.rvf --input vectors.csv --format csv
```

Generated data flows directly into RVF files with full witness chain audit, domain profiles (`.rvdna`, `.rvtext`, `.rvgraph`, `.rvvis`), and lineage tracking.

## Package Overview

| Package | Purpose | Runtime |
|---------|---------|---------|
| `@ruvector/agentic-synth` | Synthetic Q&A, embeddings, conversations, datasets | Node.js |
| `@ruvector/graph-data-generator` | Synthetic graphs with topology models, AI properties | Node.js |
| `@ruvector/scipix` | Scientific OCR: LaTeX, MathML, PDF extraction | Node.js |

## Core API

### SynthGenerator

```typescript
import { SynthGenerator } from '@ruvector/agentic-synth';
const gen = new SynthGenerator({ seed: 42 });

const qaPairs = await gen.generateQA(documents, {
  count: 100, difficulty: 'mixed', includeNegatives: true, negativeRatio: 0.2,
}); // { question, answer, context, difficulty, isNegative }

const embeddings = gen.generateEmbeddings({
  count: 10_000, dimensions: 1536, clusters: 50, noise: 0.1,
}); // { vectors, labels, centroids }

const conversations = await gen.generateConversations({
  count: 50, turns: 5, agents: ['user', 'assistant'], topics: ['coding'], style: 'technical',
});

const dataset = gen.generateDataset({
  count: 1000,
  schema: { name: { type: 'name' }, score: { type: 'float', min: 0, max: 1 },
    category: { type: 'enum', values: ['A', 'B'] }, embedding: { type: 'vector', dimensions: 384 } },
});
```

### GraphGenerator

```typescript
import { GraphGenerator } from '@ruvector/graph-data-generator';
const gen = new GraphGenerator({
  nodes: 10000, density: 0.01,
  topology: 'scale-free', // also: small-world, random, hierarchical, community
  labels: ['User', 'Post'], edgeLabels: ['AUTHORED', 'FOLLOWS'], seed: 42,
});
await gen.generate();
await gen.export('cypher', './seed.cypher'); // Also: json, graphml, csv, dot
const social = GraphGenerator.template('social-network', { users: 500, communities: 5 });
```

### Scipix (scientific OCR)

```typescript
import { Scipix } from '@ruvector/scipix';
const scipix = new Scipix({ model: 'scientific-v2' }); // also: 'equation-only', 'handwriting'

const latex = await scipix.toLatex('./equation.png');   // ["E = mc^2"]
const result = await scipix.recognize('./paper.png');   // { text, equations, tables, figures }
const pages = await scipix.processPDF('./paper.pdf');    // Per-page extraction
const batch = await scipix.batch(['./eq1.png', './eq2.png']);
```

## Common Patterns

### RAG Testing Pipeline

```typescript
const qaPairs = await gen.generateQA(docs, { count: 200, includeNegatives: true });
for (const qa of qaPairs) {
  const retrieved = await ragPipeline.retrieve(qa.question);
  const score = measureRetrieval(retrieved, qa.context);
}
```

## Related

- [Workflow](../../workflows/09-synthetic-data.md)
- [Scientific Docs Workflow](../../workflows/11-scientific-docs.md)
- [RVF Cognitive Containers](../../workflows/15-rvf-cognitive-containers.md)
