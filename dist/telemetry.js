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

// src/telemetry.ts
var telemetry_exports = {};
__export(telemetry_exports, {
  initTelemetry: () => initTelemetry,
  isTelemetryEnabled: () => isTelemetryEnabled,
  resetTelemetry: () => resetTelemetry,
  withTelemetry: () => withTelemetry,
  withTelemetrySync: () => withTelemetrySync
});
module.exports = __toCommonJS(telemetry_exports);
var SPAN_STATUS_OK = 1;
var SPAN_STATUS_ERROR = 2;
var resolvedTracer = null;
var telemetryEnabled = false;
function initTelemetry(config) {
  if (!config.enabled) {
    telemetryEnabled = false;
    resolvedTracer = null;
    return;
  }
  try {
    const otelApi = require("@opentelemetry/api");
    const serviceName = config.serviceName ?? "@wave/sdk";
    resolvedTracer = otelApi.trace.getTracer(serviceName, "2.0.0");
    telemetryEnabled = true;
  } catch {
    telemetryEnabled = false;
    resolvedTracer = null;
  }
}
function resetTelemetry() {
  telemetryEnabled = false;
  resolvedTracer = null;
}
function isTelemetryEnabled() {
  return telemetryEnabled;
}
async function withTelemetry(operationName, fn, attributes) {
  if (!telemetryEnabled || !resolvedTracer) {
    return fn();
  }
  const span = resolvedTracer.startSpan(`wave.sdk.${operationName}`);
  const startTime = performance.now();
  try {
    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        span.setAttribute(key, value);
      }
    }
    const result = await fn();
    const durationMs = performance.now() - startTime;
    span.setAttribute("wave.sdk.method", operationName);
    span.setAttribute("wave.sdk.duration_ms", Math.round(durationMs));
    span.setStatus({ code: SPAN_STATUS_OK });
    span.end();
    return result;
  } catch (error) {
    const durationMs = performance.now() - startTime;
    span.setAttribute("wave.sdk.method", operationName);
    span.setAttribute("wave.sdk.duration_ms", Math.round(durationMs));
    const errorType = error instanceof Error ? error.constructor.name : "UnknownError";
    span.setAttribute("wave.sdk.error_type", errorType);
    span.setStatus({ code: SPAN_STATUS_ERROR });
    span.end();
    throw error;
  }
}
function withTelemetrySync(operationName, fn, attributes) {
  if (!telemetryEnabled || !resolvedTracer) {
    return fn();
  }
  const span = resolvedTracer.startSpan(`wave.sdk.${operationName}`);
  const startTime = performance.now();
  try {
    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        span.setAttribute(key, value);
      }
    }
    const result = fn();
    const durationMs = performance.now() - startTime;
    span.setAttribute("wave.sdk.method", operationName);
    span.setAttribute("wave.sdk.duration_ms", Math.round(durationMs));
    span.setStatus({ code: SPAN_STATUS_OK });
    span.end();
    return result;
  } catch (error) {
    const durationMs = performance.now() - startTime;
    span.setAttribute("wave.sdk.method", operationName);
    span.setAttribute("wave.sdk.duration_ms", Math.round(durationMs));
    const errorType = error instanceof Error ? error.constructor.name : "UnknownError";
    span.setAttribute("wave.sdk.error_type", errorType);
    span.setStatus({ code: SPAN_STATUS_ERROR });
    span.end();
    throw error;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  initTelemetry,
  isTelemetryEnabled,
  resetTelemetry,
  withTelemetry,
  withTelemetrySync
});
