/**
 * WAVE SDK - Voice API
 *
 * Text-to-speech and voice cloning capabilities.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps, Metadata } from './client';
/**
 * Voice model type
 */
export type VoiceModelType = 'standard' | 'neural' | 'cloned' | 'professional';
/**
 * Voice gender
 */
export type VoiceGender = 'male' | 'female' | 'neutral';
/**
 * Audio format
 */
export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac' | 'pcm';
/**
 * Voice definition
 */
export interface Voice extends Timestamps {
    id: string;
    organization_id?: string;
    name: string;
    description?: string;
    model_type: VoiceModelType;
    gender: VoiceGender;
    language: string;
    locale: string;
    preview_url?: string;
    is_public: boolean;
    is_cloned: boolean;
    tags?: string[];
    metadata?: Metadata;
}
/**
 * Speech synthesis request
 */
export interface SynthesizeRequest {
    /** Text to convert to speech */
    text: string;
    /** Voice ID to use */
    voice_id: string;
    /** Audio output format */
    format?: AudioFormat;
    /** Sample rate in Hz */
    sample_rate?: 16000 | 22050 | 24000 | 44100 | 48000;
    /** Speaking speed (0.5 - 2.0) */
    speed?: number;
    /** Pitch adjustment (-20 to 20 semitones) */
    pitch?: number;
    /** Volume level (0.0 - 1.0) */
    volume?: number;
    /** Enable SSML parsing */
    ssml?: boolean;
    /** Stability (0.0 - 1.0, lower = more expressive) */
    stability?: number;
    /** Similarity boost (0.0 - 1.0) */
    similarity_boost?: number;
    /** Style exaggeration (0.0 - 1.0) */
    style?: number;
    /** Webhook URL for completion notification */
    webhook_url?: string;
}
/**
 * Speech synthesis result
 */
export interface SynthesisResult extends Timestamps {
    id: string;
    organization_id: string;
    voice_id: string;
    status: 'pending' | 'processing' | 'ready' | 'failed';
    text: string;
    text_length: number;
    audio_url?: string;
    duration?: number;
    format: AudioFormat;
    sample_rate: number;
    file_size?: number;
    error?: string;
}
/**
 * Voice cloning request
 */
export interface CloneVoiceRequest {
    name: string;
    description?: string;
    /** Audio sample URLs (minimum 1 minute of clean audio) */
    sample_urls: string[];
    /** Optional text transcripts for samples */
    transcripts?: string[];
    /** Target language */
    language?: string;
    /** Voice gender */
    gender?: VoiceGender;
    /** Additional training options */
    options?: {
        /** Remove background noise from samples */
        denoise?: boolean;
        /** Number of training epochs */
        epochs?: number;
        /** Fine-tuning quality */
        quality?: 'standard' | 'high' | 'professional';
    };
    tags?: string[];
    metadata?: Metadata;
}
/**
 * Voice clone job
 */
export interface VoiceCloneJob extends Timestamps {
    id: string;
    organization_id: string;
    voice_id?: string;
    status: 'pending' | 'processing' | 'training' | 'ready' | 'failed';
    progress: number;
    name: string;
    sample_count: number;
    total_duration: number;
    error?: string;
}
/**
 * List voices params
 */
export interface ListVoicesParams extends PaginationParams {
    model_type?: VoiceModelType;
    gender?: VoiceGender;
    language?: string;
    is_public?: boolean;
    is_cloned?: boolean;
    tags?: string[];
}
/**
 * Voice settings
 */
export interface VoiceSettings {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
}
/**
 * Voice API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave/sdk';
 * import { VoiceAPI } from '@wave/sdk/voice';
 *
 * const client = new WaveClient({ apiKey: 'your-api-key' });
 * const voice = new VoiceAPI(client);
 *
 * // List available voices
 * const voices = await voice.listVoices({ language: 'en' });
 *
 * // Synthesize speech
 * const result = await voice.synthesize({
 *   text: 'Hello, welcome to WAVE!',
 *   voice_id: voices.data[0].id,
 * });
 *
 * // Wait for audio to be ready
 * const audio = await voice.waitForSynthesis(result.id);
 * console.log('Audio URL:', audio.audio_url);
 * ```
 */
export declare class VoiceAPI {
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
export declare function createVoiceAPI(client: WaveClient): VoiceAPI;
