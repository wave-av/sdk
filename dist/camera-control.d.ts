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
    readonly whiteBalance?: {
        temperature: number;
        tint: number;
    };
    readonly gain?: number;
    readonly shutter?: number;
    readonly panTilt?: {
        pan: number;
        tilt: number;
        speed: number;
    };
}
export declare class CameraControlAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    discover(): Promise<ManagedCamera[]>;
    list(): Promise<ManagedCamera[]>;
    get(cameraId: string): Promise<ManagedCamera>;
    control(cameraId: string, params: CameraControlParams): Promise<void>;
    autofocus(cameraId: string): Promise<void>;
    savePreset(cameraId: string, name: string, slot: number): Promise<CameraPreset>;
    recallPreset(cameraId: string, presetId: string): Promise<void>;
    listPresets(cameraId: string): Promise<CameraPreset[]>;
    startRecording(cameraId: string): Promise<void>;
    stopRecording(cameraId: string): Promise<void>;
}
export declare function createCameraControlAPI(client: WaveClient): CameraControlAPI;
