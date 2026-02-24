---
description: "Check the health of all AI services, models, and cc-mirror variants"
---

# Stack Status Check

Run a comprehensive health check of the AI stack.

Execute this health check:

```bash
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
curl -sf http://localhost:11434/api/tags > /dev/null 2>&1 && echo "Ollama:     UP (:11434)" || echo "Ollama:     DOWN"
curl -sf http://localhost:9090/health > /dev/null 2>&1 && echo "llama-swap: UP (:9090)" || echo "llama-swap: DOWN"
curl -sf http://localhost:3456/ > /dev/null 2>&1 && echo "CCR:        UP (:3456)" || echo "CCR:        DOWN"
curl -sf http://localhost:1234/v1/models > /dev/null 2>&1 && echo "LM Studio:  UP (:1234)" || echo "LM Studio:  DOWN"
echo ""
echo "=== Models ==="
OLLAMA_COUNT=$(curl -sf http://localhost:11434/api/tags 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('models',[])))" 2>/dev/null || echo "?")
SWAP_COUNT=$(curl -sf http://localhost:9090/v1/models 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))" 2>/dev/null || echo "?")
RUNNING=$(curl -sf http://localhost:9090/running 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else len(d.get('models',[])))" 2>/dev/null || echo "?")
echo "Ollama models:     $OLLAMA_COUNT"
echo "llama-swap models: $SWAP_COUNT"
echo "Running now:       $RUNNING"
echo ""
echo "=== cc-mirror Variants ==="
npx cc-mirror list 2>/dev/null || echo "(none configured)"
echo ""
echo "=== Disk Usage ==="
du -sh ~/AI/models/ 2>/dev/null || echo "~/AI/models/ not found"
du -sh ~/.ollama/models/ 2>/dev/null || echo "~/.ollama/models/ not found"
```

Report results and flag any issues found.
