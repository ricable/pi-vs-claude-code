# Pi-AI Providers, Tools, and Skills with Tiny Dancer (Core / Node / WASM)

This guide shows how to use `@mariozechner/pi-ai` for:

1. **model providers** (Google, OpenAI, Anthropic, OpenRouter, etc.)
2. **tool-calling** workflows (typed tools + validation)
3. **skill-style routing** with Tiny Dancer neural router
4. integration with these repo references:
   - `references/ruvector/crates/ruvector-tiny-dancer-core`
   - `references/ruvector/crates/ruvector-tiny-dancer-node`
   - `references/ruvector/crates/ruvector-tiny-dancer-wasm`

---

## 1) Provider setup (pi-ai)

`pi-ai` resolves credentials from auth/env. Use provider-native IDs when possible.

### Environment variables

```bash
export GEMINI_API_KEY=...
export OPENAI_API_KEY=...
export ANTHROPIC_API_KEY=...
export OPENROUTER_API_KEY=...
```

### Important model/provider rule

- `--model openrouter/...` => requires `OPENROUTER_API_KEY`
- `--provider google --model gemini-...` => requires `GEMINI_API_KEY`

---

## 2) Query providers and models dynamically

```ts
import { getProviders, getModels, getModel } from '@mariozechner/pi-ai';

const providers = getProviders();
console.log('Providers:', providers);

for (const p of providers) {
  const models = getModels(p as any);
  console.log(`\n${p}: ${models.length} models`);
  console.log(models.slice(0, 5).map(m => `- ${m.id}`).join('\n'));
}

const model = getModel('google', 'gemini-2.5-pro');
console.log(model.id, model.api, model.contextWindow);
```

---

## 3) Typed tools with pi-ai (TypeBox)

```ts
import {
  Type,
  complete,
  getModel,
  validateToolCall,
  type Tool,
  type Context,
} from '@mariozechner/pi-ai';

const tools: Tool[] = [
  {
    name: 'search_code',
    description: 'Search code by regex',
    parameters: Type.Object({
      pattern: Type.String(),
      path: Type.String(),
    }),
  },
];

const context: Context = {
  systemPrompt: 'You are a code assistant.',
  messages: [{ role: 'user', content: 'Find all swarm tools in extensions' }],
  tools,
};

const model = getModel('google', 'gemini-2.5-pro');
const msg = await complete(model, context);

for (const block of msg.content) {
  if (block.type === 'toolCall') {
    const args = validateToolCall(tools, block); // throws if invalid
    // execute tool with args
  }
}
```

---

## 4) Dynamic provider routing with Tiny Dancer (Node)

Use Tiny Dancer to choose **which provider/model** to call per task.

### Reference path
- `references/ruvector/crates/ruvector-tiny-dancer-node`

### Package naming note
In this repo references:
- README shows: `@ruvector/tiny-dancer-node`
- package.json in reference shows: `ruvector-tiny-dancer-node`

Use whichever exists in your registry/build pipeline.

### Example router + pi-ai handoff

```ts
import { complete, getModel, type Model } from '@mariozechner/pi-ai';
// import { TinyDancer } from '@ruvector/tiny-dancer-node';
import { TinyDancer } from 'ruvector-tiny-dancer-node';

type RouteTarget = {
  provider: 'google' | 'openai' | 'anthropic' | 'openrouter';
  model: string;
};

const CANDIDATES: RouteTarget[] = [
  { provider: 'google', model: 'gemini-2.5-pro' },
  { provider: 'openai', model: 'gpt-5-mini' },
  { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
];

const router = new TinyDancer({ modelPath: './.rvf/tiny-dancer/router.db', enableMetrics: true });
await router.init();

function toAgentIds(items: RouteTarget[]) {
  return items.map(x => `${x.provider}/${x.model}`);
}

async function routeAndRun(userPrompt: string) {
  const r = await router.route({
    query: userPrompt,
    agents: toAgentIds(CANDIDATES),
    context: { length: userPrompt.length },
  });

  const [provider, modelId] = r.agent.split('/');
  const model: Model<any> = getModel(provider as any, modelId as any);

  const msg = await complete(model, {
    messages: [{ role: 'user', content: userPrompt }],
  });

  return { route: r, response: msg };
}
```

---

## 5) Browser/edge routing with Tiny Dancer (WASM)

### Reference path
- `references/ruvector/crates/ruvector-tiny-dancer-wasm`

```ts
import init, { TinyDancer } from '@ruvector/tiny-dancer-wasm';

await init();
const router = new TinyDancer();
await router.loadModel('/models/router-v1.bin');

const decision = await router.route({
  query: 'Need deep architecture review for auth and scaling',
  agents: ['google/gemini-2.5-pro', 'openai/gpt-5-mini', 'anthropic/claude-sonnet-4-20250514'],
  context: { urgency: 'high' },
});

console.log(decision.agent, decision.confidence);
```

Then map `decision.agent` to `pi-ai` `getModel(provider, model)` server-side.

---

## 6) Rust-native high-performance routing (Core)

### Reference path
- `references/ruvector/crates/ruvector-tiny-dancer-core`

Use `ruvector-tiny-dancer-core` when you want the routing engine in Rust services:

- sub-ms inference
- circuit breaker
- uncertainty thresholds
- SQLite/WAL routing telemetry

Typical architecture:

1. Rust service (Tiny Dancer Core) scores candidates.
2. Returns chosen provider/model ID.
3. Node/TS app uses `pi-ai` to run completion with selected model.

---

## 7) Skill integration in this Pi project

This repo exposes many skills under `~/.agents/skills` and `.pi/skills`.
For Tiny Dancer routing workflows, use:

- `ruvector-tiny-dancer` skill (routing strategy guidance)
- `ruvector-*` skills for vector/attention/graph pipelines
- `agentdb` + `learning` extension for adaptive feedback loops

Recommended pattern:

1. route request with Tiny Dancer
2. execute model via pi-ai
3. store outcome in AgentDB / RVF
4. feed reward signal for future routing improvements

---

## 8) Minimal end-to-end orchestration pattern

```ts
// 1) Select model route (Tiny Dancer)
// 2) Call chosen model (pi-ai complete/stream)
// 3) Execute tool calls safely (validateToolCall)
// 4) Store episode in RVF/AgentDB
```

This gives dynamic multi-provider control with strict tool safety and measurable feedback.

---

## 9) Troubleshooting

### "No API key found for openrouter"
You passed an `openrouter/...` model ID. Either:

- set `OPENROUTER_API_KEY`, or
- switch to provider-native model, e.g. `getModel('google', 'gemini-2.5-pro')` with `GEMINI_API_KEY`.

### Google model + OpenRouter prefix mismatch
Do **not** mix:
- `--provider google` with `openrouter/...` model IDs

Use aligned pairs only.

### Tool-call argument errors
Always validate with `validateToolCall(tools, toolCall)` before execution.

---

## 10) Practical command examples

### Direct Google
```bash
GEMINI_API_KEY=... pi --provider google --model gemini-2.5-pro -p "Summarize this repository architecture"
```

### Direct OpenRouter
```bash
OPENROUTER_API_KEY=... pi --model openrouter/google/gemini-3.1-pro -p "Review this code for race conditions"
```

### With orchestration extensions
```bash
pi -e extensions/orchestration.ts -e extensions/learning.ts --provider google --model gemini-2.5-pro
```

---

## 11) Reference map

- Pi-AI provider docs (local):
  - `/Users/cedric/.local/share/mise/installs/node/22.22.0/lib/node_modules/@mariozechner/pi-coding-agent/docs/providers.md`
- Tiny Dancer references:
  - `references/ruvector/crates/ruvector-tiny-dancer-core/README.md`
  - `references/ruvector/crates/ruvector-tiny-dancer-node/README.md`
  - `references/ruvector/crates/ruvector-tiny-dancer-wasm/README.md`

---

If needed, next step is generating a concrete `extensions/provider-router.ts` that wraps Tiny Dancer + pi-ai as a single Pi tool (`route_model_and_run`).