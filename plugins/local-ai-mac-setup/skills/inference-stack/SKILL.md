---
name: inference-stack
description: "Install and configure the local inference stack on Apple Silicon: Ollama (model serving), llama-swap (single-port model routing proxy), LM Studio (GUI + downloads), llama.cpp (raw Metal inference), MLX (native Apple optimization), and Gollama (TUI model auditor). Use when setting up local LLM inference from scratch, adding new inference backends, or troubleshooting inference services."
---

# Local Inference Stack Setup

Install all inference backends and configure them to work together on Apple Silicon.

## Install All Tools

```bash
# Core inference
brew install ollama llama.cpp
brew install mostlygeek/llama-swap/llama-swap
brew install --cask lm-studio

# Model management
brew install gollama
# Or: go install github.com/sammcj/gollama@latest

# MLX (optional, for native Metal)
uv pip install mlx-lm

# Verify
ollama --version && llama-cli --version && llama-swap --version && gollama -v
lms --version
```

## Create Shared Model Folder

Zero-duplication architecture -- one model file, all tools access it:

```bash
mkdir -p ~/AI/models/{lmstudio,ollama,mlx,gguf,shared}
ln -sf ~/AI/models/lmstudio ~/.lmstudio/models
ln -sf ~/AI/models ~/models
```

## Configure Each Tool

### Gollama

```bash
mkdir -p ~/.config/gollama
cat > ~/.config/gollama/config.json <<'EOF'
{
  "ollama_api_url": "http://127.0.0.1:11434",
  "ollama_models_dir": "$HOME/.ollama/models",
  "lm_studio_file_paths": "$HOME/AI/models/lmstudio",
  "sort_order": "modified",
  "log_level": "info",
  "theme": "dark-neon"
}
EOF
```

Replace `$HOME` with your actual home path in the config.

### Ollama Environment

```bash
# Add to ~/.zshrc
export OLLAMA_MODELS=$HOME/.ollama/models
export OLLAMA_HOST=127.0.0.1:11434
export OLLAMA_KEEP_ALIVE=5m
```

## Start Services

### Manual Start

```bash
# Terminal 1: Ollama
ollama serve

# Terminal 2: llama-swap
llama-swap --config config/llama-swap.yaml --listen 0.0.0.0:9090

# Optional: LM Studio
lms server start
```

### Automated Start

```bash
./scripts/start-inference.sh
```

## llama-swap Configuration

llama-swap replaces the legacy multi-port fleet with a single OpenAI-compatible proxy.

### Architecture

```
Client request (model: "glm-4.7-flash")
    → llama-swap (:9090)
        → spawns llama-server with correct GGUF
        → routes request
        → auto-unloads after TTL
```

### Generate Config

```bash
python3 scripts/generate-llama-swap-config.py \
  --models-dir ~/AI/models/lmstudio \
  --output config/llama-swap.yaml
```

### Key Config Concepts

- **Groups**: `rano-k8s-agents` (concurrent, small) vs `coding` (exclusive, large)
- **TTL**: 300s for agents (5 min), 1800s for large models (30 min)
- **Auto-spawn**: Models start on first request, no preloading needed

### Verify

```bash
curl -s http://localhost:9090/health
curl -s http://localhost:9090/v1/models | jq '.data | length'
curl -s http://localhost:9090/running | jq .
```

## Storage Architecture

```
~/AI/models/lmstudio/           ← single source of truth
├── lmstudio-community/         GGUF models (LM Studio downloads)
├── mlx-community/              MLX models (safetensors)
├── rano/                       21 fine-tuned RANO agents
└── ollama/                     symlinks to Ollama blobs

Sharing paths:
  LM Studio → Ollama:  Modelfile FROM <path>    (reference, no copy)
  Ollama → LM Studio:  symlink blob             (scripts/link-ollama-to-lmstudio.sh)
  llama-swap:           GGUF direct path         (auto-spawn)
  llama.cpp:            -m <path>                (direct load)
  MLX:                  separate safetensors     (downloaded or converted)
```

## Framework Selection Guide

| Framework | Best For | When to Use |
|-----------|----------|-------------|
| Ollama | Agentic tools | Claude Code, Aider, background serving |
| llama-swap | RANO optimizer | 21-agent routing, single endpoint |
| LM Studio | Downloads + GUI | Model discovery, quick testing |
| llama.cpp | Power tuning | Quantization experiments, speculative decoding |
| MLX | Maximum speed | ~1,200 t/s prompt processing, repo navigation |

## Bundled Resources

- **[BACKEND-INSTALLATION.md](references/BACKEND-INSTALLATION.md)** — Detailed installation for each backend (Ollama, llama.cpp, llama-swap, LM Studio, Gollama, MLX)
- **[verify-backends.sh](scripts/verify-backends.sh)** — Verify all backends are installed
- **[setup command](commands/setup.md)** — Interactive `/inference-stack:setup` command for full initialization

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 9090 in use | `lsof -i :9090` then kill or change port |
| OOM errors | `gollama -u` to unload; check 60% rule |
| Model not found | `python3 scripts/generate-llama-swap-config.py --check` |
| Slow first request | Normal cold start; pre-warm with dummy request |
| LM Studio missing models | Verify symlink: `ls -la ~/.lmstudio/models` |
| Backend install fails | See [BACKEND-INSTALLATION.md](references/BACKEND-INSTALLATION.md) for detailed setup |
