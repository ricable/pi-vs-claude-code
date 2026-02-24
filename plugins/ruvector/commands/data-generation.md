# Data Generation

> Part of the [RuVector Plugin](../SKILL.md). See also: [postgres](postgres.md), [agent-coordination](agent-coordination.md).

## AgenticSynth -- Q&A Generation

```typescript
import { SynthGenerator } from '@ruvector/agentic-synth';

const gen = new SynthGenerator({ seed: 42 });

// Generate Q&A pairs from documents (for RAG evaluation)
const qaPairs = await gen.generateQA(documents, {
  count: 100,
  difficulty: 'mixed',       // 'easy' | 'medium' | 'hard' | 'mixed'
  includeNegatives: true,    // unanswerable questions
  negativeRatio: 0.2,
  chunkSize: 512,
});
// { question, answer, context, difficulty, isNegative }
```

## Synthetic Embeddings

```typescript
const embeddings = gen.generateEmbeddings({
  count: 10_000,
  dimensions: 1536,
  clusters: 50,
  noise: 0.1,
  normalize: true,
});
// { vectors: Float32Array[], labels: number[], centroids: Float32Array[] }
```

## Multi-Turn Conversations

```typescript
const conversations = await gen.generateConversations({
  count: 50,
  turns: 5,
  agents: ['user', 'assistant'],
  topics: ['coding', 'debugging', 'architecture'],
  style: 'technical',   // 'formal' | 'casual' | 'technical'
});
// { id, turns: [{ role, content, timestamp }], topic, metadata }
```

## Schema-Based Datasets

```typescript
const dataset = gen.generateDataset({
  count: 1000,
  schema: {
    name: { type: 'name' },
    score: { type: 'float', min: 0, max: 1 },
    category: { type: 'enum', values: ['A', 'B', 'C'] },
    embedding: { type: 'vector', dimensions: 384 },
  },
});
```

Field types: `name`, `email`, `text`, `int`, `float`, `enum`, `bool`, `date`, `vector`, `uuid`.

## GraphGenerator

```typescript
import { GraphGenerator } from '@ruvector/graph-data-generator';

const gen = new GraphGenerator({
  nodes: 1000,
  density: 0.1,
  topology: 'scale-free',   // see topology table below
  labels: ['Person', 'Company', 'Product'],
  edgeLabels: ['KNOWS', 'WORKS_AT', 'PURCHASED'],
  propertyGenerator: 'random',  // 'random' | 'ai'
  seed: 42,
  directed: true,
});

const graph = await gen.generate();
const stats = gen.stats();
// { nodes: 1000, edges: 4500, avgDegree: 9, density: 0.009, components: 1, diameter: 8 }
```

**Topologies:** `scale-free` (Barabasi-Albert), `small-world` (Watts-Strogatz), `random` (Erdos-Renyi), `hierarchical`, `bipartite`, `community`.

### Templates

```typescript
const social = GraphGenerator.template('social-network', { users: 500, avgFriends: 10, communities: 5 });
const kg = GraphGenerator.template('knowledge-graph', { topics: 100, conceptsPerTopic: 20 });
const ecom = GraphGenerator.template('ecommerce', { users: 1000, products: 500, purchases: 5000 });
const deps = GraphGenerator.template('dependency-graph', { packages: 200, avgDependencies: 5 });
```

### Export

Formats: `json`, `graphml`, `csv` (vertices + edges), `cypher`, `dot`, `adjacency`.

```typescript
await gen.export('cypher', './output.cypher');
```

## SciPix OCR

```typescript
import { Scipix } from '@ruvector/scipix';
const scipix = new Scipix({ model: 'scientific-v2', device: 'cpu' });
// Models: 'scientific-v2' (full docs), 'equation-only', 'handwriting'

const latex = await scipix.toLatex('./equation.png');       // ["E = mc^2"]
const mathml = await scipix.toMathML('./integral.png');     // ["<math>...</math>"]
const result = await scipix.recognize('./paper-page.png');  // { text, equations, tables, figures }
const pages = await scipix.processPDF('./paper.pdf');       // PageResult[]
const batch = await scipix.batch(['./eq1.png', './eq2.png']);
```

```bash
npx @ruvector/scipix recognize ./equation.png
npx @ruvector/scipix pdf ./paper.pdf --format latex
```

## Source Packages

- [@ruvector/agentic-synth](https://www.npmjs.com/package/@ruvector/agentic-synth) -- Q&A, embeddings, conversations, datasets
- [@ruvector/graph-data-generator](https://www.npmjs.com/package/@ruvector/graph-data-generator) -- Graph topologies, templates, export
- [@ruvector/scipix](https://www.npmjs.com/package/@ruvector/scipix) -- Scientific OCR, LaTeX extraction
