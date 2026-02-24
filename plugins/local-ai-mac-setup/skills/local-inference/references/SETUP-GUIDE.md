# Local Inference Infrastructure Setup

Complete guide for managing local LLM models across inference backends using Gollama, LM Studio, Ollama, MLX, and llama.cpp on Apple Silicon.

## Quick Overview

- **LM Studio** → Download & GUI discovery
- **Gollama** → TUI browser, VRAM estimation, audit
- **Ollama** → Background service, agentic tools
- **MLX** → Native Metal optimization, ~1,200 t/s
- **llama.cpp** → Raw inference, maximum flexibility
- **llama-swap** → Single-proxy model routing (Phase 2)

## Model Selection

### 128GB Machine (MBP M3 Max)

Max model weight: **76 GB** (60% rule)

| Model | Size | SWE-Bench | Format |
|-------|------|-----------|--------|
| MiniMax M2.5 | 230B / 10B | 80.20% | MLX |
| GLM-57 | 44B / 40B | 77.80% | MLX |
| Qwen3-Coder-Next | 80B / 3B | 70.60% | GGUF |

### 64GB Machine (Mac Studio M1 Max)

Max model weight: **38 GB** (60% rule)

| Model | Size | Best Quant | Format |
|-------|------|-----------|--------|
| Qwen3-Coder-30B | 30B | Q8_0 | GGUF |
| GLM-4.7-Flash | 30B | Q8_0 | GGUF |
| DeepSeek-R1-Distill | 32B | Q6_K | GGUF |

## Memory Budget Rule

Apple Silicon shares RAM between CPU and GPU:

```
Total RAM × 0.6 = Max Model Weight
Remaining 40% = KV cache + system overhead
```

Check what fits:
```bash
gollama -fits 64          # What fits in 64GB?
gollama -fits 64 -quant Q8_0  # With Q8_0 quantization?
```

## Gollama Setup

TUI for browsing, searching, and auditing models:

```bash
# Interactive browser
gollama

# List all Ollama models
gollama -l

# Find models fitting a budget
gollama -fits 64 -quant Q8_0

# Estimate VRAM for a model
gollama -vram qwen3-coder-next

# Unload all from memory
gollama -u
```

Config: `~/.config/gollama/config.json`

```json
{
  "ollama_api_url": "http://127.0.0.1:11434",
  "ollama_models_dir": "/Users/you/.ollama/models",
  "lm_studio_file_paths": "/Users/you/.lmstudio/models"
}
```

## LM Studio (Download)

Primary interface for downloading models:

1. Open LM Studio → **Discover** tab
2. Search for model (e.g., `Qwen3-Coder`)
3. Select quantization (prefer **Q6_K** or **Q8_0** for code)
4. Click **Download**

Models save to `~/.lmstudio/models/<publisher>/<variant>/`

CLI:
```bash
lms search "qwen3 coder"
lms get mlx-community/Qwen3-Coder-30B-A3B-Instruct-8bit
lms ls
lms server start
```

## Share Models Across Backends

### LM Studio → Ollama (Modelfile FROM)

Create Ollama model pointing to GGUF on disk (no copy):

```bash
# Find the GGUF
find ~/.lmstudio/models -name "*.gguf" | grep -i devstral

# Create Modelfile
cat > /tmp/Modelfile <<'EOF'
FROM /Users/you/.lmstudio/models/mlx-community/Devstral-Small-2-24B/...gguf
PARAMETER num_ctx 32768
EOF

# Register with Ollama
ollama create devstral-small-2 -f /tmp/Modelfile

# Verify
ollama list | grep devstral
```

### Ollama → LM Studio (symlink)

Ollama stores models as SHA256 blobs. Symlink them for LM Studio:

```bash
# Get blob path from modelfile
ollama show glm-4.7-flash:q8_0 --modelfile | grep "^FROM"

# Create symlink in LM Studio
mkdir -p ~/.lmstudio/models/ollama/glm-4.7-flash-q8_0
ln -sf /path/to/blob ~/.lmstudio/models/ollama/glm-4.7-flash-q8_0/model.gguf

# LM Studio auto-detects on next scan
```

### llama.cpp (direct path)

Load GGUF files directly:

```bash
llama-cli -m ~/.lmstudio/models/model.gguf -c 4096 -ngl 99 -cnv
```

### MLX (separate format)

MLX uses safetensors, not GGUF:

```bash
# Download pre-converted
lms get mlx-community/Qwen3-Coder-30B-A3B-Instruct-8bit

# Or convert manually
mlx_lm.convert --hf-path Qwen/Qwen3-Coder-30B \
  --mlx-path ~/AI_Models/qwen3-30b-8bit -q --q-bits 8
```

## Storage Structure

```
~/.lmstudio/models/
  lmstudio-community/      GGUF models
  mlx-community/           MLX models (safetensors)
  rano/                    21 fine-tuned RANO agents
  ollama/                  Symlinks to Ollama blobs

~/.ollama/models/
  manifests/               Model metadata
  blobs/                   SHA256-named weight files
```

The RANO fine-tuned agents are symlinks in `~/.lmstudio/models/rano/` pointing to actual weights elsewhere.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Ollama doesn't see model | Verify absolute path in Modelfile, path must exist |
| OOM during inference | `gollama -u` to unload, check 60% rule |
| LM Studio missing model | Restart LM Studio or run `lms ls` to rescan |
| Broken symlinks | `find ~/.lmstudio/models -type l ! -exec test -e {} \; -print` |
| Wrong quantization | Use Q8_0/Q6_K for code, never Q4_0 or lower |

## Next Steps

1. **Phase 1** (this section): Download, share models locally
2. **Phase 2** (llama-swap): Set up single-proxy model routing
3. **Phase 3** (mesh): Connect multiple Macs via Headscale/Tailscale

See **LLAMA-SWAP-SETUP.md** for Phase 2 configuration.
