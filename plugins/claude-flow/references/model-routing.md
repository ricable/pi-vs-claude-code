# 3-Tier Model Routing (ADR-026)

## Overview

Route tasks to the cheapest/fastest tier that can handle them:

```
Task → Complexity Analysis → Tier Selection → Execution
```

## Tier 1: Agent Booster (WASM)

| Property | Value |
|----------|-------|
| Latency | <1ms |
| Cost | $0 |
| Handler | WASM runtime (local) |
| Signal | `[AGENT_BOOSTER_AVAILABLE]` |

**Triggers**:
- Variable renaming (var -> const/let)
- Type annotation additions
- Simple string replacements
- Import reordering
- Comment additions

**Action**: Use Edit tool directly. Skip LLM entirely.

```
[AGENT_BOOSTER_AVAILABLE] detected → Edit tool → Done
```

## Tier 2: Haiku

| Property | Value |
|----------|-------|
| Latency | ~500ms |
| Cost | $0.0002/task |
| Handler | claude-haiku-4-5 |
| Signal | `[TASK_MODEL_RECOMMENDATION: haiku]` |

**Triggers** (complexity < 30%):
- Simple formatting fixes
- Basic refactoring (extract variable, inline)
- Documentation updates
- Simple test generation
- Error message improvements

**Action**: Spawn agent with `model: "haiku"`:
```
Task tool: model: "haiku", subagent_type: "coder"
```

## Tier 3: Sonnet/Opus

| Property | Value |
|----------|-------|
| Latency | 2-5s |
| Cost | $0.003-0.015/task |
| Handler | claude-sonnet-4-5 / claude-opus-4-6 |
| Signal | `[TASK_MODEL_RECOMMENDATION: sonnet]` or default |

**Triggers** (complexity > 30%):
- Architecture decisions
- Security review and threat modeling
- Complex algorithm implementation
- Multi-file refactoring
- Performance optimization
- System design

**Action**: Spawn agent with default model (inherits from parent).

## Complexity Assessment Factors

| Factor | Low (Tier 1-2) | High (Tier 3) |
|--------|----------------|---------------|
| Files affected | 1 | 3+ |
| Logic changes | None/minimal | Significant |
| Dependencies | None | Cross-module |
| Security implications | None | Yes |
| Architecture impact | None | Yes |
| Test requirements | None/simple | Complex |

## Routing Decision Flow

```
1. Is it a simple text transform?
   YES → Tier 1 (Agent Booster, Edit tool)
   NO  → continue

2. Complexity < 30%? Single file? No security?
   YES → Tier 2 (Haiku)
   NO  → continue

3. Default → Tier 3 (Sonnet/Opus)
```

## Cost Optimization

For a typical development session:
- 60% of tasks route to Tier 1 ($0 cost)
- 25% route to Tier 2 ($0.005 total)
- 15% route to Tier 3 ($0.045 total)
- **Total savings: ~70% vs routing everything to Tier 3**
