# /model-management:download Command

Download and organize LLM models across inference backends.

## Usage

```bash
# Interactive model discovery
/model-management:download

# Download specific model
/model-management:download --model "Qwen3-Coder-Next"

# Download with options
/model-management:download --model "GLM-4.7-Flash" --backend lmstudio --quant Q8_0

# Batch download
/model-management:download --batch recommended --size 64gb

# List available models
/model-management:download --list --size 128gb
```

## Options

| Option | Values | Purpose |
|--------|--------|---------|
| `--model <name>` | Any HF model | Download specific model |
| `--backend <name>` | lmstudio, ollama, mlx | Where to download |
| `--quant <level>` | Q8_0, Q6_K, Q4_K_M | Quantization |
| `--size <memory>` | 64gb, 128gb | Filter by machine RAM |
| `--batch <preset>` | recommended, minimal, maxsize | Download multiple |
| `--list` | — | Show available models |
| `--dry-run` | — | Preview before downloading |

## Model Tiers

### Recommended for Coding (64GB machine)

```bash
/model-management:download --batch recommended --size 64gb
```

- GLM-4.7-Flash (30B, Q8_0)
- Qwen3-Coder-30B (30B, Q8_0)
- Devstral-Small-2 (24B, Q8_0)
- RANO agents (21 × 484MB)

### Recommended for 128GB machine

- MiniMax M2.5 (230B / 10B, MLX)
- Qwen3-Coder-Next (52B, Q6_K)
- GLM-4.7-Flash (30B, Q8_0)
- RANO agents (21 × 484MB)

## Workflow

```bash
# 1. Check what fits
/model-management:download --list --size 64gb

# 2. Download a model
/model-management:download --model "GLM-4.7-Flash" --quant Q8_0

# 3. Verify download
/model-management:audit

# 4. Share with other backends
/model-management:link

# 5. Test
ollama list
lms ls
```

## Common Models

| Model | Size | Best For | Quant |
|-------|------|----------|-------|
| GLM-4.7-Flash | 30B | General coding | Q8_0 |
| Qwen3-Coder | 30B / 52B | Code generation | Q8_0 / Q6_K |
| Devstral-Small | 24B | Fast inference | Q8_0 |
| MiniMax M2.5 | 230B | Large context | MLX |
| RANO agents | 752M each (21×) | Domain experts | Q4_K_M |

## Tips

- Always verify with `gollama -fits <ram>` before downloading
- Use Q8_0/Q6_K minimum for code tasks
- RANO agents are small and can run many in parallel
- MLX models are fastest on Apple Silicon

See **MODEL-SHARING.md** for cross-backend integration after download.
