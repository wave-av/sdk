/**
 * WAVE SDK - Edge API
 *
 * Edge computing, CDN operations, and worker deployment.
 */
import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps } from "./client";
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
export declare class EdgeAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    listNodes(params?: ListEdgeNodesParams): Promise<PaginatedResponse<EdgeNode>>;
    getNode(nodeId: string): Promise<EdgeNode>;
    getNodeMetrics(nodeId: string): Promise<EdgeMetrics>;
    deployWorker(request: DeployWorkerRequest): Promise<EdgeWorker>;
    getWorker(workerId: string): Promise<EdgeWorker>;
    updateWorker(workerId: string, config: Partial<WorkerConfig>): Promise<EdgeWorker>;
    removeWorker(workerId: string): Promise<void>;
    listWorkers(params?: PaginationParams): Promise<PaginatedResponse<EdgeWorker>>;
    startWorker(workerId: string): Promise<EdgeWorker>;
    stopWorker(workerId: string): Promise<EdgeWorker>;
    listPops(): Promise<CDNPop[]>;
    purgeCache(patterns: string[]): Promise<{
        purged: number;
    }>;
    getRoutingRules(): Promise<RoutingRule[]>;
    setRoutingRule(rule: Omit<RoutingRule, "id">): Promise<RoutingRule>;
    removeRoutingRule(ruleId: string): Promise<void>;
    getLatencyMap(): Promise<Record<string, number>>;
}
export declare function createEdgeAPI(client: WaveClient): EdgeAPI;
