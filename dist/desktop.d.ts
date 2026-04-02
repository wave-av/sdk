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
export declare class DesktopAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    getInfo(nodeId: string): Promise<DesktopNodeInfo>;
    getStatus(nodeId: string): Promise<{
        status: string;
        uptime_seconds: number;
        active_bridges: number;
    }>;
    listDevices(nodeId: string): Promise<LocalUSBDevice[]>;
    configure(nodeId: string, config: Partial<NodeConfig>): Promise<NodeConfig>;
    getConfig(nodeId: string): Promise<NodeConfig>;
    getLogs(nodeId: string, params?: {
        level?: string;
        since?: string;
        limit?: number;
    }): Promise<NodeLog[]>;
    getPerformance(nodeId: string): Promise<NodePerformance>;
    checkForUpdate(nodeId: string): Promise<{
        available: boolean;
        version?: string;
        release_notes?: string;
    }>;
    installUpdate(nodeId: string): Promise<{
        status: string;
    }>;
    restart(nodeId: string): Promise<{
        status: string;
    }>;
}
export declare function createDesktopAPI(client: WaveClient): DesktopAPI;
