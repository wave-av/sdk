/**
 * Methods whose route no WAVE backend serves throw RouteNotServedError before any network call.
 *
 * These modules sit on prefixes the gateway forwards whole to a product edge, so an unserved
 * sub-path would come back as the edge's plain 404 or 405 with no gateway route code. The SDK
 * labels them itself. Each method listed here was checked against the owning edge's route table
 * (see media-served.test.ts for the repos and files); none of their paths is in it.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { WaveClient } from "../client";
import { RouteNotServedError, WaveError } from "../errors";
import { ClipsAPI } from "../clips";
import { CaptionsAPI } from "../captions";
import { TranscribeAPI } from "../transcribe";
import { VoiceAPI } from "../voice";

afterEach(() => vi.unstubAllGlobals());

type Call = (m: Record<string, (...a: unknown[]) => Promise<unknown>>) => Promise<unknown>;

const cases: Array<[string, (c: WaveClient) => object, Record<string, Call>]> = [
  [
    "clips",
    (c) => new ClipsAPI(c),
    {
      exportClip: (m) => m.exportClip("c", { format: "mp4" }),
      getExport: (m) => m.getExport("c", "e"),
      listExports: (m) => m.listExports("c"),
      waitForExport: (m) => m.waitForExport("c", "e"),
      detectHighlights: (m) => m.detectHighlights("recording", "r"),
      createFromHighlights: (m) => m.createFromHighlights("recording", "r"),
    },
  ],
  [
    "captions",
    (c) => new CaptionsAPI(c),
    {
      generate: (m) => m.generate({ media_id: "v", media_type: "video" }),
      upload: (m) => m.upload({}),
      update: (m) => m.update("t", {}),
      getCues: (m) => m.getCues("t"),
      updateCue: (m) => m.updateCue("t", "c", {}),
      addCue: (m) => m.addCue("t", {}),
      removeCue: (m) => m.removeCue("t", "c"),
      bulkUpdateCues: (m) => m.bulkUpdateCues("t", []),
      translate: (m) => m.translate("t", { target_language: "es" }),
      exportFormat: (m) => m.exportFormat("t", "srt"),
      burnIn: (m) => m.burnIn({ caption_track_id: "t" }),
      getBurnInJob: (m) => m.getBurnInJob("j"),
      waitForBurnIn: (m) => m.waitForBurnIn("j"),
      getSupportedLanguages: (m) => m.getSupportedLanguages(),
      detectLanguage: (m) => m.detectLanguage("v", "video"),
    },
  ],
  [
    "transcribe",
    (c) => new TranscribeAPI(c),
    {
      update: (m) => m.update("t", {}),
      getSegments: (m) => m.getSegments("t"),
      updateSegment: (m) => m.updateSegment("t", "s", {}),
      mergeSegments: (m) => m.mergeSegments("t", []),
      splitSegment: (m) => m.splitSegment("t", "s", 1),
      getSpeakers: (m) => m.getSpeakers("t"),
      updateSpeaker: (m) => m.updateSpeaker("t", 0, "A"),
      mergeSpeakers: (m) => m.mergeSpeakers("t", [0, 1]),
      exportTranscription: (m) => m.exportTranscription("t", "srt"),
      search: (m) => m.search("t", "q"),
      startRealtime: (m) => m.startRealtime("s"),
      stopRealtime: (m) => m.stopRealtime("s"),
      getRealtimeStatus: (m) => m.getRealtimeStatus("s"),
      detectLanguage: (m) => m.detectLanguage("https://example.com/a.mp3"),
      getSupportedLanguages: (m) => m.getSupportedLanguages(),
      estimateCost: (m) => m.estimateCost(60),
    },
  ],
  [
    "voice",
    (c) => new VoiceAPI(c),
    {
      getVoice: (m) => m.getVoice("v"),
      getVoiceSettings: (m) => m.getVoiceSettings("v"),
      updateVoiceSettings: (m) => m.updateVoiceSettings("v", {}),
      removeVoice: (m) => m.removeVoice("v"),
      getSynthesis: (m) => m.getSynthesis("s"),
      listSyntheses: (m) => m.listSyntheses(),
      synthesizeStream: (m) => m.synthesizeStream({ text: "hi" }),
      waitForSynthesis: (m) => m.waitForSynthesis("s"),
      getCloneJob: (m) => m.getCloneJob("j"),
      listCloneJobs: (m) => m.listCloneJobs(),
      cancelCloneJob: (m) => m.cancelCloneJob("j"),
      waitForClone: (m) => m.waitForClone("j"),
      estimateCost: (m) => m.estimateCost("hi", "v"),
      getSupportedLanguages: (m) => m.getSupportedLanguages(),
    },
  ],
];

describe.each(cases)("%s: unserved methods", (name, make, calls) => {
  it.each(Object.entries(calls))(`%s throws RouteNotServedError and makes no network call`, async (method, call) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const api = make(new WaveClient({ apiKey: "wave-test-key" })) as unknown as Record<
      string,
      (...a: unknown[]) => Promise<unknown>
    >;

    const err = await call(api).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(RouteNotServedError);
    expect(err).toBeInstanceOf(WaveError);
    expect(err).toMatchObject({ code: "ROUTE_NOT_SERVED", statusCode: 404, retryable: false });
    expect((err as Error).message).toContain(`${name}.${method}`);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

it("a gated method that has a served replacement names it", async () => {
  const err = await new ClipsAPI(new WaveClient({ apiKey: "k" })).detectHighlights("recording", "r").catch((e: unknown) => e);
  expect((err as Error).message).toBe(
    "clips.detectHighlights: no WAVE backend serves POST /v1/clips/highlights/detect yet; use clips.detect({ videoId })."
  );
});
