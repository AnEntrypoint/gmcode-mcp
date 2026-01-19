#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { execSync } from "child_process";
import { writeFileSync, mkdirSync, existsSync, rmSync } from "fs";
import { dirname } from "path";
import { tmpdir } from "os";

const REPO_URL = "https://github.com/AnEntrypoint/gmcode.git";
const REPO_PATH = `${tmpdir()}/gmcode-push-${Date.now()}`;
const CODE_FOLDER = "code/discoveries";

function gitExec(cmd, cwd = REPO_PATH) {
  try {
    return execSync(cmd, { cwd, encoding: "utf-8", stdio: "pipe" });
  } catch (e) {
    throw new Error(`Git error: ${e.message}`);
  }
}

async function pushToGitHub(filename, contents) {
  try {
    if (!existsSync(REPO_PATH)) {
      mkdirSync(REPO_PATH, { recursive: true });
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error("GITHUB_TOKEN environment variable not set");
    }

    const repoUrlWithAuth = REPO_URL.replace(
      "https://",
      `https://x-access-token:${token}@`
    );

    gitExec(`git clone ${repoUrlWithAuth} .`);

    gitExec(`git config user.name "gmcode-mcp"`);
    gitExec(`git config user.email "gmcode-mcp@anentrypoint.dev"`);

    mkdirSync(`${REPO_PATH}/${CODE_FOLDER}`, { recursive: true });

    const filePath = `${REPO_PATH}/${CODE_FOLDER}/${filename}`;
    const dir = dirname(filePath);
    mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, contents, "utf-8");

    gitExec(`git add ${CODE_FOLDER}/${filename}`);
    gitExec(`git commit -m "Add code discovery: ${filename}"`);
    gitExec(`git push origin main`);

    const sha = gitExec(`git rev-parse HEAD`).trim();

    return {
      success: true,
      sha,
      filename,
      path: `${CODE_FOLDER}/${filename}`,
      url: `https://github.com/AnEntrypoint/gmcode/blob/main/${CODE_FOLDER}/${filename}`,
    };
  } finally {
    if (existsSync(REPO_PATH)) {
      rmSync(REPO_PATH, { recursive: true, force: true });
    }
  }
}

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
        description: "Commit working code example or template to memory via git",
        inputSchema: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "Name of the file to save (e.g., auth.js, config.yaml)",
            },
            contents: {
              type: "string",
              description: "Full contents of the file",
            },
          },
          required: ["filename", "contents"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { filename, contents } = request.params.arguments;

    if (!filename || !contents) {
      return {
        content: [
          {
            type: "text",
            text: "Error: filename and contents are required",
          },
        ],
        isError: true,
      };
    }

    const result = await pushToGitHub(filename, contents);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
