---
name: claude-agent-sdk
description: "Build production AI agents with the Claude Agent SDK (Python + TypeScript). Use when creating programmatic agents, defining custom tools, integrating MCP servers, configuring hooks, spawning subagents, or producing structured JSON output."
---

# Claude Agent SDK

Python and TypeScript library for building AI agents that read files, run commands, edit code, and execute tools with built-in agent loop management.

## Install

```bash
# TypeScript
npm install @anthropic-ai/claude-agent-sdk

# Python (uv recommended)
uv pip install claude-agent-sdk

# Python (pip)
pip3 install claude-agent-sdk
```

**Prerequisite**: Claude Code CLI must be installed.

## query() vs ClaudeSDKClient

| Feature | `query()` | `ClaudeSDKClient` |
|---------|-----------|-------------------|
| Session | New each time | Reuses same session |
| Conversation | Single exchange | Multi-turn |
| Interrupts | No | Yes |
| Hooks | No | Yes |
| Custom Tools | No | Yes |

Use `query()` for one-shot tasks. Use `ClaudeSDKClient` for interactive sessions needing multi-turn context, hooks, or custom tools.

## Quickstart -- query()

### TypeScript

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Analyze this codebase",
  options: {
    cwd: "/path/to/project",
    allowedTools: ["Read", "Grep", "Glob"],
    maxTurns: 3
  }
})) {
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}
```

### Python

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions, AssistantMessage, TextBlock

async def main():
    options = ClaudeAgentOptions(
        system_prompt="You are an expert Python developer",
        allowed_tools=["Read", "Write", "Bash"],
        permission_mode="acceptEdits",
        max_turns=5,
        cwd="/path/to/project",
        model="claude-sonnet-4-5",
    )

    async for message in query(prompt="Create hello.py", options=options):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    print(block.text)

asyncio.run(main())
```

## Stateful Client -- ClaudeSDKClient

Multi-turn conversation with context preservation:

```python
from claude_agent_sdk import ClaudeSDKClient, AssistantMessage, TextBlock, ResultMessage

async def main():
    async with ClaudeSDKClient() as client:
        await client.query("What's the capital of France?")
        async for msg in client.receive_response():
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        print(block.text)

        # Follow-up -- Claude remembers context
        await client.query("What's the population of that city?")
        async for msg in client.receive_response():
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        print(block.text)

asyncio.run(main())
```

### receive_response() vs receive_messages()

| Method | Returns | Use When |
|--------|---------|----------|
| `receive_response()` | AssistantMessage, ResultMessage | Only need final text |
| `receive_messages()` | All types (UserMessage, SystemMessage, ThinkingBlock) | Need full visibility |

## Custom Tools

### Python -- @tool decorator

```python
from claude_agent_sdk import tool, create_sdk_mcp_server, ClaudeAgentOptions

@tool("add", "Add two numbers", {"a": float, "b": float})
async def add(args):
    return {"content": [{"type": "text", "text": f"Sum: {args['a'] + args['b']}"}]}

@tool("divide", "Divide two numbers", {"a": float, "b": float})
async def divide(args):
    if args["b"] == 0:
        return {
            "content": [{"type": "text", "text": "Error: Division by zero"}],
            "is_error": True
        }
    return {"content": [{"type": "text", "text": f"{args['a'] / args['b']}"}]}

calculator = create_sdk_mcp_server(
    name="calculator", version="2.0.0", tools=[add, divide]
)

options = ClaudeAgentOptions(
    mcp_servers={"calc": calculator},
    allowed_tools=["mcp__calc__add", "mcp__calc__divide"]
)
```

**@tool signature**: `tool(name: str, description: str, input_schema: type | dict)`

Input schema: simple types `{"text": str, "count": int}` or full JSON Schema.

**create_sdk_mcp_server**: `create_sdk_mcp_server(name, version="1.0.0", tools=[...])`

### TypeScript -- Zod schema

```typescript
import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const server = createSdkMcpServer({
  name: "tools",
  version: "1.0.0",
  tools: [
    tool(
      "get_weather",
      "Get temperature for a location",
      {
        latitude: z.number().describe("Latitude"),
        longitude: z.number().describe("Longitude")
      },
      async (args) => {
        const resp = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${args.latitude}&longitude=${args.longitude}&current=temperature_2m`);
        const data = await resp.json();
        return { content: [{ type: "text", text: `${data.current.temperature_2m}C` }] };
      }
    )
  ]
});

for await (const message of query({
  prompt: "Weather in SF?",
  options: {
    mcpServers: { tools: server },
    allowedTools: ["mcp__tools__get_weather"],
    maxTurns: 3
  }
})) {
  if (message.type === "result") console.log(message.result);
}
```

### Tool Naming Convention

MCP tools: `mcp__<server_name>__<tool_name>`

```
mcp__calc__add           -- "add" from "calc" server
mcp__utils__get_time     -- "get_time" from "utils" server
mcp__myserver__*         -- wildcard all tools from server
```

## MCP Server Integration

### HTTP Transport

```python
options = ClaudeAgentOptions(
    mcp_servers={
        "docs": {"type": "http", "url": "https://code.claude.com/docs/mcp"}
    },
    allowed_tools=["mcp__docs__*"]
)
```

### Tool Search

For large tool sets, control when tool search activates:

```python
options = ClaudeAgentOptions(
    mcp_servers={...},
    env={"ENABLE_TOOL_SEARCH": "auto:5"}  # Enable at 5% threshold
)
```

Values: `"auto:<pct>"`, `"always"`, `"disabled"`.

## Hooks -- Event Interception

Available events: `PreToolUse` (before execution), `PostToolUse` (after execution).

### Security Validation Hook

```python
from claude_agent_sdk import query, ClaudeAgentOptions, HookMatcher, HookContext

async def validate_bash(input_data, tool_use_id, context):
    if input_data['tool_name'] == 'Bash':
        command = input_data['tool_input'].get('command', '')
        if 'rm -rf /' in command:
            return {
                'hookSpecificOutput': {
                    'hookEventName': 'PreToolUse',
                    'permissionDecision': 'deny',
                    'permissionDecisionReason': 'Dangerous command blocked'
                }
            }
    return {}

async def log_tool_use(input_data, tool_use_id, context):
    print(f"Tool: {input_data.get('tool_name')}")
    return {}

options = ClaudeAgentOptions(
    hooks={
        'PreToolUse': [
            HookMatcher(matcher='Bash', hooks=[validate_bash], timeout=120),
            HookMatcher(hooks=[log_tool_use])  # All tools
        ],
        'PostToolUse': [
            HookMatcher(hooks=[log_tool_use])
        ]
    }
)
```

### Hook Function Signature

```python
async def hook_fn(
    input_data: dict,       # tool_name + tool_input
    tool_use_id: str | None,
    context: HookContext
) -> dict:                  # Empty to allow, or deny payload
```

### HookMatcher Fields

| Field | Type | Description |
|-------|------|-------------|
| `matcher` | `str \| None` | Tool name to match (None = all) |
| `hooks` | `list[Callable]` | Async hook functions |
| `timeout` | `int` | Seconds (default: 60) |

## Programmatic Subagents

Define inline via `agents` parameter. Parent must include `"Task"` in allowedTools.

### AgentDefinition

```python
@dataclass
class AgentDefinition:
    description: str                    # When to use
    prompt: str                         # System prompt
    tools: list[str] | None = None     # Allowed tools (no "Task")
    model: str | None = None           # sonnet/opus/haiku/inherit
```

### Example

```python
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

async for message in query(
    prompt="Review auth module for security",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Grep", "Glob", "Task"],
        agents={
            "code-reviewer": AgentDefinition(
                description="Code review specialist for quality and security.",
                prompt="Identify vulnerabilities and suggest improvements.",
                tools=["Read", "Grep", "Glob"],
                model="sonnet"
            ),
            "test-runner": AgentDefinition(
                description="Runs and analyzes test suites.",
                prompt="Run tests and analyze results.",
                tools=["Bash", "Read", "Grep"]
            )
        }
    )
):
    if hasattr(message, "result"):
        print(message.result)
```

Subagents cannot spawn their own subagents. Never include `Task` in a subagent's tools.

## Structured JSON Output

### TypeScript (Zod)

```typescript
import { z } from 'zod';

const Plan = z.object({
  name: z.string(),
  steps: z.array(z.object({
    number: z.number(),
    description: z.string(),
    complexity: z.enum(['low', 'medium', 'high'])
  }))
});

for await (const msg of query({
  prompt: 'Plan dark mode for React app',
  options: { outputFormat: { type: 'json_schema', schema: z.toJSONSchema(Plan) } }
})) {
  if (msg.type === 'result' && msg.structured_output) {
    const plan = Plan.parse(msg.structured_output);
    console.log(plan.name);
  }
}
```

### Python (JSON Schema)

```python
schema = {
    "type": "object",
    "properties": {
        "company_name": {"type": "string"},
        "founded_year": {"type": "number"}
    },
    "required": ["company_name"]
}

async for msg in query(
    prompt="Research Anthropic",
    options=ClaudeAgentOptions(
        output_format={"type": "json_schema", "schema": schema}
    )
):
    if isinstance(msg, ResultMessage) and msg.structured_output:
        print(msg.structured_output)
```

## Session Resume

Capture `session_id` and pass via `resume` to continue with full context:

```python
session_id = None

async for message in query(
    prompt="Read the auth module",
    options=ClaudeAgentOptions(allowed_tools=["Read", "Glob"])
):
    if hasattr(message, "session_id"):
        session_id = message.session_id

# Resume
async for message in query(
    prompt="Find all callers",
    options=ClaudeAgentOptions(resume=session_id)
):
    if hasattr(message, "result"):
        print(message.result)
```

TypeScript supports `resumeSessionAt` for resuming at a specific message UUID. Use `forkSession: true` to branch into a new session.

## Message Types

| Type | Key Fields | Description |
|------|------------|-------------|
| `AssistantMessage` | `content`, `model` | Claude's response (text + tool use blocks) |
| `UserMessage` | `content` | User messages with ToolResultBlock |
| `TextBlock` | `text` | Text content |
| `ToolUseBlock` | `name`, `id`, `input` | Tool invocation |
| `ToolResultBlock` | `tool_use_id`, `content` | Tool result |
| `ThinkingBlock` | `thinking` | Extended thinking |
| `ResultMessage` | `result`, `total_cost_usd`, `session_id`, `num_turns`, `duration_ms` | Final result |
| `SystemMessage` | `subtype`, `data` | System events (init has session_id) |

## ClaudeAgentOptions Quick Reference

### Most-Used Properties

| Property (Python / TS) | Type | Description |
|------------------------|------|-------------|
| `allowed_tools` / `allowedTools` | `list[str]` | Allowed tool names |
| `system_prompt` / `systemPrompt` | `str \| dict` | Custom or preset+append |
| `mcp_servers` / `mcpServers` | `dict` | MCP server configs |
| `permission_mode` / `permissionMode` | `str` | acceptEdits, default, bypassPermissions |
| `max_turns` / `maxTurns` | `int` | Max conversation turns |
| `max_budget_usd` / `maxBudgetUsd` | `float` | Budget cap in USD |
| `model` | `str` | Claude model |
| `cwd` | `str` | Working directory |
| `resume` | `str` | Session ID to resume |
| `output_format` / `outputFormat` | `dict` | Structured JSON schema |
| `hooks` | `dict` | Hook event matchers |
| `agents` | `dict` | Subagent definitions |

### System Prompt Preset

Extend Claude Code's built-in prompt:

```python
options = ClaudeAgentOptions(
    system_prompt={
        "type": "preset",
        "preset": "claude_code",
        "append": "Always include type hints in Python."
    }
)
```

### TypeScript-Only Properties

| Property | Description |
|----------|-------------|
| `abortController` | Cancel running operations |
| `enableFileCheckpointing` | Track file changes for rewinding |
| `plugins` | Load plugins from local paths |
| `sandbox` | Sandbox configuration |
| `resumeSessionAt` | Resume at specific message UUID |

## Custom Permission Callback

```typescript
for await (const msg of query({
  prompt: "Analyze codebase",
  options: {
    canUseTool: async (toolName, input) => {
      if (toolName === "Bash" && input.command?.includes("rm")) {
        return { behavior: "deny", message: "Blocked" };
      }
      return { behavior: "allow" };
    }
  }
})) { /* ... */ }
```

## Abort (TypeScript)

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 30_000);

for await (const msg of query({
  prompt: "Analyze codebase",
  options: { abortController: controller, maxTurns: 50 }
})) {
  if (msg.type === "result") console.log(msg.result);
}
```

## Bundled Resources

- **[SDK-PATTERNS.md](references/SDK-PATTERNS.md)** — Common patterns (basic query, conversation, custom tools, tool-using agent, structured output, subagents, MCP integration, error handling)
- **Example agents** in `assets/examples/` — Complete working code samples
- **MCP Integration**: See `claude-code-config` skill for setting up MCP servers
- **Testing patterns**: See `verification-quality` skill for agent validation
```
