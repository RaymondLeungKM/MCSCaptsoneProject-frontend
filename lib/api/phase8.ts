/**
 * Phase 8 – Advanced AI & Personalization API client
 *
 * Covers:
 *   Epic 8.1  – Word Knowledge Graph
 *   Epic 8.2  – Spaced Repetition (SM-2), Learning Style Detection, Tutor Chat
 */
import { apiRequest } from "./client";
import type {
  WordGraph,
  GraphRecommendation,
  ReviewQueue,
  ReviewResult,
  SpacedRepetitionCard,
  LearningSpeedProfile,
  LearningStyleResponse,
  TutorChatMessage,
  TutorChatResponse,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Epic 8.1 – Knowledge Graph
// ---------------------------------------------------------------------------

/**
 * Fetch the sub-graph centred on a specific word.
 * depth 1 = direct neighbours, 2 = neighbours-of-neighbours.
 */
export async function getWordGraph(
  childId: string,
  wordId: string,
  depth: 1 | 2 = 1,
): Promise<WordGraph> {
  return apiRequest<WordGraph>(
    `/adaptive/${childId}/word-graph/${wordId}?depth=${depth}`,
  );
}

/**
 * Get graph-based vocabulary recommendations for a child.
 */
export async function getGraphRecommendations(
  childId: string,
  limit = 5,
): Promise<GraphRecommendation> {
  return apiRequest<GraphRecommendation>(
    `/adaptive/${childId}/graph-recommendations?limit=${limit}`,
  );
}

/**
 * Create a directed edge in the knowledge graph (admin / AI pipeline use).
 */
export async function addWordRelationship(payload: {
  word_id: string;
  related_word_id: string;
  relationship_type?: string;
  strength?: number;
  source?: string;
}): Promise<void> {
  return apiRequest<void>(`/adaptive/word-relationships`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Epic 8.2 – Spaced Repetition
// ---------------------------------------------------------------------------

/**
 * Get the SM-2 review queue for a child (cards due today + new cards).
 */
export async function getReviewQueue(
  childId: string,
  maxCards = 20,
  maxNew = 5,
): Promise<ReviewQueue> {
  return apiRequest<ReviewQueue>(
    `/adaptive/${childId}/review-queue?max_cards=${maxCards}&max_new=${maxNew}`,
  );
}

/**
 * Submit a review result (quality 0-5) and get the updated schedule.
 */
export async function submitReview(
  childId: string,
  wordId: string,
  quality: 0 | 1 | 2 | 3 | 4 | 5,
): Promise<ReviewResult> {
  return apiRequest<ReviewResult>(`/adaptive/${childId}/review`, {
    method: "POST",
    body: JSON.stringify({ word_id: wordId, quality }),
  });
}

/**
 * Get the child's learning-speed profile derived from SM-2 history.
 */
export async function getLearningSpeedProfile(
  childId: string,
): Promise<LearningSpeedProfile> {
  return apiRequest<LearningSpeedProfile>(
    `/adaptive/${childId}/learning-speed`,
  );
}

// ---------------------------------------------------------------------------
// Epic 8.2.3 – Learning Style Detection
// ---------------------------------------------------------------------------

/**
 * Send observed engagement scores and update the child's learning style.
 */
export async function updateLearningStyle(
  childId: string,
  scores: {
    kinesthetic_score: number;
    visual_score: number;
    auditory_score: number;
    sessions_analysed?: number;
  },
): Promise<LearningStyleResponse> {
  return apiRequest<LearningStyleResponse>(
    `/adaptive/${childId}/learning-style`,
    {
      method: "POST",
      body: JSON.stringify({ child_id: childId, ...scores }),
    },
  );
}

// ---------------------------------------------------------------------------
// Epic 8.2.4 – AI Tutor Chat
// ---------------------------------------------------------------------------

/**
 * Send a question to the AI tutor and receive a Cantonese answer.
 */
export async function sendTutorMessage(
  childId: string,
  question: string,
  wordId?: string,
  history: TutorChatMessage[] = [],
): Promise<TutorChatResponse> {
  return apiRequest<TutorChatResponse>(`/tutor/${childId}/chat`, {
    method: "POST",
    body: JSON.stringify({
      child_id: childId,
      question,
      word_id: wordId ?? null,
      history,
    }),
  });
}
