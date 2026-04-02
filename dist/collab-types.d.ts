/**
 * WAVE SDK - Collab API
 *
 * Real-time collaboration features for projects and media.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { PaginationParams, Timestamps, Metadata } from './client';
/**
 * Collaboration room status
 */
export type RoomStatus = 'active' | 'closed' | 'archived';
/**
 * Participant role in collaboration
 */
export type ParticipantRole = 'owner' | 'editor' | 'commenter' | 'viewer';
/**
 * Presence status
 */
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';
/**
 * Collaboration room
 */
export interface CollabRoom extends Timestamps {
    id: string;
    organization_id: string;
    name: string;
    description?: string;
    resource_type: 'project' | 'clip' | 'document' | 'stream';
    resource_id: string;
    status: RoomStatus;
    owner_id: string;
    max_participants?: number;
    participant_count: number;
    allow_anonymous: boolean;
    settings: RoomSettings;
    metadata?: Metadata;
}
/**
 * Room settings
 */
export interface RoomSettings {
    voice_enabled: boolean;
    video_enabled: boolean;
    screen_share_enabled: boolean;
    chat_enabled: boolean;
    annotations_enabled: boolean;
    playback_sync_enabled: boolean;
    recording_enabled: boolean;
}
/**
 * Room participant
 */
export interface Participant extends Timestamps {
    id: string;
    room_id: string;
    user_id: string;
    display_name: string;
    avatar_url?: string;
    role: ParticipantRole;
    presence: PresenceStatus;
    cursor_position?: CursorPosition;
    selection?: Selection;
    permissions: ParticipantPermissions;
}
/**
 * Participant permissions
 */
export interface ParticipantPermissions {
    can_edit: boolean;
    can_comment: boolean;
    can_invite: boolean;
    can_export: boolean;
    can_control_playback: boolean;
}
/**
 * Cursor position for presence
 */
export interface CursorPosition {
    x: number;
    y: number;
    element_id?: string;
    timestamp: number;
}
/**
 * Selection range
 */
export interface Selection {
    start: number;
    end: number;
    element_id?: string;
    type: 'text' | 'timeline' | 'range';
}
/**
 * Comment
 */
export interface Comment extends Timestamps {
    id: string;
    room_id: string;
    user_id: string;
    display_name: string;
    avatar_url?: string;
    content: string;
    timestamp?: number;
    element_id?: string;
    position?: {
        x: number;
        y: number;
    };
    parent_id?: string;
    resolved: boolean;
    reactions: Reaction[];
}
/**
 * Reaction
 */
export interface Reaction {
    emoji: string;
    user_id: string;
    created_at: string;
}
/**
 * Annotation
 */
export interface Annotation extends Timestamps {
    id: string;
    room_id: string;
    user_id: string;
    type: 'drawing' | 'text' | 'shape' | 'arrow' | 'highlight';
    timestamp?: number;
    duration?: number;
    data: Record<string, unknown>;
    color: string;
    visible: boolean;
}
/**
 * Create room request
 */
export interface CreateRoomRequest {
    name: string;
    description?: string;
    resource_type: 'project' | 'clip' | 'document' | 'stream';
    resource_id: string;
    max_participants?: number;
    allow_anonymous?: boolean;
    settings?: Partial<RoomSettings>;
    metadata?: Metadata;
}
/**
 * Update room request
 */
export interface UpdateRoomRequest {
    name?: string;
    description?: string;
    settings?: Partial<RoomSettings>;
    metadata?: Metadata;
}
/**
 * Invite request
 */
export interface InviteRequest {
    email?: string;
    user_id?: string;
    role: ParticipantRole;
    message?: string;
}
/**
 * List rooms params
 */
export interface ListRoomsParams extends PaginationParams {
    status?: RoomStatus;
    resource_type?: 'project' | 'clip' | 'document' | 'stream';
    resource_id?: string;
}
/**
 * Collab API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave/sdk';
 * import { CollabAPI } from '@wave/sdk/collab';
 *
 * const client = new WaveClient({ apiKey: 'your-api-key' });
 * const collab = new CollabAPI(client);
 *
 * // Create a collaboration room for a project
 * const room = await collab.createRoom({
 *   name: 'Project Review',
 *   resource_type: 'project',
 *   resource_id: 'project_123',
 *   settings: {
 *     voice_enabled: true,
 *     annotations_enabled: true,
 *   },
 * });
 *
 * // Get join token for real-time connection
 * const token = await collab.getJoinToken(room.id);
 * ```
 */
