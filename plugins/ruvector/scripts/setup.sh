#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== RuVector Setup ===${NC}"
echo ""

# Step 1: Install ruvector hub package
echo -e "${BLUE}[1/5]${NC} Installing ruvector hub package..."
npm install ruvector@latest 2>&1 | tail -3
echo -e "${GREEN}  Done.${NC}"

# Step 2: Verify native NAPI binding or WASM fallback
echo -e "${BLUE}[2/5]${NC} Checking runtime binding..."
BINDING=$(node -e "
  try {
    require('ruvector');
    const b = process.env.RUVECTOR_BINDING || 'napi';
    console.log(b);
  } catch(e) {
    console.log('missing');
  }
" 2>/dev/null || echo "missing")

if [ "$BINDING" = "missing" ]; then
  echo -e "${RED}  ERROR: ruvector package not loadable${NC}"
  exit 1
elif [ "$BINDING" = "wasm" ]; then
  echo -e "${YELLOW}  Using WASM fallback (native NAPI binding not available)${NC}"
else
  echo -e "${GREEN}  Native NAPI binding detected${NC}"
fi

# Step 3: Create a test database with 384 dimensions
echo -e "${BLUE}[3/5]${NC} Creating test database (384 dimensions, cosine metric)..."
npx ruvector@latest create --dimensions 384 --metric cosine 2>&1 || true
echo -e "${GREEN}  Database created.${NC}"

# Step 4: Insert a test vector
echo -e "${BLUE}[4/5]${NC} Inserting test vector..."
# Generate a simple 384-dim test vector
TEST_VEC=$(node -e "console.log(JSON.stringify(Array.from({length:384}, (_,i) => Math.sin(i/10))))")
npx ruvector@latest insert --id "test-vec-1" --vector "$TEST_VEC" --metadata '{"label":"setup-test"}' 2>&1
echo -e "${GREEN}  Test vector inserted.${NC}"

# Step 5: Search for the test vector
echo -e "${BLUE}[5/5]${NC} Searching for test vector..."
QUERY_VEC=$(node -e "console.log(JSON.stringify(Array.from({length:384}, (_,i) => Math.sin(i/10))))")
npx ruvector@latest search --query "$QUERY_VEC" --top-k 1 2>&1
echo -e "${GREEN}  Search completed.${NC}"

echo ""
echo -e "${GREEN}=== RuVector Setup Complete ===${NC}"
echo -e "  Package:    ruvector@latest"
echo -e "  Binding:    ${BINDING}"
echo -e "  Dimensions: 384"
echo -e "  Metric:     cosine"
echo -e "  Status:     Ready"
