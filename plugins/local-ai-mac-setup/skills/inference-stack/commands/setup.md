# /inference-stack:setup Command

Initialize the complete inference stack with all backends and shared model directories.

## Usage

```bash
# Interactive setup with all defaults
/inference-stack:setup

# Specify custom model directory
/inference-stack:setup --models-dir ~/MyModels

# Skip LM Studio (already installed)
/inference-stack:setup --skip-lmstudio

# Install MLX (for maximum speed)
/inference-stack:setup --include-mlx

# Full setup with all options
/inference-stack:setup --models-dir ~/AI/models --include-mlx --verify
```

## What It Does

1. **Install Backends** — ollama, llama.cpp, llama-swap, Gollama, LM Studio
2. **Create Directories** — Model folders with proper structure
3. **Configure Tools** — Gollama config, Ollama environment variables
4. **Initialize Storage** — Set up symlinks and shared model folder
5. **Verify Installation** — Test each backend

## Options

| Option | Default | Purpose |
|--------|---------|---------|
| `--models-dir <path>` | `~/.lmstudio/models` | Model storage location |
| `--include-mlx` | skip | Install MLX Python package |
| `--skip-lmstudio` | install | Don't install LM Studio (already have it) |
| `--verify` | yes | Run verification after setup |
| `--verbose` | no | Show detailed output |

## After Setup

1. **Download a model** via LM Studio or `lms get <model>`
2. **Verify stack** — Run `/inference-stack:verify`
3. **Start services** — `ollama serve` or use automation script

## Storage Structure Created

```
~/.lmstudio/models/              ← single source of truth
├── lmstudio-community/          GGUF models
├── mlx-community/               MLX models (safetensors)
├── rano/                        RANO fine-tuned agents
└── ollama/                      Symlinks to Ollama blobs

~/.ollama/models/                Ollama blob storage
├── manifests/
└── blobs/
```

## Troubleshooting

**brew tap fails:**
```bash
brew tap mostlygeek/llama-swap
```

**Go compilation fails:**
```bash
brew install golang
```

**Ollama port in use:**
```bash
lsof -i :11434
# Kill or change OLLAMA_HOST
```
