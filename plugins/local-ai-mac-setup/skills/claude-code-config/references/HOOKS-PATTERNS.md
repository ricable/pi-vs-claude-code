# Claude Code Hooks Patterns

Guide for setting up hooks that execute on Claude Code events (tool use, file edits, sessions, etc.).

## Hook System Overview

Hooks are shell commands that execute in response to Claude Code events. They enable:
- Logging and observability
- Automatic formatting and validation
- Integration with external services
- Self-learning and adaptive behavior

## Hook Event Types

| Event | Trigger | Use Cases |
|-------|---------|-----------|
| `PreToolUse` | Before tool execution | Validate, log, dry-run |
| `PostToolUse` | After successful tool execution | Format output, validate |
| `PostToolUseFailure` | After tool failure | Retry logic, error handling |
| `PreEdit` | Before file editing (Edit/Write) | Backup, lint check |
| `PostEdit` | After successful edit | Format, compile check |
| `UserPromptSubmit` | Before processing user input | Normalize, context injection |
| `SessionStart` | Session begins | Initialize, load context |
| `SessionEnd` | Session ends | Cleanup, summarize |
| `SubagentStart` | Agent spawned | Track, record |
| `SubagentStop` | Agent stops | Report results |
| `Notification` | System notification | Log, forward |
| `PermissionRequest` | Permission prompt | Auto-approve trusted |

## Hook Configuration

Hooks are defined in `.claude/hooks.json`:

```json
{
  "hooks": [
    {
      "events": ["PreToolUse", "PostToolUse"],
      "enabled": true,
      "timeout": 3000,
      "continueOnError": true,
      "shell": "bash",
      "command": "echo '[Hook] Tool: ${TOOL_NAME}' >> logs/hooks.log"
    }
  ]
}
```

## Common Hook Patterns

### 1. Logging Hook

Log all tool usage to a file:

```json
{
  "events": ["PreToolUse"],
  "command": "echo '$(date +%s) | Tool: ${TOOL_NAME} | Args: ${TOOL_ARGS}' >> .claude/logs/tools.log"
}
```

### 2. Format On Edit

Auto-format files after editing:

```json
{
  "events": ["PostEdit"],
  "command": "prettier --write '${FILE_PATH}' 2>/dev/null || prettier --parser babel --write '${FILE_PATH}'"
}
```

### 3. Lint Check

Validate before committing:

```json
{
  "events": ["PreToolUse"],
  "enabled": true,
  "filter": {
    "toolName": "Bash",
    "pattern": "^(git commit|npm run (build|test)).*"
  },
  "command": "npm run lint --silent 2>&1 | head -20"
}
```

### 4. Backup Before Edit

Create backups before modifying files:

```json
{
  "events": ["PreEdit"],
  "command": "mkdir -p .claude/backups && cp '${FILE_PATH}' '.claude/backups/$(basename ${FILE_PATH}).bak'"
}
```

### 5. Self-Learning Hook

Capture successes for future reference:

```json
{
  "events": ["PostToolUse"],
  "filter": {
    "success": true
  },
  "command": "echo '${TOOL_NAME}: ${TOOL_OUTPUT}' >> .claude/successes.log && tail -20 .claude/successes.log > .claude/recent-successes.md"
}
```

### 6. Integration with External Service

Post events to observability platform:

```json
{
  "events": ["SessionEnd"],
  "command": "curl -s -X POST https://logs.example.com/events -d '{\"session_id\":\"${SESSION_ID}\",\"duration\":${DURATION}}' 2>/dev/null"
}
```

## Hook Filter Patterns

Hooks can filter to specific conditions:

```json
{
  "events": ["PreToolUse"],
  "filter": {
    "toolName": "Bash",
    "pattern": "^npm run build",
    "success": true,
    "tags": ["build", "test"]
  },
  "command": "echo 'Build successful'"
}
```

## Hook Variables Available

Inside hook commands, these variables are available:

```bash
${TOOL_NAME}           # Name of the tool (Bash, Edit, Read, etc.)
${TOOL_ARGS}          # Arguments passed to tool
${TOOL_OUTPUT}        # Output from tool (PostToolUse only)
${FILE_PATH}          # Current file path (for Edit/Read/Write)
${SESSION_ID}         # Current session ID
${TIMESTAMP}          # Current timestamp (ISO 8601)
${USER}              # Current user
${PWD}               # Current working directory
${EXIT_CODE}         # Exit code (PostToolUse failures)
${ERROR_MESSAGE}     # Error message (failures)
```

## Hook Configuration Best Practices

1. **Always set `continueOnError: true`** — Prevent hook failures from blocking work

```json
{
  "continueOnError": true,
  "timeout": 3000
}
```

2. **Set reasonable timeouts** — Default 3000ms (3 seconds)

```json
{
  "timeout": 5000  // 5 seconds for slower operations
}
```

3. **Filter carefully** — Don't run expensive hooks on every event

```json
{
  "filter": {
    "toolName": "Bash",
    "pattern": "^(git|npm)" // Only git and npm commands
  }
}
```

4. **Suppress output** — Redirect stdout/stderr when not needed

```json
{
  "command": "some-command &>/dev/null || true"
}
```

5. **Use absolute paths** — Ensure paths work from any directory

```json
{
  "command": "cat >> $HOME/.claude/hooks.log"
}
```

## Example Hook Configuration

Complete `.claude/hooks.json`:

```json
{
  "hooks": [
    {
      "events": ["UserPromptSubmit"],
      "enabled": true,
      "timeout": 1000,
      "continueOnError": true,
      "shell": "bash",
      "command": "echo '[$(date +%s)] User input received' >> .claude/logs/session.log"
    },
    {
      "events": ["PreToolUse"],
      "enabled": true,
      "timeout": 3000,
      "continueOnError": true,
      "filter": {
        "toolName": "Bash",
        "pattern": "^git"
      },
      "command": "echo 'Git command: ${TOOL_ARGS}' >> .claude/logs/git.log"
    },
    {
      "events": ["PostEdit"],
      "enabled": true,
      "timeout": 5000,
      "continueOnError": true,
      "command": "prettier --write '${FILE_PATH}' 2>/dev/null || true"
    },
    {
      "events": ["SessionEnd"],
      "enabled": true,
      "timeout": 2000,
      "continueOnError": true,
      "command": "echo 'Session completed at $(date)' >> .claude/logs/session.log"
    }
  ]
}
```

## Debugging Hooks

Enable hook debugging:

```bash
# Verbose hook output
export CLAUDE_HOOK_DEBUG=1
claude <command>

# Check hook syntax
jq empty .claude/hooks.json

# View hook logs
tail -f .claude/logs/hooks.log
```

## Related Resources

- **PERMISSIONS-PATTERNS.md** — Permission configuration patterns
- **MEMORY-HIERARCHY.md** — CLAUDE.md memory system
- See `.claude/hooks.json` in your project for working examples
