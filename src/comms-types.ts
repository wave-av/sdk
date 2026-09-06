/**
 * WAVE SDK - Comms Types
 *
 * Types for the comms tenant-onboarding surface (agent-mail E9.2):
 * POST /v1/comms/tenants creates an AgentMail pod for the tenant and mints a
 * pod-scoped key. The key VALUE is returned exactly once (AgentMail's
 * mint-once contract) — callers must store it; the gateway never keeps it.
 */

/** Request body for tenant onboarding. client_id maps 1:1 to the WAVE org. */
export interface CommsTenantRequest {
  /** The tenant's client id — must match /^[a-zA-Z0-9-]{1,64}$/. */
  client_id: string;
}

/** The minted tenant record (pod + scoped key, key value returned once). */
export interface CommsTenant {
  /** The WAVE org id the tenant was onboarded under. */
  org: string;
  /** Echo of the requested client_id. */
  client_id: string;
  /** The AgentMail pod id created/reused for this tenant. */
  pod_id: string;
  /** The pod-scoped API key VALUE — returned once, never stored by WAVE. */
  api_key: string;
  /** The key's id (for later rotation/revocation). */
  api_key_id: string;
}
