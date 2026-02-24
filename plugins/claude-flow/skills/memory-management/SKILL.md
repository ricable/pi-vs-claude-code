---
name: claude-flow-memory-management
description: >
  HNSW vector memory management via AgentDB. Use for storing learned patterns, semantic search
  across agent knowledge, cross-session persistence, namespace isolation, and TTL-based expiry.
  Provides 150x-12,500x faster search than brute-force via Hierarchical Navigable Small World indexing.
---

# Memory Management (AgentDB + HNSW)

## Core Operations

### Store
```bash
# Required: --key, --value
# Optional: --namespace, --ttl, --tags
npx @claude-flow/cli@latest memory store \
  --key "pattern-auth" \
  --value "JWT with refresh tokens, httpOnly cookies, 15min access / 7d refresh" \
  --namespace patterns \
  --tags "auth,security,jwt"
```

### Search (Semantic, HNSW-indexed)
```bash
# Required: --query
# Optional: --namespace, --limit, --threshold
npx @claude-flow/cli@latest memory search \
  --query "authentication patterns" \
  --namespace patterns \
  --limit 5
```

### Retrieve (Exact key)
```bash
npx @claude-flow/cli@latest memory retrieve --key "pattern-auth" --namespace patterns
```

### List
```bash
npx @claude-flow/cli@latest memory list --namespace patterns --limit 10
```

### Delete
```bash
npx @claude-flow/cli@latest memory delete --key "pattern-auth" --namespace patterns
```

## Namespace Strategy

Organize memory by domain:

| Namespace | Purpose | Example Keys |
|-----------|---------|-------------|
| `patterns` | Reusable code patterns | `pattern-auth`, `pattern-api-error` |
| `decisions` | Architecture decisions | `adr-001-memory`, `adr-002-routing` |
| `sessions` | Session state snapshots | `session-2024-01-15` |
| `metrics` | Performance baselines | `benchmark-api-latency` |
| `errors` | Error resolution history | `fix-timeout-db`, `fix-cors` |
| `agents` | Agent-specific state | `coder-1-context`, `tester-2-results` |

## HNSW Configuration

HNSW (Hierarchical Navigable Small World) provides fast approximate nearest-neighbor search:

- **M**: Max connections per node (default: 16)
- **efConstruction**: Build-time search width (default: 200)
- **efSearch**: Query-time search width (default: 50)

Higher values = better recall but slower. Defaults work well for most workloads.

## Memory Backend Options

| Backend | Persistence | Speed | Use Case |
|---------|------------|-------|----------|
| SQLite | Disk | Fast | Default, single-machine |
| Hybrid | Disk + RAM | Fastest | Production, hot/cold tiers |
| In-memory | RAM only | Fastest | Testing, ephemeral |

Database location: `.swarm/memory.db`

## Cross-Agent Memory Sharing

All agents in a swarm share memory via namespace:

```bash
# Agent 1 stores a finding
npx @claude-flow/cli@latest memory store --key "api-schema" --value "..." --namespace shared

# Agent 2 retrieves it
npx @claude-flow/cli@latest memory retrieve --key "api-schema" --namespace shared
```

## TTL and Expiry

```bash
# Store with 1-hour TTL
npx @claude-flow/cli@latest memory store --key "temp-result" --value "..." --ttl 3600

# Store with 24-hour TTL
npx @claude-flow/cli@latest memory store --key "daily-cache" --value "..." --ttl 86400
```

## EWC++ (Elastic Weight Consolidation)

Prevents catastrophic forgetting when consolidating patterns:
- Fisher information matrix identifies important weights
- Regularization term prevents overwriting critical patterns
- Automatic consolidation during DISTILL phase of self-learning pipeline

## MCP Memory Tools

Via MCP server:
- `memory_store` - Store key-value with metadata
- `memory_search` - Semantic HNSW search
- `memory_retrieve` - Exact key lookup
- `memory_list` - List entries by namespace
- `memory_delete` - Remove entries
- `memory_stats` - Storage statistics
