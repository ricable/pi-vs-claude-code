#!/bin/bash
# Health check for the full AI stack

echo "=== Tool Versions ==="
echo "Node.js:    $(node --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "Ollama:     $(ollama --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "llama-swap: $(llama-swap --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "LM Studio:  $(lms --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "llama.cpp:  $(llama-cli --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "Gollama:    $(gollama -v 2>/dev/null || echo 'NOT INSTALLED')"
echo "CCR:        $(ccr --version 2>/dev/null || echo 'NOT INSTALLED')"
echo ""

echo "=== Service Health ==="
ISSUES=0

if curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "Ollama:     UP (:11434)"
else
    echo "Ollama:     DOWN"
    ISSUES=$((ISSUES + 1))
fi

if curl -sf http://localhost:9090/health > /dev/null 2>&1; then
    echo "llama-swap: UP (:9090)"
else
    echo "llama-swap: DOWN"
    ISSUES=$((ISSUES + 1))
fi

if curl -sf http://localhost:3456/ > /dev/null 2>&1; then
    echo "CCR:        UP (:3456)"
else
    echo "CCR:        DOWN (optional)"
fi

if curl -sf http://localhost:1234/v1/models > /dev/null 2>&1; then
    echo "LM Studio:  UP (:1234)"
else
    echo "LM Studio:  DOWN (optional)"
fi

echo ""
echo "=== Models ==="
OLLAMA_COUNT=$(curl -sf http://localhost:11434/api/tags 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('models',[])))" 2>/dev/null || echo "?")
SWAP_COUNT=$(curl -sf http://localhost:9090/v1/models 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))" 2>/dev/null || echo "?")
echo "Ollama models:     $OLLAMA_COUNT"
echo "llama-swap models: $SWAP_COUNT"

echo ""
echo "=== cc-mirror Variants ==="
npx cc-mirror list 2>/dev/null || echo "(none configured)"

echo ""
echo "=== Disk Usage ==="
du -sh ~/AI/models/ 2>/dev/null || echo "~/AI/models/ not found"

echo ""
if [ $ISSUES -gt 0 ]; then
    echo "RESULT: $ISSUES issue(s) found. Check services above."
    exit 1
else
    echo "RESULT: All core services operational."
    exit 0
fi
