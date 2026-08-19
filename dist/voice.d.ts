import { WaveClient } from './client.js';
import { ListVoicesParams, Voice, VoiceSettings, SynthesizeRequest, SynthesisResult, CloneVoiceRequest, VoiceCloneJob } from './voice-types.js';
export { AudioFormat, VoiceGender, VoiceModelType } from './voice-types.js';
import { PaginatedResponse, PaginationParams } from './client-types.js';
import 'eventemitter3';
import './telemetry.js';

/**
 * WAVE SDK - Voice API
 *
 * Text-to-speech and voice cloning capabilities.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

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
/**
 * Voice API client
 */
declare class VoiceAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * List available voices
     *
     * Requires: voice:read permission
     */
    listVoices(params?: ListVoicesParams): Promise<PaginatedResponse<Voice>>;
    /**
     * Get a voice by ID
     *
     * Requires: voice:read permission
     */
    getVoice(voiceId: string): Promise<Voice>;
    /**
     * Get default voice settings for a voice
     *
     * Requires: voice:read permission
     */
    getVoiceSettings(voiceId: string): Promise<VoiceSettings>;
    /**
     * Update voice settings for a cloned voice
     *
     * Requires: voice:update permission
     */
    updateVoiceSettings(voiceId: string, settings: Partial<VoiceSettings>): Promise<VoiceSettings>;
    /**
     * Remove a cloned voice
     *
     * Requires: voice:remove permission (server-side RBAC enforced)
     */
    removeVoice(voiceId: string): Promise<void>;
    /**
     * Synthesize text to speech
     *
     * Requires: voice:synthesize permission
     */
    synthesize(request: SynthesizeRequest): Promise<SynthesisResult>;
    /**
     * Get synthesis job status
     *
     * Requires: voice:read permission
     */
    getSynthesis(synthesisId: string): Promise<SynthesisResult>;
    /**
     * List synthesis jobs
     *
     * Requires: voice:read permission
     */
    listSyntheses(params?: PaginationParams & {
        voice_id?: string;
        status?: 'pending' | 'processing' | 'ready' | 'failed';
    }): Promise<PaginatedResponse<SynthesisResult>>;
    /**
     * Synthesize speech and stream the audio
     *
     * Requires: voice:synthesize permission
     *
     * @returns ReadableStream of audio data
     */
    synthesizeStream(request: Omit<SynthesizeRequest, 'webhook_url'>): Promise<ReadableStream<Uint8Array>>;
    /**
     * Wait for synthesis to complete
     */
    waitForSynthesis(synthesisId: string, options?: {
        pollInterval?: number;
        timeout?: number;
        onProgress?: (synthesis: SynthesisResult) => void;
    }): Promise<SynthesisResult>;
    /**
     * Start voice cloning job
     *
     * Requires: voice:clone permission
     */
    cloneVoice(request: CloneVoiceRequest): Promise<VoiceCloneJob>;
    /**
     * Get voice clone job status
     *
     * Requires: voice:read permission
     */
    getCloneJob(jobId: string): Promise<VoiceCloneJob>;
    /**
     * List voice clone jobs
     *
     * Requires: voice:read permission
     */
    listCloneJobs(params?: PaginationParams & {
        status?: 'pending' | 'processing' | 'training' | 'ready' | 'failed';
    }): Promise<PaginatedResponse<VoiceCloneJob>>;
    /**
     * Cancel a voice clone job
     *
     * Requires: voice:clone permission
     */
    cancelCloneJob(jobId: string): Promise<VoiceCloneJob>;
    /**
     * Wait for voice cloning to complete
     */
    waitForClone(jobId: string, options?: {
        pollInterval?: number;
        timeout?: number;
        onProgress?: (job: VoiceCloneJob) => void;
    }): Promise<VoiceCloneJob>;
    /**
     * Estimate synthesis cost
     *
     * Requires: voice:read permission
     */
    estimateCost(text: string, voiceId: string): Promise<{
        characters: number;
        estimated_duration: number;
        estimated_cost: number;
        currency: string;
    }>;
    /**
     * Get supported languages
     *
     * Requires: voice:read permission
     */
    getSupportedLanguages(): Promise<Array<{
        code: string;
        name: string;
        locales: Array<{
            code: string;
            name: string;
        }>;
    }>>;
}
/**
 * Create a Voice API instance
 */
declare function createVoiceAPI(client: WaveClient): VoiceAPI;

export { CloneVoiceRequest, ListVoicesParams, SynthesisResult, SynthesizeRequest, Voice, VoiceAPI, VoiceCloneJob, VoiceSettings, createVoiceAPI };
