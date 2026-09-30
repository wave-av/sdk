/**
 * WAVE SDK - Voice API
 *
 * Text-to-speech, the voice catalog, and instant voice cloning.
 *
 * The gateway forwards `/v1/voice` to the WAVE voice edge. The routes this module calls and the
 * edge serves:
 *
 *   POST /v1/voice           synthesize()   the audio bytes (audio/mpeg)
 *   GET  /v1/voice/voices    listVoices()   { voices }
 *   POST /v1/voice/clone     cloneVoice()   the new Voice, 201
 *
 * The synthesis-job, voice-settings, clone-job, estimate and language methods of earlier releases
 * have no backend; they now throw RouteNotServedError before any network call, and are marked
 * deprecated.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type { WaveClient, PaginationParams, PaginatedResponse } from './client';
import { routeNotServed } from './errors';
import type {
  Voice,
  SynthesizeRequest,
  SynthesisResult,
  CloneVoiceRequest,
  VoiceCloneJob,
  ListVoicesParams,
  VoiceSettings,
} from './voice-types';
export type * from './voice-types';

// ============================================================================
// Voice API
// ============================================================================

/**
 * Voice API client
 */
export class VoiceAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/voice';

  constructor(client: WaveClient) {
    this.client = client;
  }

  // ==========================================================================
  // Served
  // ==========================================================================

  /**
   * Synthesize text to speech.
   *
   * Contract: POST `/v1/voice` with a JSON body returns the audio bytes directly
   * (`audio/mpeg`), not a JSON job object. The gateway forwards `/v1/voice` to the
   * wave-voice edge, whose speak handler reads the voice as `voiceId`; the SDK keeps
   * its snake_case `voice_id` option and renames it on the wire, so a chosen voice is
   * not silently replaced by the default one. Omit `voice_id` for the default voice.
   *
   * Billed per call, so it is sent once and never retried: a timeout after the edge synthesized
   * the audio must not synthesize (and bill) it again. Timeouts, custom headers and
   * `WaveError`-typed failures still apply.
   *
   * Requires: voice:write permission
   */
  async synthesize(request: SynthesizeRequest): Promise<ArrayBuffer> {
    const { voice_id, ...rest } = request;
    const body = voice_id ? { ...rest, voiceId: voice_id } : rest;
    return this.client.post<ArrayBuffer>(this.basePath, body, {
      headers: { Accept: 'audio/mpeg' },
      responseType: 'arraybuffer',
      noRetry: true,
    });
  }

  /**
   * List the voices `synthesize()` can use. `GET /v1/voice/voices`, filtered by the edge.
   *
   * Requires: voice:read permission
   */
  async listVoices(params?: ListVoicesParams): Promise<Voice[]> {
    const body = await this.client.get<{ voices?: Voice[] }>(`${this.basePath}/voices`, {
      params: { category: params?.category, language: params?.language },
    });
    return body.voices ?? [];
  }

  /**
   * Clone a voice from 1-25 https sample URLs. `POST /v1/voice/clone`, answered 201 with the new
   * voice, ready to pass to `synthesize({ voice_id })`.
   *
   * Billed per clone, so it is sent once and never retried.
   *
   * Requires: voice:write permission
   */
  async cloneVoice(request: CloneVoiceRequest): Promise<Voice> {
    return this.client.post<Voice>(`${this.basePath}/clone`, request, {
      timeout: 120_000,
      noRetry: true,
    });
  }

  // ==========================================================================
  // Unserved (deprecated): each throws RouteNotServedError without a network call
  // ==========================================================================

  /** @deprecated No single-voice route is served; find the voice in `listVoices()`. */
  async getVoice(_voiceId: string): Promise<Voice> {
    throw routeNotServed('voice.getVoice', 'GET /v1/voice/voices/{voiceId}', 'voice.listVoices()');
  }

  /** @deprecated No voice-settings route is served. */
  async getVoiceSettings(_voiceId: string): Promise<VoiceSettings> {
    throw routeNotServed('voice.getVoiceSettings', 'GET /v1/voice/voices/{voiceId}/settings');
  }

  /** @deprecated No voice-settings route is served. */
  async updateVoiceSettings(_voiceId: string, _settings: Partial<VoiceSettings>): Promise<VoiceSettings> {
    throw routeNotServed('voice.updateVoiceSettings', 'PATCH /v1/voice/voices/{voiceId}/settings');
  }

  /** @deprecated No voice-removal route is served. */
  async removeVoice(_voiceId: string): Promise<void> {
    throw routeNotServed('voice.removeVoice', 'DELETE /v1/voice/voices/{voiceId}');
  }

  /** @deprecated `synthesize()` returns the audio directly; there is no synthesis job to read. */
  async getSynthesis(_synthesisId: string): Promise<SynthesisResult> {
    throw routeNotServed('voice.getSynthesis', 'GET /v1/voice/synthesize/{synthesisId}', 'voice.synthesize(), which returns the audio');
  }

  /** @deprecated `synthesize()` returns the audio directly; there are no synthesis jobs to list. */
  async listSyntheses(
    _params?: PaginationParams & {
      voice_id?: string;
      status?: 'pending' | 'processing' | 'ready' | 'failed';
    }
  ): Promise<PaginatedResponse<SynthesisResult>> {
    throw routeNotServed('voice.listSyntheses', 'GET /v1/voice/synthesize');
  }

  /** @deprecated No streaming synthesis route is served; `synthesize()` returns the whole audio. */
  async synthesizeStream(
    _request: Omit<SynthesizeRequest, 'webhook_url'>
  ): Promise<ReadableStream<Uint8Array>> {
    throw routeNotServed('voice.synthesizeStream', 'POST /v1/voice/synthesize/stream', 'voice.synthesize()');
  }

  /** @deprecated `synthesize()` returns the audio directly; there is nothing to wait for. */
  async waitForSynthesis(
    _synthesisId: string,
    _options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (synthesis: SynthesisResult) => void;
    }
  ): Promise<SynthesisResult> {
    throw routeNotServed('voice.waitForSynthesis', 'GET /v1/voice/synthesize/{synthesisId}', 'voice.synthesize(), which returns the audio');
  }

  /** @deprecated `cloneVoice()` returns the finished voice; there is no clone job to read. */
  async getCloneJob(_jobId: string): Promise<VoiceCloneJob> {
    throw routeNotServed('voice.getCloneJob', 'GET /v1/voice/clone/{jobId}', 'voice.cloneVoice(), which returns the voice');
  }

  /** @deprecated `/v1/voice/clone` answers POST only; list voices with `listVoices({ category: 'cloned' })`. */
  async listCloneJobs(
    _params?: PaginationParams & {
      status?: 'pending' | 'processing' | 'training' | 'ready' | 'failed';
    }
  ): Promise<PaginatedResponse<VoiceCloneJob>> {
    throw routeNotServed('voice.listCloneJobs', 'GET /v1/voice/clone', "voice.listVoices({ category: 'cloned' })");
  }

  /** @deprecated `cloneVoice()` is synchronous; there is no clone job to cancel. */
  async cancelCloneJob(_jobId: string): Promise<VoiceCloneJob> {
    throw routeNotServed('voice.cancelCloneJob', 'POST /v1/voice/clone/{jobId}/cancel');
  }

  /** @deprecated `cloneVoice()` returns the finished voice; there is nothing to wait for. */
  async waitForClone(
    _jobId: string,
    _options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (job: VoiceCloneJob) => void;
    }
  ): Promise<VoiceCloneJob> {
    throw routeNotServed('voice.waitForClone', 'GET /v1/voice/clone/{jobId}', 'voice.cloneVoice(), which returns the voice');
  }

  /** @deprecated No estimate route is served; the gateway's x402 quote on `/v1/voice` prices a call. */
  async estimateCost(
    _text: string,
    _voiceId: string
  ): Promise<{
    characters: number;
    estimated_duration: number;
    estimated_cost: number;
    currency: string;
  }> {
    throw routeNotServed('voice.estimateCost', 'POST /v1/voice/estimate');
  }

  /** @deprecated No language-list route is served; `listVoices({ language })` filters by language. */
  async getSupportedLanguages(): Promise<
    Array<{
      code: string;
      name: string;
      locales: Array<{ code: string; name: string }>;
    }>
  > {
    throw routeNotServed('voice.getSupportedLanguages', 'GET /v1/voice/languages', 'voice.listVoices({ language })');
  }
}

/**
 * Create a Voice API instance
 */
export function createVoiceAPI(client: WaveClient): VoiceAPI {
  return new VoiceAPI(client);
}
