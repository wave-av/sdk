"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/prompter.ts
var prompter_exports = {};
__export(prompter_exports, {
  createPrompterApi: () => createPrompterApi
});
module.exports = __toCommonJS(prompter_exports);
function createPrompterApi(client) {
  const basePath = "/api/v1/prompter";
  return {
    scripts: {
      async list(params) {
        return client.get(`${basePath}/scripts`, { params });
      },
      async get(scriptId) {
        return client.get(`${basePath}/scripts/${scriptId}`);
      },
      async create(input) {
        return client.post(`${basePath}/scripts`, input);
      },
      async update(scriptId, input) {
        return client.patch(`${basePath}/scripts/${scriptId}`, input);
      },
      async delete(scriptId) {
        return client.delete(`${basePath}/scripts/${scriptId}`);
      },
      async versions(scriptId) {
        return client.get(`${basePath}/scripts/${scriptId}/versions`);
      },
      async restoreVersion(scriptId, versionNumber) {
        return client.post(`${basePath}/scripts/${scriptId}/restore`, { versionNumber });
      }
    },
    async generate(input) {
      return client.post(`${basePath}/generate`, input);
    },
    async translate(scriptId, targetLanguage) {
      return client.post(`${basePath}/scripts/${scriptId}/translate`, { targetLanguage });
    },
    sessions: {
      async start(input) {
        return client.post(`${basePath}/sessions`, input);
      },
      async get(sessionId) {
        return client.get(`${basePath}/sessions/${sessionId}`);
      },
      async pause(sessionId) {
        return client.post(`${basePath}/sessions/${sessionId}/pause`);
      },
      async resume(sessionId) {
        return client.post(`${basePath}/sessions/${sessionId}/resume`);
      },
      async end(sessionId) {
        return client.post(`${basePath}/sessions/${sessionId}/end`);
      },
      async analytics(sessionId) {
        return client.get(`${basePath}/sessions/${sessionId}/analytics`);
      },
      async list(params) {
        return client.get(`${basePath}/sessions`, { params });
      }
    },
    templates: {
      async search(params) {
        return client.get(`${basePath}/templates`, { params });
      },
      async use(templateId) {
        return client.post(`${basePath}/templates/${templateId}/use`);
      }
    },
    usage: {
      async summary(periodStart, periodEnd) {
        return client.get(`${basePath}/usage`, { params: { periodStart, periodEnd } });
      }
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createPrompterApi
});
