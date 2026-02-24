# Mise Global Configuration Guide

The `~/.config/mise/config.toml` file is your single source of truth for all tool versions across your development environment.

## File Location & Installation

```bash
# Copy the provided config from the repo
mkdir -p ~/.config/mise
cp docs/setup/config.toml ~/.config/mise/config.toml

# Or use the bootstrap script
./plugins/local-ai-mac-setup/skills/mise-toolchain/scripts/bootstrap.sh
```

## Configuration Structure

The config file has these main sections:

### Settings
```toml
[settings]
jobs = 8                              # Parallel install jobs
experimental = true                   # Enable experimental features
```

### Tools
Each tool entry follows the pattern:
```toml
[tools]
go = "latest"                        # Core language
python = "3.14"                      # Pin specific version
"aqua:ripgrep" = "latest"            # Backend:package format
"npm:typescript" = "4.0"             # Package manager
```

## Tool Categories

### Languages & Runtimes
- `go`, `node`, `python`, `rust` — Core development languages

### System CLI Tools (aqua backend)
- `bat`, `fzf`, `jq`, `just`, `ripgrep`, `fd`, `watchexec`, `direnv`, `git-lfs`, `uv`

### Build Tools
- `bun`, `pnpm`, `tsx`, `typescript` (npm backend)
- `cmake`, `make`, `sqlite` (core/cargo backends)

### AI Coding Assistants
- `opencode`, `cline`, `gemini-cli`, `@openai/codex`

### Claude Code Ecosystem
- `@claude-flow/cli`, `claude-flow`, `claude-code-router`
- `@anthropic-ai/claude-agent-sdk`, `cc-mirror`

### RuVector Ecosystem
- Core: `ruvector`, `@ruvector/cli`, `@ruvector/core`, `@ruvector/wasm`
- LLM: `@ruvector/ruvllm`, `@ruvector/sona`, `@ruvector/attention`
- Database: `@ruvector/postgres-cli`

### Local AI
- `ollama`, `llama.cpp`, `llama-swap`, `gollama`

### Python ML
- `mlx-lm`, `dspy`, `sentence-transformers` (pipx backend)

### Networking
- `headscale`, `tailscale` (ubi backend)

## Project-Level Configuration

Create a `mise.toml` in your project root to override global versions:

```toml
[tools]
node = "20"              # Override global node version
python = "3.12"          # Override global python version

[env]
NODE_ENV = "development"
DATABASE_URL = "postgres://localhost/mydb"

[env._.python.venv]
path = ".venv"           # Auto-create virtual environment
create = true            # Create if missing
```

When you `cd` into the project, mise automatically:
1. Switches to the pinned tool versions
2. Activates the Python virtual environment
3. Sets environment variables

## Python Virtual Environments

Mise can auto-create and activate Python venvs per project:

```toml
# In project mise.toml
[tools]
python = "3.12"

[env._.python.venv]
path = ".venv"
create = true
```

On `cd`, mise activates the venv. Works seamlessly with `uv`:

```bash
cd project
uv pip install -r requirements.txt  # Uses the active venv
```

## Common Commands

```bash
# List & manage tools
mise ls                          # List all installed tools
mise ls --current                # Show active versions
mise outdated                    # Check for updates
mise upgrade                     # Update all tools
mise use python@3.12             # Add a tool globally
mise use --pin node@20.11.0      # Pin exact version

# Configuration
mise set MY_VAR=value            # Set env var
mise unset MY_VAR                # Remove env var
mise trust                        # Trust current mise.toml (first time only)

# Running
mise run <task>                  # Run a task from mise.toml
mise exec -- <command>           # Run command with mise environment
mise watch                       # Watch files and re-run tasks

# Maintenance
mise doctor                      # Diagnose issues
mise self-update                 # Update mise itself
mise prune                       # Remove unused versions
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `mise: command not found` | Run bootstrap script or add activation to shell rc |
| Tool install fails | Run `mise install -v` for verbose output |
| Wrong version active | Check for project-level `mise.toml` overriding global |
| Slow first install | Normal for compiled tools; subsequent installs use cache |
| Conflicts with nvm/pyenv | Remove old manager activation from shell rc |
| Python venv not activating | Ensure `[env._.python.venv]` in project `mise.toml` |

## Advanced Configuration

### Conditional Tool Installation

Only install tools for specific operating systems:

```toml
[tools]
ripgrep = { version = "latest", os = ["linux", "macos"] }
node = { version = "latest", os = ["macos"] }
```

### Postinstall Hooks

Run commands after tool installation:

```toml
[tools]
node = { version = "24", postinstall = "corepack enable" }
```

### Task Definitions

Define tasks in mise.toml:

```toml
[tasks.build]
description = "Build the project"
run = "npm run build"
depends = ["fmt", "lint"]

[tasks.fmt]
run = "prettier --write ."
```

## References

- **mise documentation**: https://mise.jdx.dev
- **GitHub repository**: https://github.com/jdx/mise
- **Global config file**: `docs/setup/config.toml` (in this repository)
- **Bootstrap script**: `plugins/local-ai-mac-setup/skills/mise-toolchain/scripts/bootstrap.sh`
- **Verify script**: `plugins/local-ai-mac-setup/skills/mise-toolchain/scripts/verify.sh`
