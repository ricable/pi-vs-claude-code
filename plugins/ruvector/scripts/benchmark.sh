#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Accept dimensions and count as args with defaults
DIMENSIONS="${1:-384}"
COUNT="${2:-10000}"

echo -e "${BLUE}=== RuVector Benchmark Suite ===${NC}"
echo -e "  Dimensions: ${DIMENSIONS}"
echo -e "  Count:      ${COUNT}"
echo ""

# Step 1: Insert benchmark
echo -e "${BLUE}[1/3]${NC} Running insert benchmark (${COUNT} vectors, ${DIMENSIONS} dimensions)..."
echo -e "  ${YELLOW}Command: npx ruvector@latest bench --dimensions ${DIMENSIONS} --count ${COUNT}${NC}"
echo ""
INSERT_OUTPUT=$(npx ruvector@latest bench --dimensions "$DIMENSIONS" --count "$COUNT" 2>&1) || true
echo "$INSERT_OUTPUT"
echo ""
echo -e "${GREEN}  Insert benchmark complete.${NC}"
echo ""

# Step 2: Search benchmark
QUERIES=$((COUNT / 10))
if [ "$QUERIES" -lt 100 ]; then
  QUERIES=100
fi

echo -e "${BLUE}[2/3]${NC} Running search benchmark (${QUERIES} queries)..."
echo -e "  ${YELLOW}Command: npx ruvector@latest bench --mode search --queries ${QUERIES} --dimensions ${DIMENSIONS}${NC}"
echo ""
SEARCH_OUTPUT=$(npx ruvector@latest bench --mode search --queries "$QUERIES" --dimensions "$DIMENSIONS" 2>&1) || true
echo "$SEARCH_OUTPUT"
echo ""
echo -e "${GREEN}  Search benchmark complete.${NC}"
echo ""

# Step 3: Mixed workload benchmark
echo -e "${BLUE}[3/3]${NC} Running mixed workload benchmark (30 seconds)..."
echo -e "  ${YELLOW}Command: npx ruvector@latest bench --mode mixed --duration 30 --dimensions ${DIMENSIONS}${NC}"
echo ""
MIXED_OUTPUT=$(npx ruvector@latest bench --mode mixed --duration 30 --dimensions "$DIMENSIONS" 2>&1) || true
echo "$MIXED_OUTPUT"
echo ""
echo -e "${GREEN}  Mixed workload benchmark complete.${NC}"

# Results summary
echo ""
echo -e "${BLUE}=== Benchmark Results Summary ===${NC}"
echo -e "  -----------------------------------------------"
printf "  %-20s %s\n" "TEST" "CONFIGURATION"
echo -e "  -----------------------------------------------"
printf "  %-20s %s\n" "Insert" "${COUNT} vectors @ ${DIMENSIONS}d"
printf "  %-20s %s\n" "Search" "${QUERIES} queries @ ${DIMENSIONS}d"
printf "  %-20s %s\n" "Mixed" "30s @ ${DIMENSIONS}d"
echo -e "  -----------------------------------------------"
echo ""
echo -e "${GREEN}Benchmark suite complete.${NC}"
echo ""
echo -e "${BLUE}Tips:${NC}"
echo -e "  - Increase count for more realistic results:  $0 384 100000"
echo -e "  - Test higher dimensions:                     $0 768 10000"
echo -e "  - For HNSW parameter tuning, use:"
echo -e "    npx @ruvector/cli@latest bench --mode hnsw --ef-values \"50,100,200,400\""
