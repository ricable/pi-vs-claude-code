# /claude-code-config:setup Command

Initialize Claude Code configuration for a project or user.

## Usage

```bash
# Interactive setup wizard
/claude-code-config:setup

# Project setup with defaults
/claude-code-config:setup --scope project

# User setup
/claude-code-config:setup --scope user

# With specific permission mode
/claude-code-config:setup --scope project --permissions strict

# Initialize hooks
/claude-code-config:setup --hooks enable

# Full multi-provider setup
/claude-code-config:setup --scope project --mcp enable --hooks enable
```

## Scopes

| Scope | Location | Shared? | Purpose |
|-------|----------|---------|---------|
| `user` | `~/.claude/` | Personal | Personal settings, all projects |
| `project` | `.claude/` | Team-shared | Project-specific configuration |
| `local` | `.claude/CLAUDE.local.md` | Personal | Per-machine overrides |

## Permissions Profiles

```bash
# Ask before each tool use
/claude-code-config:setup --permissions interactive

# Auto-allow read operations
/claude-code-config:setup --permissions trust-read

# Strict enterprise (deny by default)
/claude-code-config:setup --permissions strict

# Development (maximum access)
/claude-code-config:setup --permissions development
```

## Configuration Options

### Basic Setup

Creates `CLAUDE.md` with:
- Project name and description
- Directory structure guidance
- Core rules (no proactive documentation, read before edit)
- File locations (src/, tests/, docs/, config/, scripts/)

```bash
/claude-code-config:setup --scope project --basic
```

### MCP Integration

Configure MCP (Model Context Protocol) servers:

```bash
/claude-code-config:setup --scope project --mcp enable
```

Options:
- `--mcp enable` — Add MCP server definitions
- `--mcp-servers context7,greptile` — Specific servers
- `--mcp-custom` — Add custom MCP server

### Hooks Setup

Initialize hooks for events:

```bash
/claude-code-config:setup --hooks enable --hook-events UserPromptSubmit,PostEdit
```

Adds hooks for:
- Logging
- Auto-formatting (PostEdit)
- Validation (PreToolUse)
- Integration with external services

### Permissions

Set permission rules:

```bash
/claude-code-config:setup --permissions strict --denied-tools WebFetch,WebSearch
```

Create rules for:
- Tool access (allow/deny/ask)
- File patterns (what files can be edited)
- Bash patterns (what commands are allowed)

## Generated Files

After setup, creates:

```
.claude/
├── CLAUDE.md              Project-specific rules
├── CLAUDE.local.md        Local machine overrides (gitignored)
├── settings.json          Project settings
├── hooks.json             Event hooks
└── rules/                 Modular topic rules
    ├── testing.md
    ├── security.md
    └── performance.md
```

## Workflow

```bash
# 1. Create basic project config
/claude-code-config:setup --scope project

# 2. Add hooks for auto-formatting
/claude-code-config:setup --hooks enable --hook-events PostEdit

# 3. Configure MCP servers
/claude-code-config:setup --scope project --mcp enable

# 4. Verify configuration
/claude-code-config:verify

# 5. Test with Claude Code
claude --check  # Validate config syntax
```

## Common Setups

### Python Project

```bash
/claude-code-config:setup --scope project \
  --test-framework pytest \
  --formatter black \
  --linter ruff
```

### Node Project

```bash
/claude-code-config:setup --scope project \
  --test-framework jest \
  --formatter prettier \
  --package-manager npm
```

### Enterprise Setup

```bash
/claude-code-config:setup --scope project \
  --permissions strict \
  --denied-tools WebFetch,WebSearch \
  --require-approval all-edits
```

See **HOOKS-PATTERNS.md** for hook examples and **PERMISSIONS-PATTERNS.md** for permission rules.
