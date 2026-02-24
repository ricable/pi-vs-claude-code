#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CONTAINER_NAME="ruvector-postgres"
PG_PORT="${1:-5432}"
PG_USER="ruvector"
PG_PASSWORD="ruvector_dev"
PG_DB="ruvector_db"
IMAGE="ruvector/postgres:latest"

echo -e "${BLUE}=== RuVector PostgreSQL Setup ===${NC}"
echo ""

# Step 1: Check Docker is available
echo -e "${BLUE}[1/6]${NC} Checking Docker availability..."
if ! command -v docker &>/dev/null; then
  echo -e "${RED}  ERROR: Docker is not installed or not in PATH${NC}"
  echo -e "  Install Docker: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker info &>/dev/null; then
  echo -e "${RED}  ERROR: Docker daemon is not running${NC}"
  echo -e "  Start Docker Desktop or run: sudo systemctl start docker"
  exit 1
fi
echo -e "${GREEN}  Docker is available.${NC}"

# Stop existing container if present
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo -e "  ${YELLOW}Stopping existing ${CONTAINER_NAME} container...${NC}"
  docker stop "$CONTAINER_NAME" 2>/dev/null || true
  docker rm "$CONTAINER_NAME" 2>/dev/null || true
  echo -e "  ${GREEN}Removed old container.${NC}"
fi

# Step 2: Pull ruvector-postgres image
echo -e "${BLUE}[2/6]${NC} Pulling ${IMAGE}..."
docker pull "$IMAGE" 2>&1 | tail -3 || {
  echo -e "${YELLOW}  Image ${IMAGE} not found. Falling back to pgvector/pgvector:pg16...${NC}"
  IMAGE="pgvector/pgvector:pg16"
  docker pull "$IMAGE" 2>&1 | tail -3
}
echo -e "${GREEN}  Image ready.${NC}"

# Step 3: Start container
echo -e "${BLUE}[3/6]${NC} Starting PostgreSQL container on port ${PG_PORT}..."
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "${PG_PORT}:5432" \
  -e POSTGRES_USER="$PG_USER" \
  -e POSTGRES_PASSWORD="$PG_PASSWORD" \
  -e POSTGRES_DB="$PG_DB" \
  "$IMAGE" >/dev/null
echo -e "${GREEN}  Container started.${NC}"

# Step 4: Wait for postgres ready
echo -e "${BLUE}[4/6]${NC} Waiting for PostgreSQL to be ready..."
TIMEOUT=30
ELAPSED=0

while [ "$ELAPSED" -lt "$TIMEOUT" ]; do
  if docker exec "$CONTAINER_NAME" pg_isready -U "$PG_USER" -d "$PG_DB" &>/dev/null; then
    echo -e "  ${GREEN}PostgreSQL ready after ${ELAPSED}s${NC}"
    break
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
  printf "  Waiting... (%ds/%ds)\r" "$ELAPSED" "$TIMEOUT"
done

if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
  echo -e "  ${RED}ERROR: PostgreSQL did not become ready within ${TIMEOUT}s${NC}"
  docker logs "$CONTAINER_NAME" 2>&1 | tail -10
  exit 1
fi

# Step 5: Enable ruvector extension
echo -e "${BLUE}[5/6]${NC} Enabling vector extension..."
docker exec "$CONTAINER_NAME" psql -U "$PG_USER" -d "$PG_DB" -c "
  CREATE EXTENSION IF NOT EXISTS vector;
" 2>&1 | grep -v "^$" || true

# Try ruvector extension if available
docker exec "$CONTAINER_NAME" psql -U "$PG_USER" -d "$PG_DB" -c "
  CREATE EXTENSION IF NOT EXISTS ruvector CASCADE;
" 2>&1 | grep -v "^$" || {
  echo -e "  ${YELLOW}ruvector extension not available, using pgvector (vector) extension${NC}"
}
echo -e "${GREEN}  Extension enabled.${NC}"

# Step 6: Create sample table with vector column
echo -e "${BLUE}[6/6]${NC} Creating sample table with vector column..."
docker exec "$CONTAINER_NAME" psql -U "$PG_USER" -d "$PG_DB" -c "
  DROP TABLE IF EXISTS documents;
  CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(384),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);

  INSERT INTO documents (content, embedding) VALUES
    ('Hello world', ('[' || array_to_string(ARRAY(SELECT round(random()::numeric, 4) FROM generate_series(1, 384)), ',') || ']')::vector),
    ('Vector search', ('[' || array_to_string(ARRAY(SELECT round(random()::numeric, 4) FROM generate_series(1, 384)), ',') || ']')::vector);
" 2>&1 | grep -v "^$" || true
echo -e "${GREEN}  Sample table created with 2 rows.${NC}"

# Print connection info
echo ""
echo -e "${GREEN}=== RuVector PostgreSQL Ready ===${NC}"
echo -e "  -----------------------------------------------"
printf "  %-15s %s\n" "Container:" "$CONTAINER_NAME"
printf "  %-15s %s\n" "Image:" "$IMAGE"
printf "  %-15s %s\n" "Host:" "localhost"
printf "  %-15s %s\n" "Port:" "$PG_PORT"
printf "  %-15s %s\n" "Database:" "$PG_DB"
printf "  %-15s %s\n" "User:" "$PG_USER"
printf "  %-15s %s\n" "Password:" "$PG_PASSWORD"
printf "  %-15s %s\n" "Table:" "documents (384-dim vectors)"
echo -e "  -----------------------------------------------"
echo ""
echo -e "${BLUE}Connection string:${NC}"
echo -e "  postgresql://${PG_USER}:${PG_PASSWORD}@localhost:${PG_PORT}/${PG_DB}"
echo ""
echo -e "${BLUE}Quick commands:${NC}"
echo -e "  psql:     docker exec -it ${CONTAINER_NAME} psql -U ${PG_USER} -d ${PG_DB}"
echo -e "  cli:      npx @ruvector/postgres-cli@latest psql"
echo -e "  search:   npx @ruvector/postgres-cli@latest vector search --table documents --query \"[0.1,0.2,...]\" --top-k 5"
echo -e "  stop:     docker stop ${CONTAINER_NAME}"
echo -e "  remove:   docker rm ${CONTAINER_NAME}"
