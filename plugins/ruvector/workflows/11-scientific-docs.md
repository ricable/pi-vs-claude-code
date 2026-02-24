# Workflow 11: Scientific Document Processing

> Back to [RuVector Hub](../SKILL.md)

**Goal:** Extract equations, text, and structured data from scientific documents.

### Step 1: OCR with SciPix

```typescript
import { Scipix } from '@ruvector/scipix';

const ocr = new Scipix({ model: 'scientific-v2', device: 'cpu' });

// Extract LaTeX
const latex = await ocr.toLatex('./equation.png');

// Full OCR with structure detection
const result = await ocr.recognize('./paper.png');
// → { text: '...', equations: [{ latex: '...', confidence: 0.95 }], tables: [...] }
```

### Step 2: Batch Processing

```bash
npx @ruvector/scipix batch ./papers/*.png --output results.json --format latex
npx @ruvector/scipix pdf ./research.pdf --format latex
```

### Step 3: Index Extracted Content

```typescript
import { EmbeddingModel } from '@ruvector/onnx-embeddings-wasm';

const embedder = await EmbeddingModel.load('all-MiniLM-L6-v2');
const embeddings = await embedder.embed(extractedTexts);

// Store in vector DB for semantic search
for (const [i, emb] of embeddings.entries()) {
  await db.insert(`paper-${i}`, emb, { latex: results[i].latex });
}
```

**Related skills:** `ruvector-scipix`, `ruvector-onnx-embeddings-wasm`
