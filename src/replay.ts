/**
 * WAVE Replay Engine SDK
 *
 * Mark POIs, review replays, export clips to social media.
 *
 * @packageDocumentation
 */

import type { WaveClient } from './client';

export interface ReplaySession {
  readonly id: string;
  readonly switcherId: string | null;
  readonly status: 'recording' | 'reviewing' | 'exporting' | 'completed';
  readonly startedAt: string;
  readonly endedAt: string | null;
}

export interface PointOfInterest {
  readonly id: string;
  readonly sessionId: string;
  readonly timecode: string;
  readonly label: string | null;
  readonly createdAt: string;
}

export interface ReplayClip {
  readonly id: string;
  readonly sessionId: string;
  readonly poiId: string;
  readonly speed: number;
  readonly exportStatus: 'pending' | 'processing' | 'completed' | 'failed';
  readonly exportUrls: Record<string, string>;
}

export interface ExportClipOptions {
  readonly poiId: string;
  readonly cameraId?: string;
  readonly speed?: number;
  readonly orientation?: 'landscape' | 'vertical';
  readonly stingerId?: string | null;
  readonly platforms?: readonly ('tiktok' | 'youtube_shorts' | 'instagram_reels' | 'twitter')[];
  readonly addCaptions?: boolean;
}

export class ReplayAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/replay';

  constructor(client: WaveClient) {
    this.client = client;
  }

  async createSession(switcherId?: string): Promise<ReplaySession> {
    return this.client.post<ReplaySession>(this.basePath, { switcherId });
  }

  async getSession(sessionId: string): Promise<ReplaySession> {
    return this.client.get<ReplaySession>(`${this.basePath}/${sessionId}`);
  }

  async markPOI(sessionId: string, label?: string): Promise<PointOfInterest> {
    return this.client.post<PointOfInterest>(`${this.basePath}/${sessionId}/poi`, { label });
  }

  async listPOIs(sessionId: string): Promise<PointOfInterest[]> {
    return this.client.get<PointOfInterest[]>(`${this.basePath}/${sessionId}/poi`);
  }

  async exportClip(sessionId: string, options: ExportClipOptions): Promise<ReplayClip> {
    return this.client.post<ReplayClip>(`${this.basePath}/${sessionId}/clips`, options);
  }

  async getClip(sessionId: string, clipId: string): Promise<ReplayClip> {
    return this.client.get<ReplayClip>(`${this.basePath}/${sessionId}/clips/${clipId}`);
  }

  async listClips(sessionId: string): Promise<ReplayClip[]> {
    return this.client.get<ReplayClip[]>(`${this.basePath}/${sessionId}/clips`);
  }
}

export function createReplayAPI(client: WaveClient): ReplayAPI {
  return new ReplayAPI(client);
}
