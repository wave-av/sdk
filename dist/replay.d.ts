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
export declare class ReplayAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    createSession(switcherId?: string): Promise<ReplaySession>;
    getSession(sessionId: string): Promise<ReplaySession>;
    markPOI(sessionId: string, label?: string): Promise<PointOfInterest>;
    listPOIs(sessionId: string): Promise<PointOfInterest[]>;
    exportClip(sessionId: string, options: ExportClipOptions): Promise<ReplayClip>;
    getClip(sessionId: string, clipId: string): Promise<ReplayClip>;
    listClips(sessionId: string): Promise<ReplayClip[]>;
}
export declare function createReplayAPI(client: WaveClient): ReplayAPI;
