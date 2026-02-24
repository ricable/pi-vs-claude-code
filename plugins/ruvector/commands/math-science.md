# Math and Science

> Part of the [RuVector Plugin](../SKILL.md). See also: [attention](attention.md), [neuromorphic](neuromorphic.md).

## Wasserstein Distance (Optimal Transport)

```typescript
import init, { WassersteinDistance, SinkhornSolver } from '@ruvector/math-wasm';
// or: import from 'ruvector-math-wasm';
await init();

// Earth Mover's Distance between distributions
const p = new Float64Array([0.2, 0.3, 0.5]);
const q = new Float64Array([0.1, 0.4, 0.5]);
const w2 = WassersteinDistance.compute(p, q);          // Wasserstein-2
const w1 = WassersteinDistance.compute(p, q, 1);       // Wasserstein-1

// Custom ground cost matrix
const cost = new Float64Array(9);  // 3x3 row-major
const wCost = WassersteinDistance.computeWithCost(p, q, cost);

// Sliced Wasserstein for high-dimensional samples (scoped package only)
const sliced = WassersteinDistance.sliced(samples1, samples2, dim, 100);
```

## Sinkhorn Solver

Entropic-regularized optimal transport for large-scale problems.

```typescript
const solver = new SinkhornSolver({
  epsilon: 0.01,     // regularization strength
  maxIter: 100,
  tolerance: 1e-9,
});

const result = solver.solve(costMatrix, p, q);
console.log(`Transport cost: ${result.cost}, iterations: ${result.iterations}`);
// result.plan -- optimal transport plan (Float64Array)

// Wasserstein barycenter (scoped package)
const barycenter = solver.barycenter(distributions, weights);
```

## Fisher Metric (Information Geometry)

```typescript
import init, { FisherMetric } from '@ruvector/math-wasm';
await init();

// Fisher-Rao distance on statistical manifold
const gaussian1 = new Float64Array([0.0, 1.0]);  // mean=0, var=1
const gaussian2 = new Float64Array([1.0, 2.0]);  // mean=1, var=2
const dist = FisherMetric.distance(gaussian1, gaussian2);

// Fisher information matrix
const fim = FisherMetric.matrix(gaussian1, 'gaussian');
// families: 'gaussian', 'bernoulli', 'categorical', 'exponential'

// Natural gradient descent (preconditioned by Fisher information)
const gradient = new Float64Array([0.5, -0.3]);
const natGrad = FisherMetric.naturalGradient(gaussian1, gradient);

// Geodesic on statistical manifold (scoped package)
const midpoint = FisherMetric.geodesic(gaussian1, gaussian2, 0.5);
```

## Product Manifolds

Operations on product spaces of Riemannian manifolds.

```typescript
import init, { ProductManifold } from '@ruvector/math-wasm';
await init();

const a = new Float64Array([1.0, 0.0, 0.5]);
const b = new Float64Array([0.0, 1.0, 0.8]);

// Geodesic interpolation
const midpoint = ProductManifold.geodesic(a, b, 0.5);

// Riemannian distance
const dist = ProductManifold.distance(a, b);

// Exponential map (tangent vector -> manifold point)
const tangent = new Float64Array([0.1, -0.2, 0.3]);
const projected = ProductManifold.expMap(a, tangent);

// Logarithmic map (manifold point -> tangent vector)
const logVec = ProductManifold.logMap(a, b);

// Parallel transport of vector v along geodesic from -> to
const transported = ProductManifold.parallelTransport(v, a, b);
```

## Scoped vs Unscoped Package

Both packages provide identical core APIs. The scoped package (`@ruvector/math-wasm`) adds:

| Feature | `ruvector-math-wasm` | `@ruvector/math-wasm` |
|---------|---------------------|----------------------|
| WassersteinDistance | compute, computeWithCost | + sliced Wasserstein |
| SinkhornSolver | solve | + barycenter |
| FisherMetric | distance, matrix, naturalGradient | + geodesic |
| ProductManifold | Full API | Full API |
| Install | `npx ruvector-math-wasm@latest` | `npx @ruvector/math-wasm@latest` |

## Browser Usage

```html
<script type="module">
  import init, { WassersteinDistance, FisherMetric } from '@ruvector/math-wasm';
  await init();

  const p = new Float64Array([0.5, 0.3, 0.2]);
  const q = new Float64Array([0.1, 0.6, 0.3]);
  console.log('W2:', WassersteinDistance.compute(p, q));
</script>
```

## Source Packages

- [@ruvector/math-wasm](https://www.npmjs.com/package/@ruvector/math-wasm) -- Scoped WASM math (OT, Fisher, manifolds)
- [ruvector-math-wasm](https://www.npmjs.com/package/ruvector-math-wasm) -- Unscoped WASM math
