import { WaveClient } from './client.mjs';
export { RateLimitError, WaveError, createClient } from './client.mjs';
import { ClipsAPI } from './clips.mjs';
export { ClipExport, ClipHighlight, CreateClipRequest, ExportClipRequest, ListClipsParams, UpdateClipRequest, createClipsAPI } from './clips.mjs';
import { EditorAPI } from './editor.mjs';
export { createEditorAPI } from './editor.mjs';
import { VoiceAPI } from './voice.mjs';
export { createVoiceAPI } from './voice.mjs';
import { PhoneAPI } from './phone.mjs';
export { createPhoneAPI } from './phone.mjs';
import { CollabAPI } from './collab.mjs';
export { createCollabAPI } from './collab.mjs';
import { CaptionsAPI } from './captions.mjs';
export { createCaptionsAPI } from './captions.mjs';
import { ChaptersAPI } from './chapters.mjs';
export { createChaptersAPI } from './chapters.mjs';
import { StudioAIAPI } from './studio-ai.mjs';
export { createStudioAIAPI } from './studio-ai.mjs';
import { TranscribeAPI } from './transcribe.mjs';
export { createTranscribeAPI } from './transcribe.mjs';
import { SentimentAPI } from './sentiment.mjs';
export { createSentimentAPI } from './sentiment.mjs';
import { SearchAPI } from './search.mjs';
export { createSearchAPI } from './search.mjs';
import { SceneAPI } from './scene.mjs';
export { createSceneAPI } from './scene.mjs';
import { PipelineAPI } from './pipeline.mjs';
export { createPipelineAPI } from './pipeline.mjs';
import { StudioAPI } from './studio.mjs';
export { createStudioAPI } from './studio.mjs';
import { FleetAPI } from './fleet.mjs';
export { createFleetAPI } from './fleet.mjs';
import { GhostAPI } from './ghost.mjs';
export { createGhostAPI } from './ghost.mjs';
import { MeshAPI } from './mesh.mjs';
export { createMeshAPI } from './mesh.mjs';
import { EdgeAPI } from './edge.mjs';
export { createEdgeAPI } from './edge.mjs';
import { PulseAPI } from './pulse.mjs';
export { createPulseAPI } from './pulse.mjs';
import { PrismAPI } from './prism.mjs';
export { createPrismAPI } from './prism.mjs';
import { ZoomAPI } from './zoom.mjs';
export { createZoomAPI } from './zoom.mjs';
import { VaultAPI } from './vault.mjs';
export { createVaultAPI } from './vault.mjs';
import { MarketplaceAPI } from './marketplace.mjs';
export { createMarketplaceAPI } from './marketplace.mjs';
import { ConnectAPI } from './connect.mjs';
export { createConnectAPI } from './connect.mjs';
import { DistributionAPI } from './distribution.mjs';
export { createDistributionAPI } from './distribution.mjs';
import { DesktopAPI } from './desktop.mjs';
export { createDesktopAPI } from './desktop.mjs';
import { SignageAPI } from './signage.mjs';
export { createSignageAPI } from './signage.mjs';
import { QrAPI } from './qr.mjs';
export { createQrAPI } from './qr.mjs';
import { AudienceAPI } from './audience.mjs';
export { createAudienceAPI } from './audience.mjs';
import { CreatorAPI } from './creator.mjs';
export { createCreatorAPI } from './creator.mjs';
import { PodcastAPI } from './podcast.mjs';
export { createPodcastAPI } from './podcast.mjs';
import { SlidesAPI } from './slides.mjs';
export { createSlidesAPI } from './slides.mjs';
import { UsbAPI } from './usb.mjs';
export { createUsbAPI } from './usb.mjs';
import { NotificationsAPI } from './notifications.mjs';
export { createNotificationsAPI } from './notifications.mjs';
import { DrmAPI } from './drm.mjs';
export { createDrmAPI } from './drm.mjs';
import { RealtimeAPI } from './realtime.mjs';
export { RealtimeChannel, createRealtimeAPI } from './realtime.mjs';
export { PresenceMember, RealtimeChannelEvents, RealtimeConnectOptions, RealtimeFrame, WaveRealtimeEventName } from './realtime-types.mjs';
import { MailAPI } from './mail.mjs';
export { createMailAPI } from './mail.mjs';
import { MeterAPI } from './meter.mjs';
export { LedgerParams, RollupParams, createMeterAPI } from './meter.mjs';
import { PerceptionAPI } from './perception.mjs';
export { PerceptionAudioMode, PerceptionBatch, PerceptionFrame, PerceptionMeterBinding, PerceptionOptions, PerceptionSample, PerceptionSampleMode, PerceptionSubscription, PerceptionTransport, ReceiveDescriptor, SubscribeRequest, createPerceptionAPI } from './perception.mjs';
export { TelemetryConfig, TelemetrySpanAttributes, initTelemetry, isTelemetryEnabled, resetTelemetry, withTelemetry, withTelemetrySync } from './telemetry.mjs';
import { WaveClientConfig } from './client-types.mjs';
export { MediaType, Metadata, PaginatedResponse, PaginationParams, RequestOptions, Timestamps, WaveAPIErrorResponse, WaveClientEvents } from './client-types.mjs';
export { AIAssistant, AISuggestion, AssistantConfig, AssistantMode, AssistantStats, AudioMixSuggestion, EngagementInsight, GraphicsSuggestion, ListSuggestionsParams, ModerationAlert, SceneRecommendation, StartAssistantRequest, SuggestionAction, SuggestionPriority, SuggestionStatus, UpdateAssistantRequest } from './studio-ai-types.mjs';
export { AddElementRequest, CreateProjectRequest, EditorProject, Effect, EffectType, Keyframe, ListProjectsParams, ProjectStatus, RenderJob, RenderOptions, TextAnimation, TextOverlay, TimelineElement, Track, TrackType, Transition, TransitionType, UpdateProjectRequest } from './editor-types.mjs';
export { AnalysisStatus, BatchAnalysisRequest, CreateAnalysisRequest, EmotionScore, EmotionType, KeyMoment, ListAnalysesParams, SentimentAnalysis, SentimentLabel, SentimentSegment, SentimentSummary, SentimentTrend, SourceType, TopicSentiment } from './sentiment-types.mjs';
export { Annotation, CollabRoom, Comment, CreateRoomRequest, CursorPosition, InviteRequest, ListRoomsParams, Participant, ParticipantPermissions, ParticipantRole, PresenceStatus, Reaction, RoomSettings, RoomStatus, Selection, UpdateRoomRequest } from './collab-types.mjs';
export { AudioFeatures, CreateSceneDetectionRequest, ListSceneDetectionsParams, Scene, SceneBoundary, SceneComparison, SceneDetection, SceneDetectionStatus, SceneLabel, SceneType, Shot, ShotType, VisualFeatures } from './scene-types.mjs';
export { AudioFormat, CloneVoiceRequest, ListVoicesParams, SynthesisResult, SynthesizeRequest, Voice, VoiceCloneJob, VoiceGender, VoiceModelType, VoiceSettings } from './voice-types.mjs';
export { AudioSearchRequest, IndexStatus, SearchFacet, SearchFilters, SearchHighlight, SearchMode, SearchRequest, SearchResponse, SearchResult, SearchResultType, SearchSortOrder, SearchSuggestion, VisualSearchRequest } from './search-types.mjs';
export { AvailablePhoneNumber, Call, CallDirection, CallStatus, Conference, ConferenceParticipant, ListCallsParams, MakeCallRequest, PhoneNumber, PhoneNumberCapabilities, PhoneNumberType, SearchNumbersRequest, UpdateCallRequest } from './phone-types.mjs';
export { BurnInCaptionsRequest, BurnInJob, CaptionCue, CaptionFormat, CaptionStatus, CaptionStyle, CaptionTrack, CaptionWord, GenerateCaptionsRequest, ListCaptionsParams, TranslateCaptionsRequest, UpdateCaptionsRequest, UploadCaptionsRequest } from './captions-types.mjs';
export { Chapter, ChapterSet, ChapterStatus, CreateChapterRequest, CreateChapterSetRequest, GenerateChaptersRequest, ListChapterSetsParams, UpdateChapterRequest, UpdateChapterSetRequest } from './chapters-types.mjs';
export { Clip, ClipExportFormat, ClipQualityPreset, ClipSource, ClipStatus } from './clips-types.mjs';
export { CreateTranscriptionRequest, ListTranscriptionsParams, Speaker, TranscriptExportFormat, Transcription, TranscriptionModel, TranscriptionSegment, TranscriptionStatus, TranscriptionWord, UpdateTranscriptionRequest } from './transcribe-types.mjs';
export { MailReplyBody, MailSearchResult, MailSendRequest, SendResult, SmsRequest, SmsResult, TranscriptEmailRequest } from './mail-types.mjs';
export { MeterChannels, MeterLedger, MeterLedgerRow, MeterMailChannel, MeterRealtimeChannel, MeterRollup, MeterRollupTotals, MeterSmsChannel, MeterStorageChannel, MeterVoiceChannel } from './meter-types.mjs';
import 'eventemitter3';
import './pipeline-types.mjs';
import './studio-types.mjs';

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
