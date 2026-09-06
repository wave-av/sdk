import { WaveClient } from './client.mjs';
import { Timestamps, PaginationParams, PaginatedResponse } from './client-types.mjs';
import 'eventemitter3';
import './telemetry.mjs';

/**
 * WAVE SDK - Distribution API
 *
 * Social media distribution, simulcasting, and scheduled publishing.
 */

type DestinationType = "youtube" | "twitch" | "facebook" | "linkedin" | "twitter" | "tiktok" | "instagram" | "custom_rtmp";
type DestinationStatus = "connected" | "disconnected" | "streaming" | "error";
interface Destination extends Timestamps {
    id: string;
    organization_id: string;
    name: string;
    type: DestinationType;
    status: DestinationStatus;
    rtmp_url?: string;
    stream_key_ref?: string;
    platform_channel_id?: string;
    auto_start: boolean;
}
interface SimulcastSession {
    id: string;
    stream_id: string;
    destinations: SimulcastTarget[];
    status: "active" | "stopped";
    started_at: string;
    stopped_at?: string;
}
interface SimulcastTarget {
    destination_id: string;
    status: "streaming" | "error" | "pending";
    viewer_count?: number;
    error_message?: string;
}
interface ScheduledPost extends Timestamps {
    id: string;
    organization_id: string;
    title: string;
    description: string;
    platforms: DestinationType[];
    media_url: string;
    scheduled_at: string;
    status: "scheduled" | "publishing" | "published" | "failed";
    published_urls?: Record<string, string>;
}
interface AddDestinationRequest {
    name: string;
    type: DestinationType;
    rtmp_url?: string;
    stream_key_ref?: string;
    platform_channel_id?: string;
    auto_start?: boolean;
}
interface ListDestinationsParams extends PaginationParams {
    type?: DestinationType;
    status?: DestinationStatus;
}
/**
 * Social media simulcasting and scheduled content publishing.
 *
 * @example
 * ```typescript
 * await wave.distribution.addDestination({ name: "YouTube", type: "youtube", auto_start: true });
 * await wave.distribution.startSimulcast(streamId, [destId1, destId2]);
 * ```
 */
declare class DistributionAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    listDestinations(params?: ListDestinationsParams): Promise<PaginatedResponse<Destination>>;
    getDestination(destId: string): Promise<Destination>;
    addDestination(request: AddDestinationRequest): Promise<Destination>;
    updateDestination(destId: string, updates: Partial<AddDestinationRequest>): Promise<Destination>;
    removeDestination(destId: string): Promise<void>;
    startSimulcast(streamId: string, destinationIds: string[]): Promise<SimulcastSession>;
    stopSimulcast(streamId: string): Promise<SimulcastSession>;
    getSimulcastStatus(streamId: string): Promise<SimulcastSession>;
    schedulePost(request: {
        title: string;
        description: string;
        platforms: DestinationType[];
        media_url: string;
        scheduled_at: string;
    }): Promise<ScheduledPost>;
    listScheduledPosts(params?: PaginationParams): Promise<PaginatedResponse<ScheduledPost>>;
    cancelScheduledPost(postId: string): Promise<void>;
    getDistributionAnalytics(params?: {
        time_range?: string;
        destination_id?: string;
    }): Promise<Record<string, unknown>>;
}
declare function createDistributionAPI(client: WaveClient): DistributionAPI;

export { type AddDestinationRequest, type Destination, type DestinationStatus, type DestinationType, DistributionAPI, type ListDestinationsParams, type ScheduledPost, type SimulcastSession, type SimulcastTarget, createDistributionAPI };
