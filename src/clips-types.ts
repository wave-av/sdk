import type { Timestamps, Metadata } from './client-types';

export type ClipStatus =
  | 'pending'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'deleted';
export type ClipExportFormat =
  | 'mp4'
  | 'webm'
  | 'mov'
  | 'gif'
  | 'mp3'
  | 'wav';
export type ClipQualityPreset =
  | 'low'
  | 'medium'
  | 'high'
  | 'source'
  | 'custom';
/**
 * Clip source reference.
 *
 * Live contract (verified against api.wave.online): `source` is the recording
 * id as a string, with `in`/`out` relative time strings (`"5s"`, `"2m"`).
 * The older `{ type, id, start_time, end_time }` object shape is rejected by
 * the gateway on create.
 */
export interface ClipSource {
  /** Recording id the clip is cut from */
  id: string;
  /** Start offset as a time string, e.g. `"5s"` or `"2m"` */
  in: string;
  /** End offset as a time string, e.g. `"10s"` or `"1m30s"` */
  out: string;
}
export interface Clip extends Timestamps {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  source: ClipSource;
  status: ClipStatus;
  duration: number;
  thumbnail_url?: string;
  playback_url?: string;
  download_url?: string;
  file_size?: number;
  width?: number;
  height?: number;
  frame_rate?: number;
  bitrate?: number;
  codec?: string;
  tags?: string[];
  metadata?: Metadata;
  error?: string;
}
