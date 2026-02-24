---
name: claude-flow-hooks-learning
description: >
  Self-learning hooks with ReasoningBank pattern learning. Use when configuring event-driven
  automation, setting up lifecycle hooks, enabling pattern distillation, or implementing
  the RETRIEVE-JUDGE-DISTILL-CONSOLIDATE learning pipeline. Supports 27 hook types and
  12 specialized workers.
---

# Hooks & Self-Learning

## Hook Lifecycle

Hooks fire on agent/task lifecycle events:

| Hook | Fires When | Use Case |
|------|-----------|----------|
| `pre-task` | Before task starts | Validation, context loading |
| `post-task` | After task completes | Pattern capture, metrics |
| `pre-edit` | Before file edit | Lint check, permission guard |
| `post-edit` | After file edit | Auto-format, test trigger |
| `session-start` | Session begins | Load context, restore state |
| `session-end` | Session ends | Save state, cleanup |
| `on-error` | Error occurs | Auto-retry, fallback routing |
| `on-idle` | Agent idle | Rebalance, reassign tasks |

## Managing Hooks

```bash
# Add a hook
npx @claude-flow/cli@latest hooks add --event post-task --handler "npm test" --name auto-test

# List hooks
npx @claude-flow/cli@latest hooks list

# Enable/disable
npx @claude-flow/cli@latest hooks enable --name auto-test
npx @claude-flow/cli@latest hooks disable --name auto-test

# Remove
npx @claude-flow/cli@latest hooks remove --name auto-test
```

## ReasoningBank Learning Pipeline

Self-learning through execution pattern capture:

```
RETRIEVE -> JUDGE -> DISTILL -> CONSOLIDATE
```

### 1. RETRIEVE
Search for similar past patterns using HNSW memory:
```bash
npx @claude-flow/cli@latest memory search --query "current task description" --namespace reasoning --limit 3
```

### 2. JUDGE
Evaluate execution outcome:
- **Success**: Pattern reinforced, confidence increased
- **Failure**: Pattern flagged, alternative approaches recorded
- **Partial**: Pattern refined with corrections

### 3. DISTILL
Extract reusable pattern from execution trajectory:
- Input conditions that led to success/failure
- Key decision points and rationale
- Output quality metrics

### 4. CONSOLIDATE
Merge into long-term memory with EWC++ protection:
```bash
npx @claude-flow/cli@latest memory store \
  --key "reasoning-pattern-{hash}" \
  --value "{distilled pattern}" \
  --namespace reasoning \
  --tags "auto-learned,confidence:0.85"
```

## 12 Specialized Workers

| Worker | Function |
|--------|----------|
| `pattern-matcher` | Find similar past executions |
| `quality-scorer` | Rate output quality 0-1 |
| `trajectory-tracker` | Record execution path |
| `verdict-judge` | Classify success/failure/partial |
| `distiller` | Extract reusable patterns |
| `consolidator` | Merge into long-term memory |
| `anomaly-detector` | Flag unusual patterns |
| `drift-monitor` | Detect agent drift from goals |
| `cost-tracker` | Monitor token/API costs |
| `latency-monitor` | Track response times |
| `error-classifier` | Categorize failure modes |
| `recommendation-engine` | Suggest optimizations |

## Model Routing via Hooks

Hooks enable 3-tier model routing (ADR-026):

```
pre-task hook -> analyze complexity -> route to tier

Tier 1: Agent Booster (WASM) - <1ms, $0
  Triggers: simple renames, type additions, const conversion
  Action: Use Edit tool directly, skip LLM

Tier 2: Haiku - ~500ms, $0.0002
  Triggers: complexity < 30%, simple formatting, basic refactors
  Action: Spawn agent with model: "haiku"

Tier 3: Sonnet/Opus - 2-5s, $0.003+
  Triggers: complexity > 30%, architecture, security
  Action: Spawn agent with default model
```

## Hook Configuration File

Hooks are defined in `.claude-flow/hooks/`:

```json
{
  "hooks": [
    {
      "name": "auto-test",
      "event": "post-edit",
      "handler": "npm test",
      "timeout": 30000,
      "continueOnError": true,
      "conditions": {
        "filePattern": "src/**/*.ts"
      }
    }
  ]
}
```
