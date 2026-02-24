#!/usr/bin/env bash
# verify-backends.sh - Verify all inference backends are installed
set -euo pipefail

info()  { printf "\033[1;34m[backends]\033[0m %s\n" "$1"; }
ok()    { printf "\033[1;32m[backends]\033[0m %s\n" "$1"; }
warn()  { printf "\033[1;33m[backends]\033[0m %s\n" "$1"; }

echo ""
info "Verifying inference backend stack..."
echo ""

FAILURES=0

# Check each backend
backends=(
    "ollama|Ollama|ollama --version"
    "llama-cli|llama.cpp|llama-cli --version"
    "llama-swap|llama-swap|llama-swap --version"
    "lms|LM Studio|lms --version"
    "gollama|Gollama|gollama -v"
)

for entry in "${backends[@]}"; do
    IFS='|' read -r cmd name version <<< "$entry"

    if command -v "$cmd" &>/dev/null; then
        VER=$(eval "$version" 2>&1 | head -1 || echo "installed")
        ok "  $name: $VER"
    else
        warn "  $name: NOT INSTALLED"
        FAILURES=$((FAILURES + 1))
    fi
done

# Check Python backends
echo ""
info "Python packages:"

if python3 -c "import mlx_lm" 2>/dev/null; then
    ok "  MLX: installed"
else
    warn "  MLX: NOT INSTALLED (optional, install with 'uv pip install mlx-lm')"
fi

# Summary
echo ""
if [ "$FAILURES" -eq 0 ]; then
    ok "All inference backends verified ✓"
else
    warn "$FAILURES backend(s) missing - see BACKEND-INSTALLATION.md for setup"
fi

echo ""
