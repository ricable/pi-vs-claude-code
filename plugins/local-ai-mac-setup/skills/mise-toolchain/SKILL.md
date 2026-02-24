---
name: mise-toolchain
description: "Install and configure mise (mise-en-place) as the single tool version manager for the entire AI development stack: languages, CLI tools, inference backends, Claude ecosystem, and agent frameworks. Use when setting up a new Mac from scratch, adding mise to an existing setup, or managing project-level tool overrides."
---

# Mise Toolchain Manager

Mise replaces brew, nvm, pyenv, asdf, and direnv with a single Rust-based tool manager. One config file controls every tool version across all projects.

## Install Mise

```bash
# Install
curl https://mise.run | sh

# Activate in zsh (add to ~/.zshrc)
eval "$(~/.local/bin/mise activate zsh)"

# Reload shell
source ~/.zshrc

# Verify
mise --version
```

Alternative shells:

```bash
# Bash (~/.bashrc)
eval "$(~/.local/bin/mise activate bash)"

# Fish (~/.config/fish/config.fish)
~/.local/bin/mise activate fish | source
```

## Deploy Global Config

The global config at `~/.config/mise/config.toml` manages every tool. Deploy it from the repo:

```bash
# Back up existing config, then copy
mkdir -p ~/.config/mise
[ -f ~/.config/mise/config.toml ] && cp ~/.config/mise/config.toml ~/.config/mise/config.toml.bak
cp docs/setup/config.toml ~/.config/mise/config.toml

# Install all tools
mise install

# Verify
mise ls
```

Or use the bundled **bootstrap script** (idempotent, safe to re-run):

```bash
./plugins/local-ai-mac-setup/skills/mise-toolchain/scripts/bootstrap.sh
```

After running the bootstrap script, restart your shell and verify installation:

```bash
./plugins/local-ai-mac-setup/skills/mise-toolchain/scripts/verify.sh
```

## Tool Categories

The global config manages tools across these categories:

| Category | Backend | Tools |
|----------|---------|-------|
| Languages | `core` | `go`, `node@22`, `python@3.14`, `rust` |
| System CLI | `aqua` | `bat`, `fzf`, `jq`, `just`, `starship`, `ripgrep`, `fd`, `watchexec`, `direnv`, `git-lfs`, `uv` |
| System CLI | `cargo`/`asdf` | `eza`, `cmake`, `make`, `sqlite` |
| Build Tools | `npm` | `bun`, `pnpm`, `tsx`, `typescript` |
| AI Assistants | `aqua`/`npm` | `opencode`, `codex`, `cline`, `gemini-cli` |
| Claude Ecosystem | `npm` | `@claude-flow/cli`, `claude-flow`, `claude-code-router`, `claude-agent-sdk`, `cc-mirror` |
| RuVector | `npm` | `ruvector`, `@ruvector/cli`, `ruvllm`, `sona`, `raft`, `gnn`, + 10 more |
| Agent Frameworks | `npm` | `zeroclaw`, `agentic-qe`, `agentic-flow`, `goalie`, `zeroclaw`, `clawdhub` |
| Local AI | `aqua`/`github`/`ubi` | `ollama`, `llama.cpp`, `llama-swap`, `gollama` |
| Python ML | `pipx` | `mlx-lm`, `dspy`, `sentence-transformers` |
| Networking | `ubi` | `headscale`, `tailscale` |

## Project-Level Overrides

Create a `mise.toml` in any project root to pin different tool versions:

```toml
[tools]
node = "20"
python = "3.12"

[env]
NODE_ENV = "development"

[env._.python.venv]
path = ".venv"
create = true
```

Mise auto-switches tools when you `cd` into the project directory.

```bash
# Add a tool to current project
mise use node@20 python@3.12

# Pin exact version
mise use --pin node@20.11.0

# Install tools from mise.toml
mise install

# Trust the config (first time only)
mise trust
```

## Python Virtual Environment Pattern

Mise can auto-create and activate venvs per project:

```toml
# In project mise.toml
[tools]
python = "3.12"

[env._.python.venv]
path = ".venv"
create = true
```

On `cd` into the project, mise activates the venv automatically. Works with `uv` for fast package installs:

```bash
mise use python@3.12
uv pip install -r requirements.txt
```

## Common Commands

```bash
# Tool management
mise ls                    # List all installed tools
mise ls --current          # Active versions only
mise outdated              # Check for updates
mise upgrade               # Upgrade all tools
mise prune                 # Remove unused versions
mise use --global <tool>   # Add a global tool

# Environment
mise set MY_VAR=value      # Set env var in mise.toml
mise unset MY_VAR          # Remove env var

# Running
mise run <task>            # Run a task from mise.toml
mise exec -- <cmd>         # Run command in mise environment
mise watch                 # Watch files and re-run tasks

# Maintenance
mise doctor                # Diagnose issues
mise self-update           # Update mise itself
mise trust                 # Trust current config
```

## Verify Installation

After setup, confirm all tool categories are working:

```bash
# Core languages
node --version && python3 --version && go version && rustc --version

# System tools
bat --version && jq --version && just --version && rg --version

# AI tools
ollama --version && llama-cli --version && gollama -v

# Claude ecosystem
npx claude-flow --version && npx cc-mirror --version
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `mise: command not found` | Add `eval "$(~/.local/bin/mise activate zsh)"` to `~/.zshrc` and restart shell |
| Tool install fails | `mise install -v` for verbose output; check `mise doctor` |
| Wrong version active | Check for project-level `mise.toml` overriding global; run `mise ls --current` |
| Slow first install | Normal for compiled tools (Node, Rust). Subsequent installs use cache |
| Conflicts with nvm/pyenv | Remove old manager activation from shell rc; mise replaces them |
| `cargo:eza` fails | Requires Rust toolchain; run `mise install rust` first |
| Python venv not activating | Ensure `[env._.python.venv]` section exists in `mise.toml` |

## Bundled Resources

- **[CONFIG-GUIDE.md](references/CONFIG-GUIDE.md)** — Comprehensive configuration guide with tool categories, project-level overrides, and troubleshooting
- **[bootstrap.sh](scripts/bootstrap.sh)** — Idempotent installation script (install mise, shell activation, deploy global config, install tools)
- **[verify.sh](scripts/verify.sh)** — Verification script to check mise installation and tool availability

## References

- **mise documentation**: https://mise.jdx.dev
- **mise repository**: https://github.com/jdx/mise
- **Global config in repo**: `docs/setup/config.toml`
