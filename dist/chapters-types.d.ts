import { Timestamps, Metadata, PaginationParams } from './client-types.js';
import './telemetry.js';

type ChapterStatus = 'pending' | 'processing' | 'ready' | 'failed';
interface Chapter extends Timestamps {
    id: string;
    media_id: string;
    title: string;
    description?: string;
    start_time: number;
    end_time?: number;
    thumbnail_url?: string;
    order: number;
    is_auto_generated: boolean;
    confidence?: number;
    metadata?: Metadata;
}
interface ChapterSet extends Timestamps {
    id: string;
    organization_id: string;
    media_id: string;
    media_type: 'video' | 'audio' | 'stream';
    name: string;
    status: ChapterStatus;
    is_default: boolean;
    is_auto_generated: boolean;
    chapters: Chapter[];
    chapter_count: number;
    error?: string;
    metadata?: Metadata;
}
interface GenerateChaptersRequest {
    media_id: string;
    media_type: 'video' | 'audio' | 'stream';
    name?: string;
    /** Minimum chapter duration in seconds */
    min_duration?: number;
    /** Maximum number of chapters */
    max_chapters?: number;
    /** Detection method */
    method?: 'scene' | 'topic' | 'combined';
    /** Use transcript for topic detection */
    use_transcript?: boolean;
    /** Caption track ID if using transcript */
    caption_track_id?: string;
    /** Generate thumbnails for chapters */
    generate_thumbnails?: boolean;
    /** Set as default chapter set */
    set_as_default?: boolean;
    /** Webhook URL for completion */
    webhook_url?: string;
    metadata?: Metadata;
}
interface CreateChapterSetRequest {
    media_id: string;
    media_type: 'video' | 'audio' | 'stream';
    name: string;
    chapters: CreateChapterRequest[];
    set_as_default?: boolean;
    metadata?: Metadata;
}
interface CreateChapterRequest {
    title: string;
    description?: string;
    start_time: number;
    end_time?: number;
    thumbnail_url?: string;
    metadata?: Metadata;
}
interface UpdateChapterRequest {
    title?: string;
    description?: string;
    start_time?: number;
    end_time?: number;
    thumbnail_url?: string;
    order?: number;
    metadata?: Metadata;
}
interface UpdateChapterSetRequest {
    name?: string;
    is_default?: boolean;
    metadata?: Metadata;
}
interface ListChapterSetsParams extends PaginationParams {
    media_id?: string;
    media_type?: 'video' | 'audio' | 'stream';
    status?: ChapterStatus;
    is_auto_generated?: boolean;
}

export type { Chapter, ChapterSet, ChapterStatus, CreateChapterRequest, CreateChapterSetRequest, GenerateChaptersRequest, ListChapterSetsParams, UpdateChapterRequest, UpdateChapterSetRequest };
