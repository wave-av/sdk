import { WaveClient } from './client.mjs';
import { Timestamps, PaginationParams, PaginatedResponse } from './client-types.mjs';
import 'eventemitter3';
import './telemetry.mjs';

/**
 * WAVE SDK - Slides API
 *
 * Presentation to video conversion with narration and transitions.
 */

type ConversionStatus = "pending" | "processing" | "ready" | "failed";
type SlideFormat = "pptx" | "pdf" | "google_slides" | "keynote";
type TransitionPreset = "none" | "fade" | "slide" | "zoom" | "morph";
interface Conversion extends Timestamps {
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
interface SlideNarration {
    slide_index: number;
    text: string;
    voice_id?: string;
    duration_seconds?: number;
}
interface ConvertRequest {
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
declare class SlidesAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    convert(request: ConvertRequest): Promise<Conversion>;
    get(conversionId: string): Promise<Conversion>;
    list(params?: PaginationParams): Promise<PaginatedResponse<Conversion>>;
    remove(conversionId: string): Promise<void>;
    getProgress(conversionId: string): Promise<{
        status: ConversionStatus;
        progress_percent: number;
    }>;
    addNarration(conversionId: string, narrations: SlideNarration[]): Promise<Conversion>;
    waitForReady(conversionId: string, options?: {
        pollInterval?: number;
        timeout?: number;
    }): Promise<Conversion>;
}
declare function createSlidesAPI(client: WaveClient): SlidesAPI;

export { type Conversion, type ConversionStatus, type ConvertRequest, type SlideFormat, type SlideNarration, SlidesAPI, type TransitionPreset, createSlidesAPI };
