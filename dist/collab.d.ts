/**
 * WAVE SDK - Collab API
 *
 * Real-time collaboration features for projects and media.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { WaveClient, PaginationParams, PaginatedResponse } from './client';
export * from './collab-types';
import type { Annotation, CollabRoom, Comment, CreateRoomRequest, InviteRequest, ListRoomsParams, Participant, ParticipantPermissions, ParticipantRole, UpdateRoomRequest } from './collab-types';
export declare class CollabAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * Create a collaboration room
     *
     * Requires: collab:create permission
     */
    createRoom(request: CreateRoomRequest): Promise<CollabRoom>;
    /**
     * Get a room by ID
     *
     * Requires: collab:read permission
     */
    getRoom(roomId: string): Promise<CollabRoom>;
    /**
     * Update a room
     *
     * Requires: collab:update permission
     */
    updateRoom(roomId: string, request: UpdateRoomRequest): Promise<CollabRoom>;
    /**
     * Close a room
     *
     * Requires: collab:manage permission
     */
    closeRoom(roomId: string): Promise<CollabRoom>;
    /**
     * Archive a room
     *
     * Requires: collab:manage permission (server-side RBAC enforced)
     */
    archiveRoom(roomId: string): Promise<void>;
    /**
     * List rooms
     *
     * Requires: collab:read permission
     */
    listRooms(params?: ListRoomsParams): Promise<PaginatedResponse<CollabRoom>>;
    /**
     * Get join token for real-time connection
     *
     * Requires: collab:join permission
     */
    getJoinToken(roomId: string, options?: {
        display_name?: string;
        avatar_url?: string;
    }): Promise<{
        token: string;
        expires_at: string;
        websocket_url: string;
    }>;
    /**
     * List participants in a room
     *
     * Requires: collab:read permission
     */
    listParticipants(roomId: string, params?: PaginationParams): Promise<PaginatedResponse<Participant>>;
    /**
     * Get a participant
     *
     * Requires: collab:read permission
     */
    getParticipant(roomId: string, participantId: string): Promise<Participant>;
    /**
     * Update a participant's role
     *
     * Requires: collab:manage permission
     */
    updateParticipant(roomId: string, participantId: string, updates: {
        role?: ParticipantRole;
        permissions?: Partial<ParticipantPermissions>;
    }): Promise<Participant>;
    /**
     * Remove a participant from a room
     *
     * Requires: collab:manage permission (server-side RBAC enforced)
     */
    removeParticipant(roomId: string, participantId: string): Promise<void>;
    /**
     * Invite users to a room
     *
     * Requires: collab:invite permission
     */
    invite(roomId: string, invites: InviteRequest[]): Promise<{
        sent: number;
        failed: Array<{
            email?: string;
            user_id?: string;
            error: string;
        }>;
    }>;
    /**
     * Add a comment
     *
     * Requires: collab:comment permission
     */
    addComment(roomId: string, comment: {
        content: string;
        timestamp?: number;
        element_id?: string;
        position?: {
            x: number;
            y: number;
        };
        parent_id?: string;
    }): Promise<Comment>;
    /**
     * List comments
     *
     * Requires: collab:read permission
     */
    listComments(roomId: string, params?: PaginationParams & {
        resolved?: boolean;
        element_id?: string;
        parent_id?: string;
    }): Promise<PaginatedResponse<Comment>>;
    /**
     * Update a comment
     *
     * Requires: collab:comment permission (own comments) or collab:manage
     */
    updateComment(roomId: string, commentId: string, updates: {
        content?: string;
        resolved?: boolean;
    }): Promise<Comment>;
    /**
     * Remove a comment
     *
     * Requires: collab:comment permission (own) or collab:manage (server-side RBAC enforced)
     */
    removeComment(roomId: string, commentId: string): Promise<void>;
    /**
     * Add a reaction to a comment
     *
     * Requires: collab:comment permission
     */
    addReaction(roomId: string, commentId: string, emoji: string): Promise<Comment>;
    /**
     * Remove a reaction from a comment
     *
     * Requires: collab:comment permission (server-side RBAC enforced)
     */
    removeReaction(roomId: string, commentId: string, emoji: string): Promise<void>;
    /**
     * Add an annotation
     *
     * Requires: collab:annotate permission
     */
    addAnnotation(roomId: string, annotation: Omit<Annotation, 'id' | 'room_id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Annotation>;
    /**
     * List annotations
     *
     * Requires: collab:read permission
     */
    listAnnotations(roomId: string, params?: PaginationParams & {
        timestamp?: number;
        user_id?: string;
    }): Promise<PaginatedResponse<Annotation>>;
    /**
     * Update an annotation
     *
     * Requires: collab:annotate permission (own) or collab:manage
     */
    updateAnnotation(roomId: string, annotationId: string, updates: Partial<Omit<Annotation, 'id' | 'room_id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Annotation>;
    /**
     * Remove an annotation
     *
     * Requires: collab:annotate permission (own) or collab:manage (server-side RBAC enforced)
     */
    removeAnnotation(roomId: string, annotationId: string): Promise<void>;
    /**
     * Clear all annotations
     *
     * Requires: collab:manage permission
     */
    clearAnnotations(roomId: string): Promise<{
        cleared: number;
    }>;
    /**
     * Start recording the collaboration session
     *
     * Requires: collab:record permission
     */
    startRecording(roomId: string): Promise<{
        recording_id: string;
        started_at: string;
    }>;
    /**
     * Stop recording
     *
     * Requires: collab:record permission
     */
    stopRecording(roomId: string): Promise<{
        recording_id: string;
        url: string;
        duration: number;
    }>;
    /**
     * Get recording status
     *
     * Requires: collab:read permission
     */
    getRecordingStatus(roomId: string): Promise<{
        recording: boolean;
        recording_id?: string;
        started_at?: string;
        duration?: number;
    }>;
}
/**
 * Create a Collab API instance
 */
export declare function createCollabAPI(client: WaveClient): CollabAPI;
