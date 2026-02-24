# Pi Swarm Demo: 10 Domain Experts with Federated Learning

## Executive Summary

This plan outlines a demo of 10 Pi agents on different domains working together using local/cheap models, intelligent routing, and federated hierarchical learning with HNSW vector indexes for consensus convergence.

---

## Phase 1: Agent Mapping (Claude Code → Pi)

### Core Agents to Port

| Claude Code Agent | Pi Agent | Domain | Model Tier |
|-----------------|----------|--------|------------|
| `coder` | `pi-coder` | Development | Medium (ruvltra-medium-1.1b) |
| `reviewer` | `pi-reviewer` | Development | Medium |
| `tester` | `pi-tester` | Testing | Low (ruvltra-small-0.5b) |
| `researcher` | `pi-researcher` | Research | Medium |
| `planner` | `pi-planner` | Strategy | Medium |
| `raft-manager` | `pi-consensus-leader` | Consensus | High (external for critical decisions) |
| `queen-coordinator` | `pi-swarm-orchestrator` | Orchestration | High |
| `swarm-memory-manager` | `pi-memory-coordinator` | Memory | Low |
| `gossip-coordinator` | `pi-gossip-broker` | Communication | Low |
| `byzantine-coordinator` | `pi-security-guardian` | Security | Medium |

### Porting Strategy

1. **Copy agent definition format** from `.claude/agents/` to `.pi/agents/`
2. **Adapt tools** to use Pi's tool schema
3. **Add model tier specification** for intelligent routing
4. **Include HNSW vector capabilities** for similarity search

---

## Phase 2: Architecture Design

### 2.1 Hierarchical Topology

```
                    ┌─────────────────────┐
                    │  pi-swarm-orchestrator  │
                    │  (Queen/Coordinator)    │
                    │  Model: High-tier       │
                    └──────────┬─────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ consensus-leader│    │ memory-coordinator│    │ gossip-broker   │
│ (Raft Leader)  │    │ (HNSW Index)     │    │ (Communication) │
│ Model: High    │    │ Model: Low       │    │ Model: Low      │
└───────┬────────┘    └────────┬────────┘    └────────┬────────┘
        │                      │                      │
        ▼                      ▼                      ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ coder   │ │ reviewer│ │ tester  │ │researcher│ │ planner │
   │(Dev)    │ │(Review) │ │(Test)   │ │(Research)│ │(Strategy)│
   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### 2.2 Model Routing Intelligence

**Tier System:**

| Tier | Latency | Cost | Use Case |
|------|---------|------|----------|
| **Low** | <50ms | $0 | Simple transforms, routing, gossip |
| **Medium** | <200ms | $0.001 | Domain tasks, review, testing |
| **High** | <2s | $0.003+ | Consensus, orchestration, security |

**Routing Logic:**
```
task_complexity = analyze(task)
IF task_complexity < 30% → Low-tier model
ELSE IF task_complexity < 70% → Medium-tier model
ELSE → High-tier model (or external API fallback)
```

### 2.3 RVF (Reciprocal Vector Fusion) for Consensus

**RVF Algorithm:**
1. Each agent maintains a **belief vector** (embedding of their opinion)
2. On consensus round:
   - Agent A sends belief vector to Agent B
   - Agent B computes similarity: `sim(A, B) = cosine_similarity(A.belief, B.belief)`
   - If `sim > threshold`, agents align their vectors
   - If `sim < threshold`, agents engage in **argument exchange**
3. **Hierarchical fusion**: Lower tiers report to higher tiers for final decision

### 2.4 HNSW Vector Index Integration

**Index Structure:**
- **Global HNSW Index** (memory-coordinator): All agent beliefs, memories
- **Local HNSW Index** (each agent): Personal knowledge base
- **Cross-link**: Agents can query global index for relevant context

**Search Parameters:**
- `ef_construction`: 200
- `M`: 16
- `ef_search`: 50

---

## Phase 3: Implementation Plan

### 3.1 Create Pi Agent Definitions

**File Structure:**
```
.pi/agents/
├── swarm/
│   ├── orchestrator.md      # Queen coordinator
│   ├── consensus-leader.md  # Raft manager
│   ├── memory-coordinator.md # HNSW manager
│   ├── gossip-broker.md     # Communication
│   └── security-guardian.md # Byzantine security
├── domains/
│   ├── coder.md             # Development
│   ├── reviewer.md          # Code review
│   ├── tester.md            # Testing
│   ├── researcher.md        # Research
│   └── planner.md           # Strategy
```

### 3.2 Agent Template

```yaml
---
name: pi-{domain}
type: {type}
model_tier: {low|medium|high}
hnsw_enabled: true
consensus_mode: {raft|gossip|byzantine}
tools: {list}
---

# {Domain} Agent

You are a {domain} specialist operating in a federated swarm.

## Model Routing
- Your model tier: {tier}
- Route simple tasks to low-tier
- Escalate complex reasoning to higher tiers

## Consensus Participation
- Participate in RVF consensus rounds
- Maintain belief vector in HNSW index
- Engage in argument exchange when needed

## Learning Protocol
1. Receive task → Process locally
2. Generate belief vector → Store in local HNSW
3. Broadcast to consensus leader → Get aligned
4. Update local knowledge → Report back
```

### 3.3 Federated Learning Protocol

**Round Structure:**
1. **Task Distribution**: Orchestrator assigns task to domain agents
2. **Local Processing**: Each agent processes with local model
3. **Belief Extraction**: Extract embedding of agent's conclusion
4. **HNSW Update**: Update local and global indexes
5. **Consensus Round**:
   - Send belief to consensus-leader
   - Compute similarity with other agents
   - If converged → commit decision
   - If not → engage in argument exchange
6. **Weight Update**: Aggregate learnings into model adjustments

---

## Phase 4: Demo Scenario

### Scenario: "Design a REST API"

**10 Agents Participating:**

| Agent | Role | Model | Task |
|-------|------|-------|------|
| orchestrator | Queen | High | Coordinate overall |
| consensus-leader | Raft | High | Lead consensus |
| memory-coordinator | Memory | Low | Index HNSW |
| gossip-broker | Comms | Low | Route messages |
| security-guardian | Security | Medium | Validate decisions |
| coder | Dev | Medium | Write code |
| reviewer | Review | Medium | Review code |
| tester | Test | Low | Write tests |
| researcher | Research | Medium | Find best patterns |
| planner | Strategy | Medium | Plan architecture |

**Flow:**
1. **Planner** creates API spec → stores in HNSW
2. **Researcher** finds best REST patterns → adds to index
3. **Coder** implements endpoints → sends to reviewer
4. **Reviewer** analyzes code → computes belief vector
5. **Tester** creates test cases → adds to index
6. **Consensus-leader** initiates RVF round:
   - All agents submit belief vectors
   - HNSW similarity search finds clusters
   - Agents with divergent views engage in argument
7. **Security-guardian** validates final decision
8. **Orchestrator** declares consensus reached

### Convergence Metrics

- **Belief Alignment**: Cosine similarity > 0.85 between agents
- **Decision Latency**: < 10 seconds for full round
- **Memory Coherence**: HNSW recall > 0.95

---

## Phase 5: Technical Components

### 5.1 Local Model Server

**Using RuvLLM:**
```bash
# Start local server
ruvllm serve --model ruvltra-medium-1.1b --host localhost --port 8080

# For different tiers
ruvllm serve --model ruvltra-small-0.5b --port 8081  # Low
ruvllm serve --model ruvltra-medium-1.1b --port 8082 # Medium
```

### 5.2 HNSW Integration

**Python Service:**
```python
import hnswlib
import numpy as np

class HNSWIndex:
    def __init__(self, dim=384, max_elements=10000):
        self.index = hnswlib.Index(space='cosine', dim=dim)
        self.index.init_index(max_elements=max_elements, ef_construction=200, M=16)

    def add_agent_belief(self, agent_id: str, belief: np.ndarray):
        self.index.add_items(belief, ids=[agent_id])

    def find_similar(self, belief: np.ndarray, k=5):
        return self.index.knn_query(belief, k=k)
```

### 5.3 Model Router

```python
class ModelRouter:
    def __init__(self):
        self.tiers = {
            'low': 'http://localhost:8081',
            'medium': 'http://localhost:8082',
            'high': 'http://localhost:8083'  # or external
        }

    def route(self, task: str) -> str:
        complexity = self.estimate_complexity(task)
        if complexity < 0.3:
            return self.tiers['low']
        elif complexity < 0.7:
            return self.tiers['medium']
        return self.tiers['high']
```

---

## Phase 6: Success Criteria

- [ ] 10 Pi agents defined in `.pi/agents/`
- [ ] Hierarchical topology implemented
- [ ] Local models running (3 tiers)
- [ ] HNSW indexes operational
- [ ] RVF consensus working
- [ ] Demo scenario runs end-to-end
- [ ] Agents converge on decision within threshold

---

## Next Steps

1. **Approve plan** → Begin Phase 1 (Agent Porting)
2. **Test local models** → Verify RuvLLM connectivity
3. **Implement HNSW service** → Create Python microservice
4. **Run demo** → Execute consensus scenario
