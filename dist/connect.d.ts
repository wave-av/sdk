import { WaveClient } from './client.js';
import { PaginationParams, PaginatedResponse, Timestamps } from './client-types.js';
import 'eventemitter3';
import './telemetry.js';

/**
 * WAVE SDK - Connect API
 *
 * Third-party integration and webhook management.
 */

type IntegrationStatus = "active" | "inactive" | "error" | "pending_auth";
type IntegrationType = "oauth" | "api_key" | "webhook" | "native";
interface Integration extends Timestamps {
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
interface WebhookEndpoint extends Timestamps {
    id: string;
    integration_id: string;
    url: string;
    events: string[];
    status: "active" | "inactive";
    secret: string;
}
interface WebhookDelivery {
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
interface EnableIntegrationRequest {
    provider: string;
    type: IntegrationType;
    config?: Record<string, unknown>;
    scopes?: string[];
}
interface CreateWebhookRequest {
    url: string;
    events: string[];
}
interface ListIntegrationsParams extends PaginationParams {
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
declare class ConnectAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    list(params?: ListIntegrationsParams): Promise<PaginatedResponse<Integration>>;
    get(integrationId: string): Promise<Integration>;
    enable(request: EnableIntegrationRequest): Promise<Integration>;
    disable(integrationId: string): Promise<void>;
    configure(integrationId: string, config: Record<string, unknown>): Promise<Integration>;
    testConnection(integrationId: string): Promise<{
        connected: boolean;
        latency_ms: number;
        error?: string;
    }>;
    listWebhooks(integrationId?: string): Promise<WebhookEndpoint[]>;
    createWebhook(integrationId: string, request: CreateWebhookRequest): Promise<WebhookEndpoint>;
    updateWebhook(webhookId: string, updates: {
        url?: string;
        events?: string[];
    }): Promise<WebhookEndpoint>;
    removeWebhook(webhookId: string): Promise<void>;
    listDeliveries(webhookId: string, params?: PaginationParams): Promise<PaginatedResponse<WebhookDelivery>>;
    retryDelivery(deliveryId: string): Promise<WebhookDelivery>;
}
declare function createConnectAPI(client: WaveClient): ConnectAPI;

export { ConnectAPI, type CreateWebhookRequest, type EnableIntegrationRequest, type Integration, type IntegrationStatus, type IntegrationType, type ListIntegrationsParams, type WebhookDelivery, type WebhookEndpoint, createConnectAPI };
