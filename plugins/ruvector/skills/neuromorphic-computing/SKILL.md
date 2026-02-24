---
name: "neuromorphic-computing"
description: "Spiking neural networks, hyperdimensional computing, BTSP one-shot learning, exotic AI primitives (NAO, TimeCrystal, Morphogenetic), and RVF SKETCH_SEG for quantum-hybrid bundles."
---

# Neuromorphic Computing

> Consolidated from: `@ruvector/spiking-neural`, `@ruvector/nervous-system-wasm`, `@ruvector/exotic-wasm`. Part of the [RuVector Plugin](../../SKILL.md).

## RVF Quantum-Hybrid Bundles (SKETCH_SEG)

Neuromorphic and quantum state seals into RVF via `SKETCH_SEG`. This stores VQE snapshots, syndrome tables, Hilbert space indexing, and access counter sketches. Combined with `VEC_SEG` (complex64/128 data types) and `OVERLAY_SEG` (model deltas), one `.rvf` file becomes a portable quantum-hybrid computation unit.

**Use cases:** Drug discovery, material search, quantum optimization artifacts, secure research exchange, HDC state persistence.

## Package Overview

| Package | Purpose | Runtime |
|---------|---------|---------|
| `@ruvector/spiking-neural` | SNN with SIMD, Izhikevich/LIF/HH, STDP learning | Node.js |
| `@ruvector/nervous-system-wasm` | HDC classification, BTSP one-shot, SNN primitives | WASM |
| `@ruvector/exotic-wasm` | NAO governance, MorphogeneticNetwork, TimeCrystal | WASM |

## Core API

### SpikingNetwork (SIMD)

```typescript
import { SpikingNetwork } from '@ruvector/spiking-neural';
const network = new SpikingNetwork({ dt: 0.5, simd: true, recordSpikes: true });

const input = network.addLayer({ size: 100, model: 'poisson' });
const hidden = network.addLayer({ size: 500, model: 'izhikevich' }); // also: 'lif', 'hodgkin-huxley'
const output = network.addLayer({ size: 10, model: 'lif' });

network.connect(input, hidden, { probability: 0.3, weightRange: [0.1, 0.5] });
network.connect(hidden, output, { probability: 0.5 });
network.enableSTDP({ tauPlus: 20, tauMinus: 20, aPlus: 0.01, aMinus: 0.012 });

const result = network.simulate(new Float32Array(100).fill(10.0), 1000);
// { outputSpikes, firingRate, totalSpikes }
```

### HyperdimensionalComputing (WASM)

```typescript
import init, { HyperdimensionalComputing } from '@ruvector/nervous-system-wasm';
await init();
const hdc = new HyperdimensionalComputing({ dimensions: 10_000, numClasses: 5, encoding: 'random-projection' });
hdc.train('cat', new Float32Array([0.1, 0.8, 0.2, 0.9]));
const result = hdc.classify(new Float32Array([0.15, 0.75, 0.25, 0.85]));
// { label: 'cat', confidence: 0.94 }
```

### BTSP (one-shot learning)

```typescript
import init, { BTSP } from '@ruvector/nervous-system-wasm';
await init();
const btsp = new BTSP({ inputSize: 100, outputSize: 50, plasticityRate: 0.1 });
btsp.learn(input, target);   // Single-exposure learning
const output = btsp.forward(input);
```

### Exotic Primitives

```typescript
import init, { NeuralAutonomousOrg, MorphogeneticNetwork, TimeCrystal } from '@ruvector/exotic-wasm';
await init();

// NAO: decentralized agent governance
const org = new NeuralAutonomousOrg({ votingThreshold: 0.6, quorumRequired: 0.3 });
org.addAgent('coder-1', { role: 'developer', weight: 1.0 });
const proposal = org.propose('coder-1', { action: 'refactor-auth' });
org.vote(proposal.id, 'reviewer-1', true);

// Morphogenetic: biological growth simulation
const morpho = new MorphogeneticNetwork({ initialCells: 4, maxCells: 1000, morphogenGradient: 'turing' });
morpho.stepN(100);

// TimeCrystal: temporal oscillation patterns
const crystal = new TimeCrystal({ dimensions: 3, frequency: 0.5, numOscillators: 64 });
crystal.evolve(100);
console.log(crystal.coherence()); // Phase synchronization (0-1)
```

## Related

- [Workflow](../../workflows/07-neuromorphic-computing.md)
- [RVF Cognitive Containers](../../workflows/15-rvf-cognitive-containers.md)
