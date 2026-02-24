# /cc-mirror:create Command

Create isolated Claude Code instances for different AI providers.

## Usage

```bash
# Interactive creation wizard
/cc-mirror:create

# Create specific provider
/cc-mirror:create mirror-gemini --provider openrouter --api-key $OPENROUTER_API_KEY

# Create with model
/cc-mirror:create mirror-deepseek \
  --provider openrouter \
  --model deepseek/deepseek-chat \
  --api-key $OPENROUTER_API_KEY

# Create local-only (no API key)
/cc-mirror:create mirror-local --provider ollama --endpoint http://localhost:11434
```

## Providers Supported

```bash
# Anthropic Claude
/cc-mirror:create mirror-anthropic --provider anthropic --api-key $ANTHROPIC_API_KEY

# Z.ai GLM (Chinese-English)
/cc-mirror:create mirror-zai --provider zai --api-key $ZAI_API_KEY

# MiniMax (Multimodal)
/cc-mirror:create mirror-minimax --provider minimax --api-key $MINIMAX_API_KEY

# Kimi (Long context)
/cc-mirror:create mirror-kimi --provider kimi --api-key $KIMI_API_KEY

# OpenRouter (100+ models)
/cc-mirror:create mirror-gemini --provider openrouter --api-key $OPENROUTER_API_KEY
/cc-mirror:create mirror-deepseek --provider openrouter --api-key $OPENROUTER_API_KEY

# Ollama (Local, free)
/cc-mirror:create mirror-local --provider ollama --endpoint http://localhost:11434

# Vercel (Edge deployment)
/cc-mirror:create mirror-vercel --provider vercel --api-key $VERCEL_AUTH_TOKEN
```

## Common Model Configurations

### Anthropic

```bash
/cc-mirror:create mirror-opus \
  --provider anthropic \
  --model claude-opus-4 \
  --api-key $ANTHROPIC_API_KEY

/cc-mirror:create mirror-sonnet \
  --provider anthropic \
  --model claude-sonnet-4.5 \
  --api-key $ANTHROPIC_API_KEY

/cc-mirror:create mirror-haiku \
  --provider anthropic \
  --model claude-haiku-4.5 \
  --api-key $ANTHROPIC_API_KEY
```

### OpenRouter (Multi-Model)

```bash
# Gemini with vision + web search
/cc-mirror:create mirror-gemini \
  --provider openrouter \
  --model google/gemini-2.5-pro \
  --capabilities vision,webSearch

# Code-specialized DeepSeek
/cc-mirror:create mirror-deepseek \
  --provider openrouter \
  --model deepseek/deepseek-chat \
  --api-key $OPENROUTER_API_KEY

# Long context for large codebases
/cc-mirror:create mirror-longcontext \
  --provider openrouter \
  --model anthropic/claude-opus-4 \
  --api-key $OPENROUTER_API_KEY
```

### Local (Ollama)

```bash
# GLM default
/cc-mirror:create mirror-local \
  --provider ollama \
  --model glm-4.7-flash

# Code-specialized
/cc-mirror:create mirror-coding \
  --provider ollama \
  --model qwen3-coder-next

# Small and fast
/cc-mirror:create mirror-fast \
  --provider ollama \
  --model beam-agent-q4_k_m
```

## Options

| Option | Value | Purpose |
|--------|-------|---------|
| `--provider <name>` | anthropic, zai, minimax, kimi, openrouter, ollama | Provider to use |
| `--model <name>` | Model identifier | Specific model |
| `--api-key <key>` | API key | Authentication credential |
| `--endpoint <url>` | URL | Custom endpoint (Ollama, self-hosted) |
| `--capabilities <list>` | vision, webSearch, reasoning | Optional capabilities |
| `--timeout <ms>` | 5000 | Request timeout |
| `--max-tokens <n>` | 4096 | Default max tokens |
| `--temperature <n>` | 0.7 | Sampling temperature |

## After Creation

1. **Verify the mirror**
   ```bash
   /cc-mirror:verify mirror-name
   ```

2. **Set as active** (optional)
   ```bash
   /cc-mirror:switch mirror-name
   ```

3. **Test with Claude Code**
   ```bash
   claude "test message"
   ```

4. **Configure hooks/permissions** (optional)
   ```bash
   claude /init  # Initialize mirror-specific config
   ```

## Workflow Example

```bash
# Create 3 mirrors
/cc-mirror:create mirror-anthropic --provider anthropic --api-key $ANTHROPIC_API_KEY
/cc-mirror:create mirror-gemini --provider openrouter --model google/gemini-2.5-pro
/cc-mirror:create mirror-local --provider ollama --endpoint http://localhost:11434

# List all mirrors
/cc-mirror:list

# Verify each
/cc-mirror:verify mirror-anthropic
/cc-mirror:verify mirror-gemini
/cc-mirror:verify mirror-local

# Use them
/cc-mirror:switch mirror-local
claude "quick test"

/cc-mirror:switch mirror-anthropic
claude "important task"
```

See **PROVIDER-SETUP.md** for detailed provider documentation.
