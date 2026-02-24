---
name: full-setup
description: "Complete Mac AI development environment setup orchestrator. Guides through all phases: local inference stack (Ollama, llama-swap, LM Studio, llama.cpp, MLX), cc-mirror multi-provider Claude Code variants, claude-code-router configuration, model management with Gollama, and optional Headscale mesh networking. Use when setting up a new Mac for AI development, when adding a new Mac to an existing cluster, or when verifying the complete stack is operational."
---

# Full Mac AI Setup

Orchestrate the complete local AI development environment on Apple Silicon.

## Hardware Requirements

| Machine | Chip | RAM | Max Model Weight (60% rule) |
|---------|------|-----|----------------------------|
| MacBook Pro | M3 Max | 128 GB | 76 GB |
| Mac Studio | M1/M2/M3/M4 Max | 64 GB | 38 GB |
| Mac Mini | M4 | 16-64 GB | 10-38 GB |

## Setup Phases

The setup is modular -- complete all phases or pick what you need:

1. **Inference Stack** → Install Ollama, llama-swap, LM Studio, llama.cpp, Gollama
2. **Model Management** → Download models, create shared folder, cross-backend linking
3. **cc-mirror Providers** → Create isolated Claude Code variants for each AI provider
4. **Claude Code Router** → Configure category-based routing to local/cloud models
5. **RANO Optimizer** → Integrate 21 fine-tuned domain expert agents (optional)
6. **Mesh Network** → Connect Macs via Headscale/Tailscale VPN (optional)

## Phase Decision Tree

**Setting up from scratch?**
→ Run all phases 1-4 in order. Add 5-6 if needed.

**Already have Ollama + models?**
→ Skip to phase 3 (cc-mirror) or phase 4 (claude-code-router).

**Just want multi-provider Claude Code?**
→ Phase 3 only. Run `npx cc-mirror quick --provider <provider> --api-key <key>`.

**Just want local model routing?**
→ Phase 4 only. Install claude-code-router, configure providers.

## Quick Health Check

Run this to verify the current state before deciding what to set up:

```bash
echo "=== Stack Health Check ==="
echo "Node.js: $(node --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "Ollama:  $(ollama --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "llama-swap: $(llama-swap --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "LM Studio: $(lms --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "llama.cpp: $(llama-cli --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "Gollama: $(gollama -v 2>/dev/null || echo 'NOT INSTALLED')"
echo "CCR: $(ccr --version 2>/dev/null || echo 'NOT INSTALLED')"
echo ""
echo "=== Services ==="
curl -sf http://localhost:11434/api/tags > /dev/null 2>&1 && echo "Ollama API: UP" || echo "Ollama API: DOWN"
curl -sf http://localhost:9090/health > /dev/null 2>&1 && echo "llama-swap: UP" || echo "llama-swap: DOWN"
curl -sf http://localhost:3456/ > /dev/null 2>&1 && echo "CCR: UP" || echo "CCR: DOWN"
curl -sf http://localhost:1234/v1/models > /dev/null 2>&1 && echo "LM Studio: UP" || echo "LM Studio: DOWN"
echo ""
echo "=== cc-mirror Variants ==="
npx cc-mirror list 2>/dev/null || echo "(none configured)"
```

## Environment Variables

Add to `~/.zshrc`:

```bash
# Inference
export OLLAMA_HOST=127.0.0.1:11434
export OLLAMA_MODELS=$HOME/.ollama/models
export OLLAMA_KEEP_ALIVE=5m

# RANO (optional)
export RANO_LM_BACKEND=llamaswap
export RANO_INTENT_CONCURRENCY=auto

# PATH for cc-mirror wrappers
export PATH="$HOME/.local/bin:$PATH"
```

## Detailed Phase Guides

Each phase has its own skill with step-by-step instructions:

- **Phase 1**: Use the `inference-stack` skill
- **Phase 2**: Use the `model-management` skill
- **Phase 3**: Use the `cc-mirror-providers` skill
- **Phase 4**: Use the `claude-code-router` skill
- **Phase 5**: Use the `rano-optimizer` skill
- **Phase 6**: Use the `mesh-network` skill

## Verification Checklist

After setup, verify:

- [ ] `curl http://localhost:11434/api/tags` returns models
- [ ] `curl http://localhost:9090/v1/models` returns llama-swap models
- [ ] `ccr status` shows running
- [ ] `npx cc-mirror list` shows configured variants
- [ ] `mclaude --version` works (or whichever variant)
- [ ] `gollama -l` lists models
- [ ] Model count matches expectations

## Reference Documentation

For detailed information on specific topics, see:

- **Provider comparison**: See `references/provider-matrix.md`
- **Model selection**: See `references/model-matrix.md`
- **CCR config templates**: See `references/ccr-configs.md`
- **Troubleshooting**: See `references/troubleshooting.md`

## Bundled Resources

- **[ORCHESTRATION-GUIDE.md](references/ORCHESTRATION-GUIDE.md)** — Complete multi-phase setup with phase dependencies, workflow options, checkpoints, rollback, and verification steps
- **full-setup orchestrator**: `/full-setup:run` for end-to-end automation
- **Phase commands**: `/full-setup:phase 1-5` for step-by-step setup

## Quick Setup Matrix

| Duration | Phases | Use Case |
|----------|--------|----------|
| 30 min | 1-2 | Local inference development |
| 1-2 hrs | 1-3 | Full Claude Code + local |
| 2-3 hrs | 1-4 | Add RANO optimizer |
| 3-4 hrs | 1-5 | Full stack + distributed mesh |

See **ORCHESTRATION-GUIDE.md** for detailed workflow, dependencies, and troubleshooting.
