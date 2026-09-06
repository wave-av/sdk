// src/drm.ts
var DrmAPI = class {
  client;
  basePath = "/v1/drm";
  constructor(client) {
    this.client = client;
  }
  /** Create a DRM policy. */
  async createPolicy(request) {
    return this.client.post(`${this.basePath}/policies`, request);
  }
  /** Get a DRM policy by ID. */
  async getPolicy(policyId) {
    return this.client.get(`${this.basePath}/policies/${policyId}`);
  }
  /** List DRM policies. */
  async listPolicies(params) {
    return this.client.get(`${this.basePath}/policies`, {
      params
    });
  }
  /** Update a DRM policy. */
  async updatePolicy(policyId, updates) {
    return this.client.patch(`${this.basePath}/policies/${policyId}`, updates);
  }
  /** Delete a DRM policy. */
  async removePolicy(policyId) {
    await this.client.delete(`${this.basePath}/policies/${policyId}`);
  }
  /** Get a DRM certificate for a provider. */
  async getCertificate(provider) {
    return this.client.get(`${this.basePath}/certificate/${provider}`);
  }
  /** Issue a license for an asset. */
  async issueLicense(assetId, policyId, deviceId) {
    return this.client.post(`${this.basePath}/license`, {
      asset_id: assetId,
      policy_id: policyId,
      device_id: deviceId
    });
  }
  /** Revoke a license. */
  async revokeLicense(licenseId) {
    return this.client.post(`${this.basePath}/license/${licenseId}/revoke`);
  }
  /** List licenses for an asset or user. */
  async listLicenses(params) {
    return this.client.get(`${this.basePath}/licenses`, {
      params
    });
  }
};
function createDrmAPI(client) {
  return new DrmAPI(client);
}

export {
  DrmAPI,
  createDrmAPI
};
