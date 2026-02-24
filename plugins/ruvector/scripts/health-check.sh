#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASS=0
WARN=0
FAIL=0
TOTAL=0

check() {
  local name="$1"
  local status="$2"  # pass, warn, fail
  local detail="$3"
  TOTAL=$((TOTAL + 1))

  case "$status" in
    pass)
      PASS=$((PASS + 1))
      printf "  %-35s ${GREEN}%-8s${NC} %s\n" "$name" "PASS" "$detail"
      ;;
    warn)
      WARN=$((WARN + 1))
      printf "  %-35s ${YELLOW}%-8s${NC} %s\n" "$name" "WARN" "$detail"
      ;;
    fail)
      FAIL=$((FAIL + 1))
      printf "  %-35s ${RED}%-8s${NC} %s\n" "$name" "FAIL" "$detail"
      ;;
  esac
}

echo -e "${BLUE}=== RuVector Health Check ===${NC}"
echo ""
echo -e "  -----------------------------------------------"
printf "  %-35s %-8s %s\n" "CHECK" "STATUS" "DETAILS"
echo -e "  -----------------------------------------------"

# Check 1: Node.js version (>=18)
if command -v node &>/dev/null; then
  NODE_VERSION=$(node --version 2>/dev/null | sed 's/^v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 18 ]; then
    check "Node.js version" "pass" "v${NODE_VERSION}"
  else
    check "Node.js version" "fail" "v${NODE_VERSION} (need >=18)"
  fi
else
  check "Node.js version" "fail" "not installed"
fi

# Check 2: ruvector installed
if npm ls ruvector &>/dev/null 2>&1 || npx ruvector@latest --version &>/dev/null 2>&1; then
  RV_VERSION=$(npx ruvector@latest --version 2>/dev/null || echo "available via npx")
  check "ruvector package" "pass" "${RV_VERSION}"
else
  check "ruvector package" "warn" "not installed (use: npm install ruvector)"
fi

# Check 3: Native NAPI binding status
NAPI_STATUS=$(node -e "
  try {
    const rv = require('ruvector');
    if (rv && rv._napi) { console.log('native'); }
    else { console.log('unknown'); }
  } catch(e) {
    console.log('unavailable');
  }
" 2>/dev/null || echo "unavailable")

case "$NAPI_STATUS" in
  native)
    check "Native NAPI binding" "pass" "Rust NAPI loaded"
    ;;
  unknown)
    check "Native NAPI binding" "warn" "package loaded, binding type unknown"
    ;;
  unavailable)
    check "Native NAPI binding" "warn" "not loaded (WASM fallback may be used)"
    ;;
esac

# Check 4: WASM fallback availability
WASM_STATUS=$(node -e "
  try {
    const w = require('ruvector/wasm');
    if (w) { console.log('available'); }
    else { console.log('unavailable'); }
  } catch(e) {
    console.log('unavailable');
  }
" 2>/dev/null || echo "unavailable")

if [ "$WASM_STATUS" = "available" ]; then
  check "WASM fallback" "pass" "available"
else
  check "WASM fallback" "warn" "not detected (install ruvector for auto-fallback)"
fi

# Check 5: @ruvector/cli hooks
CLI_INSTALLED=$(npm ls @ruvector/cli 2>/dev/null && echo "yes" || echo "no")
if [ "$CLI_INSTALLED" = "yes" ] || npx @ruvector/cli@latest --version &>/dev/null 2>&1; then
  # Check for hooks configuration
  HOOKS_CONFIGURED=0
  HOOKS_LIST=("PreToolUse" "PostToolUse" "SessionStart" "Stop" "PreCompact" "UserPromptSubmit" "Notification")
  for hook in "${HOOKS_LIST[@]}"; do
    if [ -f ".claude/hooks/${hook}.sh" ] || [ -f ".claude/hooks.json" ]; then
      HOOKS_CONFIGURED=$((HOOKS_CONFIGURED + 1))
    fi
  done

  if [ "$HOOKS_CONFIGURED" -gt 0 ]; then
    check "@ruvector/cli hooks" "pass" "${HOOKS_CONFIGURED}/7 hooks configured"
  else
    check "@ruvector/cli hooks" "warn" "CLI available, hooks not yet configured"
  fi
else
  check "@ruvector/cli hooks" "warn" "not installed (use: npm install @ruvector/cli)"
fi

# Check 6: Docker status (for postgres)
if command -v docker &>/dev/null; then
  if docker info &>/dev/null 2>&1; then
    # Check if ruvector-postgres container exists
    if docker ps --format '{{.Names}}' | grep -q "ruvector-postgres"; then
      check "Docker (postgres)" "pass" "running (ruvector-postgres container active)"
    elif docker ps -a --format '{{.Names}}' | grep -q "ruvector-postgres"; then
      check "Docker (postgres)" "warn" "container exists but stopped"
    else
      check "Docker (postgres)" "pass" "Docker available, no postgres container"
    fi
  else
    check "Docker (postgres)" "warn" "Docker installed but daemon not running"
  fi
else
  check "Docker (postgres)" "warn" "Docker not installed (optional, for postgres)"
fi

# Summary
echo -e "  -----------------------------------------------"
echo ""
echo -e "${BLUE}=== Health Summary ===${NC}"
echo -e "  Total checks: ${TOTAL}"
echo -e "  Passed:       ${GREEN}${PASS}${NC}"
echo -e "  Warnings:     ${YELLOW}${WARN}${NC}"
echo -e "  Failed:       ${RED}${FAIL}${NC}"
echo ""

if [ "$FAIL" -eq 0 ] && [ "$WARN" -eq 0 ]; then
  echo -e "${GREEN}All checks passed. RuVector is fully operational.${NC}"
elif [ "$FAIL" -eq 0 ]; then
  echo -e "${YELLOW}RuVector is operational with ${WARN} warning(s).${NC}"
else
  echo -e "${RED}RuVector has ${FAIL} issue(s) that need attention.${NC}"
fi

exit "$FAIL"
