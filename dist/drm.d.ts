/**
 * WAVE SDK - DRM API
 *
 * Digital Rights Management: content protection with Widevine, FairPlay, and PlayReady.
 */
import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps } from "./client";
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
export declare class DrmAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /** Create a DRM policy. */
    createPolicy(request: CreatePolicyRequest): Promise<DRMPolicy>;
    /** Get a DRM policy by ID. */
    getPolicy(policyId: string): Promise<DRMPolicy>;
    /** List DRM policies. */
    listPolicies(params?: ListPoliciesParams): Promise<PaginatedResponse<DRMPolicy>>;
    /** Update a DRM policy. */
    updatePolicy(policyId: string, updates: Partial<CreatePolicyRequest>): Promise<DRMPolicy>;
    /** Delete a DRM policy. */
    removePolicy(policyId: string): Promise<void>;
    /** Get a DRM certificate for a provider. */
    getCertificate(provider: DRMProvider): Promise<DRMCertificate>;
    /** Issue a license for an asset. */
    issueLicense(assetId: string, policyId: string, deviceId?: string): Promise<DRMLicense>;
    /** Revoke a license. */
    revokeLicense(licenseId: string): Promise<DRMLicense>;
    /** List licenses for an asset or user. */
    listLicenses(params?: {
        asset_id?: string;
        user_id?: string;
        status?: LicenseStatus;
    } & PaginationParams): Promise<PaginatedResponse<DRMLicense>>;
}
export declare function createDrmAPI(client: WaveClient): DrmAPI;
