/**
 * WAVE SDK - Clips API
 *
 * Create, manage, and export video clips from streams and recordings.
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
import type { ClipStatus, ClipExportFormat, ClipQualityPreset, ClipSource, Clip } from './clips-types';

// ============================================================================
// Types
// ============================================================================

/**
 * Clip status
 */

/**
 * Clip export format
 */

/**
 * Clip quality preset
 */

/**
 * Clip source reference
 */

/**
 * Clip object
 */

/**
 * Create clip request
 */
export interface CreateClipRequest {
  title: string;
  description?: string;
  source: ClipSource;
  quality?: ClipQualityPreset;
  format?: ClipExportFormat;
  tags?: string[];
  metadata?: Metadata;
  /** Enable AI-powered highlight detection */
  auto_highlights?: boolean;
  /** Webhook URL for status updates */
  webhook_url?: string;
}

/**
 * Update clip request
 */
export interface UpdateClipRequest {
  title?: string;
  description?: string;
  tags?: string[];
  metadata?: Metadata;
}

/**
 * List clips filters
 */
export interface ListClipsParams extends PaginationParams {
  status?: ClipStatus;
  source_type?: 'stream' | 'recording' | 'upload';
  source_id?: string;
  tags?: string[];
  created_after?: string;
  created_before?: string;
  order_by?: 'created_at' | 'duration' | 'title';
  order?: 'asc' | 'desc';
}

/**
 * Export clip request
 */
export interface ExportClipRequest {
  format: ClipExportFormat;
  quality?: ClipQualityPreset;
  /** Custom resolution (e.g., "1920x1080") */
  resolution?: string;
  /** Custom bitrate in kbps */
  bitrate?: number;
  /** Include audio */
  include_audio?: boolean;
  /** Add watermark */
  watermark?: {
    image_url: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number;
    scale?: number;
  };
}

/**
 * Export job status
 */
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

/**
 * Auto-highlight result
 */
export interface ClipHighlight {
  start_time: number;
  end_time: number;
  score: number;
  type: 'action' | 'speech' | 'emotion' | 'custom';
  label?: string;
}

// ============================================================================
// Clips API
// ============================================================================

/**
 * Clips API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave/sdk';
 * import { ClipsAPI } from '@wave/sdk/clips';
 *
 * const client = new WaveClient({ apiKey: 'your-api-key' });
 * const clips = new ClipsAPI(client);
 *
 * // Create a clip from a stream
 * const clip = await clips.create({
 *   title: 'Best Moment',
 *   source: {
 *     type: 'stream',
 *     id: 'stream_123',
 *     start_time: 120,
 *     end_time: 150,
 *   },
 * });
 *
 * // Wait for processing
 * const ready = await clips.waitForReady(clip.id);
 * console.log('Clip ready:', ready.playback_url);
 * ```
 */
export class ClipsAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/clips';

  constructor(client: WaveClient) {
    this.client = client;
  }

  /**
   * Create a new clip
   *
   * Requires: clips:create permission
   */
  async create(request: CreateClipRequest): Promise<Clip> {
    return this.client.post<Clip>(this.basePath, request);
  }

  /**
   * Get a clip by ID
   *
   * Requires: clips:read permission
   */
  async get(clipId: string): Promise<Clip> {
    return this.client.get<Clip>(`${this.basePath}/${clipId}`);
  }

  /**
   * Update a clip
   *
   * Requires: clips:update permission
   */
  async update(clipId: string, request: UpdateClipRequest): Promise<Clip> {
    return this.client.patch<Clip>(`${this.basePath}/${clipId}`, request);
  }

  /**
   * Remove a clip
   *
   * Requires: clips:remove permission (server-side RBAC enforced)
   */
  async remove(clipId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${clipId}`);
  }

  /**
   * List clips with optional filters
   *
   * Requires: clips:read permission
   */
  async list(params?: ListClipsParams): Promise<PaginatedResponse<Clip>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      limit: params?.limit,
      offset: params?.offset,
      cursor: params?.cursor,
      status: params?.status,
      source_type: params?.source_type,
      source_id: params?.source_id,
      created_after: params?.created_after,
      created_before: params?.created_before,
      order_by: params?.order_by,
      order: params?.order,
    };

    if (params?.tags?.length) {
      queryParams['tags'] = params.tags.join(',');
    }

    return this.client.get<PaginatedResponse<Clip>>(this.basePath, {
      params: queryParams,
    });
  }

  /**
   * Export a clip to a different format
   *
   * Requires: clips:export permission
   */
  async exportClip(clipId: string, request: ExportClipRequest): Promise<ClipExport> {
    return this.client.post<ClipExport>(
      `${this.basePath}/${clipId}/export`,
      request
    );
  }

  /**
   * Get export job status
   *
   * Requires: clips:read permission
   */
  async getExport(clipId: string, exportId: string): Promise<ClipExport> {
    return this.client.get<ClipExport>(
      `${this.basePath}/${clipId}/exports/${exportId}`
    );
  }

  /**
   * List all exports for a clip
   *
   * Requires: clips:read permission
   */
  async listExports(
    clipId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<ClipExport>> {
    return this.client.get<PaginatedResponse<ClipExport>>(
      `${this.basePath}/${clipId}/exports`,
      { params: params as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Detect highlights in source content
   *
   * Requires: clips:analyze permission
   */
  async detectHighlights(
    sourceType: 'stream' | 'recording',
    sourceId: string,
    options?: {
      types?: ('action' | 'speech' | 'emotion')[];
      min_score?: number;
      max_results?: number;
    }
  ): Promise<ClipHighlight[]> {
    return this.client.post<ClipHighlight[]>(
      `${this.basePath}/highlights/detect`,
      {
        source_type: sourceType,
        source_id: sourceId,
        ...options,
      }
    );
  }

  /**
   * Generate clips from detected highlights
   *
   * Requires: clips:create permission
   */
  async createFromHighlights(
    sourceType: 'stream' | 'recording',
    sourceId: string,
    options?: {
      min_score?: number;
      max_clips?: number;
      title_prefix?: string;
      tags?: string[];
    }
  ): Promise<Clip[]> {
    return this.client.post<Clip[]>(`${this.basePath}/highlights/create`, {
      source_type: sourceType,
      source_id: sourceId,
      ...options,
    });
  }

  /**
   * Wait for a clip to be ready
   */
  async waitForReady(
    clipId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (clip: Clip) => void;
    }
  ): Promise<Clip> {
    const pollInterval = options?.pollInterval || 2000;
    const timeout = options?.timeout || 300000; // 5 minutes default
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const clip = await this.get(clipId);

      if (options?.onProgress) {
        options.onProgress(clip);
      }

      if (clip.status === 'ready') {
        return clip;
      }

      if (clip.status === 'failed') {
        throw new Error(`Clip processing failed: ${clip.error || 'Unknown error'}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Clip processing timed out after ${timeout}ms`);
  }

  /**
   * Wait for an export to be ready
   */
  async waitForExport(
    clipId: string,
    exportId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
    }
  ): Promise<ClipExport> {
    const pollInterval = options?.pollInterval || 2000;
    const timeout = options?.timeout || 300000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const exportJob = await this.getExport(clipId, exportId);

      if (exportJob.status === 'ready') {
        return exportJob;
      }

      if (exportJob.status === 'failed') {
        throw new Error(`Export failed: ${exportJob.error || 'Unknown error'}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Export timed out after ${timeout}ms`);
  }
}

/**
 * Create a Clips API instance
 */
export function createClipsAPI(client: WaveClient): ClipsAPI {
  return new ClipsAPI(client);
}
