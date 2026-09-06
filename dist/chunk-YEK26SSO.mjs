import {
  __require
} from "./chunk-Y6FXYEAI.mjs";

// src/telemetry.ts
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
    const otelApi = __require("@opentelemetry/api");
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

export {
  initTelemetry,
  resetTelemetry,
  isTelemetryEnabled,
  withTelemetry,
  withTelemetrySync
};
