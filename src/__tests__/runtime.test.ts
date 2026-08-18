import { describe, expect, it, vi } from "vitest";

import { RuntimeClient, RuntimeError } from "../runtime";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function sseResponse(chunks: string[]): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      for (const chunk of chunks) c.enqueue(new TextEncoder().encode(chunk));
      c.close();
    },
  });
  return new Response(stream, { status: 200, headers: { "content-type": "text/event-stream" } });
}

describe("RuntimeClient", () => {
  it("lists models from the door", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ data: [{ id: "qwen2.5:3b" }, { id: "qwen3-coder:30b" }] }));
    const c = new RuntimeClient({ baseUrl: "https://runtime.wave.online/v1", fetchImpl: fetchMock });
    expect(await c.models()).toEqual(["qwen2.5:3b", "qwen3-coder:30b"]);
    expect(fetchMock.mock.calls[0][0]).toBe("https://runtime.wave.online/v1/models");
  });

  it("sends the bearer token on completions but not the models list", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ id: "x", object: "chat.completion", created: 1, model: "m", choices: [] }));
    const c = new RuntimeClient({ baseUrl: "https://runtime.wave.online/v1", token: "secret", fetchImpl: fetchMock });

    await c.models();
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).not.toHaveProperty("authorization");

    await c.complete({ messages: [{ role: "user", content: "hi" }] });
    const init = fetchMock.mock.calls[1][1] as RequestInit;
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer secret");
  });

  it("forces the completion mode even when requested stream is conflicting or undefined", async () => {
    const fetchMock = vi.fn(async () =>
      fetchMock.mock.calls.length === 0
        ? jsonResponse({ id: "x", object: "chat.completion", created: 1, model: "m", choices: [] })
        : sseResponse(["data: [DONE]\\n\\n"]),
    );
    const c = new RuntimeClient({ baseUrl: "https://runtime.wave.online/v1", fetchImpl: fetchMock });
    const request = { messages: [{ role: "user" as const, content: "hi" }], stream: true as boolean | undefined };

    await c.complete(request);
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string).stream).toBe(false);

    for await (const _delta of c.stream({ ...request, stream: false })) break;
    expect(JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string).stream).toBe(true);
  });

  it("throws RuntimeError with status on a non-2xx completion", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: { message: "auth" } }, 401));
    const c = new RuntimeClient({ baseUrl: "https://runtime.wave.online/v1", token: "bad", fetchImpl: fetchMock });
    await expect(c.complete({ messages: [{ role: "user", content: "hi" }] })).rejects.toThrow(RuntimeError);
  });

  it("streams SSE data chunks until [DONE]", async () => {
    const fetchMock = vi.fn(async () =>
      sseResponse([
        'data: {"delta":"Hi"}\n\n',
        'data: {"delta":" there"}\n\n',
        "data: [DONE]\n\n",
      ]),
    );
    const c = new RuntimeClient({ baseUrl: "https://runtime.wave.online/v1", token: "t", fetchImpl: fetchMock });
    const out: unknown[] = [];
    for await (const delta of c.stream({ messages: [{ role: "user", content: "hi" }] })) out.push(delta);
    expect(out).toEqual([{ delta: "Hi" }, { delta: " there" }]);
  });
});
