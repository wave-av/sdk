import { WaveClient } from './client.mjs';
import { PaginationParams, PaginatedResponse, Timestamps } from './client-types.mjs';
import 'eventemitter3';
import './telemetry.mjs';

/**
 * WAVE SDK - Mesh API
 *
 * Multi-region infrastructure failover. Manage regions, peers, failover
 * policies, and replication across your global streaming infrastructure.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

/**
 * Region operational status
 */
type RegionStatus = "active" | "standby" | "draining" | "offline";
/**
 * Failover strategy
 */
type FailoverStrategy = "automatic" | "manual" | "weighted";
/**
 * Mesh region
 */
interface MeshRegion extends Timestamps {
    id: string;
    name: string;
    provider: "aws" | "gcp" | "cloudflare" | "custom";
    location: string;
    status: RegionStatus;
    latency_ms: number;
    capacity_percent: number;
    stream_count: number;
    viewer_count: number;
    is_primary: boolean;
}
/**
 * Mesh peer connection between regions
 */
interface MeshPeer {
    id: string;
    region_id: string;
    endpoint: string;
    status: "connected" | "disconnected" | "syncing";
    last_sync_at: string;
    replication_lag_ms: number;
}
/**
 * Failover policy
 */
interface FailoverPolicy extends Timestamps {
    id: string;
    organization_id: string;
    name: string;
    strategy: FailoverStrategy;
    primary_region: string;
    fallback_regions: string[];
    health_check_interval_ms: number;
    failover_threshold: number;
    auto_failback: boolean;
}
/**
 * Failover event record
 */
interface FailoverEvent {
    id: string;
    policy_id: string;
    type: "failover" | "failback" | "manual_switch";
    from_region: string;
    to_region: string;
    reason: string;
    duration_ms: number;
    timestamp: string;
}
/**
 * Replication status between two regions
 */
interface ReplicationStatus {
    source_region: string;
    target_region: string;
    status: "synced" | "lagging" | "stale";
    lag_ms: number;
    last_sync_at: string;
}
/**
 * Full mesh topology snapshot
 */
interface MeshTopology {
    regions: MeshRegion[];
    peers: MeshPeer[];
    policies: FailoverPolicy[];
}
/**
 * Create a failover policy
 */
interface CreatePolicyRequest {
    name: string;
    strategy: FailoverStrategy;
    primary_region: string;
    fallback_regions: string[];
    health_check_interval_ms?: number;
    failover_threshold?: number;
    auto_failback?: boolean;
}
/**
 * List regions filters
 */
interface ListRegionsParams extends PaginationParams {
    status?: RegionStatus;
    provider?: "aws" | "gcp" | "cloudflare" | "custom";
}
/**
 * Mesh API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave/sdk';
 * import { MeshAPI } from '@wave/sdk/mesh';
 *
 * const client = new WaveClient({ apiKey: 'your-api-key' });
 * const mesh = new MeshAPI(client);
 *
 * // Get the full mesh topology
 * const topology = await mesh.getTopology();
 * console.log('Regions:', topology.regions.length);
 *
 * // Create a failover policy
 * const policy = await mesh.createPolicy({
 *   name: 'US West Failover',
 *   strategy: 'automatic',
 *   primary_region: 'us-west-2',
 *   fallback_regions: ['us-east-1', 'eu-west-1'],
 *   failover_threshold: 3,
 *   auto_failback: true,
 * });
 *
 * // Trigger manual failover
 * await mesh.triggerFailover(policy.id, 'us-east-1');
 * ```
 */
declare class MeshAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * List mesh regions with optional filters
     *
     * Requires: mesh:read permission
     */
    listRegions(params?: ListRegionsParams): Promise<PaginatedResponse<MeshRegion>>;
    /**
     * Get a region by ID
     *
     * Requires: mesh:read permission
     */
    getRegion(regionId: string): Promise<MeshRegion>;
    /**
     * Get health details for a region
     *
     * Requires: mesh:read permission
     */
    getRegionHealth(regionId: string): Promise<{
        status: RegionStatus;
        latency_ms: number;
        details: Record<string, unknown>;
    }>;
    /**
     * List mesh peers, optionally filtered by region
     *
     * Requires: mesh:read permission
     */
    listPeers(regionId?: string): Promise<MeshPeer[]>;
    /**
     * Add a peer to a region
     *
     * Requires: mesh:create permission
     */
    addPeer(regionId: string, endpoint: string): Promise<MeshPeer>;
    /**
     * Remove a peer
     *
     * Requires: mesh:remove permission (server-side RBAC enforced)
     */
    removePeer(peerId: string): Promise<void>;
    /**
     * Create a failover policy
     *
     * Requires: mesh:create permission
     */
    createPolicy(request: CreatePolicyRequest): Promise<FailoverPolicy>;
    /**
     * Update a failover policy
     *
     * Requires: mesh:update permission
     */
    updatePolicy(policyId: string, updates: Partial<CreatePolicyRequest>): Promise<FailoverPolicy>;
    /**
     * Remove a failover policy
     *
     * Requires: mesh:remove permission (server-side RBAC enforced)
     */
    removePolicy(policyId: string): Promise<void>;
    /**
     * List failover policies
     *
     * Requires: mesh:read permission
     */
    listPolicies(params?: PaginationParams): Promise<PaginatedResponse<FailoverPolicy>>;
    /**
     * Trigger a manual failover to a target region
     *
     * Requires: mesh:failover permission
     */
    triggerFailover(policyId: string, targetRegion: string): Promise<FailoverEvent>;
    /**
     * Get failover event history for a policy
     *
     * Requires: mesh:read permission
     */
    getFailoverHistory(policyId: string, params?: PaginationParams): Promise<PaginatedResponse<FailoverEvent>>;
    /**
     * Get replication status between regions
     *
     * Requires: mesh:read permission
     */
    getReplicationStatus(sourceRegion?: string, targetRegion?: string): Promise<ReplicationStatus[]>;
    /**
     * Get the full mesh topology (regions, peers, and policies)
     *
     * Requires: mesh:read permission
     */
    getTopology(): Promise<MeshTopology>;
}
/**
 * Create a Mesh API instance
 */
declare function createMeshAPI(client: WaveClient): MeshAPI;

export { type CreatePolicyRequest, type FailoverEvent, type FailoverPolicy, type FailoverStrategy, type ListRegionsParams, MeshAPI, type MeshPeer, type MeshRegion, type MeshTopology, type RegionStatus, type ReplicationStatus, createMeshAPI };
