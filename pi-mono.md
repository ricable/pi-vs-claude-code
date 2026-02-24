# pi-mono Documentation

> Documentation extracted from https://github.com/badlogic/pi-mono

## Table of Contents

1. [pi-agent-core](#pi-agent-core)
2. [Extensions](#extensions)

---

## pi-agent-core

**Package**: `@mariozechner/pi-agent-core`

A stateful agent with tool execution and event streaming. Built on `@mariozechner/pi-ai`.

### Installation

```bash
npm install @mariozechner/pi-agent-core
```

### Core Concepts

The agent transforms between AgentMessage types (used internally) and LLM Message types (used for API calls).

**Message Flow Pipeline**:
1. Agent receives user input
2. Messages are transformed to LLM format via `convertToLlm`
3. Context is added via `transformContext`
4. LLM processes and returns
5. Response is transformed back to AgentMessage

### Event Flow

#### prompt() Event Sequence

1. `input` - User input received
2. `before_agent_start` - Can inject messages, modify system prompt
3. `agent_start` - Agent begins processing
4. `turn_start` - New turn begins
5. `context` - Context messages can be added
6. LLM generates response
7. If tool calls: `tool_call` → `tool_execution_start` → `tool_execution_update` → `tool_execution_end` → `tool_result`
8. `turn_end` - Turn completes
9. `agent_end` - Agent finishes

#### continue() Event Sequence

Same as above but continues from existing session state.

#### Event Types

| Event | Description |
|-------|-------------|
| `agent_start` | Agent started |
| `agent_end` | Agent finished |
| `turn_start` | New turn began |
| `turn_end` | Turn completed |
| `message_start` | New message started |
| `message_update` | Message content updated |
| `message_end` | Message completed |
| `tool_execution_start` | Tool execution began |
| `tool_execution_update` | Tool execution progress |
| `tool_execution_end` | Tool execution finished |

### Agent Options

```typescript
interface AgentOptions {
  system  model?: stringPrompt?: string;
;
  thinkingLevel?: "off" | "fast" | "deep";
  tools?: AgentTool[];
  convertToLlm?: (messages: AgentMessage[]) => LLMMessage[];
  transformContext?: (messages: AgentMessage[], systemPrompt: string) => AgentMessage[];
  steeringMode?: "auto" | "manual";
  followUpMode?: "auto" | "manual";
  streamFn?: (event: AgentEvent) => void;
  sessionId?: string;
  getApiKey?: () => string | Promise<string>;
  thinkingBudgets?: Record<string, number>;
}
```

### Agent State

```typescript
interface AgentState {
  systemPrompt: string;
  model: string;
  thinkingLevel: string;
  tools: AgentTool[];
  messages: AgentMessage[];
  isStreaming: boolean;
  streamMessage: AgentMessage | null;
  pendingToolCalls: ToolCall[];
  error: Error | null;
}
```

### Methods

| Method | Description |
|--------|-------------|
| `prompt(input)` | Send a prompt to the agent |
| `continue()` | Continue the current conversation |
| `setSystemPrompt(prompt)` | Update system prompt |
| `setModel(model)` | Change the model |
| `setThinkingLevel(level)` | Set thinking level (off/fast/deep) |
| `setTools(tools)` | Register tools |
| `replaceMessages(messages)` | Replace all messages |
| `appendMessage(message)` | Add a message |
| `clearMessages()` | Clear message history |
| `reset()` | Reset agent state |
| `abort()` | Abort current operation |
| `waitForIdle()` | Wait for agent to finish |
| `subscribe(fn)` | Subscribe to events |

### Steering

Interrupt agents during tool execution to modify behavior.

### Follow-up

Queue work while agent is busy.

### Custom Message Types

Use declaration merging to extend `AgentMessage`:

```typescript
declare module "@mariozechner/pi-agent-core" {
  interface AgentMessage {
    customType: string;
    customData: any;
  }
}
```

### Tools

Define tools using AgentTool with Typebox for parameter validation:

```typescript
const myTool = {
  name: "my_tool",
  label: "My Tool",
  description: "Does something useful",
  parameters: Type.Object({
    input: Type.String(),
  }),
  async execute(toolCallId, params, signal, onUpdate) {
    return {
      content: [{ type: "text", text: "result" }],
      details: {},
    };
  },
};
```

---

## Extensions

Extensions are TypeScript modules that extend pi's behavior. They can subscribe to lifecycle events, register custom tools callable by the LLM, add commands, and more.

### Key Capabilities

- **Custom tools** - Register tools the LLM can call via `pi.registerTool()`
- **Event interception** - Block or modify tool calls, inject context, customize compaction
- **User interaction** - Prompt users via `ctx.ui` (select, confirm, input, notify)
- **Custom UI components** - Full TUI components with keyboard input via `ctx.ui.custom()` for complex interactions
- **Custom commands** - Register commands like `/mycommand` via `pi.registerCommand()`
- **Session persistence** - Store state that survives restarts via `pi.appendEntry()`
- **Custom rendering** - Control how tool calls/results and messages appear in TUI

### Quick Start

Create `~/.pi/agent/extensions/my-extension.ts`:

```typescript
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export default function (pi: ExtensionAPI) {
  // React to events
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("Extension loaded!", "info");
  });

  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "bash" && event.input.command?.includes("rm -rf")) {
      const ok = await ctx.ui.confirm("Dangerous!", "Allow rm -rf?");
      if (!ok) return { block: true, reason: "Blocked by user" };
    }
  });

  // Register a custom tool
  pi.registerTool({
    name: "greet",
    label: "Greet",
    description: "Greet someone by name",
    parameters: Type.Object({
      name: Type.String({ description: "Name to greet" }),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      return {
        content: [{ type: "text", text: `Hello, ${params.name}!` }],
        details: {},
      };
    },
  });

  // Register a command
  pi.registerCommand("hello", {
    description: "Say hello",
    handler: async (args, ctx) => {
      ctx.ui.notify(`Hello ${args || "world"}!`, "info");
    },
  });
}
```

Test with `--extension` (or `-e`) flag:

```bash
pi -e ./my-extension.ts
```

### Extension Locations

Extensions are auto-discovered from:

| Location | Scope |
|----------|-------|
| `~/.pi/agent/extensions/*.ts` | Global (all projects) |
| `~/.pi/agent/extensions/*/index.ts` | Global (subdirectory) |
| `.pi/extensions/*.ts` | Project-local |
| `.pi/extensions/*/index.ts` | Project-local (subdirectory) |

Additional paths can be configured via `settings.json`:

```json
{
  "packages": [
    "npm:@foo/bar@1.0.0",
    "git:github.com/user/repo@v1"
  ],
  "extensions": [
    "/path/to/local/extension.ts",
    "/path/to/local/extension/dir"
  ]
}
```

### Available Imports

| Package | Purpose |
|---------|---------|
| `@mariozechner/pi-coding-agent` | Extension types (ExtensionAPI, ExtensionContext, events) |
| `@sinclair/typebox` | Schema definitions for tool parameters |
| `@mariozechner/pi-ai` | AI utilities (StringEnum for Google-compatible enums) |
| `@mariozechner/pi-tui` | TUI components for custom rendering |

npm dependencies work too. Add a `package.json` next to your extension, run `npm install`, and imports from `node_modules/` are resolved automatically.

Node.js built-ins (node:fs, node:path, etc.) are also available.

### Events

#### Lifecycle Overview

The event flow follows this sequence:

1. `pi starts` → `session_start`
2. `user sends prompt` → `input` → `before_agent_start` → `agent_start`
3. **Turn loop**: `turn_start` → `context` → LLM calls tools → `tool_call` → `tool_execution_*` → `tool_result` → `turn_end`
4. `agent_end`
5. Session commands: `/new`, `/resume`, `/fork`, `/compact`, `/tree`, `/model`

#### Session Events

- `session_start` - Fired on initial session load
- `session_before_switch / session_switch` - Fired when starting a new session or switching sessions
- `session_before_fork / session_fork` - Fired when forking via `/fork`
- `session_before_compact / session_compact` - Fired when compaction occurs
- `session_before_tree / session_tree` - Fired during tree navigation
- `session_shutdown` - Fired on exit

#### Agent Events

- `before_agent_start` - Can inject message, modify system prompt
- `agent_start / agent_end` - Agent lifecycle
- `turn_start / turn_end` - Turn lifecycle
- `message_start / message_update / message_end` - Message lifecycle
- `tool_execution_start / tool_execution_update / tool_execution_end` - Tool execution lifecycle
- `context` - Can modify messages

#### Tool Events

- `tool_call` - Can block dangerous operations
- `tool_result` - Can modify results

#### Input Events

- `input` - Can intercept, transform, or handle user input

### ExtensionContext

The context object provides access to:

| Property | Description |
|----------|-------------|
| `ctx.ui` | User interaction (confirm, notify, select, input) |
| `ctx.hasUI` | Check if UI is available |
| `ctx.cwd` | Current working directory |
| `ctx.sessionManager` | Session management API |
| `ctx.modelRegistry / ctx.model` | Model selection |
| `ctx.isIdle() / ctx.abort() / ctx.hasPendingMessages()` | State checks |
| `ctx.shutdown()` | Graceful shutdown |
| `ctx.getContextUsage()` | Context window usage |
| `ctx.compact()` | Trigger compaction |
| `ctx.getSystemPrompt()` | Access system prompt |

### ExtensionCommandContext

| Property | Description |
|----------|-------------|
| `ctx.waitForIdle()` | Wait for agent to finish |
| `ctx.newSession(options?)` | Create new session |
| `ctx.fork(entryId)` | Fork at specific entry |
| `ctx.navigateTree(targetId, options?)` | Navigate tree |
| `ctx.reload()` | Reload session |

### ExtensionAPI Methods

| Method | Description |
|--------|-------------|
| `pi.on(event, handler)` | Subscribe to events |
| `pi.registerTool(definition)` | Register custom tools |
| `pi.sendMessage(message, options?)` | Send AI message |
| `pi.sendUserMessage(content, options?)` | Send user message |
| `pi.appendEntry(customType, data?)` | Add session entry |
| `pi.setSessionName(name) / pi.getSessionName()` | Session naming |
| `pi.setLabel(entryId, label)` | Label entries |
| `pi.registerCommand(name, options)` | Register commands |
| `pi.getCommands()` | List commands |
| `pi.registerMessageRenderer(customType, renderer)` | Custom message rendering |
| `pi.registerShortcut(shortcut, options)` | Keyboard shortcuts |
| `pi.registerFlag(name, options)` | Register flags |
| `pi.exec(command, args, options?)` | Execute shell commands |
| `pi.getActiveTools() / pi.getAllTools() / pi.setActiveTools(names)` | Tool management |
| `pi.setModel(model)` | Set AI model |
| `pi.getThinkingLevel() / pi.setThinkingLevel(level)` | Thinking configuration |
| `pi.events` | Event emitter |
| `pi.registerProvider(name, config)` | Register providers |

### State Management

Extensions can persist state across restarts using `pi.appendEntry()` to store custom data in the session.

### Custom Tools

#### Tool Definition

Tools are defined with:

| Property | Description |
|----------|-------------|
| `name` | Tool identifier |
| `label` | Display name |
| `description` | LLM-facing description |
| `parameters` | TypeBox schema |
| `execute` | Async function receiving toolCallId, params, signal, onUpdate, ctx |

#### Overriding Built-in Tools

Override built-in tools by registering with the same name.

#### Remote Execution

Tools can execute remotely by specifying remote configuration.

#### Output Truncation

Control output truncation with the tool definition.

#### Custom Rendering

Tools can provide custom rendering via `renderCall` and `renderResult` functions.

### Custom UI

#### Dialogs

- `ctx.ui.confirm(title, message)` - Yes/no confirmation
- `ctx.ui.notify(message, type)` - Notifications (info, success, warning, error)
- `ctx.ui.select(title, options)` - Single selection
- `ctx.ui.input(title, options)` - Text input
- Timed dialogs with countdown and manual dismissal with AbortSignal supported

#### Widgets, Status, and Footer

- `ctx.ui.setStatus(id, text)` - Footer status
- `ctx.ui.setWidget(id, lines)` - Widget above editor

#### Custom Components

Full TUI components with keyboard input via `ctx.ui.custom()`.

#### Custom Editor

Custom editor integration available.

#### Message Rendering

Custom message types with `pi.registerMessageRenderer()`.

#### Theme Colors

Theme colors accessible through the TUI API.

### Error Handling

Extensions should handle errors gracefully using try-catch blocks and appropriate error reporting via `ctx.ui.notify()`.

### Mode Behavior

Extensions can register flags to control behavior modes.

### Examples Reference

Working examples are available in `examples/extensions/` in the pi-mono repository.
