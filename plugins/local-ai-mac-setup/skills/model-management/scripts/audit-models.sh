#!/usr/bin/env bash
# audit-models.sh - Complete model inventory audit across all backends
set -euo pipefail

info()  { printf "\033[1;34m[models]\033[0m %s\n" "$1"; }
ok()    { printf "\033[1;32m[models]\033[0m %s\n" "$1"; }
warn()  { printf "\033[1;33m[models]\033[0m %s\n" "$1"; }

echo ""
info "Auditing model inventory across all backends..."
echo ""

# LM Studio inventory
info "LM Studio models:"
if [ -d "$HOME/.lmstudio/models" ]; then
    TOTAL=$(find "$HOME/.lmstudio/models" -name "*.gguf" -o -name "*.safetensors" | wc -l)
    SIZE=$(du -sh "$HOME/.lmstudio/models" | awk '{print $1}')
    ok "  Found: $TOTAL models"
    ok "  Total size: $SIZE"

    # Breakdown by category
    GGUF=$(find "$HOME/.lmstudio/models" -name "*.gguf" 2>/dev/null | wc -l)
    MLX=$(find "$HOME/.lmstudio/models" -name "*.safetensors" 2>/dev/null | wc -l)
    echo "    • GGUF: $GGUF"
    echo "    • MLX (safetensors): $MLX"
else
    warn "  LM Studio directory not found"
fi

echo ""
info "Ollama models:"
if command -v ollama &>/dev/null; then
    COUNT=$(ollama list 2>/dev/null | tail -n +2 | wc -l)
    if [ "$COUNT" -gt 0 ]; then
        ok "  Models: $COUNT"
        ollama list | tail -n +2 | while read -r name size digest; do
            echo "    • $name ($size)"
        done
    else
        warn "  No models in Ollama"
    fi
else
    warn "  Ollama not installed"
fi

echo ""
info "Memory budget analysis:"
TOTAL_RAM=$(sysctl hw.memsize 2>/dev/null | awk '{print $NF / 1024 / 1024 / 1024}' | xargs printf "%.0f")
MAX_MODEL=$((TOTAL_RAM * 60 / 100))
ok "  Total RAM: ${TOTAL_RAM}GB"
ok "  Max model (60% rule): ${MAX_MODEL}GB"

# Check what fits
if command -v gollama &>/dev/null; then
    echo ""
    info "Fitting analysis (Q8_0 quantization):"
    gollama -fits "$MAX_MODEL" -quant Q8_0 2>/dev/null | head -10 || warn "  gollama -fits failed"
fi

echo ""
info "Disk space by category:"
if [ -d "$HOME/.lmstudio/models" ]; then
    for dir in "$HOME/.lmstudio/models"/*/; do
        if [ -d "$dir" ]; then
            SIZE=$(du -sh "$dir" | awk '{print $1}')
            NAME=$(basename "$dir")
            printf "  %-25s %s\n" "$NAME:" "$SIZE"
        fi
    done
fi

echo ""
info "Symlink integrity:"
BROKEN=0
if [ -d "$HOME/.lmstudio/models" ]; then
    BROKEN=$(find "$HOME/.lmstudio/models" -type l ! -exec test -e {} \; -print 2>/dev/null | wc -l)
fi

if [ "$BROKEN" -eq 0 ]; then
    ok "  No broken symlinks"
else
    warn "  Found $BROKEN broken symlink(s)"
    echo "    Run: ./scripts/link-models.sh --cleanup"
fi

echo ""
ok "Audit complete"
echo ""
