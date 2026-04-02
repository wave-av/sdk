/**
 * WAVE SDK - Fleet API
 *
 * Device fleet management for Desktop Nodes. Register, monitor, and control
 * nodes in your organization's streaming infrastructure.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type {
  WaveClient,
  PaginationParams,
  PaginatedResponse,
  Timestamps,
  Metadata,
} from "./client";

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Fleet API
// ============================================================================

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
export class FleetAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/fleet/nodes";

  constructor(client: WaveClient) {
    this.client = client;
  }

  /**
   * List fleet nodes with optional filters
   *
   * Requires: fleet:read permission
   */
  async list(params?: ListNodesParams): Promise<PaginatedResponse<FleetNode>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      limit: params?.limit,
      offset: params?.offset,
      cursor: params?.cursor,
      status: params?.status,
      health: params?.health,
      os: params?.os,
      order_by: params?.order_by,
      order: params?.order,
    };

    return this.client.get<PaginatedResponse<FleetNode>>(this.basePath, {
      params: queryParams,
    });
  }

  /**
   * Get a node by ID
   *
   * Requires: fleet:read permission
   */
  async get(nodeId: string): Promise<FleetNode> {
    return this.client.get<FleetNode>(`${this.basePath}/${nodeId}`);
  }

  /**
   * Register a new node
   *
   * Requires: fleet:create permission
   */
  async register(request: RegisterNodeRequest): Promise<FleetNode> {
    return this.client.post<FleetNode>(this.basePath, request);
  }

  /**
   * Update a node
   *
   * Requires: fleet:update permission
   */
  async update(nodeId: string, request: UpdateNodeRequest): Promise<FleetNode> {
    return this.client.patch<FleetNode>(`${this.basePath}/${nodeId}`, request);
  }

  /**
   * Deregister (remove) a node
   *
   * Requires: fleet:remove permission (server-side RBAC enforced)
   */
  async deregister(nodeId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${nodeId}`);
  }

  /**
   * Get current health status of a node
   *
   * Requires: fleet:read permission
   */
  async getHealth(
    nodeId: string,
  ): Promise<{ health: NodeHealth; details: Record<string, unknown> }> {
    return this.client.get<{ health: NodeHealth; details: Record<string, unknown> }>(
      `${this.basePath}/${nodeId}/health`,
    );
  }

  /**
   * List devices attached to a node
   *
   * Requires: fleet:read permission
   */
  async listDevices(nodeId: string): Promise<NodeDevice[]> {
    return this.client.get<NodeDevice[]>(`${this.basePath}/${nodeId}/devices`);
  }

  /**
   * Send a command to a node
   *
   * Requires: fleet:command permission
   */
  async sendCommand(
    nodeId: string,
    command: NodeCommand,
  ): Promise<{ command_id: string; status: string }> {
    return this.client.post<{ command_id: string; status: string }>(
      `${this.basePath}/${nodeId}/commands`,
      command,
    );
  }

  /**
   * Get current resource metrics for a node
   *
   * Requires: fleet:read permission
   */
  async getMetrics(nodeId: string): Promise<NodeMetrics> {
    return this.client.get<NodeMetrics>(`${this.basePath}/${nodeId}/metrics`);
  }

  /**
   * Wait for a node to come online
   */
  async waitForOnline(
    nodeId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (node: FleetNode) => void;
    },
  ): Promise<FleetNode> {
    const pollInterval = options?.pollInterval || 5000;
    const timeout = options?.timeout || 120000; // 2 minutes default
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const node = await this.get(nodeId);

      if (options?.onProgress) {
        options.onProgress(node);
      }

      if (node.status === "online") {
        return node;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Node ${nodeId} did not come online within ${timeout}ms`);
  }
}

/**
 * Create a Fleet API instance
 */
export function createFleetAPI(client: WaveClient): FleetAPI {
  return new FleetAPI(client);
}
