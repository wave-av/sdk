/**
 * WAVE SDK - Prism API
 *
 * Virtual Device Bridge - present network AV sources (NDI, ONVIF, VISCA, Dante)
 * as standard USB UVC/UAC devices to conferencing apps.
 */

import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps } from "./client";

// ============================================================================
// Types
// ============================================================================

export type VirtualDeviceType = "camera" | "microphone";
export type DeviceStatus = "created" | "starting" | "running" | "stopping" | "stopped" | "error";
export type SourceProtocol =
  | "ndi"
  | "onvif"
  | "srt"
  | "rtmp"
  | "webrtc"
  | "dante"
  | "cloudflare"
  | "livekit";
export type PTZProtocol = "ndi" | "onvif" | "visca" | "pelcod" | "cgi" | "livekit";

export interface VirtualDevice extends Timestamps {
  id: string;
  organization_id: string;
  name: string;
  type: VirtualDeviceType;
  status: DeviceStatus;
  source_protocol: SourceProtocol;
  source_endpoint: string;
  node_id: string;
  resolution?: { width: number; height: number };
  frame_rate?: number;
  health_score: number;
  ptz_enabled: boolean;
  ptz_protocol?: PTZProtocol;
}

export interface PresetMapping extends Timestamps {
  id: string;
  device_id: string;
  slot_number: number;
  preset_name: string;
  preset_token: string;
  protocol: PTZProtocol;
  transition_speed: number;
}

export interface DeviceHealth {
  device_id: string;
  status: "healthy" | "degraded" | "critical" | "offline";
  latency_ms: number;
  dropped_frames: number;
  fps: number;
  cpu_usage: number;
  source_connected: boolean;
  driver_connected: boolean;
}

export interface DiscoveredSource {
  id: string;
  name: string;
  protocol: string;
  address: string;
  supports_ptz: boolean;
  capabilities: string[];
  discovered_at: string;
}

export interface CreateDeviceRequest {
  name: string;
  type: VirtualDeviceType;
  source_protocol: SourceProtocol;
  source_endpoint: string;
  node_id: string;
  resolution?: { width: number; height: number };
  frame_rate?: number;
  ptz_enabled?: boolean;
  ptz_protocol?: PTZProtocol;
  metadata?: Record<string, unknown>;
}

export interface UpdateDeviceRequest {
  name?: string;
  source_endpoint?: string;
  resolution?: { width: number; height: number };
  frame_rate?: number;
  metadata?: Record<string, unknown>;
}

export interface SetPresetRequest {
  slot_number: number;
  preset_name: string;
  preset_token: string;
  protocol: PTZProtocol;
  transition_speed?: number;
}

export interface ListDevicesParams extends PaginationParams {
  type?: VirtualDeviceType;
  status?: DeviceStatus;
  node_id?: string;
  source_protocol?: SourceProtocol;
  order_by?: string;
  order?: "asc" | "desc";
}

// ============================================================================
// Prism API - Virtual Device Bridge
// ============================================================================

/**
 * Virtual Device Bridge - present network AV sources (NDI, ONVIF, VISCA, Dante)
 * as standard USB UVC/UAC devices to conferencing apps (Zoom, Teams, Meet).
 *
 * @example
 * ```typescript
 * const device = await wave.prism.createDevice({ name: 'PTZ Cam', type: 'camera', source_protocol: 'ndi', source_endpoint: 'NDI-1', node_id: 'node_abc' });
 * await wave.prism.startDevice(device.id);
 * await wave.prism.setPreset(device.id, { slot_number: 1, preset_name: 'Wide', preset_token: 'p1', protocol: 'ndi' });
 * const sources = await wave.prism.discoverSources({ protocols: ['ndi', 'onvif'] });
 * ```
 */
export class PrismAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/prism";

  constructor(client: WaveClient) {
    this.client = client;
  }

  async createDevice(request: CreateDeviceRequest): Promise<VirtualDevice> {
    return this.client.post<VirtualDevice>(`${this.basePath}/devices`, request);
  }

  async getDevice(deviceId: string): Promise<VirtualDevice> {
    return this.client.get<VirtualDevice>(`${this.basePath}/devices/${deviceId}`);
  }

  async updateDevice(deviceId: string, request: UpdateDeviceRequest): Promise<VirtualDevice> {
    return this.client.patch<VirtualDevice>(`${this.basePath}/devices/${deviceId}`, request);
  }

  async removeDevice(deviceId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/devices/${deviceId}`);
  }

  async listDevices(params?: ListDevicesParams): Promise<PaginatedResponse<VirtualDevice>> {
    return this.client.get<PaginatedResponse<VirtualDevice>>(`${this.basePath}/devices`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async startDevice(deviceId: string): Promise<VirtualDevice> {
    return this.client.post<VirtualDevice>(`${this.basePath}/devices/${deviceId}/start`);
  }

  async stopDevice(deviceId: string): Promise<VirtualDevice> {
    return this.client.post<VirtualDevice>(`${this.basePath}/devices/${deviceId}/stop`);
  }

  async getHealth(deviceId: string): Promise<DeviceHealth> {
    return this.client.get<DeviceHealth>(`${this.basePath}/devices/${deviceId}/health`);
  }

  async discoverSources(options?: {
    protocols?: string[];
    subnet?: string;
    timeout?: number;
  }): Promise<DiscoveredSource[]> {
    return this.client.post<DiscoveredSource[]>(`${this.basePath}/discovery`, options);
  }

  async getPresets(deviceId: string): Promise<PresetMapping[]> {
    return this.client.get<PresetMapping[]>(`${this.basePath}/devices/${deviceId}/presets`);
  }

  async setPreset(deviceId: string, request: SetPresetRequest): Promise<PresetMapping> {
    return this.client.put<PresetMapping>(`${this.basePath}/devices/${deviceId}/presets`, request);
  }

  async removePreset(deviceId: string, slotNumber: number): Promise<void> {
    await this.client.delete(`${this.basePath}/devices/${deviceId}/presets/${slotNumber}`);
  }

  async recallPreset(deviceId: string, slotNumber: number): Promise<void> {
    await this.client.post(`${this.basePath}/devices/${deviceId}/presets/${slotNumber}/recall`);
  }
}

export function createPrismAPI(client: WaveClient): PrismAPI {
  return new PrismAPI(client);
}
