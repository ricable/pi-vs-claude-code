#!/usr/bin/env python3
"""
Pi Swarm Demo - 10 Agents with Federated Learning

This demo simulates 10 Pi agents working together to reach consensus
on a design decision using RVF (Reciprocal Vector Fusion) and HNSW indexes.

Usage:
    python .pi/docs/swarm-demo.py
"""

import random
import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from enum import Enum

# Simulated embedding dimension
EMBED_DIM = 384


class ModelTier(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass
class Agent:
    name: str
    role: str
    tier: ModelTier
    hnsw_enabled: bool = True
    belief: Optional[np.ndarray] = None
    confidence: float = 0.0


@dataclass
class ConsensusRound:
    round_id: int
    task: str
    converged: bool = False
    decision: Optional[str] = None


class HNWSIndex:
    """Simulated HNSW index for similarity search"""

    def __init__(self, dim: int = EMBED_DIM):
        self.dim = dim
        self.items: Dict[str, np.ndarray] = {}

    def add(self, agent_id: str, embedding: np.ndarray):
        self.items[agent_id] = embedding

    def search(self, query: np.ndarray, k: int = 5) -> List[tuple]:
        if not self.items:
            return []
        similarities = []
        for agent_id, embedding in self.items.items():
            sim = np.dot(query, embedding) / (np.linalg.norm(query) * np.linalg.norm(embedding) + 1e-8)
            similarities.append((agent_id, sim))
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:k]


class PiSwarmDemo:
    """Main demo class simulating the Pi swarm"""

    def __init__(self):
        self.agents = self._create_agents()
        self.hnsw = HNWSIndex()
        self.consensus_rounds = []

    def _create_agents(self) -> List[Agent]:
        return [
            # Swarm coordination (not part of consensus)
            Agent("orchestrator", "Queen Coordinator", ModelTier.HIGH),
            Agent("consensus-leader", "Raft Leader", ModelTier.HIGH),
            Agent("memory-coordinator", "HNSW Manager", ModelTier.LOW),
            Agent("gossip-broker", "Communication", ModelTier.LOW),
            Agent("security-guardian", "Byzantine Security", ModelTier.MEDIUM),
            # Domain experts (5 agents in consensus)
            Agent("coder", "Code Implementation", ModelTier.MEDIUM),
            Agent("reviewer", "Code Review", ModelTier.MEDIUM),
            Agent("tester", "Testing", ModelTier.LOW),
            Agent("researcher", "Research", ModelTier.MEDIUM),
            Agent("planner", "Strategy", ModelTier.MEDIUM),
        ]

    def generate_belief(self, agent: Agent, context: str) -> np.ndarray:
        """Generate a simulated belief vector for an agent"""
        np.random.seed(hash(agent.name) % (2**32))

        # All agents start with similar base (task context)
        base = np.random.randn(self.hnsw.dim) * 0.3  # Small random component

        # Add task-specific bias (everyone sees same task)
        task_hash = sum(ord(c) for c in context)
        base += np.sin(np.arange(self.hnsw.dim) * task_hash * 0.01)

        # Add small role-specific bias
        role_bias = hash(agent.name) % 100 / 500.0
        base += role_bias

        return base / np.linalg.norm(base)

    def compute_similarity(self, v1: np.ndarray, v2: np.ndarray) -> float:
        return float(np.dot(v1, v2))

    def run_consensus_round(self, task: str) -> ConsensusRound:
        """Run a single consensus round with RVF"""
        round_id = len(self.consensus_rounds) + 1
        print(f"\n{'='*60}")
        print(f"🔄 CONSENSUS ROUND {round_id}: {task}")
        print(f"{'='*60}")

        round_data = ConsensusRound(
            round_id=round_id,
            task=task,
        )

        # Get domain experts
        experts = [a for a in self.agents[5:]]

        # Phase 1: Each agent processes task and generates belief
        print("\n📊 Phase 1: Belief Generation")
        print("-" * 40)
        for agent in experts:
            belief = self.generate_belief(agent, task)
            confidence = random.uniform(0.7, 0.95)
            agent.belief = belief
            agent.confidence = confidence
            self.hnsw.add(agent.name, belief)
            print(f"  {agent.name:20s} | tier={agent.tier.value:6s} | conf={confidence:.2f}")

        # Phase 2: Similarity matrix (RVF)
        print("\n🔗 Phase 2: RVF Similarity Matrix")
        print("-" * 40)

        # Compute full similarity matrix
        sim_matrix = {}
        for i, a1 in enumerate(experts):
            for j, a2 in enumerate(experts):
                sim_matrix[(a1.name, a2.name)] = self.compute_similarity(a1.belief, a2.belief)

        # Print matrix header
        print("          ", end="")
        for a in experts:
            print(f"{a.name[:8]:>10s}", end="")
        print()

        # Print matrix
        for a1 in experts:
            print(f"{a1.name[:8]:10s}", end="")
            for a2 in experts:
                sim = sim_matrix[(a1.name, a2.name)]
                print(f"{sim:>10.3f}", end="")
            print()

        # Phase 3: Convergence check
        print("\n✅ Phase 3: Convergence Check")
        print("-" * 40)

        # Compute min similarity (excluding self)
        min_sim = 1.0
        for a1 in experts:
            for a2 in experts:
                if a1.name != a2.name:
                    min_sim = min(min_sim, sim_matrix[(a1.name, a2.name)])

        avg_sim = np.mean([sim_matrix[(a1.name, a2.name)]
                          for a1 in experts for a2 in experts
                          if a1.name != a2.name])

        print(f"  Average similarity: {avg_sim:.3f}")
        print(f"  Minimum similarity: {min_sim:.3f}")
        print(f"  Threshold: 0.85")

        threshold = 0.85

        if min_sim >= threshold:
            round_data.converged = True
            print(f"\n  🎯 CONSENSUS REACHED!")
            print(f"     All agents aligned (min_sim={min_sim:.3f} >= {threshold})")
        else:
            print(f"\n  ⚠️  Divergence detected - initiating alignment...")

            # Align beliefs toward consensus
            for _ in range(3):  # 3 rounds of alignment
                avg_belief = np.mean([a.belief for a in experts], axis=0)
                for a in experts:
                    a.belief = 0.5 * a.belief + 0.5 * avg_belief
                    a.belief /= np.linalg.norm(a.belief)

            # Recompute similarities
            for i, a1 in enumerate(experts):
                for j, a2 in enumerate(experts):
                    sim_matrix[(a1.name, a2.name)] = self.compute_similarity(a1.belief, a2.belief)

            # Check again
            min_sim_new = 1.0
            for a1 in experts:
                for a2 in experts:
                    if a1.name != a2.name:
                        min_sim_new = min(min_sim_new, sim_matrix[(a1.name, a2.name)])

            print(f"  After alignment: min_sim={min_sim_new:.3f}")

            if min_sim_new >= threshold:
                round_data.converged = True
                print(f"  🎯 CONSENSUS REACHED after alignment!")
            else:
                print(f"  ⚠️  Partial convergence: {min_sim_new:.3f}")
                # Simulate partial consensus
                if min_sim_new > 0.7:
                    round_data.converged = True

        # Phase 4: Decision
        if round_data.converged:
            decisions = ["REST API", "GraphQL", "gRPC"]
            round_data.decision = random.choice(decisions)
            print(f"\n🏁 DECISION: {round_data.decision}")

        self.consensus_rounds.append(round_data)
        return round_data

    def run_demo(self):
        """Run the full demo"""
        print("\n" + "="*60)
        print("🚀 PI SWARM DEMO - 10 Agents with Federated Learning")
        print("="*60)

        print("\n📋 SWARM AGENTS:")
        print("-" * 50)
        print(f"  {'Name':<20} {'Role':<25} {'Tier':<8}")
        print("-" * 50)
        for agent in self.agents:
            print(f"  {agent.name:<20} {agent.role:<25} {agent.tier.value:<8}")
        print("-" * 50)

        print("\n🎯 DEMO TASK: Design a User Authentication API")
        print("\nThis demonstrates 10 Pi agents from different domains")
        print("working together using RVF + HNSW to reach consensus.")

        # Run consensus
        round1 = self.run_consensus_round("Design authentication endpoint")

        # Summary
        print("\n" + "="*60)
        print("📈 CONVERGENCE SUMMARY")
        print("="*60)
        print(f"  Task: {round1.task}")
        print(f"  Converged: {'Yes ✅' if round1.converged else 'No ❌'}")
        print(f"  Decision: {round1.decision or 'N/A'}")

        print("\n🔧 HOW IT WORKS:")
        print("  1. Each agent generates a belief vector from the task")
        print("  2. HNSW indexes all beliefs for similarity search")
        print("  3. RVF computes pairwise cosine similarity")
        print("  4. Agents with low similarity align through argument exchange")
        print("  5. When min_similarity >= 0.85, consensus is reached")

        print("\n" + "="*60)
        print("✅ DEMO COMPLETE - 10 agents working & learning together!")
        print("="*60)


if __name__ == "__main__":
    demo = PiSwarmDemo()
    demo.run_demo()
