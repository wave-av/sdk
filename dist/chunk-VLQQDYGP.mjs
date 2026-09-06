// src/mesh.ts
var MeshAPI = class {
  client;
  basePath = "/v1/mesh";
  constructor(client) {
    this.client = client;
  }
  // ==========================================================================
  // Regions
  // ==========================================================================
  /**
   * List mesh regions with optional filters
   *
   * Requires: mesh:read permission
   */
  async listRegions(params) {
    const queryParams = {
      limit: params?.limit,
      offset: params?.offset,
      cursor: params?.cursor,
      status: params?.status,
      provider: params?.provider
    };
    return this.client.get(`${this.basePath}/regions`, {
      params: queryParams
    });
  }
  /**
   * Get a region by ID
   *
   * Requires: mesh:read permission
   */
  async getRegion(regionId) {
    return this.client.get(`${this.basePath}/regions/${regionId}`);
  }
  /**
   * Get health details for a region
   *
   * Requires: mesh:read permission
   */
  async getRegionHealth(regionId) {
    return this.client.get(`${this.basePath}/regions/${regionId}/health`);
  }
  // ==========================================================================
  // Peers
  // ==========================================================================
  /**
   * List mesh peers, optionally filtered by region
   *
   * Requires: mesh:read permission
   */
  async listPeers(regionId) {
    const queryParams = {
      region_id: regionId
    };
    return this.client.get(`${this.basePath}/peers`, {
      params: queryParams
    });
  }
  /**
   * Add a peer to a region
   *
   * Requires: mesh:create permission
   */
  async addPeer(regionId, endpoint) {
    return this.client.post(`${this.basePath}/peers`, {
      region_id: regionId,
      endpoint
    });
  }
  /**
   * Remove a peer
   *
   * Requires: mesh:remove permission (server-side RBAC enforced)
   */
  async removePeer(peerId) {
    await this.client.delete(`${this.basePath}/peers/${peerId}`);
  }
  // ==========================================================================
  // Failover Policies
  // ==========================================================================
  /**
   * Create a failover policy
   *
   * Requires: mesh:create permission
   */
  async createPolicy(request) {
    return this.client.post(`${this.basePath}/policies`, request);
  }
  /**
   * Update a failover policy
   *
   * Requires: mesh:update permission
   */
  async updatePolicy(policyId, updates) {
    return this.client.patch(`${this.basePath}/policies/${policyId}`, updates);
  }
  /**
   * Remove a failover policy
   *
   * Requires: mesh:remove permission (server-side RBAC enforced)
   */
  async removePolicy(policyId) {
    await this.client.delete(`${this.basePath}/policies/${policyId}`);
  }
  /**
   * List failover policies
   *
   * Requires: mesh:read permission
   */
  async listPolicies(params) {
    return this.client.get(`${this.basePath}/policies`, {
      params
    });
  }
  // ==========================================================================
  // Failover Operations
  // ==========================================================================
  /**
   * Trigger a manual failover to a target region
   *
   * Requires: mesh:failover permission
   */
  async triggerFailover(policyId, targetRegion) {
    return this.client.post(`${this.basePath}/policies/${policyId}/failover`, {
      target_region: targetRegion
    });
  }
  /**
   * Get failover event history for a policy
   *
   * Requires: mesh:read permission
   */
  async getFailoverHistory(policyId, params) {
    return this.client.get(
      `${this.basePath}/policies/${policyId}/events`,
      { params }
    );
  }
  // ==========================================================================
  // Replication & Topology
  // ==========================================================================
  /**
   * Get replication status between regions
   *
   * Requires: mesh:read permission
   */
  async getReplicationStatus(sourceRegion, targetRegion) {
    const queryParams = {
      source_region: sourceRegion,
      target_region: targetRegion
    };
    return this.client.get(`${this.basePath}/replication`, {
      params: queryParams
    });
  }
  /**
   * Get the full mesh topology (regions, peers, and policies)
   *
   * Requires: mesh:read permission
   */
  async getTopology() {
    return this.client.get(`${this.basePath}/topology`);
  }
};
function createMeshAPI(client) {
  return new MeshAPI(client);
}

export {
  MeshAPI,
  createMeshAPI
};
