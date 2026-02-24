#!/usr/bin/env bash
# Initialize a Claude Flow v3 project with recommended defaults
# Usage: bash plugins/claude-flow/scripts/init-project.sh [topology] [max-agents]

set -euo pipefail

TOPOLOGY="${1:-hierarchical}"
MAX_AGENTS="${2:-8}"

echo "=== Claude Flow v3 Project Initialization ==="
echo "Topology: $TOPOLOGY"
echo "Max Agents: $MAX_AGENTS"
echo ""

# Step 1: Add MCP server
echo "Step 1: Registering MCP server..."
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest 2>/dev/null || true

# Step 2: Start daemon
echo "Step 2: Starting daemon..."
npx @claude-flow/cli@latest daemon start 2>/dev/null || true

# Step 3: Initialize project
echo "Step 3: Initializing project..."
npx @claude-flow/cli@latest init --v3-mode 2>/dev/null || true

# Step 4: Initialize swarm
echo "Step 4: Setting up swarm..."
npx @claude-flow/cli@latest swarm init \
  --topology "$TOPOLOGY" \
  --max-agents "$MAX_AGENTS" \
  --strategy specialized 2>/dev/null || true

# Step 5: Run diagnostics
echo "Step 5: Running diagnostics..."
npx @claude-flow/cli@latest doctor --fix 2>/dev/null || true

echo ""
echo "=== Initialization complete ==="
echo ""
echo "Next steps:"
echo "  npx @claude-flow/cli@latest agent spawn -t coder --name my-coder"
echo "  npx @claude-flow/cli@latest memory store --key test --value 'hello' --namespace dev"
echo "  npx @claude-flow/cli@latest memory search --query 'test' --limit 5"
