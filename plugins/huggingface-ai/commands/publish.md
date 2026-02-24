---
name: publish
description: Upload models, datasets, papers, or Spaces to the HuggingFace Hub. Handles repo creation, file upload, model card generation, and PR workflows.
disable-model-invocation: true
---

# publish

Publish artifacts to HuggingFace Hub.

## Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `--type` | Yes | - | Artifact type: `model`, `dataset`, `paper`, `space` |
| `--source` | Yes | - | Local path or directory to upload |
| `--repo` | Yes | - | Target Hub repo (e.g., `username/my-model`) |
| `--private` | No | `false` | Create as private repository |
| `--create-pr` | No | `false` | Create a PR instead of direct push |
| `--message` | No | Auto-generated | Commit message |

## Workflow

1. **Verify auth**: Check `hf auth whoami` and token write permissions
2. **Create repo if needed**: `hf repo create` with correct `--repo-type`
3. **Upload files**: `hf upload` from source to repo
4. **Auto model card**: Generate README/model card with metadata (for models)
5. **Return URL**: Provide Hub URL to published artifact

## Examples

### Publish a model
```
/publish --type model --source ./output --repo username/my-model --message "v1.0 release"
```

### Publish a dataset
```
/publish --type dataset --source ./data --repo username/my-dataset --private
```

### Publish via PR
```
/publish --type model --source ./weights --repo org/shared-model --create-pr
```

### Publish a paper
```
/publish --type paper --source ./paper.md --repo username/my-research
```

## Type-Specific Behavior

| Type | Repo Type | Auto-Generated | Notes |
|------|-----------|----------------|-------|
| `model` | `model` | Model card with training metadata | Include config.json, tokenizer |
| `dataset` | `dataset` | Dataset card with schema info | Include data files + README |
| `paper` | `model` | Paper page with arXiv link | Use paper-publisher skill |
| `space` | `space` | app.py scaffold if missing | Specify --space-sdk (gradio/streamlit) |

Delegates to: `hugging-face-cli` and `hugging-face-paper-publisher` skills

## See Also

- `hugging-face-cli/SKILL.md` for full upload/repo commands
- `hugging-face-paper-publisher/SKILL.md` for paper workflows
- `references/authentication.md` for token setup
