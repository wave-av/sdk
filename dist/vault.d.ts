/**
 * WAVE SDK - Vault API
 *
 * Recording storage, VOD management, and archival policies.
 */
import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps, Metadata } from "./client";
export type RecordingStatus = "recording" | "processing" | "ready" | "archived" | "failed";
export type StorageTier = "hot" | "warm" | "cold" | "archive";
export interface Recording extends Timestamps {
    id: string;
    organization_id: string;
    stream_id?: string;
    title: string;
    status: RecordingStatus;
    duration_seconds: number;
    file_size_bytes: number;
    format: string;
    resolution?: string;
    frame_rate?: number;
    storage_tier: StorageTier;
    playback_url?: string;
    download_url?: string;
    thumbnail_url?: string;
    tags?: string[];
    metadata?: Metadata;
    expires_at?: string;
}
export interface StorageUsage {
    organization_id: string;
    total_bytes: number;
    hot_bytes: number;
    warm_bytes: number;
    cold_bytes: number;
    archive_bytes: number;
    recording_count: number;
    quota_bytes: number;
    usage_percent: number;
}
export interface ArchivePolicy extends Timestamps {
    id: string;
    name: string;
    tier_after_days: {
        warm?: number;
        cold?: number;
        archive?: number;
        delete?: number;
    };
    applies_to: "all" | "tagged";
    tags?: string[];
}
export interface UploadSession {
    id: string;
    upload_url: string;
    expires_at: string;
}
export interface TranscodeJob extends Timestamps {
    id: string;
    recording_id: string;
    status: "pending" | "processing" | "ready" | "failed";
    progress_percent: number;
    output_url?: string;
    error?: string;
}
export interface ListRecordingsParams extends PaginationParams {
    status?: RecordingStatus;
    stream_id?: string;
    storage_tier?: StorageTier;
    tags?: string[];
    order_by?: string;
    order?: "asc" | "desc";
}
/**
 * Recording storage, VOD management, transcoding, and archival policies.
 *
 * @example
 * ```typescript
 * const recording = await wave.vault.startRecording(streamId);
 * const usage = await wave.vault.getStorageUsage();
 * const url = await wave.vault.getDownloadUrl(recordingId);
 * ```
 */
export declare class VaultAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    list(params?: ListRecordingsParams): Promise<PaginatedResponse<Recording>>;
    get(recordingId: string): Promise<Recording>;
    update(recordingId: string, updates: {
        title?: string;
        tags?: string[];
        metadata?: Metadata;
    }): Promise<Recording>;
    remove(recordingId: string): Promise<void>;
    getStorageUsage(): Promise<StorageUsage>;
    createUpload(request: {
        title: string;
        format: string;
        file_size_bytes: number;
        tags?: string[];
    }): Promise<UploadSession>;
    completeUpload(uploadId: string): Promise<Recording>;
    startRecording(streamId: string, options?: {
        title?: string;
        tags?: string[];
    }): Promise<Recording>;
    stopRecording(streamId: string): Promise<Recording>;
    transcode(recordingId: string, request: {
        format: string;
        resolution?: string;
        bitrate_kbps?: number;
    }): Promise<TranscodeJob>;
    getTranscodeJob(jobId: string): Promise<TranscodeJob>;
    createArchivePolicy(policy: Omit<ArchivePolicy, "id" | "created_at" | "updated_at">): Promise<ArchivePolicy>;
    listArchivePolicies(): Promise<ArchivePolicy[]>;
    removeArchivePolicy(policyId: string): Promise<void>;
    getDownloadUrl(recordingId: string): Promise<{
        url: string;
        expires_at: string;
    }>;
}
export declare function createVaultAPI(client: WaveClient): VaultAPI;
