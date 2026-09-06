import { describe, expect, it, vi } from "vitest";

import { handleMcpMessage, waveMcpTools } from "../mcp";
import { RuntimeClient } from "../runtime";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("wave-runtime MCP", () => {
  const client = new RuntimeClient({
    baseUrl: "https://runtime.wave.online/v1",
    token: "t",
    fetchImpl: vi.fn(async () =>
      jsonResponse({ id: "x", object: "chat.completion", created: 1, model: "m", choices: [{ index: 0, message: { role: "assistant", content: "hi" }, finish_reason: "stop" }] }),
    ) as unknown as typeof fetch,
  });

  it("exposes the wave_models + wave_complete tools", () => {
    const names = waveMcpTools().map((t) => t.name);
    // the runtime MCP grew past its original 2 tools (catalog-driven renderings, c201645);
    // assert the two originals are PRESENT rather than the exact set (additive surface).
    expect(names).toEqual(expect.arrayContaining(["wave_models", "wave_complete"]));
  });

  it("responds to initialize with the server capabilities", async () => {
    const r = await handleMcpMessage(client, { jsonrpc: "2.0", id: 1, method: "initialize" });
    expect(r?.result).toMatchObject({ protocolVersion: "2024-11-05", serverInfo: { name: "wave-runtime" } });
  });

  it("returns null for the initialized notification (no response)", async () => {
    const r = await handleMcpMessage(client, { jsonrpc: "2.0", method: "notifications/initialized" });
    expect(r).toBeNull();
  });

  it("tools/list returns the tool defs", async () => {
    const r = await handleMcpMessage(client, { jsonrpc: "2.0", id: 2, method: "tools/list" });
    const tools = (r?.result as { tools: unknown[] }).tools;
    expect(tools.length).toBeGreaterThanOrEqual(2);
  });

  it("tools/call wave_complete returns the assistant text", async () => {
    const r = await handleMcpMessage(client, {
      jsonrpc: "2.0", id: 3, method: "tools/call",
      params: { name: "wave_complete", arguments: { prompt: "say hi" } },
    });
    const content = (r?.result as { content: { type: string; text: string }[] }).content;
    expect(content[0].text).toBe("hi");
  });

  it("tools/call with a missing prompt is an isError result", async () => {
    const r = await handleMcpMessage(client, {
      jsonrpc: "2.0", id: 4, method: "tools/call",
      params: { name: "wave_complete", arguments: {} },
    });
    expect((r?.result as { isError: boolean }).isError).toBe(true);
  });

  it("unknown method returns a method-not-found error", async () => {
    const r = await handleMcpMessage(client, { jsonrpc: "2.0", id: 5, method: "bogus/method" });
    expect(r?.error).toMatchObject({ code: -32601 });
  });
});
