// src/meter.ts
var MeterAPI = class {
  client;
  basePath = "/v1/meter";
  constructor(client) {
    this.client = client;
  }
  /** Fetch ledger rows for the given time window and optional channel filter. */
  async ledger(params) {
    return this.client.get(`${this.basePath}/ledger`, {
      params
    });
  }
  /** Fetch aggregated rollup totals for the given period. */
  async rollup(params) {
    return this.client.get(`${this.basePath}/ledger/rollup`, {
      params
    });
  }
};
function createMeterAPI(client) {
  return new MeterAPI(client);
}

export {
  MeterAPI,
  createMeterAPI
};
