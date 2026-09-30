/**
 * VoiceAPI.synthesize: the wire contract of the served speak route.
 *
 * The gateway forwards POST /v1/voice to the wave-voice edge, which answers with audio bytes and
 * reads the voice as `voiceId`. The SDK's public option stays `voice_id`.
 */
import { describe, it, expect, vi } from "vitest";
import { VoiceAPI } from "../voice";
import type { WaveClient } from "../client";

function mockClient(result: unknown = new ArrayBuffer(4)) {
  const post = vi.fn().mockResolvedValue(result);
  return { client: { post } as unknown as WaveClient, post };
}

describe("VoiceAPI.synthesize", () => {
  it("POSTs /v1/voice, asks for audio bytes, and returns them", async () => {
    const bytes = new ArrayBuffer(8);
    const { client, post } = mockClient(bytes);
    const out = await new VoiceAPI(client).synthesize({ text: "Hello from WAVE" });

    expect(out).toBe(bytes);
    expect(post).toHaveBeenCalledTimes(1);
    const [path, body, opts] = post.mock.calls[0];
    expect(path).toBe("/v1/voice");
    expect(body).toEqual({ text: "Hello from WAVE" });
    expect(opts).toMatchObject({ responseType: "arraybuffer", headers: { Accept: "audio/mpeg" } });
  });

  it("sends voice_id as voiceId, the field the voice edge reads", async () => {
    const { client, post } = mockClient();
    await new VoiceAPI(client).synthesize({ text: "hi", voice_id: "voice_abc", format: "mp3" });

    const body = post.mock.calls[0][1] as Record<string, unknown>;
    expect(body).toEqual({ text: "hi", voiceId: "voice_abc", format: "mp3" });
    expect(body).not.toHaveProperty("voice_id");
  });

  it("omits voiceId when no voice is chosen, so the edge uses its default voice", async () => {
    const { client, post } = mockClient();
    await new VoiceAPI(client).synthesize({ text: "hi", voice_id: "" });

    expect(post.mock.calls[0][1]).toEqual({ text: "hi" });
  });
});
