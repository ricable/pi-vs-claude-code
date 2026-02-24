# Workflow 14: Mathematical Computing (WASM)

> Back to [RuVector Hub](../SKILL.md)

**Goal:** Use optimal transport, information geometry, and manifold operations in browser/edge.

### Optimal Transport

```typescript
import { WassersteinDistance, SinkhornSolver } from '@ruvector/math-wasm';

const distance = WassersteinDistance.compute(distribution_p, distribution_q);

const solver = new SinkhornSolver({ regularization: 0.01, maxIterations: 100 });
const plan = solver.solve(costMatrix, p, q);
```

### Information Geometry

```typescript
import { FisherMetric } from '@ruvector/math-wasm';

const distance = FisherMetric.distance(params_p, params_q);
const naturalGrad = FisherMetric.naturalGradient(params, gradient);
```

### Product Manifolds

```typescript
import { ProductManifold } from '@ruvector/math-wasm';

const midpoint = ProductManifold.geodesic(point_a, point_b, 0.5);
```

**Related skills:** `ruvector-math-wasm`, `ruvector-math-wasm-scoped`
