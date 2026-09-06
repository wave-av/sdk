import { WaveClient } from './client.mjs';
import { PhoneNumberType, PhoneNumber, SearchNumbersRequest, AvailablePhoneNumber, MakeCallRequest, Call, ListCallsParams, UpdateCallRequest, Conference, ConferenceParticipant } from './phone-types.mjs';
export { CallDirection, CallStatus, PhoneNumberCapabilities } from './phone-types.mjs';
import { PaginationParams, PaginatedResponse, Metadata } from './client-types.mjs';
import 'eventemitter3';
import './telemetry.mjs';

/**
 * WAVE SDK - Phone API
 *
 * Voice calling and telephony integration capabilities.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

/**
 * Call status
 */
/**
 * Call direction
 */
/**
 * Phone number type
 */
/**
 * Phone number capabilities
 */
/**
 * Phone number
 */
/**
 * Call record
 */
/**
 * Make call request
 */
/**
 * Call update request
 */
/**
 * Conference room
 */
/**
 * Conference participant
 */
/**
 * Search available numbers request
 */
/**
 * Available phone number
 */
/**
 * List calls params
 */
/**
 * Phone API client
 */
declare class PhoneAPI {
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
declare function createPhoneAPI(client: WaveClient): PhoneAPI;

export { AvailablePhoneNumber, Call, Conference, ConferenceParticipant, ListCallsParams, MakeCallRequest, PhoneAPI, PhoneNumber, PhoneNumberType, SearchNumbersRequest, UpdateCallRequest, createPhoneAPI };
