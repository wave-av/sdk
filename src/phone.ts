/**
 * WAVE SDK - Phone API
 *
 * Voice calling and telephony integration capabilities.
 *
 * NOTE: This is a client SDK. All authorization checks are performed server-side.
 * The API will return 403 Forbidden if the user lacks required permissions.
 */

import type {
  WaveClient,
  PaginationParams,
  PaginatedResponse,
  Timestamps,
  Metadata,
} from './client';
import type { CallStatus, CallDirection, PhoneNumberType, PhoneNumberCapabilities, PhoneNumber, Call, MakeCallRequest, UpdateCallRequest, Conference, ConferenceParticipant, SearchNumbersRequest, AvailablePhoneNumber, ListCallsParams } from './phone-types';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Phone API
// ============================================================================

/**
 * Phone API client
 */
export class PhoneAPI {
  private readonly client: WaveClient;
  private readonly basePath = '/v1/phone';

  constructor(client: WaveClient) {
    this.client = client;
  }

  // ==========================================================================
  // Phone Numbers
  // ==========================================================================

  /**
   * List owned phone numbers
   *
   * Requires: phone:read permission
   */
  async listNumbers(
    params?: PaginationParams & {
      status?: 'active' | 'inactive';
      type?: PhoneNumberType;
    }
  ): Promise<PaginatedResponse<PhoneNumber>> {
    return this.client.get<PaginatedResponse<PhoneNumber>>(
      `${this.basePath}/numbers`,
      { params: params as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Get a phone number by ID
   *
   * Requires: phone:read permission
   */
  async getNumber(numberId: string): Promise<PhoneNumber> {
    return this.client.get<PhoneNumber>(`${this.basePath}/numbers/${numberId}`);
  }

  /**
   * Search for available phone numbers to purchase
   *
   * Requires: phone:read permission
   */
  async searchAvailableNumbers(
    request: SearchNumbersRequest
  ): Promise<AvailablePhoneNumber[]> {
    return this.client.post<AvailablePhoneNumber[]>(
      `${this.basePath}/numbers/available`,
      request
    );
  }

  /**
   * Purchase a phone number
   *
   * Requires: phone:purchase permission
   */
  async purchaseNumber(
    number: string,
    options?: { friendly_name?: string; metadata?: Metadata }
  ): Promise<PhoneNumber> {
    return this.client.post<PhoneNumber>(`${this.basePath}/numbers/purchase`, {
      number,
      ...options,
    });
  }

  /**
   * Update a phone number
   *
   * Requires: phone:update permission
   */
  async updateNumber(
    numberId: string,
    updates: { friendly_name?: string; metadata?: Metadata }
  ): Promise<PhoneNumber> {
    return this.client.patch<PhoneNumber>(
      `${this.basePath}/numbers/${numberId}`,
      updates
    );
  }

  /**
   * Release a phone number
   *
   * Requires: phone:release permission (server-side RBAC enforced)
   */
  async releaseNumber(numberId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/numbers/${numberId}`,
      { method: 'DELETE' }
    );
  }

  // ==========================================================================
  // Calls
  // ==========================================================================

  /**
   * Make an outbound call
   *
   * Requires: phone:call permission
   */
  async makeCall(request: MakeCallRequest): Promise<Call> {
    return this.client.post<Call>(`${this.basePath}/calls`, request);
  }

  /**
   * Get a call by ID
   *
   * Requires: phone:read permission
   */
  async getCall(callId: string): Promise<Call> {
    return this.client.get<Call>(`${this.basePath}/calls/${callId}`);
  }

  /**
   * List calls
   *
   * Requires: phone:read permission
   */
  async listCalls(params?: ListCallsParams): Promise<PaginatedResponse<Call>> {
    return this.client.get<PaginatedResponse<Call>>(
      `${this.basePath}/calls`,
      { params: params as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Update an active call
   *
   * Requires: phone:call permission
   */
  async updateCall(callId: string, updates: UpdateCallRequest): Promise<Call> {
    return this.client.patch<Call>(`${this.basePath}/calls/${callId}`, updates);
  }

  /**
   * End an active call
   *
   * Requires: phone:call permission
   */
  async endCall(callId: string): Promise<Call> {
    return this.updateCall(callId, { status: 'completed' });
  }

  /**
   * Get call recording
   *
   * Requires: phone:read permission
   */
  async getRecording(
    callId: string
  ): Promise<{ url: string; duration: number; file_size: number }> {
    return this.client.get(`${this.basePath}/calls/${callId}/recording`);
  }

  /**
   * Wait for call to end
   */
  async waitForCallEnd(
    callId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onUpdate?: (call: Call) => void;
    }
  ): Promise<Call> {
    const pollInterval = options?.pollInterval || 2000;
    const timeout = options?.timeout || 3600000; // 1 hour
    const startTime = Date.now();

    const terminalStatuses: CallStatus[] = [
      'completed',
      'failed',
      'busy',
      'no_answer',
      'canceled',
    ];

    while (Date.now() - startTime < timeout) {
      const call = await this.getCall(callId);

      if (options?.onUpdate) {
        options.onUpdate(call);
      }

      if (terminalStatuses.includes(call.status)) {
        return call;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Call wait timed out after ${timeout}ms`);
  }

  // ==========================================================================
  // Conferences
  // ==========================================================================

  /**
   * Create a conference room
   *
   * Requires: phone:conference permission
   */
  async createConference(options: {
    friendly_name: string;
    max_participants?: number;
    recording_enabled?: boolean;
    region?: string;
    metadata?: Metadata;
  }): Promise<Conference> {
    return this.client.post<Conference>(`${this.basePath}/conferences`, options);
  }

  /**
   * Get a conference by ID
   *
   * Requires: phone:read permission
   */
  async getConference(conferenceId: string): Promise<Conference> {
    return this.client.get<Conference>(
      `${this.basePath}/conferences/${conferenceId}`
    );
  }

  /**
   * List conferences
   *
   * Requires: phone:read permission
   */
  async listConferences(
    params?: PaginationParams & { status?: 'init' | 'in_progress' | 'completed' }
  ): Promise<PaginatedResponse<Conference>> {
    return this.client.get<PaginatedResponse<Conference>>(
      `${this.basePath}/conferences`,
      { params: params as Record<string, string | number | boolean | undefined> }
    );
  }

  /**
   * Add a participant to a conference
   *
   * Requires: phone:conference permission
   */
  async addConferenceParticipant(
    conferenceId: string,
    options: {
      from: string;
      to: string;
      muted?: boolean;
    }
  ): Promise<ConferenceParticipant> {
    return this.client.post<ConferenceParticipant>(
      `${this.basePath}/conferences/${conferenceId}/participants`,
      options
    );
  }

  /**
   * Update a conference participant
   *
   * Requires: phone:conference permission
   */
  async updateConferenceParticipant(
    conferenceId: string,
    callId: string,
    updates: { muted?: boolean; hold?: boolean }
  ): Promise<ConferenceParticipant> {
    return this.client.patch<ConferenceParticipant>(
      `${this.basePath}/conferences/${conferenceId}/participants/${callId}`,
      updates
    );
  }

  /**
   * Remove a participant from a conference
   *
   * Requires: phone:conference permission (server-side RBAC enforced)
   */
  async removeConferenceParticipant(
    conferenceId: string,
    callId: string
  ): Promise<void> {
    await this.client.delete(
      `${this.basePath}/conferences/${conferenceId}/participants/${callId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * End a conference
   *
   * Requires: phone:conference permission
   */
  async endConference(conferenceId: string): Promise<Conference> {
    return this.client.post<Conference>(
      `${this.basePath}/conferences/${conferenceId}/end`
    );
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Validate a phone number
   *
   * Requires: phone:read permission
   */
  async validateNumber(
    number: string
  ): Promise<{
    valid: boolean;
    formatted_number?: string;
    country_code?: string;
    type?: PhoneNumberType;
    carrier?: string;
  }> {
    return this.client.post(`${this.basePath}/validate`, { number });
  }

  /**
   * Get supported countries
   *
   * Requires: phone:read permission
   */
  async getSupportedCountries(): Promise<
    Array<{
      code: string;
      name: string;
      calling_code: string;
      supported_types: PhoneNumberType[];
    }>
  > {
    return this.client.get(`${this.basePath}/countries`);
  }
}

/**
 * Create a Phone API instance
 */
export function createPhoneAPI(client: WaveClient): PhoneAPI {
  return new PhoneAPI(client);
}
