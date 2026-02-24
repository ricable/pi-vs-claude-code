# LLM Pipeline

> Part of the [RuVector Plugin](../SKILL.md). See also: [self-learning](self-learning.md), [edge-wasm](edge-wasm.md).

## RuvLLM Multi-Provider Setup

```typescript
import { RuvLLM } from '@ruvector/ruvllm';

const llm = new RuvLLM({
  provider: 'anthropic',              // 'anthropic' | 'openai' | 'google' | 'local'
  model: 'claude-sonnet-4-20250514',
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxTokens: 4096,
  temperature: 0.7,
  enableLearning: true,               // Enable SONA self-learning
  memoryStore: 'hnsw',                // 'hnsw' | 'flat' | 'none'
  routingStrategy: 'fastgrnn',        // 'fastgrnn' | 'round-robin' | 'cost' | 'latency'
  timeout: 30000,
  retries: 3,
});

// Add fallback providers
llm.addProvider({ provider: 'openai', model: 'gpt-4o', priority: 2 });
llm.addProvider({ provider: 'google', model: 'gemini-pro', priority: 3 });
```

## Generation and Streaming

```typescript
// Generate a completion
const result = await llm.generate('Explain quantum computing', {
  fallback: true,
  maxRetries: 2,
});
console.log(result.text);

// Stream tokens
for await (const chunk of llm.stream('Write a haiku')) {
  process.stdout.write(chunk);
}

// Multi-turn chat
const chatResult = await llm.chat([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'What is HNSW?' },
]);

// Generate embeddings
const embedding = await llm.embed('search query text');
```

## Self-Learning Pipeline

```typescript
const llm = new RuvLLM({
  provider: 'anthropic',
  enableLearning: true,
});

// Generate output
const result = await llm.generate(prompt);

// Provide feedback for self-improvement
await llm.learn(prompt, result.text, { reward: 0.95 });

// Get performance metrics
const metrics = llm.getMetrics();
```

## RAG with HNSW Memory

```typescript
import { RuvLLM, MemoryStore } from '@ruvector/ruvllm';

const llm = new RuvLLM({ provider: 'anthropic' });
const memory = new MemoryStore({ backend: 'hnsw', dimensions: 1536 });

// Store documents
for (const doc of documents) {
  const embedding = await llm.embed(doc.text);
  await memory.store(doc.id, embedding, { text: doc.text });
}

// Retrieve and generate
const queryEmbed = await llm.embed(userQuery);
const context = await memory.search(queryEmbed, { k: 5 });
const answer = await llm.generate(
  `Context: ${context.map(r => r.meta.text).join('\n')}\n\nQuestion: ${userQuery}`
);
```

## FastGRNN Intelligent Routing

```typescript
import { Router } from '@ruvector/ruvllm';

const router = new Router({
  strategy: 'fastgrnn',
  models: ['claude-sonnet', 'gpt-4o', 'gemini-pro'],
  costWeights: { 'claude-sonnet': 1.0, 'gpt-4o': 0.8, 'gemini-pro': 0.5 },
  latencyTargetMs: 5000,
});

// Route a task to the optimal model
const decision = await router.route({ task: 'code review', complexity: 0.8 });
// { model: 'claude-sonnet', confidence: 0.92, reason: 'high complexity' }
```

## Contrastive Training (LoRA)

```typescript
import { SONA, LoRAAdapter } from '@ruvector/sona';

const sona = new SONA({
  learningRate: 0.01,
  ewcLambda: 0.5,
  loraRank: 8,
  loraAlpha: 16,
});

// Adapt with contrastive feedback
for (const example of trainingData) {
  const prediction = await sona.predict(example.input);
  const reward = evaluate(prediction, example.expected);
  await sona.adapt(example.input, { reward, expected: example.expected });
}

// Consolidate to prevent forgetting past tasks
await sona.consolidate();
await sona.save('./fine-tuned-model');
```

## Local Inference CLI (GGUF)

```bash
# Download a GGUF model
npx @ruvector/ruvllm-cli@latest download TheBloke/Llama-2-7B-GGUF --quantization q4_k_m

# Run inference
npx @ruvector/ruvllm-cli@latest run --model llama-2-7b-q4_k_m.gguf --prompt "Hello" --gpu

# Interactive chat
npx @ruvector/ruvllm-cli@latest chat --model ./model.gguf --gpu

# Serve as OpenAI-compatible API
npx @ruvector/ruvllm-cli@latest serve --model ./model.gguf --port 8080 --gpu
# curl http://localhost:8080/v1/chat/completions -d '{"messages": [...]}'

# Benchmark inference
npx @ruvector/ruvllm-cli@latest bench --model ./model.gguf --iterations 100

# Model management
npx @ruvector/ruvllm-cli@latest models list
npx @ruvector/ruvllm-cli@latest models info <name>
npx @ruvector/ruvllm-cli@latest models delete <name>
```

## Browser WASM Inference

```typescript
import init, { WasmLLM } from '@ruvector/ruvllm-wasm';

await init(); // Initialize WASM module

const llm = new WasmLLM({
  model: 'tinyllama-1.1b-q4',
  maxTokens: 256,
  temperature: 0.7,
  webgpu: true,               // Enable WebGPU acceleration
  quantization: 'q4',         // 'q4' | 'q8' | 'f16' | 'f32'
  simd: true,
});

// Generate text
const text = await llm.generate('Hello, world!');

// Stream tokens
const outputEl = document.getElementById('output');
for await (const token of llm.stream(userInput)) {
  outputEl.textContent += token;
}

// Embeddings in browser
import init, { WasmEmbedder } from '@ruvector/ruvllm-wasm';
await init();
const embedder = new WasmEmbedder({ model: 'all-minilm-l6-q4' });
const embedding = await embedder.embed('search query');
const scores = await embedder.embedBatch(documents);

// Tokenizer
import init, { WasmTokenizer } from '@ruvector/ruvllm-wasm';
await init();
const tokenizer = new WasmTokenizer({ model: 'tinyllama-1.1b-q4' });
const tokens = tokenizer.encode('Hello, world!');
const text = tokenizer.decode(tokens);
```

## Memory Store API

```typescript
import { MemoryStore } from '@ruvector/ruvllm';

const memory = new MemoryStore({ backend: 'hnsw', dimensions: 1536 });

await memory.store('key', embedding, { text: 'context' });
const results = await memory.search(queryEmbedding, { k: 5 });
await memory.delete('key');
await memory.clear();
const stats = memory.stats();
```

## Source Packages

- [@ruvector/ruvllm](https://www.npmjs.com/package/@ruvector/ruvllm) -- Multi-provider LLM orchestration with SONA learning
- [@ruvector/ruvllm-cli](https://www.npmjs.com/package/@ruvector/ruvllm-cli) -- Local GGUF inference CLI with Metal/CUDA
- [@ruvector/ruvllm-wasm](https://www.npmjs.com/package/@ruvector/ruvllm-wasm) -- Browser WASM LLM inference with WebGPU
