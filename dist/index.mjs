import {
  TranscribeAPI,
  createTranscribeAPI
} from "./chunk-4FEYRCCA.mjs";
import "./chunk-M6FKIX75.mjs";
import {
  UsbAPI,
  createUsbAPI
} from "./chunk-DWXWAILB.mjs";
import {
  VaultAPI,
  createVaultAPI
} from "./chunk-FLEFYLDM.mjs";
import {
  VoiceAPI,
  createVoiceAPI
} from "./chunk-M4Z33V3N.mjs";
import {
  ZoomAPI,
  createZoomAPI
} from "./chunk-MRFDPPFK.mjs";
import {
  SentimentAPI,
  createSentimentAPI
} from "./chunk-ZGIGCD65.mjs";
import {
  SignageAPI,
  createSignageAPI
} from "./chunk-IVFZ5X4W.mjs";
import {
  SlidesAPI,
  createSlidesAPI
} from "./chunk-VPKZUXZW.mjs";
import {
  StudioAIAPI,
  createStudioAIAPI
} from "./chunk-KLDVKJ7A.mjs";
import "./chunk-4KD5F6E3.mjs";
import {
  StudioAPI,
  createStudioAPI
} from "./chunk-YT4W5JE2.mjs";
import "./chunk-XMM5J57W.mjs";
import {
  QrAPI,
  createQrAPI
} from "./chunk-362MRITF.mjs";
import {
  RealtimeAPI,
  RealtimeChannel,
  createRealtimeAPI
} from "./chunk-TV3ALDR6.mjs";
import "./chunk-WFZNI3GO.mjs";
import {
  SceneAPI,
  createSceneAPI
} from "./chunk-IGJSHXAK.mjs";
import "./chunk-IL2SGWBC.mjs";
import {
  SearchAPI,
  createSearchAPI
} from "./chunk-D6F2RWAB.mjs";
import "./chunk-ZJO7AP4Q.mjs";
import {
  PhoneAPI,
  createPhoneAPI
} from "./chunk-22SGCZJ7.mjs";
import {
  PipelineAPI,
  createPipelineAPI
} from "./chunk-O6DOGYP5.mjs";
import {
  PodcastAPI,
  createPodcastAPI
} from "./chunk-3ZLK4J3V.mjs";
import {
  PrismAPI,
  createPrismAPI
} from "./chunk-C2GQ756E.mjs";
import {
  PulseAPI,
  createPulseAPI
} from "./chunk-XGAYMWRH.mjs";
import {
  MailAPI,
  createMailAPI
} from "./chunk-I7WLHX3A.mjs";
import {
  MarketplaceAPI,
  createMarketplaceAPI
} from "./chunk-TXWOA2VR.mjs";
import {
  MeshAPI,
  createMeshAPI
} from "./chunk-VLQQDYGP.mjs";
import {
  MeterAPI,
  createMeterAPI
} from "./chunk-TWVSBUXD.mjs";
import {
  NotificationsAPI,
  createNotificationsAPI
} from "./chunk-K5X42NLD.mjs";
import {
  PerceptionAPI,
  createPerceptionAPI
} from "./chunk-ES62PO75.mjs";
import {
  DistributionAPI,
  createDistributionAPI
} from "./chunk-UCDSNV22.mjs";
import {
  DrmAPI,
  createDrmAPI
} from "./chunk-WS3PEFYJ.mjs";
import {
  EdgeAPI,
  createEdgeAPI
} from "./chunk-MXU3Q23F.mjs";
import {
  EditorAPI,
  createEditorAPI
} from "./chunk-5BUK73LK.mjs";
import "./chunk-YRKO4XI7.mjs";
import {
  FleetAPI,
  createFleetAPI
} from "./chunk-S25NY5GE.mjs";
import {
  GhostAPI,
  createGhostAPI
} from "./chunk-JC32PG3T.mjs";
import {
  ClipsAPI,
  createClipsAPI
} from "./chunk-AI64YR5W.mjs";
import {
  CollabAPI,
  createCollabAPI
} from "./chunk-T4FOXFZZ.mjs";
import "./chunk-YLCQKCZL.mjs";
import {
  ConnectAPI,
  createConnectAPI
} from "./chunk-NCVUZ746.mjs";
import {
  CreatorAPI,
  createCreatorAPI
} from "./chunk-LVOVF6XC.mjs";
import {
  DesktopAPI,
  createDesktopAPI
} from "./chunk-4DG4OBRD.mjs";
import {
  AudienceAPI,
  createAudienceAPI
} from "./chunk-4G7FMCMJ.mjs";
import {
  CaptionsAPI,
  createCaptionsAPI
} from "./chunk-WAVCHLOR.mjs";
import {
  ChaptersAPI,
  createChaptersAPI
} from "./chunk-QJNTSC7Y.mjs";
import {
  RateLimitError,
  WaveClient,
  WaveError,
  createClient
} from "./chunk-F6AZ2MA4.mjs";
import {
  initTelemetry,
  isTelemetryEnabled,
  resetTelemetry,
  withTelemetry,
  withTelemetrySync
} from "./chunk-YEK26SSO.mjs";
import "./chunk-Y6FXYEAI.mjs";

// src/index.ts
var Wave = class {
  client;
  // Existing (P3)
  clips;
  editor;
  voice;
  phone;
  collab;
  captions;
  chapters;
  studioAI;
  transcribe;
  sentiment;
  search;
  scene;
  // P1 - Core
  pipeline;
  studio;
  // P2 - Enterprise
  fleet;
  ghost;
  mesh;
  edge;
  pulse;
  prism;
  zoom;
  // P3 - Content & Commerce
  vault;
  marketplace;
  connect;
  distribution;
  desktop;
  signage;
  qr;
  audience;
  creator;
  // P4 - Specialized
  podcast;
  slides;
  usb;
  // Cross-cutting
  notifications;
  drm;
  // Realtime — live control & event plane (WebSocket)
  realtime;
  // Mail API (E5 — comms productization)
  mail;
  // Meter API (E5 — comms productization, meter:read)
  meter;
  // Perception — agentic live-media subscribe() control plane (#85)
  perception;
  constructor(config) {
    this.client = new WaveClient(config);
    this.clips = new ClipsAPI(this.client);
    this.editor = new EditorAPI(this.client);
    this.voice = new VoiceAPI(this.client);
    this.phone = new PhoneAPI(this.client);
    this.collab = new CollabAPI(this.client);
    this.captions = new CaptionsAPI(this.client);
    this.chapters = new ChaptersAPI(this.client);
    this.studioAI = new StudioAIAPI(this.client);
    this.transcribe = new TranscribeAPI(this.client);
    this.sentiment = new SentimentAPI(this.client);
    this.search = new SearchAPI(this.client);
    this.scene = new SceneAPI(this.client);
    this.pipeline = new PipelineAPI(this.client);
    this.studio = new StudioAPI(this.client);
    this.fleet = new FleetAPI(this.client);
    this.ghost = new GhostAPI(this.client);
    this.mesh = new MeshAPI(this.client);
    this.edge = new EdgeAPI(this.client);
    this.pulse = new PulseAPI(this.client);
    this.prism = new PrismAPI(this.client);
    this.zoom = new ZoomAPI(this.client);
    this.vault = new VaultAPI(this.client);
    this.marketplace = new MarketplaceAPI(this.client);
    this.connect = new ConnectAPI(this.client);
    this.distribution = new DistributionAPI(this.client);
    this.desktop = new DesktopAPI(this.client);
    this.signage = new SignageAPI(this.client);
    this.qr = new QrAPI(this.client);
    this.audience = new AudienceAPI(this.client);
    this.creator = new CreatorAPI(this.client);
    this.podcast = new PodcastAPI(this.client);
    this.slides = new SlidesAPI(this.client);
    this.usb = new UsbAPI(this.client);
    this.notifications = new NotificationsAPI(this.client);
    this.drm = new DrmAPI(this.client);
    this.realtime = new RealtimeAPI(this.client);
    this.mail = new MailAPI(this.client);
    this.meter = new MeterAPI(this.client);
    this.perception = new PerceptionAPI(this.client);
  }
};
function createWave(config) {
  return new Wave(config);
}
var index_default = Wave;
export {
  AudienceAPI,
  CaptionsAPI,
  ChaptersAPI,
  ClipsAPI,
  CollabAPI,
  ConnectAPI,
  CreatorAPI,
  DesktopAPI,
  DistributionAPI,
  DrmAPI,
  EdgeAPI,
  EditorAPI,
  FleetAPI,
  GhostAPI,
  MailAPI,
  MarketplaceAPI,
  MeshAPI,
  MeterAPI,
  NotificationsAPI,
  PerceptionAPI,
  PhoneAPI,
  PipelineAPI,
  PodcastAPI,
  PrismAPI,
  PulseAPI,
  QrAPI,
  RateLimitError,
  RealtimeAPI,
  RealtimeChannel,
  SceneAPI,
  SearchAPI,
  SentimentAPI,
  SignageAPI,
  SlidesAPI,
  StudioAIAPI,
  StudioAPI,
  TranscribeAPI,
  UsbAPI,
  VaultAPI,
  VoiceAPI,
  Wave,
  WaveClient,
  WaveError,
  ZoomAPI,
  createAudienceAPI,
  createCaptionsAPI,
  createChaptersAPI,
  createClient,
  createClipsAPI,
  createCollabAPI,
  createConnectAPI,
  createCreatorAPI,
  createDesktopAPI,
  createDistributionAPI,
  createDrmAPI,
  createEdgeAPI,
  createEditorAPI,
  createFleetAPI,
  createGhostAPI,
  createMailAPI,
  createMarketplaceAPI,
  createMeshAPI,
  createMeterAPI,
  createNotificationsAPI,
  createPerceptionAPI,
  createPhoneAPI,
  createPipelineAPI,
  createPodcastAPI,
  createPrismAPI,
  createPulseAPI,
  createQrAPI,
  createRealtimeAPI,
  createSceneAPI,
  createSearchAPI,
  createSentimentAPI,
  createSignageAPI,
  createSlidesAPI,
  createStudioAIAPI,
  createStudioAPI,
  createTranscribeAPI,
  createUsbAPI,
  createVaultAPI,
  createVoiceAPI,
  createWave,
  createZoomAPI,
  index_default as default,
  initTelemetry,
  isTelemetryEnabled,
  resetTelemetry,
  withTelemetry,
  withTelemetrySync
};
