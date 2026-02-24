# Troubleshooting

## Diagnostics
```bash
npx @claude-flow/cli@latest doctor --fix --verbose
```

## Common Issues

### Daemon not running
```bash
npx @claude-flow/cli@latest daemon start
npx @claude-flow/cli@latest daemon status
```

### MCP server not responding
```bash
# Remove and re-add
claude mcp remove claude-flow
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest

# Check MCP status
npx @claude-flow/cli@latest mcp status
```

### Memory database locked
```bash
# Check for stale locks
ls -la .swarm/memory.db*

# Compact and optimize
npx @claude-flow/cli@latest memory optimize
npx @claude-flow/cli@latest memory compact
```

### Agents not responding
```bash
# List and check
npx @claude-flow/cli@latest agent list

# Force stop all
npx @claude-flow/cli@latest agent stop --all

# Restart daemon
npx @claude-flow/cli@latest daemon restart
```

### Swarm drift
```bash
# Check swarm health
npx @claude-flow/cli@latest swarm status

# Reinitialize with anti-drift
npx @claude-flow/cli@latest swarm stop
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

### HNSW index corruption
```bash
npx @claude-flow/cli@latest memory optimize
npx @claude-flow/cli@latest memory compact
```

### Permission errors
```bash
# Check claims
npx @claude-flow/cli@latest claims list --agent AGENT_NAME

# Reassign role
npx @claude-flow/cli@latest claims assign --agent AGENT_NAME --role developer
```
