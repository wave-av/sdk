import { WaveClient } from './client.js';
import { PaginationParams, PaginatedResponse, Timestamps } from './client-types.js';
import 'eventemitter3';
import './telemetry.js';

/**
 * WAVE SDK - Zoom API
 *
 * Zoom meeting, Zoom Room, and RTMS integration.
 */

interface ZoomMeeting {
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
interface ZoomRoom {
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
interface ZoomRecording extends Timestamps {
    id: string;
    meeting_id: string;
    type: "cloud" | "rtms";
    status: "processing" | "completed" | "failed";
    file_url?: string;
    duration_seconds: number;
    file_size_bytes: number;
}
interface CreateMeetingRequest {
    topic: string;
    type?: "instant" | "scheduled" | "recurring";
    duration_minutes?: number;
    start_time?: string;
    recording_enabled?: boolean;
    rtms_enabled?: boolean;
    password?: string;
}
interface ListMeetingsParams extends PaginationParams {
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
declare class ZoomAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    createMeeting(request: CreateMeetingRequest): Promise<ZoomMeeting>;
    getMeeting(meetingId: string): Promise<ZoomMeeting>;
    endMeeting(meetingId: string): Promise<void>;
    listMeetings(params?: ListMeetingsParams): Promise<PaginatedResponse<ZoomMeeting>>;
    listRooms(params?: PaginationParams): Promise<PaginatedResponse<ZoomRoom>>;
    getRoomStatus(roomId: string): Promise<ZoomRoom>;
    getRecording(recordingId: string): Promise<ZoomRecording>;
    listRecordings(meetingId?: string, params?: PaginationParams): Promise<PaginatedResponse<ZoomRecording>>;
    startRTMS(meetingId: string, config: {
        stream_url: string;
        stream_key: string;
    }): Promise<{
        status: string;
    }>;
    stopRTMS(meetingId: string): Promise<{
        status: string;
    }>;
    getRTMSStatus(meetingId: string): Promise<{
        status: string;
        stream_url?: string;
    }>;
}
declare function createZoomAPI(client: WaveClient): ZoomAPI;

export { type CreateMeetingRequest, type ListMeetingsParams, ZoomAPI, type ZoomMeeting, type ZoomRecording, type ZoomRoom, createZoomAPI };
