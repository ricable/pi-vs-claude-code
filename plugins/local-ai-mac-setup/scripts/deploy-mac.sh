#!/usr/bin/env bash
# deploy-mac.sh - Full Mac AI development environment automation
# Usage: ./plugins/local-ai-mac-setup/scripts/deploy-mac.sh [--full|--local-only|--skip-mesh|--cloud]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# --- Parse arguments ---
MODE="${1:---full}"
SKIP_MESH=false
SKIP_CLOUD=false
SKIP_LOCAL=false

case "$MODE" in
    --full)        ;;
    --local-only)  SKIP_MESH=true; SKIP_CLOUD=true ;;
    --skip-mesh)   SKIP_MESH=true ;;
    --cloud)       SKIP_LOCAL=true ;;
    -h|--help)
        echo "Usage: $0 [--full|--local-only|--skip-mesh|--cloud]"
        echo "  --full        Install everything (default)"
        echo "  --local-only  Skip mesh networking and cloud providers"
        echo "  --skip-mesh   Skip Headscale/Tailscale mesh setup"
        echo "  --cloud       Cloud providers only (skip local inference)"
        exit 0
        ;;
    *)
        echo "Unknown option: $MODE (use --help)" >&2
        exit 1
        ;;
esac

info()  { printf "\n\033[1;34m==> %s\033[0m\n" "$1"; }
ok()    { printf "\033[1;32m  [ok]\033[0m %s\n" "$1"; }
warn()  { printf "\033[1;33m  [warn]\033[0m %s\n" "$1"; }
skip()  { printf "\033[0;90m  [skip]\033[0m %s\n" "$1"; }
err()   { printf "\033[1;31m  [err]\033[0m %s\n" "$1" >&2; }

# ============================================================
# Step 1: Mise toolchain
# ============================================================
info "Step 1: Mise toolchain manager"
if [ -x "$SCRIPT_DIR/mise-bootstrap.sh" ]; then
    bash "$SCRIPT_DIR/mise-bootstrap.sh"
    ok "Mise bootstrap complete"
else
    err "mise-bootstrap.sh not found at $SCRIPT_DIR"
    exit 1
fi

# Ensure mise is on PATH for this script
export PATH="$HOME/.local/bin:$PATH"

# ============================================================
# Step 2: Local inference stack
# ============================================================
if [ "$SKIP_LOCAL" = false ]; then
    info "Step 2: Local inference stack"

    # LM Studio (cask, not managed by mise)
    if command -v lms &>/dev/null; then
        ok "LM Studio already installed"
    else
        if command -v brew &>/dev/null; then
            brew install --cask lm-studio
            ok "LM Studio installed"
        else
            warn "Homebrew not found -- install LM Studio manually from https://lmstudio.ai"
        fi
    fi

    # Verify inference tools from mise
    for tool in ollama llama-cli llama-swap gollama; do
        if command -v "$tool" &>/dev/null; then
            ok "$tool available"
        else
            warn "$tool not found -- run 'mise install' and restart shell"
        fi
    done
else
    skip "Local inference (--cloud mode)"
fi

# ============================================================
# Step 3: Shared model folder
# ============================================================
if [ "$SKIP_LOCAL" = false ]; then
    info "Step 3: Shared model folder"

    mkdir -p ~/AI/models/{lmstudio,ollama,mlx,gguf,shared}

    if [ -L "$HOME/.lmstudio/models" ]; then
        ok "LM Studio models symlink exists"
    else
        mkdir -p "$HOME/.lmstudio"
        if [ -d "$HOME/.lmstudio/models" ] && [ ! -L "$HOME/.lmstudio/models" ]; then
            warn "~/.lmstudio/models is a directory, not a symlink -- move contents to ~/AI/models/lmstudio first"
        else
            ln -sf ~/AI/models/lmstudio "$HOME/.lmstudio/models"
            ok "Created symlink: ~/.lmstudio/models -> ~/AI/models/lmstudio"
        fi
    fi

    if [ -L "$HOME/models" ]; then
        ok "~/models convenience symlink exists"
    else
        ln -sf ~/AI/models "$HOME/models" 2>/dev/null || true
        ok "Created convenience symlink: ~/models -> ~/AI/models"
    fi
else
    skip "Model folder (--cloud mode)"
fi

# ============================================================
# Step 4: cc-mirror variants
# ============================================================
info "Step 4: cc-mirror variants"

if ! command -v npx &>/dev/null; then
    err "npx not found -- ensure Node.js is installed via mise"
    exit 1
fi

# Mirror (Anthropic passthrough)
if [ -d "$HOME/.claude-variants/mclaude" ]; then
    ok "cc-mirror: mclaude already exists"
else
    npx cc-mirror quick --provider mirror --name mclaude 2>/dev/null && ok "cc-mirror: mclaude created" || warn "cc-mirror: mclaude failed (check cc-mirror installation)"
fi

# Z.ai
if [ -n "${Z_AI_API_KEY:-}" ]; then
    if [ -d "$HOME/.claude-variants/zai" ]; then
        ok "cc-mirror: zai already exists"
    else
        npx cc-mirror quick --provider zai --api-key "$Z_AI_API_KEY" && ok "cc-mirror: zai created" || warn "cc-mirror: zai failed"
    fi
else
    skip "cc-mirror: zai (Z_AI_API_KEY not set)"
fi

# MiniMax
if [ -n "${MINIMAX_API_KEY:-}" ]; then
    if [ -d "$HOME/.claude-variants/minimax" ]; then
        ok "cc-mirror: minimax already exists"
    else
        npx cc-mirror quick --provider minimax --api-key "$MINIMAX_API_KEY" && ok "cc-mirror: minimax created" || warn "cc-mirror: minimax failed"
    fi
else
    skip "cc-mirror: minimax (MINIMAX_API_KEY not set)"
fi

# Gemini via OpenRouter
if [ -n "${OPENROUTER_API_KEY:-}" ]; then
    if [ -d "$HOME/.claude-variants/gemini" ]; then
        ok "cc-mirror: gemini already exists"
    else
        npx cc-mirror quick --provider openrouter --api-key "$OPENROUTER_API_KEY" --name gemini \
            --model-sonnet "google/gemini-2.0-flash-001" --model-haiku "google/gemini-2.0-flash-001" \
            && ok "cc-mirror: gemini created" || warn "cc-mirror: gemini failed"
    fi
else
    skip "cc-mirror: gemini (OPENROUTER_API_KEY not set)"
fi

# Local CCRouter
if [ -d "$HOME/.claude-variants/local" ]; then
    ok "cc-mirror: local already exists"
else
    npx cc-mirror quick --provider ccrouter --name local 2>/dev/null && ok "cc-mirror: local created" || warn "cc-mirror: local failed"
fi

# Ollama local
if [ -d "$HOME/.claude-variants/ollama-local" ]; then
    ok "cc-mirror: ollama-local already exists"
else
    npx cc-mirror quick --provider ollama --api-key "ollama" --name ollama-local 2>/dev/null && ok "cc-mirror: ollama-local created" || warn "cc-mirror: ollama-local failed"
fi

# ============================================================
# Step 5: Claude Code Router (CCR)
# ============================================================
info "Step 5: Claude Code Router"

if command -v ccr &>/dev/null; then
    ok "claude-code-router already installed"
else
    npm install -g @musistudio/claude-code-router 2>/dev/null && ok "claude-code-router installed" || warn "claude-code-router install failed"
fi

# Deploy default config if missing
CCR_CONFIG="$HOME/.claude-code-router/config.json"
if [ -f "$CCR_CONFIG" ]; then
    ok "CCR config exists at $CCR_CONFIG"
else
    mkdir -p "$(dirname "$CCR_CONFIG")"
    cat > "$CCR_CONFIG" <<'CCREOF'
{
  "port": 4080,
  "providers": {
    "anthropic": { "apiKey": "${ANTHROPIC_API_KEY}" },
    "ollama": { "baseUrl": "http://localhost:11434" },
    "llama-swap": { "baseUrl": "http://localhost:9090" }
  },
  "routing": {
    "default": "anthropic",
    "fallback": ["ollama", "llama-swap"]
  }
}
CCREOF
    ok "CCR default config created at $CCR_CONFIG"
fi

# ============================================================
# Step 6: HuggingFace auth
# ============================================================
info "Step 6: HuggingFace authentication"

if [ -f "$HOME/.cache/huggingface/token" ] || [ -n "${HF_TOKEN:-}" ]; then
    ok "HuggingFace token found"
else
    if command -v huggingface-cli &>/dev/null; then
        warn "No HF token found -- run 'huggingface-cli login' to authenticate"
    else
        warn "No HF token found -- set HF_TOKEN env var or install huggingface-cli"
    fi
fi

# ============================================================
# Step 7: Headscale mesh (optional)
# ============================================================
if [ "$SKIP_MESH" = false ]; then
    info "Step 7: Headscale mesh networking"

    if command -v headscale &>/dev/null; then
        ok "headscale available: $(headscale version 2>/dev/null || echo 'installed')"
    else
        warn "headscale not found -- run 'mise install' to get it via ubi backend"
    fi

    if command -v tailscale &>/dev/null; then
        ok "tailscale available"
    else
        warn "tailscale not found -- install via 'mise install' or Mac App Store"
    fi
else
    skip "Mesh networking (--skip-mesh or --local-only)"
fi

# ============================================================
# Step 8: Health check
# ============================================================
info "Step 8: Health check"

CHECKS_PASS=0
CHECKS_FAIL=0

check() {
    if eval "$2" &>/dev/null; then
        ok "$1"
        CHECKS_PASS=$((CHECKS_PASS + 1))
    else
        warn "$1 -- not available"
        CHECKS_FAIL=$((CHECKS_FAIL + 1))
    fi
}

check "mise"           "command -v mise"
check "node"           "command -v node"
check "python3"        "command -v python3"
check "jq"             "command -v jq"
check "just"           "command -v just"

if [ "$SKIP_LOCAL" = false ]; then
    check "ollama"     "command -v ollama"
    check "llama-cli"  "command -v llama-cli"
    check "llama-swap" "command -v llama-swap"
    check "gollama"    "command -v gollama"
    check "lms"        "command -v lms"
fi

check "ccr"            "command -v ccr"
check "cc-mirror"      "npx cc-mirror --version"

echo ""
info "Summary"
ok "$CHECKS_PASS checks passed"
if [ "$CHECKS_FAIL" -gt 0 ]; then
    warn "$CHECKS_FAIL checks failed -- review warnings above"
fi

echo ""
ok "Deploy complete (mode: $MODE)"
echo "  Next steps:"
echo "    1. Restart your shell: source ~/.zshrc"
echo "    2. Start inference:    ollama serve && llama-swap --config config/llama-swap.yaml --listen 0.0.0.0:9090"
echo "    3. Start CCR:          ccr start"
echo "    4. Verify:             curl -s http://localhost:9090/health"
