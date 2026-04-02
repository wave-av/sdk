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
export declare class UsbAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    list(params?: ListUSBDevicesParams): Promise<PaginatedResponse<USBDevice>>;
    get(deviceId: string): Promise<USBDevice>;
    claim(deviceId: string, request?: ClaimRequest): Promise<USBDevice>;
    release(deviceId: string): Promise<USBDevice>;
    getCapabilities(deviceId: string): Promise<USBDeviceCapabilities>;
    listByNode(nodeId: string, params?: PaginationParams): Promise<PaginatedResponse<USBDevice>>;
    configure(deviceId: string, config: Record<string, unknown>): Promise<USBDevice>;
}
export declare function createUsbAPI(client: WaveClient): UsbAPI;
