# PostgreSQL Vector Database

> Part of the [RuVector Plugin](../SKILL.md). See also: [attention](attention.md), [data-generation](data-generation.md).

## Install and Start

```bash
npx @ruvector/postgres-cli@latest install                # install RuVector PostgreSQL
npx @ruvector/postgres-cli@latest install --port 5433    # custom port
npx @ruvector/postgres-cli@latest start                  # start server
npx @ruvector/postgres-cli@latest stop                   # stop server
npx @ruvector/postgres-cli@latest status                 # show status
npx @ruvector/postgres-cli@latest logs --follow          # tail logs
```

## Extension Setup

```bash
npx @ruvector/postgres-cli@latest extension              # install extension
npx @ruvector/postgres-cli@latest extension --upgrade    # upgrade to latest
npx @ruvector/postgres-cli@latest psql "CREATE EXTENSION ruvector CASCADE;"
npx @ruvector/postgres-cli@latest info                   # list all SQL functions
```

## Dense Vector Operations

```bash
# Insert vectors
rvpg vector insert --table docs --id 1 --vector "[0.1,0.2,0.3]" --metadata '{"title":"Hello"}'
rvpg vector insert --table docs --file embeddings.json

# Search (cosine, euclidean, dot)
rvpg vector search --table docs --query "[0.1,0.2]" --top-k 10 --metric cosine
rvpg vector search --table docs --query "[0.1,0.2]" --filter '{"category":"ai"}'

# HNSW index
rvpg vector index --table docs --type hnsw --ef-construction 200 --m 16
rvpg vector index --table docs --type ivfflat --lists 100

# Count / delete
rvpg vector count --table docs
rvpg vector delete --table docs --id 1
```

## Sparse Vector Operations

```bash
rvpg sparse insert --table sparse_docs --indices "[0,5,10]" --values "[0.1,0.2,0.3]"
rvpg sparse search --table sparse_docs --query-indices "[0,5]" --query-values "[0.1,0.2]" --top-k 10
rvpg sparse index --table sparse_docs
```

## Hyperbolic Geometry

```bash
rvpg hyperbolic distance --point-a "[0.1,0.2]" --point-b "[0.3,0.4]" --curvature -1.0
rvpg hyperbolic embed --table docs --dimensions 64 --epochs 100
rvpg hyperbolic search --table docs --query "[0.1,0.2]" --top-k 5
```

## Attention Operations

```bash
rvpg attention compute --query "[0.1,0.2]" --keys "[[0.1,0.2],[0.3,0.4]]" --values "[[0.5,0.6],[0.7,0.8]]"
rvpg attention flash --table docs --query "[0.1,0.2]" --block-size 256
rvpg attention multi-head --heads 8 --table docs --query "[0.1,0.2]"
rvpg attention cross --source-table docs --target-table queries --query "[0.1,0.2]"
```

## GNN Operations

```bash
rvpg gnn train --table docs --layers 3 --epochs 100 --hidden-dim 128
rvpg gnn predict --table docs --node-id 1
rvpg gnn embed --table docs --dimensions 64 --output gnn_embeddings
rvpg gnn status
```

## Graph / Cypher

```bash
rvpg graph create-node --label Person --props '{"name":"Alice","age":30}'
rvpg graph create-edge --from 1 --to 2 --label KNOWS --props '{"since":2024}'
rvpg graph query "MATCH (n:Person) RETURN n"
rvpg graph query "MATCH (a)-[:KNOWS]->(b) RETURN a.name, b.name"
rvpg graph neighbors --node-id 1 --depth 2 --direction out
rvpg graph stats
```

## Agent Routing and Quantization

```bash
rvpg routing create --name my-router --dimensions 384
rvpg routing add-route --router my-router --name greeting --utterances "hello,hi,hey"
rvpg routing route --router my-router --input "hello there"

rvpg quantization apply --table docs --type int8    # or binary, product, scalar
rvpg quantization stats --table docs
```

## Self-Learning / ReasoningBank

```bash
rvpg learning store --key "pattern-auth" --value "JWT with refresh tokens" --namespace patterns
rvpg learning search --query "authentication patterns" --namespace patterns --limit 5
rvpg learning retrieve --key "pattern-auth" --namespace patterns
rvpg learning stats
```

## Benchmarking

```bash
rvpg bench --type insert --count 100000 --dimensions 768
rvpg bench --type search --queries 10000 --top-k 10
rvpg bench --type mixed --duration 60 --threads 4
```

Env vars: `RUVECTOR_PG_CONNECTION` (default `postgresql://localhost:5432`), `RUVECTOR_PG_DATA_DIR`, `RUVECTOR_PG_PORT`, `RUVECTOR_PG_LOG_LEVEL`.

## Source Packages

- [@ruvector/postgres-cli](https://www.npmjs.com/package/@ruvector/postgres-cli) -- PostgreSQL AI vector database CLI
