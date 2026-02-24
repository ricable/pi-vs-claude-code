#!/usr/bin/env bash
# mise-bootstrap.sh - Idempotent mise installation and global config deployment
# Usage: ./plugins/local-ai-mac-setup/scripts/mise-bootstrap.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
CONFIG_SRC="$REPO_ROOT/docs/setup/config.toml"
CONFIG_DST="$HOME/.config/mise/config.toml"
SHELL_RC="$HOME/.zshrc"

info()  { printf "\033[1;34m[mise]\033[0m %s\n" "$1"; }
ok()    { printf "\033[1;32m[mise]\033[0m %s\n" "$1"; }
warn()  { printf "\033[1;33m[mise]\033[0m %s\n" "$1"; }
err()   { printf "\033[1;31m[mise]\033[0m %s\n" "$1" >&2; }

# --- Step 1: Install mise ---
if command -v mise &>/dev/null; then
    ok "mise already installed: $(mise --version)"
else
    info "Installing mise..."
    curl -fsSL https://mise.run | sh
    export PATH="$HOME/.local/bin:$PATH"
    ok "mise installed: $(mise --version)"
fi

# --- Step 2: Shell activation ---
if [ ! -f "$SHELL_RC" ]; then
    touch "$SHELL_RC"
fi

if grep -q 'mise activate' "$SHELL_RC"; then
    ok "Shell activation already in $SHELL_RC"
else
    info "Adding mise activation to $SHELL_RC..."
    printf '\n# mise - polyglot tool version manager\neval "$(~/.local/bin/mise activate zsh)"\n' >> "$SHELL_RC"
    ok "Added mise activation to $SHELL_RC"
fi

# --- Step 3: Deploy global config ---
if [ ! -f "$CONFIG_SRC" ]; then
    err "Source config not found: $CONFIG_SRC"
    err "Run from the rano-k8s-agents repo root"
    exit 1
fi

mkdir -p "$(dirname "$CONFIG_DST")"

if [ -f "$CONFIG_DST" ] && diff -q "$CONFIG_SRC" "$CONFIG_DST" &>/dev/null; then
    ok "Global config already up to date"
else
    if [ -f "$CONFIG_DST" ]; then
        cp "$CONFIG_DST" "${CONFIG_DST}.bak"
        warn "Backed up existing config to ${CONFIG_DST}.bak"
    fi
    cp "$CONFIG_SRC" "$CONFIG_DST"
    ok "Deployed global config to $CONFIG_DST"
fi

# --- Step 4: Install tools ---
info "Installing tools from global config (this may take a while on first run)..."
mise install --yes 2>&1 | tail -5
ok "Tool installation complete"

# --- Step 5: Verify key tools ---
FAILURES=0
for tool in node python3 go jq bat rg just; do
    if mise exec -- command -v "$tool" &>/dev/null; then
        ok "$tool: available"
    else
        warn "$tool: not found (may need shell restart)"
        FAILURES=$((FAILURES + 1))
    fi
done

echo ""
if [ "$FAILURES" -eq 0 ]; then
    ok "All key tools verified successfully"
else
    warn "$FAILURES tool(s) not immediately available -- restart your shell and run 'mise ls' to verify"
fi

ok "Done. Restart your shell or run: source $SHELL_RC"
