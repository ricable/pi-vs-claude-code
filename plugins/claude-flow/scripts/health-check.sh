#!/usr/bin/env bash
# Claude Flow v3 Health Check
# Checks daemon, MCP, memory, and agent health

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo "=== Claude Flow v3 Health Check ==="
echo ""

# Check CLI installed
if command -v npx &>/dev/null; then
  pass "npx available"
else
  fail "npx not found - install Node.js"
  exit 1
fi

# Check daemon
if npx @claude-flow/cli@latest daemon status &>/dev/null 2>&1; then
  pass "Daemon running"
else
  warn "Daemon not running - start with: npx @claude-flow/cli@latest daemon start"
fi

# Check MCP
if claude mcp list 2>/dev/null | grep -q "claude-flow"; then
  pass "MCP server registered"
else
  warn "MCP server not registered - add with: claude mcp add claude-flow -- npx -y @claude-flow/cli@latest"
fi

# Check memory database
if [ -f ".swarm/memory.db" ]; then
  pass "Memory database exists (.swarm/memory.db)"
  SIZE=$(du -h .swarm/memory.db 2>/dev/null | cut -f1)
  echo "     Database size: $SIZE"
else
  warn "No memory database found - will be created on first use"
fi

# Check config
if [ -f ".claude-flow/config.json" ]; then
  pass "Project config found (.claude-flow/config.json)"
else
  warn "No project config - initialize with: npx @claude-flow/cli@latest init --wizard"
fi

# Check active agents
AGENTS=$(npx @claude-flow/cli@latest agent list 2>/dev/null | wc -l || echo "0")
echo ""
echo "Active agents: $AGENTS"

echo ""
echo "=== Health check complete ==="
