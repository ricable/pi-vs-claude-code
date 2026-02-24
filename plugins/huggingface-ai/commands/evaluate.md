---
name: evaluate
description: Run model evaluation benchmarks on HuggingFace Jobs using lighteval, inspect-ai, or custom evaluation scripts. Posts results to model cards.
disable-model-invocation: true
---

# evaluate

Benchmark a model on HuggingFace Jobs infrastructure.

## Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `--model` | Yes | - | Model ID on Hub (e.g., `username/my-model`) |
| `--benchmark` | No | `lighteval` | Framework: `lighteval`, `inspect-ai`, `custom` |
| `--tasks` | No | Framework default | Comma-separated eval tasks (e.g., `mmlu,hellaswag,arc`) |
| `--flavor` | No | `a10g-large` | GPU flavor for evaluation |
| `--output` | No | Model card update | Where to post results |

## Workflow

1. **Check model exists**: Verify model ID is valid and accessible on Hub
2. **Select framework**: lighteval (HF native), inspect-ai (UK AISI), or custom eval script
3. **Build eval script**: Generate UV script with vLLM backend for efficient inference
4. **Submit job**: Run on HF Jobs with appropriate GPU
5. **Post results**: Update model card with evaluation scores in model-index format

## Frameworks

### lighteval (default)
HuggingFace's evaluation library. Best for standard NLP benchmarks.
```
/evaluate --model username/my-model --benchmark lighteval --tasks mmlu,hellaswag,arc
```

### inspect-ai
UK AI Safety Institute's framework. Best for safety and alignment evaluations.
```
/evaluate --model username/my-model --benchmark inspect-ai --tasks safety_bench
```

### custom
User-provided evaluation script.
```
/evaluate --model username/my-model --benchmark custom --tasks path/to/eval.py
```

## Example

```
/evaluate --model username/my-sft-model --tasks mmlu,hellaswag --flavor a10g-large
```

Delegates to: `hugging-face-evaluation` skill

## See Also

- `hugging-face-evaluation/SKILL.md` for full evaluation documentation
- `references/hardware-guide.md` for GPU selection
