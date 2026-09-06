import { WaveClient } from './client.js';
import { PaginationParams, PaginatedResponse, Timestamps } from './client-types.js';
import 'eventemitter3';
import './telemetry.js';

/**
 * WAVE SDK - Signage API
 *
 * Digital signage display and playlist management.
 */

type DisplayStatus = "online" | "offline" | "playing" | "error";
interface Display extends Timestamps {
    id: string;
    organization_id: string;
    name: string;
    status: DisplayStatus;
    resolution: string;
    orientation: "landscape" | "portrait";
    location?: string;
    current_playlist_id?: string;
    ip_address?: string;
    version?: string;
    last_seen_at?: string;
}
interface Playlist extends Timestamps {
    id: string;
    organization_id: string;
    name: string;
    items: PlaylistItem[];
    loop: boolean;
    duration_seconds: number;
}
interface PlaylistItem {
    id: string;
    type: "image" | "video" | "stream" | "webpage" | "html";
    content_url: string;
    duration_seconds: number;
    transition?: string;
    sort_order: number;
}
interface ScheduleEntry {
    id: string;
    playlist_id: string;
    display_ids: string[];
    start_time: string;
    end_time: string;
    days_of_week: number[];
    recurring: boolean;
}
interface DisplayConfig {
    brightness?: number;
    volume?: number;
    auto_sleep?: boolean;
    sleep_start?: string;
    sleep_end?: string;
    rotation?: number;
}
interface ListDisplaysParams extends PaginationParams {
    status?: DisplayStatus;
    location?: string;
}
/**
 * Digital signage display, playlist, and schedule management.
 *
 * @example
 * ```typescript
 * const display = await wave.signage.registerDisplay({ name: "Lobby Screen" });
 * const playlist = await wave.signage.createPlaylist({ name: "Welcome", items: [...] });
 * await wave.signage.assignPlaylist(display.id, playlist.id);
 * ```
 */
declare class SignageAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    listDisplays(params?: ListDisplaysParams): Promise<PaginatedResponse<Display>>;
    getDisplay(displayId: string): Promise<Display>;
    registerDisplay(request: {
        name: string;
        location?: string;
    }): Promise<Display>;
    updateDisplay(displayId: string, updates: {
        name?: string;
        location?: string;
    }): Promise<Display>;
    removeDisplay(displayId: string): Promise<void>;
    createPlaylist(request: {
        name: string;
        items: Omit<PlaylistItem, "id">[];
        loop?: boolean;
    }): Promise<Playlist>;
    updatePlaylist(playlistId: string, updates: Partial<{
        name: string;
        items: Omit<PlaylistItem, "id">[];
        loop: boolean;
    }>): Promise<Playlist>;
    removePlaylist(playlistId: string): Promise<void>;
    listPlaylists(params?: PaginationParams): Promise<PaginatedResponse<Playlist>>;
    assignPlaylist(displayId: string, playlistId: string): Promise<void>;
    scheduleContent(request: Omit<ScheduleEntry, "id">): Promise<ScheduleEntry>;
    listSchedules(displayId?: string): Promise<ScheduleEntry[]>;
    removeSchedule(scheduleId: string): Promise<void>;
    configureDisplay(displayId: string, config: DisplayConfig): Promise<DisplayConfig>;
}
declare function createSignageAPI(client: WaveClient): SignageAPI;

export { type Display, type DisplayConfig, type DisplayStatus, type ListDisplaysParams, type Playlist, type PlaylistItem, type ScheduleEntry, SignageAPI, createSignageAPI };
