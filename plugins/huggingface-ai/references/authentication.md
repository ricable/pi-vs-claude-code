# HuggingFace Authentication

## Token Setup

### Interactive Login
```bash
hf auth login
# Follow prompts to enter token from https://huggingface.co/settings/tokens
```

### Non-Interactive Login
```bash
hf auth login --token $HF_TOKEN
# Or set environment variable directly
export HF_TOKEN="hf_..."
```

### Verify Authentication
```bash
hf auth whoami       # Show current user and token type
hf auth list         # List all stored tokens
hf auth switch       # Switch between multiple tokens
```

## Token Types and Scopes

| Token Type | Scope | Use Case |
|------------|-------|----------|
| **Read** | Read public/private repos | Download models, browse Hub |
| **Write** | Read + write to repos | Upload models, create repos, push results |
| **Fine-grained** | Custom per-repo permissions | CI/CD, automated workflows |

For training jobs, you **must** use a Write token.

## HF_TOKEN for Jobs (CRITICAL)

HuggingFace Jobs run in ephemeral containers. Without `HF_TOKEN`:
- Training results are **permanently lost** when the container stops
- Model cannot be pushed to Hub
- TrackIO cannot sync to your Space

### Setting HF_TOKEN for Jobs

**In job submission (required):**
```python
hf_jobs("uv", {
    "script": "...",
    "secrets": {"HF_TOKEN": "$HF_TOKEN"}  # Injects your token into the job
})
```

**Via CLI:**
```bash
hf jobs uv run --secrets HF_TOKEN "https://example.com/train.py"
```

The `$HF_TOKEN` syntax references the token stored by `hf auth login`. It does not read a shell variable -- the Jobs infrastructure resolves it server-side.

### Verification Before Training

```bash
# 1. Check you're logged in
hf auth whoami

# 2. Check token has write access
hf repo create test-delete-me --private
hf repo delete test-delete-me --yes

# 3. Check HF_TOKEN is set in shell (for local scripts)
echo $HF_TOKEN
```

## HF Pro Account Benefits

HuggingFace Pro ($9/month) unlocks:
- **HF Jobs**: Cloud GPU compute (required for training)
- **Inference API**: Higher rate limits
- **Private repos**: Unlimited private models/datasets
- **ZeroGPU Spaces**: Free GPU for Gradio apps
- **Early access**: New features and models

Jobs are not available on free-tier accounts.

## Multiple Token Management

```bash
# Add a second token
hf auth login --token hf_second_token

# List all tokens
hf auth list

# Switch active token
hf auth switch

# Logout
hf auth logout
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `401 Unauthorized` | Run `hf auth login`, check token scope |
| `403 Forbidden` | Token lacks write access; create new Write token |
| Job can't push to Hub | Add `secrets: {"HF_TOKEN": "$HF_TOKEN"}` to job config |
| `hf auth whoami` fails | Token expired; re-authenticate with `hf auth login` |
| Wrong user pushing | `hf auth switch` to correct account |
