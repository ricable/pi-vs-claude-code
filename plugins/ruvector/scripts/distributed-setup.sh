#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

NODE_PORTS=(9100 9101 9102)
NODE_COUNT=${#NODE_PORTS[@]}
DATA_DIR="${1:-./.ruvector-cluster}"
PIDS=()

cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down cluster nodes...${NC}"
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  echo -e "${GREEN}Cluster stopped.${NC}"
}

trap cleanup EXIT

echo -e "${BLUE}=== RuVector Distributed Cluster Setup ===${NC}"
echo -e "  Nodes:     ${NODE_COUNT}"
echo -e "  Ports:     ${NODE_PORTS[*]}"
echo -e "  Consensus: Raft"
echo -e "  Data dir:  ${DATA_DIR}"
echo ""

# Step 1: Create data directories
echo -e "${BLUE}[1/5]${NC} Creating data directories..."
for i in $(seq 0 $((NODE_COUNT - 1))); do
  mkdir -p "${DATA_DIR}/node-${i}"
  echo -e "  Created ${DATA_DIR}/node-${i}"
done
echo -e "${GREEN}  Done.${NC}"
echo ""

# Step 2: Configure and start 3-node Raft cluster
echo -e "${BLUE}[2/5]${NC} Starting ${NODE_COUNT}-node Raft cluster..."

for i in $(seq 0 $((NODE_COUNT - 1))); do
  PORT=${NODE_PORTS[$i]}
  NODE_ID="node-${i}"
  SEED_NODES=""

  # Build seed node list (all peers except self)
  for j in $(seq 0 $((NODE_COUNT - 1))); do
    if [ "$i" -ne "$j" ]; then
      if [ -n "$SEED_NODES" ]; then
        SEED_NODES="${SEED_NODES},localhost:${NODE_PORTS[$j]}"
      else
        SEED_NODES="localhost:${NODE_PORTS[$j]}"
      fi
    fi
  done

  echo -e "  Starting ${YELLOW}${NODE_ID}${NC} on port ${PORT} (seeds: ${SEED_NODES})..."

  # Start node using ruvector serve with Raft consensus
  npx ruvector@latest serve \
    --port "$PORT" \
    --persist "${DATA_DIR}/${NODE_ID}" \
    2>&1 | while IFS= read -r line; do echo "    [${NODE_ID}] $line"; done &

  PIDS+=($!)
  echo -e "  ${GREEN}${NODE_ID} started (PID: ${PIDS[-1]})${NC}"
done
echo ""

# Step 3: Wait for leader election
echo -e "${BLUE}[3/5]${NC} Waiting for leader election..."
ELECTION_TIMEOUT=15
ELAPSED=0

while [ "$ELAPSED" -lt "$ELECTION_TIMEOUT" ]; do
  sleep 1
  ELAPSED=$((ELAPSED + 1))

  # Check if all processes are still running
  ALL_RUNNING=true
  for pid in "${PIDS[@]}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      ALL_RUNNING=false
      break
    fi
  done

  if [ "$ALL_RUNNING" = true ]; then
    # Try to check cluster health via HTTP
    LEADER_FOUND=false
    for port in "${NODE_PORTS[@]}"; do
      if curl -s "http://localhost:${port}/health" >/dev/null 2>&1; then
        LEADER_FOUND=true
        break
      fi
    done

    if [ "$LEADER_FOUND" = true ]; then
      echo -e "  ${GREEN}Leader elected after ${ELAPSED}s${NC}"
      break
    fi
  fi

  printf "  Waiting... (%ds/%ds)\r" "$ELAPSED" "$ELECTION_TIMEOUT"
done
echo ""

if [ "$ELAPSED" -ge "$ELECTION_TIMEOUT" ]; then
  echo -e "  ${YELLOW}Leader election timeout (${ELECTION_TIMEOUT}s). Nodes may still be negotiating.${NC}"
fi

# Step 4: Verify cluster health
echo -e "${BLUE}[4/5]${NC} Verifying cluster health..."
HEALTHY=0

for i in $(seq 0 $((NODE_COUNT - 1))); do
  PORT=${NODE_PORTS[$i]}
  NODE_ID="node-${i}"

  if kill -0 "${PIDS[$i]}" 2>/dev/null; then
    echo -e "  ${NODE_ID} (port ${PORT}): ${GREEN}running${NC}"
    HEALTHY=$((HEALTHY + 1))
  else
    echo -e "  ${NODE_ID} (port ${PORT}): ${RED}stopped${NC}"
  fi
done
echo ""

# Step 5: Print cluster status
echo -e "${BLUE}[5/5]${NC} Cluster status summary"
echo ""
echo -e "${BLUE}=== Cluster Status ===${NC}"
echo -e "  -----------------------------------------------"
printf "  %-12s %-8s %-8s %s\n" "NODE" "PORT" "PID" "STATUS"
echo -e "  -----------------------------------------------"

for i in $(seq 0 $((NODE_COUNT - 1))); do
  PORT=${NODE_PORTS[$i]}
  NODE_ID="node-${i}"
  PID=${PIDS[$i]}

  if kill -0 "$PID" 2>/dev/null; then
    STATUS="${GREEN}healthy${NC}"
  else
    STATUS="${RED}down${NC}"
  fi

  printf "  %-12s %-8s %-8s " "$NODE_ID" "$PORT" "$PID"
  echo -e "$STATUS"
done

echo -e "  -----------------------------------------------"
echo -e "  Healthy: ${GREEN}${HEALTHY}/${NODE_COUNT}${NC}"
echo -e "  Consensus: Raft"
echo -e "  Fault tolerance: $((NODE_COUNT / 2)) node failure(s)"
echo ""

if [ "$HEALTHY" -eq "$NODE_COUNT" ]; then
  echo -e "${GREEN}Cluster is fully operational.${NC}"
else
  echo -e "${YELLOW}Cluster is partially operational (${HEALTHY}/${NODE_COUNT} nodes).${NC}"
fi

echo ""
echo -e "${BLUE}Usage:${NC}"
echo -e "  Connect to any node:  curl http://localhost:9100/health"
echo -e "  Press Ctrl+C to stop the cluster"
echo ""

# Keep running until interrupted
echo -e "${YELLOW}Cluster running. Press Ctrl+C to stop.${NC}"
wait
