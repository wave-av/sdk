import { describe, it, expect, vi, afterEach } from "vitest";
import { InferenceAPI } from "../inference";

/** A minimal WaveClient stand-in: InferenceAPI only touches getConnectionInfo(). */
function fakeClient(apiKey = "sk-test") {
  return { getConnectionInfo: () => ({ apiKey }) } as any;
}

const okCompletion = {
  id: "chatcmpl-1",
  model: "deepseek-v4",
  choices: [{ index: 0, message: { role: "assistant", content: "4" }, finish_reason: "stop" }],
  usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14, cost: 8.8e-6 },
};

afterEach(() => vi.unstubAllGlobals());

describe("InferenceAPI (the funnel rendering)", () => {
  it("complete() posts to inference.wave.online with the bearer key and maps the result", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify(okCompletion), { status: 200, headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const api = new InferenceAPI(fakeClient());
    const r = await api.complete("deepseek-v4", [{ role: "user", content: "2+2" }], 8);
    expect(r.model).toBe("deepseek-v4");
    expect(r.content).toBe("4");
    expect(r.cost).toBeCloseTo(8.8e-6, 12);
    expect(r.totalTokens).toBe(14);
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(call[0])).toBe("https://inference.wave.online/v1/chat/completions");
    const hdrs = call[1].headers as Record<string, string>;
    expect(hdrs.authorization).toBe("Bearer sk-test");
    expect(JSON.parse(call[1].body as string).max_tokens).toBe(8);
  });

  it("complete() throws with the upstream body on HTTP error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response('{"error":{"message":"nope"}}', { status: 400 })));
    const api = new InferenceAPI(fakeClient());
    await expect(api.complete("m", [{ role: "user", content: "x" }])).rejects.toThrow(/inference 400/);
  });

  it("models() maps registry rows to the priced shape", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify([{ id: "deepseek-v4", rail: "openrouter", cost_input_per_m: 1.19, cost_output_per_m: 3.56 }]),
        { status: 200, headers: { "content-type": "application/json" } })));
    const api = new InferenceAPI(fakeClient());
    const rows = await api.models();
    expect(rows[0].outputPerM).toBe(3.56);
  });

  it("profile() composes the transition signature + live usage", async () => {
    const modelRow = { id: "gpt-5.6-luna", rail: "openai", status: "live",
      health: { floor: 75.4, ceiling: 92.9 }, cost_input_per_m: 2.5, cost_output_per_m: 1.2 };
    const usageRows = [
      { cost: 8.8e-6, latency_ms: 2000 },
      { cost: 1.2e-5, latency_ms: 3000 },
    ];
    vi.stubGlobal("fetch", vi.fn(async (input: any) => {
      const path = String(input);
      if (path.includes("/rest/v1/models?")) return new Response(JSON.stringify([modelRow]), { status: 200 });
      if (path.includes("/rest/v1/usage_logs?")) return new Response(JSON.stringify(usageRows), { status: 200 });
      throw new Error("unexpected " + path);
    }));
    const api = new InferenceAPI(fakeClient());
    const p = await api.profile("gpt-5.6-luna");
    expect(p.transition).toEqual({ floor: 75.4, ceiling: 92.9 });
    expect(p.liveUsage.calls).toBe(2);
    expect(p.liveUsage.avgLatencyMs).toBe(2500);
  });

  it("profile() throws for a model that is not admitted (FK gate)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })));
    const api = new InferenceAPI(fakeClient());
    await expect(api.profile("not-admitted")).rejects.toThrow(/NOT ADMITTED/);
  });
});
