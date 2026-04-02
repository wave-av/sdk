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
    top_episodes: {
        episode_id: string;
        downloads: number;
    }[];
    listener_geography: {
        country: string;
        count: number;
    }[];
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
export declare class PodcastAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    create(request: CreatePodcastRequest): Promise<Podcast>;
    get(podcastId: string): Promise<Podcast>;
    update(podcastId: string, updates: Partial<CreatePodcastRequest>): Promise<Podcast>;
    remove(podcastId: string): Promise<void>;
    list(params?: PaginationParams): Promise<PaginatedResponse<Podcast>>;
    createEpisode(request: CreateEpisodeRequest): Promise<Episode>;
    getEpisode(episodeId: string): Promise<Episode>;
    updateEpisode(episodeId: string, updates: Partial<CreateEpisodeRequest>): Promise<Episode>;
    removeEpisode(episodeId: string): Promise<void>;
    publishEpisode(episodeId: string): Promise<Episode>;
    listEpisodes(podcastId: string, params?: PaginationParams): Promise<PaginatedResponse<Episode>>;
    getRSSFeed(podcastId: string): Promise<{
        url: string;
        xml: string;
    }>;
    getAnalytics(podcastId: string, params?: {
        period?: string;
    }): Promise<PodcastAnalytics>;
    distribute(podcastId: string, targets: DistributionTarget[]): Promise<PodcastDistribution[]>;
    getDistributionStatus(podcastId: string): Promise<PodcastDistribution[]>;
}
export declare function createPodcastAPI(client: WaveClient): PodcastAPI;
