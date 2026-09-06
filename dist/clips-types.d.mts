import { Timestamps, Metadata } from './client-types.mjs';
import './telemetry.mjs';

type ClipStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'deleted';
type ClipExportFormat = 'mp4' | 'webm' | 'mov' | 'gif' | 'mp3' | 'wav';
type ClipQualityPreset = 'low' | 'medium' | 'high' | 'source' | 'custom';
interface ClipSource {
    type: 'stream' | 'recording' | 'upload';
    id: string;
    start_time: number;
    end_time: number;
}
interface Clip extends Timestamps {
    id: string;
    organization_id: string;
    title: string;
    description?: string;
    source: ClipSource;
    status: ClipStatus;
    duration: number;
    thumbnail_url?: string;
    playback_url?: string;
    download_url?: string;
    file_size?: number;
    width?: number;
    height?: number;
    frame_rate?: number;
    bitrate?: number;
    codec?: string;
    tags?: string[];
    metadata?: Metadata;
    error?: string;
}

export type { Clip, ClipExportFormat, ClipQualityPreset, ClipSource, ClipStatus };
