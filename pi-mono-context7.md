# pi-mono Documentation (Context7)

Source: https://github.com/badlogic/pi-mono

---

## Extensions Documentation

Source: https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md

This document describes "Extensions" for pi, which are TypeScript modules that extend pi's behavior. Extensions can subscribe to lifecycle events, register custom tools callable by the LLM, add commands, and more.

### Key Capabilities

Extensions provide several powerful features:

- **Custom tools** - Register tools the LLM can call via `pi.registerTool()`
- **Event interception** - Block or modify tool calls, inject context, customize compaction
- **User interaction** - Prompt users via `ctx.ui` (select, confirm, input, notify)
- **Custom UI components** - Full TUI components with keyboard input via `ctx.ui.custom()` for complex interactions
- **Custom commands** - Register commands like `/mycommand` via `pi.registerCommand()`
- **Session persistence** - Store state that survives restarts via `pi.appendEntry()`
- **Custom rendering** - Control how tool calls/results and messages appear in TUI

### Extension Locations

Extensions are auto-discovered from:
- `~/.pi/agent/extensions/*.ts` (global)
- `~/.pi/agent/extensions/*/index.ts` (global subdirectory)
- `.pi/extensions/*.ts` (project-local)
- `.pi/extensions/*/index.ts` (project-local subdirectory)

### Available Imports

- `@mariozechner/pi-coding-agent` - Extension types (ExtensionAPI, ExtensionContext, events)
- `@sinclair/typebox` - Schema definitions for tool parameters
- `@mariozechner/pi-ai` - AI utilities
- `@mariozechner/pi-tui` - TUI components for custom rendering

### Events Overview

The documentation details a comprehensive lifecycle event system including:
- **Session events**: session_start, session_switch, session_fork, session_compact, session_shutdown
- **Agent events**: before_agent_start, agent_start/end, turn_start/end, message events, tool_execution events
- **Model events**: model_select
- **Tool events**: tool_call, tool_result
- **Input events**

### ExtensionContext API

The ExtensionContext provides access to:
- `ctx.ui` - for user interaction
- `ctx.cwd` - current working directory
- `ctx.sessionManager` - session management
- `ctx.modelRegistry` and `ctx.model` - model selection
- Methods: `ctx.isIdle()`, `ctx.abort()`, `ctx.shutdown()`, `ctx.compact()`, `ctx.getSystemPrompt()`, `ctx.getContextUsage()`

### ExtensionAPI Methods

Key methods include:
- `pi.on()` - event subscription
- `pi.registerTool()` - custom tools
- `pi.sendMessage()`, `pi.sendUserMessage()`
- `pi.appendEntry()` - session persistence
- `pi.setSessionName()`, `pi.setModel()`, `pi.setThinkingLevel()`
- `pi.registerCommand()`, `pi.registerShortcut()`, `pi.registerFlag()`
- `pi.exec()`, tool management methods, model selection, thinking level control

### Custom Tools

Tool definitions and overriding capabilities.

### Custom UI

Dialogs and widgets for user interaction.

### Error Handling

Extension error handling patterns.

### Mode Behavior

How extensions interact with different modes.

---

## @mariozechner/pi-agent-core Package

Source: https://github.com/badlogic/pi-mono/tree/main/packages/agent

**Description**: Stateful agent with tool execution and event streaming. Built on `@mariozechner/pi-ai`.

### Files in Directory

- `src/` - Source directory
- `test/` - Test directory
- `CHANGELOG.md` - Version history
- `README.md` - Documentation
- `package.json` - Package configuration
- `tsconfig.build.json` - TypeScript build config
- `vitest.config.ts` - Vitest testing config

### Configuration Options

- `initialState` - systemPrompt, model, thinkingLevel, tools, messages
- `convertToLlm` - transforms AgentMessage[] to LLM Message[]
- `transformContext` - prunes/injects context before LLM calls
- `steeringMode` / `followUpMode` - controls message handling ("one-at-a-time" or "all")
- `streamFn` - custom stream function for proxy backends
- `sessionId` - provider caching
- `getApiKey` - dynamic API key resolution
- `thinkingBudgets` - custom token budgets

### Methods

- `prompt()` - send text, images, or AgentMessage
- `continue()` - resume from existing context
- `setSystemPrompt()`, `setModel()`, `setThinkingLevel()`, `setTools()`
- `replaceMessages()`, `appendMessage()`, `clearMessages()`, `reset()`
- `subscribe()` - event subscription
- `abort()`, `waitForIdle()`
- `steer()`, `followUp()` - queue messages during/after execution

### Event Types

- `agent_start`/`agent_end`, `turn_start`/`turn_end`
- `message_start`/`message_update`/`message_end`
- `tool_execution_start`/`tool_execution_update`/`tool_execution_end`
