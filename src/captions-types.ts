import type { Timestamps, Metadata, PaginationParams } from './client-types';

/*
 * Caption types. The job types first (CaptionJob and friends) match what the captions edge behind
 * `api.wave.online/v1/captions` serves (wave-av/wave-captions-edge, src/types.ts and src/jobs.ts).
 * The track, cue, translation and burn-in types after them belong to methods no backend serves;
 * they stay exported, deprecated, so code that names them still compiles.
 */

/**
 * Lifecycle status of a caption job. The edge captions synchronously, so `create()` answers with
 * a job that is already `completed` (or `failed`).
 */
export type CaptionJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/** Formats `download()` renders a completed job in. */
export type CaptionDownloadFormat = 'srt' | 'vtt' | 'txt' | 'json';

/** Body of `create()`. */
export interface CreateCaptionJobRequest {
  /** The media to caption: a WAVE recording id, or an https URL to an audio or video file. */
  videoId: string;
  /** Spoken language, as a locale code (e.g. `en`, `es-MX`). Default `en`. */
  sourceLanguage?: string;
  /** Accepted and stored as locale codes. The edge produces only the source language today. */
  targetLanguages?: string[];
  /** Default `default`. */
  style?: string;
  /** Label speakers. Default false. */
  speakerLabels?: boolean;
}

/** A caption job, as `create()`, `get()` and `list()` return it. */
export interface CaptionJob {
  id: string;
  videoId: string;
  sourceLanguage: string;
  targetLanguages: string[];
  status: CaptionJobStatus;
  progress: number;
  /** Language code mapped to the path that downloads it, filled once the job is `completed`. */
  outputs: Record<string, string>;
  /** Why the job failed, when it did. */
  errorMessage?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

/** A page of caption jobs, as `list()` returns it. */
export interface CaptionJobList {
  data: CaptionJob[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

/** `list()` filters. */
export interface ListCaptionJobsParams {
  /** 1-based page. Default 1. */
  page?: number;
  /** Page size, 1-100. Default 20. */
  perPage?: number;
  /** Only jobs for this media. */
  videoId?: string;
  status?: CaptionJobStatus;
}

/** @deprecated Status of the unserved caption-track surface; caption jobs use `CaptionJobStatus`. */
export type CaptionStatus =
  | 'pending'
  | 'processing'
  | 'ready'
  | 'failed';
/** @deprecated Belongs to a caption method no WAVE backend serves. */
export type CaptionFormat =
  | 'srt'
  | 'vtt'
  | 'sbv'
  | 'ass'
  | 'ttml'
  | 'dfxp'
  | 'json';
/** @deprecated Belongs to a caption method no WAVE backend serves. */
export interface CaptionTrack extends Timestamps {
  id: string;
  organization_id: string;
  media_id: string;
  media_type: 'video' | 'audio' | 'stream';
  language: string;
  label: string;
  status: CaptionStatus;
  is_default: boolean;
  is_auto_generated: boolean;
  word_count?: number;
  duration?: number;
  accuracy_score?: number;
  url?: string;
  error?: string;
  metadata?: Metadata;
}
/** @deprecated Belongs to a caption method no WAVE backend serves. */
export interface CaptionCue {
  id: string;
  start_time: number;
  end_time: number;
  text: string;
  speaker?: string;
  confidence?: number;
  words?: CaptionWord[];
  style?: CaptionStyle;
}
/** @deprecated Belongs to a caption method no WAVE backend serves. */
export interface CaptionWord {
  word: string;
  start_time: number;
  end_time: number;
  confidence?: number;
}
/** @deprecated Belongs to a caption method no WAVE backend serves. */
export interface CaptionStyle {
  align?: 'left' | 'center' | 'right';
  vertical?: 'top' | 'middle' | 'bottom';
  line?: number;
  position?: number;
  size?: number;
  color?: string;
  background_color?: string;
  font_family?: string;
  font_weight?: 'normal' | 'bold';
  font_style?: 'normal' | 'italic';
}
/** @deprecated Belongs to a caption method no WAVE backend serves. */
export interface GenerateCaptionsRequest {
  media_id: string;
  media_type: 'video' | 'audio' | 'stream';
  language?: string;
  label?: string;
  /** Model to use for transcription */
  model?: 'standard' | 'enhanced' | 'whisper';
  /** Enable speaker diarization */
  speaker_diarization?: boolean;
  /** Number of expected speakers */
  speaker_count?: number;
  /** Filter profanity */
  profanity_filter?: boolean;
  /** Custom vocabulary */
  vocabulary?: string[];
  /** Enable word-level timing */
  word_timestamps?: boolean;
  /** Webhook URL for completion */
  webhook_url?: string;
  metadata?: Metadata;
}
/** @deprecated Belongs to a caption method no WAVE backend serves. */
export interface UploadCaptionsRequest {
  media_id: string;
  media_type: 'video' | 'audio' | 'stream';
  language: string;
  label: string;
  format: CaptionFormat;
  /** Caption file content */
  content: string;
  is_default?: boolean;
  metadata?: Metadata;
}
/** @deprecated Belongs to a caption method no WAVE backend serves. */
export interface UpdateCaptionsRequest {
  label?: string;
  is_default?: boolean;
  metadata?: Metadata;
}
/** @deprecated Belongs to a caption method no WAVE backend serves. */
export interface TranslateCaptionsRequest {
  target_language: string;
  target_label?: string;
  /** Use professional translation */
  professional?: boolean;
  /** Preserve speaker labels */
  preserve_speakers?: boolean;
  webhook_url?: string;
}
/** @deprecated Belongs to a caption method no WAVE backend serves. */
export interface BurnInCaptionsRequest {
  caption_track_id: string;
  style?: CaptionStyle;
  /** Output format */
  format?: 'mp4' | 'webm' | 'mov';
  /** Output quality */
  quality?: 'low' | 'medium' | 'high' | 'source';
  webhook_url?: string;
}
/** @deprecated Belongs to a caption method no WAVE backend serves. */
export interface BurnInJob extends Timestamps {
  id: string;
  media_id: string;
  caption_track_id: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  progress: number;
  output_url?: string;
  error?: string;
}
/** @deprecated Belongs to a caption method no WAVE backend serves. */
export interface ListCaptionsParams extends PaginationParams {
  media_id?: string;
  media_type?: 'video' | 'audio' | 'stream';
  language?: string;
  status?: CaptionStatus;
  is_auto_generated?: boolean;
}
