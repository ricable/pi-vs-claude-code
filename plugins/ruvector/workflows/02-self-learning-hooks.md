# Workflow 2: Self-Learning Hooks (Claude Code Integration)

> Back to [RuVector Hub](../SKILL.md)

**Goal:** Make your AI coding assistant smarter over time with Q-learning, semantic memory, and agent routing.

### Step 1: Initialize & Install

```bash
npx @ruvector/cli@latest hooks init
npx @ruvector/cli@latest hooks install
```

This configures 7 Claude Code hooks: `PreToolUse`, `PostToolUse`, `SessionStart`, `Stop`, `PreCompact`, `UserPromptSubmit`, `Notification`.

### Step 2: Hook Event Flow

```
SessionStart → Load intelligence, show stats
  ↓
UserPromptSubmit → Inject learned patterns as context
  ↓
PreToolUse (Edit/Write/Bash) → Agent routing, related files, validation
  ↓
PostToolUse → Record outcomes, update Q-values, inject context
  ↓
PreCompact → Preserve critical memories
  ↓
Stop → Save state, export metrics
```

### Step 3: Agent Routing

```bash
# Route a task to the best agent type
npx @ruvector/cli hooks route "implement vector search" --file src/lib.rs
# → { recommended: "rust-developer", confidence: 0.85 }

# Learn from outcomes
npx @ruvector/cli hooks learn "edit-rs-lib" "rust-developer" --reward 1.0
```

### Step 4: Semantic Memory

```bash
# Store knowledge
npx @ruvector/cli hooks remember -t edit "JWT auth pattern works best with refresh tokens"

# Recall similar knowledge
npx @ruvector/cli hooks recall "authentication" -k 5
```

### Step 5: Error Learning

```bash
# Record error pattern
npx @ruvector/cli hooks record-error "cargo build" "E0308: mismatched types"

# Get fix suggestions
npx @ruvector/cli hooks suggest-fix E0308
# → Type mismatches, .into(), .as_ref() suggestions
```

### Step 6: File Sequence Prediction

```bash
# Predict next files to edit based on patterns
npx @ruvector/cli hooks suggest-next src/api.rs -n 3
# → src/api_test.rs, src/routes.rs, src/models.rs
```

### Step 7: Swarm Coordination

```bash
# Register agents
npx @ruvector/cli hooks swarm-register agent-1 rust-developer --capabilities "rust,async"
npx @ruvector/cli hooks swarm-register agent-2 reviewer --capabilities "review,security"

# Coordinate
npx @ruvector/cli hooks swarm-coordinate agent-1 agent-2 --weight 0.9

# Optimize task distribution
npx @ruvector/cli hooks swarm-optimize "implement-api,write-tests,code-review"
```

**Related skills:** `ruvector-cli`, `ruvector-sona`, `ruvector-router`
