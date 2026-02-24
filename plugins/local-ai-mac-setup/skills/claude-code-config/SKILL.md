---
name: claude-code-config
description: "Configure Claude Code memory hierarchy, permissions, hooks, MCP servers, custom commands, agents, skills, and plugins. Use when setting up a new project, adjusting permissions, adding hooks or MCP servers, creating custom slash commands, or configuring the plugin system."
---

# Claude Code Configuration

## Memory Hierarchy (5 levels, highest precedence first)

| Level | Location | Scope | Shared? |
|-------|----------|-------|---------|
| **Managed policy** | `/Library/Application Support/ClaudeCode/` (macOS) | Org-wide | All users |
| **User memory** | `~/.claude/CLAUDE.md` | Personal, all projects | No |
| **Project memory** | `<project>/CLAUDE.md` or `<project>/.claude/CLAUDE.md` | Team-shared | Via git |
| **Project rules** | `<project>/.claude/rules/*.md` | Modular topic files | Via git |
| **Local memory** | `<project>/CLAUDE.local.md` | Personal per-project | Auto-gitignored |

Higher levels override lower. Claude reads CLAUDE.md from cwd upward to root, discovers nested ones on access.

### Settings Files

| File | Purpose | Shared? |
|------|---------|---------|
| `~/.claude/settings.json` | User settings (global) | No |
| `.claude/settings.json` | Project settings | Yes (checked in) |
| `.claude/settings.local.json` | Local project overrides | No (gitignored) |
| `.mcp.json` | Project MCP servers | Yes |
| Managed `managed-settings.json` | Enterprise policy | Org-wide |

**Override order**: Enterprise > User > Project > Local > CLAUDE.md

### Bootstrap

```bash
/init              # Generate CLAUDE.md for current project
```

Keep CLAUDE.md under ~500 lines. Move reference material to skills (loaded on-demand).

## Permissions System

Permissions in `settings.json` are processed: **deny > ask > allow**. First match wins.

```json
{
  "permissions": {
    "deny": ["Bash(git push *)"],
    "ask": ["Bash"],
    "allow": [
      "Bash(npm run *)",
      "Bash(git commit *)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(* --version)",
      "Bash(* --help *)"
    ]
  }
}
```

### Permission Modes

| Mode | Description |
|------|-------------|
| `default` | Interactive approval for each tool |
| `plan` | Read-only, no modifications |
| `acceptEdits` | Auto-accept Read/Write/Edit |
| `bypassPermissions` | Skip all prompts |

```bash
claude --permission-mode acceptEdits
claude --permission-mode plan -p "Review this codebase"
```

### Strict Security (Enterprise)

```json
{
  "permissions": {
    "disableBypassPermissionsMode": "disable",
    "deny": ["WebSearch", "WebFetch"],
    "ask": ["Bash"]
  },
  "allowManagedPermissionRulesOnly": true,
  "allowManagedHooksOnly": true,
  "sandbox": {
    "autoAllowBashIfSandboxed": false,
    "network": {
      "allowAllUnixSockets": false,
      "allowLocalBinding": false,
      "allowedDomains": []
    }
  }
}
```

### Tool Access Patterns

## Bundled Resources

- **[HOOKS-PATTERNS.md](references/HOOKS-PATTERNS.md)** — Hook event patterns with logging, formatting, validation, and external service integration examples
- **[setup command](commands/setup.md)** — Interactive `/claude-code-config:setup` for CLAUDE.md initialization, hooks, MCP, and permissions

## Tool Access Patterns

```yaml
allowed-tools: Read, Grep, Glob           # Read-only
allowed-tools: Bash(git:*)                 # Only git
allowed-tools: Bash(npm:*), Bash(docker:*) # npm + docker
allowed-tools: Bash(*), Read, Write        # Full access
```

## Hooks System

Hooks fire automatically on lifecycle events. All matching hooks run in parallel.

### 12 Hook Events

| Event | Fires When |
|-------|------------|
| `PreToolUse` | Before tool execution (can block/modify) |
| `PostToolUse` | After tool succeeds |
| `PostToolUseFailure` | After tool fails |
| `Notification` | Claude sends notification |
| `Stop` | Claude finishes responding |
| `SubagentStop` | Subagent finishes |
| `SubagentStart` | Subagent spawned |
| `PreCompact` | Before context compaction |
| `SessionStart` | Session begins/resumes |
| `SessionEnd` | Session terminates |
| `UserPromptSubmit` | User submits prompt (before processing) |
| `PermissionRequest` | Permission dialog appears |

### 3 Hook Types

| Type | Description |
|------|-------------|
| `command` | Shell command. Deterministic, fast. |
| `prompt` | Single-turn LLM evaluation. |
| `agent` | Multi-turn AI with tool access. |

### Configuration in settings.json

Events are top-level keys (no wrapper):

```json
{
  "PreToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "prompt",
          "prompt": "Validate file write safety."
        }
      ]
    }
  ],
  "Stop": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "prompt",
          "prompt": "Verify task completion."
        }
      ]
    }
  ]
}
```

### Configuration in Plugin hooks.json

Wrapped with `"hooks"` key:

```json
{
  "description": "Security hook for file edits",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ${CLAUDE_PLUGIN_ROOT}/hooks/security_hook.py"
          }
        ]
      }
    ]
  }
}
```

### Configuration in Skill YAML Frontmatter

```yaml
---
name: secure-operations
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/security-check.sh"
---
```

### Hook I/O

**Input (stdin JSON)** -- common fields:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/working/dir",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse"
}
```

Event-specific: `PreToolUse` adds `tool_name`, `tool_input`. `PostToolUse` adds `tool_response`, `tool_use_id`. `UserPromptSubmit` adds `user_prompt`. `Stop`/`SubagentStop` adds `reason`.

**Output (stdout JSON)**:

```json
{
  "continue": true,
  "suppressOutput": false,
  "systemMessage": "Message for Claude"
}
```

**PreToolUse decisions** (allow/deny/ask):

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "Approved by policy",
    "updatedInput": { "field": "modified value" }
  }
}
```

## MCP Server Configuration

### Transport Types

| Type | Use Case |
|------|----------|
| `stdio` | Local process (tools needing system access) |
| `http` | Cloud-hosted (recommended for remote) |
| `sse` | Legacy remote (deprecated, use http) |

### Adding Servers

```bash
# Stdio
claude mcp add <name> -- <command> [args...]
claude mcp add --env API_KEY=xxx myserver -- npx -y my-mcp-server

# HTTP
claude mcp add --transport http notion https://mcp.notion.com/mcp
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer $TOKEN"

# From JSON
claude mcp add-json weather '{"type":"http","url":"https://api.weather.com/mcp","headers":{"Authorization":"Bearer token"}}'
claude mcp add-json tool '{"type":"stdio","command":"/path/to/cli","args":["--key","abc"]}'
```

### Managing

```bash
claude mcp list           # List all
claude mcp get <name>     # Details
claude mcp remove <name>  # Remove
/mcp                      # Interactive status + tool discovery
```

### Plugin MCP (.mcp.json)

Auto-starts when plugin enables. Supports `${CLAUDE_PLUGIN_ROOT}` and env var injection:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/servers/server.js"],
      "env": { "API_KEY": "${API_KEY}" }
    }
  }
}
```

### Tool Naming

MCP tools: `mcp__<server>__<tool>`. Use `/mcp` to discover all tools and schemas.

## Custom Slash Commands

Markdown files auto-discovered from plugin `commands/` directory.

### Format

```markdown
---
description: Brief description
argument-hint: [arg1] [arg2]
allowed-tools: Read, Write, Edit, Bash(git:*)
model: sonnet
---

Command prompt here. Use $ARGUMENTS for all args, $1/$2 for positional.
Include files with @path/to/file or @$1.
Execute bash inline with !`command`.
Reference plugin root with ${CLAUDE_PLUGIN_ROOT}.
```

### Frontmatter Fields

| Field | Description |
|-------|-------------|
| `description` | Shown in `/help` |
| `argument-hint` | Expected arguments |
| `allowed-tools` | Tools available during command |
| `model` | Model override (sonnet/opus/haiku) |
| `name` | Command name (defaults to filename) |

### Example: PR Review

```markdown
---
description: Complete PR review workflow
argument-hint: [pr-number]
allowed-tools: Bash(gh:*), Read, Grep
---

# PR Review for #$1
!`gh pr view $1 --json title,body,author,files`
Files: !`gh pr diff $1 --name-only`
Checks: !`gh pr checks $1`
Summarize issues and provide approval recommendation.
```

## Agents (as Markdown)

Specialized subagents defined as `.md` files in `.claude/agents/` or plugin `agents/`.

```markdown
---
name: agent-identifier
description: Use this agent when [conditions]. Examples:
  <example>
  Context: [situation]
  user: "[request]"
  assistant: "[response]"
  </example>
model: inherit
color: blue
tools: ["Read", "Write", "Grep"]
---

You are [role description]...

**Core Responsibilities:**
1. [task 1]
2. [task 2]
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Agent identifier |
| `description` | Yes | Trigger conditions with examples |
| `model` | Yes | `inherit` (recommended), sonnet, opus, haiku |
| `tools` | No | Available tools (least privilege) |
| `color` | No | UI display color |

## Skills

On-demand knowledge modules. Auto-discovered from `skills/` directory.

```
skill-name/
  SKILL.md              # Required
  references/           # Detailed docs
  examples/             # Working code
  scripts/              # Utilities
```

```yaml
---
name: Skill Name
description: When to use this skill
version: 1.0.0
---
```

## Plugin System

Bundles commands, agents, skills, hooks, and MCP servers.

### Directory Structure

```
plugin-name/
  .claude-plugin/
    plugin.json         # Required manifest
  commands/             # Slash commands (.md)
  agents/               # Subagent definitions (.md)
  skills/               # Skill subdirectories
  hooks/
    hooks.json          # Event handlers
  scripts/              # Utilities
  .mcp.json             # MCP server definitions
```

All component dirs at plugin root level, not inside `.claude-plugin/`.

### plugin.json

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "commands": ["./commands"],
  "agents": ["./agents"],
  "hooks": "./hooks/hooks.json",
  "mcpServers": "./.mcp.json"
}
```

### Loading

```bash
claude --plugin-dir /path/to/plugin
```

## Model Configuration

```json
{ "model": "opus" }
```

Or interactively: `/model`. In agent/command frontmatter: `model: inherit` (recommended).

| Model | Use Case |
|-------|----------|
| `opus` | Complex reasoning, architecture |
| `sonnet` | General development (default) |
| `haiku` | Quick lookups, simple tasks |

Extended thinking: enabled by default (31,999 tokens). Override: `MAX_THINKING_TOKENS=8000`.

## Key Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | API authentication |
| `MAX_THINKING_TOKENS` | Thinking budget (default 31999) |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | Max output tokens per request |
| `CLAUDE_CODE_INSTRUCTIONS` | Env-level instructions (highest precedence) |

## Built-in Tools

| Category | Tools |
|----------|-------|
| File ops | Read, Write, Edit, MultiEdit, NotebookEdit |
| Search | Glob, Grep, LS |
| Execution | Bash |
| Web | WebSearch, WebFetch |
| Orchestration | Task, AskUserQuestion, TodoWrite/TodoRead |

## CLI Quick Reference

```bash
claude                                    # Interactive mode
claude -p "query"                         # Headless mode
claude -p "query" --output-format json    # Structured output
claude --permission-mode plan -p "review" # Read-only analysis
claude --allowedTools "Bash,Read,Edit"    # Tool restrictions
claude --model haiku                      # Model override
claude --plugin-dir /path/to/plugin       # Load plugin
claude --debug                            # Verbose logging
```

### Slash Commands

| Command | Description |
|---------|-------------|
| `/init` | Bootstrap CLAUDE.md |
| `/clear` | Reset context |
| `/compact [focus]` | Compress context |
| `/model` | Switch model |
| `/mcp` | MCP server status |
| `/permissions` | View/manage rules |
| `/cost` | Token usage |
| `/doctor` | Diagnose issues |
| `/review` | Review changes |
| `/commit-push-pr` | Full git workflow |
