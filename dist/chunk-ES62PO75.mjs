// src/perception.ts
var PerceptionAPI = class {
  client;
  basePath = "/v1/perception";
  constructor(client) {
    this.client = client;
  }
  /** Open a perception session over any transport. Returns the receive descriptor + subscription id + meter binding. */
  async subscribe(request) {
    return this.client.post(`${this.basePath}/subscribe`, request);
  }
  /** Close a subscription (idempotent control-plane close ack). `id` is the `psub_…` from {@link subscribe}. */
  async unsubscribe(subscriptionId) {
    await this.client.delete(`${this.basePath}/subscribe/${subscriptionId}`);
  }
  /** The single populated receive URL for a subscription, regardless of transport (convenience for receivers). */
  static receiveUrl(sub) {
    return sub.receive.whep_url ?? sub.receive.srt_url;
  }
};
function createPerceptionAPI(client) {
  return new PerceptionAPI(client);
}

export {
  PerceptionAPI,
  createPerceptionAPI
};
