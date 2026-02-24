#!/usr/bin/env bash
# verify-stack.sh - Verify local inference stack installation
set -euo pipefail

info()  { printf "\033[1;34m[inference]\033[0m %s\n" "$1"; }
ok()    { printf "\033[1;32m[inference]\033[0m %s\n" "$1"; }
warn()  { printf "\033[1;33m[inference]\033[0m %s\n" "$1"; }
err()   { printf "\033[1;31m[inference]\033[0m %s\n" "$1" >&2; }

echo ""
info "Verifying local inference stack..."
echo ""

FAILURES=0

# Gollama
info "Gollama (audit & VRAM):"
if command -v gollama &>/dev/null; then
    ok "  installed: $(gollama -v)"
else
    warn "  NOT INSTALLED - needed for model auditing"
    FAILURES=$((FAILURES + 1))
fi

# LM Studio
info "LM Studio (download):"
if command -v lms &>/dev/null; then
    ok "  installed: $(lms status 2>/dev/null | head -1 || echo 'available')"
else
    warn "  NOT INSTALLED - download at https://lmstudio.ai/"
    FAILURES=$((FAILURES + 1))
fi

# Ollama
info "Ollama (background serving):"
if command -v ollama &>/dev/null; then
    ok "  installed: $(ollama --version)"
else
    warn "  NOT INSTALLED - download at https://ollama.com/"
    FAILURES=$((FAILURES + 1))
fi

# llama.cpp
info "llama.cpp (raw inference):"
if command -v llama-cli &>/dev/null; then
    ok "  installed: $(llama-cli --version 2>/dev/null | head -1 || echo 'available')"
else
    warn "  NOT INSTALLED - optional, install with 'brew install llama.cpp'"
fi

# MLX
info "MLX (Apple Metal optimization):"
if python3 -c "import mlx_lm" &>/dev/null 2>&1; then
    ok "  installed"
else
    warn "  NOT INSTALLED - optional, install with 'uv pip install mlx-lm'"
fi

# Model directories
echo ""
info "Model directories:"
if [ -d "$HOME/.lmstudio/models" ]; then
    COUNT=$(find "$HOME/.lmstudio/models" -maxdepth 2 -type d | wc -l)
    ok "  LM Studio: $HOME/.lmstudio/models ($COUNT dirs)"
else
    warn "  LM Studio: NOT FOUND - create with 'mkdir -p ~/.lmstudio/models'"
    FAILURES=$((FAILURES + 1))
fi

if [ -d "$HOME/.ollama/models" ]; then
    SIZE=$(du -sh "$HOME/.ollama/models" 2>/dev/null | awk '{print $1}')
    ok "  Ollama: $HOME/.ollama/models ($SIZE)"
else
    warn "  Ollama: NOT FOUND - will be created on first ollama run"
fi

# Gollama config
echo ""
info "Gollama config:"
if [ -f "$HOME/.config/gollama/config.json" ]; then
    ok "  found: $HOME/.config/gollama/config.json"
else
    warn "  NOT FOUND - will use defaults"
fi

# Storage structure
echo ""
info "Storage structure:"
if [ -d "$HOME/.lmstudio/models/lmstudio-community" ]; then
    COUNT=$(find "$HOME/.lmstudio/models/lmstudio-community" -name "*.gguf" 2>/dev/null | wc -l)
    ok "  GGUF models: $COUNT"
fi

if [ -d "$HOME/.lmstudio/models/mlx-community" ]; then
    COUNT=$(find "$HOME/.lmstudio/models/mlx-community" -type d 2>/dev/null | wc -l)
    ok "  MLX models: $COUNT"
fi

if [ -d "$HOME/.lmstudio/models/rano" ]; then
    COUNT=$(find "$HOME/.lmstudio/models/rano" -name "*.gguf" 2>/dev/null | wc -l)
    ok "  RANO agents: $COUNT"
fi

# Test ollama connectivity
echo ""
info "Service connectivity:"
if curl -s http://127.0.0.1:11434/api/tags &>/dev/null; then
    COUNT=$(ollama list 2>/dev/null | tail -n +2 | wc -l)
    ok "  Ollama running: $COUNT models loaded"
else
    warn "  Ollama not running - start with 'ollama serve'"
fi

# Memory budget check
echo ""
info "Memory budget (60% rule):"
TOTAL_RAM=$(sysctl hw.memsize | awk '{print $NF / 1024 / 1024 / 1024}' | xargs printf "%.0f")
MAX_MODEL=$((TOTAL_RAM * 60 / 100))
ok "  Total RAM: ${TOTAL_RAM}GB"
ok "  Max model weight: ${MAX_MODEL}GB (60% rule)"

echo ""
if [ "$FAILURES" -eq 0 ]; then
    ok "All critical components verified ✓"
else
    warn "$FAILURES component(s) need attention"
fi

echo ""
