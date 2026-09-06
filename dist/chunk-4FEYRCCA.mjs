// src/transcribe.ts
var TranscribeAPI = class {
  client;
  basePath = "/v1/transcribe";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Transcriptions
  // ==========================================================================
  /**
   * Create a transcription job
   *
   * Requires: transcribe:create permission
   */
  async create(request) {
    return this.client.post(this.basePath, request);
  }
  /**
   * Get a transcription by ID
   *
   * Requires: transcribe:read permission
   */
  async get(transcriptionId) {
    return this.client.get(`${this.basePath}/${transcriptionId}`);
  }
  /**
   * Update a transcription
   *
   * Requires: transcribe:update permission
   */
  async update(transcriptionId, request) {
    return this.client.patch(
      `${this.basePath}/${transcriptionId}`,
      request
    );
  }
  /**
   * Remove a transcription
   *
   * Requires: transcribe:remove permission (server-side RBAC enforced)
   */
  async remove(transcriptionId) {
    await this.client.delete(
      `${this.basePath}/${transcriptionId}`,
      { method: "DELETE" }
    );
  }
  /**
   * List transcriptions
   *
   * Requires: transcribe:read permission
   */
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  // ==========================================================================
  // Segments
  // ==========================================================================
  /**
   * Get transcription segments
   *
   * Requires: transcribe:read permission
   */
  async getSegments(transcriptionId, params) {
    return this.client.get(
      `${this.basePath}/${transcriptionId}/segments`,
      { params }
    );
  }
  /**
   * Update a segment
   *
   * Requires: transcribe:update permission
   */
  async updateSegment(transcriptionId, segmentId, updates) {
    return this.client.patch(
      `${this.basePath}/${transcriptionId}/segments/${segmentId}`,
      updates
    );
  }
  /**
   * Merge segments
   *
   * Requires: transcribe:update permission
   */
  async mergeSegments(transcriptionId, segmentIds) {
    return this.client.post(
      `${this.basePath}/${transcriptionId}/segments/merge`,
      { segment_ids: segmentIds }
    );
  }
  /**
   * Split a segment
   *
   * Requires: transcribe:update permission
   */
  async splitSegment(transcriptionId, segmentId, splitTime) {
    return this.client.post(
      `${this.basePath}/${transcriptionId}/segments/${segmentId}/split`,
      { split_time: splitTime }
    );
  }
  // ==========================================================================
  // Speakers
  // ==========================================================================
  /**
   * Get speakers
   *
   * Requires: transcribe:read permission
   */
  async getSpeakers(transcriptionId) {
    return this.client.get(
      `${this.basePath}/${transcriptionId}/speakers`
    );
  }
  /**
   * Update speaker label
   *
   * Requires: transcribe:update permission
   */
  async updateSpeaker(transcriptionId, speakerId, label) {
    return this.client.patch(
      `${this.basePath}/${transcriptionId}/speakers/${speakerId}`,
      { label }
    );
  }
  /**
   * Merge speakers
   *
   * Requires: transcribe:update permission
   */
  async mergeSpeakers(transcriptionId, speakerIds, newLabel) {
    return this.client.post(
      `${this.basePath}/${transcriptionId}/speakers/merge`,
      { speaker_ids: speakerIds, label: newLabel }
    );
  }
  // ==========================================================================
  // Export
  // ==========================================================================
  /**
   * Export transcription
   *
   * Requires: transcribe:read permission
   */
  async exportTranscription(transcriptionId, format, options) {
    return this.client.post(`${this.basePath}/${transcriptionId}/export`, {
      format,
      ...options
    });
  }
  /**
   * Get plain text transcript
   *
   * Requires: transcribe:read permission
   */
  async getText(transcriptionId, options) {
    const result = await this.client.get(
      `${this.basePath}/${transcriptionId}/text`,
      { params: options }
    );
    return result.text;
  }
  // ==========================================================================
  // Search
  // ==========================================================================
  /**
   * Search within a transcription
   *
   * Requires: transcribe:read permission
   */
  async search(transcriptionId, query, options) {
    return this.client.post(`${this.basePath}/${transcriptionId}/search`, {
      query,
      ...options
    });
  }
  // ==========================================================================
  // Real-time
  // ==========================================================================
  /**
   * Start real-time transcription
   *
   * Requires: transcribe:realtime permission
   */
  async startRealtime(streamId, options) {
    return this.client.post(`${this.basePath}/realtime/start`, {
      stream_id: streamId,
      ...options
    });
  }
  /**
   * Stop real-time transcription
   *
   * Requires: transcribe:realtime permission
   */
  async stopRealtime(sessionId) {
    return this.client.post(
      `${this.basePath}/realtime/${sessionId}/stop`
    );
  }
  /**
   * Get real-time session status
   *
   * Requires: transcribe:read permission
   */
  async getRealtimeStatus(sessionId) {
    return this.client.get(`${this.basePath}/realtime/${sessionId}`);
  }
  // ==========================================================================
  // Utilities
  // ==========================================================================
  /**
   * Wait for transcription to complete
   */
  async waitForReady(transcriptionId, options) {
    const pollInterval = options?.pollInterval || 2e3;
    const timeout = options?.timeout || 18e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const transcription = await this.get(transcriptionId);
      if (options?.onProgress) {
        options.onProgress(transcription);
      }
      if (transcription.status === "ready") {
        return transcription;
      }
      if (transcription.status === "failed") {
        throw new Error(
          `Transcription failed: ${transcription.error || "Unknown error"}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(`Transcription timed out after ${timeout}ms`);
  }
  /**
   * Detect language from audio
   *
   * Requires: transcribe:read permission
   */
  async detectLanguage(sourceUrl) {
    return this.client.post(`${this.basePath}/detect-language`, {
      source_url: sourceUrl
    });
  }
  /**
   * Get supported languages
   *
   * Requires: transcribe:read permission
   */
  async getSupportedLanguages() {
    return this.client.get(`${this.basePath}/languages`);
  }
  /**
   * Estimate transcription cost
   *
   * Requires: transcribe:read permission
   */
  async estimateCost(durationSeconds, model = "standard", options) {
    return this.client.post(`${this.basePath}/estimate`, {
      duration_seconds: durationSeconds,
      model,
      ...options
    });
  }
};
function createTranscribeAPI(client) {
  return new TranscribeAPI(client);
}

export {
  TranscribeAPI,
  createTranscribeAPI
};
