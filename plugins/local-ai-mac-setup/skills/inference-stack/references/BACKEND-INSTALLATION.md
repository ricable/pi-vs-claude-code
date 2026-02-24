# Inference Backend Installation Guide

Complete instructions for installing each inference backend on Apple Silicon.

## Installation Matrix

| Backend | Install Method | Verify | Best For |
|---------|---|---|---|
| Ollama | Homebrew or official installer | `ollama --version` | Background serving, agentic tools |
| llama.cpp | Homebrew | `llama-cli --version` | Raw inference, power tuning |
| llama-swap | Homebrew (tap) | `llama-swap --version` | Single-proxy routing (Phase 2) |
| LM Studio | GUI download | `lms --version` | Model discovery, downloads |
| Gollama | Homebrew | `gollama -v` | VRAM estimation, model audit |
| MLX | Python package | `python3 -c "import mlx_lm"` | Maximum speed (~1,200 t/s) |

## Ollama

Official installer or Homebrew:

```bash
# Option 1: Homebrew
brew install ollama

# Option 2: Official installer (https://ollama.com/)
# Download and drag to Applications

# Verify
ollama --version

# Test
ollama list
```

Environment variables (add to ~/.zshrc):

```bash
export OLLAMA_MODELS=$HOME/.ollama/models
export OLLAMA_HOST=127.0.0.1:11434
export OLLAMA_KEEP_ALIVE=5m
export OLLAMA_NUM_PARALLEL=4
export OLLAMA_NUM_GPU=1
```

## llama.cpp

Fast, optimized inference with maximum flexibility:

```bash
# Homebrew installation
brew install llama.cpp

# Verify
llama-cli --version

# Test a model
llama-cli -m ~/.lmstudio/models/model.gguf -c 2048 -n 100 -p "Hello"
```

Key flags for Apple Silicon:

```bash
# Full GPU offload
-ngl 99

# Flash Attention
-fa on

# KV cache quantization
-ctk q8_0
-ctv q8_0

# Context size
-c 32768

# Speculative decoding (draft model)
-md draft-model.gguf --draft-max 16
```

## llama-swap

Single-proxy model routing (replaces legacy multi-port fleet):

```bash
# Install via homebrew tap
brew tap mostlygeek/llama-swap
brew install llama-swap

# Or build from source
git clone https://github.com/mostlygeek/llama-swap.git
cd llama-swap
go build -o llama-swap cmd/server/main.go

# Verify
llama-swap --version

# Generate config (see inference-stack skill)
python3 scripts/generate-llama-swap-config.py \
  --models-dir ~/.lmstudio/models \
  --output config/llama-swap.yaml
```

Configuration example:

```yaml
groups:
  rano-k8s-agents:
    mode: concurrent      # Multiple agents active simultaneously
    models:
      - "rano/*"
    ttl: 300s             # Unload after 5 minutes

  coding:
    mode: exclusive       # Only one large model at a time
    models:
      - "qwen3-coder-next"
      - "glm-4.7-flash"
    ttl: 1800s            # Unload after 30 minutes
```

## LM Studio

GUI-based model manager and inference:

```bash
# Download from https://lmstudio.ai/
# Drag to Applications

# Verify
lms --version

# CLI
lms search "qwen3"
lms get mlx-community/Qwen3-Coder-30B-A3B-Instruct-8bit
lms ls
```

Environment variables:

```bash
export LM_STUDIO_PATH="$HOME/Applications/LM Studio.app"
```

## Gollama

TUI for model browsing, VRAM estimation, and auditing:

```bash
# Install via Homebrew
brew install gollama

# Or via Go
go install github.com/sammcj/gollama@latest

# Verify
gollama -v

# Interactive browser
gollama

# List all models with sizes
gollama -l

# Find what fits in a budget
gollama -fits 64 -quant Q8_0
```

Config: `~/.config/gollama/config.json`

```json
{
  "ollama_api_url": "http://127.0.0.1:11434",
  "ollama_models_dir": "/Users/you/.ollama/models",
  "lm_studio_file_paths": "/Users/you/.lmstudio/models",
  "sort_order": "modified",
  "log_level": "info",
  "theme": "dark-neon"
}
```

## MLX

Native Apple Silicon optimization for maximum speed:

```bash
# Python package installation
pip install mlx-lm

# Or with uv (recommended)
uv pip install mlx-lm

# Verify
python3 -c "import mlx_lm; print(mlx_lm.__version__)"

# Test inference
mlx_lm.generate \
  --model mlx-community/Qwen3-4B-Instruct-8bit \
  --prompt "Write Python code to"
```

Download pre-converted models from `mlx-community/`:

```bash
mlx_lm.get mlx-community/Qwen3-Coder-30B-A3B-Instruct-8bit
```

Or convert a HuggingFace model:

```bash
mlx_lm.convert \
  --hf-path Qwen/Qwen3-Coder-30B-A3B-Instruct \
  --mlx-path ~/AI/models/mlx/qwen3-30b-8bit \
  -q --q-bits 8
```

## Installation Verification

After installing all backends, verify the complete stack:

```bash
# Languages
go version && python3 --version

# Inference backends
ollama --version
llama-cli --version
gollama -v
llama-swap --version

# LM Studio
lms --version

# MLX
python3 -c "import mlx_lm; print('MLX available')"

# Or use the verification script
./plugins/local-ai-mac-setup/skills/inference-stack/scripts/verify-backends.sh
```

## Dependency Graph

```
  LM Studio (standalone, no deps)
       ↓
   Gollama (reads LM Studio models)
       ↓
   Ollama (background service)
       ↓
  llama-swap (routes to backends)
       ↓
  llama.cpp (direct path to GGUF)
       ↓
  MLX (separate safetensors format)
```

Install in this order for maximum compatibility.

## Common Issues

| Issue | Solution |
|-------|----------|
| `brew tap` fails | `brew tap mostlygeek/llama-swap` (exact tap name) |
| Go compilation fails | Ensure Go is installed: `go version` |
| Ollama won't start | Check port 11434: `lsof -i :11434` |
| LM Studio not detecting models | Restart LM Studio or use `lms scan` |
| MLX import error | Python environment issue; use `uv pip install` |
| gollama config errors | Check JSON syntax: `jq empty ~/.config/gollama/config.json` |
