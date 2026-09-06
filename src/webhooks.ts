/**
 * WAVE SDK - Webhooks API
 *
 * E9.3 tenant-webhook registration: POST /v1/comms/webhooks on the wave-mail-edge (internal-secret
 * gated — a control-plane action). Registered inboxes receive HMAC-signed fan-out deliveries
 * (x-wave-webhook-sig) for every verified AgentMail event on that inbox.
 *
 * NOTE: the endpoint lives on the MAIL-EDGE origin, not the gateway — construct the client with
 * `baseUrl` pointed at it (default prod origin below).
 */

import type { WaveClient } from "./client";

export interface TenantWebhookRegisterRequest {
  /** The inbox email to fan out from. */
  inbox: string;
  /** The tenant's https webhook URL. */
  url: string;
  /** The HMAC signing secret shared with the tenant (min 32 chars). */
  secret: string;
}

export interface TenantWebhookRegisterResult {
  ok: boolean;
  inbox: string;
}

/** Webhooks API — tenant webhook registration (E9.3). */
export class WebhooksAPI {
  private readonly client: WaveClient;
  constructor(client: WaveClient) {
    this.client = client;
  }

  /**
   * Register a tenant webhook for an inbox. The bearer is the WAVE_INTERNAL_SECRET — pass it as the
   * client's API key; the SDK never stores it beyond the configured client.
   */
  async registerTenantWebhook(request: TenantWebhookRegisterRequest): Promise<TenantWebhookRegisterResult> {
    return this.client.post<TenantWebhookRegisterResult>("/v1/comms/webhooks", request);
  }
}

export function createWebhooksAPI(client: WaveClient): WebhooksAPI {
  return new WebhooksAPI(client);
}
