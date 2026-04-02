/**
 * WAVE SDK - Signage API
 *
 * Digital signage display and playlist management.
 */

import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps } from "./client";

export type DisplayStatus = "online" | "offline" | "playing" | "error";

export interface Display extends Timestamps {
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
export interface Playlist extends Timestamps {
  id: string;
  organization_id: string;
  name: string;
  items: PlaylistItem[];
  loop: boolean;
  duration_seconds: number;
}
export interface PlaylistItem {
  id: string;
  type: "image" | "video" | "stream" | "webpage" | "html";
  content_url: string;
  duration_seconds: number;
  transition?: string;
  sort_order: number;
}
export interface ScheduleEntry {
  id: string;
  playlist_id: string;
  display_ids: string[];
  start_time: string;
  end_time: string;
  days_of_week: number[];
  recurring: boolean;
}
export interface DisplayConfig {
  brightness?: number;
  volume?: number;
  auto_sleep?: boolean;
  sleep_start?: string;
  sleep_end?: string;
  rotation?: number;
}
export interface ListDisplaysParams extends PaginationParams {
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
export class SignageAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/signage";
  constructor(client: WaveClient) {
    this.client = client;
  }

  async listDisplays(params?: ListDisplaysParams): Promise<PaginatedResponse<Display>> {
    return this.client.get<PaginatedResponse<Display>>(`${this.basePath}/displays`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async getDisplay(displayId: string): Promise<Display> {
    return this.client.get<Display>(`${this.basePath}/displays/${displayId}`);
  }
  async registerDisplay(request: { name: string; location?: string }): Promise<Display> {
    return this.client.post<Display>(`${this.basePath}/displays`, request);
  }
  async updateDisplay(
    displayId: string,
    updates: { name?: string; location?: string },
  ): Promise<Display> {
    return this.client.patch<Display>(`${this.basePath}/displays/${displayId}`, updates);
  }
  async removeDisplay(displayId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/displays/${displayId}`);
  }
  async createPlaylist(request: {
    name: string;
    items: Omit<PlaylistItem, "id">[];
    loop?: boolean;
  }): Promise<Playlist> {
    return this.client.post<Playlist>(`${this.basePath}/playlists`, request);
  }
  async updatePlaylist(
    playlistId: string,
    updates: Partial<{ name: string; items: Omit<PlaylistItem, "id">[]; loop: boolean }>,
  ): Promise<Playlist> {
    return this.client.patch<Playlist>(`${this.basePath}/playlists/${playlistId}`, updates);
  }
  async removePlaylist(playlistId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/playlists/${playlistId}`);
  }
  async listPlaylists(params?: PaginationParams): Promise<PaginatedResponse<Playlist>> {
    return this.client.get<PaginatedResponse<Playlist>>(`${this.basePath}/playlists`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async assignPlaylist(displayId: string, playlistId: string): Promise<void> {
    await this.client.post(`${this.basePath}/displays/${displayId}/playlist`, {
      playlist_id: playlistId,
    });
  }
  async scheduleContent(request: Omit<ScheduleEntry, "id">): Promise<ScheduleEntry> {
    return this.client.post<ScheduleEntry>(`${this.basePath}/schedules`, request);
  }
  async listSchedules(displayId?: string): Promise<ScheduleEntry[]> {
    const path = displayId
      ? `${this.basePath}/displays/${displayId}/schedules`
      : `${this.basePath}/schedules`;
    return this.client.get<ScheduleEntry[]>(path);
  }
  async removeSchedule(scheduleId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/schedules/${scheduleId}`);
  }
  async configureDisplay(displayId: string, config: DisplayConfig): Promise<DisplayConfig> {
    return this.client.patch<DisplayConfig>(
      `${this.basePath}/displays/${displayId}/config`,
      config,
    );
  }
}

export function createSignageAPI(client: WaveClient): SignageAPI {
  return new SignageAPI(client);
}
