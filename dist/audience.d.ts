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
export declare class AudienceAPI {
    private readonly client;
    private readonly basePath;
    constructor(client: WaveClient);
    createPoll(request: CreatePollRequest): Promise<Poll>;
    getPoll(pollId: string): Promise<Poll>;
    closePoll(pollId: string): Promise<Poll>;
    getPollResults(pollId: string): Promise<Poll>;
    vote(pollId: string, optionIds: string[]): Promise<void>;
    createQA(request: CreateQARequest): Promise<QASession>;
    getQA(sessionId: string): Promise<QASession>;
    closeQA(sessionId: string): Promise<QASession>;
    submitQuestion(sessionId: string, text: string): Promise<Question>;
    answerQuestion(sessionId: string, questionId: string, answer: string): Promise<Question>;
    upvoteQuestion(sessionId: string, questionId: string): Promise<Question>;
    pinQuestion(sessionId: string, questionId: string): Promise<Question>;
    sendReaction(streamId: string, type: ReactionBurst["type"]): Promise<void>;
    getReactionMetrics(streamId: string): Promise<ReactionBurst[]>;
    getEngagementMetrics(streamId: string): Promise<EngagementMetrics>;
}
export declare function createAudienceAPI(client: WaveClient): AudienceAPI;
