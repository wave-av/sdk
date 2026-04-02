/**
 * WAVE SDK - Audience API
 *
 * Interactive audience engagement: polls, Q&A, reactions, and engagement metrics.
 */

import type { WaveClient } from "./client";

export type PollStatus = "draft" | "active" | "closed";

export interface Poll {
  id: string;
  stream_id: string;
  question: string;
  options: PollOption[];
  status: PollStatus;
  total_votes: number;
  allow_multiple: boolean;
  show_results: boolean;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
}
export interface PollOption {
  id: string;
  text: string;
  vote_count: number;
  percentage: number;
}
export interface QASession {
  id: string;
  stream_id: string;
  status: "active" | "paused" | "closed";
  questions: Question[];
  allow_anonymous: boolean;
  moderated: boolean;
  created_at: string;
}
export interface Question {
  id: string;
  session_id: string;
  text: string;
  author: string;
  upvotes: number;
  answered: boolean;
  answer?: string;
  pinned: boolean;
  created_at: string;
}
export interface ReactionBurst {
  stream_id: string;
  type: "like" | "love" | "fire" | "clap" | "laugh" | "wow";
  count: number;
  timestamp: string;
}
export interface EngagementMetrics {
  stream_id: string;
  active_participants: number;
  chat_rate_per_minute: number;
  reaction_rate: number;
  poll_participation_rate: number;
  qa_questions: number;
  peak_engagement_at: string;
}
export interface CreatePollRequest {
  stream_id: string;
  question: string;
  options: string[];
  allow_multiple?: boolean;
  show_results?: boolean;
  duration_seconds?: number;
}
export interface CreateQARequest {
  stream_id: string;
  allow_anonymous?: boolean;
  moderated?: boolean;
}

/**
 * Interactive audience engagement: live polls, Q&A sessions, and reactions.
 *
 * @example
 * ```typescript
 * const poll = await wave.audience.createPoll({ stream_id: id, question: "Best feature?", options: ["A", "B", "C"] });
 * const metrics = await wave.audience.getEngagementMetrics(streamId);
 * ```
 */
export class AudienceAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/audience";
  constructor(client: WaveClient) {
    this.client = client;
  }

  async createPoll(request: CreatePollRequest): Promise<Poll> {
    return this.client.post<Poll>(`${this.basePath}/polls`, request);
  }
  async getPoll(pollId: string): Promise<Poll> {
    return this.client.get<Poll>(`${this.basePath}/polls/${pollId}`);
  }
  async closePoll(pollId: string): Promise<Poll> {
    return this.client.post<Poll>(`${this.basePath}/polls/${pollId}/close`);
  }
  async getPollResults(pollId: string): Promise<Poll> {
    return this.client.get<Poll>(`${this.basePath}/polls/${pollId}/results`);
  }
  async vote(pollId: string, optionIds: string[]): Promise<void> {
    await this.client.post(`${this.basePath}/polls/${pollId}/vote`, { option_ids: optionIds });
  }
  async createQA(request: CreateQARequest): Promise<QASession> {
    return this.client.post<QASession>(`${this.basePath}/qa`, request);
  }
  async getQA(sessionId: string): Promise<QASession> {
    return this.client.get<QASession>(`${this.basePath}/qa/${sessionId}`);
  }
  async closeQA(sessionId: string): Promise<QASession> {
    return this.client.post<QASession>(`${this.basePath}/qa/${sessionId}/close`);
  }
  async submitQuestion(sessionId: string, text: string): Promise<Question> {
    return this.client.post<Question>(`${this.basePath}/qa/${sessionId}/questions`, { text });
  }
  async answerQuestion(sessionId: string, questionId: string, answer: string): Promise<Question> {
    return this.client.post<Question>(
      `${this.basePath}/qa/${sessionId}/questions/${questionId}/answer`,
      { answer },
    );
  }
  async upvoteQuestion(sessionId: string, questionId: string): Promise<Question> {
    return this.client.post<Question>(
      `${this.basePath}/qa/${sessionId}/questions/${questionId}/upvote`,
    );
  }
  async pinQuestion(sessionId: string, questionId: string): Promise<Question> {
    return this.client.post<Question>(
      `${this.basePath}/qa/${sessionId}/questions/${questionId}/pin`,
    );
  }
  async sendReaction(streamId: string, type: ReactionBurst["type"]): Promise<void> {
    await this.client.post(`${this.basePath}/reactions`, { stream_id: streamId, type });
  }
  async getReactionMetrics(streamId: string): Promise<ReactionBurst[]> {
    return this.client.get<ReactionBurst[]>(`${this.basePath}/reactions/${streamId}`);
  }
  async getEngagementMetrics(streamId: string): Promise<EngagementMetrics> {
    return this.client.get<EngagementMetrics>(`${this.basePath}/engagement/${streamId}`);
  }
}

export function createAudienceAPI(client: WaveClient): AudienceAPI {
  return new AudienceAPI(client);
}
