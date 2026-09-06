import { WaveClient } from './client.mjs';
import { Metadata, Timestamps, PaginationParams, PaginatedResponse } from './client-types.mjs';
import 'eventemitter3';
import './telemetry.mjs';

/**
 * WAVE SDK - Prompter API
 *
 * AI-powered teleprompter for live streaming. Manage scripts,
 * generate content via AI, track delivery analytics, and sync
 * across devices.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

type PrompterState = 'idle' | 'countdown' | 'active' | 'paused' | 'complete';
type ScriptTone = 'casual' | 'professional' | 'educational' | 'motivational' | 'humorous';
type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'ko' | 'zh' | 'ar' | 'hi';
type BlockType = 'paragraph' | 'heading' | 'cue' | 'note' | 'divider';
interface ScriptBlock {
    id: string;
    type: BlockType;
    content: string;
    metadata?: Metadata;
}
interface ScriptContent {
    blocks: ScriptBlock[];
}
interface Script extends Timestamps {
    id: string;
    organization_id: string;
    user_id: string;
    title: string;
    content: ScriptContent;
    language: SupportedLanguage;
    word_count: number;
    is_template: boolean;
    tags: string[];
    metadata: Metadata;
}
interface ScriptVersion {
    id: string;
    script_id: string;
    content: ScriptContent;
    version_number: number;
    created_by: string;
    diff_summary: string | null;
    created_at: string;
}
interface DeliverySession extends Timestamps {
    id: string;
    script_id: string;
    stream_id: string | null;
    user_id: string;
    organization_id: string;
    status: PrompterState;
    started_at: string | null;
    ended_at: string | null;
    metadata: Metadata;
}
interface DeliveryAnalytics {
    id: string;
    session_id: string;
    wpm_avg: number | null;
    wpm_segments: WpmSegment[];
    filler_count: number;
    filler_words: FillerWordEntry[];
    duration_seconds: number | null;
    completion_percent: number;
    engagement_data: Metadata;
    created_at: string;
}
interface WpmSegment {
    paragraphIndex: number;
    wpm: number;
    startTime: number;
    endTime: number;
}
interface FillerWordEntry {
    word: string;
    timestamp: number;
    confidence: number;
}
interface CreateScriptInput {
    title: string;
    content: ScriptContent;
    language?: SupportedLanguage;
    tags?: string[];
    metadata?: Metadata;
}
interface UpdateScriptInput {
    title?: string;
    content?: ScriptContent;
    language?: SupportedLanguage;
    tags?: string[];
    metadata?: Metadata;
}
interface GenerateScriptInput {
    mode: 'topic' | 'outline' | 'improve';
    topic?: string;
    bullets?: string[];
    existingContent?: string;
    instructions?: string;
    durationMinutes?: number;
    tone?: ScriptTone;
}
interface StartSessionInput {
    scriptId: string;
    streamId?: string;
    countdownSeconds?: number;
}
interface ListScriptsParams extends PaginationParams {
    search?: string;
    tags?: string[];
    language?: SupportedLanguage;
    includeTemplates?: boolean;
}
/**
 * Create a prompter API instance from a WAVE client.
 *
 * @example
 * ```typescript
 * import { createClient } from '@wave/sdk';
 * import { createPrompterApi } from '@wave/sdk/prompter';
 *
 * const wave = createClient({ apiKey: 'wave_...' });
 * const prompter = createPrompterApi(wave);
 *
 * // Create a script
 * const script = await prompter.scripts.create({
 *   title: 'Product Demo',
 *   content: { blocks: [{ id: '1', type: 'paragraph', content: 'Hello everyone...' }] },
 * });
 *
 * // Generate a script via AI
 * const generated = await prompter.generate({
 *   mode: 'topic',
 *   topic: 'Introduction to Kubernetes',
 *   durationMinutes: 5,
 *   tone: 'professional',
 * });
 *
 * // Start a delivery session
 * const session = await prompter.sessions.start({
 *   scriptId: script.id,
 *   streamId: 'stream_abc123',
 * });
 *
 * // Get analytics after session
 * const analytics = await prompter.sessions.analytics(session.id);
 * ```
 */
declare function createPrompterApi(client: WaveClient): {
    scripts: {
        list(params?: ListScriptsParams): Promise<PaginatedResponse<Script>>;
        get(scriptId: string): Promise<Script>;
        create(input: CreateScriptInput): Promise<Script>;
        update(scriptId: string, input: UpdateScriptInput): Promise<Script>;
        delete(scriptId: string): Promise<void>;
        versions(scriptId: string): Promise<ScriptVersion[]>;
        restoreVersion(scriptId: string, versionNumber: number): Promise<Script>;
    };
    generate(input: GenerateScriptInput): Promise<ScriptContent>;
    translate(scriptId: string, targetLanguage: SupportedLanguage): Promise<{
        translatedContent: ScriptContent;
        wordCount: number;
    }>;
    sessions: {
        start(input: StartSessionInput): Promise<DeliverySession>;
        get(sessionId: string): Promise<DeliverySession>;
        pause(sessionId: string): Promise<DeliverySession>;
        resume(sessionId: string): Promise<DeliverySession>;
        end(sessionId: string): Promise<DeliverySession>;
        analytics(sessionId: string): Promise<DeliveryAnalytics>;
        list(params?: PaginationParams & {
            scriptId?: string;
        }): Promise<PaginatedResponse<DeliverySession>>;
    };
    templates: {
        search(params?: ListScriptsParams): Promise<PaginatedResponse<Script>>;
        use(templateId: string): Promise<{
            scriptId: string;
        }>;
    };
    usage: {
        summary(periodStart: string, periodEnd: string): Promise<Record<string, number>>;
    };
};

export { type BlockType, type CreateScriptInput, type DeliveryAnalytics, type DeliverySession, type FillerWordEntry, type GenerateScriptInput, type ListScriptsParams, type PrompterState, type Script, type ScriptBlock, type ScriptContent, type ScriptTone, type ScriptVersion, type StartSessionInput, type SupportedLanguage, type UpdateScriptInput, type WpmSegment, createPrompterApi };
