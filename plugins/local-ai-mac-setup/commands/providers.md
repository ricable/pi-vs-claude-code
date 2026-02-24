---
description: "Add or manage cc-mirror provider variants - create new Claude Code instances backed by any AI provider"
---

# Provider Management

Add, update, or remove cc-mirror provider variants.

## Available Providers

| Provider | Command | Key Required |
|----------|---------|-------------|
| Mirror | `npx cc-mirror quick --provider mirror --name mclaude` | ANTHROPIC_API_KEY or OAuth |
| Z.ai | `npx cc-mirror quick --provider zai --api-key "$Z_AI_API_KEY"` | Z_AI_API_KEY |
| MiniMax | `npx cc-mirror quick --provider minimax --api-key "$MINIMAX_API_KEY"` | MINIMAX_API_KEY |
| Kimi | `npx cc-mirror quick --provider kimi --api-key "$KIMI_API_KEY"` | KIMI_API_KEY |
| OpenRouter | `npx cc-mirror quick --provider openrouter --api-key "$OPENROUTER_API_KEY"` | OPENROUTER_API_KEY |
| Ollama | `npx cc-mirror quick --provider ollama --api-key "ollama"` | None (local) |
| CCRouter | `npx cc-mirror quick --provider ccrouter --name local` | None (local) |
| Custom | `npx cc-mirror quick --provider custom --base-url URL` | Varies |

## $ARGUMENTS Usage

- `add <provider>`: Create a new variant for the specified provider
- `list`: Show all configured variants
- `update <name>`: Update a specific variant
- `remove <name>`: Remove a variant
- `doctor`: Run health diagnostics

Guide the user through API key setup if they don't have one.
