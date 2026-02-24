---
name: claude-code-router
description: "Configure claude-code-router (CCR) to route Claude Code requests to local models (Ollama, llama-swap) and cloud providers (Gemini, OpenRouter, DeepSeek). Supports category-based routing (default, background, think, longContext, webSearch, image), built-in transformers, and multiple concurrent instances. Use when setting up model routing, configuring CCR providers, or creating hybrid local+cloud routing strategies."
---

# Claude Code Router Setup

Route Claude Code to any model via a local proxy.

## Install

```bash
npm install -g @musistudio/claude-code-router
ccr --version
```

## Config Location

`~/.claude-code-router/config.json`

## Config Format

```json
{
  "LOG": true,
  "LOG_LEVEL": "info",
  "API_TIMEOUT_MS": 120000,
  "providers": [
    {
      "name": "provider-name",
      "api_base_url": "http://host:port/v1/chat/completions",
      "api_key": "key-or-$ENV_VAR",
      "models": ["model-id"],
      "transformer": { "use": ["transformer-name"] }
    }
  ],
  "Router": {
    "default": "provider,model",
    "background": "provider,model",
    "think": "provider,model",
    "longContext": "provider,model",
    "longContextThreshold": 60000,
    "webSearch": "provider,model",
    "image": "provider,model"
  }
}
```

## Routing Categories

| Category | When Used | Recommendation |
|----------|-----------|----------------|
| `default` | Standard requests | Good all-rounder |
| `background` | Quick tasks, subagents | Fast small model |
| `think` | Complex reasoning | Best reasoning model |
| `longContext` | Over threshold chars | High-context model (128K+) |
| `webSearch` | Web queries | Web-capable model |
| `image` | Vision tasks | Multimodal model |

## Provider Templates

### Ollama

```json
{
  "name": "ollama",
  "api_base_url": "http://localhost:11434/v1/chat/completions",
  "api_key": "not-needed",
  "models": ["glm-4.7-flash:q8_0"],
  "transformer": { "use": ["enhancetool", "cleancache"] }
}
```

### llama-swap

```json
{
  "name": "llama-swap",
  "api_base_url": "http://localhost:9090/v1/chat/completions",
  "api_key": "not-needed",
  "models": ["glm-4.7-flash", "qwen3-coder-next"],
  "transformer": { "use": ["enhancetool", "cleancache"] }
}
```

### Gemini

```json
{
  "name": "gemini",
  "api_base_url": "https://generativelanguage.googleapis.com/v1beta/chat/completions",
  "api_key": "$GEMINI_API_KEY",
  "models": ["gemini-2.0-flash"],
  "transformer": { "use": ["gemini"] }
}
```

### OpenRouter

```json
{
  "name": "openrouter",
  "api_base_url": "https://openrouter.ai/api/v1/chat/completions",
  "api_key": "$OPENROUTER_API_KEY",
  "models": ["anthropic/claude-sonnet-4-20250514"],
  "transformer": { "use": ["openrouter"] }
}
```

## Built-in Transformers

`anthropic`, `deepseek`, `gemini`, `openrouter`, `groq`, `maxtoken`, `tooluse`, `reasoning`, `sampling`, `enhancetool`, `cleancache`, `vertex-gemini`

## CLI Commands

```bash
ccr start             # Start proxy (default :3456)
ccr stop              # Stop proxy
ccr status            # Check status
ccr code              # Launch Claude Code through CCR
ccr logs              # View logs
ccr ui                # Web config interface
ccr activate          # Setup shell env vars
ccr start --port 3457 # Custom port
```

## Multiple Instances

Run separate routing strategies on different ports:

```bash
# General purpose
ccr start  # :3456 with default config

# RANO-specific (custom config)
CCR_CONFIG=~/.claude-code-router/config-rano.json ccr start --port 3457
```

## Shell Integration

```bash
eval "$(ccr activate)"
# Sets ANTHROPIC_BASE_URL, AUTH_TOKEN
# Then: claude (routed through CCR)
```

## Hybrid Local+Cloud Config

## Bundled Resources

- **[ROUTING-STRATEGIES.md](references/ROUTING-STRATEGIES.md)** — Complete routing patterns with category rules, provider config, load balancing, cost optimization, and health checks
- **[configure command](commands/configure.md)** — Interactive `/claude-code-router:configure` for route setup and provider selection

## References

- **claude-code-router** repository: https://github.com/musistudio/claude-code-router
- **OpenRouter** (100+ models): https://openrouter.ai/
- **Related skill**: `cc-mirror-providers` for isolated provider instances
- Complete config templates: `references/ROUTING-STRATEGIES.md`
