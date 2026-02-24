# Model Selection Matrix

## Tier 1: MacBook Pro M3 Max (128GB RAM)

400 GB/s bandwidth. Max model weight: 76 GB (60% rule).

| Model | Size (Total/Active) | SWE-Bench | HF Path | Use Case |
|-------|---------------------|-----------|---------|----------|
| MiniMax M2.5 | 230B / 10B | 80.2% | mlx-community/MiniMax-M2-5bit | Best local coding |
| GLM-5 | 744B / 40B | 77.8% | mlx-community/GLM-5-4bit | Open-source SOTA |
| MiMo-V2-Flash | 309B / 15B | 73.4% | cyankiwi/MiMo-V2-Flash-AWQ-4bit | Fast MoE |
| Qwen3-Coder-Next | 80B / 3B | 70.6% | mlx-community/Qwen3-Coder-Next-8bit | Efficient coding |
| GPT-OSS-120B | 117B / 5.1B | 62.4% | lmstudio-community/gpt-oss-120b-MLX-8bit | General purpose |

## Tier 2: Mac Studio M1 Max (64GB RAM)

400 GB/s bandwidth. Max model weight: 38 GB (60% rule).

| Model | Size | Best Quant | HF Path | Use Case |
|-------|------|-----------|---------|----------|
| Qwen3-Coder-30B | 30B | Q8_0/Q6_K | mlx-community/Qwen3-Coder-30B-A3B-Instruct-8bit | Primary coding |
| GLM-4.7-Flash | 30B | Q8_0 | lmstudio-community/GLM-4.7-Flash-GGUF | General + tools |
| DeepSeek-R1-Distill | 32B | Q6_K | mlx-community/DeepSeek-R1-Distill-Qwen-32B-MLX | Reasoning |
| Devstral Small 2 | 24B | Q8_0 | mlx-community/Devstral-Small-2505-8bit | MIT licensed |

## Quantization Guidelines

| Quant | Quality | Use For |
|-------|---------|---------|
| Q8_0 | Best | Primary coding models |
| Q6_K | Very good | Code generation, tool-calling |
| Q4_K_M | Acceptable | Small models (<3B) like RANO agents |
| Q4_0 | Poor | NEVER use for code -- bit-loss in JSON/tools |
