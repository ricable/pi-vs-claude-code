# Full Setup Orchestration Guide

Complete guide for setting up a multi-phase Mac AI development environment through the full-setup skill.

## Phases Overview

```
Phase 1: Foundation
  ├─ mise (tool manager)
  └─ Directory structure
       ↓
Phase 2: Local Inference
  ├─ Inference backends (Ollama, llama-swap, LM Studio, llama.cpp, MLX)
  ├─ Model management (Gollama, downloads, sharing)
  └─ Memory budgeting (60% rule)
       ↓
Phase 3: Claude Code Setup
  ├─ Claude Code config (CLAUDE.md, hooks, MCP)
  ├─ Claude Code Router (model routing)
  ├─ cc-mirror (multi-provider variants)
  └─ Permissions & settings
       ↓
Phase 4: RANO Optimizer
  ├─ Domain expert agents (21 fine-tuned)
  ├─ GEPA pipeline (52 intents)
  └─ Backend routing
       ↓
Phase 5: Optional - Mesh Networking
  ├─ Headscale (control plane)
  ├─ Tailscale (clients)
  └─ Remote inference sharing
```

## Setup Workflow

### Quick Start (30 minutes)

```bash
# 1. Foundation
/full-setup:phase 1

# 2. Local Inference (basic)
/full-setup:phase 2 --quick

# 3. Claude Code (minimal)
/full-setup:phase 3 --minimal

# Verify all phases
/full-setup:verify
```

### Standard Setup (1-2 hours)

```bash
# Run all phases interactively
/full-setup:run

# Or phase by phase
/full-setup:phase 1  # Foundation
/full-setup:phase 2  # Inference stack
/full-setup:phase 3  # Claude Code
/full-setup:phase 4  # RANO (optional, takes time)
```

### Advanced Setup (with mesh networking)

```bash
# All phases + mesh
/full-setup:run --include-mesh

# Or manually
/full-setup:phase 1-4
/full-setup:phase 5  # Headscale + Tailscale
```

## Phase 1: Foundation

Sets up the base layer: mise tool manager and directory structure.

**Duration:** 5-10 minutes

```bash
/full-setup:phase 1 [--skip-if-exists]
```

**What it does:**
- Installs mise (replaces brew, nvm, pyenv, asdf)
- Deploys global config (80+ tools)
- Activates mise in shell
- Creates project structure (src/, tests/, docs/, config/)

**Verification:**
```bash
mise --version
mise ls | head -10
```

**Key files:**
- Global config: `~/.config/mise/config.toml`
- Bootstrap: `mise-bootstrap.sh`
- Verify: `mise-verify.sh`

## Phase 2: Local Inference

Sets up the complete inference stack for running models locally.

**Duration:** 10-20 minutes (downloads vary)

```bash
/full-setup:phase 2 [--models-dir ~/AI/models] [--quick]
```

**Options:**
- `--quick` — Skip LM Studio, Gollama (fastest)
- `--models-dir` — Custom model location
- `--include-mlx` — Add MLX for maximum speed
- `--skip-lmstudio` — Already have it

**What it does:**
1. Install backends (Ollama, llama-swap, LM Studio, llama.cpp, Gollama, MLX)
2. Create model directories (lmstudio, ollama, mlx, rano, shared)
3. Configure Gollama
4. Download recommended models (if --with-models)
5. Verify all backends

**Verification:**
```bash
/full-setup:verify-inference
gollama -l
ollama list
lms ls
```

**Key files:**
- Backend setup: `inference-stack/SKILL.md`
- Model management: `model-management/SKILL.md`
- Reference: `local-inference/SKILL.md`

## Phase 3: Claude Code Setup

Configures Claude Code ecosystem (config, routing, mirrors).

**Duration:** 10-15 minutes

```bash
/full-setup:phase 3 [--scope project|user] [--providers local,cloud]
```

**Options:**
- `--scope project` — Project-specific (default)
- `--scope user` — User-global
- `--providers local` — Ollama only
- `--providers local,cloud` — Ollama + Gemini/OpenRouter

**What it does:**
1. Initialize CLAUDE.md (project or user)
2. Set up permissions & hooks
3. Configure Claude Code Router
4. Create cc-mirror variants
5. Register MCP servers

**Profiles:**
```bash
/full-setup:phase 3 --profile development    # Max access
/full-setup:phase 3 --profile production     # Strict security
/full-setup:phase 3 --profile research       # Cloud + local
```

**Verification:**
```bash
/full-setup:verify-claude-code
/claude-code-router:show-routes
/cc-mirror:list
```

**Key files:**
- Config: `claude-code-config/SKILL.md`
- Routing: `claude-code-router/SKILL.md`
- Mirrors: `cc-mirror-providers/SKILL.md`

## Phase 4: RANO Optimizer

Sets up RAN optimization pipeline with 52 intents and 21 domain agents.

**Duration:** 30 minutes (first download) + ongoing training

```bash
/full-setup:phase 4 [--download-models] [--fine-tune]
```

**Options:**
- `--download-models` — Download domain expert agents (21 × 484 MB)
- `--fine-tune` — Train agents for specific domains (90+ minutes)
- `--skip-enrichment` — Skip DSPy enrichment compilation

**What it does:**
1. Configure RANO backend routing (Ollama/LM Studio/llama-swap)
2. Download 21 fine-tuned domain agents
3. Set environment variables
4. Verify agent availability
5. Optionally compile enrichment pipeline

**Verification:**
```bash
/full-setup:verify-rano
npx tsx run-catalog.ts    # Test on 1 intent
```

**Key files:**
- Architecture: `rano-optimizer/references/ARCHITECTURE.md`
- Config: `.claude/skills/elex-ran-features/optimizer/ts/config.ts`
- Intents: `.claude/skills/elex-ran-features/optimizer/ts/catalog.ts`

## Phase 5: Mesh Networking (Optional)

Connects multiple Macs via private VPN for distributed inference.

**Duration:** 10-15 minutes per Mac

```bash
/full-setup:phase 5 [--role server|client]
```

**Roles:**
- `--role server` — Run Headscale control plane
- `--role client` — Join as Tailscale client

**What it does:**
1. Install Headscale (server) or Tailscale (clients)
2. Configure control plane / client connection
3. Generate pre-auth keys
4. Set up DNS
5. Test connectivity

**Server setup:**
```bash
/full-setup:phase 5 --role server --domain mesh.local
# Generates pre-auth keys for clients
```

**Client setup:**
```bash
/full-setup:phase 5 --role client --control-plane 100.100.100.1:8080 --authkey <key>
# Joins server mesh, accesses remote inference
```

**Verification:**
```bash
/full-setup:verify-mesh
tailscale status
curl http://100.100.100.1:11434/api/tags
```

**Key files:**
- Setup: `mesh-network/references/HEADSCALE-SETUP.md`

## Dependency Graph

Phases have dependencies:

```
Phase 1 (Foundation)
    ↓ required by
Phase 2 (Inference) ← can run independently
    ↓ recommended
Phase 3 (Claude Code) ← can skip if using Ollama only
    ↓ optional
Phase 4 (RANO) ← needs Phase 2 for local models
    ↓ optional
Phase 5 (Mesh) ← needs any phase for distributed setup
```

**Minimum viable setup:**
- Phase 1 + Phase 2 (local inference)

**Recommended:**
- Phases 1-3 (full Claude Code + local inference)

**Advanced:**
- All 5 phases (mesh-connected distributed optimization)

## Checkpoints & Rollback

Each phase has a checkpoint. Rollback is safe:

```bash
# See what was installed
/full-setup:checkpoint phase 2

# Undo a phase (back to previous checkpoint)
/full-setup:rollback phase 3

# View all checkpoints
/full-setup:checkpoints
```

## Environment After Setup

After complete setup, your environment includes:

```bash
# Foundation
mise                        # Tool manager (80+ tools)

# Inference
ollama serve                # Model serving
llama-swap                  # Single proxy
lms server start            # LM Studio GUI
gollama                     # Model auditor

# Claude Code
claude                      # Main CLI
claude-code-router          # Model routing
cc-mirror                   # Mirror management

# RANO
npx tsx run-catalog.ts      # Optimizer
21 agents running on ports 11435-11455

# Optional: Mesh
headscale serve            # Control plane (if server)
tailscale up               # VPN client
```

## Verification Commands

```bash
# Verify all phases
/full-setup:verify

# By phase
/full-setup:verify phase 1    # Foundation
/full-setup:verify phase 2    # Inference
/full-setup:verify phase 3    # Claude Code
/full-setup:verify phase 4    # RANO
/full-setup:verify phase 5    # Mesh

# Performance
/full-setup:benchmark
```

## Troubleshooting

| Phase | Issue | Solution |
|-------|-------|----------|
| 1 | mise install fails | `mise install -v` for verbose, check `mise doctor` |
| 2 | Ollama won't start | Check port 11434: `lsof -i :11434` |
| 2 | Model download slow | Use LM Studio GUI, check network |
| 3 | Router not picking up models | Run `claude-code-router:test` |
| 4 | RANO slow | Increase `RANO_INTENT_CONCURRENCY` |
| 4 | Agents not loading | Download models: `/full-setup:phase 4 --download-models` |
| 5 | Mesh connection fails | Check Headscale server is running, generate new authkey |

## Post-Setup

After all phases complete:

1. **Download primary models** (LM Studio or `lms get`)
2. **Test Claude Code** (run quick query)
3. **Verify RANO** (run 1-2 intents)
4. **Document in CLAUDE.md** (which models, providers, configurations)
5. **Set up monitoring** (optional: dashboard for metrics)
6. **Read CLAUDE.md** in project root (all setup rules & patterns)

See **CLAUDE.md** in the project root for detailed rules and best practices.
