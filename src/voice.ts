/**
 * WAVE SDK - Voice API
 *
 * Text-to-speech and voice cloning capabilities.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type {
  WaveClient,
  PaginationParams,
  PaginatedResponse,
  Timestamps,
  Metadata,
} from './client';
import type { VoiceModelType, VoiceGender, AudioFormat, Voice, SynthesizeRequest, SynthesisResult, CloneVoiceRequest, VoiceCloneJob, ListVoicesParams, VoiceSettings } from './voice-types';

// ============================================================================
// Types
// ============================================================================

/**
 * Voice model type
 */

/**
 * Voice gender
 */

/**
 * Audio format
 */

/**
 * Voice definition
 */

/**
 * Speech synthesis request
 */

/**
 * Speech synthesis result
 */

/**
 * Voice cloning request
 */

/**
 * Voice clone job
 */

/**
 * List voices params
 */

/**
 * Voice settings
 */

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
  // Voices
  // ==========================================================================

  /**
   * List available voices
   *
   * Requires: voice:read permission
   */
  async listVoices(params?: ListVoicesParams): Promise<PaginatedResponse<Voice>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      ...params,
      tags: params?.tags?.join(','),
    };

    return this.client.get<PaginatedResponse<Voice>>(`${this.basePath}/voices`, {
      params: queryParams,
    });
  }

  /**
   * Get a voice by ID
   *
   * Requires: voice:read permission
   */
  async getVoice(voiceId: string): Promise<Voice> {
    return this.client.get<Voice>(`${this.basePath}/voices/${voiceId}`);
  }

  /**
   * Get default voice settings for a voice
   *
   * Requires: voice:read permission
   */
  async getVoiceSettings(voiceId: string): Promise<VoiceSettings> {
    return this.client.get<VoiceSettings>(
      `${this.basePath}/voices/${voiceId}/settings`
    );
  }

  /**
   * Update voice settings for a cloned voice
   *
   * Requires: voice:update permission
   */
  async updateVoiceSettings(
    voiceId: string,
    settings: Partial<VoiceSettings>
  ): Promise<VoiceSettings> {
    return this.client.patch<VoiceSettings>(
      `${this.basePath}/voices/${voiceId}/settings`,
      settings
    );
  }

  /**
   * Remove a cloned voice
   *
   * Requires: voice:remove permission (server-side RBAC enforced)
   */
  async removeVoice(voiceId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/voices/${voiceId}`,
      { method: 'DELETE' }
    );
  }

  // ==========================================================================
  // Speech Synthesis
  // ==========================================================================

  /**
   * Synthesize text to speech
   *
   * Requires: voice:synthesize permission
   */
  async synthesize(request: SynthesizeRequest): Promise<SynthesisResult> {
    return this.client.post<SynthesisResult>(
      `${this.basePath}/synthesize`,
      request
    );
  }

  /**
   * Get synthesis job status
   *
   * Requires: voice:read permission
   */
  async getSynthesis(synthesisId: string): Promise<SynthesisResult> {
    return this.client.get<SynthesisResult>(
      `${this.basePath}/synthesize/${synthesisId}`
    );
  }

  /**
   * List synthesis jobs
   *
   * Requires: voice:read permission
   */
  async listSyntheses(
    params?: PaginationParams & {
      voice_id?: string;
      status?: 'pending' | 'processing' | 'ready' | 'failed';
    }
  ): Promise<PaginatedResponse<SynthesisResult>> {
    return this.client.get<PaginatedResponse<SynthesisResult>>(
      `${this.basePath}/synthesize`,
      { params: params as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Synthesize speech and stream the audio
   *
   * Requires: voice:synthesize permission
   *
   * @returns ReadableStream of audio data
   */
  async synthesizeStream(
    request: Omit<SynthesizeRequest, 'webhook_url'>
  ): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(
      `${this.client['config'].baseUrl}${this.basePath}/synthesize/stream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.client['config'].apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`Synthesis stream failed: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    return response.body;
  }

  /**
   * Wait for synthesis to complete
   */
  async waitForSynthesis(
    synthesisId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (synthesis: SynthesisResult) => void;
    }
  ): Promise<SynthesisResult> {
    const pollInterval = options?.pollInterval || 1000;
    const timeout = options?.timeout || 120000; // 2 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const synthesis = await this.getSynthesis(synthesisId);

      if (options?.onProgress) {
        options.onProgress(synthesis);
      }

      if (synthesis.status === 'ready') {
        return synthesis;
      }

      if (synthesis.status === 'failed') {
        throw new Error(`Synthesis failed: ${synthesis.error || 'Unknown error'}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Synthesis timed out after ${timeout}ms`);
  }

  // ==========================================================================
  // Voice Cloning
  // ==========================================================================

  /**
   * Start voice cloning job
   *
   * Requires: voice:clone permission
   */
  async cloneVoice(request: CloneVoiceRequest): Promise<VoiceCloneJob> {
    return this.client.post<VoiceCloneJob>(
      `${this.basePath}/clone`,
      request
    );
  }

  /**
   * Get voice clone job status
   *
   * Requires: voice:read permission
   */
  async getCloneJob(jobId: string): Promise<VoiceCloneJob> {
    return this.client.get<VoiceCloneJob>(
      `${this.basePath}/clone/${jobId}`
    );
  }

  /**
   * List voice clone jobs
   *
   * Requires: voice:read permission
   */
  async listCloneJobs(
    params?: PaginationParams & {
      status?: 'pending' | 'processing' | 'training' | 'ready' | 'failed';
    }
  ): Promise<PaginatedResponse<VoiceCloneJob>> {
    return this.client.get<PaginatedResponse<VoiceCloneJob>>(
      `${this.basePath}/clone`,
      { params: params as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Cancel a voice clone job
   *
   * Requires: voice:clone permission
   */
  async cancelCloneJob(jobId: string): Promise<VoiceCloneJob> {
    return this.client.post<VoiceCloneJob>(
      `${this.basePath}/clone/${jobId}/cancel`
    );
  }

  /**
   * Wait for voice cloning to complete
   */
  async waitForClone(
    jobId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (job: VoiceCloneJob) => void;
    }
  ): Promise<VoiceCloneJob> {
    const pollInterval = options?.pollInterval || 5000;
    const timeout = options?.timeout || 3600000; // 1 hour
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const job = await this.getCloneJob(jobId);

      if (options?.onProgress) {
        options.onProgress(job);
      }

      if (job.status === 'ready') {
        return job;
      }

      if (job.status === 'failed') {
        throw new Error(`Voice cloning failed: ${job.error || 'Unknown error'}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Voice cloning timed out after ${timeout}ms`);
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Estimate synthesis cost
   *
   * Requires: voice:read permission
   */
  async estimateCost(
    text: string,
    voiceId: string
  ): Promise<{
    characters: number;
    estimated_duration: number;
    estimated_cost: number;
    currency: string;
  }> {
    return this.client.post(`${this.basePath}/estimate`, {
      text,
      voice_id: voiceId,
    });
  }

  /**
   * Get supported languages
   *
   * Requires: voice:read permission
   */
  async getSupportedLanguages(): Promise<
    Array<{
      code: string;
      name: string;
      locales: Array<{ code: string; name: string }>;
    }>
  > {
    return this.client.get(`${this.basePath}/languages`);
  }
}

/**
 * Create a Voice API instance
 */
export function createVoiceAPI(client: WaveClient): VoiceAPI {
  return new VoiceAPI(client);
}
