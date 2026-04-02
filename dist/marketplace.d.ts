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
export declare class MarketplaceAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    list(params?: ListItemsParams): Promise<PaginatedResponse<MarketplaceItem>>;
    get(itemId: string): Promise<MarketplaceItem>;
    install(itemId: string): Promise<InstalledItem>;
    uninstall(itemId: string): Promise<void>;
    listInstalled(params?: PaginationParams): Promise<PaginatedResponse<InstalledItem>>;
    publish(request: PublishRequest): Promise<MarketplaceItem>;
    update(itemId: string, updates: Partial<PublishRequest>): Promise<MarketplaceItem>;
    deprecate(itemId: string): Promise<void>;
    getReviews(itemId: string, params?: PaginationParams): Promise<PaginatedResponse<Review>>;
    addReview(itemId: string, review: {
        rating: number;
        comment: string;
    }): Promise<Review>;
    search(query: string, params?: ListItemsParams): Promise<PaginatedResponse<MarketplaceItem>>;
}
export declare function createMarketplaceAPI(client: WaveClient): MarketplaceAPI;
