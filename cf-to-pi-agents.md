Plan: Pi Swarm Platform — Full Domain Agent System with Self-Learning
                                                                           
 Context                                                                
                                                       
 Transform the existing Pi coding agent playground into a distributed
 swarm of self-learning domain expert agents by:                         
        
 1. Port 27 telecom YAML agents (agents-yaml/agents/) fully to    
 .pi/agents/experts/telecom/ (.md format)                              
 2. Create 35+ new domain expert agents (software engineering, science,
 business) in .pi/agents/experts/    
 3. Two new extensions: learning.ts (AgentDB+ReasoningBank+SONA) +
 orchestration.ts (providers+swarm)
 4. Provider integration: Gemini CLI, Codex CLI, RuvLLM via registerTool()
  subprocess spawning
 5. AgentDB (@claude-flow/agentdb npm) backed by .rvf/learning/ for
 multi-level memory
 6. SONA three-tier self-learning triggered on every agent_end event
 7. Factory agent (factory.md) generates new domain agents on demand
 8. Sync script mirrors .pi/agents/ → .claude/agents/ one-way
 9. Update cross-agent.ts, agent-chain.yaml, teams.yaml, justfile,
 README.md

 Execution order: Agent definitions first (Phase 1), then infrastructure
 extensions (Phase 2-3), then wiring (Phase 4-5).

 ---
 Architecture Overview

 ┌─────────────────────────────────────────────────────────────────┐
 │                    Pi Agent Swarm Platform                      │
 ├─────────────────────────────────────────────────────────────────┤
 │  Providers (all via pi.registerTool() + subprocess spawn)       │
 │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌────────────┐   │
 │  │ gemini    │  │ codex     │  │ ruvllm    │  │ auto_route │   │
 │  │ (CLI)     │  │ (CLI)     │  │ (HTTP API)│  │ (keyword)  │   │
 │  └───────────┘  └───────────┘  └───────────┘  └────────────┘   │
 ├─────────────────────────────────────────────────────────────────┤
 │  extensions/orchestration.ts                                    │
 │  - gemini_run, codex_run, ruvllm_run, auto_route tools          │
 │  - swarm_init, swarm_dispatch, swarm_broadcast, conflict_check  │
 │  - Commands: /provider /swarm /providers /route                 │
 │  - Footer status: [Provider: gemini] [Swarm: 3 agents]          │
 ├─────────────────────────────────────────────────────────────────┤
 │  extensions/learning.ts                                         │
 │  - AgentDB (@claude-flow/agentdb) + ReasoningBank + SONA        │
 │  - Auto-triggered on every agent_end (loose coupling via events)│
 │  - Embeddings via @ruvector/rvf-node, storage in .rvf/learning/ │
 │  - Commands: /learn-stats /remember /forget /skills             │
 │  - Footer status: [Episodes: 42] [Skills: 7]                    │
 ├─────────────────────────────────────────────────────────────────┤
 │  Agent Registry                                                 │
 │  .pi/agents/experts/telecom/ (27 ported telecom agents)         │
 │  .pi/agents/experts/backend/ .frontend/ .infra/ .security/ etc  │
 │  .pi/agents/experts/science/ .business/                         │
 │  .pi/agents/providers/ (gemini, codex, ruvllm)                  │
 │  .pi/agents/factory.md (generates new agents on demand)         │
 ├─────────────────────────────────────────────────────────────────┤
 │  RVF + HNSW Vector Store                                        │
 │  .rvf/docs.json (existing ruvector)                             │
 │  .rvf/patterns.json (existing agent-team)                       │
 │  .rvf/learning/ (new - episodes, skills, sona-weights)          │
 └─────────────────────────────────────────────────────────────────┘

 ---
 Phase 1: Domain Expert Agents (FIRST — agent-first approach)

 1a. Port 27 Telecom Agents

 Source: agents-yaml/agents/**/*.yaml → Target:
 .pi/agents/experts/telecom/

 Fully migrate each YAML to .md format. System prompt distills: name,
 description, capabilities, patterns, algorithms, performance_targets, KPI
  focus.

 Files to create (27 agents):
 .pi/agents/experts/telecom/
   accessibility/admission.md, capacity.md
   retainability/alarm.md, resilience.md
   mobility/mobility.md, neighbor.md
   throughput/throughput.md, link-adaptation.md, carrier-aggregation.md
   availability/enm-api.md
   integrity/antenna.md, power.md, beam.md, interference.md
   utilization/loadbalance.md, energy.md, coverage.md
   cross-domain/rrm.md, learning.md, 4g-lte.md, 5g-nr.md
   sparc/architect.md, coder.md, reviewer.md, tester.md,
 security-architect.md

 Each .md frontmatter: name, description, model: auto, tools (relevant
 subset)
 System prompt: distilled from YAML capabilities + algorithms +
 performance_targets + KPI focus.

 1b. New Software Engineering Domain Agents

 Target: .pi/agents/experts/ — all using .md format, model: auto

 Backend (.pi/agents/experts/backend/):
 postgres.md, mongodb.md, redis.md, graphql.md

 Frontend (.pi/agents/experts/frontend/):
 react.md, vue.md, threejs.md, tailwind.md

 Infrastructure (.pi/agents/experts/infra/):
 docker.md, kubernetes.md, aws.md, terraform.md

 Security (.pi/agents/experts/security/):
 auth.md, owasp.md, devsecops.md

 Testing (.pi/agents/experts/testing/):
 cypress.md, jest.md, playwright.md

 Mobile (.pi/agents/experts/mobile/):
 react-native.md, swift.md, kotlin.md

 Science (.pi/agents/experts/science/):
 ml-researcher.md, data-scientist.md, bioinformatics.md, physicist.md,
 statistician.md

 Business (.pi/agents/experts/business/):
 product-manager.md, analyst.md, marketer.md, finance.md

 1c. Provider Agents

 .pi/agents/providers/
   gemini.md     — Routes tasks to Gemini CLI/API
   codex.md      — Routes tasks to Codex CLI/OpenAI API
   ruvllm.md     — Local model specialist (privacy-first, no internet)

 1d. Factory Agent

 .pi/agents/factory.md — All-in-one agent with bash + write tools
 - Reads agents-yaml/ YAML for telecom context
 - Generates new .pi/agents/experts/{domain}/{role}.md on demand
 - Also writes .claude/agents/ version of each agent created

 1e. Domain Manifest

 .pi/agents/domains.yaml — Template classes + agent registry:
 template_classes:
   backend: { tools: [bash, read, write, edit], focus: "server-side
 implementation" }
   frontend: { tools: [bash, read, write, edit], focus: "UI/UX
 implementation" }
   science: { tools: [bash, read], focus: "research and analysis" }
   ...

 agents:
   - name: postgres
     domain: backend
     template: backend
     specialization: "PostgreSQL database design, optimization,
 migrations"
   ...

 1f. Update teams.yaml

 Add to .pi/agents/teams.yaml:
 # Provider teams
 providers:
   - gemini
   - codex
   - ruvllm

 # Software engineering domain teams
 backend-team:
   - postgres
   - mongodb
   - redis
   - graphql

 frontend-team:
   - react
   - vue
   - tailwind

 fullstack-team:
   - react
   - postgres
   - docker
   - auth
   - jest

 security-team:
   - auth
   - owasp
   - devsecops
   - red-team

 infra-team:
   - docker
   - kubernetes
   - aws
   - terraform

 science-team:
   - ml-researcher
   - data-scientist
   - statistician

 business-team:
   - product-manager
   - analyst
   - finance

 # Telecom teams
 telecom-ran:
   - rrm
   - throughput
   - mobility
   - retainability
   - learning

 telecom-integrity:
   - antenna
   - power
   - beam
   - interference
   - coverage

 # Mega swarm (dynamic dispatch)
 mega-swarm:
   - coordinator
   - planner
   - coder
   - reviewer
   - tester
   - researcher

 domain-factory:
   - factory
   - coordinator
   - reviewer

 ---
 Phase 2: extensions/orchestration.ts (Providers + Swarm)

 New file: extensions/orchestration.ts

 Provider Tools

 // Runtime availability detection before each call
 gemini_run(prompt: string, files?: string[], model?: string): ToolResult
   // Spawns: gemini [prompt] [--model model]
   // If not available: returns install instructions

 codex_run(prompt: string, files?: string[], model?: string): ToolResult
   // Spawns: codex [prompt] [--model model]

 ruvllm_run(prompt: string, model?: string): ToolResult
   // POST http://localhost:8080/v1/chat/completions
   // Falls back to spawn: ruvllm chat [model]

 auto_route(prompt: string, priority?:
 "quality"|"speed"|"cost"|"privacy"): ToolResult
   // Keyword detection: "local"/"private" → ruvllm, "search"/"research" →
  gemini
   // Complexity heuristic: simple → codex, complex → gemini
   // LLM system prompt instruction: "always use auto_route() to pick the
 best provider"

 Swarm Tools

 swarm_init(topology: "hierarchical"|"mesh"|"ring"|"star", maxAgents?:
 number): ToolResult
 swarm_dispatch(agentId: string, task: string, role?: string): ToolResult
 swarm_status(): ToolResult
 swarm_broadcast(message: string): ToolResult
 conflict_check(files: string[]): ToolResult
   // Severity levels: low/medium/high/critical

 Commands + Status

 Commands: /provider <name>, /swarm <topology>, /providers, /route <task>

 Footer: ctx.ui.setStatus("provider", "[Provider: auto]") +
 ctx.ui.setStatus("swarm", "[Swarm: idle]")

 System prompt injection via before_agent_start:
 Available providers: gemini (CLI), codex (CLI), ruvllm (localhost:8080).
 Use auto_route(task) to select the best provider. Use
 gemini_run/codex_run/ruvllm_run for explicit routing.

 ---
 Phase 3: extensions/learning.ts (AgentDB + ReasoningBank + SONA)

 New file: extensions/learning.ts

 Dependencies

 Add to package.json:
 "@claude-flow/agentdb": "^3.0.0-alpha",
 "@google/generative-ai": "latest",
 "openai": "latest",
 "typescript": "^5.0.0"

 Storage

 All data in .rvf/learning/ (no collision with existing .rvf/docs.json and
  .rvf/patterns.json):
 - .rvf/learning/episodes.json — ReflexionMemory episodes
 - .rvf/learning/skills.json — SkillLibrary
 - .rvf/learning/patterns.json — ReasoningBank
 - .rvf/learning/sona-weights.json — SONA adaptive weights

 Embeddings via @ruvector/rvf-node's built-in embedding API.

 Learning Trigger (Loose Coupling)

 pi.on("agent_end", async (event, ctx) => {
   // Auto-store every completed task as episode
   await agentdb.storeEpisode({
     task: event.input,
     output: event.output,
     quality: assessQuality(event),  // heuristic from tool
 success/failure
     timestamp: Date.now()
   });
   // SONA tier 1: instant adapt
   await sona.instantAdapt(event.input, event.output, quality);
   ctx.ui.setStatus("learning", `[Episodes: ${episodeCount}]`);
 });

 Tools

 agentdb_start_session(agentId: string, task: string): ToolResult
 agentdb_predict(sessionId: string, state: string): ToolResult
 agentdb_feedback(sessionId: string, reward: number, outcome: string):
 ToolResult
 agentdb_train(namespace?: string): ToolResult
 reflexion_store_episode(task: string, critique: string, outcome: string):
  ToolResult
 reflexion_retrieve(query: string, k?: number): ToolResult
 skill_create(name: string, description: string, code: string): ToolResult
 skill_search(query: string, k?: number): ToolResult
 sona_adapt(query: string, response: string, quality: number): ToolResult
 sona_stats(): ToolResult

 Commands + Status

 Commands: /learn-stats, /remember, /forget, /skills

 Footer: ctx.ui.setStatus("learning", "[Episodes: 0] [Skills: 0]")

 SONA Three-Tier (Full Port)

 Source:
 /references/agentic-flow/agentic-flow/src/llm/RuvLLMOrchestrator.ts
 - Tier 1 (<1ms): MicroLoRA instant adapt — update weight vectors for
 pattern frequency
 - Tier 2 (~100ms): Background consolidation — cluster related episodes,
 extract skills
 - Tier 3 (async): Deep optimization — full HNSW reindex + SONA weight
 optimization

 ---
 Phase 4: Update Existing Files

 Update extensions/cross-agent.ts

 Extend scan to discover new subdirectories:
 - .pi/agents/experts/**/*.md
 - .pi/agents/providers/*.md

 Register each discovered expert as a command: /postgres-expert,
 /react-expert, etc.

 Update .pi/agents/agent-chain.yaml

 Add new chains:
 provider-research:
   description: "RAG-enhanced research using ruvector + researcher +
 planner"
   steps:
     - agent: ruvector
       prompt: "Index relevant files for: $INPUT"
     - agent: researcher
       prompt: "Research: $INPUT using indexed knowledge"
     - agent: planner
       prompt: "Create implementation plan for: $ORIGINAL"

 expert-build:
   description: "Domain-expert implementation with review"
   steps:
     - agent: planner
       prompt: "Architect solution for: $INPUT"
     - agent: coder
       prompt: "Implement: $INPUT (plan: $INPUT)"
     - agent: reviewer
       prompt: "Review implementation for: $ORIGINAL"

 learn-improve:
   description: "Pattern-aware coding using past episodes"
   steps:
     - agent: scout
       prompt: "Explore codebase for context: $INPUT"
     - agent: ruvector
       prompt: "Search similar patterns: $INPUT"
     - agent: coder
       prompt: "Code using patterns: $INPUT"

 full-swarm:
   description: "Coordinator dispatches parallel domain experts"
   steps:
     - agent: coordinator
       prompt: "Break down and dispatch to domain experts: $INPUT"

 mega-swarm:
   description: "All available experts on a complex task"
   steps:
     - agent: coordinator
       prompt: "Orchestrate all relevant domain experts for: $INPUT"
     - agent: reviewer
       prompt: "Aggregate and validate results for: $ORIGINAL"
     - agent: documenter
       prompt: "Document final solution for: $ORIGINAL"

 telecom-analysis:
   description: "Telecom RAN analysis chain"
   steps:
     - agent: rrm
       prompt: "RRM analysis for: $INPUT"
     - agent: throughput
       prompt: "Throughput optimization for: $ORIGINAL (context: $INPUT)"
     - agent: learning
       prompt: "Extract learnings from analysis: $ORIGINAL"

 New scripts/sync-agents.ts

 One-way sync: .pi/agents/**/*.md → .claude/agents/

 Transformation:
 - Pi .md frontmatter → Claude agent YAML/MD format
 - Preserve system prompt body
 - Map Pi tools list to Claude equivalent tool names
 - Handle subdirectory structure mirroring

 Run via: bun scripts/sync-agents.ts
 Also: just sync-agents (justfile recipe)

 Update justfile

 Add recipes:
 # New extensions
 ext-orchestration:
     pi -e extensions/orchestration.ts

 ext-learning:
     pi -e extensions/learning.ts

 # Combined mega-swarm session
 ext-mega:
     pi -e extensions/orchestration.ts -e extensions/learning.ts -e
 extensions/agent-team.ts -e extensions/ruvector.ts

 # Domain expert team sessions
 ext-backend-team:
     pi -e extensions/orchestration.ts -e extensions/learning.ts -e
 extensions/agent-team.ts

 ext-telecom:
     pi -e extensions/orchestration.ts -e extensions/learning.ts -e
 extensions/agent-team.ts

 # Utilities
 sync-agents:
     bun scripts/sync-agents.ts

 Update README.md

 - Add orchestration.ts and learning.ts to Extensions table
 - Add new teams to Built-in Teams table
 - Add domain expert categories to Built-in Agents table
 - Add RuvLLM integration to Multi-Agent Workflows section

 Update .pi/settings.json

 Add AgentDB MCP server:
 {
   "mcpServers": {
     "rvf": { ... existing ... },
     "agentdb": {
       "command": "npx",
       "args": ["@claude-flow/agentdb", "mcp", "--transport", "stdio"],
       "env": { "AGENTDB_PATH": ".rvf/learning" }
     }
   }
 }

 ---
 Critical Files Summary

 File: extensions/orchestration.ts
 Action: Create
 Purpose: Providers (gemini/codex/ruvllm) + swarm coordination
 ────────────────────────────────────────
 File: extensions/learning.ts
 Action: Create
 Purpose: AgentDB + ReasoningBank + SONA self-learning
 ────────────────────────────────────────
 File: scripts/sync-agents.ts
 Action: Create
 Purpose: One-way .pi/agents → .claude/agents sync
 ────────────────────────────────────────
 File: .pi/agents/experts/telecom/*.md (27)
 Action: Create
 Purpose: Ported telecom YAML agents
 ────────────────────────────────────────
 File: .pi/agents/experts/**/*.md (~35)
 Action: Create
 Purpose: New domain expert agents
 ────────────────────────────────────────
 File: .pi/agents/providers/*.md (3)
 Action: Create
 Purpose: Gemini, Codex, RuvLLM provider agents
 ────────────────────────────────────────
 File: .pi/agents/factory.md
 Action: Create
 Purpose: Domain agent factory
 ────────────────────────────────────────
 File: .pi/agents/domains.yaml
 Action: Create
 Purpose: Domain agent manifest
 ────────────────────────────────────────
 File: .pi/agents/teams.yaml
 Action: Modify
 Purpose: Add 12 new team definitions
 ────────────────────────────────────────
 File: .pi/agents/agent-chain.yaml
 Action: Modify
 Purpose: Add 6 new chains
 ────────────────────────────────────────
 File: extensions/cross-agent.ts
 Action: Modify
 Purpose: Discover experts/ + providers/ directories
 ────────────────────────────────────────
 File: justfile
 Action: Modify
 Purpose: Add 6 new recipes
 ────────────────────────────────────────
 File: README.md
 Action: Modify
 Purpose: Document new extensions + agents + teams
 ────────────────────────────────────────
 File: .pi/settings.json
 Action: Modify
 Purpose: Add agentdb MCP server
 ────────────────────────────────────────
 File: package.json
 Action: Modify
 Purpose: Add 4 new npm dependencies

 ---
 Key Reference Files

 What: Telecom agent YAML sources
 Where: agents-yaml/agents/**/*.yaml
 ────────────────────────────────────────
 What: SONA port source
 Where: references/agentic-flow/agentic-flow/src/llm/RuvLLMOrchestrator.ts
 ────────────────────────────────────────
 What: ReasoningBank source
 Where: references/agentic-flow/agentic-flow/src/reasoningbank/
 ────────────────────────────────────────
 What: Swarm patterns
 Where: references/agentic-flow/agentic-flow/src/swarm/
 ────────────────────────────────────────
 What: RuvLLM HTTP API
 Where: references/ruvector/crates/ruvllm-cli/ (serves on localhost:8080)
 ────────────────────────────────────────
 What: Existing extension patterns
 Where: extensions/agent-team.ts, extensions/ruvector.ts,
   extensions/opencode.ts
 ────────────────────────────────────────
 What: Pi Extension API
 Where: pi-mono.md (registerTool, registerCommand, pi.on events)

 ---
 Verification

 1. Agent loading: pi -e extensions/orchestration.ts — check /providers
 shows gemini/codex/ruvllm with availability
 2. Provider routing: ask auto_route("write a quick function") — verify it
  picks a provider
 3. Learning: pi -e extensions/learning.ts — complete a task, run
 /learn-stats to see episode count increase
 4. Skills: run /skills — verify skill library is searchable
 5. Swarm: swarm_init("hierarchical", 4) then swarm_dispatch — verify
 conflict detection works
 6. Domain agents: /system to pick postgres expert — verify it has
 PostgreSQL-specific knowledge
 7. Telecom agents: dispatch rrm agent — verify it references RAN-specific
  KPIs and parameters
 8. Factory: prompt factory.md to create a new redis-streams.md expert —
 verify file is written
 9. Sync: just sync-agents — verify .claude/agents/ mirrors
 .pi/agents/experts/
 10. Chains: /chain expert-build then run a task — verify
 planner→coder→reviewer sequence
 11. Mega session: just ext-mega — verify all extensions co-load without
 conflicts