# Claude Code Mirror - Provider Setup Guide

Guide for creating isolated Claude Code instances for different AI providers.

## Supported Providers

| Provider | API Key Env | Region | Cost | Best For |
|----------|-----------|--------|------|----------|
| **Anthropic (Mirror)** | `ANTHROPIC_API_KEY` | Global | $100/mo | Primary Claude models |
| **Z.ai** | `ZAI_API_KEY` | China | Yearly | GLM-4.7 (Chinese-English) |
| **MiniMax** | `MINIMAX_API_KEY` | China | Yearly | M2.5 (multimodal) |
| **Kimi** | `KIMI_API_KEY` | China | Yearly | K2.5 (long context) |
| **OpenRouter** | `OPENROUTER_API_KEY` | Global | Varies | 100+ models, routing |
| **Ollama** | None | Local | Free | Local models |
| **Vercel** | `VERCEL_AUTH_TOKEN` | Global | Varies | Edge deployment |
| **NanoGPT** | `NANOGPT_API_KEY` | Global | Low-cost | Budget option |

## Mirror Architecture

Each mirror is an isolated Claude Code instance with its own:
- Config files (CLAUDE.md, settings.json)
- Memory (hooks, skill cache)
- Sessions
- MCP servers
- Credential store

```
~/.claude-mirrors/
├── mirror-anthropic/          Anthropic Claude
├── mirror-zai/                Z.ai GLM models
├── mirror-minimax/            MiniMax M2.5
├── mirror-gemini/             OpenRouter + Gemini
├── mirror-deepseek/           OpenRouter + DeepSeek
└── mirror-local/              Ollama local models
```

## Provider-Specific Setup

### Anthropic (Primary)

**API Key:** https://console.anthropic.com/

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
cc-mirror create mirror-anthropic \
  --provider anthropic \
  --model claude-opus-4 \
  --api-key $ANTHROPIC_API_KEY
```

**Models:**
- claude-opus-4 (most capable)
- claude-sonnet-4.5 (faster)
- claude-haiku-4.5 (fastest, cheapest)

### Z.ai (China)

**API Key:** https://www.zai.com/ (Chinese-English)

```bash
export ZAI_API_KEY="zai-..."
cc-mirror create mirror-zai \
  --provider zai \
  --model glm-4.7-flash \
  --api-key $ZAI_API_KEY
```

**Models:**
- glm-4.7-flash (recommended)
- glm-4.7 (larger)
- glm-4-long (long context)

### MiniMax (Multimodal)

**API Key:** https://www.minimaxi.com/

```bash
export MINIMAX_API_KEY="sk-..."
cc-mirror create mirror-minimax \
  --provider minimax \
  --model mm-40b-vision \
  --api-key $MINIMAX_API_KEY
```

**Models:**
- mm-40b-vision (multimodal)
- m2.5 (alternative)

### Kimi (Long Context)

**API Key:** https://platform.moonshot.cn/

```bash
export KIMI_API_KEY="sk-..."
cc-mirror create mirror-kimi \
  --provider kimi \
  --model moonshot-v1-128k \
  --api-key $KIMI_API_KEY
```

**Models:**
- moonshot-v1-128k (128k context)
- moonshot-v1-32k (32k context)

### OpenRouter (Multi-Provider)

**API Key:** https://openrouter.ai/

```bash
export OPENROUTER_API_KEY="sk-..."

# Gemini via OpenRouter
cc-mirror create mirror-gemini \
  --provider openrouter \
  --model google/gemini-2.5-pro \
  --api-key $OPENROUTER_API_KEY

# DeepSeek via OpenRouter
cc-mirror create mirror-deepseek \
  --provider openrouter \
  --model deepseek/deepseek-chat \
  --api-key $OPENROUTER_API_KEY
```

**Popular models:**
- google/gemini-2.5-pro (reasoning, vision, web search)
- deepseek/deepseek-chat (code-specialized)
- meta-llama/llama-3.1-405b (massive context)
- anthropic/claude-opus-4 (highest quality)

### Ollama (Local)

**No API key needed:**

```bash
# Ensure Ollama is running
ollama serve

# Create mirror
cc-mirror create mirror-local \
  --provider ollama \
  --endpoint http://localhost:11434 \
  --model glm-4.7-flash
```

**Models:**
- glm-4.7-flash (default)
- qwen3-coder-next (code-specialized)
- beam-agent-q4_k_m (small, fast)

## Mirror Management

### Create a Mirror

```bash
# Interactive
/cc-mirror:create

# Non-interactive
/cc-mirror:create mirror-name --provider anthropic --api-key $KEY
```

### Switch Active Mirror

```bash
# Interactive
/cc-mirror:switch

# Direct
/cc-mirror:switch mirror-gemini
```

### List Mirrors

```bash
/cc-mirror:list

# Shows:
# - mirror-anthropic (active) ✓
# - mirror-zai
# - mirror-local
```

### Verify Mirror Configuration

```bash
/cc-mirror:verify mirror-name

# Checks:
# - API key validity
# - Model availability
# - Network connectivity
# - Configuration files
```

### Delete Mirror

```bash
/cc-mirror:delete mirror-name --confirm
```

## Configuration Inheritance

Each mirror inherits and can override:

```
Managed policy (enterprise)
    ↓
User global (~/.claude/CLAUDE.md)
    ↓
Mirror-specific (~/.claude-mirrors/mirror-name/CLAUDE.md)
    ↓
Mirror-specific hooks
    ↓
Mirror-specific MCP servers
```

## Cost Tracking

Monitor spending per mirror:

```bash
# Show costs for current session
/cc-mirror:show-costs

# Compare across mirrors
/cc-mirror:cost-comparison

# Set spending limits
/cc-mirror:set-budget mirror-name --daily 10.00
```

## Multi-Mirror Workflow

```bash
# Research and experimentation
/cc-mirror:switch mirror-gemini
claude "search for recent AI advances"

# Code generation and review
/cc-mirror:switch mirror-anthropic
claude "implement authentication"

# Cost-optimized
/cc-mirror:switch mirror-local
claude "refactor this function"

# Complex reasoning
/cc-mirror:switch mirror-deepseek-openrouter
claude "design architecture for..."
```

## Environment Configuration

Create `.env.mirrors`:

```bash
# Primary
ANTHROPIC_API_KEY="sk-ant-..."

# Multi-provider
ZAI_API_KEY="zai-..."
MINIMAX_API_KEY="sk-..."
OPENROUTER_API_KEY="sk-..."

# Local
OLLAMA_HOST="http://localhost:11434"
```

Load before use:

```bash
source .env.mirrors
/cc-mirror:create mirror-anthropic
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API key invalid | Verify key in provider console, check `PROVIDER_API_KEY` env var |
| Model not found | Check provider docs for available models |
| Connection timeout | Verify endpoint URL, check network connectivity |
| Permission denied | Check file permissions in `~/.claude-mirrors/` |
| Config conflicts | Mirror settings override global; check `CLAUDE.md` hierarchy |

## Best Practices

1. **Name mirrors descriptively** — `mirror-anthropic-work`, `mirror-local-dev`
2. **Use .env files** — Don't hardcode API keys in shell history
3. **Separate credentials** — Each provider's keys in different env vars
4. **Test connectivity** — Run `/cc-mirror:verify` after creating
5. **Monitor costs** — Use `/cc-mirror:cost-comparison` regularly
6. **Backup configs** — Mirrors stored in `~/.claude-mirrors/` (version control optional)
7. **Document in CLAUDE.md** — Note which mirror to use for which tasks

See `claude-code-router` for automatic provider selection via routing.
