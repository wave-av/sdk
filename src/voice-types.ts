export type VoiceModelType =
  | 'standard'
  | 'neural'
  | 'cloned'
  | 'professional';
export type VoiceGender = 'male' | 'female' | 'neutral';
export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac' | 'pcm';
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
export interface ListVoicesParams extends PaginationParams {
  model_type?: VoiceModelType;
  gender?: VoiceGender;
  language?: string;
  is_public?: boolean;
  is_cloned?: boolean;
  tags?: string[];
}
export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}
