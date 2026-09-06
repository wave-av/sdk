import { Timestamps, Metadata, PaginationParams } from './client-types.js';
import './telemetry.js';

/**
 * WAVE SDK - Collab API
 *
 * Real-time collaboration features for projects and media.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

/**
 * Collaboration room status
 */
type RoomStatus = 'active' | 'closed' | 'archived';
/**
 * Participant role in collaboration
 */
type ParticipantRole = 'owner' | 'editor' | 'commenter' | 'viewer';
/**
 * Presence status
 */
type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';
/**
 * Collaboration room
 */
interface CollabRoom extends Timestamps {
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
interface RoomSettings {
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
interface Participant extends Timestamps {
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
interface ParticipantPermissions {
    can_edit: boolean;
    can_comment: boolean;
    can_invite: boolean;
    can_export: boolean;
    can_control_playback: boolean;
}
/**
 * Cursor position for presence
 */
interface CursorPosition {
    x: number;
    y: number;
    element_id?: string;
    timestamp: number;
}
/**
 * Selection range
 */
interface Selection {
    start: number;
    end: number;
    element_id?: string;
    type: 'text' | 'timeline' | 'range';
}
/**
 * Comment
 */
interface Comment extends Timestamps {
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
interface Reaction {
    emoji: string;
    user_id: string;
    created_at: string;
}
/**
 * Annotation
 */
interface Annotation extends Timestamps {
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
interface CreateRoomRequest {
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
interface UpdateRoomRequest {
    name?: string;
    description?: string;
    settings?: Partial<RoomSettings>;
    metadata?: Metadata;
}
/**
 * Invite request
 */
interface InviteRequest {
    email?: string;
    user_id?: string;
    role: ParticipantRole;
    message?: string;
}
/**
 * List rooms params
 */
interface ListRoomsParams extends PaginationParams {
    status?: RoomStatus;
    resource_type?: 'project' | 'clip' | 'document' | 'stream';
    resource_id?: string;
}

export type { Annotation, CollabRoom, Comment, CreateRoomRequest, CursorPosition, InviteRequest, ListRoomsParams, Participant, ParticipantPermissions, ParticipantRole, PresenceStatus, Reaction, RoomSettings, RoomStatus, Selection, UpdateRoomRequest };
