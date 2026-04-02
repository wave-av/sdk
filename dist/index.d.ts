/**
 * WAVE SDK - Official TypeScript SDK
 *
 * A comprehensive SDK for interacting with all WAVE API products across
 * streaming, production, device management, analytics, content, and more.
 *
 * @packageDocumentation
 */
export { WaveClient, createClient, WaveError, RateLimitError, type WaveClientConfig, type RequestOptions, type WaveAPIErrorResponse, type WaveClientEvents, type PaginationParams, type PaginatedResponse, type MediaType, type Timestamps, type Metadata, } from "./client";
export { ClipsAPI, createClipsAPI, type Clip, type ClipStatus, type ClipExportFormat, type ClipQualityPreset, type ClipSource, type CreateClipRequest, type UpdateClipRequest, type ListClipsParams, type ExportClipRequest, type ClipExport, type ClipHighlight, } from "./clips";
export { EditorAPI, createEditorAPI, type EditorProject, type ProjectStatus, type Track, type TrackType, type TimelineElement, type Transition, type TransitionType, type Effect, type EffectType, type Keyframe, type TextOverlay, type TextAnimation, type CreateProjectRequest, type UpdateProjectRequest, type AddElementRequest, type RenderOptions, type RenderJob, type ListProjectsParams, } from "./editor";
export { VoiceAPI, createVoiceAPI, type Voice, type VoiceModelType, type VoiceGender, type AudioFormat, type SynthesizeRequest, type SynthesisResult, type CloneVoiceRequest, type VoiceCloneJob, type ListVoicesParams, type VoiceSettings, } from "./voice";
export { PhoneAPI, createPhoneAPI, type PhoneNumber, type PhoneNumberType, type PhoneNumberCapabilities, type Call, type CallStatus, type CallDirection, type MakeCallRequest, type UpdateCallRequest, type Conference, type ConferenceParticipant, type SearchNumbersRequest, type AvailablePhoneNumber, type ListCallsParams, } from "./phone";
export { CollabAPI, createCollabAPI, type CollabRoom, type RoomStatus, type RoomSettings, type Participant, type ParticipantRole, type ParticipantPermissions, type PresenceStatus, type CursorPosition, type Selection, type Comment, type Reaction, type Annotation, type CreateRoomRequest, type UpdateRoomRequest, type InviteRequest, type ListRoomsParams, } from "./collab";
export { CaptionsAPI, createCaptionsAPI, type CaptionTrack, type CaptionStatus, type CaptionFormat, type CaptionCue, type CaptionWord, type CaptionStyle, type GenerateCaptionsRequest, type UploadCaptionsRequest, type UpdateCaptionsRequest, type TranslateCaptionsRequest, type BurnInCaptionsRequest, type BurnInJob, type ListCaptionsParams, } from "./captions";
export { ChaptersAPI, createChaptersAPI, type Chapter, type ChapterSet, type ChapterStatus, type GenerateChaptersRequest, type CreateChapterSetRequest, type CreateChapterRequest, type UpdateChapterRequest, type UpdateChapterSetRequest, type ListChapterSetsParams, } from "./chapters";
export { StudioAIAPI, createStudioAIAPI, type AIAssistant, type AssistantMode, type AssistantConfig, type AssistantStats, type AISuggestion, type SuggestionPriority, type SuggestionStatus, type SuggestionAction, type SceneRecommendation, type GraphicsSuggestion, type AudioMixSuggestion, type ModerationAlert, type EngagementInsight, type StartAssistantRequest, type UpdateAssistantRequest, type ListSuggestionsParams, } from "./studio-ai";
export { TranscribeAPI, createTranscribeAPI, type Transcription, type TranscriptionStatus, type TranscriptionModel, type TranscriptionSegment, type TranscriptionWord, type Speaker, type CreateTranscriptionRequest, type UpdateTranscriptionRequest, type ListTranscriptionsParams, type TranscriptExportFormat, } from "./transcribe";
export { SentimentAPI, createSentimentAPI, type SentimentAnalysis, type AnalysisStatus, type SentimentLabel, type EmotionType, type SourceType, type SentimentSegment, type EmotionScore, type SentimentTrend, type SentimentSummary, type KeyMoment, type TopicSentiment, type CreateAnalysisRequest, type BatchAnalysisRequest, type ListAnalysesParams, } from "./sentiment";
export { SearchAPI, createSearchAPI, type SearchResult, type SearchResultType, type SearchMode, type SearchSortOrder, type SearchHighlight, type SearchFacet, type SearchSuggestion, type SearchRequest, type SearchFilters, type SearchResponse, type VisualSearchRequest, type AudioSearchRequest, type IndexStatus, } from "./search";
export { SceneAPI, createSceneAPI, type SceneDetection, type SceneDetectionStatus, type Scene, type SceneType, type Shot, type ShotType, type SceneLabel, type VisualFeatures, type AudioFeatures, type SceneBoundary, type CreateSceneDetectionRequest, type ListSceneDetectionsParams, type SceneComparison, } from "./scene";
export { PipelineAPI, createPipelineAPI } from "./pipeline";
export { StudioAPI, createStudioAPI } from "./studio";
export { FleetAPI, createFleetAPI } from "./fleet";
export { GhostAPI, createGhostAPI } from "./ghost";
export { MeshAPI, createMeshAPI } from "./mesh";
export { EdgeAPI, createEdgeAPI } from "./edge";
export { PulseAPI, createPulseAPI } from "./pulse";
export { PrismAPI, createPrismAPI } from "./prism";
export { ZoomAPI, createZoomAPI } from "./zoom";
export { VaultAPI, createVaultAPI } from "./vault";
export { MarketplaceAPI, createMarketplaceAPI } from "./marketplace";
export { ConnectAPI, createConnectAPI } from "./connect";
export { DistributionAPI, createDistributionAPI } from "./distribution";
export { DesktopAPI, createDesktopAPI } from "./desktop";
export { SignageAPI, createSignageAPI } from "./signage";
export { QrAPI, createQrAPI } from "./qr";
export { AudienceAPI, createAudienceAPI } from "./audience";
export { CreatorAPI, createCreatorAPI } from "./creator";
export { PodcastAPI, createPodcastAPI } from "./podcast";
export { SlidesAPI, createSlidesAPI } from "./slides";
export { UsbAPI, createUsbAPI } from "./usb";
export { NotificationsAPI, createNotificationsAPI } from "./notifications";
export { DrmAPI, createDrmAPI } from "./drm";
export { withTelemetry, withTelemetrySync, initTelemetry, resetTelemetry, isTelemetryEnabled, type TelemetryConfig, type TelemetrySpanAttributes, } from "./telemetry";
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
 *
 * @example
 * ```typescript
 * import { Wave } from '@wave/sdk';
 *
 * const wave = new Wave({
 *   apiKey: process.env.WAVE_API_KEY!,
 *   organizationId: 'org_123',
 * });
 *
 * // Use any API
 * const streams = await wave.pipeline.list();
 * const clips = await wave.clips.list();
 * await wave.prism.discoverSources();
 * ```
 */
export declare class Wave {
    readonly client: WaveClient;
    readonly clips: ClipsAPI;
    readonly editor: EditorAPI;
    readonly voice: VoiceAPI;
    readonly phone: PhoneAPI;
    readonly collab: CollabAPI;
    readonly captions: CaptionsAPI;
    readonly chapters: ChaptersAPI;
    readonly studioAI: StudioAIAPI;
    readonly transcribe: TranscribeAPI;
    readonly sentiment: SentimentAPI;
    readonly search: SearchAPI;
    readonly scene: SceneAPI;
    readonly pipeline: PipelineAPI;
    readonly studio: StudioAPI;
    readonly fleet: FleetAPI;
    readonly ghost: GhostAPI;
    readonly mesh: MeshAPI;
    readonly edge: EdgeAPI;
    readonly pulse: PulseAPI;
    readonly prism: PrismAPI;
    readonly zoom: ZoomAPI;
    readonly vault: VaultAPI;
    readonly marketplace: MarketplaceAPI;
    readonly connect: ConnectAPI;
    readonly distribution: DistributionAPI;
    readonly desktop: DesktopAPI;
    readonly signage: SignageAPI;
    readonly qr: QrAPI;
    readonly audience: AudienceAPI;
    readonly creator: CreatorAPI;
    readonly podcast: PodcastAPI;
    readonly slides: SlidesAPI;
    readonly usb: UsbAPI;
    readonly notifications: NotificationsAPI;
    readonly drm: DrmAPI;
    constructor(config: WaveClientConfig);
}
/**
 * Create a full Wave SDK instance
 */
export declare function createWave(config: WaveClientConfig): Wave;
export default Wave;
