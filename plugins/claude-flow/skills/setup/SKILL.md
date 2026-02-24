---
name: claude-flow-setup
description: >
  Initialize and configure Claude Flow v3 projects. Use when setting up a new project,
  configuring the daemon, adding MCP servers, or managing agent configurations.
---

# Setup & Initialization

## First-Time Setup

```bash
# 1. Add MCP server to Claude Code
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest

# 2. Start the daemon
npx @claude-flow/cli@latest daemon start

# 3. Run diagnostics
npx @claude-flow/cli@latest doctor --fix
```

## Project Initialization

```bash
# Interactive wizard (recommended for new projects)
npx @claude-flow/cli@latest init --wizard

# Quick init with v3 features
npx @claude-flow/cli@latest init --v3-mode

# Minimal init
npx @claude-flow/cli@latest init
```

The wizard configures:
- Topology (hierarchical, mesh, star, ring)
- Max agent count (default: 8)
- Memory backend (sqlite, hybrid, in-memory)
- HNSW indexing (enabled/disabled)
- Security level (standard, strict, paranoid)

## Agent Lifecycle

```bash
# Spawn a typed agent
npx @claude-flow/cli@latest agent spawn -t coder --name my-coder

# List active agents
npx @claude-flow/cli@latest agent list

# Execute a task on an agent
npx @claude-flow/cli@latest agent exec --name my-coder --task "implement auth module"

# Stop an agent
npx @claude-flow/cli@latest agent stop --name my-coder

# Stop all agents
npx @claude-flow/cli@latest agent stop --all
```

## Agent Types

60+ available types. Common selections:

| Type | Use Case |
|------|----------|
| `coder` | Write and modify code |
| `tester` | Write and run tests (London School TDD) |
| `reviewer` | Code review with quality gates |
| `researcher` | Information gathering, codebase exploration |
| `planner` | Task decomposition, architecture planning |
| `security-architect` | Security design and threat modeling |
| `performance-engineer` | Profiling and optimization |

## Configuration Files

- `.claude-flow/config.json` - Project-level configuration
- `.claude-flow/agents/` - Custom agent definitions
- `.claude-flow/hooks/` - Hook configurations
- `.swarm/memory.db` - SQLite memory backend

## Daemon Management

```bash
npx @claude-flow/cli@latest daemon start    # Start background daemon
npx @claude-flow/cli@latest daemon stop     # Stop daemon
npx @claude-flow/cli@latest daemon status   # Check daemon health
npx @claude-flow/cli@latest daemon restart  # Restart daemon
```

## Session Management

```bash
npx @claude-flow/cli@latest session start --name my-session
npx @claude-flow/cli@latest session save
npx @claude-flow/cli@latest session restore --name my-session
npx @claude-flow/cli@latest session list
```
