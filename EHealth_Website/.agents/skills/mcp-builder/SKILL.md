---
name: mcp-builder
description: Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools. Use when building MCP servers to integrate external APIs or services, whether in Python (FastMCP) or Node/TypeScript (MCP SDK).
---

# MCP Server Development Guide

## Overview

This skill guides you through creating production-quality MCP (Model Context Protocol) servers. MCP servers enable AI assistants to interact with external services through well-designed tools, resources, and prompts.

## Process

### 🚀 High-Level Workflow

#### Phase 1: Deep Research and Planning
1. **Understand the target service**: Read API docs, understand authentication, identify key operations
2. **Design the tool surface**: Decide which operations to expose as MCP tools
3. **Plan the architecture**: Choose language (Python/FastMCP or Node/TypeScript), plan error handling, define types

#### Phase 2: Implementation
1. **Set up the project structure**:
   - Python: Use `fastmcp` package
   - Node/TypeScript: Use `@modelcontextprotocol/sdk`
2. **Implement tools**: Each tool should:
   - Have a clear, descriptive name
   - Include comprehensive parameter descriptions
   - Handle errors gracefully with informative messages
   - Return structured, useful responses
3. **Add resources**: Expose static or dynamic data as MCP resources
4. **Add prompts**: Create reusable prompt templates if applicable

#### Phase 3: Review and Test
1. **Test each tool individually**: Verify correct behavior with various inputs
2. **Test error cases**: Ensure graceful handling of invalid inputs, network errors, auth failures
3. **Test integration**: Verify the server works end-to-end with an MCP client
4. **Code review**: Check for security issues, proper error handling, type safety

#### Phase 4: Documentation
1. **README**: Installation, configuration, available tools
2. **Examples**: Common usage patterns
3. **Configuration**: Environment variables, auth setup

## Python (FastMCP) Quick Start

```python
from fastmcp import FastMCP

mcp = FastMCP("my-service")

@mcp.tool()
def get_data(query: str, limit: int = 10) -> str:
    """Fetch data from the service.
    
    Args:
        query: Search query string
        limit: Maximum number of results (default: 10)
    """
    # Implementation here
    return results

if __name__ == "__main__":
    mcp.run()
```

## TypeScript (MCP SDK) Quick Start

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "my-service",
  version: "1.0.0",
});

server.tool(
  "get-data",
  "Fetch data from the service",
  {
    query: z.string().describe("Search query string"),
    limit: z.number().default(10).describe("Max results"),
  },
  async ({ query, limit }) => {
    // Implementation here
    return { content: [{ type: "text", text: JSON.stringify(results) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

## Best Practices

- **Tool naming**: Use clear, verb-based names (`get-users`, `create-issue`, `search-docs`)
- **Descriptions**: Write detailed descriptions — these are the AI's documentation
- **Error handling**: Return informative error messages, never crash
- **Authentication**: Use environment variables for secrets, never hardcode
- **Rate limiting**: Implement appropriate rate limiting for external APIs
- **Validation**: Validate all inputs before making API calls
- **Idempotency**: Design tools to be safely retried when possible
- **Logging**: Add structured logging for debugging

## Testing

Use `run_command` to test MCP servers:

```bash
# Python
python -m fastmcp dev my_server.py

# Node/TypeScript
npx tsx my_server.ts
```

Verify tools work correctly by testing with various inputs and edge cases.
