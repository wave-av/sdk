/**
 * WAVE SDK - Collab API
 *
 * Real-time collaboration features for projects and media.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type {
  WaveClient,
  PaginationParams,
  PaginatedResponse,
} from './client';

export * from './collab-types';
import type {
  Annotation,
  CollabRoom,
  Comment,
  CreateRoomRequest,
  InviteRequest,
  ListRoomsParams,
  Participant,
  ParticipantPermissions,
  ParticipantRole,
  UpdateRoomRequest,
} from './collab-types';

export class CollabAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/collab';

  constructor(client: WaveClient) {
    this.client = client;
  }

  // ==========================================================================
  // Rooms
  // ==========================================================================

  /**
   * Create a collaboration room
   *
   * Requires: collab:create permission
   */
  async createRoom(request: CreateRoomRequest): Promise<CollabRoom> {
    return this.client.post<CollabRoom>(`${this.basePath}/rooms`, request);
  }

  /**
   * Get a room by ID
   *
   * Requires: collab:read permission
   */
  async getRoom(roomId: string): Promise<CollabRoom> {
    return this.client.get<CollabRoom>(`${this.basePath}/rooms/${roomId}`);
  }

  /**
   * Update a room
   *
   * Requires: collab:update permission
   */
  async updateRoom(roomId: string, request: UpdateRoomRequest): Promise<CollabRoom> {
    return this.client.patch<CollabRoom>(
      `${this.basePath}/rooms/${roomId}`,
      request
    );
  }

  /**
   * Close a room
   *
   * Requires: collab:manage permission
   */
  async closeRoom(roomId: string): Promise<CollabRoom> {
    return this.client.post<CollabRoom>(`${this.basePath}/rooms/${roomId}/close`);
  }

  /**
   * Archive a room
   *
   * Requires: collab:manage permission (server-side RBAC enforced)
   */
  async archiveRoom(roomId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/rooms/${roomId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * List rooms
   *
   * Requires: collab:read permission
   */
  async listRooms(params?: ListRoomsParams): Promise<PaginatedResponse<CollabRoom>> {
    return this.client.get<PaginatedResponse<CollabRoom>>(
      `${this.basePath}/rooms`,
      { params: params as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Get join token for real-time connection
   *
   * Requires: collab:join permission
   */
  async getJoinToken(
    roomId: string,
    options?: { display_name?: string; avatar_url?: string }
  ): Promise<{ token: string; expires_at: string; websocket_url: string }> {
    return this.client.post(`${this.basePath}/rooms/${roomId}/token`, options);
  }

  // ==========================================================================
  // Participants
  // ==========================================================================

  /**
   * List participants in a room
   *
   * Requires: collab:read permission
   */
  async listParticipants(
    roomId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Participant>> {
    return this.client.get<PaginatedResponse<Participant>>(
      `${this.basePath}/rooms/${roomId}/participants`,
      { params: params as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Get a participant
   *
   * Requires: collab:read permission
   */
  async getParticipant(roomId: string, participantId: string): Promise<Participant> {
    return this.client.get<Participant>(
      `${this.basePath}/rooms/${roomId}/participants/${participantId}`
    );
  }

  /**
   * Update a participant's role
   *
   * Requires: collab:manage permission
   */
  async updateParticipant(
    roomId: string,
    participantId: string,
    updates: { role?: ParticipantRole; permissions?: Partial<ParticipantPermissions> }
  ): Promise<Participant> {
    return this.client.patch<Participant>(
      `${this.basePath}/rooms/${roomId}/participants/${participantId}`,
      updates
    );
  }

  /**
   * Remove a participant from a room
   *
   * Requires: collab:manage permission (server-side RBAC enforced)
   */
  async removeParticipant(roomId: string, participantId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/rooms/${roomId}/participants/${participantId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Invite users to a room
   *
   * Requires: collab:invite permission
   */
  async invite(
    roomId: string,
    invites: InviteRequest[]
  ): Promise<{ sent: number; failed: Array<{ email?: string; user_id?: string; error: string }> }> {
    return this.client.post(`${this.basePath}/rooms/${roomId}/invite`, { invites });
  }

  // ==========================================================================
  // Comments
  // ==========================================================================

  /**
   * Add a comment
   *
   * Requires: collab:comment permission
   */
  async addComment(
    roomId: string,
    comment: {
      content: string;
      timestamp?: number;
      element_id?: string;
      position?: { x: number; y: number };
      parent_id?: string;
    }
  ): Promise<Comment> {
    return this.client.post<Comment>(
      `${this.basePath}/rooms/${roomId}/comments`,
      comment
    );
  }

  /**
   * List comments
   *
   * Requires: collab:read permission
   */
  async listComments(
    roomId: string,
    params?: PaginationParams & {
      resolved?: boolean;
      element_id?: string;
      parent_id?: string;
    }
  ): Promise<PaginatedResponse<Comment>> {
    return this.client.get<PaginatedResponse<Comment>>(
      `${this.basePath}/rooms/${roomId}/comments`,
      { params: params as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Update a comment
   *
   * Requires: collab:comment permission (own comments) or collab:manage
   */
  async updateComment(
    roomId: string,
    commentId: string,
    updates: { content?: string; resolved?: boolean }
  ): Promise<Comment> {
    return this.client.patch<Comment>(
      `${this.basePath}/rooms/${roomId}/comments/${commentId}`,
      updates
    );
  }

  /**
   * Remove a comment
   *
   * Requires: collab:comment permission (own) or collab:manage (server-side RBAC enforced)
   */
  async removeComment(roomId: string, commentId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/rooms/${roomId}/comments/${commentId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Add a reaction to a comment
   *
   * Requires: collab:comment permission
   */
  async addReaction(roomId: string, commentId: string, emoji: string): Promise<Comment> {
    return this.client.post<Comment>(
      `${this.basePath}/rooms/${roomId}/comments/${commentId}/reactions`,
      { emoji }
    );
  }

  /**
   * Remove a reaction from a comment
   *
   * Requires: collab:comment permission (server-side RBAC enforced)
   */
  async removeReaction(
    roomId: string,
    commentId: string,
    emoji: string
  ): Promise<void> {
    await this.client.delete(
      `${this.basePath}/rooms/${roomId}/comments/${commentId}/reactions`,
      { method: 'DELETE', params: { emoji } as unknown as Record<string, string | number | boolean | undefined> }
    );
  }

  // ==========================================================================
  // Annotations
  // ==========================================================================

  /**
   * Add an annotation
   *
   * Requires: collab:annotate permission
   */
  async addAnnotation(
    roomId: string,
    annotation: Omit<Annotation, 'id' | 'room_id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<Annotation> {
    return this.client.post<Annotation>(
      `${this.basePath}/rooms/${roomId}/annotations`,
      annotation
    );
  }

  /**
   * List annotations
   *
   * Requires: collab:read permission
   */
  async listAnnotations(
    roomId: string,
    params?: PaginationParams & { timestamp?: number; user_id?: string }
  ): Promise<PaginatedResponse<Annotation>> {
    return this.client.get<PaginatedResponse<Annotation>>(
      `${this.basePath}/rooms/${roomId}/annotations`,
      { params: params as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Update an annotation
   *
   * Requires: collab:annotate permission (own) or collab:manage
   */
  async updateAnnotation(
    roomId: string,
    annotationId: string,
    updates: Partial<Omit<Annotation, 'id' | 'room_id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<Annotation> {
    return this.client.patch<Annotation>(
      `${this.basePath}/rooms/${roomId}/annotations/${annotationId}`,
      updates
    );
  }

  /**
   * Remove an annotation
   *
   * Requires: collab:annotate permission (own) or collab:manage (server-side RBAC enforced)
   */
  async removeAnnotation(roomId: string, annotationId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/rooms/${roomId}/annotations/${annotationId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Clear all annotations
   *
   * Requires: collab:manage permission
   */
  async clearAnnotations(roomId: string): Promise<{ cleared: number }> {
    return this.client.post(`${this.basePath}/rooms/${roomId}/annotations/clear`);
  }

  // ==========================================================================
  // Recording
  // ==========================================================================

  /**
   * Start recording the collaboration session
   *
   * Requires: collab:record permission
   */
  async startRecording(
    roomId: string
  ): Promise<{ recording_id: string; started_at: string }> {
    return this.client.post(`${this.basePath}/rooms/${roomId}/recording/start`);
  }

  /**
   * Stop recording
   *
   * Requires: collab:record permission
   */
  async stopRecording(
    roomId: string
  ): Promise<{ recording_id: string; url: string; duration: number }> {
    return this.client.post(`${this.basePath}/rooms/${roomId}/recording/stop`);
  }

  /**
   * Get recording status
   *
   * Requires: collab:read permission
   */
  async getRecordingStatus(
    roomId: string
  ): Promise<{ recording: boolean; recording_id?: string; started_at?: string; duration?: number }> {
    return this.client.get(`${this.basePath}/rooms/${roomId}/recording`);
  }
}

/**
 * Create a Collab API instance
 */
export function createCollabAPI(client: WaveClient): CollabAPI {
  return new CollabAPI(client);
}
