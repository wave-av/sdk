import type { Timestamps } from './client-types';

/*
 * Clip types. The shapes below match what the clip engine behind `api.wave.online/v1/clips`
 * actually serves (wave-av/wave-clip-engine, src/types.ts and src/index.ts). The engine produces a
 * clip synchronously, so a stored clip is already `completed` when `create()` returns.
 */

/** Lifecycle status of a clip record. The engine stores every clip it produced as `completed`. */
export type ClipStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** Output quality lane. Sets the entitlement check and the default output dimensions. */
export type ClipQuality = '720p' | '1080p' | '4k';

/** What the engine produces for one clip. Default `['mp4']`; `frame` is one JPEG still at `in`. */
export type ClipOutputFormat = 'mp4' | 'spritesheet' | 'm4a' | 'frame';

/**
 * Export formats of the unserved `exportClip()` surface.
 * @deprecated No WAVE backend serves clip exports; `create()` returns the produced assets directly.
 */
export type ClipExportFormat = 'mp4' | 'webm' | 'mov' | 'gif' | 'mp3' | 'wav';

/**
 * Quality presets of the unserved `exportClip()` surface.
 * @deprecated Use `ClipQuality` (`'720p' | '1080p' | '4k'`), the lanes the clip engine accepts.
 */
export type ClipQualityPreset = 'low' | 'medium' | 'high' | 'source' | 'custom';

/**
 * @deprecated The clip engine takes the recording id as `CreateClipRequest.source` with top-level
 * `in` / `out` time strings, and a stored `Clip` carries `videoId`, `startTime` and `endTime`.
 */
export interface ClipSource {
  /** Recording id the clip is cut from */
  id: string;
  /** Start offset as a time string, e.g. `"5s"` or `"2m"` */
  in: string;
  /** End offset as a time string, e.g. `"10s"` or `"1m30s"` */
  out: string;
}

/** A stored clip: what `get()`, `update()` and `list()` return, and `create()` returns as `clip`. */
export interface Clip {
  id: string;
  /** The recording the clip was cut from. */
  videoId: string;
  /** Start offset into the recording, in seconds. */
  startTime: number;
  /** End offset into the recording, in seconds. */
  endTime: number;
  /** Clip length, in seconds. */
  duration: number;
  title: string | null;
  description: string | null;
  category: string | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  status: ClipStatus;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

/** One file the engine produced for a clip. */
export interface ClipAsset {
  kind: 'clip' | 'spritesheet' | 'audio' | 'frame';
  /** Storage key, prefixed by the owning organization. */
  key: string;
  contentType: string;
  /** Delivery URL: plain for a public clip, signed for a private one. Null when delivery is off. */
  url: string | null;
}

/** What `create()` returns: the produced assets plus the stored `Clip` record. */
export interface ClipCreateResult {
  ok: true;
  /** Same value as `clip.id`. */
  clipId: string;
  /** The organization the clip and its assets belong to. */
  org: string;
  visibility: 'public' | 'private';
  /** The recording id the clip was cut from. */
  source: string;
  /** Start offset as a time string, e.g. `"2m"`. */
  in: string;
  /** Output duration as a time string, e.g. `"30s"`. */
  duration: string;
  quality: ClipQuality;
  assets: ClipAsset[];
  clip: Clip;
}

/** A page of clips, as `list()` returns it. */
export interface ClipList {
  data: Clip[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

/** Body of `detect()`: find the moments in a recording worth clipping. */
export interface ClipDetectRequest {
  /** The recording to analyse. */
  videoId: string;
  /** Shortest candidate, in seconds. */
  minDuration?: number;
  /** Longest candidate, in seconds. */
  maxDuration?: number;
  /** Accepted and stored; the engine does not filter by category yet. */
  categories?: string[];
  /** 0 (strictest, fewest candidates) to 1 (loosest, most candidates). Default 0.5. */
  sensitivity?: number;
  /** Cap on the number of candidates returned. */
  maxClips?: number;
}

/** One candidate moment. Pass `in` and `duration` straight to `create()` to cut it. */
export interface ClipCandidate {
  /** Start of the window as a time string, e.g. `"40s"`. */
  in: string;
  /** Window length as a time string, e.g. `"20s"`. */
  duration: string;
  /** Combined 0-1 salience score. */
  score: number;
  /** Transcript text covering the window. */
  transcript: string;
}

/** What `detect()` returns. Detection runs synchronously, so `results` is already filled. */
export interface ClipDetectionJob {
  id: string;
  status: ClipStatus;
  progress: number;
  createdAt: string;
  results: ClipCandidate[];
}

/** @deprecated Shape of the unserved `exportClip()` surface. */
export interface ClipExport extends Timestamps {
  id: string;
  clip_id: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  format: ClipExportFormat;
  download_url?: string;
  file_size?: number;
  expires_at?: string;
  error?: string;
}
