/**
 * WAVE Camera Control SDK
 *
 * Discover and control cameras from any manufacturer.
 *
 * @packageDocumentation
 */

import type { WaveClient } from './client';

export interface ManagedCamera {
  readonly id: string;
  readonly name: string;
  readonly manufacturer: 'blackmagic' | 'sony' | 'canon' | 'ptzoptics' | 'other';
  readonly model: string | null;
  readonly ipAddress: string;
  readonly status: 'online' | 'offline' | 'error';
  readonly controlProtocol: string;
}

export interface CameraPreset {
  readonly id: string;
  readonly name: string;
  readonly slot: number;
}

export interface CameraControlParams {
  readonly iris?: number;
  readonly focus?: number;
  readonly zoom?: number;
  readonly whiteBalance?: { temperature: number; tint: number };
  readonly gain?: number;
  readonly shutter?: number;
  readonly panTilt?: { pan: number; tilt: number; speed: number };
}

export class CameraControlAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/cameras';

  constructor(client: WaveClient) {
    this.client = client;
  }

  async discover(): Promise<ManagedCamera[]> {
    return this.client.post<ManagedCamera[]>(`${this.basePath}/discover`, {});
  }

  async list(): Promise<ManagedCamera[]> {
    return this.client.get<ManagedCamera[]>(this.basePath);
  }

  async get(cameraId: string): Promise<ManagedCamera> {
    return this.client.get<ManagedCamera>(`${this.basePath}/${cameraId}`);
  }

  async control(cameraId: string, params: CameraControlParams): Promise<void> {
    const controlPath = `${this.basePath}/${cameraId}/control`;
    const commands: Promise<unknown>[] = [];

    if (params.iris !== undefined) {
      commands.push(this.client.post(controlPath, { type: 'set_iris', value: params.iris }));
    }
    if (params.focus !== undefined) {
      commands.push(this.client.post(controlPath, { type: 'set_focus', value: params.focus }));
    }
    if (params.zoom !== undefined) {
      commands.push(this.client.post(controlPath, { type: 'set_zoom', value: params.zoom }));
    }
    if (params.whiteBalance) {
      commands.push(this.client.post(controlPath, {
        type: 'set_white_balance',
        temperature: params.whiteBalance.temperature,
        tint: params.whiteBalance.tint,
      }));
    }
    if (params.gain !== undefined) {
      commands.push(this.client.post(controlPath, { type: 'set_gain', value: params.gain }));
    }
    if (params.panTilt) {
      commands.push(this.client.post(controlPath, { type: 'set_pan_tilt', ...params.panTilt }));
    }

    await Promise.all(commands);
  }

  async autofocus(cameraId: string): Promise<void> {
    await this.client.post(`${this.basePath}/${cameraId}/control`, { type: 'autofocus_trigger' });
  }

  async savePreset(cameraId: string, name: string, slot: number): Promise<CameraPreset> {
    return this.client.post<CameraPreset>(`${this.basePath}/${cameraId}/presets`, { name, slot });
  }

  async recallPreset(cameraId: string, presetId: string): Promise<void> {
    await this.client.post(`${this.basePath}/${cameraId}/control`, { type: 'recall_preset', presetId });
  }

  async listPresets(cameraId: string): Promise<CameraPreset[]> {
    return this.client.get<CameraPreset[]>(`${this.basePath}/${cameraId}/presets`);
  }

  async startRecording(cameraId: string): Promise<void> {
    await this.client.post(`${this.basePath}/${cameraId}/control`, { type: 'start_recording' });
  }

  async stopRecording(cameraId: string): Promise<void> {
    await this.client.post(`${this.basePath}/${cameraId}/control`, { type: 'stop_recording' });
  }
}

export function createCameraControlAPI(client: WaveClient): CameraControlAPI {
  return new CameraControlAPI(client);
}
