/**
 * WAVE SDK - Transcribe API types
 *
 * The shapes below match what the transcribe edge behind `api.wave.online/v1/transcribe` serves
 * (wave-av/wave-transcribe-edge, src/types.ts and src/jobs.ts). Types that belong only to methods
 * no backend serves stay exported, deprecated, so code that names them still compiles.
 */

import type { Metadata } from './client';

// ============================================================================
// Types
// ============================================================================

/**
 * Transcription status. The edge transcribes synchronously, so `create()` answers with a job that
 * is already `completed` (or `failed`).
 */
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/** Speech-to-text engine to ask for. `default` and `auto` let the edge choose. */
export type TranscriptionModel = 'default' | 'auto' | 'whisper' | 'deepgram' | 'elevenlabs';

/** The engine that actually transcribed (never `auto`). */
export type TranscriptionEngine = 'whisper' | 'deepgram' | 'elevenlabs';

/** One timed stretch of the transcript. Present when `speakerLabels` was requested. */
export interface TranscriptionSegment {
  /** Start, in seconds. */
  start: number;
  /** End, in seconds. */
  end: number;
  text: string;
  /** 0-based speaker index, when the engine labelled speakers. */
  speaker?: number;
}

/** One word with timing. Present when `wordTimestamps` was requested. */
export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
  speaker?: number;
}

/** A transcription job, as `create()`, `get()` and `list()` return it. */
export interface Transcription {
  id: string;
  /** The recording id or https media URL that was transcribed. */
  sourceId: string;
  sourceType: 'video' | 'audio';
  status: TranscriptionStatus;
  language?: string;
  /** The transcript, once `completed`. */
  text?: string;
  /** Media duration, in seconds. */
  duration?: number;
  wordCount?: number;
  confidence?: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  /** Why the job failed, when it did. */
  errorMessage?: string;
  engine?: TranscriptionEngine;
  /** Whether speaker labels were produced: `speakers`, `not_requested`, `unavailable` or `unsupported`. */
  diarization?: 'speakers' | 'not_requested' | 'unavailable' | 'unsupported';
  segments?: TranscriptionSegment[];
  words?: TranscriptionWord[];
}

/** Body of `create()`. */
export interface CreateTranscriptionRequest {
  /** A WAVE recording id, or an https URL to an audio or video file. */
  sourceId: string;
  sourceType: 'video' | 'audio';
  /** Spoken language (e.g. `en`). Detected when omitted. */
  language?: string;
  /** Label speakers and return `segments`. Default false. */
  speakerLabels?: boolean;
  /** Return per-word timing in `words`. Default false. */
  wordTimestamps?: boolean;
  /** Default true. */
  punctuation?: boolean;
  /** Default `default`. */
  model?: TranscriptionModel;
}

/** `list()` filters. */
export interface ListTranscriptionsParams {
  /** 1-based page. Default 1. */
  page?: number;
  /** Page size. Default 20. */
  perPage?: number;
  status?: TranscriptionStatus;
}

/** A page of transcriptions, as `list()` returns it. */
export interface TranscriptionList {
  data: Transcription[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

/** @deprecated Belongs to `getSpeakers()`, which no WAVE backend serves. Read `segments[].speaker`. */
export interface Speaker {
  id: number;
  label: string;
  segments_count: number;
  total_duration: number;
  confidence?: number;
}

/** @deprecated Belongs to `update()`, which no WAVE backend serves. */
export interface UpdateTranscriptionRequest {
  metadata?: Metadata;
}

/** @deprecated Belongs to `exportTranscription()`, which no WAVE backend serves. */
export type TranscriptExportFormat = 'txt' | 'json' | 'srt' | 'vtt' | 'docx' | 'pdf';
