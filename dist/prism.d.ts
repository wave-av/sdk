import { WaveClient } from './client.js';
import { Timestamps, PaginationParams, PaginatedResponse } from './client-types.js';
import 'eventemitter3';
import './telemetry.js';

/**
 * WAVE SDK - Prism API
 *
 * Virtual Device Bridge - present network AV sources (NDI, ONVIF, VISCA, Dante)
 * as standard USB UVC/UAC devices to conferencing apps.
 */

type VirtualDeviceType = "camera" | "microphone";
type DeviceStatus = "created" | "starting" | "running" | "stopping" | "stopped" | "error";
type SourceProtocol = "ndi" | "onvif" | "srt" | "rtmp" | "webrtc" | "dante" | "cloudflare" | "livekit";
type PTZProtocol = "ndi" | "onvif" | "visca" | "pelcod" | "cgi" | "livekit";
interface VirtualDevice extends Timestamps {
    id: string;
    organization_id: string;
    name: string;
    type: VirtualDeviceType;
    status: DeviceStatus;
    source_protocol: SourceProtocol;
    source_endpoint: string;
    node_id: string;
    resolution?: {
        width: number;
        height: number;
    };
    frame_rate?: number;
    health_score: number;
    ptz_enabled: boolean;
    ptz_protocol?: PTZProtocol;
}
interface PresetMapping extends Timestamps {
    id: string;
    device_id: string;
    slot_number: number;
    preset_name: string;
    preset_token: string;
    protocol: PTZProtocol;
    transition_speed: number;
}
interface DeviceHealth {
    device_id: string;
    status: "healthy" | "degraded" | "critical" | "offline";
    latency_ms: number;
    dropped_frames: number;
    fps: number;
    cpu_usage: number;
    source_connected: boolean;
    driver_connected: boolean;
}
interface DiscoveredSource {
    id: string;
    name: string;
    protocol: string;
    address: string;
    supports_ptz: boolean;
    capabilities: string[];
    discovered_at: string;
}
interface CreateDeviceRequest {
    name: string;
    type: VirtualDeviceType;
    source_protocol: SourceProtocol;
    source_endpoint: string;
    node_id: string;
    resolution?: {
        width: number;
        height: number;
    };
    frame_rate?: number;
    ptz_enabled?: boolean;
    ptz_protocol?: PTZProtocol;
    metadata?: Record<string, unknown>;
}
interface UpdateDeviceRequest {
    name?: string;
    source_endpoint?: string;
    resolution?: {
        width: number;
        height: number;
    };
    frame_rate?: number;
    metadata?: Record<string, unknown>;
}
interface SetPresetRequest {
    slot_number: number;
    preset_name: string;
    preset_token: string;
    protocol: PTZProtocol;
    transition_speed?: number;
}
interface ListDevicesParams extends PaginationParams {
    type?: VirtualDeviceType;
    status?: DeviceStatus;
    node_id?: string;
    source_protocol?: SourceProtocol;
    order_by?: string;
    order?: "asc" | "desc";
}
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
declare class PrismAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    createDevice(request: CreateDeviceRequest): Promise<VirtualDevice>;
    getDevice(deviceId: string): Promise<VirtualDevice>;
    updateDevice(deviceId: string, request: UpdateDeviceRequest): Promise<VirtualDevice>;
    removeDevice(deviceId: string): Promise<void>;
    listDevices(params?: ListDevicesParams): Promise<PaginatedResponse<VirtualDevice>>;
    startDevice(deviceId: string): Promise<VirtualDevice>;
    stopDevice(deviceId: string): Promise<VirtualDevice>;
    getHealth(deviceId: string): Promise<DeviceHealth>;
    discoverSources(options?: {
        protocols?: string[];
        subnet?: string;
        timeout?: number;
    }): Promise<DiscoveredSource[]>;
    getPresets(deviceId: string): Promise<PresetMapping[]>;
    setPreset(deviceId: string, request: SetPresetRequest): Promise<PresetMapping>;
    removePreset(deviceId: string, slotNumber: number): Promise<void>;
    recallPreset(deviceId: string, slotNumber: number): Promise<void>;
}
declare function createPrismAPI(client: WaveClient): PrismAPI;

export { type CreateDeviceRequest, type DeviceHealth, type DeviceStatus, type DiscoveredSource, type ListDevicesParams, type PTZProtocol, type PresetMapping, PrismAPI, type SetPresetRequest, type SourceProtocol, type UpdateDeviceRequest, type VirtualDevice, type VirtualDeviceType, createPrismAPI };
