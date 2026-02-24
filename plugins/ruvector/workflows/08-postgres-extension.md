# Workflow 8: PostgreSQL Vector Extension

> Back to [RuVector Hub](../SKILL.md)

**Goal:** Add vector search, GNN, and attention to existing PostgreSQL databases.

### Step 1: Install

```bash
# Docker (recommended)
docker run -d --name ruvector-pg \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 \
  ruvnet/ruvector-postgres:latest

# CLI
npm install -g @ruvector/postgres-cli
```

### Step 2: Enable Extension

```sql
CREATE EXTENSION ruvector;

CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  content TEXT,
  embedding VECTOR(1536)
);

CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 200);
```

### Step 3: Vector Operations (230+ SQL functions)

```sql
-- Dense vector search
SELECT id, content, embedding <=> query_vec AS distance
FROM documents ORDER BY distance LIMIT 10;

-- Hybrid search (vector + full-text)
SELECT id, content FROM documents
WHERE to_tsvector(content) @@ to_tsquery('machine & learning')
ORDER BY embedding <=> query_vec LIMIT 10;

-- GNN-enhanced search
SELECT * FROM ruvector_gnn_search('documents', query_vec, 10, 'gcn');

-- Generate embeddings locally
SELECT ruvector_embed('all-MiniLM-L6-v2', 'Your text here');

-- Flash attention
SELECT ruvector_flash_attention(query, key, value);
```

### Step 4: CLI Management

```bash
rvpg vector insert --table docs --file embeddings.json
rvpg vector search --table docs --query "[0.1,0.2,...]" --limit 10
rvpg gnn train --table docs --type gcn --epochs 50
rvpg routing create --name agent-router --routes "code,chat,analysis"
rvpg bench --iterations 1000
```

**Related skills:** `ruvector-postgres-cli`
