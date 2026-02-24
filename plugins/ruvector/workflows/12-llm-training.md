# Workflow 12: LLM Training & Fine-Tuning

> Back to [RuVector Hub](../SKILL.md)

**Goal:** Generate training data, fine-tune models with contrastive learning, and deploy optimized GGUF models with 100% routing accuracy.

### Step 1: Generate Training Dataset

```bash
# Generate routing dataset (381 examples, 793 contrastive pairs, 156 hard negatives)
node scripts/training/routing-dataset.js

# Generate RLM training data (500 examples)
node scripts/training/rlm-dataset.js

# Synthetic data generation
node scripts/training/claude-code-synth.js
```

| Script | Description | Output |
|--------|-------------|--------|
| `routing-dataset.js` | 381 routing examples from 60+ agent types | Contrastive pairs + hard negatives |
| `claude-code-synth.js` | Synthetic data generation | Augmented training set |
| `contrastive-finetune.js` | LoRA fine-tuning pipeline | Adapter weights |
| `rlm-dataset.js` | RLM recursive query training data | 500 decomposition examples |

### Step 2: Contrastive Training

```typescript
import { ContrastiveTrainer } from '@ruvector/ruvllm';

const trainer = new ContrastiveTrainer({
  modelPath: './models/base.gguf',
  loraRank: 8,
  loraAlpha: 16,
  learningRate: 1e-4,
});

const pairs = [
  { anchor: 'Fix auth bug', positive: 'coder', negative: 'researcher' },
  { anchor: 'Review PR #42', positive: 'reviewer', negative: 'tester' },
  // ... 793 contrastive pairs, 156 hard negatives
];

await trainer.train(pairs, { epochs: 10 });
await trainer.save('./adapters/routing-lora');
```

### Step 3: LoRA Fine-Tuning

```bash
python -m peft.lora_train \
  --model_name Qwen/Qwen2.5-0.5B-Instruct \
  --dataset ./training-data/routing-examples.jsonl \
  --output_dir ./ruvltra-lora \
  --lora_r 8 --lora_alpha 16 --num_train_epochs 3
```

### Step 4: Convert to GGUF

```bash
python llama.cpp/convert_hf_to_gguf.py ./merged --outfile model-f16.gguf
./llama.cpp/llama-quantize model-f16.gguf model-q4_k_m.gguf Q4_K_M
```

### Step 5: Download Pre-Built Models

```bash
# CLI download
ruvllm download ruv/ruvltra

# Or programmatic (auto-downloads on first use)
```

```typescript
import { downloadModel, RuvLLM } from '@ruvector/ruvllm';

// Explicit download
await downloadModel('ruv/ruvltra', { quantization: 'q4_k_m' });

// Auto-download on first use (to ~/.ruvllm/models/)
const llm = new RuvLLM({ model: 'ruv/ruvltra' });
```

**Available models** ([huggingface.co/ruv/ruvltra](https://huggingface.co/ruv/ruvltra)):

| Model | Size | Purpose |
|-------|------|---------|
| ruvltra-claude-code-0.5b-q4_k_m | 398 MB | Agent routing (100% hybrid accuracy) |
| ruvltra-small-0.5b-q4_k_m | ~400 MB | Embeddings |
| ruvltra-medium-1.1b-q4_k_m | ~1 GB | Full inference |

### Step 6: Local Inference & Benchmarks

```bash
# Route a task
ruvllm route "add unit tests for auth module"
# → Agent: tester | Confidence: 0.96 | Tier: 2

# Streaming query
ruvllm query --stream "Explain machine learning"

# Benchmarks
ruvllm bench ./models/model.gguf

# SWE-Bench evaluation
ruvllm eval --model ./models/model.gguf --subset lite
```

```bash
# Legacy CLI (ruvllm-cli)
npx @ruvector/ruvllm-cli run --model ./model-q4_k_m.gguf --prompt "Hello"
npx @ruvector/ruvllm-cli serve --model ./model-q4_k_m.gguf --port 8080
```

**Related skills:** `ruvector-ruvllm`, `ruvector-ruvllm-cli`, `ruvector-ruvllm-wasm`, `ruvector-sona`, `ruvector-sona-pkg`
