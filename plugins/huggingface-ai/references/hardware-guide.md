# HuggingFace GPU Hardware Guide

## GPU Flavors

| Flavor | VRAM | vCPU | RAM | $/hr (approx) | Best For |
|--------|------|------|-----|----------------|----------|
| `cpu-basic` | - | 2 | 16 GB | $0.03 | Data preprocessing, small scripts |
| `cpu-upgrade` | - | 4 | 32 GB | $0.10 | Dataset processing, conversions |
| `cpu-xl` | - | 8 | 64 GB | $0.20 | Large dataset ops, CPU inference |
| `t4-small` | 16 GB | 4 | 15 GB | $0.75 | Quick demos, <1B model tests |
| `t4-medium` | 16 GB | 8 | 30 GB | $1.50 | Dev training, 1-3B with LoRA |
| `l4x1` | 24 GB | 8 | 30 GB | $2.50 | Development, 3B models |
| `l4x4` | 96 GB | 32 | 120 GB | $10.00 | Multi-GPU, 7-13B models |
| `a10g-small` | 24 GB | 4 | 15 GB | $3.50 | Production training, 3-7B with LoRA |
| `a10g-large` | 24 GB | 12 | 46 GB | $5.00 | Production training (recommended default) |
| `a10g-largex2` | 48 GB | 24 | 92 GB | $10.00 | 7-13B models, full fine-tune up to 3B |
| `a10g-largex4` | 96 GB | 48 | 184 GB | $20.00 | Large models, multi-GPU training |
| `a100-large` | 80 GB | 12 | 142 GB | $10.00 | 13B+ models, high throughput |
| `h100` | 80 GB | 24 | 200 GB | $15.00 | Largest models, fastest training |
| `h100x8` | 640 GB | 192 | 1600 GB | $120.00 | 70B+ models, distributed training |

## Decision Tree

```
What's your model size?

<1B params ──> t4-small (demos) or t4-medium (dev)
1-3B params ──> l4x1 or a10g-small (LoRA)
3-7B params ──> a10g-large (recommended default)
7-13B params ──> a10g-largex2 (LoRA) or a100-large (full fine-tune)
13-30B params ──> a100-large (LoRA required)
30B+ params ──> h100 or h100x8 (LoRA required)

Budget-conscious? ──> Use LoRA, smaller flavor, fewer epochs
Speed priority? ──> a100-large or h100
```

## LoRA Recommendations

| Scenario | LoRA | Full Fine-Tune |
|----------|------|----------------|
| Model > 7B | Required | Too much VRAM |
| Quick experiment | Recommended | Overkill |
| Production quality | Good with r=32+ | Better if VRAM allows |
| Model < 3B | Optional | Feasible on a10g |
| Adapter-based serving | Required | N/A |

Typical LoRA config: `r=16, lora_alpha=32, lora_dropout=0.05`

## Apple Silicon Deployment (GGUF)

After training on HF Jobs, convert and deploy locally.

| Chip | Unified Memory | Recommended Quant | Max Model Size |
|------|---------------|-------------------|----------------|
| M1/M2 (8 GB) | 8 GB | Q4_K_M | 3B |
| M1/M2 Pro (16 GB) | 16 GB | Q4_K_M | 7B |
| M1/M2 Max (32 GB) | 32 GB | Q5_K_M | 13B |
| M1/M2 Max (64 GB) | 64 GB | Q5_K_M | 30B |
| M2/M3 Ultra (128 GB) | 128 GB | Q6_K | 70B |
| M3 Max (128 GB) | 128 GB | Q6_K | 70B |
| M4 Max (128 GB) | 128 GB | Q8_0 | 70B |

### Quantization Formats

| Format | Bits | Quality | Size (7B) | Speed | Use Case |
|--------|------|---------|-----------|-------|----------|
| Q4_K_M | 4-bit | Good | ~4.1 GB | Fast | Default recommendation |
| Q5_K_M | 5-bit | Better | ~4.8 GB | Good | Quality-focused |
| Q6_K | 6-bit | High | ~5.5 GB | Moderate | Near-original quality |
| Q8_0 | 8-bit | Highest | ~7.2 GB | Slower | Maximum quality |
| F16 | 16-bit | Original | ~14 GB | Slow | Only if memory allows |

## Cost Estimation

Rough guidelines (actual varies by dataset size, batch size, optimizations):

| Task | Model | Hardware | Time | Cost |
|------|-------|----------|------|------|
| Demo SFT (100 examples, 1 epoch) | 0.5B | t4-small | 10 min | ~$0.13 |
| Dev SFT (1K examples, 3 epochs) | 3B | a10g-large | 1 hr | ~$5 |
| Prod SFT (10K examples, 3 epochs) | 7B | a10g-large | 4 hr | ~$20 |
| DPO (5K pairs, 1 epoch) | 7B | a10g-largex2 | 3 hr | ~$30 |
| Eval (MMLU + HellaSwag) | 7B | a10g-large | 30 min | ~$2.50 |
| GGUF conversion | 7B | a10g-large | 15 min | ~$1.25 |

Use `scripts/estimate_cost.py` in the model-trainer skill for precise estimates.
