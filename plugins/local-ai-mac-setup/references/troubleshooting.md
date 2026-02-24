# Troubleshooting Guide

## Inference Stack

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| Ollama not responding | `curl http://localhost:11434/api/tags` | `ollama serve` (restart) |
| llama-swap won't start | `lsof -i :9090` | Kill process or change port |
| Model not found in llama-swap | `curl http://localhost:9090/v1/models` | Regenerate config: `python3 scripts/generate-llama-swap-config.py` |
| OOM during inference | `vm_stat \| grep "Pages active"` | Reduce concurrent models; check 60% rule |
| Slow first request | Normal | Cold start; pre-warm with dummy request |
| LM Studio missing models | `ls -la ~/.lmstudio/models` | Fix symlink: `ln -sf ~/AI/models/lmstudio ~/.lmstudio/models` |
| Broken symlinks | `find ~/.lmstudio/models -type l ! -exec test -e {} \; -print` | Re-link or remove |

## cc-mirror

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| Variant binary not found | `ls ~/.local/bin/` | Add `$HOME/.local/bin` to PATH |
| API key rejected | Check `~/.cc-mirror/<name>/config/settings.json` | Re-create with correct key |
| Team mode not working | Check `variant.json` | Recreate with `--enable-team-mode` |
| Update failed | `npx cc-mirror update <name> --verbose` | Check npm connectivity |
| Claude Code version mismatch | `<variant> --version` | `npx cc-mirror update <name> --claude-version latest` |

## claude-code-router

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| Port 3456 in use | `lsof -i :3456` | Kill or change port in config |
| Model routing wrong | `ccr logs` | Check Router section in config.json |
| Timeout errors | Large model loading | Increase `API_TIMEOUT_MS` |
| Tool-call failures | Model quality | Add `enhancetool` transformer; use Q6_K+ |
| Provider not responding | Check provider health | `curl <provider-url>/v1/models` |

## Network / Mesh

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| Can't reach remote Mac | `tailscale status` | Check both nodes connected |
| DNS not resolving | `nslookup host.headscale.local` | Check headscale DNS config |
| Pre-auth key expired | `headscale preauthkeys list` | Generate new key |
| Tailscale disconnects | Lid close | `sudo brew services start tailscale` |
