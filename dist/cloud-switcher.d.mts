import { WaveClient } from './client.mjs';
import 'eventemitter3';
import './telemetry.mjs';
import './client-types.mjs';

/**
 * WAVE Cloud Switcher SDK
 *
 * Control cloud video switchers programmatically.
 *
 * @packageDocumentation
 */

interface SwitcherInstance {
    readonly id: string;
    readonly name: string;
    readonly status: 'idle' | 'live' | 'error';
    readonly inputCount: number;
    readonly outputCount: number;
    readonly resolution: '720p' | '1080p' | '4k';
    readonly frameRate: 30 | 60;
    readonly tier: 'starter' | 'pro' | 'enterprise';
    readonly createdAt: string;
}
interface SwitcherSource {
    readonly id: string;
    readonly type: 'webrtc' | 'srt' | 'ndi' | 'rtmp' | 'hls';
    readonly label: string;
    readonly status: 'connecting' | 'active' | 'error' | 'disconnected';
}
interface TransitionOptions {
    readonly type: 'cut' | 'mix' | 'wipe' | 'dip' | 'dve';
    readonly durationMs?: number;
    readonly wipePattern?: string;
}
interface CreateSwitcherOptions {
    readonly name: string;
    readonly resolution?: '720p' | '1080p' | '4k';
    readonly frameRate?: 30 | 60;
}
interface AddSourceOptions {
    readonly type: 'webrtc' | 'srt' | 'ndi' | 'rtmp';
    readonly label: string;
    readonly config: Record<string, unknown>;
}
interface AddOutputOptions {
    readonly type: 'rtmp' | 'srt' | 'hls' | 'recording';
    readonly config: Record<string, unknown>;
}
declare class CloudSwitcherAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    create(options: CreateSwitcherOptions): Promise<SwitcherInstance>;
    get(switcherId: string): Promise<SwitcherInstance>;
    list(): Promise<SwitcherInstance[]>;
    remove(switcherId: string): Promise<void>;
    addSource(switcherId: string, options: AddSourceOptions): Promise<SwitcherSource>;
    removeSource(switcherId: string, sourceId: string): Promise<void>;
    switchTo(switcherId: string, sourceId: string): Promise<void>;
    transition(switcherId: string, options: TransitionOptions): Promise<void>;
    addOutput(switcherId: string, options: AddOutputOptions): Promise<{
        id: string;
    }>;
    startStreaming(switcherId: string, outputId: string): Promise<void>;
    stopStreaming(switcherId: string, outputId: string): Promise<void>;
    startRecording(switcherId: string): Promise<void>;
    stopRecording(switcherId: string): Promise<void>;
}
declare function createCloudSwitcherAPI(client: WaveClient): CloudSwitcherAPI;

export { type AddOutputOptions, type AddSourceOptions, CloudSwitcherAPI, type CreateSwitcherOptions, type SwitcherInstance, type SwitcherSource, type TransitionOptions, createCloudSwitcherAPI };
