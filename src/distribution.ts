/**
 * WAVE SDK - Distribution API
 *
 * Social media distribution, simulcasting, and scheduled publishing.
 */

import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps } from "./client";

export type DestinationType =
  | "youtube"
  | "twitch"
  | "facebook"
  | "linkedin"
  | "twitter"
  | "tiktok"
  | "instagram"
  | "custom_rtmp";
export type DestinationStatus = "connected" | "disconnected" | "streaming" | "error";

export interface Destination extends Timestamps {
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
export interface SimulcastSession {
  id: string;
  stream_id: string;
  destinations: SimulcastTarget[];
  status: "active" | "stopped";
  started_at: string;
  stopped_at?: string;
}
export interface SimulcastTarget {
  destination_id: string;
  status: "streaming" | "error" | "pending";
  viewer_count?: number;
  error_message?: string;
}
export interface ScheduledPost extends Timestamps {
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
export interface AddDestinationRequest {
  name: string;
  type: DestinationType;
  rtmp_url?: string;
  stream_key_ref?: string;
  platform_channel_id?: string;
  auto_start?: boolean;
}
export interface ListDestinationsParams extends PaginationParams {
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
export class DistributionAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/distribution";
  constructor(client: WaveClient) {
    this.client = client;
  }

  async listDestinations(params?: ListDestinationsParams): Promise<PaginatedResponse<Destination>> {
    return this.client.get<PaginatedResponse<Destination>>(`${this.basePath}/destinations`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async getDestination(destId: string): Promise<Destination> {
    return this.client.get<Destination>(`${this.basePath}/destinations/${destId}`);
  }
  async addDestination(request: AddDestinationRequest): Promise<Destination> {
    return this.client.post<Destination>(`${this.basePath}/destinations`, request);
  }
  async updateDestination(
    destId: string,
    updates: Partial<AddDestinationRequest>,
  ): Promise<Destination> {
    return this.client.patch<Destination>(`${this.basePath}/destinations/${destId}`, updates);
  }
  async removeDestination(destId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/destinations/${destId}`);
  }
  async startSimulcast(streamId: string, destinationIds: string[]): Promise<SimulcastSession> {
    return this.client.post<SimulcastSession>(`${this.basePath}/simulcast`, {
      stream_id: streamId,
      destination_ids: destinationIds,
    });
  }
  async stopSimulcast(streamId: string): Promise<SimulcastSession> {
    return this.client.post<SimulcastSession>(`${this.basePath}/simulcast/stop`, {
      stream_id: streamId,
    });
  }
  async getSimulcastStatus(streamId: string): Promise<SimulcastSession> {
    return this.client.get<SimulcastSession>(`${this.basePath}/simulcast/${streamId}`);
  }
  async schedulePost(request: {
    title: string;
    description: string;
    platforms: DestinationType[];
    media_url: string;
    scheduled_at: string;
  }): Promise<ScheduledPost> {
    return this.client.post<ScheduledPost>(`${this.basePath}/posts`, request);
  }
  async listScheduledPosts(params?: PaginationParams): Promise<PaginatedResponse<ScheduledPost>> {
    return this.client.get<PaginatedResponse<ScheduledPost>>(`${this.basePath}/posts`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async cancelScheduledPost(postId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/posts/${postId}`);
  }
  async getDistributionAnalytics(params?: {
    time_range?: string;
    destination_id?: string;
  }): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(`${this.basePath}/analytics`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
}

export function createDistributionAPI(client: WaveClient): DistributionAPI {
  return new DistributionAPI(client);
}
