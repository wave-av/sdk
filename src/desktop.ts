/**
 * WAVE SDK - Desktop API
 *
 * Desktop Node application management and device enumeration.
 */

import type { WaveClient } from "./client";

export interface DesktopNodeInfo {
  id: string;
  name: string;
  version: string;
  os: "macos" | "windows" | "linux";
  arch: "x64" | "arm64";
  cpu_model: string;
  memory_gb: number;
  gpu_model?: string;
  display_count: number;
  usb_devices: LocalUSBDevice[];
}
export interface LocalUSBDevice {
  id: string;
  name: string;
  type: "camera" | "microphone" | "capture_card" | "other";
  vendor_id: string;
  product_id: string;
  connected: boolean;
}
export interface NodePerformance {
  cpu_usage: number;
  memory_usage: number;
  gpu_usage?: number;
  disk_usage: number;
  network_in_mbps: number;
  network_out_mbps: number;
  active_bridges: number;
  uptime_seconds: number;
  temperature_celsius?: number;
}
export interface NodeLog {
  id: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  source: string;
  timestamp: string;
}
export type UpdateChannel = "stable" | "beta" | "canary";
export interface NodeConfig {
  auto_start: boolean;
  start_on_boot: boolean;
  update_channel: UpdateChannel;
  max_bridges: number;
  gpu_acceleration: boolean;
  log_level: string;
}

/**
 * Desktop Node application management, device enumeration, and updates.
 *
 * @example
 * ```typescript
 * const info = await wave.desktop.getInfo(nodeId);
 * const perf = await wave.desktop.getPerformance(nodeId);
 * await wave.desktop.installUpdate(nodeId);
 * ```
 */
export class DesktopAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/desktop";
  constructor(client: WaveClient) {
    this.client = client;
  }

  async getInfo(nodeId: string): Promise<DesktopNodeInfo> {
    return this.client.get<DesktopNodeInfo>(`${this.basePath}/nodes/${nodeId}`);
  }
  async getStatus(
    nodeId: string,
  ): Promise<{ status: string; uptime_seconds: number; active_bridges: number }> {
    return this.client.get<{ status: string; uptime_seconds: number; active_bridges: number }>(
      `${this.basePath}/nodes/${nodeId}/status`,
    );
  }
  async listDevices(nodeId: string): Promise<LocalUSBDevice[]> {
    return this.client.get<LocalUSBDevice[]>(`${this.basePath}/nodes/${nodeId}/devices`);
  }
  async configure(nodeId: string, config: Partial<NodeConfig>): Promise<NodeConfig> {
    return this.client.patch<NodeConfig>(`${this.basePath}/nodes/${nodeId}/config`, config);
  }
  async getConfig(nodeId: string): Promise<NodeConfig> {
    return this.client.get<NodeConfig>(`${this.basePath}/nodes/${nodeId}/config`);
  }
  async getLogs(
    nodeId: string,
    params?: { level?: string; since?: string; limit?: number },
  ): Promise<NodeLog[]> {
    return this.client.get<NodeLog[]>(`${this.basePath}/nodes/${nodeId}/logs`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async getPerformance(nodeId: string): Promise<NodePerformance> {
    return this.client.get<NodePerformance>(`${this.basePath}/nodes/${nodeId}/performance`);
  }
  async checkForUpdate(
    nodeId: string,
  ): Promise<{ available: boolean; version?: string; release_notes?: string }> {
    return this.client.get<{ available: boolean; version?: string; release_notes?: string }>(
      `${this.basePath}/nodes/${nodeId}/updates`,
    );
  }
  async installUpdate(nodeId: string): Promise<{ status: string }> {
    return this.client.post<{ status: string }>(`${this.basePath}/nodes/${nodeId}/updates/install`);
  }
  async restart(nodeId: string): Promise<{ status: string }> {
    return this.client.post<{ status: string }>(`${this.basePath}/nodes/${nodeId}/restart`);
  }
}

export function createDesktopAPI(client: WaveClient): DesktopAPI {
  return new DesktopAPI(client);
}
