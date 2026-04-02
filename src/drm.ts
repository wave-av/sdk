/**
 * WAVE SDK - DRM API
 *
 * Digital Rights Management: content protection with Widevine, FairPlay, and PlayReady.
 */

import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps } from "./client";

// ============================================================================
// Types
// ============================================================================

export type DRMProvider = "widevine" | "fairplay" | "playready";
export type LicenseStatus = "active" | "expired" | "revoked";

export interface DRMPolicy extends Timestamps {
  id: string;
  organization_id: string;
  name: string;
  providers: DRMProvider[];
  allow_offline: boolean;
  offline_duration_seconds?: number;
  max_devices: number;
  output_protection: "none" | "hdcp_1" | "hdcp_2";
  security_level: "sw" | "hw";
  persistent_license: boolean;
}

export interface DRMLicense extends Timestamps {
  id: string;
  policy_id: string;
  asset_id: string;
  user_id: string;
  provider: DRMProvider;
  status: LicenseStatus;
  device_id?: string;
  expires_at?: string;
  playback_count: number;
}

export interface DRMCertificate {
  provider: DRMProvider;
  certificate: string;
  expires_at: string;
}

export interface CreatePolicyRequest {
  name: string;
  providers: DRMProvider[];
  allow_offline?: boolean;
  offline_duration_seconds?: number;
  max_devices?: number;
  output_protection?: "none" | "hdcp_1" | "hdcp_2";
  security_level?: "sw" | "hw";
  persistent_license?: boolean;
}

export interface ListPoliciesParams extends PaginationParams {
  provider?: DRMProvider;
}

// ============================================================================
// DRM API
// ============================================================================

/**
 * Digital Rights Management for content protection with Widevine, FairPlay, and PlayReady.
 *
 * @example
 * ```typescript
 * const policy = await wave.drm.createPolicy({ name: 'Premium', providers: ['widevine', 'fairplay'], max_devices: 3 });
 * const cert = await wave.drm.getCertificate('fairplay');
 * const license = await wave.drm.issueLicense(assetId, policyId);
 * ```
 */
export class DrmAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/drm";

  constructor(client: WaveClient) {
    this.client = client;
  }

  /** Create a DRM policy. */
  async createPolicy(request: CreatePolicyRequest): Promise<DRMPolicy> {
    return this.client.post<DRMPolicy>(`${this.basePath}/policies`, request);
  }

  /** Get a DRM policy by ID. */
  async getPolicy(policyId: string): Promise<DRMPolicy> {
    return this.client.get<DRMPolicy>(`${this.basePath}/policies/${policyId}`);
  }

  /** List DRM policies. */
  async listPolicies(params?: ListPoliciesParams): Promise<PaginatedResponse<DRMPolicy>> {
    return this.client.get<PaginatedResponse<DRMPolicy>>(`${this.basePath}/policies`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  /** Update a DRM policy. */
  async updatePolicy(policyId: string, updates: Partial<CreatePolicyRequest>): Promise<DRMPolicy> {
    return this.client.patch<DRMPolicy>(`${this.basePath}/policies/${policyId}`, updates);
  }

  /** Delete a DRM policy. */
  async removePolicy(policyId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/policies/${policyId}`);
  }

  /** Get a DRM certificate for a provider. */
  async getCertificate(provider: DRMProvider): Promise<DRMCertificate> {
    return this.client.get<DRMCertificate>(`${this.basePath}/certificate/${provider}`);
  }

  /** Issue a license for an asset. */
  async issueLicense(assetId: string, policyId: string, deviceId?: string): Promise<DRMLicense> {
    return this.client.post<DRMLicense>(`${this.basePath}/license`, {
      asset_id: assetId,
      policy_id: policyId,
      device_id: deviceId,
    });
  }

  /** Revoke a license. */
  async revokeLicense(licenseId: string): Promise<DRMLicense> {
    return this.client.post<DRMLicense>(`${this.basePath}/license/${licenseId}/revoke`);
  }

  /** List licenses for an asset or user. */
  async listLicenses(
    params?: { asset_id?: string; user_id?: string; status?: LicenseStatus } & PaginationParams,
  ): Promise<PaginatedResponse<DRMLicense>> {
    return this.client.get<PaginatedResponse<DRMLicense>>(`${this.basePath}/licenses`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
}

export function createDrmAPI(client: WaveClient): DrmAPI {
  return new DrmAPI(client);
}
