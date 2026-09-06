import { WaveClient } from './client.js';
export { RateLimitError, WaveError, createClient } from './client.js';
import { ClipsAPI } from './clips.js';
export { ClipExport, ClipHighlight, CreateClipRequest, ExportClipRequest, ListClipsParams, UpdateClipRequest, createClipsAPI } from './clips.js';
import { EditorAPI } from './editor.js';
export { createEditorAPI } from './editor.js';
import { VoiceAPI } from './voice.js';
export { createVoiceAPI } from './voice.js';
import { PhoneAPI } from './phone.js';
export { createPhoneAPI } from './phone.js';
import { CollabAPI } from './collab.js';
export { createCollabAPI } from './collab.js';
import { CaptionsAPI } from './captions.js';
export { createCaptionsAPI } from './captions.js';
import { ChaptersAPI } from './chapters.js';
export { createChaptersAPI } from './chapters.js';
import { StudioAIAPI } from './studio-ai.js';
export { createStudioAIAPI } from './studio-ai.js';
import { TranscribeAPI } from './transcribe.js';
export { createTranscribeAPI } from './transcribe.js';
import { SentimentAPI } from './sentiment.js';
export { createSentimentAPI } from './sentiment.js';
import { SearchAPI } from './search.js';
export { createSearchAPI } from './search.js';
import { SceneAPI } from './scene.js';
export { createSceneAPI } from './scene.js';
import { PipelineAPI } from './pipeline.js';
export { createPipelineAPI } from './pipeline.js';
import { StudioAPI } from './studio.js';
export { createStudioAPI } from './studio.js';
import { FleetAPI } from './fleet.js';
export { createFleetAPI } from './fleet.js';
import { GhostAPI } from './ghost.js';
export { createGhostAPI } from './ghost.js';
import { MeshAPI } from './mesh.js';
export { createMeshAPI } from './mesh.js';
import { EdgeAPI } from './edge.js';
export { createEdgeAPI } from './edge.js';
import { PulseAPI } from './pulse.js';
export { createPulseAPI } from './pulse.js';
import { PrismAPI } from './prism.js';
export { createPrismAPI } from './prism.js';
import { ZoomAPI } from './zoom.js';
export { createZoomAPI } from './zoom.js';
import { VaultAPI } from './vault.js';
export { createVaultAPI } from './vault.js';
import { MarketplaceAPI } from './marketplace.js';
export { createMarketplaceAPI } from './marketplace.js';
import { ConnectAPI } from './connect.js';
export { createConnectAPI } from './connect.js';
import { DistributionAPI } from './distribution.js';
export { createDistributionAPI } from './distribution.js';
import { DesktopAPI } from './desktop.js';
export { createDesktopAPI } from './desktop.js';
import { SignageAPI } from './signage.js';
export { createSignageAPI } from './signage.js';
import { QrAPI } from './qr.js';
export { createQrAPI } from './qr.js';
import { AudienceAPI } from './audience.js';
export { createAudienceAPI } from './audience.js';
import { CreatorAPI } from './creator.js';
export { createCreatorAPI } from './creator.js';
import { PodcastAPI } from './podcast.js';
export { createPodcastAPI } from './podcast.js';
import { SlidesAPI } from './slides.js';
export { createSlidesAPI } from './slides.js';
import { UsbAPI } from './usb.js';
export { createUsbAPI } from './usb.js';
import { NotificationsAPI } from './notifications.js';
export { createNotificationsAPI } from './notifications.js';
import { DrmAPI } from './drm.js';
export { createDrmAPI } from './drm.js';
import { RealtimeAPI } from './realtime.js';
export { RealtimeChannel, createRealtimeAPI } from './realtime.js';
export { PresenceMember, RealtimeChannelEvents, RealtimeConnectOptions, RealtimeFrame, WaveRealtimeEventName } from './realtime-types.js';
import { MailAPI } from './mail.js';
export { createMailAPI } from './mail.js';
import { MeterAPI } from './meter.js';
export { LedgerParams, RollupParams, createMeterAPI } from './meter.js';
import { PerceptionAPI } from './perception.js';
export { PerceptionAudioMode, PerceptionBatch, PerceptionFrame, PerceptionMeterBinding, PerceptionOptions, PerceptionSample, PerceptionSampleMode, PerceptionSubscription, PerceptionTransport, ReceiveDescriptor, SubscribeRequest, createPerceptionAPI } from './perception.js';
export { TelemetryConfig, TelemetrySpanAttributes, initTelemetry, isTelemetryEnabled, resetTelemetry, withTelemetry, withTelemetrySync } from './telemetry.js';
import { WaveClientConfig } from './client-types.js';
export { MediaType, Metadata, PaginatedResponse, PaginationParams, RequestOptions, Timestamps, WaveAPIErrorResponse, WaveClientEvents } from './client-types.js';
export { AIAssistant, AISuggestion, AssistantConfig, AssistantMode, AssistantStats, AudioMixSuggestion, EngagementInsight, GraphicsSuggestion, ListSuggestionsParams, ModerationAlert, SceneRecommendation, StartAssistantRequest, SuggestionAction, SuggestionPriority, SuggestionStatus, UpdateAssistantRequest } from './studio-ai-types.js';
export { AddElementRequest, CreateProjectRequest, EditorProject, Effect, EffectType, Keyframe, ListProjectsParams, ProjectStatus, RenderJob, RenderOptions, TextAnimation, TextOverlay, TimelineElement, Track, TrackType, Transition, TransitionType, UpdateProjectRequest } from './editor-types.js';
export { AnalysisStatus, BatchAnalysisRequest, CreateAnalysisRequest, EmotionScore, EmotionType, KeyMoment, ListAnalysesParams, SentimentAnalysis, SentimentLabel, SentimentSegment, SentimentSummary, SentimentTrend, SourceType, TopicSentiment } from './sentiment-types.js';
export { Annotation, CollabRoom, Comment, CreateRoomRequest, CursorPosition, InviteRequest, ListRoomsParams, Participant, ParticipantPermissions, ParticipantRole, PresenceStatus, Reaction, RoomSettings, RoomStatus, Selection, UpdateRoomRequest } from './collab-types.js';
export { AudioFeatures, CreateSceneDetectionRequest, ListSceneDetectionsParams, Scene, SceneBoundary, SceneComparison, SceneDetection, SceneDetectionStatus, SceneLabel, SceneType, Shot, ShotType, VisualFeatures } from './scene-types.js';
export { AudioFormat, CloneVoiceRequest, ListVoicesParams, SynthesisResult, SynthesizeRequest, Voice, VoiceCloneJob, VoiceGender, VoiceModelType, VoiceSettings } from './voice-types.js';
export { AudioSearchRequest, IndexStatus, SearchFacet, SearchFilters, SearchHighlight, SearchMode, SearchRequest, SearchResponse, SearchResult, SearchResultType, SearchSortOrder, SearchSuggestion, VisualSearchRequest } from './search-types.js';
export { AvailablePhoneNumber, Call, CallDirection, CallStatus, Conference, ConferenceParticipant, ListCallsParams, MakeCallRequest, PhoneNumber, PhoneNumberCapabilities, PhoneNumberType, SearchNumbersRequest, UpdateCallRequest } from './phone-types.js';
export { BurnInCaptionsRequest, BurnInJob, CaptionCue, CaptionFormat, CaptionStatus, CaptionStyle, CaptionTrack, CaptionWord, GenerateCaptionsRequest, ListCaptionsParams, TranslateCaptionsRequest, UpdateCaptionsRequest, UploadCaptionsRequest } from './captions-types.js';
export { Chapter, ChapterSet, ChapterStatus, CreateChapterRequest, CreateChapterSetRequest, GenerateChaptersRequest, ListChapterSetsParams, UpdateChapterRequest, UpdateChapterSetRequest } from './chapters-types.js';
export { Clip, ClipExportFormat, ClipQualityPreset, ClipSource, ClipStatus } from './clips-types.js';
export { CreateTranscriptionRequest, ListTranscriptionsParams, Speaker, TranscriptExportFormat, Transcription, TranscriptionModel, TranscriptionSegment, TranscriptionStatus, TranscriptionWord, UpdateTranscriptionRequest } from './transcribe-types.js';
export { MailReplyBody, MailSearchResult, MailSendRequest, SendResult, SmsRequest, SmsResult, TranscriptEmailRequest } from './mail-types.js';
export { MeterChannels, MeterLedger, MeterLedgerRow, MeterMailChannel, MeterRealtimeChannel, MeterRollup, MeterRollupTotals, MeterSmsChannel, MeterStorageChannel, MeterVoiceChannel } from './meter-types.js';
import 'eventemitter3';
import './pipeline-types.js';
import './studio-types.js';

/**
 * WAVE SDK - Official TypeScript SDK
 *
 * A comprehensive SDK for interacting with all WAVE API products across
 * streaming, production, device management, analytics, content, and more.
 *
 * @packageDocumentation
 */

/**
 * Full WAVE SDK client with all APIs attached
 */
declare class Wave {
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
    readonly realtime: RealtimeAPI;
    readonly mail: MailAPI;
    readonly meter: MeterAPI;
    readonly perception: PerceptionAPI;
    constructor(config: WaveClientConfig);
}
/**
 * Create a full Wave SDK instance
 */
declare function createWave(config: WaveClientConfig): Wave;

export { AudienceAPI, CaptionsAPI, ChaptersAPI, ClipsAPI, CollabAPI, ConnectAPI, CreatorAPI, DesktopAPI, DistributionAPI, DrmAPI, EdgeAPI, EditorAPI, FleetAPI, GhostAPI, MailAPI, MarketplaceAPI, MeshAPI, MeterAPI, NotificationsAPI, PerceptionAPI, PhoneAPI, PipelineAPI, PodcastAPI, PrismAPI, PulseAPI, QrAPI, RealtimeAPI, SceneAPI, SearchAPI, SentimentAPI, SignageAPI, SlidesAPI, StudioAIAPI, StudioAPI, TranscribeAPI, UsbAPI, VaultAPI, VoiceAPI, Wave, WaveClient, WaveClientConfig, ZoomAPI, createWave, Wave as default };
