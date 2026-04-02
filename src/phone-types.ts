export type CallStatus =
  | 'initiating'
  | 'ringing'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'busy'
  | 'no_answer'
  | 'canceled';
export type CallDirection = 'inbound' | 'outbound';
export type PhoneNumberType = 'local' | 'toll_free' | 'mobile' | 'voip';
export interface PhoneNumberCapabilities {
  voice: boolean;
  sms: boolean;
  mms: boolean;
  fax: boolean;
}
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
export interface UpdateCallRequest {
  /** URL for new call instructions */
  url?: string;
  /** End the call */
  status?: 'completed' | 'canceled';
  /** Mute/unmute the call */
  muted?: boolean;
}
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
export interface ConferenceParticipant {
  call_id: string;
  phone_number: string;
  status: 'connecting' | 'connected' | 'disconnected';
  muted: boolean;
  hold: boolean;
  start_time?: string;
  duration?: number;
}
export interface SearchNumbersRequest {
  country_code: string;
  type?: PhoneNumberType;
  area_code?: string;
  contains?: string;
  capabilities?: Partial<PhoneNumberCapabilities>;
  limit?: number;
}
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
export interface ListCallsParams extends PaginationParams {
  status?: CallStatus;
  direction?: CallDirection;
  from_number?: string;
  to_number?: string;
  start_after?: string;
  start_before?: string;
}
