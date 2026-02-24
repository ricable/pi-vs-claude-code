# Claude Agent SDK - Common Patterns

Guide for building production AI agents with the Claude Agent SDK (Python + TypeScript).

## Agent Architecture

```
┌─────────────────┐
│   Your Agent    │
├─────────────────┤
│   SDK Client    │
│   (query API)   │
├─────────────────┤
│   Claude Model  │ ← Opus 4.6, Sonnet 4.5, Haiku 4.5
│  + Tools        │ ← Custom tools, MCP servers
├─────────────────┤
│  Tool Responses │
│  (callback)     │
└─────────────────┘
```

## Pattern 1: Basic Query

Simple one-turn agent:

```python
from anthropic import Anthropic
from claude_agent_sdk import ClaudeSDKClient

client = ClaudeSDKClient()

response = client.query(
    prompt="Summarize the key challenges in implementing neural networks",
    model="claude-opus-4",
    max_tokens=1024
)

print(response.content)
```

## Pattern 2: Stateful Conversation

Multi-turn agent with memory:

```python
class ConversationalAgent:
    def __init__(self):
        self.client = ClaudeSDKClient()
        self.conversation = []

    def chat(self, user_message: str) -> str:
        # Add user message
        self.conversation.append({
            "role": "user",
            "content": user_message
        })

        # Query model with full history
        response = self.client.query(
            messages=self.conversation,
            model="claude-opus-4"
        )

        # Add assistant response
        assistant_message = response.content[0].text
        self.conversation.append({
            "role": "assistant",
            "content": assistant_message
        })

        return assistant_message

    def clear(self):
        self.conversation = []
```

## Pattern 3: Custom Tool

Define tool for agent:

```python
from typing import Any

class WebSearchTool:
    @staticmethod
    def definition() -> dict:
        return {
            "name": "web_search",
            "description": "Search the web for information",
            "input_schema": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max results",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        }

    @staticmethod
    async def execute(query: str, limit: int = 5) -> dict:
        # Call actual search API
        results = search_api.query(query, limit=limit)
        return {
            "results": [
                {
                    "title": r.title,
                    "url": r.url,
                    "snippet": r.snippet
                }
                for r in results
            ]
        }

# Register tool
client.register_tool(WebSearchTool)
```

## Pattern 4: Tool-Using Agent

Agent that uses tools:

```python
class ToolUsingAgent:
    def __init__(self):
        self.client = ClaudeSDKClient(model="claude-opus-4")
        self.tools = []

    def add_tool(self, tool_class):
        self.tools.append(tool_class)
        self.client.register_tool(tool_class)

    async def run(self, prompt: str) -> str:
        messages = [{"role": "user", "content": prompt}]

        while True:
            # Get response (may include tool calls)
            response = await self.client.query(
                messages=messages,
                tools=[t.definition() for t in self.tools],
                max_tokens=2048
            )

            # Check if model wants to use tools
            if response.stop_reason == "tool_use":
                # Execute tool calls
                tool_results = []
                for tool_call in response.tool_calls:
                    tool = next(
                        (t for t in self.tools if t.definition()["name"] == tool_call.name),
                        None
                    )
                    if tool:
                        result = await tool.execute(**tool_call.input)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_call.id,
                            "content": str(result)
                        })

                # Add results to conversation
                messages.append({"role": "assistant", "content": response.content})
                messages.append({"role": "user", "content": tool_results})
            else:
                # Final response
                return response.content[0].text
```

## Pattern 5: Structured Output

Agent with JSON schema output:

```python
from pydantic import BaseModel
from typing import List

class AnalysisResult(BaseModel):
    summary: str
    key_points: List[str]
    sentiment: str
    confidence: float

class AnalysisAgent:
    def __init__(self):
        self.client = ClaudeSDKClient()

    async def analyze(self, text: str) -> AnalysisResult:
        prompt = f"""
        Analyze this text and provide structured output:

        {text}

        Return JSON matching this schema:
        {AnalysisResult.schema_json()}
        """

        response = await self.client.query(
            prompt=prompt,
            model="claude-opus-4",
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "AnalysisResult",
                    "schema": AnalysisResult.schema()
                }
            }
        )

        return AnalysisResult.parse_raw(response.content[0].text)
```

## Pattern 6: Subagent Spawning

Create child agents:

```python
class ParentAgent:
    async def process_batch(self, items: List[str]):
        # Spawn subagents for parallel processing
        subagents = []

        for item in items:
            subagent = self.client.spawn_agent(
                name=f"worker-{item[:10]}",
                system="You are a data processor",
                prompt=f"Process this item: {item}"
            )
            subagents.append(subagent)

        # Gather results
        results = await asyncio.gather(
            *[agent.run() for agent in subagents]
        )

        return results
```

## Pattern 7: MCP Server Integration

Use Model Context Protocol servers:

```python
class MCPAgent:
    def __init__(self):
        self.client = ClaudeSDKClient()

        # Register MCP server
        self.client.register_mcp_server({
            "type": "stdio",
            "command": "python",
            "args": ["-m", "mcp_servers.resources"],
            "env": {
                "MCP_SERVER_PORT": "3000"
            }
        })

    async def query_with_context(self, prompt: str):
        # Query uses MCP resources
        response = await self.client.query(
            prompt=prompt,
            model="claude-opus-4"
        )
        return response.content[0].text
```

## Pattern 8: Error Handling & Retries

Robust agent with error handling:

```python
import asyncio
from typing import Optional

class RobustAgent:
    def __init__(self, max_retries: int = 3):
        self.client = ClaudeSDKClient()
        self.max_retries = max_retries

    async def query_with_retry(self, prompt: str) -> Optional[str]:
        for attempt in range(self.max_retries):
            try:
                response = await self.client.query(
                    prompt=prompt,
                    model="claude-opus-4",
                    timeout=30
                )
                return response.content[0].text

            except Exception as e:
                if attempt < self.max_retries - 1:
                    # Exponential backoff
                    wait_time = 2 ** attempt
                    print(f"Retry {attempt + 1}/{self.max_retries} after {wait_time}s: {e}")
                    await asyncio.sleep(wait_time)
                else:
                    print(f"Failed after {self.max_retries} attempts: {e}")
                    return None
```

## Best Practices

1. **Use correct model** — Opus for complex, Sonnet for balanced, Haiku for speed
2. **Set reasonable timeouts** — Default 30s, increase for complex reasoning
3. **Implement retry logic** — Handle transient failures gracefully
4. **Stream for UX** — Use streaming for long responses
5. **Cache results** — Avoid redundant API calls
6. **Monitor costs** — Track usage and costs per agent
7. **Structure output** — Use JSON schema for programmatic results
8. **Version agents** — Track agent definition versions

## Related Resources

- **SDK API Reference** — Full method documentation
- **Examples** — See `/assets/examples/` for complete code samples
- **MCP Integration** — See `claude-code-config` skill for MCP setup
- **Testing** — See `verification-quality` skill for agent testing patterns

See `/claude-agent-sdk:create` command for scaffolding new agents.
