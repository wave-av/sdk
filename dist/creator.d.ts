/**
 * WAVE SDK - Creator API
 *
 * Creator monetization, subscriptions, tips, and payouts.
 */
import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps } from "./client";
export interface CreatorProfile extends Timestamps {
    id: string;
    user_id: string;
    organization_id: string;
    display_name: string;
    bio?: string;
    avatar_url?: string;
    banner_url?: string;
    subscriber_count: number;
    follower_count: number;
    total_revenue_cents: number;
    verified: boolean;
    tier: "starter" | "pro" | "partner";
}
export interface Subscription {
    id: string;
    creator_id: string;
    subscriber_id: string;
    tier: string;
    price_cents: number;
    status: "active" | "cancelled" | "past_due";
    current_period_start: string;
    current_period_end: string;
    created_at: string;
}
export interface Tip {
    id: string;
    creator_id: string;
    tipper_id: string;
    amount_cents: number;
    message?: string;
    stream_id?: string;
    created_at: string;
}
export interface Payout {
    id: string;
    creator_id: string;
    amount_cents: number;
    status: "pending" | "processing" | "completed" | "failed";
    method: "bank_transfer" | "paypal" | "stripe";
    requested_at: string;
    completed_at?: string;
}
export interface RevenueReport {
    creator_id: string;
    period: string;
    total_cents: number;
    subscription_cents: number;
    tip_cents: number;
    ad_cents: number;
    platform_fee_cents: number;
    net_cents: number;
}
export interface UpdateProfileRequest {
    display_name?: string;
    bio?: string;
    avatar_url?: string;
    banner_url?: string;
}
export interface ListSubscriptionsParams extends PaginationParams {
    status?: string;
    tier?: string;
}
/**
 * Creator monetization: profiles, subscriptions, tips, and payouts.
 *
 * @example
 * ```typescript
 * const profile = await wave.creator.getProfile(creatorId);
 * const revenue = await wave.creator.getRevenue(creatorId, { period: "month" });
 * await wave.creator.requestPayout(creatorId, { amount_cents: 10000, method: "stripe" });
 * ```
 */
export declare class CreatorAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    getProfile(creatorId: string): Promise<CreatorProfile>;
    updateProfile(creatorId: string, request: UpdateProfileRequest): Promise<CreatorProfile>;
    getRevenue(creatorId: string, params?: {
        period?: string;
        start_date?: string;
        end_date?: string;
    }): Promise<RevenueReport>;
    listSubscriptions(creatorId: string, params?: ListSubscriptionsParams): Promise<PaginatedResponse<Subscription>>;
    listTips(creatorId: string, params?: PaginationParams): Promise<PaginatedResponse<Tip>>;
    createTipJar(creatorId: string, config: {
        enabled: boolean;
        min_amount_cents?: number;
        suggested_amounts?: number[];
    }): Promise<{
        enabled: boolean;
    }>;
    listPayouts(creatorId: string, params?: PaginationParams): Promise<PaginatedResponse<Payout>>;
    requestPayout(creatorId: string, request: {
        amount_cents: number;
        method: Payout["method"];
    }): Promise<Payout>;
    getAnalytics(creatorId: string, params?: {
        period?: string;
    }): Promise<Record<string, unknown>>;
}
export declare function createCreatorAPI(client: WaveClient): CreatorAPI;
