// src/slides.ts
var SlidesAPI = class {
  client;
  basePath = "/v1/slides";
  constructor(client) {
    this.client = client;
  }
  async convert(request) {
    return this.client.post(this.basePath, request);
  }
  async get(conversionId) {
    return this.client.get(`${this.basePath}/${conversionId}`);
  }
  async list(params) {
    return this.client.get(this.basePath, {
      params
    });
  }
  async remove(conversionId) {
    await this.client.delete(`${this.basePath}/${conversionId}`);
  }
  async getProgress(conversionId) {
    return this.client.get(
      `${this.basePath}/${conversionId}/progress`
    );
  }
  async addNarration(conversionId, narrations) {
    return this.client.post(`${this.basePath}/${conversionId}/narration`, {
      narrations
    });
  }
  async waitForReady(conversionId, options) {
    const pollInterval = options?.pollInterval || 3e3;
    const timeout = options?.timeout || 6e5;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const conversion = await this.get(conversionId);
      if (conversion.status === "ready") return conversion;
      if (conversion.status === "failed")
        throw new Error(`Conversion failed: ${conversion.error || "Unknown"}`);
      await new Promise((r) => setTimeout(r, pollInterval));
    }
    throw new Error(`Conversion timed out after ${timeout}ms`);
  }
};
function createSlidesAPI(client) {
  return new SlidesAPI(client);
}

export {
  SlidesAPI,
  createSlidesAPI
};
