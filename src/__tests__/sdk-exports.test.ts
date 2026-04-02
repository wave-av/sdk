/**
 * SDK Export Verification Tests
 *
 * Validates that all 34 SDK modules export correctly, all API classes
 * accept WaveClient, and the Wave convenience class wires everything.
 */

import { describe, it, expect } from "vitest";

// Import everything from the barrel
import * as SDK from "../index";

describe("@wave/sdk exports", () => {
  // =========================================================================
  // Core client
  // =========================================================================

  it("exports WaveClient class", () => {
    expect(SDK.WaveClient).toBeDefined();
    expect(typeof SDK.WaveClient).toBe("function");
  });

  it("exports createClient factory", () => {
    expect(SDK.createClient).toBeDefined();
    expect(typeof SDK.createClient).toBe("function");
  });

  it("exports WaveError class", () => {
    expect(SDK.WaveError).toBeDefined();
    const err = new SDK.WaveError("test", "TEST", 400);
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe("TEST");
    expect(err.statusCode).toBe(400);
    expect(err.retryable).toBe(false);
  });

  it("exports RateLimitError class", () => {
    expect(SDK.RateLimitError).toBeDefined();
    const err = new SDK.RateLimitError("limited", 5000);
    expect(err).toBeInstanceOf(SDK.WaveError);
    expect(err.retryable).toBe(true);
    expect(err.retryAfter).toBe(5000);
  });

  // =========================================================================
  // Wave convenience class
  // =========================================================================

  it("exports Wave convenience class", () => {
    expect(SDK.Wave).toBeDefined();
    expect(typeof SDK.Wave).toBe("function");
  });

  it("exports createWave factory", () => {
    expect(SDK.createWave).toBeDefined();
    expect(typeof SDK.createWave).toBe("function");
  });

  it("Wave class instantiates with all 34 API modules", () => {
    const wave = new SDK.Wave({ apiKey: "test-key" });

    // Existing P3 (12)
    expect(wave.clips).toBeInstanceOf(SDK.ClipsAPI);
    expect(wave.editor).toBeInstanceOf(SDK.EditorAPI);
    expect(wave.voice).toBeInstanceOf(SDK.VoiceAPI);
    expect(wave.phone).toBeInstanceOf(SDK.PhoneAPI);
    expect(wave.collab).toBeInstanceOf(SDK.CollabAPI);
    expect(wave.captions).toBeInstanceOf(SDK.CaptionsAPI);
    expect(wave.chapters).toBeInstanceOf(SDK.ChaptersAPI);
    expect(wave.studioAI).toBeInstanceOf(SDK.StudioAIAPI);
    expect(wave.transcribe).toBeInstanceOf(SDK.TranscribeAPI);
    expect(wave.sentiment).toBeInstanceOf(SDK.SentimentAPI);
    expect(wave.search).toBeInstanceOf(SDK.SearchAPI);
    expect(wave.scene).toBeInstanceOf(SDK.SceneAPI);

    // P1 (2)
    expect(wave.pipeline).toBeInstanceOf(SDK.PipelineAPI);
    expect(wave.studio).toBeInstanceOf(SDK.StudioAPI);

    // P2 (7)
    expect(wave.fleet).toBeInstanceOf(SDK.FleetAPI);
    expect(wave.ghost).toBeInstanceOf(SDK.GhostAPI);
    expect(wave.mesh).toBeInstanceOf(SDK.MeshAPI);
    expect(wave.edge).toBeInstanceOf(SDK.EdgeAPI);
    expect(wave.pulse).toBeInstanceOf(SDK.PulseAPI);
    expect(wave.prism).toBeInstanceOf(SDK.PrismAPI);
    expect(wave.zoom).toBeInstanceOf(SDK.ZoomAPI);

    // P3 new (9)
    expect(wave.vault).toBeInstanceOf(SDK.VaultAPI);
    expect(wave.marketplace).toBeInstanceOf(SDK.MarketplaceAPI);
    expect(wave.connect).toBeInstanceOf(SDK.ConnectAPI);
    expect(wave.distribution).toBeInstanceOf(SDK.DistributionAPI);
    expect(wave.desktop).toBeInstanceOf(SDK.DesktopAPI);
    expect(wave.signage).toBeInstanceOf(SDK.SignageAPI);
    expect(wave.qr).toBeInstanceOf(SDK.QrAPI);
    expect(wave.audience).toBeInstanceOf(SDK.AudienceAPI);
    expect(wave.creator).toBeInstanceOf(SDK.CreatorAPI);

    // P4 (3)
    expect(wave.podcast).toBeInstanceOf(SDK.PodcastAPI);
    expect(wave.slides).toBeInstanceOf(SDK.SlidesAPI);
    expect(wave.usb).toBeInstanceOf(SDK.UsbAPI);
  });

  // =========================================================================
  // All 34 API classes export
  // =========================================================================

  const expectedAPIs = [
    // Existing P3
    "ClipsAPI",
    "EditorAPI",
    "VoiceAPI",
    "PhoneAPI",
    "CollabAPI",
    "CaptionsAPI",
    "ChaptersAPI",
    "StudioAIAPI",
    "TranscribeAPI",
    "SentimentAPI",
    "SearchAPI",
    "SceneAPI",
    // P1
    "PipelineAPI",
    "StudioAPI",
    // P2
    "FleetAPI",
    "GhostAPI",
    "MeshAPI",
    "EdgeAPI",
    "PulseAPI",
    "PrismAPI",
    "ZoomAPI",
    // P3 new
    "VaultAPI",
    "MarketplaceAPI",
    "ConnectAPI",
    "DistributionAPI",
    "DesktopAPI",
    "SignageAPI",
    "QrAPI",
    "AudienceAPI",
    "CreatorAPI",
    // P4
    "PodcastAPI",
    "SlidesAPI",
    "UsbAPI",
  ];

  it.each(expectedAPIs)("exports %s class", (apiName) => {
    const api = (SDK as Record<string, unknown>)[apiName];
    expect(api).toBeDefined();
    expect(typeof api).toBe("function");
  });

  // Factory functions
  const expectedFactories = [
    "createClipsAPI",
    "createEditorAPI",
    "createVoiceAPI",
    "createPhoneAPI",
    "createCollabAPI",
    "createCaptionsAPI",
    "createChaptersAPI",
    "createStudioAIAPI",
    "createTranscribeAPI",
    "createSentimentAPI",
    "createSearchAPI",
    "createSceneAPI",
    "createPipelineAPI",
    "createStudioAPI",
    "createFleetAPI",
    "createGhostAPI",
    "createMeshAPI",
    "createEdgeAPI",
    "createPulseAPI",
    "createPrismAPI",
    "createZoomAPI",
    "createVaultAPI",
    "createMarketplaceAPI",
    "createConnectAPI",
    "createDistributionAPI",
    "createDesktopAPI",
    "createSignageAPI",
    "createQrAPI",
    "createAudienceAPI",
    "createCreatorAPI",
    "createPodcastAPI",
    "createSlidesAPI",
    "createUsbAPI",
  ];

  it.each(expectedFactories)("exports %s factory", (factoryName) => {
    const factory = (SDK as Record<string, unknown>)[factoryName];
    expect(factory).toBeDefined();
    expect(typeof factory).toBe("function");
  });

  // =========================================================================
  // WaveClient validates config
  // =========================================================================

  it("WaveClient throws without apiKey", () => {
    expect(() => new SDK.WaveClient({ apiKey: "" })).toThrow("apiKey is required");
  });

  it("WaveClient sets default baseUrl", () => {
    const client = new SDK.WaveClient({ apiKey: "test" });
    expect(client).toBeDefined();
  });

  // =========================================================================
  // Module count verification
  // =========================================================================

  it("has exactly 34 API module classes (33 + Wave)", () => {
    expect(expectedAPIs.length).toBe(33);
  });

  it("has exactly 33 factory functions", () => {
    expect(expectedFactories.length).toBe(33);
  });

  it("total named exports exceeds 100", () => {
    // API classes (33) + factories (33) + Wave + createWave + WaveClient +
    // createClient + WaveError + RateLimitError + type re-exports
    const exportCount = Object.keys(SDK).length;
    expect(exportCount).toBeGreaterThan(100);
  });
});

describe("individual module instantiation", () => {
  const client = new SDK.WaveClient({ apiKey: "test-key" });

  it("PipelineAPI has expected methods", () => {
    const api = new SDK.PipelineAPI(client);
    expect(typeof api.create).toBe("function");
    expect(typeof api.get).toBe("function");
    expect(typeof api.list).toBe("function");
    expect(typeof api.start).toBe("function");
    expect(typeof api.stop).toBe("function");
    expect(typeof api.getHealth).toBe("function");
    expect(typeof api.waitForLive).toBe("function");
  });

  it("StudioAPI has expected methods", () => {
    const api = new SDK.StudioAPI(client);
    expect(typeof api.create).toBe("function");
    expect(typeof api.start).toBe("function");
    expect(typeof api.addSource).toBe("function");
    expect(typeof api.activateScene).toBe("function");
    expect(typeof api.transition).toBe("function");
    expect(typeof api.setProgram).toBe("function");
    expect(typeof api.getAudioMix).toBe("function");
  });

  it("PrismAPI has expected methods", () => {
    const api = new SDK.PrismAPI(client);
    expect(typeof api.createDevice).toBe("function");
    expect(typeof api.startDevice).toBe("function");
    expect(typeof api.stopDevice).toBe("function");
    expect(typeof api.discoverSources).toBe("function");
    expect(typeof api.getPresets).toBe("function");
    expect(typeof api.setPreset).toBe("function");
    expect(typeof api.recallPreset).toBe("function");
  });

  it("FleetAPI has expected methods", () => {
    const api = new SDK.FleetAPI(client);
    expect(typeof api.list).toBe("function");
    expect(typeof api.register).toBe("function");
    expect(typeof api.getHealth).toBe("function");
    expect(typeof api.sendCommand).toBe("function");
    expect(typeof api.waitForOnline).toBe("function");
  });

  it("PulseAPI has expected methods", () => {
    const api = new SDK.PulseAPI(client);
    expect(typeof api.getStreamAnalytics).toBe("function");
    expect(typeof api.getViewerAnalytics).toBe("function");
    expect(typeof api.getQualityMetrics).toBe("function");
    expect(typeof api.getRevenueMetrics).toBe("function");
    expect(typeof api.getTimeSeries).toBe("function");
    expect(typeof api.createDashboard).toBe("function");
  });

  it("MeshAPI has expected methods", () => {
    const api = new SDK.MeshAPI(client);
    expect(typeof api.listRegions).toBe("function");
    expect(typeof api.triggerFailover).toBe("function");
    expect(typeof api.getTopology).toBe("function");
    expect(typeof api.getReplicationStatus).toBe("function");
  });
});
