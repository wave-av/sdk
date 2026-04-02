/**
 * WAVE SDK - Connect API
 *
 * Third-party integration and webhook management.
 */

import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps } from "./client";

export type IntegrationStatus = "active" | "inactive" | "error" | "pending_auth";
export type IntegrationType = "oauth" | "api_key" | "webhook" | "native";

export interface Integration extends Timestamps {
  id: string;
  organization_id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  scopes: string[];
  last_sync_at?: string;
  error_message?: string;
}
export interface WebhookEndpoint extends Timestamps {
  id: string;
  integration_id: string;
  url: string;
  events: string[];
  status: "active" | "inactive";
  secret: string;
}
export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  status: "success" | "failed" | "pending";
  status_code?: number;
  response_time_ms?: number;
  attempts: number;
  next_retry_at?: string;
  created_at: string;
}
export interface EnableIntegrationRequest {
  provider: string;
  type: IntegrationType;
  config?: Record<string, unknown>;
  scopes?: string[];
}
export interface CreateWebhookRequest {
  url: string;
  events: string[];
}
export interface ListIntegrationsParams extends PaginationParams {
  status?: IntegrationStatus;
  provider?: string;
  type?: IntegrationType;
}

/**
 * Third-party integration management with OAuth, API keys, and webhooks.
 *
 * @example
 * ```typescript
 * await wave.connect.enable({ provider: "slack", type: "oauth", scopes: ["chat:write"] });
 * const webhook = await wave.connect.createWebhook(integrationId, { url: "https://...", events: ["stream.started"] });
 * ```
 */
export class ConnectAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/integrations";
  constructor(client: WaveClient) {
    this.client = client;
  }

  async list(params?: ListIntegrationsParams): Promise<PaginatedResponse<Integration>> {
    return this.client.get<PaginatedResponse<Integration>>(this.basePath, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async get(integrationId: string): Promise<Integration> {
    return this.client.get<Integration>(`${this.basePath}/${integrationId}`);
  }
  async enable(request: EnableIntegrationRequest): Promise<Integration> {
    return this.client.post<Integration>(this.basePath, request);
  }
  async disable(integrationId: string): Promise<void> {
    await this.client.post(`${this.basePath}/${integrationId}/disable`);
  }
  async configure(integrationId: string, config: Record<string, unknown>): Promise<Integration> {
    return this.client.patch<Integration>(`${this.basePath}/${integrationId}`, { config });
  }
  async testConnection(
    integrationId: string,
  ): Promise<{ connected: boolean; latency_ms: number; error?: string }> {
    return this.client.post<{ connected: boolean; latency_ms: number; error?: string }>(
      `${this.basePath}/${integrationId}/test`,
    );
  }
  async listWebhooks(integrationId?: string): Promise<WebhookEndpoint[]> {
    const path = integrationId ? `${this.basePath}/${integrationId}/webhooks` : "/v1/webhooks";
    return this.client.get<WebhookEndpoint[]>(path);
  }
  async createWebhook(
    integrationId: string,
    request: CreateWebhookRequest,
  ): Promise<WebhookEndpoint> {
    return this.client.post<WebhookEndpoint>(`${this.basePath}/${integrationId}/webhooks`, request);
  }
  async updateWebhook(
    webhookId: string,
    updates: { url?: string; events?: string[] },
  ): Promise<WebhookEndpoint> {
    return this.client.patch<WebhookEndpoint>(`/v1/webhooks/${webhookId}`, updates);
  }
  async removeWebhook(webhookId: string): Promise<void> {
    await this.client.delete(`/v1/webhooks/${webhookId}`);
  }
  async listDeliveries(
    webhookId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<WebhookDelivery>> {
    return this.client.get<PaginatedResponse<WebhookDelivery>>(
      `/v1/webhooks/${webhookId}/deliveries`,
      { params: params as Record<string, string | number | boolean | undefined> },
    );
  }
  async retryDelivery(deliveryId: string): Promise<WebhookDelivery> {
    return this.client.post<WebhookDelivery>(`/v1/webhooks/deliveries/${deliveryId}/retry`);
  }
}

export function createConnectAPI(client: WaveClient): ConnectAPI {
  return new ConnectAPI(client);
}
