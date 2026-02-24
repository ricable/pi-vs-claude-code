# Neuromorphic Computing

> Part of the [RuVector Plugin](../SKILL.md). See also: [attention](attention.md), [math-science](math-science.md).

## Spiking Neural Networks

```typescript
import { SpikingNetwork } from '@ruvector/spiking-neural';

const network = new SpikingNetwork({ dt: 0.5, simd: true, recordSpikes: true });

// Layers: Poisson input -> Izhikevich hidden -> LIF output
const input = network.addLayer({ size: 100, model: 'poisson', label: 'input' });
const hidden = network.addLayer({ size: 500, model: 'izhikevich', label: 'hidden' });
const output = network.addLayer({ size: 10, model: 'lif', label: 'output' });

// Connect and enable STDP learning
network.connect(input, hidden, { probability: 0.3, weightRange: [0.1, 0.5] });
network.connect(hidden, output, { probability: 0.5, weightRange: [0.2, 0.8] });
network.enableSTDP({ tauPlus: 20, tauMinus: 20, aPlus: 0.01, aMinus: 0.012 });

// Simulate
const result = network.simulate(new Float32Array(100).fill(10.0), 1000);
console.log(`Firing rate: ${result.firingRate.toFixed(2)} Hz`);
```

Models: `izhikevich`, `lif`, `hodgkin-huxley`, `poisson`.

## Hyperdimensional Computing (HDC)

```typescript
import init, { HyperdimensionalComputing } from '@ruvector/nervous-system-wasm';
await init();

const hdc = new HyperdimensionalComputing({
  dimensions: 10_000,      // 10000-bit hypervectors
  numClasses: 5,
  encoding: 'random-projection',  // 'thermometer' | 'level'
  similarity: 'cosine',           // 'hamming'
});

// Train
hdc.train('cat', new Float32Array([0.1, 0.8, 0.2, 0.9]));
hdc.train('dog', new Float32Array([0.9, 0.2, 0.8, 0.1]));

// Classify
const result = hdc.classify(new Float32Array([0.15, 0.75, 0.25, 0.85]));
console.log(`${result.label}, confidence: ${result.confidence}`);

// Batch classify, raw encode, accuracy test
const batch = hdc.batchClassify(inputs);
const raw = hdc.encode(features);       // raw hypervector
const acc = hdc.accuracy(testData);
```

## BTSP One-Shot Learning

```typescript
import init, { BTSP } from '@ruvector/nervous-system-wasm';
await init();

const btsp = new BTSP({ inputSize: 100, outputSize: 50, plasticityRate: 0.1, plateauDuration: 10 });
btsp.learn(new Float32Array(100).fill(0.5), new Float32Array(50).fill(1.0));  // single-exposure
const output = btsp.forward(new Float32Array(100).fill(0.5));
```

## MicroLoRA Adaptation

```typescript
import init, { MicroLoRA, adaptWeights } from '@ruvector/learning-wasm';
await init();

const adapter = new MicroLoRA({
  inputDim: 768, outputDim: 768,
  rank: 2,            // rank-2 LoRA, <100us latency
  alpha: 1.0,
  learningRate: 0.001,
});

// Adapt to new example
const loss = adapter.adapt(input, target);

// Apply LoRA delta to base weights: W' = W + alpha * B * A
const adaptedWeights = adapter.apply(baseWeights);

// Batch adapt, serialize, restore
adapter.adaptBatch(examples);
const data = adapter.save();
const restored = MicroLoRA.load(data);
adapter.free();  // release WASM memory
```

## Exotic Mechanisms

```typescript
import init, { NeuralAutonomousOrg, TimeCrystal, MorphogeneticNetwork } from '@ruvector/exotic-wasm';
await init();

// NAO: decentralized agent governance with weighted voting
const org = new NeuralAutonomousOrg({ agentCount: 10, votingThreshold: 0.6, quorumRequired: 0.3 });
org.addAgent('coder-1', { role: 'developer', weight: 1.0 });
const proposal = org.propose('coder-1', { action: 'refactor-auth' });
org.vote(proposal.id, 'reviewer-1', true);

// TimeCrystal: periodic oscillation patterns
const crystal = new TimeCrystal({ dimensions: 3, frequency: 0.5, numOscillators: 64 });
crystal.evolve(100);  // crystal.coherence() -> 0-1

// MorphogeneticNetwork: biological growth (Turing patterns)
const morpho = new MorphogeneticNetwork({ initialCells: 4, maxCells: 1000, morphogenGradient: 'turing' });
morpho.stepN(100);  // morpho.getTopology() -> { cellCount, edgeCount }
```

## Source Packages

- [@ruvector/spiking-neural](https://www.npmjs.com/package/@ruvector/spiking-neural) -- SNN engine with SIMD, STDP
- [@ruvector/nervous-system-wasm](https://www.npmjs.com/package/@ruvector/nervous-system-wasm) -- HDC, BTSP, SNN in WASM
- [@ruvector/learning-wasm](https://www.npmjs.com/package/@ruvector/learning-wasm) -- MicroLoRA adaptation
- [@ruvector/exotic-wasm](https://www.npmjs.com/package/@ruvector/exotic-wasm) -- NAO, TimeCrystal, MorphogeneticNetwork
