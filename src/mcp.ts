/**
 * wave-runtime MCP server — the agent-protocol rung of the API-first ladder.
 *
 * Exposes the runtime door as MCP tools (`wave_models`, `wave_complete`) over stdio JSON-RPC 2.0,
 * wrapping the SDK's RuntimeClient so the door's contract lives in one place. Any MCP host
 * (Claude / opencode / dsh / Codex) can drive the platform through this. Minimal, dependency-free
 * JSON-RPC — no @modelcontextprotocol/sdk, so the server is a single file an agent can read.
 */

import { RuntimeClient } from "./runtime";

export interface McpToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/** The tool surface this server exposes. */
export function waveMcpTools(): McpToolDef[] {
  return [
    {
      name: "wave_models",
      description: "List the models the WAVE runtime door serves",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "wave_complete",
      description: "One non-streaming completion through the WAVE runtime door",
      inputSchema: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "The user prompt" },
          model: { type: "string", description: "Optional model id" },
        },
        required: ["prompt"],
      },
    },
  ];
}

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
}

function result(id: number | string | undefined, value: unknown): Record<string, unknown> {
  return { jsonrpc: "2.0", id: id ?? null, result: value };
}

function textContent(text: string): Record<string, unknown>[] {
  return [{ type: "text", text }];
}

/**
 * Handle one JSON-RPC message. Returns the response object (or null for notifications).
 * Supports: initialize, tools/list, tools/call. Fails closed on unknown methods.
 */
export async function handleMcpMessage(client: RuntimeClient, message: unknown): Promise<Record<string, unknown> | null> {
  const req = message as JsonRpcRequest;
  if (!req || typeof req !== "object" || req.jsonrpc !== "2.0") {
    return { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } };
  }

  switch (req.method) {
    case "initialize":
      return result(req.id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "wave-runtime", version: "0.1.0" },
      });

    case "notifications/initialized":
      return null; // notification — no response

    case "tools/list":
      return result(req.id, { tools: waveMcpTools() });

    case "tools/call": {
      const name = req.params?.name;
      const args = (req.params?.arguments ?? {}) as { prompt?: string; model?: string };
      if (name === "wave_models") {
        const models = await client.models();
        return result(req.id, { content: textContent(models.join("\n")), isError: false });
      }
      if (name === "wave_complete") {
        if (typeof args.prompt !== "string" || !args.prompt) {
          return result(req.id, { content: textContent("error: prompt is required"), isError: true });
        }
        const res = await client.complete({ messages: [{ role: "user", content: args.prompt }], ...(args.model ? { model: args.model } : {}) });
        return result(req.id, { content: textContent(res.choices[0]?.message?.content ?? ""), isError: false });
      }
      return result(req.id, { content: textContent(`error: unknown tool "${name}"`), isError: true });
    }

    default:
      return { jsonrpc: "2.0", id: req.id ?? null, error: { code: -32601, message: `Method not found: ${req.method}` } };
  }
}
