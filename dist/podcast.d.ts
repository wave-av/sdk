import { WaveClient } from './client.js';
import { Timestamps, PaginationParams, PaginatedResponse } from './client-types.js';
import 'eventemitter3';
import './telemetry.js';

/**
 * WAVE SDK - Podcast API
 *
 * Podcast production, episode management, and distribution.
 */

type EpisodeStatus = "draft" | "processing" | "published" | "scheduled" | "failed";
type DistributionTarget = "spotify" | "apple" | "google" | "amazon" | "overcast";
interface Podcast extends Timestamps {
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
interface Episode extends Timestamps {
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
interface PodcastAnalytics {
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
interface PodcastDistribution {
    target: DistributionTarget;
    status: "connected" | "pending" | "error";
    url?: string;
}
interface CreatePodcastRequest {
    title: string;
    description: string;
    category: string;
    language?: string;
    explicit?: boolean;
    author?: string;
    email?: string;
}
interface CreateEpisodeRequest {
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
declare class PodcastAPI {
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
declare function createPodcastAPI(client: WaveClient): PodcastAPI;

export { type CreateEpisodeRequest, type CreatePodcastRequest, type DistributionTarget, type Episode, type EpisodeStatus, type Podcast, PodcastAPI, type PodcastAnalytics, type PodcastDistribution, createPodcastAPI };
