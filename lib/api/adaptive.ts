/**
 * Adaptive Learning API
 */
import { apiRequest } from "./client";

export interface AdaptiveLearningRecommendation {
  next_words: string[]; // Word IDs
  recommended_activity: string;
  difficulty: string;
  reason: string;
  estimated_duration: number;
}

export interface WordOfTheDayResponse {
  word_id: string;
  word: string;
  reason: string;
  priority_score: number;
}

/**
 * Get personalized recommendations for a child
 */
export async function getRecommendations(
  childId: string,
): Promise<AdaptiveLearningRecommendation> {
  return apiRequest<AdaptiveLearningRecommendation>(
    `/adaptive/${childId}/recommendations`,
  );
}

/**
 * Get word of the day for a child
 */
export async function getWordOfTheDay(
  childId: string,
): Promise<WordOfTheDayResponse> {
  return apiRequest<WordOfTheDayResponse>(
    `/adaptive/${childId}/word-of-the-day`,
  );
}

/**
 * Get next recommended activity
 */
export async function getNextActivity(childId: string): Promise<{
  recommended_activity: string;
  learning_style: string;
  attention_span: number;
  reason: string;
}> {
  return apiRequest(`/adaptive/${childId}/next-activity`);
}
