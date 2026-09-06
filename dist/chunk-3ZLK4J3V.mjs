// src/podcast.ts
var PodcastAPI = class {
  client;
  basePath = "/v1/podcasts";
  constructor(client) {
    this.client = client;
  }
  async create(request) {
    return this.client.post(this.basePath, request);
  }
  async get(podcastId) {
    return this.client.get(`${this.basePath}/${podcastId}`);
  }
  async update(podcastId, updates) {
    return this.client.patch(`${this.basePath}/${podcastId}`, updates);
  }
  async remove(podcastId) {
    await this.client.delete(`${this.basePath}/${podcastId}`);
  }
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  async createEpisode(request) {
    return this.client.post(`${this.basePath}/${request.podcast_id}/episodes`, request);
  }
  async getEpisode(episodeId) {
    return this.client.get(`/v1/episodes/${episodeId}`);
  }
  async updateEpisode(episodeId, updates) {
    return this.client.patch(`/v1/episodes/${episodeId}`, updates);
  }
  async removeEpisode(episodeId) {
    await this.client.delete(`/v1/episodes/${episodeId}`);
  }
  async publishEpisode(episodeId) {
    return this.client.post(`/v1/episodes/${episodeId}/publish`);
  }
  async listEpisodes(podcastId, params) {
    return this.client.get(`${this.basePath}/${podcastId}/episodes`, {
      params
    });
  }
  async getRSSFeed(podcastId) {
    return this.client.get(`${this.basePath}/${podcastId}/rss`);
  }
  async getAnalytics(podcastId, params) {
    return this.client.get(`${this.basePath}/${podcastId}/analytics`, {
      params
    });
  }
  async distribute(podcastId, targets) {
    return this.client.post(`${this.basePath}/${podcastId}/distribute`, {
      targets
    });
  }
  async getDistributionStatus(podcastId) {
    return this.client.get(`${this.basePath}/${podcastId}/distribution`);
  }
};
function createPodcastAPI(client) {
  return new PodcastAPI(client);
}

export {
  PodcastAPI,
  createPodcastAPI
};
