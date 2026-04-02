/**
 * WAVE SDK - Marketplace API
 *
 * Template, plugin, and asset marketplace.
 */

import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps } from "./client";

export type ItemType = "template" | "plugin" | "graphic" | "transition" | "audio_effect" | "theme";
export type ItemStatus = "draft" | "review" | "published" | "rejected" | "deprecated";

export interface MarketplaceItem extends Timestamps {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  status: ItemStatus;
  author_id: string;
  author_name: string;
  version: string;
  price_cents: number;
  downloads: number;
  rating: number;
  rating_count: number;
  preview_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  category: string;
}

export interface InstalledItem {
  id: string;
  item_id: string;
  organization_id: string;
  version: string;
  installed_at: string;
  auto_update: boolean;
}
export interface Review extends Timestamps {
  id: string;
  item_id: string;
  user_id: string;
  rating: number;
  comment: string;
}

export interface ListItemsParams extends PaginationParams {
  type?: ItemType;
  category?: string;
  min_rating?: number;
  max_price?: number;
  search?: string;
  order_by?: string;
  order?: "asc" | "desc";
}
export interface PublishRequest {
  name: string;
  description: string;
  type: ItemType;
  price_cents?: number;
  tags?: string[];
  category: string;
  file_url: string;
  preview_url?: string;
  thumbnail_url?: string;
}

/**
 * Template, plugin, and asset marketplace for browsing, installing, and publishing.
 *
 * @example
 * ```typescript
 * const items = await wave.marketplace.list({ type: "template", category: "overlays" });
 * await wave.marketplace.install(items.data[0].id);
 * ```
 */
export class MarketplaceAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/marketplace";
  constructor(client: WaveClient) {
    this.client = client;
  }

  async list(params?: ListItemsParams): Promise<PaginatedResponse<MarketplaceItem>> {
    return this.client.get<PaginatedResponse<MarketplaceItem>>(this.basePath, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async get(itemId: string): Promise<MarketplaceItem> {
    return this.client.get<MarketplaceItem>(`${this.basePath}/${itemId}`);
  }
  async install(itemId: string): Promise<InstalledItem> {
    return this.client.post<InstalledItem>(`${this.basePath}/${itemId}/install`);
  }
  async uninstall(itemId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${itemId}/install`);
  }
  async listInstalled(params?: PaginationParams): Promise<PaginatedResponse<InstalledItem>> {
    return this.client.get<PaginatedResponse<InstalledItem>>(`${this.basePath}/installed`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async publish(request: PublishRequest): Promise<MarketplaceItem> {
    return this.client.post<MarketplaceItem>(this.basePath, request);
  }
  async update(itemId: string, updates: Partial<PublishRequest>): Promise<MarketplaceItem> {
    return this.client.patch<MarketplaceItem>(`${this.basePath}/${itemId}`, updates);
  }
  async deprecate(itemId: string): Promise<void> {
    await this.client.post(`${this.basePath}/${itemId}/deprecate`);
  }
  async getReviews(itemId: string, params?: PaginationParams): Promise<PaginatedResponse<Review>> {
    return this.client.get<PaginatedResponse<Review>>(`${this.basePath}/${itemId}/reviews`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async addReview(itemId: string, review: { rating: number; comment: string }): Promise<Review> {
    return this.client.post<Review>(`${this.basePath}/${itemId}/reviews`, review);
  }
  async search(
    query: string,
    params?: ListItemsParams,
  ): Promise<PaginatedResponse<MarketplaceItem>> {
    return this.client.get<PaginatedResponse<MarketplaceItem>>(`${this.basePath}/search`, {
      params: { q: query, ...params } as Record<string, string | number | boolean | undefined>,
    });
  }
}

export function createMarketplaceAPI(client: WaveClient): MarketplaceAPI {
  return new MarketplaceAPI(client);
}
