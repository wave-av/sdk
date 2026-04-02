/**
 * WAVE SDK - Phone API
 *
 * Voice calling and telephony integration capabilities.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */
import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps, Metadata } from './client';
/**
 * Call status
 */
export type CallStatus = 'initiating' | 'ringing' | 'in_progress' | 'completed' | 'failed' | 'busy' | 'no_answer' | 'canceled';
/**
 * Call direction
 */
export type CallDirection = 'inbound' | 'outbound';
/**
 * Phone number type
 */
export type PhoneNumberType = 'local' | 'toll_free' | 'mobile' | 'voip';
/**
 * Phone number capabilities
 */
export interface PhoneNumberCapabilities {
    voice: boolean;
    sms: boolean;
    mms: boolean;
    fax: boolean;
}
/**
 * Phone number
 */
export interface PhoneNumber extends Timestamps {
    id: string;
    organization_id: string;
    number: string;
    formatted_number: string;
    country_code: string;
    type: PhoneNumberType;
    capabilities: PhoneNumberCapabilities;
    friendly_name?: string;
    status: 'active' | 'inactive' | 'pending';
    monthly_cost: number;
    metadata?: Metadata;
}
/**
 * Call record
 */
export interface Call extends Timestamps {
    id: string;
    organization_id: string;
    from_number: string;
    to_number: string;
    direction: CallDirection;
    status: CallStatus;
    duration?: number;
    start_time?: string;
    end_time?: string;
    recording_url?: string;
    transcription_id?: string;
    cost?: number;
    metadata?: Metadata;
}
/**
 * Make call request
 */
export interface MakeCallRequest {
    /** Phone number to call from (must be owned) */
    from: string;
    /** Phone number to call */
    to: string;
    /** URL for call status webhooks */
    status_callback_url?: string;
    /** URL for call instructions (TwiML or similar) */
    url?: string;
    /** Timeout in seconds before no-answer */
    timeout?: number;
    /** Record the call */
    record?: boolean;
    /** Enable transcription */
    transcribe?: boolean;
    /** Custom data to include with call events */
    metadata?: Metadata;
}
/**
 * Call update request
 */
export interface UpdateCallRequest {
    /** URL for new call instructions */
    url?: string;
    /** End the call */
    status?: 'completed' | 'canceled';
    /** Mute/unmute the call */
    muted?: boolean;
}
/**
 * Conference room
 */
export interface Conference extends Timestamps {
    id: string;
    organization_id: string;
    friendly_name: string;
    status: 'init' | 'in_progress' | 'completed';
    region?: string;
    participants: ConferenceParticipant[];
    max_participants?: number;
    recording_enabled: boolean;
    recording_url?: string;
    metadata?: Metadata;
}
/**
 * Conference participant
 */
export interface ConferenceParticipant {
    call_id: string;
    phone_number: string;
    status: 'connecting' | 'connected' | 'disconnected';
    muted: boolean;
    hold: boolean;
    start_time?: string;
    duration?: number;
}
/**
 * Search available numbers request
 */
export interface SearchNumbersRequest {
    country_code: string;
    type?: PhoneNumberType;
    area_code?: string;
    contains?: string;
    capabilities?: Partial<PhoneNumberCapabilities>;
    limit?: number;
}
/**
 * Available phone number
 */
export interface AvailablePhoneNumber {
    number: string;
    formatted_number: string;
    country_code: string;
    type: PhoneNumberType;
    capabilities: PhoneNumberCapabilities;
    region?: string;
    city?: string;
    monthly_cost: number;
}
/**
 * List calls params
 */
export interface ListCallsParams extends PaginationParams {
    status?: CallStatus;
    direction?: CallDirection;
    from_number?: string;
    to_number?: string;
    start_after?: string;
    start_before?: string;
}
/**
 * Phone API client
 *
 * All operations require appropriate permissions. Authorization is enforced
 * server-side - the API returns 403 if the authenticated user lacks access.
 *
 * @example
 * ```typescript
 * import { WaveClient } from '@wave/sdk';
 * import { PhoneAPI } from '@wave/sdk/phone';
 *
 * const client = new WaveClient({ apiKey: 'your-api-key' });
 * const phone = new PhoneAPI(client);
 *
 * // List owned phone numbers
 * const numbers = await phone.listNumbers();
 *
 * // Make a call
 * const call = await phone.makeCall({
 *   from: '+14155551234',
 *   to: '+14155555678',
 *   record: true,
 * });
 *
 * // Wait for call to complete
 * const completed = await phone.waitForCallEnd(call.id);
 * console.log('Call duration:', completed.duration);
 * ```
 */
export declare class PhoneAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    /**
     * List owned phone numbers
     *
     * Requires: phone:read permission
     */
    listNumbers(params?: PaginationParams & {
        status?: 'active' | 'inactive';
        type?: PhoneNumberType;
    }): Promise<PaginatedResponse<PhoneNumber>>;
    /**
     * Get a phone number by ID
     *
     * Requires: phone:read permission
     */
    getNumber(numberId: string): Promise<PhoneNumber>;
    /**
     * Search for available phone numbers to purchase
     *
     * Requires: phone:read permission
     */
    searchAvailableNumbers(request: SearchNumbersRequest): Promise<AvailablePhoneNumber[]>;
    /**
     * Purchase a phone number
     *
     * Requires: phone:purchase permission
     */
    purchaseNumber(number: string, options?: {
        friendly_name?: string;
        metadata?: Metadata;
    }): Promise<PhoneNumber>;
    /**
     * Update a phone number
     *
     * Requires: phone:update permission
     */
    updateNumber(numberId: string, updates: {
        friendly_name?: string;
        metadata?: Metadata;
    }): Promise<PhoneNumber>;
    /**
     * Release a phone number
     *
     * Requires: phone:release permission (server-side RBAC enforced)
     */
    releaseNumber(numberId: string): Promise<void>;
    /**
     * Make an outbound call
     *
     * Requires: phone:call permission
     */
    makeCall(request: MakeCallRequest): Promise<Call>;
    /**
     * Get a call by ID
     *
     * Requires: phone:read permission
     */
    getCall(callId: string): Promise<Call>;
    /**
     * List calls
     *
     * Requires: phone:read permission
     */
    listCalls(params?: ListCallsParams): Promise<PaginatedResponse<Call>>;
    /**
     * Update an active call
     *
     * Requires: phone:call permission
     */
    updateCall(callId: string, updates: UpdateCallRequest): Promise<Call>;
    /**
     * End an active call
     *
     * Requires: phone:call permission
     */
    endCall(callId: string): Promise<Call>;
    /**
     * Get call recording
     *
     * Requires: phone:read permission
     */
    getRecording(callId: string): Promise<{
        url: string;
        duration: number;
        file_size: number;
    }>;
    /**
     * Wait for call to end
     */
    waitForCallEnd(callId: string, options?: {
        pollInterval?: number;
        timeout?: number;
        onUpdate?: (call: Call) => void;
    }): Promise<Call>;
    /**
     * Create a conference room
     *
     * Requires: phone:conference permission
     */
    createConference(options: {
        friendly_name: string;
        max_participants?: number;
        recording_enabled?: boolean;
        region?: string;
        metadata?: Metadata;
    }): Promise<Conference>;
    /**
     * Get a conference by ID
     *
     * Requires: phone:read permission
     */
    getConference(conferenceId: string): Promise<Conference>;
    /**
     * List conferences
     *
     * Requires: phone:read permission
     */
    listConferences(params?: PaginationParams & {
        status?: 'init' | 'in_progress' | 'completed';
    }): Promise<PaginatedResponse<Conference>>;
    /**
     * Add a participant to a conference
     *
     * Requires: phone:conference permission
     */
    addConferenceParticipant(conferenceId: string, options: {
        from: string;
        to: string;
        muted?: boolean;
    }): Promise<ConferenceParticipant>;
    /**
     * Update a conference participant
     *
     * Requires: phone:conference permission
     */
    updateConferenceParticipant(conferenceId: string, callId: string, updates: {
        muted?: boolean;
        hold?: boolean;
    }): Promise<ConferenceParticipant>;
    /**
     * Remove a participant from a conference
     *
     * Requires: phone:conference permission (server-side RBAC enforced)
     */
    removeConferenceParticipant(conferenceId: string, callId: string): Promise<void>;
    /**
     * End a conference
     *
     * Requires: phone:conference permission
     */
    endConference(conferenceId: string): Promise<Conference>;
    /**
     * Validate a phone number
     *
     * Requires: phone:read permission
     */
    validateNumber(number: string): Promise<{
        valid: boolean;
        formatted_number?: string;
        country_code?: string;
        type?: PhoneNumberType;
        carrier?: string;
    }>;
    /**
     * Get supported countries
     *
     * Requires: phone:read permission
     */
    getSupportedCountries(): Promise<Array<{
        code: string;
        name: string;
        calling_code: string;
        supported_types: PhoneNumberType[];
    }>>;
}
/**
 * Create a Phone API instance
 */
export declare function createPhoneAPI(client: WaveClient): PhoneAPI;
