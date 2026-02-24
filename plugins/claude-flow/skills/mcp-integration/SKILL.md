---
name: claude-flow-mcp-integration
description: >
  MCP (Model Context Protocol) server integration with 213+ tools. Use when starting MCP
  servers, executing MCP tools, configuring providers (Anthropic, OpenRouter, Gemini, ONNX),
  or managing tool registrations across stdio/http/ws transports.
---

# MCP Integration

## Server Setup

```bash
# Add MCP server to Claude Code
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest

# Start MCP server standalone
npx @claude-flow/cli@latest mcp start

# Start with specific transport
npx @claude-flow/cli@latest mcp start --transport stdio
npx @claude-flow/cli@latest mcp start --transport http --port 3100
npx @claude-flow/cli@latest mcp start --transport ws --port 3101

# Stop MCP server
npx @claude-flow/cli@latest mcp stop
```

## Tool Categories (213+)

| Category | Count | Key Tools |
|----------|-------|-----------|
| Coordination | ~40 | `swarm_init`, `agent_spawn`, `task_orchestrate`, `coordination_sync` |
| Memory | ~15 | `memory_store`, `memory_search`, `memory_retrieve`, `memory_stats` |
| Monitoring | ~20 | `performance_report`, `bottleneck_analyze`, `swarm_status` |
| GitHub | ~30 | `github_repo_analyze`, `github_pr_manage`, `github_issue_track` |
| Workers | ~12 | Pattern matcher, quality scorer, anomaly detector |
| Security | ~10 | `aidefence_analyze`, `aidefence_scan`, `security_audit` |
| Session | ~10 | `session_start`, `session_save`, `session_restore` |
| Hooks | ~15 | `hooks_add`, `hooks_list`, `hooks_enable`, `hooks_trigger` |

Full catalog: [../references/mcp-tools.md](../references/mcp-tools.md)

## Executing MCP Tools

```bash
# List available tools
npx @claude-flow/cli@latest mcp tools

# Execute a specific tool
npx @claude-flow/cli@latest mcp exec --tool memory_search --args '{"query":"auth patterns","limit":5}'

# Execute with namespace
npx @claude-flow/cli@latest mcp exec --tool memory_store --args '{"key":"test","value":"data","namespace":"dev"}'
```

## Provider Configuration

Multi-LLM support via providers:

| Provider | Models | Config Key |
|----------|--------|-----------|
| Anthropic | Claude 4.5/4.6 | `ANTHROPIC_API_KEY` |
| OpenRouter | Multi-model access | `OPENROUTER_API_KEY` |
| Google Gemini | Gemini Pro/Ultra | `GOOGLE_API_KEY` |
| ONNX Runtime | Local inference | Path to model |
| Ollama | Local models | `OLLAMA_HOST` |

```bash
# Configure provider
npx @claude-flow/cli@latest providers add --name openrouter --key $OPENROUTER_API_KEY

# List providers
npx @claude-flow/cli@latest providers list

# Set default provider
npx @claude-flow/cli@latest providers default --name anthropic
```

## Transport Protocols

| Transport | Use Case | Default Port |
|-----------|----------|-------------|
| stdio | Claude Code integration | N/A (pipe) |
| HTTP | REST API access | 3100 |
| WebSocket | Real-time bidirectional | 3101 |

## Browser Automation (Playwright)

59 MCP browser tools via `claude-flow-browser`:

```bash
# Navigate and interact
mcp_exec browser_navigate --args '{"url":"https://example.com"}'
mcp_exec browser_click --args '{"selector":"#login-btn"}'
mcp_exec browser_screenshot --args '{"path":"screenshot.png"}'
```

## Integration with agentic-flow

Bridge to agentic-flow foundation layer (ADR-001):

- Agent Booster: 352x faster for simple transforms
- ReasoningBank: Pattern learning persistence
- ONNX embeddings: Local vector generation
- 66 agent types + 213 MCP tools combined
