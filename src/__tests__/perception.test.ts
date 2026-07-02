/**
 * PerceptionAPI Tests (#85) — agentic live-media subscribe() SDK surface.
 *
 * Verifies the SDK forwards the ADR-0004 control-plane contract to the gateway:
 *   POST   /v1/perception/subscribe        (open a session over any transport)
 *   DELETE /v1/perception/subscribe/:id     (close, by psub_ id)
 */

import { describe, it, expect, vi } from "vitest";
import { PerceptionAPI, createPerceptionAPI } from "../perception";
import type { WaveClient } from "../client";
import type { PerceptionSubscription } from "../perception";

function mockClient(): { client: WaveClient; post: ReturnType<typeof vi.fn>; del: ReturnType<typeof vi.fn> } {
  const post = vi.fn();
  const del = vi.fn().mockResolvedValue(undefined);
  const client = { post, delete: del } as unknown as WaveClient;
  return { client, post, del };
}

const sampleResponse: PerceptionSubscription = {
  ok: true,
  subscription_id: "psub_" + "a".repeat(32),
  org: "org_123",
  transport: "srt",
  receive: { whep_url: null, srt_url: "srt://ingest.example.com:9000?streamid=game" },
  task: "Describe on-field events.",
  sample: { mode: "adaptive", maxFps: 2, minIntervalMs: 2000 },
  audio: { mode: "transcribe" },
  frame: { encoding: "jpeg", maxEdge: 1280 },
  batch: { maxFrames: 4, maxDelayMs: 250 },
  model: "claude-haiku",
  inference_endpoint: "/v1/messages",
  meters: {
    delivery: "wave_stream_delivered_minutes",
    aiTokensIn: "wave_ai_tokens_haiku_input",
    aiTokensOut: "wave_ai_tokens_haiku_output",
  },
};

describe("PerceptionAPI", () => {
  it("is constructable directly and via factory", () => {
    const { client } = mockClient();
    expect(new PerceptionAPI(client)).toBeInstanceOf(PerceptionAPI);
    expect(createPerceptionAPI(client)).toBeInstanceOf(PerceptionAPI);
  });

  it("subscribe() POSTs the request body to /v1/perception/subscribe and returns the subscription", async () => {
    const { client, post } = mockClient();
    post.mockResolvedValue(sampleResponse);
    const api = new PerceptionAPI(client);

    const req = {
      stream: "srt://ingest.example.com:9000?streamid=game",
      task: "Describe on-field events.",
      sample: { mode: "adaptive" as const, maxFps: 2 },
      model: "claude-haiku",
    };
    const sub = await api.subscribe(req);

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith("/v1/perception/subscribe", req);
    expect(sub.subscription_id).toMatch(/^psub_[0-9a-f]{32}$/);
    expect(sub.transport).toBe("srt");
    expect(sub.meters.delivery).toBe("wave_stream_delivered_minutes");
    expect(sub.inference_endpoint).toBe("/v1/messages");
  });

  it("unsubscribe() DELETEs /v1/perception/subscribe/:id", async () => {
    const { client, del } = mockClient();
    const api = new PerceptionAPI(client);
    const id = "psub_" + "b".repeat(32);

    await api.unsubscribe(id);

    expect(del).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledWith(`/v1/perception/subscribe/${id}`);
  });

  it("receiveUrl() returns the single populated transport url", () => {
    expect(PerceptionAPI.receiveUrl(sampleResponse)).toBe(
      "srt://ingest.example.com:9000?streamid=game",
    );
    const whep = { ...sampleResponse, transport: "whep" as const, receive: { whep_url: "https://x.cloudflarestream.com/y/webRTC/play", srt_url: null } };
    expect(PerceptionAPI.receiveUrl(whep)).toBe("https://x.cloudflarestream.com/y/webRTC/play");
  });
});
