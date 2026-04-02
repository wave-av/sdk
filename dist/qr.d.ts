/**
 * WAVE SDK - QR API
 *
 * Dynamic QR code generation, tracking, and analytics.
 */
import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps } from "./client";
export type QRType = "url" | "stream" | "vcard" | "wifi" | "text" | "dynamic";
export interface QRCode extends Timestamps {
    id: string;
    organization_id: string;
    type: QRType;
    content: string;
    short_url: string;
    image_url: string;
    scan_count: number;
    status: "active" | "paused" | "expired";
    style: QRStyle;
    expires_at?: string;
}
export interface QRStyle {
    foreground_color?: string;
    background_color?: string;
    logo_url?: string;
    error_correction: "L" | "M" | "Q" | "H";
    size_px?: number;
}
export interface QRAnalytics {
    qr_id: string;
    total_scans: number;
    unique_scans: number;
    scans_by_day: {
        date: string;
        count: number;
    }[];
    top_locations: {
        country: string;
        count: number;
    }[];
    devices: {
        type: string;
        count: number;
    }[];
}
export interface CreateQRRequest {
    type: QRType;
    content: string;
    style?: Partial<QRStyle>;
    expires_at?: string;
}
/**
 * Dynamic QR code generation, tracking, and scan analytics.
 *
 * @example
 * ```typescript
 * const qr = await wave.qr.create({ type: "url", content: "https://wave.online/stream/123" });
 * const analytics = await wave.qr.getAnalytics(qr.id);
 * ```
 */
export declare class QrAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    create(request: CreateQRRequest): Promise<QRCode>;
    get(qrId: string): Promise<QRCode>;
    update(qrId: string, updates: {
        content?: string;
        style?: Partial<QRStyle>;
        status?: string;
        expires_at?: string;
    }): Promise<QRCode>;
    remove(qrId: string): Promise<void>;
    list(params?: PaginationParams): Promise<PaginatedResponse<QRCode>>;
    getAnalytics(qrId: string, params?: {
        start_date?: string;
        end_date?: string;
    }): Promise<QRAnalytics>;
    createBatch(items: CreateQRRequest[]): Promise<QRCode[]>;
    getImage(qrId: string, format?: "png" | "svg" | "pdf", size?: number): Promise<{
        url: string;
    }>;
}
export declare function createQrAPI(client: WaveClient): QrAPI;
