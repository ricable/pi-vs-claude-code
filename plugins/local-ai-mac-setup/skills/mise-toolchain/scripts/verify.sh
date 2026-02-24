#!/usr/bin/env bash
# verify.sh - Verify mise installation and tool availability
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

info()  { printf "\033[1;34m[mise]\033[0m %s\n" "$1"; }
ok()    { printf "\033[1;32m[mise]\033[0m %s\n" "$1"; }
warn()  { printf "\033[1;33m[mise]\033[0m %s\n" "$1"; }
err()   { printf "\033[1;31m[mise]\033[0m %s\n" "$1" >&2; }

# Check mise installation
if ! command -v mise &>/dev/null; then
    err "mise not installed or not in PATH"
    err "Run: $SCRIPT_DIR/bootstrap.sh"
    exit 1
fi

ok "mise: $(mise --version)"

# Verify tool categories
info "Verifying tool categories..."

# Languages
info "Languages:"
for tool in node python3 go rustc; do
    if command -v "$tool" &>/dev/null; then
        ok "  $tool: $(command -v $tool | xargs basename)"
    else
        warn "  $tool: NOT FOUND"
    fi
done

# System CLI
info "System CLI:"
for tool in bat jq just rg fd; do
    if command -v "$tool" &>/dev/null; then
        ok "  $tool: available"
    else
        warn "  $tool: NOT FOUND"
    fi
done

# AI tools
info "AI Ecosystem:"
for tool in ollama llama-cli gollama; do
    if command -v "$tool" &>/dev/null; then
        ok "  $tool: available"
    else
        warn "  $tool: NOT FOUND (may not be installed yet)"
    fi
done

# Claude ecosystem
info "Claude Ecosystem:"
if npx -y @claude-flow/cli@latest --version &>/dev/null; then
    ok "  @claude-flow/cli: available"
else
    warn "  @claude-flow/cli: NOT FOUND"
fi

# Config file
if [ -f "$HOME/.config/mise/config.toml" ]; then
    ok "Config file: $HOME/.config/mise/config.toml"
else
    warn "Config file: NOT FOUND at $HOME/.config/mise/config.toml"
fi

# List all installed tools
info "All installed tools:"
if command -v mise &>/dev/null; then
    mise ls 2>/dev/null || warn "Could not list tools"
fi

echo ""
ok "Verification complete"
