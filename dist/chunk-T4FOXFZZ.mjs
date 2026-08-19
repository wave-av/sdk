// src/collab.ts
var CollabAPI = class {
  client;
  basePath = "/v1/collab";
  constructor(client) {
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
  async createRoom(request) {
    return this.client.post(`${this.basePath}/rooms`, request);
  }
  /**
   * Get a room by ID
   *
   * Requires: collab:read permission
   */
  async getRoom(roomId) {
    return this.client.get(`${this.basePath}/rooms/${roomId}`);
  }
  /**
   * Update a room
   *
   * Requires: collab:update permission
   */
  async updateRoom(roomId, request) {
    return this.client.patch(
      `${this.basePath}/rooms/${roomId}`,
      request
    );
  }
  /**
   * Close a room
   *
   * Requires: collab:manage permission
   */
  async closeRoom(roomId) {
    return this.client.post(`${this.basePath}/rooms/${roomId}/close`);
  }
  /**
   * Archive a room
   *
   * Requires: collab:manage permission (server-side RBAC enforced)
   */
  async archiveRoom(roomId) {
    await this.client.delete(
      `${this.basePath}/rooms/${roomId}`,
      { method: "DELETE" }
    );
  }
  /**
   * List rooms
   *
   * Requires: collab:read permission
   */
  async listRooms(params) {
    return this.client.get(
      `${this.basePath}/rooms`,
      { params }
    );
  }
  /**
   * Get join token for real-time connection
   *
   * Requires: collab:join permission
   */
  async getJoinToken(roomId, options) {
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
  async listParticipants(roomId, params) {
    return this.client.get(
      `${this.basePath}/rooms/${roomId}/participants`,
      { params }
    );
  }
  /**
   * Get a participant
   *
   * Requires: collab:read permission
   */
  async getParticipant(roomId, participantId) {
    return this.client.get(
      `${this.basePath}/rooms/${roomId}/participants/${participantId}`
    );
  }
  /**
   * Update a participant's role
   *
   * Requires: collab:manage permission
   */
  async updateParticipant(roomId, participantId, updates) {
    return this.client.patch(
      `${this.basePath}/rooms/${roomId}/participants/${participantId}`,
      updates
    );
  }
  /**
   * Remove a participant from a room
   *
   * Requires: collab:manage permission (server-side RBAC enforced)
   */
  async removeParticipant(roomId, participantId) {
    await this.client.delete(
      `${this.basePath}/rooms/${roomId}/participants/${participantId}`,
      { method: "DELETE" }
    );
  }
  /**
   * Invite users to a room
   *
   * Requires: collab:invite permission
   */
  async invite(roomId, invites) {
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
  async addComment(roomId, comment) {
    return this.client.post(
      `${this.basePath}/rooms/${roomId}/comments`,
      comment
    );
  }
  /**
   * List comments
   *
   * Requires: collab:read permission
   */
  async listComments(roomId, params) {
    return this.client.get(
      `${this.basePath}/rooms/${roomId}/comments`,
      { params }
    );
  }
  /**
   * Update a comment
   *
   * Requires: collab:comment permission (own comments) or collab:manage
   */
  async updateComment(roomId, commentId, updates) {
    return this.client.patch(
      `${this.basePath}/rooms/${roomId}/comments/${commentId}`,
      updates
    );
  }
  /**
   * Remove a comment
   *
   * Requires: collab:comment permission (own) or collab:manage (server-side RBAC enforced)
   */
  async removeComment(roomId, commentId) {
    await this.client.delete(
      `${this.basePath}/rooms/${roomId}/comments/${commentId}`,
      { method: "DELETE" }
    );
  }
  /**
   * Add a reaction to a comment
   *
   * Requires: collab:comment permission
   */
  async addReaction(roomId, commentId, emoji) {
    return this.client.post(
      `${this.basePath}/rooms/${roomId}/comments/${commentId}/reactions`,
      { emoji }
    );
  }
  /**
   * Remove a reaction from a comment
   *
   * Requires: collab:comment permission (server-side RBAC enforced)
   */
  async removeReaction(roomId, commentId, emoji) {
    await this.client.delete(
      `${this.basePath}/rooms/${roomId}/comments/${commentId}/reactions`,
      { method: "DELETE", params: { emoji } }
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
  async addAnnotation(roomId, annotation) {
    return this.client.post(
      `${this.basePath}/rooms/${roomId}/annotations`,
      annotation
    );
  }
  /**
   * List annotations
   *
   * Requires: collab:read permission
   */
  async listAnnotations(roomId, params) {
    return this.client.get(
      `${this.basePath}/rooms/${roomId}/annotations`,
      { params }
    );
  }
  /**
   * Update an annotation
   *
   * Requires: collab:annotate permission (own) or collab:manage
   */
  async updateAnnotation(roomId, annotationId, updates) {
    return this.client.patch(
      `${this.basePath}/rooms/${roomId}/annotations/${annotationId}`,
      updates
    );
  }
  /**
   * Remove an annotation
   *
   * Requires: collab:annotate permission (own) or collab:manage (server-side RBAC enforced)
   */
  async removeAnnotation(roomId, annotationId) {
    await this.client.delete(
      `${this.basePath}/rooms/${roomId}/annotations/${annotationId}`,
      { method: "DELETE" }
    );
  }
  /**
   * Clear all annotations
   *
   * Requires: collab:manage permission
   */
  async clearAnnotations(roomId) {
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
  async startRecording(roomId) {
    return this.client.post(`${this.basePath}/rooms/${roomId}/recording/start`);
  }
  /**
   * Stop recording
   *
   * Requires: collab:record permission
   */
  async stopRecording(roomId) {
    return this.client.post(`${this.basePath}/rooms/${roomId}/recording/stop`);
  }
  /**
   * Get recording status
   *
   * Requires: collab:read permission
   */
  async getRecordingStatus(roomId) {
    return this.client.get(`${this.basePath}/rooms/${roomId}/recording`);
  }
};
function createCollabAPI(client) {
  return new CollabAPI(client);
}

export {
  CollabAPI,
  createCollabAPI
};
