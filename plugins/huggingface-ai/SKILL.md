---
name: huggingface-ai
description: Complete HuggingFace ecosystem plugin covering CLI, datasets, model training, evaluation, experiment tracking, paper publishing, tool building, and cloud GPU compute. Routes to specialized sub-skills based on task type.
---

# HuggingFace AI Plugin

Unified entry point for all HuggingFace operations. Routes to 8 specialized sub-skills.

## Skill Routing

| Task | Sub-Skill | Invocation |
|------|-----------|------------|
| Download/upload models, manage repos, cache | `cli` | `hugging-face-cli` |
| Create datasets, stream rows, SQL queries | `datasets` | `hugging-face-datasets` |
| Benchmark models, leaderboard, lighteval/inspect-ai | `evaluation` | `hugging-face-evaluation` |
| Run workloads on HF cloud GPUs (general compute) | `jobs` | `hugging-face-jobs` |
| Fine-tune with TRL (SFT/DPO/GRPO), LoRA, GGUF conversion | `model-trainer` | `hugging-face-model-trainer` |
| Publish research papers, arXiv integration | `paper-publisher` | `hugging-face-paper-publisher` |
| Build reusable HF API scripts and tools | `tool-builder` | `hugging-face-tool-builder` |
| Track training metrics, visualize experiments | `trackio` | `hugging-face-trackio` |

## Prerequisites

1. **HF CLI**: `uv tool install huggingface_hub[cli]` (or `pip install huggingface_hub[cli]`)
2. **Authentication**: `hf auth login` (requires HF Pro account for Jobs)
3. **Python/uv**: Required for dataset scripts and training pipelines
4. **HF_TOKEN env var**: Critical for Jobs -- results are lost without it

Verify setup: `bash plugins/huggingface-ai/scripts/hf-health.sh`

## Common Workflows

### Train -> Evaluate -> Convert -> Deploy

```
1. Prepare dataset          hugging-face-datasets
2. Fine-tune on HF Jobs     hugging-face-model-trainer (--method sft|dpo|grpo)
3. Track metrics             hugging-face-trackio (auto-integrated)
4. Evaluate benchmarks       hugging-face-evaluation
5. Convert to GGUF           hugging-face-model-trainer (references/gguf_conversion.md)
6. Deploy locally            local-ai-mac-setup plugin (Ollama/LM Studio/llama-swap)
```

### Quick Model Deployment

```
1. Download from Hub         hugging-face-cli (hf download)
2. Register with Ollama      local-ai-mac-setup (Modelfile + ollama create)
3. Serve                     ollama serve
```

### Dataset -> Training -> Publishing

```
1. Create/curate dataset     hugging-face-datasets
2. Validate format           hugging-face-model-trainer (dataset inspector)
3. Submit training job       hugging-face-model-trainer
4. Monitor with TrackIO      hugging-face-trackio
5. Publish model + paper     hugging-face-cli + hugging-face-paper-publisher
```

## Cross-Plugin Integration

- **local-ai-mac-setup**: GGUF deployment to Ollama, LM Studio, llama-swap on Apple Silicon
- **RANO optimizer**: Fine-tuned domain models feed into the RANO GEPA pipeline
- **claude-flow**: Swarm agents can orchestrate multi-model training campaigns

## Commands

| Command | Description |
|---------|-------------|
| `train` | Submit TRL training jobs to HF infrastructure |
| `evaluate` | Run model benchmarks with lighteval/inspect-ai |
| `publish` | Upload models, datasets, papers to Hub |
| `status` | Check HF ecosystem health and running jobs |

## References

| Reference | Description |
|-----------|-------------|
| `authentication.md` | Token setup, scopes, HF Pro requirements |
| `hardware-guide.md` | GPU flavor selection, pricing, Apple Silicon |
| `local-deployment.md` | GGUF conversion and local serving pipeline |

## File Structure

```
plugins/huggingface-ai/
  .claude-plugin/plugin.json    Plugin manifest
  SKILL.md                      This file
  commands/                     Plugin commands
    train.md                    Model training
    evaluate.md                 Benchmarking
    publish.md                  Hub publishing
    status.md                   Ecosystem status
  references/                   Reference docs
    authentication.md           Token/auth setup
    hardware-guide.md           GPU selection
    local-deployment.md         GGUF + local serving
  scripts/
    hf-health.sh                Health check script
  skills/                       8 sub-skills (canonical location)
    cli/                        HF CLI operations
    datasets/                   Dataset management
    evaluation/                 Model benchmarking
    jobs/                       Cloud GPU compute
    model-trainer/              TRL fine-tuning
    paper-publisher/            Research papers
    tool-builder/               API tool creation
    trackio/                    Experiment tracking
```
