# Claude Code Router Config Templates

## Pure Local

All requests routed to local inference. Zero cloud cost.

```json
{
  "LOG": true,
  "LOG_LEVEL": "info",
  "API_TIMEOUT_MS": 120000,
  "providers": [
    {
      "name": "llama-swap",
      "api_base_url": "http://localhost:9090/v1/chat/completions",
      "api_key": "not-needed",
      "models": ["glm-4.7-flash", "qwen3-coder-next"],
      "transformer": { "use": ["enhancetool", "cleancache"] }
    }
  ],
  "Router": {
    "default": "llama-swap,glm-4.7-flash",
    "background": "llama-swap,glm-4.7-flash",
    "think": "llama-swap,qwen3-coder-next",
    "longContext": "llama-swap,glm-4.7-flash",
    "longContextThreshold": 60000
  }
}
```

## Hybrid (Local + Cloud)

Local default, cloud for complex reasoning and web search.

```json
{
  "LOG": true,
  "LOG_LEVEL": "info",
  "API_TIMEOUT_MS": 120000,
  "providers": [
    {
      "name": "llama-swap",
      "api_base_url": "http://localhost:9090/v1/chat/completions",
      "api_key": "not-needed",
      "models": ["glm-4.7-flash", "qwen3-coder-next"],
      "transformer": { "use": ["enhancetool", "cleancache"] }
    },
    {
      "name": "gemini",
      "api_base_url": "https://generativelanguage.googleapis.com/v1beta/chat/completions",
      "api_key": "$GEMINI_API_KEY",
      "models": ["gemini-2.0-flash"],
      "transformer": { "use": ["gemini"] }
    },
    {
      "name": "openrouter",
      "api_base_url": "https://openrouter.ai/api/v1/chat/completions",
      "api_key": "$OPENROUTER_API_KEY",
      "models": ["anthropic/claude-sonnet-4-20250514"],
      "transformer": { "use": ["openrouter"] }
    }
  ],
  "Router": {
    "default": "llama-swap,glm-4.7-flash",
    "background": "llama-swap,glm-4.7-flash",
    "think": "openrouter,anthropic/claude-sonnet-4-20250514",
    "longContext": "llama-swap,glm-4.7-flash",
    "longContextThreshold": 60000,
    "webSearch": "gemini,gemini-2.0-flash"
  }
}
```

## RANO-Specific

Dedicated instance for 21 fine-tuned agents. Run on port 3457.

```json
{
  "HOST": "127.0.0.1:3457",
  "LOG": true,
  "LOG_LEVEL": "info",
  "API_TIMEOUT_MS": 120000,
  "providers": [
    {
      "name": "rano-k8s-agents",
      "api_base_url": "http://localhost:9090/v1/chat/completions",
      "api_key": "not-needed",
      "models": [
        "rano/4g-lte-agent-q4_k_m", "rano/5g-nr-agent-q4_k_m",
        "rano/admission-agent-q4_k_m", "rano/alarm-agent-q4_k_m",
        "rano/antenna-agent-q4_k_m", "rano/beam-agent-q4_k_m",
        "rano/ca-agent-q4_k_m", "rano/capacity-agent-q4_k_m",
        "rano/coverage-agent-q4_k_m", "rano/energy-agent-q4_k_m",
        "rano/enm-api-agent-q4_k_m", "rano/interference-agent-q4_k_m",
        "rano/learning-agent-q4_k_m", "rano/link-adaptation-agent-q4_k_m",
        "rano/loadbalance-agent-q4_k_m", "rano/mobility-agent-q4_k_m",
        "rano/neighbor-agent-q4_k_m", "rano/power-agent-q4_k_m",
        "rano/resilience-agent-q4_k_m", "rano/rrm-agent-q4_k_m",
        "rano/throughput-agent-q4_k_m"
      ],
      "transformer": { "use": ["enhancetool", "cleancache"] }
    },
    {
      "name": "glm-fallback",
      "api_base_url": "http://localhost:9090/v1/chat/completions",
      "api_key": "not-needed",
      "models": ["glm-4.7-flash"],
      "transformer": { "use": ["enhancetool", "cleancache"] }
    }
  ],
  "Router": {
    "default": "glm-fallback,glm-4.7-flash",
    "background": "glm-fallback,glm-4.7-flash",
    "think": "glm-fallback,glm-4.7-flash"
  }
}
```
