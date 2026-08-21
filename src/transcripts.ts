import type { WaveClient } from "./client";

/**
 * The voice-agent transcript (system + alternating user/assistant) persisted to R2 by the
 * realtime-edge's `AgentSessionDO.persistTranscript()`. Reached via the gateway's
 * `GET /v1/realtime/agents/transcripts/:org[/:room/:session]` surface.
 */
export interface TranscriptMessage {
  role: "system" | "user" | "assistant";
  content: string | unknown;
}

export interface Transcript {
  org: string;
  roomId: string;
  sessionId: string;
  recordedAt: number;
  messages: TranscriptMessage[];
}

export interface TranscriptList {
  org: string;
  count: number;
  transcripts: string[];
}

/**
 * TranscriptAPI — the voice-agent transcript client. Read-only; lists + reads the retained
 * transcripts for an org over the same `transcripts/*` surface the browser uses (one read path).
 */
export class TranscriptAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/realtime/agents/transcripts";

  constructor(client: WaveClient) {
    this.client = client;
  }

  /** List the transcript object keys recorded for an org. */
  async list(org: string): Promise<TranscriptList> {
    return this.client.get<TranscriptList>(`${this.basePath}/${encodeURIComponent(org)}`);
  }

  /** Read one session's transcript. */
  async get(org: string, room: string, session: string): Promise<Transcript> {
    return this.client.get<Transcript>(
      `${this.basePath}/${encodeURIComponent(org)}/${encodeURIComponent(room)}/${encodeURIComponent(session)}`,
    );
  }
}
