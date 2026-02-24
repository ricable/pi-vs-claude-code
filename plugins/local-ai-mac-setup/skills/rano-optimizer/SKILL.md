---
name: rano-optimizer
description: "Integrate the RANO RAN optimization pipeline with local inference. Routes 52 intents across 21 fine-tuned domain expert agents (484MB each, Qwen3-0.6B GGUF Q4_K_M) via llama-swap. Supports three backends: Ollama GLM (default), legacy llama-server fleet, and LM Studio daemon. Use when setting up RANO with local models, configuring the GEPA pipeline, or running the optimizer catalog."
---

# RANO Optimizer Integration

Route 52 intents across 21 fine-tuned domain expert agents via local inference.

## Prerequisites

- llama-swap running on `:9090` with RANO agents configured
- All 21 RANO agent GGUFs in `~/AI/models/lmstudio/rano/`

## Quick Start

```bash
export RANO_LM_BACKEND=llamaswap
cd .claude/skills/elex-ran-features/optimizer/ts
npx tsx run-catalog.ts
```

## Agent Domains (21 total)

```
rano/4g-lte-agent-q4_k_m      rano/interference-agent-q4_k_m
rano/5g-nr-agent-q4_k_m       rano/learning-agent-q4_k_m
rano/admission-agent-q4_k_m   rano/link-adaptation-agent-q4_k_m
rano/alarm-agent-q4_k_m       rano/loadbalance-agent-q4_k_m
rano/antenna-agent-q4_k_m     rano/mobility-agent-q4_k_m
rano/beam-agent-q4_k_m        rano/neighbor-agent-q4_k_m
rano/ca-agent-q4_k_m          rano/power-agent-q4_k_m
rano/capacity-agent-q4_k_m    rano/resilience-agent-q4_k_m
rano/coverage-agent-q4_k_m    rano/rrm-agent-q4_k_m
rano/energy-agent-q4_k_m      rano/throughput-agent-q4_k_m
rano/enm-api-agent-q4_k_m
```

## Backend Configuration

| Variable | Default | Options |
|----------|---------|---------|
| `RANO_LM_BACKEND` | `legacy` | `llamaswap`, `lmstudio`, `legacy` |
| `RANO_LM_STUDIO_URL` | `http://localhost:1234` | Any LM Studio URL |
| `RANO_INTENT_CONCURRENCY` | auto | `1-64` |
| `RANO_FINE_TUNED` | `false` | `true` for fine-tuned routing |

## llama-swap Groups for RANO

In `config/llama-swap.yaml`:
- **rano-k8s-agents** group: all 21 agents, concurrent, TTL 300s
- **coding** group: GLM-4.7-Flash, Qwen3-Coder, exclusive, TTL 1800s

## Monitoring

```bash
# Watch active models during run
watch -n 1 'curl -s http://localhost:9090/running | jq .'

# Memory during optimization
vm_stat | grep "Pages active"
```

## Bundled Resources

- **[ARCHITECTURE.md](references/ARCHITECTURE.md)** — Complete system architecture: 52 intents, 8-stage GEPA, 21 domain experts, neural models, enrichment pipeline, configuration files
- **rano-optimizer skill**: `/rano-optimizer:run` command for intent processing

## Backend Configuration

Edit `config.ts` to adjust:
- **Concurrency** (parallel intents)
- **Model paths** (downloaded agents)
- **Backend** (Ollama, llama-swap, LM Studio)
- **Enrichment budget** (light/medium/heavy)

## Performance Tuning

For optimal performance:
- Use **llama-swap** for concurrent agent handling
- Set `RANO_INTENT_CONCURRENCY=auto` (matches CPU cores)
- Monitor with `watch -n 1 'curl -s localhost:9090/running | jq .'`
- Fine-tune agents for best accuracy (90+ minute training)

## References

- Training guide: `FINE-TUNING-GUIDE.md`
- Intent catalog: `.claude/skills/elex-ran-features/optimizer/ts/catalog.ts`
- Neural models: `ruv-fann` skill
