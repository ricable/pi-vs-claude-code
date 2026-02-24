---
description: "Run the full guided Mac AI setup wizard - installs tools, configures providers, and verifies the stack"
---

# Full Setup Wizard

Guide through the complete Mac AI development environment setup.

## Steps

0. Install mise toolchain manager: `./plugins/local-ai-mac-setup/scripts/mise-bootstrap.sh` (installs mise, deploys global config.toml, installs all tools)
1. Verify tools via `mise ls` (languages, CLI, AI assistants, inference backends, Claude ecosystem all managed by mise)
2. Install inference stack extras: `brew install --cask lm-studio` (LM Studio is the only tool that still requires a cask install)
3. Create shared model folder: `mkdir -p ~/AI/models/{lmstudio,ollama,mlx,gguf,shared} && ln -sf ~/AI/models/lmstudio ~/.lmstudio/models`
4. Configure Gollama and Ollama environment variables
5. Start Ollama: `ollama serve`
6. Generate llama-swap config: `python3 scripts/generate-llama-swap-config.py`
7. Start llama-swap: `llama-swap --config config/llama-swap.yaml --listen 0.0.0.0:9090`
8. Install claude-code-router: `npm install -g @musistudio/claude-code-router`
9. Configure CCR at `~/.claude-code-router/config.json`
10. Start CCR: `ccr start`
11. Create cc-mirror variants for desired providers
12. Run health check to verify everything works

Ask user which providers they want (Mirror, Z.ai, MiniMax, Kimi, OpenRouter, local CCR) and guide through API key setup for each.

When done, run the health check script at `scripts/check-stack.sh` to verify.

$ARGUMENTS contains optional flags like "local-only" (skip cloud providers) or "full" (all providers).
