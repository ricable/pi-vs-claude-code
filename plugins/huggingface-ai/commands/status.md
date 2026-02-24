---
name: status
description: Check HuggingFace ecosystem health including authentication, running jobs, TrackIO projects, cache usage, and token validation.
disable-model-invocation: true
---

# status

Display HuggingFace ecosystem status.

## Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `--verbose` | No | `false` | Show extended details for each check |

## Workflow

1. **Auth check**: `hf auth whoami` -- verify logged in user and token type
2. **Running jobs**: `hf jobs ps` -- list active/recent jobs with status
3. **TrackIO projects**: Check for active tracking spaces and recent experiments
4. **Cache stats**: `hf cache ls` -- total cached models/datasets and disk usage
5. **Token validation**: Verify HF_TOKEN env var is set and has write permissions
6. **Summary table**: Display pass/fail status for each component

## Output

```
HuggingFace Ecosystem Status
=============================
Auth          PASS  username (Pro account)
HF_TOKEN      PASS  Set (write access)
Running Jobs  INFO  2 active, 1 completed
TrackIO       PASS  3 tracked projects
Cache         INFO  12 repos, 45.2 GB
CLI Version   PASS  hf 0.28.1

Issues: None
```

## Example

```
/status
/status --verbose
```

## Checks Performed

| Check | Pass Condition | Fail Guidance |
|-------|---------------|---------------|
| Auth | `hf auth whoami` succeeds | Run `hf auth login` |
| HF_TOKEN | Env var set with write scope | `export HF_TOKEN=$(hf auth token)` |
| Jobs | CLI can list jobs | Verify Pro/Enterprise plan |
| TrackIO | `trackio` CLI accessible | `pip install trackio` |
| Cache | Cache directory accessible | Check `HF_HOME` path |
| CLI | `hf` command available | `uv tool install huggingface_hub[cli]` |

Alternatively, run the health check script: `bash plugins/huggingface-ai/scripts/hf-health.sh`

## See Also

- `references/authentication.md` for token configuration
- `scripts/hf-health.sh` for automated health checks
