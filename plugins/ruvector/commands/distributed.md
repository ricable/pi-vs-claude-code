# Distributed Systems

> Part of the [RuVector Plugin](../SKILL.md). See also: [vector-search](vector-search.md), [quickstart](quickstart.md).

## Raft Consensus Setup

```typescript
import { RaftNode } from '@ruvector/raft';

const node = new RaftNode({
  id: 'node-1',
  peers: ['node-2', 'node-3'],
  electionTimeout: [150, 300],    // min/max ms
  heartbeatInterval: 50,          // ms
  transport: 'tcp',               // 'tcp' | 'websocket' | 'memory'
  address: 'localhost:9001',
  dataDir: './raft-data',
  snapshotInterval: 10000,
});

await node.start();

// Propose a command (only works on leader)
await node.propose({ type: 'SET', key: 'users:1', value: { name: 'Alice' } });

// Register state machine
node.onApply((command) => {
  if (command.type === 'SET') myStore.set(command.key, command.value);
  if (command.type === 'DELETE') myStore.delete(command.key);
});

// Leader election
const leader = node.getLeader();
const isLeader = node.isLeader();

// Membership changes
await node.addPeer('node-4', 'localhost:9004');
await node.removePeer('node-3');
const members = node.getMembers();
```

| Feature | Value |
|---------|-------|
| Consistency | Strong (linearizable) |
| Fault tolerance | (N-1)/2 node failures |
| Leader election | Randomized timeout |
| Log compaction | Snapshots |
| Transports | TCP, WebSocket, In-memory |

## Cluster Configuration

```typescript
import { ClusterManager } from '@ruvector/cluster';

const cluster = new ClusterManager({
  nodeId: 'node-1',
  listenPort: 9100,
  seedNodes: ['localhost:9101', 'localhost:9102'],
  shardCount: 8,
  replicationFactor: 2,
  consensus: 'raft',             // 'raft' | 'gossip'
  heartbeatInterval: 1000,
  electionTimeout: 5000,
  dataDir: './data',
});

await cluster.start();
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `nodeId` | `string` | Required | Unique node identifier |
| `shardCount` | `number` | `8` | Number of shards |
| `replicationFactor` | `number` | `1` | Copies per shard |
| `consensus` | `'raft' \| 'gossip'` | `'raft'` | Consensus protocol |

## Sharding and Search

```typescript
// Insert -- automatically routed to correct shard via consistent hashing
await cluster.insert([
  { id: 'vec-1', vector: new Float32Array([0.1, 0.2, 0.3]), metadata: { label: 'a' } },
  { id: 'vec-2', vector: new Float32Array([0.4, 0.5, 0.6]), metadata: { label: 'b' } },
]);

// Scatter-gather search across all shards
const results = await cluster.search(new Float32Array([0.1, 0.2, 0.3]), 10, {
  efSearch: 100,
  filter: { field: 'category', op: 'eq', value: 'electronics' },
  timeout: 5000,
  consistency: 'quorum',   // 'one' | 'quorum' | 'all'
});

// Node management
await cluster.addNode({ nodeId: 'node-3', address: 'host3:9100', weight: 1.0 });
await cluster.removeNode('node-3');
await cluster.rebalance();

// Cluster health
const status = await cluster.status();
// { activeNodes: 3, totalShards: 8, leader: 'node-1', shardDistribution: {...} }
```

## Replication with Vector Clocks

```typescript
import { ReplicationManager } from '@ruvector/replication';

const mgr = new ReplicationManager({
  nodes: [
    { id: 'node-1', address: 'localhost:9001' },
    { id: 'node-2', address: 'localhost:9002' },
    { id: 'node-3', address: 'localhost:9003' },
  ],
  localNodeId: 'node-1',
  replicationFactor: 3,
  consistencyLevel: 'quorum',          // 'one' | 'quorum' | 'all'
  conflictResolution: 'last-write-wins', // 'last-write-wins' | 'vector-clock' | 'custom'
  syncInterval: 30000,                 // Anti-entropy sync interval (ms)
});

await mgr.start();

// Write with replication
await mgr.write('key', value, { consistencyLevel: 'quorum' });

// Read with consistency level
const result = await mgr.read('key', { quorum: 2 });

// Conflict resolution
const conflicts = mgr.getConflicts();
await mgr.resolve('key', 'last-write-wins');
await mgr.resolve('key', 'merge', mergeFn);

// CRDTs
const counter = mgr.crdt('page-views', 'g-counter');
counter.increment(1);
const totalViews = counter.value(); // Globally convergent
```

| Feature | Value |
|---------|-------|
| Consistency levels | ONE, QUORUM, ALL |
| Conflict detection | Vector clocks |
| Resolution | LWW, vector-clock, merge, manual |
| CRDT types | G-Counter, PN-Counter, LWW-Register, OR-Set |
| Anti-entropy | Merkle tree-based sync |

## Burst Scaling

```typescript
import { BurstScaler, CircuitBreaker, BackpressureQueue } from '@ruvector/burst-scaling';

// Wrap any async handler with auto-scaling (handles 10-50x spikes)
const scaler = new BurstScaler({
  baseWorkers: 4,
  maxWorkers: 64,
  scaleUpThreshold: 0.8,       // Scale at 80% utilization
  scaleDownThreshold: 0.2,
  maxQueueSize: 10_000,
  targetLatencyMs: 50,
});

const scaledSearch = scaler.wrap(async (query) => index.search(query, 10));
const results = await scaledSearch(queryVector);

// Metrics
const metrics = scaler.metrics();
// { activeWorkers, queueDepth, p99LatencyMs, requestsPerSec, ... }

// Circuit breaker
const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  halfOpenRequests: 3,
});
const protectedSearch = breaker.wrap(remoteSearch);
```

## Monitoring

```typescript
// Cluster events
cluster.on('node:joined', (nodeId) => console.log(`Node ${nodeId} joined`));
cluster.on('node:left', (nodeId) => console.log(`Node ${nodeId} left`));
cluster.on('shard:rebalanced', (info) => console.log('Rebalance complete', info));
cluster.on('leader:elected', (leaderId) => console.log(`New leader: ${leaderId}`));

// Burst scaler events
scaler.on('scale:up', (from, to) => console.log(`Scaled ${from} -> ${to} workers`));
scaler.on('scale:down', (from, to) => console.log(`Scaled ${from} -> ${to} workers`));
scaler.on('queue:full', () => console.log('Queue at capacity'));
```

## Source Packages

- [@ruvector/raft](https://www.npmjs.com/package/@ruvector/raft) -- Raft consensus, leader election, log replication
- [@ruvector/cluster](https://www.npmjs.com/package/@ruvector/cluster) -- Distributed clustering, auto-sharding
- [@ruvector/replication](https://www.npmjs.com/package/@ruvector/replication) -- Vector clocks, conflict resolution, CRDTs
- [@ruvector/burst-scaling](https://www.npmjs.com/package/@ruvector/burst-scaling) -- Adaptive burst scaling, circuit breakers
