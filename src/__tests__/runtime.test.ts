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

  it("sends the bearer token on every call when one is set (the gateway's /v1/inference/models needs it)", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ id: "x", object: "chat.completion", created: 1, model: "m", choices: [] }));
    const c = new RuntimeClient({ baseUrl: "https://api.wave.online/v1/inference", token: "secret", fetchImpl: fetchMock });

    await c.models();
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.wave.online/v1/inference/models");
    expect(((fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>).authorization).toBe("Bearer secret");

    await c.complete({ messages: [{ role: "user", content: "hi" }] });
    const init = fetchMock.mock.calls[1][1] as RequestInit;
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer secret");
  });

  it("sends no authorization header when no token is set (the runtime door's open models list)", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ data: [] }));
    await new RuntimeClient({ baseUrl: "https://runtime.wave.online/v1", fetchImpl: fetchMock }).models();
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).not.toHaveProperty("authorization");
  });

  it("throws RuntimeError with status on a non-2xx completion", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: { message: "auth" } }, 401));
    const c = new RuntimeClient({ baseUrl: "https://runtime.wave.online/v1", token: "bad", fetchImpl: fetchMock });
    await expect(c.complete({ messages: [{ role: "user", content: "hi" }] })).rejects.toThrow(RuntimeError);
  });

  it("puts the gateway's error code and message in the RuntimeError", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: { code: "ROUTE_NOT_FOUND", message: "No WAVE capability is served at this path." } }, 404));
    const c = new RuntimeClient({ baseUrl: "https://api.wave.online/v1/inference", token: "k", fetchImpl: fetchMock });
    const err = (await c.models().catch((e: unknown) => e)) as RuntimeError;
    expect(err).toBeInstanceOf(RuntimeError);
    expect(err.status).toBe(404);
    expect(err.code).toBe("ROUTE_NOT_FOUND");
    expect(err.message).toBe("models: upstream 404 (ROUTE_NOT_FOUND: No WAVE capability is served at this path.)");
  });

  it("complete() folds an SSE answer into one completion when the door streams despite stream:false", async () => {
    // Observed live on the runtime door: a `stream: false` request answered `text/event-stream`.
    const fetchMock = vi.fn(async () =>
      sseResponse([
        'data: {"id":"c1","created":7,"model":"m","choices":[{"index":0,"delta":{"content":"o"}}]}\n\n',
        'data: {"id":"c1","model":"m","choices":[{"index":0,"delta":{"content":"k"},"finish_reason":"stop"}]}\n\n',
        'data: {"id":"c1","choices":[],"usage":{"prompt_tokens":3,"completion_tokens":2,"total_tokens":5}}\n\n',
        "data: [DONE]\n\n",
      ]),
    );
    const c = new RuntimeClient({ baseUrl: "https://runtime.wave.online/v1", token: "t", fetchImpl: fetchMock });
    const res = await c.complete({ model: "m", messages: [{ role: "user", content: "hi" }] });
    expect(res.id).toBe("c1");
    expect(res.model).toBe("m");
    expect(res.choices[0].message.content).toBe("ok");
    expect(res.choices[0].finish_reason).toBe("stop");
    expect(res.usage?.total_tokens).toBe(5);
  });

  it("stream() asks for usage in the stream (the gateway refuses unmetered streams)", async () => {
    const fetchMock = vi.fn(async () => sseResponse(["data: [DONE]\n\n"]));
    const c = new RuntimeClient({ baseUrl: "https://api.wave.online/v1/inference", token: "t", fetchImpl: fetchMock });
    for await (const chunk of c.stream({ model: "m", messages: [{ role: "user", content: "hi" }] })) void chunk;
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.stream).toBe(true);
    expect(body.stream_options).toEqual({ include_usage: true });
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
