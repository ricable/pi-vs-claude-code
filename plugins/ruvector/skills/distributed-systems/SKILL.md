---
name: "distributed-systems"
description: "Raft consensus, cluster sharding, data replication with vector clocks, adaptive burst scaling, and RVF COW branching for distributed vector search."
---

# Distributed Systems

> Consolidated from: `@ruvector/raft`, `@ruvector/cluster`, `@ruvector/replication`, `@ruvector/burst-scaling`. Part of the [RuVector Plugin](../../SKILL.md).

## RVF COW Branching (RVCOW)

RVF provides Git-like copy-on-write branching at cluster granularity. Instead of copying entire vector stores for distribution, a derived file stores only changed clusters. A 1M-vector parent (~512 MB) with 100 edits produces a ~2.5 MB child.

| Feature | Value |
|---------|-------|
| Branch creation (10K vecs) | 2.6ms, child = 162 bytes |
| Branch creation (100K vecs) | 6.8ms, child = 162 bytes |
| CowMap lookup | 28ns |
| Membership filter | 23-33ns per contains() |
| Snapshot freeze | 30-52ns (metadata-only, no copy) |

```bash
rvf derive parent.rvf child.rvf --type filter     # COW branch
rvf filter child.rvf --include "1,2,3,4,5"        # Membership filter
rvf freeze child.rvf                               # Immutable snapshot
rvf rebuild-refcounts parent.rvf                   # Recompute from COW map
```

**Multi-tenant pattern:** Branches share the parent's HNSW index. A membership filter (dense bitmap) controls which vectors are visible per branch. Excluded nodes still serve as routing waypoints during graph traversal but are never returned in results.

## Package Overview

| Package | Purpose | Runtime |
|---------|---------|---------|
| `@ruvector/raft` | Raft consensus, leader election, log replication | Node.js |
| `@ruvector/cluster` | Auto-sharding, scatter-gather search, node discovery | Node.js |
| `@ruvector/replication` | Vector clocks, CRDTs, multi-node sync | Node.js |
| `@ruvector/burst-scaling` | 10-50x traffic spike handling, backpressure | Node.js |

## Core API

### RaftNode

```typescript
import { RaftNode } from '@ruvector/raft';
const node = new RaftNode({
  id: 'node-1', peers: ['node-2', 'node-3'],
  electionTimeout: [150, 300], heartbeatInterval: 50,
  transport: 'tcp', address: 'localhost:9001', dataDir: './raft-data',
});
await node.start();
await node.propose({ type: 'SET', key: 'config', value: data });
node.onApply((cmd) => myStore.apply(cmd));
```

### ClusterManager

```typescript
import { ClusterManager } from '@ruvector/cluster';
const cluster = new ClusterManager({
  nodeId: 'node-1', listenPort: 9100,
  seedNodes: ['localhost:9101', 'localhost:9102'],
  shardCount: 8, replicationFactor: 2, consensus: 'raft',
});
await cluster.start();
await cluster.insert(vectors);  // Auto-routed to correct shard
const results = await cluster.search(queryVec, 10, { consistency: 'quorum' });
```

### ReplicationManager

```typescript
import { ReplicationManager } from '@ruvector/replication';
const mgr = new ReplicationManager({
  nodes: [{ id: 'us-east', address: 'us-east:9001' }, { id: 'eu-west', address: 'eu-west:9001' }],
  localNodeId: 'us-east', replicationFactor: 3,
  consistencyLevel: 'quorum',       // 'one' | 'quorum' | 'all'
  conflictResolution: 'last-write-wins', // also: 'vector-clock', 'custom'
});
await mgr.write('key', value);
const counter = mgr.crdt('views', 'g-counter'); // CRDTs: G-Counter, PN-Counter, LWW-Register, OR-Set
```

### BurstScaler

```typescript
import { BurstScaler, CircuitBreaker } from '@ruvector/burst-scaling';
const scaler = new BurstScaler({
  baseWorkers: 4, maxWorkers: 64,
  scaleUpThreshold: 0.8, maxQueueSize: 10_000, targetLatencyMs: 50,
});
const scaledSearch = scaler.wrap(async (q) => index.search(q, 10));
const metrics = scaler.metrics(); // { activeWorkers, queueDepth, p99LatencyMs }
```

## Common Patterns

### Fault-Tolerant Store

```typescript
const node = new RaftNode({ id: 'kv-1', peers: ['kv-2', 'kv-3'] });
await node.start();
node.onApply(cmd => kvStore.apply(cmd));
if (node.isLeader()) await node.propose(command);
else await forwardToLeader(node.getLeader(), command);
```

## Related

- [Workflow](../../workflows/05-distributed-cluster.md)
- [RVF Cognitive Containers](../../workflows/15-rvf-cognitive-containers.md)
