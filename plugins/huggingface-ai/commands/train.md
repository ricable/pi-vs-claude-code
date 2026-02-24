---
name: train
description: Submit a model training job to HuggingFace Jobs infrastructure using TRL (SFT, DPO, GRPO). Handles dataset validation, cost estimation, Trackio integration, and Hub persistence.
disable-model-invocation: true
---

# train

Fine-tune a language model on HuggingFace Jobs cloud GPUs.

## Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `--model` | Yes | - | Base model ID (e.g., `Qwen/Qwen2.5-0.5B`) |
| `--dataset` | Yes | - | Dataset ID on Hub (e.g., `trl-lib/Capybara`) |
| `--method` | No | `sft` | Training method: `sft`, `dpo`, `grpo` |
| `--flavor` | No | `a10g-large` | GPU flavor (see hardware-guide.md) |
| `--epochs` | No | `3` | Number of training epochs |
| `--output` | No | `{user}/{model}-finetuned` | Hub repo for trained model |
| `--lora` | No | `true` | Use LoRA/PEFT (recommended for >1B params) |
| `--timeout` | No | `2h` | Job timeout (add 30% buffer) |

## Workflow

1. **Validate dataset**: Run dataset inspector to check format compatibility with chosen method
2. **Estimate cost**: Calculate approximate GPU hours and cost based on model size, dataset, epochs
3. **Build TRL script**: Generate UV script (PEP 723) with Trackio integration, Hub push, LoRA config
4. **Submit HF job**: `hf_jobs("uv", { script, flavor, timeout, secrets: { HF_TOKEN: "$HF_TOKEN" } })`
5. **Return job ID**: Provide job ID, monitoring URL, Trackio dashboard link, estimated completion time

## Critical Settings

- **Always set `push_to_hub=True`** -- environment is ephemeral, results lost without Hub push
- **Always include `secrets: { HF_TOKEN: "$HF_TOKEN" }`** -- needed for Hub authentication
- **Always include Trackio** -- `report_to="trackio"` for real-time monitoring
- **Set timeout > expected duration** -- default 30min is too short for real training

## Example

```
/train --model Qwen/Qwen2.5-0.5B --dataset trl-lib/Capybara --method sft --flavor a10g-large --epochs 3
```

Delegates to: `hugging-face-model-trainer` skill

## See Also

- `hugging-face-model-trainer/SKILL.md` for full TRL documentation
- `references/hardware-guide.md` for GPU selection
- `hugging-face-trackio/SKILL.md` for monitoring setup
