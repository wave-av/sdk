/**
 * WAVE SDK - Edge API
 *
 * Edge computing, CDN operations, and worker deployment.
 */

import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps } from "./client";

// ============================================================================
// Types
// ============================================================================

export type EdgeNodeStatus = "active" | "draining" | "offline" | "updating";

export interface EdgeNode extends Timestamps {
  id: string;
  name: string;
  region: string;
  provider: "cloudflare" | "aws" | "gcp";
  status: EdgeNodeStatus;
  latency_ms: number;
  capacity_percent: number;
  active_workers: number;
  bandwidth_mbps: number;
}

export interface EdgeWorker extends Timestamps {
  id: string;
  name: string;
  node_id: string;
  status: "deployed" | "running" | "stopped" | "error";
  runtime: "v8" | "wasm" | "node";
  script_size_bytes: number;
  memory_limit_mb: number;
  invocations: number;
  last_deployed_at: string;
}

export interface WorkerConfig {
  name: string;
  runtime: "v8" | "wasm" | "node";
  script: string;
  routes: string[];
  environment?: Record<string, string>;
  memory_limit_mb?: number;
}

export interface EdgeMetrics {
  node_id: string;
  requests_per_second: number;
  bandwidth_mbps: number;
  cache_hit_ratio: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  error_rate: number;
  timestamp: string;
}

export interface CDNPop {
  id: string;
  location: string;
  provider: string;
  status: "active" | "draining" | "offline";
  cache_size_gb: number;
  hit_ratio: number;
  connections: number;
}

export interface RoutingRule {
  id: string;
  pattern: string;
  target: string;
  priority: number;
  weight?: number;
  region_affinity?: string;
}

export interface DeployWorkerRequest {
  name: string;
  runtime: "v8" | "wasm" | "node";
  script: string;
  routes: string[];
  environment?: Record<string, string>;
  memory_limit_mb?: number;
}

export interface ListEdgeNodesParams extends PaginationParams {
  region?: string;
  status?: EdgeNodeStatus;
  provider?: string;
}

// ============================================================================
// Edge API
// ============================================================================

/**
 * Edge computing, CDN operations, and worker deployment.
 *
 * @example
 * ```typescript
 * const nodes = await wave.edge.listNodes({ region: 'us-west' });
 * await wave.edge.deployWorker({ name: 'transform', runtime: 'v8', script: '...', routes: ['/api/*'] });
 * await wave.edge.purgeCache(['/assets/*']);
 * ```
 */
export class EdgeAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/edge";

  constructor(client: WaveClient) {
    this.client = client;
  }

  async listNodes(params?: ListEdgeNodesParams): Promise<PaginatedResponse<EdgeNode>> {
    return this.client.get<PaginatedResponse<EdgeNode>>(`${this.basePath}/nodes`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async getNode(nodeId: string): Promise<EdgeNode> {
    return this.client.get<EdgeNode>(`${this.basePath}/nodes/${nodeId}`);
  }

  async getNodeMetrics(nodeId: string): Promise<EdgeMetrics> {
    return this.client.get<EdgeMetrics>(`${this.basePath}/nodes/${nodeId}/metrics`);
  }

  async deployWorker(request: DeployWorkerRequest): Promise<EdgeWorker> {
    return this.client.post<EdgeWorker>(`${this.basePath}/workers`, request);
  }

  async getWorker(workerId: string): Promise<EdgeWorker> {
    return this.client.get<EdgeWorker>(`${this.basePath}/workers/${workerId}`);
  }

  async updateWorker(workerId: string, config: Partial<WorkerConfig>): Promise<EdgeWorker> {
    return this.client.patch<EdgeWorker>(`${this.basePath}/workers/${workerId}`, config);
  }

  async removeWorker(workerId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/workers/${workerId}`);
  }

  async listWorkers(params?: PaginationParams): Promise<PaginatedResponse<EdgeWorker>> {
    return this.client.get<PaginatedResponse<EdgeWorker>>(`${this.basePath}/workers`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async startWorker(workerId: string): Promise<EdgeWorker> {
    return this.client.post<EdgeWorker>(`${this.basePath}/workers/${workerId}/start`);
  }

  async stopWorker(workerId: string): Promise<EdgeWorker> {
    return this.client.post<EdgeWorker>(`${this.basePath}/workers/${workerId}/stop`);
  }

  async listPops(): Promise<CDNPop[]> {
    return this.client.get<CDNPop[]>(`${this.basePath}/pops`);
  }

  async purgeCache(patterns: string[]): Promise<{ purged: number }> {
    return this.client.post<{ purged: number }>(`${this.basePath}/cache/purge`, { patterns });
  }

  async getRoutingRules(): Promise<RoutingRule[]> {
    return this.client.get<RoutingRule[]>(`${this.basePath}/routing`);
  }

  async setRoutingRule(rule: Omit<RoutingRule, "id">): Promise<RoutingRule> {
    return this.client.post<RoutingRule>(`${this.basePath}/routing`, rule);
  }

  async removeRoutingRule(ruleId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/routing/${ruleId}`);
  }

  async getLatencyMap(): Promise<Record<string, number>> {
    return this.client.get<Record<string, number>>(`${this.basePath}/latency-map`);
  }
}

export function createEdgeAPI(client: WaveClient): EdgeAPI {
  return new EdgeAPI(client);
}
