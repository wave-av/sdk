/**
 * WAVE SDK - Fleet API
 *
 * Device fleet management for Desktop Nodes. Register, monitor, and control
 * nodes in your organization's streaming infrastructure.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps, Metadata } from "./client";
/**
 * Node connection status
 */
export type NodeStatus = "online" | "offline" | "maintenance" | "updating";
/**
 * Node health state
 */
export type NodeHealth = "healthy" | "degraded" | "critical";
/**
 * Fleet node object
 */
export interface FleetNode extends Timestamps {
    id: string;
    organization_id: string;
    name: string;
    status: NodeStatus;
    health: NodeHealth;
    ip_address: string;
    version: string;
    os: string;
    cpu_usage: number;
    memory_usage: number;
    gpu_usage: number;
    device_count: number;
    last_seen_at: string;
    registered_at: string;
    tags: string[];
    metadata: Metadata;
}
/**
 * Device attached to a node
 */
export interface NodeDevice {
    id: string;
    node_id: string;
    name: string;
    type: "camera" | "microphone" | "display" | "capture_card" | "ndi_source";
    status: string;
    driver_version: string;
}
/**
 * Register a new node
 */
export interface RegisterNodeRequest {
    name: string;
    os: string;
    version: string;
    tags?: string[];
    metadata?: Metadata;
}
/**
 * Update a node
 */
export interface UpdateNodeRequest {
    name?: string;
    tags?: string[];
    metadata?: Metadata;
}
/**
 * List nodes filters
 */
export interface ListNodesParams extends PaginationParams {
    status?: NodeStatus;
    health?: NodeHealth;
    os?: string;
    order_by?: "name" | "created_at" | "last_seen_at" | "cpu_usage";
    order?: "asc" | "desc";
}
/**
 * Command to send to a node
 */
export interface NodeCommand {
    type: "restart" | "update" | "shutdown" | "scan_devices" | "clear_cache";
    params?: Record<string, unknown>;
}
/**
 * Node resource metrics snapshot
 */
export interface NodeMetrics {
    node_id: string;
    cpu_usage: number;
    memory_usage: number;
    gpu_usage: number;
    network_in_mbps: number;
    network_out_mbps: number;
    disk_usage: number;
    uptime_seconds: number;
    device_count: number;
    active_bridges: number;
    timestamp: string;
}
/**
 * Fleet API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave/sdk';
 * import { FleetAPI } from '@wave/sdk/fleet';
 *
 * const client = new WaveClient({ apiKey: 'your-api-key' });
 * const fleet = new FleetAPI(client);
 *
 * // List all online nodes
 * const nodes = await fleet.list({ status: 'online' });
 *
 * // Register a new node
 * const node = await fleet.register({
 *   name: 'Studio-Node-01',
 *   os: 'linux',
 *   version: '2.4.0',
 *   tags: ['studio-a'],
 * });
 *
 * // Send a command to scan for devices
 * await fleet.sendCommand(node.id, { type: 'scan_devices' });
 * ```
 */
export declare class FleetAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * List fleet nodes with optional filters
     *
     * Requires: fleet:read permission
     */
    list(params?: ListNodesParams): Promise<PaginatedResponse<FleetNode>>;
    /**
     * Get a node by ID
     *
     * Requires: fleet:read permission
     */
    get(nodeId: string): Promise<FleetNode>;
    /**
     * Register a new node
     *
     * Requires: fleet:create permission
     */
    register(request: RegisterNodeRequest): Promise<FleetNode>;
    /**
     * Update a node
     *
     * Requires: fleet:update permission
     */
    update(nodeId: string, request: UpdateNodeRequest): Promise<FleetNode>;
    /**
     * Deregister (remove) a node
     *
     * Requires: fleet:remove permission (server-side RBAC enforced)
     */
    deregister(nodeId: string): Promise<void>;
    /**
     * Get current health status of a node
     *
     * Requires: fleet:read permission
     */
    getHealth(nodeId: string): Promise<{
        health: NodeHealth;
        details: Record<string, unknown>;
    }>;
    /**
     * List devices attached to a node
     *
     * Requires: fleet:read permission
     */
    listDevices(nodeId: string): Promise<NodeDevice[]>;
    /**
     * Send a command to a node
     *
     * Requires: fleet:command permission
     */
    sendCommand(nodeId: string, command: NodeCommand): Promise<{
        command_id: string;
        status: string;
    }>;
    /**
     * Get current resource metrics for a node
     *
     * Requires: fleet:read permission
     */
    getMetrics(nodeId: string): Promise<NodeMetrics>;
    /**
     * Wait for a node to come online
     */
    waitForOnline(nodeId: string, options?: {
        pollInterval?: number;
        timeout?: number;
        onProgress?: (node: FleetNode) => void;
    }): Promise<FleetNode>;
}
/**
 * Create a Fleet API instance
 */
export declare function createFleetAPI(client: WaveClient): FleetAPI;
