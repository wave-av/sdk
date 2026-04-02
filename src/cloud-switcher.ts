/**
 * WAVE Cloud Switcher SDK
 *
 * Control cloud video switchers programmatically.
 *
 * @packageDocumentation
 */

import type { WaveClient } from './client';

export interface SwitcherInstance {
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

export interface SwitcherSource {
  readonly id: string;
  readonly type: 'webrtc' | 'srt' | 'ndi' | 'rtmp' | 'hls';
  readonly label: string;
  readonly status: 'connecting' | 'active' | 'error' | 'disconnected';
}

export interface TransitionOptions {
  readonly type: 'cut' | 'mix' | 'wipe' | 'dip' | 'dve';
  readonly durationMs?: number;
  readonly wipePattern?: string;
}

export interface CreateSwitcherOptions {
  readonly name: string;
  readonly resolution?: '720p' | '1080p' | '4k';
  readonly frameRate?: 30 | 60;
}

export interface AddSourceOptions {
  readonly type: 'webrtc' | 'srt' | 'ndi' | 'rtmp';
  readonly label: string;
  readonly config: Record<string, unknown>;
}

export interface AddOutputOptions {
  readonly type: 'rtmp' | 'srt' | 'hls' | 'recording';
  readonly config: Record<string, unknown>;
}

export class CloudSwitcherAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/switcher';

  constructor(client: WaveClient) {
    this.client = client;
  }

  async create(options: CreateSwitcherOptions): Promise<SwitcherInstance> {
    return this.client.post<SwitcherInstance>(this.basePath, options);
  }

  async get(switcherId: string): Promise<SwitcherInstance> {
    return this.client.get<SwitcherInstance>(`${this.basePath}/${switcherId}`);
  }

  async list(): Promise<SwitcherInstance[]> {
    return this.client.get<SwitcherInstance[]>(this.basePath);
  }

  async remove(switcherId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${switcherId}`);
  }

  async addSource(switcherId: string, options: AddSourceOptions): Promise<SwitcherSource> {
    return this.client.post<SwitcherSource>(`${this.basePath}/${switcherId}/sources`, options);
  }

  async removeSource(switcherId: string, sourceId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${switcherId}/sources/${sourceId}`);
  }

  async switchTo(switcherId: string, sourceId: string): Promise<void> {
    await this.client.post(`${this.basePath}/${switcherId}/control`, { type: 'switch', sourceId });
  }

  async transition(switcherId: string, options: TransitionOptions): Promise<void> {
    await this.client.post(`${this.basePath}/${switcherId}/control`, { type: 'transition', config: options });
  }

  async addOutput(switcherId: string, options: AddOutputOptions): Promise<{ id: string }> {
    return this.client.post<{ id: string }>(`${this.basePath}/${switcherId}/outputs`, options);
  }

  async startStreaming(switcherId: string, outputId: string): Promise<void> {
    await this.client.post(`${this.basePath}/${switcherId}/outputs/${outputId}/start`, {});
  }

  async stopStreaming(switcherId: string, outputId: string): Promise<void> {
    await this.client.post(`${this.basePath}/${switcherId}/outputs/${outputId}/stop`, {});
  }

  async startRecording(switcherId: string): Promise<void> {
    await this.client.post(`${this.basePath}/${switcherId}/record/start`, {});
  }

  async stopRecording(switcherId: string): Promise<void> {
    await this.client.post(`${this.basePath}/${switcherId}/record/stop`, {});
  }
}

export function createCloudSwitcherAPI(client: WaveClient): CloudSwitcherAPI {
  return new CloudSwitcherAPI(client);
}
