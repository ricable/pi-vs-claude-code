set dotenv-load := true

default:
    @just --list

# g1

# 1. default pi
pi:
    pi

# 2. Pure focus pi: strip footer and status line entirely
ext-pure-focus:
    pi -e extensions/pure-focus.ts

# 3. Minimal pi: model name + 10-block context meter
ext-minimal:
    pi -e extensions/minimal.ts -e extensions/theme-cycler.ts

# 4. Cross-agent pi: load commands from .claude/, .gemini/, .codex/ dirs
ext-cross-agent:
    pi -e extensions/cross-agent.ts -e extensions/minimal.ts

# 5. Purpose gate pi: declare intent before working, persistent widget, focus the system prompt on the ONE PURPOSE for this agent
ext-purpose-gate:
    pi -e extensions/purpose-gate.ts -e extensions/minimal.ts

# 6. Customized footer pi: Tool counter, model, branch, cwd, cost, etc.
ext-tool-counter:
    pi -e extensions/tool-counter.ts

# 7. Tool counter widget: tool call counts in a below-editor widget
ext-tool-counter-widget:
    pi -e extensions/tool-counter-widget.ts -e extensions/minimal.ts

# 8. Subagent widget: /sub <task> with live streaming progress
ext-subagent-widget:
    pi -e extensions/subagent-widget.ts -e extensions/pure-focus.ts -e extensions/theme-cycler.ts

# 9. TillDone: task-driven discipline — define tasks before working
ext-tilldone:
    pi -e extensions/tilldone.ts -e extensions/theme-cycler.ts

#g2

# 10. Agent team: dispatcher orchestrator with team select and grid dashboard
ext-agent-team:
    pi -e extensions/agent-team.ts -e extensions/theme-cycler.ts

# 11. System select: /system to pick an agent persona as system prompt
ext-system-select:
    pi -e extensions/system-select.ts -e extensions/minimal.ts -e extensions/theme-cycler.ts

# 12. Launch with Damage-Control safety auditing
ext-damage-control:
    pi -e extensions/damage-control.ts -e extensions/minimal.ts -e extensions/theme-cycler.ts

# 13. Agent chain: sequential pipeline orchestrator
ext-agent-chain:
    pi -e extensions/agent-chain.ts -e extensions/theme-cycler.ts

#g3

# 14. Pi Pi: meta-agent that builds Pi agents with parallel expert research
ext-pi-pi:
    pi -e extensions/pi-pi.ts -e extensions/theme-cycler.ts

# 15. RuVector: document/code indexing + semantic search (RAG)
ext-ruvector:
    pi -e extensions/ruvector.ts -e extensions/theme-cycler.ts

# 16. OpenCode: route coding tasks to a local opencode server
# Start opencode first: opencode serve
# Then connect: /oc-connect http://127.0.0.1:4096
ext-opencode:
    OC_BASE_URL=http://127.0.0.1:4096 pi -e extensions/opencode.ts -e extensions/minimal.ts

# 17. Vector team: ruvector knowledge base + agent-team dispatcher
ext-vector-team:
    OC_BASE_URL=http://127.0.0.1:4096 pi -e extensions/ruvector.ts -e extensions/opencode.ts -e extensions/agent-team.ts -e extensions/theme-cycler.ts

#ext

# 15. Session Replay: scrollable timeline overlay of session history (legit)
ext-session-replay:
    pi -e extensions/session-replay.ts -e extensions/minimal.ts

# 16. Theme cycler: Ctrl+X forward, Ctrl+Q backward, /theme picker
ext-theme-cycler:
    pi -e extensions/theme-cycler.ts -e extensions/minimal.ts

#g4

# 18. Orchestration: provider routing (gemini/codex/ruvllm) + swarm coordination
ext-orchestration:
    pi -e extensions/orchestration.ts

# 18b. Provider Router: TinyDancer neural routing + pi-ai model providers
ext-provider-router:
    pi -e extensions/provider-router.ts

# 19. Learning: AgentDB + ReasoningBank + SONA self-learning
ext-learning:
    pi -e extensions/learning.ts

# 20. Combined mega-swarm session: all extensions loaded
ext-mega:
    pi -e extensions/orchestration.ts -e extensions/learning.ts -e extensions/agent-team.ts -e extensions/ruvector.ts

# 21. Backend team: orchestration + learning + agent-team for backend work
ext-backend-team:
    pi -e extensions/orchestration.ts -e extensions/learning.ts -e extensions/agent-team.ts

# 22. Telecom team: orchestration + learning + agent-team for telecom analysis
ext-telecom:
    pi -e extensions/orchestration.ts -e extensions/learning.ts -e extensions/agent-team.ts

# 24. Swarm demo: 10 federated agents with RVF consensus
ext-swarm-demo:
    pi -e extensions/swarm-demo.ts -e extensions/learning.ts

# 25. Full swarm demo: all extensions combined
ext-swarm-full:
    pi -e extensions/swarm-demo.ts -e extensions/orchestration.ts -e extensions/learning.ts -e extensions/agent-team.ts

# 23. Sync agents: mirror .pi/agents → .claude/agents
sync-agents:
    bun scripts/sync-agents.ts

# utils

# Open pi with one or more stacked extensions in a new terminal: just open minimal tool-counter
open +exts:
    #!/usr/bin/env bash
    args=""
    for ext in {{exts}}; do
        args="$args -e extensions/$ext.ts"
    done
    cmd="cd '{{justfile_directory()}}' && pi$args"
    escaped="${cmd//\\/\\\\}"
    escaped="${escaped//\"/\\\"}"
    osascript -e "tell application \"Terminal\" to do script \"$escaped\""

# Open every extension in its own terminal window
all:
    just open pi
    just open pure-focus 
    just open minimal theme-cycler
    just open cross-agent minimal
    just open purpose-gate minimal
    just open tool-counter
    just open tool-counter-widget minimal
    just open subagent-widget pure-focus theme-cycler
    just open tilldone theme-cycler
    just open agent-team theme-cycler
    just open system-select minimal theme-cycler
    just open damage-control minimal theme-cycler
    just open agent-chain theme-cycler
    just open pi-pi theme-cycler