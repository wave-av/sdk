export type ChapterStatus = 'pending' | 'processing' | 'ready' | 'failed';
export interface Chapter extends Timestamps {
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
export interface ChapterSet extends Timestamps {
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
export interface GenerateChaptersRequest {
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
export interface CreateChapterSetRequest {
  media_id: string;
  media_type: 'video' | 'audio' | 'stream';
  name: string;
  chapters: CreateChapterRequest[];
  set_as_default?: boolean;
  metadata?: Metadata;
}
export interface CreateChapterRequest {
  title: string;
  description?: string;
  start_time: number;
  end_time?: number;
  thumbnail_url?: string;
  metadata?: Metadata;
}
export interface UpdateChapterRequest {
  title?: string;
  description?: string;
  start_time?: number;
  end_time?: number;
  thumbnail_url?: string;
  order?: number;
  metadata?: Metadata;
}
export interface UpdateChapterSetRequest {
  name?: string;
  is_default?: boolean;
  metadata?: Metadata;
}
export interface ListChapterSetsParams extends PaginationParams {
  media_id?: string;
  media_type?: 'video' | 'audio' | 'stream';
  status?: ChapterStatus;
  is_auto_generated?: boolean;
}
