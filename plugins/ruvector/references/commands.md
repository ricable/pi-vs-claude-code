# RuVector Unified CLI Command Reference

Merged reference for all RuVector CLI tools: `rrvf` (Rust), `ruvector`, `@ruvector/cli`, `@ruvector/postgres-cli`, and `@ruvector/ruvllm-cli`.

---

## RVF CLI (Rust -- `rvf-cli`)

The RVF CLI provides 17 subcommands for complete lifecycle management of `.rvf` cognitive containers.

### Install

```bash
cargo install rvf-cli
# or build from source:
cd crates/rvf && cargo build -p rvf-cli --release
```

### Core Commands

```bash
rvf create vectors.rvf --dimension 384
rvf ingest vectors.rvf --input data.json --format json     # Also: npy, csv
rvf query  vectors.rvf --vector "0.1,0.2,..." --k 10
rvf delete vectors.rvf --ids "1,2,3"
rvf status vectors.rvf [--json]
rvf inspect vectors.rvf                  # Show all 20 segment types
rvf compact vectors.rvf                  # Reclaim deleted space
```

### COW Branching

```bash
rvf derive parent.rvf child.rvf --type filter   # COW branch (2.6ms for 10K vecs)
rvf filter child.rvf --include "1,2,3,4,5"      # Membership visibility control
rvf freeze child.rvf                             # Immutable snapshot
rvf rebuild-refcounts parent.rvf                 # Recompute from COW map chain
```

### Cognitive Container Operations

```bash
rvf serve  vectors.rvf --port 8080               # HTTP REST + TCP server
rvf launch vectors.rvf                           # Boot as Linux microVM (QEMU)
rvf embed-kernel vectors.rvf [--arch x86_64]     # Embed Linux kernel image
rvf embed-ebpf vectors.rvf --program src.c       # Compile and embed eBPF
```

### Security & Trust

```bash
rvf verify-witness vectors.rvf                   # Verify witness chain integrity
rvf verify-attestation vectors.rvf               # Verify KernelBinding + TEE
```

### Machine-Readable Output

```bash
rvf status vectors.rvf --json
rvf inspect vectors.rvf --json
```

---

## Database Operations

### Create / Initialize

```bash
npx ruvector@latest create --dimensions 384 --metric cosine
npx ruvector@latest create --dimensions 768 --metric euclidean --persist ./mydb
npx @ruvector/cli@latest init --dimensions 384 --metric cosine --persist ./data
```

| Option | Description | Default |
|--------|-------------|---------|
| `--dimensions` | Vector dimensionality (required) | - |
| `--metric` | `cosine`, `euclidean`, `dot` | `cosine` |
| `--persist` | Persistence directory | In-memory |
| `--name` | Database name | `default` |

### Insert

```bash
npx ruvector@latest insert --id vec-1 --vector "[0.1, 0.2]"
npx ruvector@latest insert --id vec-1 --vector "[0.1, 0.2]" --metadata '{"label":"test"}'
npx ruvector@latest insert --file vectors.json
npx ruvector@latest insert --file data.ndjson --format ndjson --batch-size 5000
```

| Option | Description | Default |
|--------|-------------|---------|
| `--id` | Vector identifier | Auto-generated |
| `--vector` | Vector as JSON array | - |
| `--metadata` | JSON metadata | `{}` |
| `--file` | Bulk insert from file | - |
| `--format` | `json`, `ndjson`, `csv` | `json` |
| `--batch-size` | Batch size for bulk ops | `1000` |

### Search

```bash
npx ruvector@latest search --query "[0.1, 0.2]" --top-k 10
npx ruvector@latest search --query "[0.1, 0.2]" --ef-search 200 --threshold 0.8
npx ruvector@latest search --query "[0.1, 0.2]" --filter '{"label":"test"}'
npx ruvector@latest search --text "hello world" --top-k 10
```

| Option | Description | Default |
|--------|-------------|---------|
| `--query` | Query vector as JSON array | - |
| `--text` | Text query (requires embedding model) | - |
| `--top-k` | Number of results | `10` |
| `--ef-search` | HNSW search parameter | `50` |
| `--filter` | Metadata filter as JSON | - |
| `--threshold` | Minimum similarity score | `0.0` |
| `--include-metadata` | Include metadata in results | `true` |
| `--include-vectors` | Include vectors in results | `false` |

### Delete

```bash
npx ruvector@latest delete --id vec-1
npx ruvector@latest delete --ids "vec-1,vec-2,vec-3"
npx ruvector@latest delete --filter '{"label":"test"}'
npx @ruvector/cli@latest delete --all --confirm
```

### Info / Stats

```bash
npx ruvector@latest info
npx ruvector@latest info --format json
npx ruvector@latest count
npx @ruvector/cli@latest stats --format json
```

### Import / Export

```bash
npx ruvector@latest export --output vectors.json
npx ruvector@latest export --output vectors.ndjson --format ndjson
npx ruvector@latest import --file vectors.json
npx @ruvector/cli@latest import --file backup.json --merge
```

---

## Index Management

### Build

```bash
npx ruvector@latest index build
npx ruvector@latest index build --ef-construction 200 --m 16
npx ruvector@latest index build --ef-construction 400 --m 32 --threads 4
```

| Option | Description | Default |
|--------|-------------|---------|
| `--ef-construction` | Build quality parameter | `200` |
| `--m` | Max connections per layer | `16` |
| `--threads` | Build threads | Auto |
| `--force` | Rebuild if exists | `false` |

### Status / Optimize / Rebuild

```bash
npx ruvector@latest index status
npx ruvector@latest index optimize --target-recall 0.99
npx ruvector@latest index rebuild --ef-construction 400
```

---

## Server

```bash
npx ruvector@latest serve --port 8080
npx ruvector@latest serve --port 8080 --grpc 50051
npx ruvector@latest serve --port 8080 --cors --auth-token $TOKEN
npx ruvector@latest serve --tls --cert cert.pem --key key.pem
npx ruvector@latest serve --persist ./data --max-connections 1000
```

| Option | Description | Default |
|--------|-------------|---------|
| `--port` | HTTP port | `8080` |
| `--grpc` | gRPC port | Disabled |
| `--host` | Bind address | `0.0.0.0` |
| `--cors` | Enable CORS | `false` |
| `--auth-token` | Bearer token | - |
| `--tls` | Enable TLS | `false` |
| `--cert` / `--key` | TLS certificate paths | - |
| `--persist` | Storage directory | In-memory |
| `--max-connections` | Max concurrent connections | `1000` |

---

## Self-Learning Hooks

```bash
# Pre-task: get agent suggestions
npx @ruvector/cli@latest hooks pre-task --task "implement auth" --context '{"file":"auth.ts"}'

# Post-task: record outcome
npx @ruvector/cli@latest hooks post-task --task "implement auth" --success true \
  --reward 0.9 --critique "Good test coverage"

# Route to optimal agent
npx @ruvector/cli@latest hooks route --task "review code" --strategy q-learn

# Explain routing decision
npx @ruvector/cli@latest hooks explain --task "code review"

# View learning metrics
npx @ruvector/cli@latest hooks metrics --format json --period 7d

# Bootstrap from repository
npx @ruvector/cli@latest hooks pretrain --repo ./my-project --with-embeddings
```

| Option | Description | Default |
|--------|-------------|---------|
| `--task` | Task description (required) | - |
| `--success` | Whether task succeeded | - |
| `--reward` | Quality score 0.0-1.0 | - |
| `--critique` | Self-critique text | - |
| `--strategy` | `q-learn`, `round-robin`, `least-loaded` | `q-learn` |

---

## Benchmarking

```bash
# Hub / CLI benchmarks
npx ruvector@latest bench --dimensions 384 --count 10000
npx ruvector@latest bench --mode search --queries 1000
npx ruvector@latest bench --mode mixed --duration 60 --threads 4
npx @ruvector/cli@latest bench --mode hnsw --ef-values "50,100,200,400"

# PostgreSQL benchmarks
npx @ruvector/postgres-cli@latest bench --type insert --count 10000 --dimensions 384
npx @ruvector/postgres-cli@latest bench --type search --queries 1000
npx @ruvector/postgres-cli@latest bench --type sparse --count 5000 --sparsity 0.95
```

| Option | Description | Default |
|--------|-------------|---------|
| `--dimensions` | Vector dimensions | `384` |
| `--count` | Number of vectors | `10000` |
| `--mode` / `--type` | `insert`, `search`, `mixed`, `hnsw`, `sparse` | `insert` |
| `--queries` | Search query count | `1000` |
| `--duration` | Duration in seconds | `30` |
| `--threads` | Concurrent threads | `1` |
| `--output` | Results output file | stdout |

---

## PostgreSQL Operations

### Infrastructure

```bash
npx @ruvector/postgres-cli@latest install [--data-dir DIR] [--port 5432]
npx @ruvector/postgres-cli@latest uninstall [--keep-data]
npx @ruvector/postgres-cli@latest start [--port 5432] [--background]
npx @ruvector/postgres-cli@latest stop [--force]
npx @ruvector/postgres-cli@latest status [--format json]
npx @ruvector/postgres-cli@latest logs [--follow] [--lines 100]
npx @ruvector/postgres-cli@latest psql [command] [--file query.sql]
npx @ruvector/postgres-cli@latest extension [--upgrade] [--version 0.2.6]
npx @ruvector/postgres-cli@latest info
npx @ruvector/postgres-cli@latest memory
```

### Dense Vectors

```bash
npx @ruvector/postgres-cli@latest vector insert --table docs --id 1 --vector "[0.1,0.2]"
npx @ruvector/postgres-cli@latest vector insert --table docs --file embeddings.json
npx @ruvector/postgres-cli@latest vector search --table docs --query "[0.1,0.2]" --top-k 10
npx @ruvector/postgres-cli@latest vector index --table docs --type hnsw --ef-construction 200
npx @ruvector/postgres-cli@latest vector count --table docs
npx @ruvector/postgres-cli@latest vector delete --table docs --id 1
```

### Sparse Vectors

```bash
npx @ruvector/postgres-cli@latest sparse insert --table t --indices "[0,5]" --values "[0.1,0.2]"
npx @ruvector/postgres-cli@latest sparse search --table t --query-indices "[0,5]" --query-values "[0.1,0.2]"
npx @ruvector/postgres-cli@latest sparse index --table t
```

### Hyperbolic Geometry

```bash
npx @ruvector/postgres-cli@latest hyperbolic distance --point-a "[0.1,0.2]" --point-b "[0.3,0.4]"
npx @ruvector/postgres-cli@latest hyperbolic embed --table docs --curvature -1.0 --dimensions 64
npx @ruvector/postgres-cli@latest hyperbolic search --table docs --query "[0.1,0.2]" --top-k 5
```

### Routing (Tiny Dancer)

```bash
npx @ruvector/postgres-cli@latest routing create --name my-router --dimensions 384
npx @ruvector/postgres-cli@latest routing add-route --router my-router --name greeting --utterances "hello,hi"
npx @ruvector/postgres-cli@latest routing route --router my-router --input "hello there"
npx @ruvector/postgres-cli@latest routing stats --router my-router
npx @ruvector/postgres-cli@latest routing list
npx @ruvector/postgres-cli@latest routing delete --router my-router
```

### Quantization

```bash
npx @ruvector/postgres-cli@latest quantization apply --table docs --type int8
npx @ruvector/postgres-cli@latest quantization apply --table docs --type binary
npx @ruvector/postgres-cli@latest quantization apply --table docs --type product --subvectors 8
npx @ruvector/postgres-cli@latest quantization stats --table docs
npx @ruvector/postgres-cli@latest quantization remove --table docs
```

### Attention

```bash
npx @ruvector/postgres-cli@latest attention compute --query "[0.1,0.2]" --keys "[[0.1],[0.2]]" --values "[[0.3],[0.4]]"
npx @ruvector/postgres-cli@latest attention flash --table docs --query "[0.1,0.2]" --block-size 256
npx @ruvector/postgres-cli@latest attention multi-head --heads 8 --table docs --query "[0.1,0.2]"
npx @ruvector/postgres-cli@latest attention cross --source-table docs --target-table queries --query "[0.1,0.2]"
```

### GNN

```bash
npx @ruvector/postgres-cli@latest gnn train --table docs --layers 3 --epochs 100 --hidden-dim 128
npx @ruvector/postgres-cli@latest gnn predict --table docs --node-id 1
npx @ruvector/postgres-cli@latest gnn embed --table docs --dimensions 64 --output gnn_embeddings
npx @ruvector/postgres-cli@latest gnn status
```

### Graph / Cypher

```bash
npx @ruvector/postgres-cli@latest graph create-node --label Person --props '{"name":"Alice"}'
npx @ruvector/postgres-cli@latest graph create-edge --from 1 --to 2 --label KNOWS
npx @ruvector/postgres-cli@latest graph query "MATCH (n:Person) RETURN n"
npx @ruvector/postgres-cli@latest graph neighbors --node-id 1 --depth 2
npx @ruvector/postgres-cli@latest graph delete-node --id 1
npx @ruvector/postgres-cli@latest graph delete-edge --id 1
npx @ruvector/postgres-cli@latest graph stats
```

### Self-Learning

```bash
npx @ruvector/postgres-cli@latest learning store --key "pattern-auth" --value "JWT with refresh" --namespace patterns
npx @ruvector/postgres-cli@latest learning search --query "authentication" --namespace patterns --limit 5
npx @ruvector/postgres-cli@latest learning retrieve --key "pattern-auth" --namespace patterns
npx @ruvector/postgres-cli@latest learning list --namespace patterns --limit 10
npx @ruvector/postgres-cli@latest learning stats --namespace patterns
npx @ruvector/postgres-cli@latest learning delete --key "pattern-auth" --namespace patterns
```

---

## RuvLLM CLI (`ruvllm` — v2.4.1)

```bash
# Route a task to Claude Code agent (100% hybrid accuracy)
ruvllm route "add unit tests for auth module"
# → Agent: tester | Confidence: 0.96 | Tier: 2

# Query with streaming
ruvllm query --stream "Explain machine learning"

# Download models from HuggingFace
ruvllm download ruv/ruvltra

# Run benchmarks
ruvllm bench ./models/model.gguf

# SWE-Bench evaluation
ruvllm eval --model ./models/model.gguf --subset lite
```

---

## LLM Operations (ruvllm-cli)

### Inference

```bash
npx @ruvector/ruvllm-cli@latest run --model ./model.gguf --prompt "Explain HNSW"
npx @ruvector/ruvllm-cli@latest run --model ./model.gguf --prompt "Hello" --gpu --max-tokens 256
npx @ruvector/ruvllm-cli@latest run --model ./model.gguf --prompt "Review code" --temperature 0.3
```

| Option | Description | Default |
|--------|-------------|---------|
| `--model` | Model file path (GGUF) | - |
| `--prompt` | Input prompt | - |
| `--system` | System prompt | - |
| `--max-tokens` | Max output tokens | `512` |
| `--temperature` | Sampling temperature | `0.7` |
| `--gpu` | Enable GPU (Metal/CUDA) | `false` |
| `--threads` | CPU threads | Auto |
| `--ctx-size` | Context window size | `2048` |

### Chat

```bash
npx @ruvector/ruvllm-cli@latest chat --model ./model.gguf --gpu
npx @ruvector/ruvllm-cli@latest chat --model ./model.gguf --system "You are a coding assistant"
```

### Model Management

```bash
npx @ruvector/ruvllm-cli@latest download TheBloke/Llama-2-7B-GGUF --quantization q4_k_m
npx @ruvector/ruvllm-cli@latest models list
npx @ruvector/ruvllm-cli@latest models info <name>
npx @ruvector/ruvllm-cli@latest models delete <name>
npx @ruvector/ruvllm-cli@latest models search <query>
npx @ruvector/ruvllm-cli@latest info <model-path>
npx @ruvector/ruvllm-cli@latest quantize <input> <output> --type q4_k_m
```

### LLM Server (OpenAI-Compatible)

```bash
npx @ruvector/ruvllm-cli@latest serve --model ./model.gguf --port 8080 --gpu
npx @ruvector/ruvllm-cli@latest serve --model ./model.gguf --cors --api-key my-secret
```

API endpoints: `/v1/chat/completions`, `/v1/completions`, `/v1/embeddings`, `/v1/models`, `/health`

### Embeddings

```bash
npx @ruvector/ruvllm-cli@latest embed --model ./model.gguf --text "input text"
npx @ruvector/ruvllm-cli@latest embed --model ./model.gguf --file texts.txt --output embeddings.json
```

### LLM Benchmark

```bash
npx @ruvector/ruvllm-cli@latest bench --model ./model.gguf --iterations 10 --gpu
```

---

## Configuration

```bash
npx ruvector@latest config show
npx ruvector@latest config set --key ef-search --value 100
npx ruvector@latest config reset
```

---

## Global Options

All commands support:

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help |
| `-V, --version` | Show version |
| `-v, --verbose` | Verbose output |
| `-q, --quiet` | Suppress non-essential output |
| `--format` | Output: `text`, `json`, `table` |
| `--no-color` | Disable colored output |

---

## RVF MCP Server

```bash
# Start MCP server for AI agent integration
npx @ruvector/rvf-mcp-server --transport stdio           # Claude Code / Cursor
npx @ruvector/rvf-mcp-server --transport sse --port 3100  # Web clients
```

Available MCP tools: `rvf_create_store`, `rvf_open_store`, `rvf_close_store`, `rvf_ingest`, `rvf_query`, `rvf_delete`, `rvf_delete_filter`, `rvf_compact`, `rvf_status`, `rvf_list_stores`

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RUVECTOR_DATA_DIR` | Default data directory | `./ruvector-data` |
| `RUVECTOR_PORT` | Default server port | `8080` |
| `RUVECTOR_AUTH_TOKEN` | Authentication token | - |
| `RUVECTOR_LOG_LEVEL` | `debug`, `info`, `warn`, `error` | `info` |
| `RUVECTOR_THREADS` | Default thread count | Auto |
| `RUVECTOR_PG_CONNECTION` | PostgreSQL connection | `postgresql://localhost:5432` |
| `RUVECTOR_PG_DATA_DIR` | PostgreSQL data dir | `~/.ruvector/data` |
| `RUVLLM_MODEL_DIR` | Default model directory | - |
| `RUVLLM_GPU` | Enable GPU by default | `0` |
| `HF_TOKEN` | Hugging Face token | - |
