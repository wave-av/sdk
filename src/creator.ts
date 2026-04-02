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
export class CreatorAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/creators";
  constructor(client: WaveClient) {
    this.client = client;
  }

  async getProfile(creatorId: string): Promise<CreatorProfile> {
    return this.client.get<CreatorProfile>(`${this.basePath}/${creatorId}`);
  }
  async updateProfile(creatorId: string, request: UpdateProfileRequest): Promise<CreatorProfile> {
    return this.client.patch<CreatorProfile>(`${this.basePath}/${creatorId}`, request);
  }
  async getRevenue(
    creatorId: string,
    params?: { period?: string; start_date?: string; end_date?: string },
  ): Promise<RevenueReport> {
    return this.client.get<RevenueReport>(`${this.basePath}/${creatorId}/revenue`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async listSubscriptions(
    creatorId: string,
    params?: ListSubscriptionsParams,
  ): Promise<PaginatedResponse<Subscription>> {
    return this.client.get<PaginatedResponse<Subscription>>(
      `${this.basePath}/${creatorId}/subscriptions`,
      { params: params as Record<string, string | number | boolean | undefined> },
    );
  }
  async listTips(creatorId: string, params?: PaginationParams): Promise<PaginatedResponse<Tip>> {
    return this.client.get<PaginatedResponse<Tip>>(`${this.basePath}/${creatorId}/tips`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async createTipJar(
    creatorId: string,
    config: { enabled: boolean; min_amount_cents?: number; suggested_amounts?: number[] },
  ): Promise<{ enabled: boolean }> {
    return this.client.post<{ enabled: boolean }>(`${this.basePath}/${creatorId}/tip-jar`, config);
  }
  async listPayouts(
    creatorId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Payout>> {
    return this.client.get<PaginatedResponse<Payout>>(`${this.basePath}/${creatorId}/payouts`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async requestPayout(
    creatorId: string,
    request: { amount_cents: number; method: Payout["method"] },
  ): Promise<Payout> {
    return this.client.post<Payout>(`${this.basePath}/${creatorId}/payouts`, request);
  }
  async getAnalytics(
    creatorId: string,
    params?: { period?: string },
  ): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(`${this.basePath}/${creatorId}/analytics`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
}

export function createCreatorAPI(client: WaveClient): CreatorAPI {
  return new CreatorAPI(client);
}
