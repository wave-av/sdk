import "./chunk-Y6FXYEAI.mjs";

// src/prompter.ts
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
export {
  createPrompterApi
};
