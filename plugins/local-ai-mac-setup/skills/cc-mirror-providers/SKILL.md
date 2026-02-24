---
name: cc-mirror-providers
description: "Set up isolated Claude Code variants for multiple AI providers using cc-mirror. Supports Mirror (Anthropic), Z.ai (GLM-4.7/5), MiniMax (M2.5), Kimi (K2.5), OpenRouter (100+ models), Ollama (local), CCRouter (claude-code-router), Vercel, NanoGPT, and GatewayZ. Each variant gets its own config, sessions, MCP servers, and credentials. Use when setting up multi-provider Claude Code, creating new cc-mirror variants, or managing existing variants."
---

# cc-mirror Multi-Provider Setup

Create isolated Claude Code installations backed by different AI providers.

## Prerequisites

```bash
# Ensure ~/.local/bin is in PATH
grep -q '.local/bin' ~/.zshrc || echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify cc-mirror
npx cc-mirror --version
```

## Quick Setup Commands (All Providers)

### Mirror Claude (Direct Anthropic)

```bash
npx cc-mirror quick --provider mirror --name mclaude
```

- Auth: OAuth or `ANTHROPIC_API_KEY`
- Team mode: enabled by default
- Models: native Claude Sonnet 4.5, Opus 4.6, Haiku 4.5

### Z.ai (GLM Models)

```bash
npx cc-mirror quick --provider zai --api-key "$Z_AI_API_KEY"
```

- Endpoint: `https://api.zai.cc`
- Models: GLM-5, GLM-4.7, GLM-4.5-Air
- Pricing: Lite $3/mo, Pro $15/mo
- Get key: https://z.ai/manage-apikey/apikey-list

### MiniMax (M2.5)

```bash
npx cc-mirror quick --provider minimax --api-key "$MINIMAX_API_KEY"
```

- Endpoint: `https://api.minimaxi.chat`
- Models: MiniMax-M2.5 (80.2% SWE-Bench)
- Pricing: $100-500/yr coding plan
- Get key: https://platform.minimax.io/subscribe/coding-plan

### Kimi Code (K2.5)

```bash
npx cc-mirror quick --provider kimi --api-key "$KIMI_API_KEY"
```

- Models: K2.5 with Agent Swarm (100 parallel agents)
- Pricing: $0.99-39.99/mo
- Get key: https://kimi.com/code/console

### OpenRouter (100+ Models)

```bash
npx cc-mirror quick --provider openrouter --api-key "$OPENROUTER_API_KEY" \
  --name openr \
  --model-sonnet "anthropic/claude-sonnet-4-20250514" \
  --model-opus "anthropic/claude-opus-4-1-20250805" \
  --model-haiku "google/gemini-2.0-flash-001"
```

- Endpoint: `https://openrouter.ai/api/v1`
- Cross-provider mixing: route different roles to different providers
- Get key: https://openrouter.ai/keys

### Ollama (Direct Local)

```bash
npx cc-mirror quick --provider ollama --api-key "ollama" --name ollama-local
```

- Free, local inference
- Uses Ollama's Anthropic-compatible endpoint

### CCRouter (claude-code-router)

```bash
npx cc-mirror quick --provider ccrouter --name local
```

- Routes through claude-code-router at `http://localhost:3456`
- For custom port: `--base-url http://localhost:3457`

### Custom Provider

```bash
npx cc-mirror quick --provider custom --name llamaswap \
  --base-url http://localhost:9090 --api-key "not-needed"
```

## Model Mapping Flags

Override which models Claude Code uses internally:

```bash
--model-sonnet "model-id"    # Map Sonnet requests
--model-opus "model-id"      # Map Opus requests
--model-haiku "model-id"     # Map Haiku requests
```

## Enable Team Mode

Mirror variants have team mode by default. For others:

```bash
npx cc-mirror create --provider zai --name zai-team \
  --api-key "$Z_AI_API_KEY" --enable-team-mode
```

Team mode enables: TaskCreate, TaskGet, TaskUpdate, TaskList, SendMessage, TeamCreate.

## Variant Management

```bash
npx cc-mirror list               # List all variants
npx cc-mirror update [name]      # Update variant(s)
npx cc-mirror apply <name>       # Re-apply patches
npx cc-mirror remove <name>      # Delete variant
npx cc-mirror doctor             # Health check
npx cc-mirror tweak <name>       # Customize theme
```

## Variant Isolation

Each variant at `~/.cc-mirror/<name>/`:

```
~/.cc-mirror/<name>/
├── native/          # Claude Code npm install
├── config/          # CLAUDE_CONFIG_DIR (sessions, MCP, tasks)
├── tweakcc/         # Theme + prompt overlays
└── variant.json     # Metadata

~/.local/bin/<name>  # Wrapper binary
```

Wrapper sets: `CLAUDE_CONFIG_DIR`, `TWEAKCC_CONFIG_DIR`, provider API keys,
`CLAUDE_CODE_TEAM_NAME` (auto-scoped per git repo).

## Bundled Resources

- **[PROVIDER-SETUP.md](references/PROVIDER-SETUP.md)** — Provider-specific setup guides (Anthropic, Z.ai, MiniMax, Kimi, OpenRouter, Ollama, Vercel)
- **[create command](commands/create.md)** — Interactive `/cc-mirror:create` command for mirror initialization
- **Mirror management**: List, switch, verify, delete mirrors with cost tracking

## Launch

```bash
mclaude    # Mirror Claude
zai        # Z.ai GLM
minimax    # MiniMax M2.5
kimi       # Kimi K2.5
openr      # OpenRouter
local      # Local via CCR
```
