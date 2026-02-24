# Model Sharing Across Inference Backends

Guide for sharing models between LM Studio, Ollama, llama.cpp, and MLX with zero duplication.

## Model Storage Hierarchy

```
~/.lmstudio/models/                Single source of truth
├── lmstudio-community/            GGUF downloads
├── mlx-community/                 MLX safetensors
├── rano/                          21 fine-tuned agents
└── ollama/                        Symlinks to Ollama blobs

~/.ollama/models/blobs/            Ollama stores as SHA256 hashes
```

## Backend-Specific Sharing Patterns

### Pattern 1: LM Studio → Ollama (Modelfile FROM)

LM Studio downloads GGUF files. Reference them from Ollama without copying:

```bash
# 1. Find the GGUF path (downloaded via LM Studio)
GGUF=$(find ~/.lmstudio/models -name "*.gguf" -type f | grep -i "devstral" | head -1)
echo "Found: $GGUF"

# 2. Create Ollama Modelfile pointing to it
cat > /tmp/Modelfile <<'EOF'
FROM /Users/you/.lmstudio/models/mlx-community/Devstral-Small-2-24B/devstral-small-2-24b.gguf
PARAMETER num_ctx 32768
PARAMETER temperature 0.7
EOF

# 3. Register with Ollama
ollama create devstral-small-2 -f /tmp/Modelfile

# 4. Verify both see it
ollama list | grep devstral
lms ls | grep devstral
```

**Advantages:**
- No disk space duplication
- Ollama serves without copy
- Changes in LM Studio path automatically affect Ollama

**When to use:** Primary model download is via LM Studio

### Pattern 2: Ollama → LM Studio (Symlink)

Ollama stores models as SHA256-named blobs. Symlink them so LM Studio can see them:

```bash
# 1. Get the blob path
ollama show glm-4.7-flash:q8_0 --modelfile | grep "^FROM"
# Output: FROM /Users/you/.ollama/models/blobs/sha256-abc123...

# 2. Create LM Studio directory
mkdir -p ~/.lmstudio/models/ollama/glm-4.7-flash-q8_0

# 3. Symlink with .gguf extension
ln -sf /Users/you/.ollama/models/blobs/sha256-abc123 \
  ~/.lmstudio/models/ollama/glm-4.7-flash-q8_0/glm-4.7-flash-q8_0.gguf

# 4. Verify
ls -la ~/.lmstudio/models/ollama/glm-4.7-flash-q8_0/
lms ls | grep glm
```

**Automation:** Use the provided script to batch-link all Ollama models:

```bash
./plugins/local-ai-mac-setup/skills/model-management/scripts/link-models.sh

# Preview first
./plugins/local-ai-mac-setup/skills/model-management/scripts/link-models.sh --dry-run

# Clean broken symlinks
./plugins/local-ai-mac-setup/skills/model-management/scripts/link-models.sh --cleanup
```

### Pattern 3: llama.cpp (Direct Path)

llama.cpp loads GGUF files directly — no linking needed:

```bash
# Simple inference
llama-cli -m ~/.lmstudio/models/mlx-community/Devstral-Small-2-24B/model.gguf \
  -c 32768 -ngl 99 -p "Write Python:"

# With system prompt
llama-cli -m model.gguf \
  -sys "You are a helpful coding assistant" \
  -p "Explain how async/await works"

# JSON constrained output
llama-cli -m model.gguf \
  -j '{"type":"object","properties":{"code":{"type":"string"}}}' \
  -p "Write code to parse CSV"

# Speculative decoding (large model + draft)
llama-cli -m qwen3-coder-next.gguf \
  -md beam-agent-q4_k_m.gguf \
  -ngl 99 -c 32768 -p "Explain AI"
```

### Pattern 4: MLX (Separate Format)

MLX uses safetensors format, not GGUF. Downloaded separately:

```bash
# Download pre-converted MLX model via LM Studio
lms get mlx-community/Qwen3-Coder-30B-A3B-Instruct-8bit

# Or convert a HuggingFace model
mlx_lm.convert \
  --hf-path Qwen/Qwen3-Coder-30B-A3B-Instruct \
  --mlx-path ~/.lmstudio/models/mlx/qwen3-30b-8bit \
  -q --q-bits 8

# Run inference
mlx_lm.generate \
  --model ~/.lmstudio/models/mlx/qwen3-30b-8bit \
  --prompt "Write Python code"
```

## Model Addition Workflow

### Add a new model to all backends

```bash
# 1. Download via LM Studio
lms get mlx-community/Qwen3-Coder-Next-8bit

# 2. Verify it fits
gollama -fits 64 -quant Q8_0

# 3. Share with Ollama (if GGUF)
GGUF=$(find ~/.lmstudio/models -name "*.gguf" | grep -i qwen3-coder-next | head -1)
cat > /tmp/Modelfile <<EOF
FROM $GGUF
PARAMETER num_ctx 32768
EOF
ollama create qwen3-coder-next -f /tmp/Modelfile

# 4. Link Ollama models to LM Studio
./scripts/link-models.sh

# 5. Update llama-swap config (if using Phase 2)
python3 scripts/generate-llama-swap-config.py --output config/llama-swap.yaml

# 6. Test all backends
ollama list | grep qwen
lms ls | grep qwen
gollama -l | grep qwen
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Ollama doesn't see LM Studio model | Path in Modelfile must be absolute, file must exist |
| Symlink is broken | Run `./scripts/link-models.sh --cleanup` to fix |
| llama.cpp can't find model | Use absolute path: `llama-cli -m /Users/you/.lmstudio/models/...` |
| MLX model not found | Check it's in `~/.lmstudio/models/mlx-community/` |
| Disk space exploding | Check for duplicate downloads: `du -sh ~/.lmstudio/models/*` |
| Model appears in 2 backends | This is intentional (symlinks); verify with `ls -la` |

## Best Practices

1. **Download once** — Use LM Studio as primary source
2. **Share via reference** — Use Modelfile FROM and symlinks
3. **Audit regularly** — `gollama -l` to see all models
4. **Clean broken links** — `./scripts/link-models.sh --cleanup`
5. **Test before production** — Verify model works in target backend
6. **Monitor disk space** — Watch `du -sh ~/.lmstudio/models/`
7. **Use quantization wisely** — Q8_0/Q6_K for code, Q4_K_M for small agents
