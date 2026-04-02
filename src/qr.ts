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
  scans_by_day: { date: string; count: number }[];
  top_locations: { country: string; count: number }[];
  devices: { type: string; count: number }[];
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
export class QrAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/qr";
  constructor(client: WaveClient) {
    this.client = client;
  }

  async create(request: CreateQRRequest): Promise<QRCode> {
    return this.client.post<QRCode>(this.basePath, request);
  }
  async get(qrId: string): Promise<QRCode> {
    return this.client.get<QRCode>(`${this.basePath}/${qrId}`);
  }
  async update(
    qrId: string,
    updates: { content?: string; style?: Partial<QRStyle>; status?: string; expires_at?: string },
  ): Promise<QRCode> {
    return this.client.patch<QRCode>(`${this.basePath}/${qrId}`, updates);
  }
  async remove(qrId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${qrId}`);
  }
  async list(params?: PaginationParams): Promise<PaginatedResponse<QRCode>> {
    return this.client.get<PaginatedResponse<QRCode>>(this.basePath, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async getAnalytics(
    qrId: string,
    params?: { start_date?: string; end_date?: string },
  ): Promise<QRAnalytics> {
    return this.client.get<QRAnalytics>(`${this.basePath}/${qrId}/analytics`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async createBatch(items: CreateQRRequest[]): Promise<QRCode[]> {
    return this.client.post<QRCode[]>(`${this.basePath}/batch`, { items });
  }
  async getImage(
    qrId: string,
    format?: "png" | "svg" | "pdf",
    size?: number,
  ): Promise<{ url: string }> {
    return this.client.get<{ url: string }>(`${this.basePath}/${qrId}/image`, {
      params: { format, size },
    });
  }
}

export function createQrAPI(client: WaveClient): QrAPI {
  return new QrAPI(client);
}
