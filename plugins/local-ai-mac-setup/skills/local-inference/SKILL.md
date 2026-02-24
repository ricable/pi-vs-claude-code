---
name: local-inference
description: "Configure the complete local inference stack for Apple Silicon: Ollama, llama-swap, LM Studio, llama.cpp, MLX, and Gollama. Covers shared model directory, cross-backend sharing, memory budgets, llama-swap routing, and the 21 RANO fine-tuned agent fleet. Use when setting up local LLM inference, troubleshooting model serving, or integrating with the RANO optimizer."
---

# Local Inference Setup

Run LLMs locally on Apple Silicon with zero model duplication across backends.

## Inference Framework Matrix

| Framework | Role | Best For | Install |
|-----------|------|----------|---------|
| Ollama | Background serving | Agentic tools, Claude Code, Aider | `mise install` (aqua) |
| llama-swap | Single-port proxy | RANO optimizer, 21-agent routing, TTL unload | `mise install` (github) |
| LM Studio | GUI + downloads | Model discovery, HuggingFace search, testing | `brew install --cask lm-studio` |
| llama.cpp | Raw inference | Quantization experiments, speculative decoding | `mise install` (github) |
| MLX | Native Metal | ~1,200 t/s prompt processing, Apple-optimized | `uv pip install mlx-lm` |
| Gollama | TUI auditor | VRAM estimation, model inventory, cleanup | `mise install` (ubi) |

## Shared Model Directory

Single source of truth -- one model file on disk, every tool accesses it:

```bash
# Create structure
mkdir -p ~/AI/models/{lmstudio,ollama,mlx,gguf,shared}

# Link LM Studio downloads to shared folder
ln -sf ~/AI/models/lmstudio ~/.lmstudio/models

# Convenience link
ln -sf ~/AI/models ~/models
```

```
~/AI/models/
  lmstudio/                    LM Studio downloads (single source of truth)
    lmstudio-community/        GGUF models
    mlx-community/             MLX safetensors
    rano/                      21 fine-tuned RANO agents (484 MB each)
    ollama/                    Symlinks to Ollama blobs
  ollama/                      Reference (blobs in ~/.ollama/)
  mlx/                         MLX safetensors (optional)
  gguf/                        GGUF consolidation (optional)
```

## Cross-Backend Sharing Patterns

### LM Studio to Ollama (Modelfile FROM)

Reference the GGUF on disk -- no copy:

```bash
GGUF=$(find ~/.lmstudio/models -name "*.gguf" -type f | grep -i devstral | head -1)
cat > /tmp/Modelfile <<EOF
FROM $GGUF
PARAMETER num_ctx 32768
EOF
ollama create devstral-small-2 -f /tmp/Modelfile
ollama list | grep devstral
```

### Ollama to LM Studio (symlink blob)

```bash
# Get blob path
ollama show glm-4.7-flash:q8_0 --modelfile | grep "^FROM"

# Symlink with .gguf extension
mkdir -p ~/.lmstudio/models/ollama/glm-4.7-flash-q8_0
ln -sf /path/to/sha256-blob ~/.lmstudio/models/ollama/glm-4.7-flash-q8_0/glm-4.7-flash-q8_0.gguf
```

### llama.cpp (direct path)

```bash
llama-cli -m ~/.lmstudio/models/rano/beam-agent-q4_k_m/beam-agent-q4_k_m.gguf \
  -c 4096 -ngl 99 -cnv
```

### MLX (separate format)

MLX uses safetensors, not GGUF. Download pre-converted models:

```bash
lms get mlx-community/Qwen3-Coder-30B-A3B-Instruct-8bit
```

## Memory Budget (60% Rule)

Apple Silicon shares RAM between CPU and GPU. Model weights must not exceed 60% of total RAM.

| Machine | RAM | Max Model Weight | Recommended Quant |
|---------|-----|------------------|-------------------|
| MBP M3 Max | 128 GB | 76 GB | Q8_0 or Q6_K |
| Mac Studio M1 Max | 64 GB | 38 GB | Q8_0 or Q6_K |

```bash
# Check what fits
gollama -fits 64 -quant Q8_0
gollama -vram qwen3-coder-next
```

Quantization for code: Q8_0/Q6_K best quality. Q4_K_M acceptable for small agents (<3B). Never Q4_0 or lower for code.

## llama-swap Configuration

llama-swap is a Go proxy that auto-spawns llama-server processes by model name and unloads them after a TTL.

### Architecture

```
Client request (model: "rano/beam-agent-q4_k_m")
    -> llama-swap (:9090)
        -> spawns llama-server with correct GGUF
        -> routes request
        -> auto-unloads after TTL
```

### Groups

| Group | Behavior | Models | TTL |
|-------|----------|--------|-----|
| `rano-k8s-agents` | Concurrent (multiple active) | 21 fine-tuned agents (484 MB each) | 300s (5 min) |
| `coding` | Exclusive (one at a time) | GLM-4.7-Flash, Qwen3-Coder-Next | 1800s (30 min) |

### Generate Config

```bash
python3 scripts/generate-llama-swap-config.py \
  --models-dir ~/AI/models/lmstudio \
  --output config/llama-swap.yaml
```

### Start Services

```bash
# Terminal 1: Ollama
ollama serve

# Terminal 2: llama-swap
llama-swap --config config/llama-swap.yaml --listen 0.0.0.0:9090

# Or use the startup script
./scripts/start-inference.sh
```

### RANO Optimizer Integration

```bash
export RANO_LM_BACKEND=llamaswap
cd .claude/skills/elex-ran-features/optimizer/ts
npx tsx run-catalog.ts
```

## Environment Variables

```bash
# Add to ~/.zshrc
export OLLAMA_MODELS=$HOME/.ollama/models
export OLLAMA_HOST=127.0.0.1:11434
export OLLAMA_KEEP_ALIVE=5m
export RANO_LM_BACKEND=llamaswap
export RANO_INTENT_CONCURRENCY=auto
```

## Quick Verification

```bash
# llama-swap health
curl -s http://localhost:9090/health

# Model count
curl -s http://localhost:9090/v1/models | jq '.data | length'

# Running models
curl -s http://localhost:9090/running | jq .

# Test a RANO agent
curl -s http://localhost:9090/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"rano/beam-agent-q4_k_m","messages":[{"role":"user","content":"hi"}],"max_tokens":50}' \
  | jq '.choices[0].message.content'
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 9090 in use | `lsof -i :9090` then kill or change port |
| OOM errors | `gollama -u` to unload; check 60% rule |
| Model not found | `python3 scripts/generate-llama-swap-config.py --check` |
| Slow first request | Normal cold start; pre-warm with dummy request |
| LM Studio missing models | Verify symlink: `ls -la ~/.lmstudio/models` |
| Ollama model not visible | Create Modelfile with `FROM <gguf-path>` |
| Broken symlinks | `find ~/.lmstudio/models -type l ! -exec test -e {} \; -print` |

## Bundled Resources

- **[SETUP-GUIDE.md](references/SETUP-GUIDE.md)** — Complete setup guide with model selection, memory budgets, gollama config, and cross-backend sharing patterns
- **[verify-stack.sh](scripts/verify-stack.sh)** — Verify all inference components (Gollama, LM Studio, Ollama, llama.cpp, MLX)
- **[setup-directories.sh](scripts/setup-directories.sh)** — Initialize model directories and Gollama config

## References

- Full documentation: `docs/setup/local-inference-setup.md` (in repository)
- llama-swap (Phase 2): `docs/setup/llama-swap-setup.md`
- Quick start: `docs/setup/QUICK-START-INFERENCE.md`
- Related skill: `plugins/local-ai-mac-setup/skills/inference-stack/SKILL.md` (installation)
