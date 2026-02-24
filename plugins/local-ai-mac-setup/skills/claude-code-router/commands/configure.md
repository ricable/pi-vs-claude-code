# /claude-code-router:configure Command

Set up model routing for Claude Code across local and cloud providers.

## Usage

```bash
# Interactive configuration wizard
/claude-code-router:configure

# Quick local-only setup (Ollama)
/claude-code-router:configure --local-only

# Multi-provider setup
/claude-code-router:configure --providers ollama,gemini,openrouter

# Configure specific category
/claude-code-router:configure --category think --model gemini-2.5-pro

# Test routing configuration
/claude-code-router:configure --test
```

## Providers

| Provider | Endpoint | API Key | Best For |
|----------|----------|---------|----------|
| **Ollama** | localhost:11434 | None | Local, fast, free |
| **Gemini** | API | `GOOGLE_API_KEY` | Reasoning, vision, web search |
| **OpenRouter** | API | `OPENROUTER_API_KEY` | Multi-model, long context |
| **DeepSeek** | API | `DEEPSEEK_API_KEY` | Code-specialized |

## Configuration Options

### Local-Only (No API Keys)

```bash
/claude-code-router:configure --local-only
```

Routes everything to local Ollama models. Fast, free, private.

### Cloud Integration

```bash
/claude-code-router:configure --add-provider gemini --api-key $GOOGLE_API_KEY
/claude-code-router:configure --add-provider openrouter --api-key $OPENROUTER_API_KEY
```

### Per-Category Routing

```bash
# Use Gemini for reasoning tasks
/claude-code-router:configure --category think --provider gemini

# Use OpenRouter for long context
/claude-code-router:configure --category longContext --provider openrouter --model claude-opus-4

# Use Ollama for fast feedback
/claude-code-router:configure --category default --provider ollama --model glm-4.7-flash
```

### Cost Constraints

```bash
# Limit per-request cost to $0.01
/claude-code-router:configure --max-cost-per-request 0.01

# Set daily budget
/claude-code-router:configure --daily-budget 10.00

# Enable cost-aware routing
/claude-code-router:configure --cost-aware
```

### Health Checks

```bash
# Enable provider health monitoring
/claude-code-router:configure --health-checks enable

# Check interval (ms)
/claude-code-router:configure --health-check-interval 30000
```

## Categories

Route different request types to appropriate providers:

```bash
# default: General tasks
/claude-code-router:configure --category default --provider ollama

# background: Async tasks
/claude-code-router:configure --category background --provider openrouter --timeout 30000

# think: Complex reasoning
/claude-code-router:configure --category think --provider gemini --reasoning extended

# longContext: Large documents (>64k tokens)
/claude-code-router:configure --category longContext --provider openrouter --context 200000

# webSearch: Research with current info
/claude-code-router:configure --category webSearch --provider gemini --web-search

# image: Visual analysis
/claude-code-router:configure --category image --provider gemini --vision
```

## Common Setups

### Development Machine (Fast + Cost-Effective)

```bash
/claude-code-router:configure \
  --category default --provider ollama \
  --category think --provider gemini \
  --category webSearch --provider gemini \
  --cost-aware \
  --max-cost-per-request 0.01
```

### Enterprise (High-Accuracy, Long-Context)

```bash
/claude-code-router:configure \
  --category default --provider openrouter --model claude-opus-4 \
  --category longContext --provider openrouter --context 200000 \
  --daily-budget 100.00 \
  --health-checks enable
```

### Research Machine (Maximum Capability)

```bash
/claude-code-router:configure \
  --providers ollama,gemini,openrouter,deepseek \
  --category think --provider gemini --reasoning extended \
  --category longContext --provider openrouter --model claude-opus-4 \
  --category code --provider deepseek-coder \
  --load-balancing weighted-random
```

## Verification

```bash
# Test routing configuration
/claude-code-router:configure --test

# Check provider health
/claude-code-router:health

# View current routes
/claude-code-router:show-routes

# View costs for this session
/claude-code-router:show-costs
```

## Generated Configuration

Creates `.claude/router.json`:

```json
{
  "routes": {
    "default": { "provider": "ollama", "timeout": 5000 },
    "think": { "provider": "gemini", "timeout": 10000 }
  },
  "providers": [
    {
      "name": "ollama",
      "endpoint": "http://localhost:11434",
      "models": ["glm-4.7-flash"]
    },
    {
      "name": "gemini",
      "apiKey": "${GOOGLE_API_KEY}",
      "models": ["gemini-2.5-pro"]
    }
  ],
  "healthChecks": { "enabled": true, "interval": 30000 },
  "costOptimization": { "maxCostPerRequest": 0.01 }
}
```

See **ROUTING-STRATEGIES.md** for complete routing pattern documentation.
