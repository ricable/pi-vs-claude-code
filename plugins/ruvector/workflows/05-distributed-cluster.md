# Workflow 5: Distributed Vector Database

> Back to [RuVector Hub](../SKILL.md)

**Goal:** Deploy a fault-tolerant, horizontally-scalable vector database cluster.

### Step 1: Set Up Raft Consensus

```typescript
import { RaftNode } from '@ruvector/raft';

const node = new RaftNode({
  id: 'node-1',
  peers: ['node-2', 'node-3'],
  electionTimeout: [150, 300],
  heartbeatInterval: 50,
});

await node.start();
node.onApply((cmd) => vectorStore.apply(cmd));
```

### Step 2: Configure Cluster

```typescript
import { ClusterManager } from '@ruvector/cluster';

const cluster = new ClusterManager({
  nodeId: 'node-1',
  listenPort: 9100,
  seedNodes: ['localhost:9101', 'localhost:9102'],
  shardCount: 8,
  replicationFactor: 2,
  consensus: 'raft',
});

await cluster.start();
```

### Step 3: Enable Replication

```typescript
import { ReplicationManager } from '@ruvector/replication';

const replication = new ReplicationManager({
  nodes: [
    { id: 'node-1', address: 'localhost:9001' },
    { id: 'node-2', address: 'localhost:9002' },
    { id: 'node-3', address: 'localhost:9003' },
  ],
  localNodeId: 'node-1',
  replicationFactor: 3,
  consistencyLevel: 'quorum',
  conflictResolution: 'last-write-wins',
});

await replication.start();
```

### Step 4: Burst Scaling

```typescript
import { BurstScaler } from '@ruvector/burst-scaling';

const scaler = new BurstScaler({
  baseWorkers: 4,
  maxWorkers: 200,
  scaleUpThreshold: 0.8,
  scaleDownThreshold: 0.3,
});

const handler = scaler.wrap(async (request) => {
  return await cluster.search(request.query, 10);
});
```

### Step 5: Monitor

```typescript
const status = await cluster.status();
// { nodes: 3, shards: 8, leader: 'node-1', healthy: true }

const conflicts = replication.getConflicts();
const metrics = scaler.metrics();
// { utilization: 0.45, p50: 2.1, p99: 8.5, throughput: 12000 }
```

**Related skills:** `ruvector-raft`, `ruvector-cluster`, `ruvector-replication`, `ruvector-burst-scaling`, `ruvector-server`
