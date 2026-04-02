/**
 * WAVE SDK - Vault API
 *
 * Recording storage, VOD management, and archival policies.
 */

import type {
  WaveClient,
  PaginationParams,
  PaginatedResponse,
  Timestamps,
  Metadata,
} from "./client";

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
  tier_after_days: { warm?: number; cold?: number; archive?: number; delete?: number };
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
export class VaultAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/vault";
  constructor(client: WaveClient) {
    this.client = client;
  }

  async list(params?: ListRecordingsParams): Promise<PaginatedResponse<Recording>> {
    return this.client.get<PaginatedResponse<Recording>>(`${this.basePath}/recordings`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async get(recordingId: string): Promise<Recording> {
    return this.client.get<Recording>(`${this.basePath}/recordings/${recordingId}`);
  }
  async update(
    recordingId: string,
    updates: { title?: string; tags?: string[]; metadata?: Metadata },
  ): Promise<Recording> {
    return this.client.patch<Recording>(`${this.basePath}/recordings/${recordingId}`, updates);
  }
  async remove(recordingId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/recordings/${recordingId}`);
  }
  async getStorageUsage(): Promise<StorageUsage> {
    return this.client.get<StorageUsage>(`${this.basePath}/storage`);
  }
  async createUpload(request: {
    title: string;
    format: string;
    file_size_bytes: number;
    tags?: string[];
  }): Promise<UploadSession> {
    return this.client.post<UploadSession>(`${this.basePath}/uploads`, request);
  }
  async completeUpload(uploadId: string): Promise<Recording> {
    return this.client.post<Recording>(`${this.basePath}/uploads/${uploadId}/complete`);
  }
  async startRecording(
    streamId: string,
    options?: { title?: string; tags?: string[] },
  ): Promise<Recording> {
    return this.client.post<Recording>(`${this.basePath}/recordings`, {
      stream_id: streamId,
      ...options,
    });
  }
  async stopRecording(streamId: string): Promise<Recording> {
    return this.client.post<Recording>(`${this.basePath}/recordings/stop`, { stream_id: streamId });
  }
  async transcode(
    recordingId: string,
    request: { format: string; resolution?: string; bitrate_kbps?: number },
  ): Promise<TranscodeJob> {
    return this.client.post<TranscodeJob>(
      `${this.basePath}/recordings/${recordingId}/transcode`,
      request,
    );
  }
  async getTranscodeJob(jobId: string): Promise<TranscodeJob> {
    return this.client.get<TranscodeJob>(`${this.basePath}/transcode/${jobId}`);
  }
  async createArchivePolicy(
    policy: Omit<ArchivePolicy, "id" | "created_at" | "updated_at">,
  ): Promise<ArchivePolicy> {
    return this.client.post<ArchivePolicy>(`${this.basePath}/policies`, policy);
  }
  async listArchivePolicies(): Promise<ArchivePolicy[]> {
    return this.client.get<ArchivePolicy[]>(`${this.basePath}/policies`);
  }
  async removeArchivePolicy(policyId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/policies/${policyId}`);
  }
  async getDownloadUrl(recordingId: string): Promise<{ url: string; expires_at: string }> {
    return this.client.get<{ url: string; expires_at: string }>(
      `${this.basePath}/recordings/${recordingId}/download`,
    );
  }
}

export function createVaultAPI(client: WaveClient): VaultAPI {
  return new VaultAPI(client);
}
