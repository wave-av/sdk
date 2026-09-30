/**
 * Wire contracts of the served media routes: clips, captions, transcribe and voice.
 *
 * The gateway forwards each prefix whole to one product edge, and the edge decides what is
 * served. Each expectation below is the edge's own route table and request parser:
 *   clips       wave-av/wave-clip-engine      src/index.ts (routes), src/types.ts (shapes)
 *   captions    wave-av/wave-captions-edge    src/api.ts (routes), src/jobs.ts (CaptionJobCreate)
 *   transcribe  wave-av/wave-transcribe-edge  src/api.ts (routes), src/jobs.ts (parseCreateBody)
 *   voice       wave-av/wave-voice-edge       src/api.ts (routes), src/voices.ts (catalog, clone)
 *
 * Every call runs through a real WaveClient with fetch stubbed, so the test sees the exact method,
 * URL, query and JSON body that would reach api.wave.online.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { WaveClient } from "../client";
import { WaveError } from "../errors";
import { ClipsAPI } from "../clips";
import { CaptionsAPI } from "../captions";
import { TranscribeAPI } from "../transcribe";
import { VoiceAPI } from "../voice";

const BASE = "https://api.test.wave";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

/** Stub fetch with one answer per call, and return what each call sent. */
function stubFetch(...answers: Response[]) {
  const fetchMock = vi.fn(async () => answers.shift() ?? json({}));
  vi.stubGlobal("fetch", fetchMock);
  const sent = (i = 0) => {
    const [url, init] = fetchMock.mock.calls[i] as unknown as [string, RequestInit];
    const u = new URL(url);
    return {
      method: init.method,
      path: u.pathname,
      query: Object.fromEntries(u.searchParams),
      body: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
    };
  };
  return { fetchMock, sent };
}

function client(maxRetries = 0): WaveClient {
  return new WaveClient({ apiKey: "wave-test-key", baseUrl: BASE, maxRetries });
}

/** A 503 the client would normally retry: proves a billed call is sent exactly once. */
const busy = () => json({ error: { code: "SERVICE_UNAVAILABLE", message: "busy" } }, 503);

afterEach(() => vi.unstubAllGlobals());

const storedClip = {
  id: "clip_1",
  videoId: "rec_123",
  startTime: 120,
  endTime: 150,
  duration: 30,
  title: "Best Moment",
  description: null,
  category: null,
  thumbnailUrl: null,
  previewUrl: null,
  status: "completed",
  organizationId: "org_1",
  createdAt: "2026-09-30T00:00:00Z",
  updatedAt: "2026-09-30T00:00:00Z",
};

describe("clips (wave-clip-engine)", () => {
  it("create() POSTs the native body to /v1/clips and returns clipId, assets and the stored clip", async () => {
    const created = {
      ok: true,
      clipId: "clip_1",
      org: "org_1",
      visibility: "private",
      source: "rec_123",
      in: "2m",
      duration: "30s",
      quality: "720p",
      assets: [{ kind: "clip", key: "org_1/clips/clip_1/clip.mp4", contentType: "video/mp4", url: "https://m/x" }],
      clip: storedClip,
    };
    const { sent } = stubFetch(json(created, 201));
    const out = await new ClipsAPI(client()).create({ source: "rec_123", in: "2m", out: "2m30s", title: "Best Moment" });
    expect(sent()).toMatchObject({ method: "POST", path: "/v1/clips" });
    expect(sent().body).toEqual({ source: "rec_123", in: "2m", out: "2m30s", title: "Best Moment" });
    expect(out.clipId).toBe("clip_1");
    expect(out.clip.id).toBe(out.clipId);
    expect(out.assets[0].url).toBe("https://m/x");
  });

  it("create() is never retried: it is billed per output minute", async () => {
    const { fetchMock } = stubFetch(busy(), busy(), busy());
    const err = await new ClipsAPI(client(3)).create({ source: "r", in: "0s", duration: "5s" }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(WaveError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("get(), update() and remove() address /v1/clips/{id}, with the id encoded", async () => {
    const { sent } = stubFetch(json(storedClip), json(storedClip), new Response(null, { status: 204 }));
    const clips = new ClipsAPI(client());
    await clips.get("a/b");
    await clips.update("clip_1", { title: "t", category: "sports" });
    await clips.remove("clip_1");
    expect(sent(0)).toMatchObject({ method: "GET", path: "/v1/clips/a%2Fb" });
    expect(sent(1)).toMatchObject({ method: "PATCH", path: "/v1/clips/clip_1", body: { title: "t", category: "sports" } });
    expect(sent(2)).toMatchObject({ method: "DELETE", path: "/v1/clips/clip_1" });
  });

  it("list() sends page / perPage / videoId, the query the engine reads", async () => {
    const { sent } = stubFetch(json({ data: [storedClip], pagination: { page: 2, perPage: 5, total: 6, totalPages: 2 } }));
    const page = await new ClipsAPI(client()).list({ page: 2, perPage: 5, videoId: "rec_123" });
    expect(sent()).toMatchObject({ method: "GET", path: "/v1/clips", query: { page: "2", perPage: "5", videoId: "rec_123" } });
    expect(page.data[0].status).toBe("completed");
    expect(page.pagination.totalPages).toBe(2);
  });

  it("detect() POSTs /v1/clips/detect once and returns the candidates", async () => {
    const job = { id: "j", status: "completed", progress: 100, createdAt: "t", results: [{ in: "40s", duration: "20s", score: 0.8, transcript: "wow" }] };
    const { sent, fetchMock } = stubFetch(json(job, 202));
    const out = await new ClipsAPI(client(3)).detect({ videoId: "rec_123", maxClips: 3 });
    expect(sent()).toMatchObject({ method: "POST", path: "/v1/clips/detect", body: { videoId: "rec_123", maxClips: 3 } });
    expect(out.results[0]).toEqual({ in: "40s", duration: "20s", score: 0.8, transcript: "wow" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("waitForReady() returns on the first poll for the engine's 'completed' status", async () => {
    const { fetchMock } = stubFetch(json(storedClip));
    const clip = await new ClipsAPI(client()).waitForReady("clip_1", { pollInterval: 1, timeout: 50 });
    expect(clip.status).toBe("completed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

const captionJob = {
  id: "cap_1",
  videoId: "rec_123",
  sourceLanguage: "en",
  targetLanguages: [],
  status: "completed",
  progress: 100,
  outputs: { en: "/v1/captions/cap_1/download?language=en" },
  organizationId: "org_1",
  createdAt: "t",
  updatedAt: "t",
};

describe("captions (wave-captions-edge)", () => {
  it("create() POSTs the CaptionJobCreate body to /v1/captions, once", async () => {
    const { sent, fetchMock } = stubFetch(json(captionJob, 201));
    const job = await new CaptionsAPI(client(3)).create({ videoId: "rec_123", sourceLanguage: "en", speakerLabels: true });
    expect(sent()).toMatchObject({ method: "POST", path: "/v1/captions" });
    expect(sent().body).toEqual({ videoId: "rec_123", sourceLanguage: "en", speakerLabels: true });
    expect(job.status).toBe("completed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("create() is never retried: it is billed per caption minute", async () => {
    const { fetchMock } = stubFetch(busy(), busy());
    await expect(new CaptionsAPI(client(3)).create({ videoId: "rec_123" })).rejects.toBeInstanceOf(WaveError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("download() GETs /v1/captions/{id}/download with language and format, and returns the content", async () => {
    const { sent } = stubFetch(json({ content: "1\n00:00:00,000 --> 00:00:01,000\nhi\n" }));
    const srt = await new CaptionsAPI(client()).download("cap_1", { language: "en", format: "srt" });
    expect(sent()).toMatchObject({ method: "GET", path: "/v1/captions/cap_1/download", query: { language: "en", format: "srt" } });
    expect(srt).toContain("-->");
  });

  it("getText() reads the job's source language, then downloads txt", async () => {
    const { sent } = stubFetch(json(captionJob), json({ content: "hello world\n" }));
    expect(await new CaptionsAPI(client()).getText("cap_1")).toBe("hello world\n");
    expect(sent(0)).toMatchObject({ method: "GET", path: "/v1/captions/cap_1" });
    expect(sent(1)).toMatchObject({ path: "/v1/captions/cap_1/download", query: { language: "en", format: "txt" } });
  });

  it("list(), getForMedia() and remove() use the served job routes", async () => {
    const page = { data: [captionJob], pagination: { page: 1, perPage: 20, total: 1, totalPages: 1 } };
    const { sent } = stubFetch(json(page), json(page), new Response(null, { status: 204 }));
    const captions = new CaptionsAPI(client());
    await captions.list({ status: "completed", perPage: 20 });
    expect(await captions.getForMedia("rec_123")).toHaveLength(1);
    await captions.remove("cap_1");
    expect(sent(0)).toMatchObject({ method: "GET", path: "/v1/captions", query: { status: "completed", perPage: "20" } });
    expect(sent(1)).toMatchObject({ method: "GET", path: "/v1/captions", query: { videoId: "rec_123" } });
    expect(sent(2)).toMatchObject({ method: "DELETE", path: "/v1/captions/cap_1" });
  });

  it("waitForReady() throws with the edge's reason for a failed job", async () => {
    stubFetch(json({ ...captionJob, status: "failed", errorMessage: "media fetch failed" }));
    await expect(new CaptionsAPI(client()).waitForReady("cap_1", { pollInterval: 1, timeout: 50 })).rejects.toThrow(
      "media fetch failed"
    );
  });
});

const transcription = {
  id: "tr_1",
  sourceId: "https://example.com/a.mp3",
  sourceType: "audio",
  status: "completed",
  text: "hello there",
  organizationId: "org_1",
  createdAt: "t",
  updatedAt: "t",
};

describe("transcribe (wave-transcribe-edge)", () => {
  it("create() POSTs the camelCase body parseCreateBody requires, once", async () => {
    const { sent, fetchMock } = stubFetch(json(transcription, 201));
    const t = await new TranscribeAPI(client(3)).create({
      sourceId: "https://example.com/a.mp3",
      sourceType: "audio",
      speakerLabels: true,
      model: "deepgram",
    });
    expect(sent()).toMatchObject({ method: "POST", path: "/v1/transcribe" });
    expect(sent().body).toEqual({ sourceId: "https://example.com/a.mp3", sourceType: "audio", speakerLabels: true, model: "deepgram" });
    expect(t.text).toBe("hello there");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("create() is never retried: it is billed per transcribed minute", async () => {
    const { fetchMock } = stubFetch(busy(), busy());
    await expect(new TranscribeAPI(client(3)).create({ sourceId: "rec_1", sourceType: "video" })).rejects.toBeInstanceOf(WaveError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("get(), list(), remove() and getText() use the served routes", async () => {
    const page = { data: [transcription], pagination: { page: 1, perPage: 20, total: 1, totalPages: 1 } };
    const { sent } = stubFetch(json(transcription), json(page), new Response(null, { status: 204 }), json(transcription));
    const tr = new TranscribeAPI(client());
    await tr.get("tr_1");
    await tr.list({ page: 1, status: "completed" });
    await tr.remove("tr_1");
    expect(await tr.getText("tr_1")).toBe("hello there");
    expect(sent(0)).toMatchObject({ method: "GET", path: "/v1/transcribe/tr_1" });
    expect(sent(1)).toMatchObject({ method: "GET", path: "/v1/transcribe", query: { page: "1", status: "completed" } });
    expect(sent(2)).toMatchObject({ method: "DELETE", path: "/v1/transcribe/tr_1" });
    expect(sent(3)).toMatchObject({ method: "GET", path: "/v1/transcribe/tr_1" });
  });

  it("getText() throws, naming the status, when a job has no text", async () => {
    stubFetch(json({ ...transcription, status: "failed", text: undefined, errorMessage: "sourceId media fetch returned 404" }));
    await expect(new TranscribeAPI(client()).getText("tr_1")).rejects.toThrow("status failed");
  });
});

describe("voice (wave-voice-edge)", () => {
  it("synthesize() is never retried: it is billed per call", async () => {
    const { fetchMock } = stubFetch(busy(), busy());
    await expect(new VoiceAPI(client(3)).synthesize({ text: "hi" })).rejects.toBeInstanceOf(WaveError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("listVoices() GETs /v1/voice/voices with the edge's filters and unwraps { voices }", async () => {
    const { sent } = stubFetch(json({ voices: [{ id: "v1", name: "Rachel", category: "premade" }] }));
    const voices = await new VoiceAPI(client()).listVoices({ category: "premade", language: "en" });
    expect(sent()).toMatchObject({ method: "GET", path: "/v1/voice/voices", query: { category: "premade", language: "en" } });
    expect(voices).toEqual([{ id: "v1", name: "Rachel", category: "premade" }]);
  });

  it("cloneVoice() POSTs { name, audioFiles } to /v1/voice/clone, once", async () => {
    const { sent, fetchMock } = stubFetch(json({ id: "v2", name: "Me", category: "cloned" }, 201));
    const voice = await new VoiceAPI(client(3)).cloneVoice({ name: "Me", audioFiles: ["https://example.com/s.mp3"] });
    expect(sent()).toMatchObject({ method: "POST", path: "/v1/voice/clone", body: { name: "Me", audioFiles: ["https://example.com/s.mp3"] } });
    expect(voice.id).toBe("v2");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
