# Provider Comparison Matrix (February 2026)

## Cloud Providers

| Provider | Models | SWE-Bench | Context | Input $/M | Output $/M | Tool-Calling | Team Mode |
|----------|--------|-----------|---------|-----------|------------|-------------|-----------|
| Anthropic (Mirror) | Opus 4.6, Sonnet 4.5, Haiku 4.5 | 80.8% | 1M | $3-5 | $15-25 | Excellent | Default |
| Z.ai | GLM-5, GLM-4.7 | 73.8% | 200K | ~$3/mo flat | (120-600 prompts) | Good | Manual |
| MiniMax | M2.5, M2.1 | 80.2% | 1M | $0.27 | $0.95 | Excellent | Manual |
| Kimi | K2.5 | 76.8% | 256K | $0.60 | $3.00 | Good | Manual |
| OpenRouter | 100+ models | Varies | Varies | Varies | Varies | Varies | Manual |
| Gemini | 3 Pro, 2.0 Flash | 74-76% | 2M | $0.075 | $0.30 | Good | N/A |

## Local Models (Free)

| Model | Active Params | SWE-Bench | Context | RAM Needed | Tool-Calling |
|-------|--------------|-----------|---------|-----------|-------------|
| GLM-4.7-Flash | 30B | 73.8% | 128K | 38GB (Q8_0) | Good |
| Qwen3-Coder-30B | 3B (of 30B) | 70.6% | 128K | 20GB | Good |
| Qwen3-Coder-Next | 3B (of 80B) | 70.6% | 128K | 52GB | Good |
| MiniMax M2.5 | 10B (of 230B) | 80.2% | 1M | 76GB (5bit) | Excellent |
| Devstral Small 2 | 24B | 72.2% | 128K | 24GB (Q8_0) | Moderate |
| RANO agents (x21) | 0.6B | Domain-specific | 4K | 484MB each | Good |

## Active Subscriptions

| Subscription | Cost | Provider | CCR Role | Why |
|---|---|---|---|---|
| Claude Pro Max | $100/mo | Anthropic | think | Opus 4.6, complex reasoning, 1M ctx |
| Z.ai yearly | yearly | Z.ai | background | GLM-4.7 fast for subagent/quick tasks |
| MiniMax yearly | yearly | MiniMax | longContext | M2.5, 1M ctx, 80.2% SWE-Bench |
| Google AI Plus | monthly | Google | webSearch | Gemini 2.0 Flash, native web grounding |
| ChatGPT Plus | $20/mo | OpenAI | (no CCR) | IDE use only |
| HuggingFace Pro | monthly | HF | (no CCR) | Training jobs, inference API, Spaces |
| Local (Ollama) | $0 | Self-host | default | GLM-4.7-Flash for standard coding |

## Claude Code Router (CCR) Routing

| Category | Provider,Model | Rationale |
|---|---|---|
| default | llama-swap,glm-4.7-flash | Free, fast, good enough |
| background | llama-swap,glm-4.7-flash | Subagents, quick tasks |
| think | llama-swap,qwen3-coder-next | Best local reasoning |
| longContext | llama-swap,glm-4.7-flash | 128K local context |
| longContextThreshold | 60000 (chars) | Trigger longContext routing |
| webSearch | gemini,gemini-2.0-flash | Native web grounding |

## Cloud Fallback Chain

When local models are unavailable or insufficient, requests escalate:

| Priority | Provider | Trigger | Notes |
|---|---|---|---|
| 1 | Local (llama-swap) | Default | Free, all standard tasks |
| 2 | Z.ai (GLM-4.7) | Local down or slow | Yearly sub, fast fallback |
| 3 | MiniMax (M2.5) | >128K context needed | 1M context, yearly sub |
| 4 | Gemini (2.0 Flash) | Web search required | Native grounding, monthly sub |
| 5 | Anthropic (Opus 4.6) | Complex reasoning | Pro Max, highest capability |
