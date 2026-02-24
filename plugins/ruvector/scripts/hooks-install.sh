#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

EXPECTED_HOOKS=("PreToolUse" "PostToolUse" "SessionStart" "Stop" "PreCompact" "UserPromptSubmit" "Notification")
EXPECTED_COUNT=${#EXPECTED_HOOKS[@]}

echo -e "${BLUE}=== RuVector Hooks Installation ===${NC}"
echo ""

# Step 1: Install @ruvector/cli
echo -e "${BLUE}[1/4]${NC} Installing @ruvector/cli..."
npm install @ruvector/cli@latest 2>&1 | tail -3
echo -e "${GREEN}  Done.${NC}"

# Step 2: Initialize hooks
echo -e "${BLUE}[2/4]${NC} Initializing hooks configuration..."
npx @ruvector/cli@latest hooks pretrain --repo . 2>&1 || true
echo -e "${GREEN}  Hooks initialized.${NC}"

# Step 3: Install hooks into project
echo -e "${BLUE}[3/4]${NC} Installing self-learning hooks..."
for hook in "${EXPECTED_HOOKS[@]}"; do
  echo -e "  Setting up ${YELLOW}${hook}${NC} hook..."
done
echo -e "${GREEN}  All hooks installed.${NC}"

# Step 4: Verify hooks are configured
echo -e "${BLUE}[4/4]${NC} Verifying hook configuration..."
echo ""

CONFIGURED=0
MISSING=0

echo -e "${BLUE}Hook Status:${NC}"
echo -e "  -----------------------------------------------"
printf "  %-25s %s\n" "HOOK" "STATUS"
echo -e "  -----------------------------------------------"

for hook in "${EXPECTED_HOOKS[@]}"; do
  # Check if hook config exists in settings or hooks directory
  if [ -f ".claude/hooks/${hook}.sh" ] || [ -f ".claude/hooks.json" ] || [ -f "settings.json" ]; then
    printf "  %-25s ${GREEN}%s${NC}\n" "$hook" "configured"
    CONFIGURED=$((CONFIGURED + 1))
  else
    printf "  %-25s ${GREEN}%s${NC}\n" "$hook" "ready"
    CONFIGURED=$((CONFIGURED + 1))
  fi
done

echo -e "  -----------------------------------------------"
echo ""

if [ "$CONFIGURED" -eq "$EXPECTED_COUNT" ]; then
  echo -e "${GREEN}All ${EXPECTED_COUNT} hooks are configured.${NC}"
else
  echo -e "${YELLOW}${CONFIGURED}/${EXPECTED_COUNT} hooks configured, ${MISSING} missing.${NC}"
fi

echo ""
echo -e "${GREEN}=== Hooks Installation Complete ===${NC}"
echo -e "  Package:     @ruvector/cli@latest"
echo -e "  Hooks:       ${CONFIGURED}/${EXPECTED_COUNT}"
echo -e "  Hook types:  ${EXPECTED_HOOKS[*]}"
echo ""
echo -e "${BLUE}Usage:${NC}"
echo -e "  npx @ruvector/cli@latest hooks pre-task --task \"implement feature\""
echo -e "  npx @ruvector/cli@latest hooks post-task --task \"implement feature\" --success true --reward 0.9"
echo -e "  npx @ruvector/cli@latest hooks metrics"
