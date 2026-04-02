/**
 * WAVE SDK - Slides API
 *
 * Presentation to video conversion with narration and transitions.
 */

import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps } from "./client";

export type ConversionStatus = "pending" | "processing" | "ready" | "failed";
export type SlideFormat = "pptx" | "pdf" | "google_slides" | "keynote";
export type TransitionPreset = "none" | "fade" | "slide" | "zoom" | "morph";

export interface Conversion extends Timestamps {
  id: string;
  organization_id: string;
  title: string;
  status: ConversionStatus;
  input_format: SlideFormat;
  input_url: string;
  output_url?: string;
  slide_count: number;
  duration_seconds?: number;
  resolution: string;
  narration_enabled: boolean;
  progress_percent: number;
  error?: string;
}
export interface SlideNarration {
  slide_index: number;
  text: string;
  voice_id?: string;
  duration_seconds?: number;
}
export interface ConvertRequest {
  title: string;
  input_url: string;
  input_format: SlideFormat;
  resolution?: string;
  narration?: SlideNarration[];
  transition?: TransitionPreset;
  slide_duration_seconds?: number;
  webhook_url?: string;
}

/**
 * Presentation-to-video conversion with narration and transitions.
 *
 * @example
 * ```typescript
 * const conversion = await wave.slides.convert({ title: "Q4 Review", input_url: "https://...", input_format: "pptx" });
 * const ready = await wave.slides.waitForReady(conversion.id);
 * ```
 */
export class SlidesAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/slides";
  constructor(client: WaveClient) {
    this.client = client;
  }

  async convert(request: ConvertRequest): Promise<Conversion> {
    return this.client.post<Conversion>(this.basePath, request);
  }
  async get(conversionId: string): Promise<Conversion> {
    return this.client.get<Conversion>(`${this.basePath}/${conversionId}`);
  }
  async list(params?: PaginationParams): Promise<PaginatedResponse<Conversion>> {
    return this.client.get<PaginatedResponse<Conversion>>(this.basePath, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async remove(conversionId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${conversionId}`);
  }
  async getProgress(
    conversionId: string,
  ): Promise<{ status: ConversionStatus; progress_percent: number }> {
    return this.client.get<{ status: ConversionStatus; progress_percent: number }>(
      `${this.basePath}/${conversionId}/progress`,
    );
  }
  async addNarration(conversionId: string, narrations: SlideNarration[]): Promise<Conversion> {
    return this.client.post<Conversion>(`${this.basePath}/${conversionId}/narration`, {
      narrations,
    });
  }

  async waitForReady(
    conversionId: string,
    options?: { pollInterval?: number; timeout?: number },
  ): Promise<Conversion> {
    const pollInterval = options?.pollInterval || 3000;
    const timeout = options?.timeout || 600000;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const conversion = await this.get(conversionId);
      if (conversion.status === "ready") return conversion;
      if (conversion.status === "failed")
        throw new Error(`Conversion failed: ${conversion.error || "Unknown"}`);
      await new Promise((r) => setTimeout(r, pollInterval));
    }
    throw new Error(`Conversion timed out after ${timeout}ms`);
  }
}

export function createSlidesAPI(client: WaveClient): SlidesAPI {
  return new SlidesAPI(client);
}
