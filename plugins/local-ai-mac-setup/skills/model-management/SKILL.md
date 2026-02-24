---
name: model-management
description: "Download, organize, and share LLM models across inference backends (Ollama, LM Studio, llama.cpp, MLX) with zero duplication. Includes Gollama TUI for auditing, VRAM estimation, and model selection by memory budget. Use when downloading new models, sharing models between backends, checking VRAM fit, auditing model inventory, or cleaning up unused models."
---

# Model Management

Download, share, and audit models with zero duplication.

## Download Models (LM Studio)

```bash
# GUI
open -a "LM Studio"  # Discover tab → search → download

# CLI
lms get mlx-community/Qwen3-Coder-30B-A3B-Instruct-8bit
lms get lmstudio-community/GLM-4.7-Flash-GGUF
lms ls
```

## Share Between Backends

### LM Studio → Ollama (Modelfile reference)

```bash
GGUF=$(find ~/.lmstudio/models -name "*GLM*Q8*" -name "*.gguf" | head -1)
cat > /tmp/Modelfile <<EOF
FROM $GGUF
PARAMETER num_ctx 32768
EOF
ollama create glm-4.7-flash:q8_0 -f /tmp/Modelfile
ollama list | grep glm
```

### Ollama → LM Studio (symlink)

```bash
./scripts/link-ollama-to-lmstudio.sh           # Link all
./scripts/link-ollama-to-lmstudio.sh --dry-run  # Preview
```

### llama.cpp (direct path)

```bash
llama-cli -m ~/AI/models/lmstudio/rano/beam-agent-q4_k_m/beam-agent-q4_k_m.gguf \
  -c 4096 -ngl 99 -cnv
```

## Gollama (Model Auditor)

```bash
gollama -l                    # List all models
gollama -fits 64              # What fits in 64GB
gollama -fits 64 -quant Q8_0  # Filter by quant
gollama -vram qwen3-coder-next # Estimate VRAM
gollama -u                    # Unload all from GPU
gollama                       # Interactive TUI
```

## Memory Budget (60% Rule)

Model weight must not exceed 60% of RAM:
- 128GB → max 76GB model
- 64GB → max 38GB model

**Quantization for code**: Q6_K or Q8_0 minimum. Q4_K_M acceptable for small models (<3B).

## Add New Model to llama-swap

```bash
# 1. Download via LM Studio
# 2. Regenerate config
python3 scripts/generate-llama-swap-config.py --output config/llama-swap.yaml
# 3. Reload
kill -HUP $(pgrep llama-swap)
```

## Bundled Resources

- **[MODEL-SHARING.md](references/MODEL-SHARING.md)** — Cross-backend sharing patterns (Ollama, LM Studio, llama.cpp, MLX)
- **[audit-models.sh](scripts/audit-models.sh)** — Complete inventory audit with disk usage and symlink integrity
- **[download command](commands/download.md)** — Interactive `/model-management:download` command

## Disk Usage

```bash
du -sh ~/AI/models/
du -sh ~/AI/models/lmstudio/rano/
du -sh ~/.ollama/models/
```
