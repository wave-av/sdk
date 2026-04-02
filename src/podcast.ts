/**
 * WAVE SDK - Podcast API
 *
 * Podcast production, episode management, and distribution.
 */

import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps } from "./client";

export type EpisodeStatus = "draft" | "processing" | "published" | "scheduled" | "failed";
export type DistributionTarget = "spotify" | "apple" | "google" | "amazon" | "overcast";

export interface Podcast extends Timestamps {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  cover_art_url?: string;
  rss_url?: string;
  category: string;
  language: string;
  explicit: boolean;
  author: string;
  email?: string;
  website?: string;
  subscriber_count: number;
  episode_count: number;
}
export interface Episode extends Timestamps {
  id: string;
  podcast_id: string;
  title: string;
  description: string;
  status: EpisodeStatus;
  audio_url?: string;
  duration_seconds: number;
  file_size_bytes: number;
  season_number?: number;
  episode_number?: number;
  published_at?: string;
  scheduled_at?: string;
  tags?: string[];
}
export interface PodcastAnalytics {
  podcast_id: string;
  total_downloads: number;
  unique_listeners: number;
  average_listen_duration: number;
  top_episodes: { episode_id: string; downloads: number }[];
  listener_geography: { country: string; count: number }[];
}
export interface PodcastDistribution {
  target: DistributionTarget;
  status: "connected" | "pending" | "error";
  url?: string;
}
export interface CreatePodcastRequest {
  title: string;
  description: string;
  category: string;
  language?: string;
  explicit?: boolean;
  author?: string;
  email?: string;
}
export interface CreateEpisodeRequest {
  podcast_id: string;
  title: string;
  description: string;
  audio_url?: string;
  season_number?: number;
  episode_number?: number;
  tags?: string[];
  scheduled_at?: string;
}

/**
 * Podcast production, episode management, RSS feeds, and distribution.
 *
 * @example
 * ```typescript
 * const podcast = await wave.podcast.create({ title: "My Show", description: "...", category: "Tech" });
 * await wave.podcast.createEpisode({ podcast_id: podcast.id, title: "Ep 1", description: "..." });
 * await wave.podcast.distribute(podcast.id, ["spotify", "apple"]);
 * ```
 */
export class PodcastAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/podcasts";
  constructor(client: WaveClient) {
    this.client = client;
  }

  async create(request: CreatePodcastRequest): Promise<Podcast> {
    return this.client.post<Podcast>(this.basePath, request);
  }
  async get(podcastId: string): Promise<Podcast> {
    return this.client.get<Podcast>(`${this.basePath}/${podcastId}`);
  }
  async update(podcastId: string, updates: Partial<CreatePodcastRequest>): Promise<Podcast> {
    return this.client.patch<Podcast>(`${this.basePath}/${podcastId}`, updates);
  }
  async remove(podcastId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${podcastId}`);
  }
  async list(params?: PaginationParams): Promise<PaginatedResponse<Podcast>> {
    return this.client.get<PaginatedResponse<Podcast>>(this.basePath, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async createEpisode(request: CreateEpisodeRequest): Promise<Episode> {
    return this.client.post<Episode>(`${this.basePath}/${request.podcast_id}/episodes`, request);
  }
  async getEpisode(episodeId: string): Promise<Episode> {
    return this.client.get<Episode>(`/v1/episodes/${episodeId}`);
  }
  async updateEpisode(episodeId: string, updates: Partial<CreateEpisodeRequest>): Promise<Episode> {
    return this.client.patch<Episode>(`/v1/episodes/${episodeId}`, updates);
  }
  async removeEpisode(episodeId: string): Promise<void> {
    await this.client.delete(`/v1/episodes/${episodeId}`);
  }
  async publishEpisode(episodeId: string): Promise<Episode> {
    return this.client.post<Episode>(`/v1/episodes/${episodeId}/publish`);
  }
  async listEpisodes(
    podcastId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Episode>> {
    return this.client.get<PaginatedResponse<Episode>>(`${this.basePath}/${podcastId}/episodes`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async getRSSFeed(podcastId: string): Promise<{ url: string; xml: string }> {
    return this.client.get<{ url: string; xml: string }>(`${this.basePath}/${podcastId}/rss`);
  }
  async getAnalytics(podcastId: string, params?: { period?: string }): Promise<PodcastAnalytics> {
    return this.client.get<PodcastAnalytics>(`${this.basePath}/${podcastId}/analytics`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async distribute(
    podcastId: string,
    targets: DistributionTarget[],
  ): Promise<PodcastDistribution[]> {
    return this.client.post<PodcastDistribution[]>(`${this.basePath}/${podcastId}/distribute`, {
      targets,
    });
  }
  async getDistributionStatus(podcastId: string): Promise<PodcastDistribution[]> {
    return this.client.get<PodcastDistribution[]>(`${this.basePath}/${podcastId}/distribution`);
  }
}

export function createPodcastAPI(client: WaveClient): PodcastAPI {
  return new PodcastAPI(client);
}
