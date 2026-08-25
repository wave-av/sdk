/**
 * WAVE SDK - Comms API
 *
 * Tenant onboarding for the multi-tenant comms plane (agent-mail E9.2):
 * create a pod + scoped key for a tenant. The gateway enforces the
 * comms:write scope, tenant-idempotence (one pod per client_id), and never
 * stores the key value at rest — the SDK returns it to the caller once.
 *
 * @example
 * ```typescript
 * const tenant = await wave.comms.createTenant({ client_id: "acme-org" });
 * console.log(tenant.pod_id);    // the tenant's pod
 * // store tenant.api_key immediately — it will not be returned again.
 * ```
 */

import type { WaveClient } from "./client";
import type { CommsTenantRequest, CommsTenant } from "./comms-types";

export type { CommsTenantRequest, CommsTenant } from "./comms-types";

/** Comms API — tenant onboarding (pods). */
export class CommsAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/comms";
  constructor(client: WaveClient) {
    this.client = client;
  }

  /**
   * Onboard a tenant: create/reuse the tenant's AgentMail pod and mint a
   * pod-scoped key. Idempotent by client_id (a repeat call reuses the pod and
   * mints a NEW key). Requires the comms:write scope on the API key.
   */
  async createTenant(request: CommsTenantRequest): Promise<CommsTenant> {
    return this.client.post<CommsTenant>(`${this.basePath}/tenants`, request);
  }

  /**
   * List the caller org's comms tenants (the registry read — E9.4). The API-key
   * VALUE is never on the read surface (mint-once contract). Requires comms:read.
   */
  async listTenants(): Promise<CommsTenantListResult> {
    return this.client.get<CommsTenantListResult>(`${this.basePath}/tenants`);
  }
}

export function createCommsAPI(client: WaveClient): CommsAPI {
  return new CommsAPI(client);
}

export interface CommsTenantListRow {
  client_id: string;
  pod_id: string;
  key_id: string;
  created_at: string;
}

export interface CommsTenantListResult {
  org: string;
  tenants: CommsTenantListRow[];
}
