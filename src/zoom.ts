/**
 * WAVE SDK - Zoom API
 *
 * Zoom meeting, Zoom Room, and RTMS integration.
 */

import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps } from "./client";

export interface ZoomMeeting {
  id: string;
  topic: string;
  type: "instant" | "scheduled" | "recurring";
  status: "waiting" | "started" | "ended";
  start_url: string;
  join_url: string;
  host_id: string;
  duration_minutes: number;
  participants_count: number;
  recording_enabled: boolean;
  rtms_enabled: boolean;
  created_at: string;
}
export interface ZoomRoom {
  id: string;
  name: string;
  location?: string;
  status: "online" | "offline" | "in_meeting";
  account_id: string;
  device_ip?: string;
  firmware_version?: string;
  camera_count: number;
  microphone_count: number;
}
export interface ZoomRecording extends Timestamps {
  id: string;
  meeting_id: string;
  type: "cloud" | "rtms";
  status: "processing" | "completed" | "failed";
  file_url?: string;
  duration_seconds: number;
  file_size_bytes: number;
}
export interface CreateMeetingRequest {
  topic: string;
  type?: "instant" | "scheduled" | "recurring";
  duration_minutes?: number;
  start_time?: string;
  recording_enabled?: boolean;
  rtms_enabled?: boolean;
  password?: string;
}
export interface ListMeetingsParams extends PaginationParams {
  status?: string;
  type?: string;
  host_id?: string;
}

/**
 * Zoom meeting, Zoom Room, and RTMS streaming integration.
 *
 * @example
 * ```typescript
 * const meeting = await wave.zoom.createMeeting({ topic: "Team Standup" });
 * await wave.zoom.startRTMS(meeting.id, { stream_url: "rtmp://...", stream_key: "key" });
 * const rooms = await wave.zoom.listRooms();
 * ```
 */
export class ZoomAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/zoom";
  constructor(client: WaveClient) {
    this.client = client;
  }

  async createMeeting(request: CreateMeetingRequest): Promise<ZoomMeeting> {
    return this.client.post<ZoomMeeting>(`${this.basePath}/meetings`, request);
  }
  async getMeeting(meetingId: string): Promise<ZoomMeeting> {
    return this.client.get<ZoomMeeting>(`${this.basePath}/meetings/${meetingId}`);
  }
  async endMeeting(meetingId: string): Promise<void> {
    await this.client.post(`${this.basePath}/meetings/${meetingId}/end`);
  }
  async listMeetings(params?: ListMeetingsParams): Promise<PaginatedResponse<ZoomMeeting>> {
    return this.client.get<PaginatedResponse<ZoomMeeting>>(`${this.basePath}/meetings`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async listRooms(params?: PaginationParams): Promise<PaginatedResponse<ZoomRoom>> {
    return this.client.get<PaginatedResponse<ZoomRoom>>(`${this.basePath}/rooms`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async getRoomStatus(roomId: string): Promise<ZoomRoom> {
    return this.client.get<ZoomRoom>(`${this.basePath}/rooms/${roomId}`);
  }
  async getRecording(recordingId: string): Promise<ZoomRecording> {
    return this.client.get<ZoomRecording>(`${this.basePath}/recordings/${recordingId}`);
  }
  async listRecordings(
    meetingId?: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<ZoomRecording>> {
    const path = meetingId
      ? `${this.basePath}/meetings/${meetingId}/recordings`
      : `${this.basePath}/recordings`;
    return this.client.get<PaginatedResponse<ZoomRecording>>(path, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }
  async startRTMS(
    meetingId: string,
    config: { stream_url: string; stream_key: string },
  ): Promise<{ status: string }> {
    return this.client.post<{ status: string }>(
      `${this.basePath}/meetings/${meetingId}/rtms/start`,
      config,
    );
  }
  async stopRTMS(meetingId: string): Promise<{ status: string }> {
    return this.client.post<{ status: string }>(`${this.basePath}/meetings/${meetingId}/rtms/stop`);
  }
  async getRTMSStatus(meetingId: string): Promise<{ status: string; stream_url?: string }> {
    return this.client.get<{ status: string; stream_url?: string }>(
      `${this.basePath}/meetings/${meetingId}/rtms`,
    );
  }
}

export function createZoomAPI(client: WaveClient): ZoomAPI {
  return new ZoomAPI(client);
}
