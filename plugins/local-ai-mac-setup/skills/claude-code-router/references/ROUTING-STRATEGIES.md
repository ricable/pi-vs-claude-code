# Claude Code Router - Routing Strategies

Guide for routing Claude Code requests to different models based on task category.

## Architecture

```
User Input
    ↓
Claude Code Router (CCR)
    ├─ Category detection (default, background, think, longContext, webSearch, image)
    ├─ Provider selection (Ollama, Gemini, OpenRouter, DeepSeek, local models)
    ├─ Built-in transformers (token pruning, prompt caching, streaming)
    └─ Response aggregation
```

## Routing Categories

| Category | Use Case | Latency | Default Provider |
|----------|----------|---------|------------------|
| **default** | General tasks, code review | <5s | Ollama GLM / Gemini |
| **background** | Long async tasks, training | <30s | OpenRouter / Ollama |
| **think** | Complex reasoning, optimization | <10s | Gemini / DeepSeek |
| **longContext** | Codebase analysis (>64k tokens) | <10s | Claude (via OpenRouter) |
| **webSearch** | Research, current info | <10s | Gemini (with search) |
| **image** | Visual analysis, screenshots | <5s | Gemini Vision |

## Provider Configuration

### Ollama (Local)

```yaml
providers:
  ollama:
    endpoint: "http://localhost:11434"
    models:
      - name: "glm-4.7-flash"
        context: 32768
      - name: "qwen3-coder"
        context: 32768
    latency: <500ms
    cost: $0
```

### Gemini (Cloud)

```yaml
providers:
  gemini:
    apiKey: "${GOOGLE_API_KEY}"
    models:
      - name: "gemini-2.5-pro"
        vision: true
        webSearch: true
      - name: "gemini-2.5-flash"
        latency: <2s
    cost: "$0.075/M input, $0.3/M output"
```

### OpenRouter (Multi-Provider)

```yaml
providers:
  openrouter:
    apiKey: "${OPENROUTER_API_KEY}"
    models:
      - name: "anthropic/claude-opus-4"
        provider: Anthropic
        context: 200000
      - name: "deepseek/deepseek-chat"
        provider: DeepSeek
        context: 128000
      - name: "meta-llama/llama-3.1-405b"
        provider: Together
        context: 128000
```

### DeepSeek (Specialized)

```yaml
providers:
  deepseek:
    apiKey: "${DEEPSEEK_API_KEY}"
    models:
      - name: "deepseek-coder-33b"
        bestFor: ["code-generation", "refactoring"]
        context: 128000
```

## Routing Rules

### By Task Category

```json
{
  "routes": {
    "default": {
      "primary": "ollama",
      "fallback": ["gemini", "openrouter"],
      "timeout": 5000
    },
    "background": {
      "primary": "openrouter",
      "model": "meta-llama/llama-3.1-405b",
      "timeout": 30000
    },
    "think": {
      "primary": "gemini",
      "model": "gemini-2.5-pro",
      "reasoning": "extended",
      "timeout": 10000
    },
    "longContext": {
      "primary": "openrouter",
      "model": "anthropic/claude-opus-4",
      "context": 200000,
      "timeout": 15000
    },
    "webSearch": {
      "primary": "gemini",
      "webSearch": true,
      "timeout": 10000
    },
    "image": {
      "primary": "gemini",
      "vision": true,
      "timeout": 5000
    }
  }
}
```

### By Pattern

Route based on request patterns:

```json
{
  "patterns": [
    {
      "match": "npm run test",
      "route": "background",
      "provider": "openrouter"
    },
    {
      "match": "code review",
      "route": "think",
      "provider": "gemini"
    },
    {
      "match": "screenshot|image|vision",
      "route": "image",
      "provider": "gemini"
    },
    {
      "match": "current (news|weather|trend)",
      "route": "webSearch",
      "provider": "gemini"
    }
  ]
}
```

### By Model Characteristics

```json
{
  "byCharacteristics": {
    "fastFeedback": {
      "provider": "ollama",
      "model": "glm-4.7-flash",
      "maxLatency": 500
    },
    "accurateReasoning": {
      "provider": "gemini",
      "model": "gemini-2.5-pro",
      "reasoning": true
    },
    "longContext": {
      "provider": "openrouter",
      "model": "anthropic/claude-opus-4",
      "minContext": 100000
    },
    "costEffective": {
      "provider": "openrouter",
      "model": "meta-llama/llama-3.1-70b",
      "maxCost": 0.001  // $0.001 per request
    }
  }
}
```

## Built-in Transformers

Transform requests before sending to providers:

### Token Pruning

Remove unnecessary tokens to fit within context:

```json
{
  "transformers": {
    "tokenPruning": {
      "enabled": true,
      "strategy": "oldest-first",
      "keepSystemMessage": true,
      "minTokens": 4096
    }
  }
}
```

### Prompt Caching

Cache common prompts:

```json
{
  "transformers": {
    "promptCaching": {
      "enabled": true,
      "ttl": 3600,
      "minLength": 1024
    }
  }
}
```

### Streaming

Stream responses for better UX:

```json
{
  "transformers": {
    "streaming": {
      "enabled": true,
      "chunkSize": 50,
      "flushInterval": 100
    }
  }
}
```

## Failover Strategy

Route with automatic failover:

```json
{
  "failover": {
    "strategy": "sequential",
    "maxRetries": 2,
    "backoffMultiplier": 1.5,
    "retryableErrors": [
      "timeout",
      "rate_limit",
      "service_unavailable",
      "temporary_error"
    ]
  }
}
```

## Load Balancing

Distribute load across multiple providers:

```json
{
  "loadBalancing": {
    "strategy": "weighted-random",
    "providers": [
      {"provider": "ollama", "weight": 50},
      {"provider": "gemini", "weight": 30},
      {"provider": "openrouter", "weight": 20}
    ]
  }
}
```

## Cost Optimization

Monitor and optimize costs:

```json
{
  "costOptimization": {
    "maxCostPerRequest": 0.01,
    "dailyBudget": 10.00,
    "costAwareRouting": true,
    "logCosts": true
  }
}
```

## Health Checks

Monitor provider health:

```json
{
  "healthChecks": {
    "enabled": true,
    "interval": 30000,
    "providers": [
      {
        "provider": "ollama",
        "endpoint": "http://localhost:11434/health",
        "timeout": 5000
      },
      {
        "provider": "gemini",
        "endpoint": "https://generativelanguage.googleapis.com/v1/models",
        "timeout": 10000
      }
    ]
  }
}
```

## Example: Complete Routing Config

```json
{
  "routes": {
    "default": {
      "primary": "ollama",
      "fallback": ["gemini"],
      "timeout": 5000
    },
    "background": {
      "primary": "openrouter",
      "model": "meta-llama/llama-3.1-405b",
      "timeout": 30000
    },
    "think": {
      "primary": "gemini",
      "model": "gemini-2.5-pro",
      "reasoning": "extended"
    },
    "longContext": {
      "primary": "openrouter",
      "model": "anthropic/claude-opus-4",
      "context": 200000
    }
  },
  "healthChecks": {
    "enabled": true,
    "interval": 30000
  },
  "costOptimization": {
    "maxCostPerRequest": 0.01,
    "costAwareRouting": true
  },
  "transformers": {
    "tokenPruning": { "enabled": true },
    "promptCaching": { "enabled": true },
    "streaming": { "enabled": true }
  }
}
```

See **claude-code-router** skill for setup and `/claude-code-router:configure` command.
