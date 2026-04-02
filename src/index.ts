/**
 * WAVE SDK - Official TypeScript SDK
 *
 * A comprehensive SDK for interacting with all WAVE API products across
 * streaming, production, device management, analytics, content, and more.
 *
 * @packageDocumentation
 */

// Core client
export {
  WaveClient,
  createClient,
  WaveError,
  RateLimitError,
  type WaveClientConfig,
  type RequestOptions,
  type WaveAPIErrorResponse,
  type WaveClientEvents,
  type PaginationParams,
  type PaginatedResponse,
  type MediaType,
  type Timestamps,
  type Metadata,
} from "./client";

// Clips API
export {
  ClipsAPI,
  createClipsAPI,
  type Clip,
  type ClipStatus,
  type ClipExportFormat,
  type ClipQualityPreset,
  type ClipSource,
  type CreateClipRequest,
  type UpdateClipRequest,
  type ListClipsParams,
  type ExportClipRequest,
  type ClipExport,
  type ClipHighlight,
} from "./clips";

// Editor API
export {
  EditorAPI,
  createEditorAPI,
  type EditorProject,
  type ProjectStatus,
  type Track,
  type TrackType,
  type TimelineElement,
  type Transition,
  type TransitionType,
  type Effect,
  type EffectType,
  type Keyframe,
  type TextOverlay,
  type TextAnimation,
  type CreateProjectRequest,
  type UpdateProjectRequest,
  type AddElementRequest,
  type RenderOptions,
  type RenderJob,
  type ListProjectsParams,
} from "./editor";

// Voice API
export {
  VoiceAPI,
  createVoiceAPI,
  type Voice,
  type VoiceModelType,
  type VoiceGender,
  type AudioFormat,
  type SynthesizeRequest,
  type SynthesisResult,
  type CloneVoiceRequest,
  type VoiceCloneJob,
  type ListVoicesParams,
  type VoiceSettings,
} from "./voice";

// Phone API
export {
  PhoneAPI,
  createPhoneAPI,
  type PhoneNumber,
  type PhoneNumberType,
  type PhoneNumberCapabilities,
  type Call,
  type CallStatus,
  type CallDirection,
  type MakeCallRequest,
  type UpdateCallRequest,
  type Conference,
  type ConferenceParticipant,
  type SearchNumbersRequest,
  type AvailablePhoneNumber,
  type ListCallsParams,
} from "./phone";

// Collab API
export {
  CollabAPI,
  createCollabAPI,
  type CollabRoom,
  type RoomStatus,
  type RoomSettings,
  type Participant,
  type ParticipantRole,
  type ParticipantPermissions,
  type PresenceStatus,
  type CursorPosition,
  type Selection,
  type Comment,
  type Reaction,
  type Annotation,
  type CreateRoomRequest,
  type UpdateRoomRequest,
  type InviteRequest,
  type ListRoomsParams,
} from "./collab";

// Captions API
export {
  CaptionsAPI,
  createCaptionsAPI,
  type CaptionTrack,
  type CaptionStatus,
  type CaptionFormat,
  type CaptionCue,
  type CaptionWord,
  type CaptionStyle,
  type GenerateCaptionsRequest,
  type UploadCaptionsRequest,
  type UpdateCaptionsRequest,
  type TranslateCaptionsRequest,
  type BurnInCaptionsRequest,
  type BurnInJob,
  type ListCaptionsParams,
} from "./captions";

// Chapters API
export {
  ChaptersAPI,
  createChaptersAPI,
  type Chapter,
  type ChapterSet,
  type ChapterStatus,
  type GenerateChaptersRequest,
  type CreateChapterSetRequest,
  type CreateChapterRequest,
  type UpdateChapterRequest,
  type UpdateChapterSetRequest,
  type ListChapterSetsParams,
} from "./chapters";

// Studio AI API
export {
  StudioAIAPI,
  createStudioAIAPI,
  type AIAssistant,
  type AssistantMode,
  type AssistantConfig,
  type AssistantStats,
  type AISuggestion,
  type SuggestionPriority,
  type SuggestionStatus,
  type SuggestionAction,
  type SceneRecommendation,
  type GraphicsSuggestion,
  type AudioMixSuggestion,
  type ModerationAlert,
  type EngagementInsight,
  type StartAssistantRequest,
  type UpdateAssistantRequest,
  type ListSuggestionsParams,
} from "./studio-ai";

// Transcribe API
export {
  TranscribeAPI,
  createTranscribeAPI,
  type Transcription,
  type TranscriptionStatus,
  type TranscriptionModel,
  type TranscriptionSegment,
  type TranscriptionWord,
  type Speaker,
  type CreateTranscriptionRequest,
  type UpdateTranscriptionRequest,
  type ListTranscriptionsParams,
  type TranscriptExportFormat,
} from "./transcribe";

// Sentiment API
export {
  SentimentAPI,
  createSentimentAPI,
  type SentimentAnalysis,
  type AnalysisStatus,
  type SentimentLabel,
  type EmotionType,
  type SourceType,
  type SentimentSegment,
  type EmotionScore,
  type SentimentTrend,
  type SentimentSummary,
  type KeyMoment,
  type TopicSentiment,
  type CreateAnalysisRequest,
  type BatchAnalysisRequest,
  type ListAnalysesParams,
} from "./sentiment";

// Search API
export {
  SearchAPI,
  createSearchAPI,
  type SearchResult,
  type SearchResultType,
  type SearchMode,
  type SearchSortOrder,
  type SearchHighlight,
  type SearchFacet,
  type SearchSuggestion,
  type SearchRequest,
  type SearchFilters,
  type SearchResponse,
  type VisualSearchRequest,
  type AudioSearchRequest,
  type IndexStatus,
} from "./search";

// Scene AI API
export {
  SceneAPI,
  createSceneAPI,
  type SceneDetection,
  type SceneDetectionStatus,
  type Scene,
  type SceneType,
  type Shot,
  type ShotType,
  type SceneLabel,
  type VisualFeatures,
  type AudioFeatures,
  type SceneBoundary,
  type CreateSceneDetectionRequest,
  type ListSceneDetectionsParams,
  type SceneComparison,
} from "./scene";

// Pipeline API (P1)
export { PipelineAPI, createPipelineAPI } from "./pipeline";

// Studio API (P1)
export { StudioAPI, createStudioAPI } from "./studio";

// Fleet API (P2)
export { FleetAPI, createFleetAPI } from "./fleet";

// Autopilot API (P2, formerly Ghost Producer)
export { GhostAPI, createGhostAPI } from "./ghost";

// Mesh API (P2)
export { MeshAPI, createMeshAPI } from "./mesh";

// Edge API (P2)
export { EdgeAPI, createEdgeAPI } from "./edge";

// Pulse Analytics API (P2)
export { PulseAPI, createPulseAPI } from "./pulse";

// Prism API (P2)
export { PrismAPI, createPrismAPI } from "./prism";

// Zoom API (P2)
export { ZoomAPI, createZoomAPI } from "./zoom";

// Vault API (P3)
export { VaultAPI, createVaultAPI } from "./vault";

// Marketplace API (P3)
export { MarketplaceAPI, createMarketplaceAPI } from "./marketplace";

// Connect API (P3)
export { ConnectAPI, createConnectAPI } from "./connect";

// Distribution API (P3)
export { DistributionAPI, createDistributionAPI } from "./distribution";

// Desktop API (P3)
export { DesktopAPI, createDesktopAPI } from "./desktop";

// Signage API (P3)
export { SignageAPI, createSignageAPI } from "./signage";

// QR API (P3)
export { QrAPI, createQrAPI } from "./qr";

// Audience API (P3)
export { AudienceAPI, createAudienceAPI } from "./audience";

// Creator API (P3)
export { CreatorAPI, createCreatorAPI } from "./creator";

// Podcast API (P4)
export { PodcastAPI, createPodcastAPI } from "./podcast";

// Slides API (P4)
export { SlidesAPI, createSlidesAPI } from "./slides";

// USB API (P4)
export { UsbAPI, createUsbAPI } from "./usb";

// Notifications API
export { NotificationsAPI, createNotificationsAPI } from "./notifications";

// DRM API
export { DrmAPI, createDrmAPI } from "./drm";

// Telemetry (opt-in)
export {
  withTelemetry,
  withTelemetrySync,
  initTelemetry,
  resetTelemetry,
  isTelemetryEnabled,
  type TelemetryConfig,
  type TelemetrySpanAttributes,
} from "./telemetry";

// =============================================================================
// Convenience: Full Client with All APIs
// =============================================================================

import type { WaveClientConfig } from "./client";
import { WaveClient } from "./client";
import { ClipsAPI } from "./clips";
import { EditorAPI } from "./editor";
import { VoiceAPI } from "./voice";
import { PhoneAPI } from "./phone";
import { CollabAPI } from "./collab";
import { CaptionsAPI } from "./captions";
import { ChaptersAPI } from "./chapters";
import { StudioAIAPI } from "./studio-ai";
import { TranscribeAPI } from "./transcribe";
import { SentimentAPI } from "./sentiment";
import { SearchAPI } from "./search";
import { SceneAPI } from "./scene";
import { PipelineAPI } from "./pipeline";
import { StudioAPI } from "./studio";
import { FleetAPI } from "./fleet";
import { GhostAPI } from "./ghost";
import { MeshAPI } from "./mesh";
import { EdgeAPI } from "./edge";
import { PulseAPI } from "./pulse";
import { PrismAPI } from "./prism";
import { ZoomAPI } from "./zoom";
import { VaultAPI } from "./vault";
import { MarketplaceAPI } from "./marketplace";
import { ConnectAPI } from "./connect";
import { DistributionAPI } from "./distribution";
import { DesktopAPI } from "./desktop";
import { SignageAPI } from "./signage";
import { QrAPI } from "./qr";
import { AudienceAPI } from "./audience";
import { CreatorAPI } from "./creator";
import { PodcastAPI } from "./podcast";
import { SlidesAPI } from "./slides";
import { UsbAPI } from "./usb";
import { NotificationsAPI } from "./notifications";
import { DrmAPI } from "./drm";

/**
 * Full WAVE SDK client with all APIs attached
 */
export class Wave {
  public readonly client: WaveClient;

  // Existing (P3)
  public readonly clips: ClipsAPI;
  public readonly editor: EditorAPI;
  public readonly voice: VoiceAPI;
  public readonly phone: PhoneAPI;
  public readonly collab: CollabAPI;
  public readonly captions: CaptionsAPI;
  public readonly chapters: ChaptersAPI;
  public readonly studioAI: StudioAIAPI;
  public readonly transcribe: TranscribeAPI;
  public readonly sentiment: SentimentAPI;
  public readonly search: SearchAPI;
  public readonly scene: SceneAPI;

  // P1 - Core
  public readonly pipeline: PipelineAPI;
  public readonly studio: StudioAPI;

  // P2 - Enterprise
  public readonly fleet: FleetAPI;
  public readonly ghost: GhostAPI;
  public readonly mesh: MeshAPI;
  public readonly edge: EdgeAPI;
  public readonly pulse: PulseAPI;
  public readonly prism: PrismAPI;
  public readonly zoom: ZoomAPI;

  // P3 - Content & Commerce
  public readonly vault: VaultAPI;
  public readonly marketplace: MarketplaceAPI;
  public readonly connect: ConnectAPI;
  public readonly distribution: DistributionAPI;
  public readonly desktop: DesktopAPI;
  public readonly signage: SignageAPI;
  public readonly qr: QrAPI;
  public readonly audience: AudienceAPI;
  public readonly creator: CreatorAPI;

  // P4 - Specialized
  public readonly podcast: PodcastAPI;
  public readonly slides: SlidesAPI;
  public readonly usb: UsbAPI;

  // Cross-cutting
  public readonly notifications: NotificationsAPI;
  public readonly drm: DrmAPI;

  constructor(config: WaveClientConfig) {
    this.client = new WaveClient(config);

    // Existing
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

    // P1
    this.pipeline = new PipelineAPI(this.client);
    this.studio = new StudioAPI(this.client);

    // P2
    this.fleet = new FleetAPI(this.client);
    this.ghost = new GhostAPI(this.client);
    this.mesh = new MeshAPI(this.client);
    this.edge = new EdgeAPI(this.client);
    this.pulse = new PulseAPI(this.client);
    this.prism = new PrismAPI(this.client);
    this.zoom = new ZoomAPI(this.client);

    // P3
    this.vault = new VaultAPI(this.client);
    this.marketplace = new MarketplaceAPI(this.client);
    this.connect = new ConnectAPI(this.client);
    this.distribution = new DistributionAPI(this.client);
    this.desktop = new DesktopAPI(this.client);
    this.signage = new SignageAPI(this.client);
    this.qr = new QrAPI(this.client);
    this.audience = new AudienceAPI(this.client);
    this.creator = new CreatorAPI(this.client);

    // P4
    this.podcast = new PodcastAPI(this.client);
    this.slides = new SlidesAPI(this.client);
    this.usb = new UsbAPI(this.client);

    // Cross-cutting
    this.notifications = new NotificationsAPI(this.client);
    this.drm = new DrmAPI(this.client);
  }
}

/**
 * Create a full Wave SDK instance
 */
export function createWave(config: WaveClientConfig): Wave {
  return new Wave(config);
}

// Default export
export default Wave;
