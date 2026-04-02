/**
 * WAVE SDK - USB API
 *
 * USB device relay, claiming, and capability management.
 */

import type { WaveClient, PaginationParams, PaginatedResponse } from "./client";

export type USBDeviceClass = "video" | "audio" | "hid" | "storage" | "composite";
export type USBDeviceStatus = "connected" | "claimed" | "in_use" | "disconnected";

export interface USBDevice {
  id: string;
  node_id: string;
  name: string;
  vendor_id: string;
  product_id: string;
  serial_number?: string;
  device_class: USBDeviceClass;
  status: USBDeviceStatus;
  manufacturer?: string;
  speed: "low" | "full" | "high" | "super";
  current_owner_id?: string;
  capabilities: string[];
  connected_at: string;
  updated_at: string;
}
export interface USBDeviceCapabilities {
  video_formats?: string[];
  audio_formats?: string[];
  max_resolution?: string;
  max_frame_rate?: number;
  supports_uvc: boolean;
  supports_uac: boolean;
}
export interface ClaimRequest {
  reason?: string;
  exclusive?: boolean;
}
export interface ListUSBDevicesParams extends PaginationParams {
  node_id?: string;
  device_class?: USBDeviceClass;
  status?: USBDeviceStatus;
}

/**
 * USB device relay: claim, release, and manage USB devices across nodes.
 *
 * @example
 * ```typescript
 * const devices = await wave.usb.list({ device_class: "video" });
 * await wave.usb.claim(devices.data[0].id);
 * const caps = await wave.usb.getCapabilities(deviceId);
 * ```
 */
export class UsbAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/usb";
  constructor(client: WaveClient) {
    this.client = client;
  }

  async list(params?: ListUSBDevicesParams): Promise<PaginatedResponse<USBDevice>> {
    return this.client.get<PaginatedResponse<USBDevice>>(`${this.basePath}/devices`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async get(deviceId: string): Promise<USBDevice> {
    return this.client.get<USBDevice>(`${this.basePath}/devices/${deviceId}`);
  }
  async claim(deviceId: string, request?: ClaimRequest): Promise<USBDevice> {
    return this.client.post<USBDevice>(`${this.basePath}/devices/${deviceId}/claim`, request);
  }
  async release(deviceId: string): Promise<USBDevice> {
    return this.client.post<USBDevice>(`${this.basePath}/devices/${deviceId}/release`);
  }
  async getCapabilities(deviceId: string): Promise<USBDeviceCapabilities> {
    return this.client.get<USBDeviceCapabilities>(
      `${this.basePath}/devices/${deviceId}/capabilities`,
    );
  }
  async listByNode(
    nodeId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<USBDevice>> {
    return this.client.get<PaginatedResponse<USBDevice>>(
      `${this.basePath}/nodes/${nodeId}/devices`,
      { params: params as Record<string, string | number | boolean | undefined> },
    );
  }
  async configure(deviceId: string, config: Record<string, unknown>): Promise<USBDevice> {
    return this.client.patch<USBDevice>(`${this.basePath}/devices/${deviceId}/config`, config);
  }
}

export function createUsbAPI(client: WaveClient): UsbAPI {
  return new UsbAPI(client);
}
