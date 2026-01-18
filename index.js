#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "gmcode-mcp",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "push",
        description: "Commit working code example or template to memory",
        inputSchema: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "Name of the file to save",
            },
            contents: {
              type: "string",
              description: "Contents of the file",
            },
          },
          required: ["filename", "contents"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { filename, contents } = request.params.arguments;

  const response = await fetch(
    "https://gmcode-hook.almagestfraternite.workers.dev",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename,
        contents,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${response.status}`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
