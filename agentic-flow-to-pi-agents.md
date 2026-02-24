│ Plan: Port Claude Agents to Pi Agents Extension                                      │
│                                                                                      │
│ Context                                                                              │
│                                                                                      │
│ The goal is to port Claude agents from the agentic-flow and claude-flow reference    │
│ projects to a Pi agents extension. This enables running Claude Code-style            │
│ multi-agent workflows in the Pi coding agent environment.                            │
│                                                                                      │
│ Source Codebase                                                                      │
│                                                                                      │
│ - Claude runtime agents: /Users/cedric/dev/2026/pi-vs-claude-code/references/agentic │
│ -flow/agentic-flow/src/agents/ (7 agents)                                            │
│ - Claude Flow agents:                                                                │
│ /Users/cedric/dev/2026/pi-vs-claude-code/references/claude-flow/src/agents/          │
│ (base-agent pattern, factory)                                                        │
│ - Claude Flow commands:                                                              │
│ /Users/cedric/dev/2026/pi-vs-claude-code/references/claude-flow/.claude/commands/    │
│ (60+ commands)                                                                       │
│ - Agent definitions: /Users/cedric/dev/2026/pi-vs-claude-code/references/agentic-flo │
│ w/agentic-flow/.claude/agents/ (80+ markdown definitions)                            │
│                                                                                      │
│ Target                                                                               │
│                                                                                      │
│ - Existing extension:                                                                │
│ /Users/cedric/dev/2026/pi-vs-claude-code/extensions/agent-team.ts (to be extended)   │
│ - Agent definitions: .pi/agents/*.md (markdown files)                                │
│ - Memory system: RVF (Ruvnet Vector Format) for pattern storage                      │
│                                                                                      │
│ Requirements Summary                                                                 │
│                                                                                      │
│ Agents to Port                                                                       │
│                                                                                      │
│ - Runtime agents: All 7 (claudeAgent, claudeAgentDirect, claudeFlowAgent,            │
│ codeReviewAgent, dataAgent, directApiAgent, webResearchAgent)                        │
│ - Core agents: coder, planner, researcher, reviewer, tester                          │
│ - Coordinator: Hierarchical coordinator (queen-worker model)                         │
│                                                                                      │
│ Architecture                                                                         │
│                                                                                      │
│ - Structure: Single extension (extend agent-team.ts)                                 │
│ - AI Provider: @mariozechner/pi-ai package                                           │
│ - Tool availability: Per-agent tools defined in markdown                             │
│ - Startup: Interactive team selection                                                │
│                                                                                      │
│ Memory System (RVF)                                                                  │
│                                                                                      │
│ - Package: @ruvector/rvf-node + @ruvector/rvf-wasm                                   │
│ - Dimension: 384                                                                     │
│ - Precision: int8                                                                    │
│ - Index: HNSW                                                                        │
│ - Storage: Federated (per coordinator, per worker, per session)                      │
│ - Sync: Bidirectional between coordinator and workers                                │
│ - Retrieval: Top-k similar patterns                                                  │
│ - Persistence: Append-only or on-exit save                                           │
│ - Pattern fields: task, input, output, reward, success, tokens, latency              │
│                                                                                      │
│ MCP Tools to Port                                                                    │
│                                                                                      │
│ - Memory tools (store, retrieve, search patterns)                                    │
│ - Swarm tools (init, spawn, orchestrate, status)                                     │
│ - Neural/ML tools (patterns, train)                                                  │
│                                                                                      │
│ Commands                                                                             │
│                                                                                      │
│ - Stored as agent prompts in markdown (not executable commands)                      │
│                                                                                      │
│ Implementation Plan                                                                  │
│                                                                                      │
│ Phase 1: Setup and Dependencies                                                      │
│                                                                                      │
│ 1. Add RVF packages to package.json:                                                 │
│   - @ruvector/rvf-node                                                               │
│   - @ruvector/rvf-wasm                                                               │
│ 2. Create .rvf/ directory for memory storage                                         │
│                                                                                      │
│ Phase 2: Create Agent Definitions                                                    │
│                                                                                      │
│ Create markdown files in .pi/agents/:                                                │
│ - .pi/agents/coder.md                                                                │
│ - .pi/agents/planner.md                                                              │
│ - .pi/agents/researcher.md                                                           │
│ - .pi/agents/reviewer.md                                                             │
│ - .pi/agents/tester.md                                                               │
│ - .pi/agents/coordinator.md                                                          │
│ - .pi/agents/teams.yaml                                                              │
│                                                                                      │
│ Phase 3: Implement RVF Memory System                                                 │
│                                                                                      │
│ Create memory module in extension:                                                   │
│ - RvfMemoryStore class for pattern storage                                           │
│ - Methods: storePattern(), searchPatterns(), getTopK()                               │
│ - Federated storage: coordinator RVF, worker RVF, session RVF                        │
│                                                                                      │
│ Phase 4: Extend agent-team.ts                                                        │
│                                                                                      │
│ 1. Add RVF memory integration                                                        │
│ 2. Add memory tools (store, retrieve, search)                                        │
│ 3. Add swarm tools (spawn, orchestrate)                                              │
│ 4. Add neural tools                                                                  │
│ 5. Implement hierarchical coordinator                                                │
│ 6. Add self-learning protocol                                                        │
│                                                                                      │
│ Phase 5: Testing                                                                     │
│                                                                                      │
│ - Manual testing via Pi CLI                                                          │
│ - Test coder agent first                                                             │
│ - Test coordinator-worker communication                                              │
│                                                                                      │
│ Files to Modify                                                                      │
│                                                                                      │
│ ┌───────────────────────────┬────────────────────────┐                               │
│ │           File            │         Action         │                               │
│ ├───────────────────────────┼────────────────────────┤                               │
│ │ package.json              │ Add RVF dependencies   │                               │
│ ├───────────────────────────┼────────────────────────┤                               │
│ │ extensions/agent-team.ts  │ Extend with new agents │                               │
│ ├───────────────────────────┼────────────────────────┤                               │
│ │ .pi/agents/coder.md       │ Create                 │                               │
│ ├───────────────────────────┼────────────────────────┤                               │
│ │ .pi/agents/planner.md     │ Create                 │                               │
│ ├───────────────────────────┼────────────────────────┤                               │
│ │ .pi/agents/researcher.md  │ Create                 │                               │
│ ├───────────────────────────┼────────────────────────┤                               │
│ │ .pi/agents/reviewer.md    │ Create                 │                               │
│ ├───────────────────────────┼────────────────────────┤                               │
│ │ .pi/agents/tester.md      │ Create                 │                               │
│ ├───────────────────────────┼────────────────────────┤                               │
│ │ .pi/agents/coordinator.md │ Create                 │                               │
│ ├───────────────────────────┼────────────────────────┤                               │
│ │ .pi/agents/teams.yaml     │ Create                 │                               │
│ └───────────────────────────┴────────────────────────┘                               │
│                                                                                      │
│ Verification                                                                         │
│                                                                                      │
│ Run the extension:                                                                   │
│ cd /Users/cedric/dev/2026/pi-vs-claude-code                                          │
│ pi -e extensions/agent-team.ts                                                       │
│                                                                                      │
│ Test coder agent:                                                                    │
│ /experts                                                                             │
│ > Use coder agent to implement a hello world function                                │
│                                                                                      │
│ Memory Initialization                                                                │
│                                                                                      │
│ - Import: Export from Claude Flow memory first                                       │
│ - Pre-populated data: From Claude Flow .claude/memory export                         │
│ - Fallback: CLI if npm packages unavailable                                          │
│                                                                                      │
│ Agent Startup                                                                        │
│                                                                                      │
│ - Command: /team triggers agent selection                                            │
│ - Interactive selection: User picks team on startup                                  │
│ - Session storage: .rvf/ directory for RVF files                                     │
│                                                                                      │
│ Verification Command                                                                 │
│                                                                                      │
│ pi -e extensions/agent-team.ts                                                       │
│ /team                                                                                │
│ > Use coder agent to implement a hello world function  