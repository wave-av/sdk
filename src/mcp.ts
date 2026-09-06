/**
 * wave-runtime MCP server — the agent-protocol rung of the API-first ladder.
 *
 * Exposes the runtime door as MCP tools (`wave_models`, `wave_complete`) over stdio JSON-RPC 2.0,
 * wrapping the SDK's RuntimeClient so the door's contract lives in one place. Any MCP host
 * (Claude / opencode / dsh / Codex) can drive the platform through this. Minimal, dependency-free
 * JSON-RPC — no @modelcontextprotocol/sdk, so the server is a single file an agent can read.
 */

import { RuntimeClient } from "./runtime";
import { listProducts } from "./products";
import { TranscriptAPI } from "./transcripts";
import { WaveClient } from "./client";
import { createInterface } from "node:readline";

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
    {
      name: "wave_products",
      description: "List every WAVE product surface (id, phase, surface URL) — the catalog that drives the product plane",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "wave_transcripts_list",
      description: "List the voice-agent transcript keys recorded for an org",
      inputSchema: {
        type: "object",
        properties: { org: { type: "string", description: "The org id" } },
        required: ["org"],
      },
    },
    {
      name: "wave_transcripts_get",
      description: "Read one voice-agent session transcript (messages: system + alternating user/assistant)",
      inputSchema: {
        type: "object",
        properties: {
          org: { type: "string", description: "The org id" },
          room: { type: "string", description: "The room id" },
          session: { type: "string", description: "The session id" },
        },
        required: ["org", "room", "session"],
      },
    },
  ];
}

/** Resolve a TranscriptAPI from WAVE_API_KEY (or the runtime token) + api.wave.online. Null when no key. */
function transcriptApi(): TranscriptAPI | null {
  const key = process.env.WAVE_API_KEY ?? process.env.WAVE_RUNTIME_TOKEN;
  if (!key) return null;
  return new TranscriptAPI(new WaveClient({ apiKey: key, baseUrl: process.env.WAVE_API_URL ?? "https://api.wave.online" }));
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
      if (name === "wave_products") {
        const rows = listProducts().map((p) => `${p.id}\t${p.phase}\t${p.surface}`);
        return result(req.id, { content: textContent(rows.join("\n")), isError: false });
      }
      if (name === "wave_transcripts_list" || name === "wave_transcripts_get") {
        const api = transcriptApi();
        if (!api) {
          return result(req.id, { content: textContent("error: WAVE_API_KEY is required for transcript tools"), isError: true });
        }
        const targs = (req.params?.arguments ?? {}) as { org?: string; room?: string; session?: string };
        if (name === "wave_transcripts_list") {
          if (typeof targs.org !== "string" || !targs.org) {
            return result(req.id, { content: textContent("error: org is required"), isError: true });
          }
          const res = await api.list(targs.org);
          return result(req.id, { content: textContent(JSON.stringify(res, null, 2)), isError: false });
        }
        if (typeof targs.org !== "string" || !targs.org || typeof targs.room !== "string" || !targs.room || typeof targs.session !== "string" || !targs.session) {
          return result(req.id, { content: textContent("error: org, room, session are required"), isError: true });
        }
        const res = await api.get(targs.org, targs.room, targs.session);
        return result(req.id, { content: textContent(JSON.stringify(res, null, 2)), isError: false });
      }
      return result(req.id, { content: textContent(`error: unknown tool "${name}"`), isError: true });
    }

    default:
      return { jsonrpc: "2.0", id: req.id ?? null, error: { code: -32601, message: `Method not found: ${req.method}` } };
  }
}

/**
 * Run the stdio loop: read newline-delimited JSON-RPC from stdin, handle each message, write the
 * response (when non-null) to stdout. This is the bin entry the plugin manifest points its
 * `command` at. Resolves on stdin EOF.
 */
export async function runMcpServer(client: RuntimeClient): Promise<void> {
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let message: unknown;
    try {
      message = JSON.parse(line);
    } catch {
      process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }) + "\n");
      continue;
    }
    const response = await handleMcpMessage(client, message);
    if (response !== null) process.stdout.write(JSON.stringify(response) + "\n");
  }
}
