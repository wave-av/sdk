import { describe, it, expect, vi, afterEach } from "vitest";
import { InferenceAPI } from "../inference";
import { WaveClient } from "../client";
import { RouteNotServedError, WaveError } from "../errors";

const okCompletion = {
  id: "chatcmpl-1",
  model: "qwen2.5:3b",
  choices: [{ index: 0, message: { role: "assistant", content: "4" }, finish_reason: "stop" }],
  usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14, cost: 8.8e-6 },
};

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function api(baseUrl?: string): InferenceAPI {
  return new InferenceAPI(new WaveClient({ apiKey: "wave-test-key", organizationId: "org_1", baseUrl, maxRetries: 0 }));
}

afterEach(() => vi.unstubAllGlobals());

describe("InferenceAPI (gateway /v1/inference)", () => {
  it("complete() posts to the gateway's /v1/inference/chat/completions with the WAVE key and maps the result", async () => {
    const fetchMock = vi.fn(async () => json(okCompletion));
    vi.stubGlobal("fetch", fetchMock);
    const r = await api().complete("qwen2.5:3b", [{ role: "user", content: "2+2" }], 8);
    expect(r).toEqual({ model: "qwen2.5:3b", content: "4", cost: 8.8e-6, totalTokens: 14 });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.wave.online/v1/inference/chat/completions");
    expect(init.method).toBe("POST");
    const hdrs = init.headers as Record<string, string>;
    expect(hdrs.Authorization).toBe("Bearer wave-test-key");
    expect(hdrs["X-Organization-Id"]).toBe("org_1");
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({ model: "qwen2.5:3b", messages: [{ role: "user", content: "2+2" }], max_tokens: 8, stream: false });
  });

  it("complete() never calls the raw LiteLLM host", async () => {
    const fetchMock = vi.fn(async () => json(okCompletion));
    vi.stubGlobal("fetch", fetchMock);
    await api().complete("m", [{ role: "user", content: "x" }]);
    for (const call of fetchMock.mock.calls as unknown as [string][]) {
      expect(call[0]).not.toContain("inference.wave.online");
    }
  });

  it("complete() follows a custom baseUrl", async () => {
    const fetchMock = vi.fn(async () => json(okCompletion));
    vi.stubGlobal("fetch", fetchMock);
    await api("http://localhost:8787").complete("m", [{ role: "user", content: "x" }]);
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe("http://localhost:8787/v1/inference/chat/completions");
  });

  it("complete() throws a typed WaveError with the gateway code on HTTP error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      json({ error: { code: "model_required", message: "a `model` field is required", request_id: "req-1" } }, 400)));
    const err = await api().complete("", [{ role: "user", content: "x" }]).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(WaveError);
    expect((err as WaveError).statusCode).toBe(400);
    expect((err as WaveError).code).toBe("model_required");
    expect((err as WaveError).requestId).toBe("req-1");
  });

  it("complete() reports cost as null when the gateway omits usage.cost", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ ...okCompletion, usage: { total_tokens: 3 } })));
    const r = await api().complete("m", [{ role: "user", content: "x" }]);
    expect(r.cost).toBeNull();
    expect(r.totalTokens).toBe(3);
  });

  it("models() reads GET /v1/inference/models and maps the OpenAI list", async () => {
    const fetchMock = vi.fn(async () =>
      json({ object: "list", data: [{ id: "qwen2.5:3b", object: "model", owned_by: "wave-dispatch" }, { id: "x", object: "model" }] }));
    vi.stubGlobal("fetch", fetchMock);
    const rows = await api().models();
    expect(rows).toEqual([{ id: "qwen2.5:3b", ownedBy: "wave-dispatch" }, { id: "x", ownedBy: "" }]);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.wave.online/v1/inference/models");
    expect(init.method).toBe("GET");
  });

  it("models() no longer needs (or reads) any database URL or key", async () => {
    const fetchMock = vi.fn(async () => json({ object: "list", data: [] }));
    vi.stubGlobal("fetch", fetchMock);
    await api().models();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).not.toContain("/rest/v1/");
    expect((init.headers as Record<string, string>).apikey).toBeUndefined();
  });

  it("profile() throws RouteNotServedError without a network call", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const err = await api().profile("qwen2.5:3b").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RouteNotServedError);
    expect((err as RouteNotServedError).code).toBe("ROUTE_NOT_SERVED");
    expect((err as RouteNotServedError).retryable).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
