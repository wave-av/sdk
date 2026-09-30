import type { Timestamps } from './client-types';

/** @deprecated Belongs to a voice method no WAVE backend serves. */
export type VoiceModelType =
  | 'standard'
  | 'neural'
  | 'cloned'
  | 'professional';
/** @deprecated Belongs to a voice method no WAVE backend serves. */
export type VoiceGender = 'male' | 'female' | 'neutral';
export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac' | 'pcm';
/**
 * A voice from the catalog, as `listVoices()` and `cloneVoice()` return it (the voice edge behind
 * `api.wave.online/v1/voice`, wave-av/wave-voice-edge src/voices.ts).
 */
export interface Voice {
  /** Pass as `voice_id` to `synthesize()`. */
  id: string;
  name: string;
  description?: string;
  previewUrl?: string;
  /** e.g. `premade`, `cloned`. */
  category?: string;
  /** Free-form labels such as `accent`, `language`, `gender`. */
  labels?: Record<string, string>;
}
/**
 * Body of `synthesize()`. The voice edge reads `text` and `voice_id` (sent as `voiceId`); it does
 * not read the other fields today, so they do not change the audio.
 */
export interface SynthesizeRequest {
  /** Text to convert to speech */
  text: string;
  /** Voice ID to use (optional — the gateway picks a default when omitted) */
  voice_id?: string;
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
/** @deprecated Belongs to a voice method no WAVE backend serves. */
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
/** Body of `cloneVoice()`. */
export interface CloneVoiceRequest {
  /** Up to 100 characters. */
  name: string;
  /** 1-25 https URLs of clean speech samples. */
  audioFiles: string[];
  description?: string;
  labels?: Record<string, string>;
}
/** @deprecated Belongs to a voice method no WAVE backend serves. */
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
/** `listVoices()` filters, applied by the voice edge. */
export interface ListVoicesParams {
  /** Only voices in this category, e.g. `premade` or `cloned`. */
  category?: string;
  /** Only voices whose `language` (or `accent`) label matches. */
  language?: string;
}
/** @deprecated Belongs to a voice method no WAVE backend serves. */
export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}
