/**
 * API functions for bedtime stories
 */
import { apiRequest } from "./client";
import {
  DailyWordSummary,
  GeneratedStory,
  StoryGenerationRequest,
  StoryGenerationResponse,
} from "../types";

export interface TrackDailyWordRequest {
  child_id: string;
  word_id: string;
  date: string;
  exposure_count?: number;
  used_actively?: boolean;
  mastery_confidence?: number;
  learned_context?: Record<string, any>;
  include_in_story?: boolean;
  story_priority?: number;
}

/**
 * Track a word learned today for story generation
 */
export async function trackDailyWord(
  request: TrackDailyWordRequest,
): Promise<void> {
  await apiRequest("/bedtime-stories/track-word", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Get words learned today for a child
 */
export async function getDailyWords(
  childId: string,
  date?: string,
): Promise<DailyWordSummary[]> {
  const endpoint = date
    ? `/bedtime-stories/daily-words/${childId}?date=${date}`
    : `/bedtime-stories/daily-words/${childId}`;
  return apiRequest<DailyWordSummary[]>(endpoint);
}

/**
 * Generate a new bedtime story
 */
export async function generateStory(
  request: StoryGenerationRequest,
): Promise<StoryGenerationResponse> {
  return apiRequest<StoryGenerationResponse>("/bedtime-stories/generate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Get all stories for a child
 */
export async function getChildStories(
  childId: string,
  limit: number = 10,
): Promise<GeneratedStory[]> {
  return apiRequest<GeneratedStory[]>(
    `/bedtime-stories/list/${childId}?limit=${limit}`,
  );
}

/**
 * Get a specific story
 */
export async function getStory(
  childId: string,
  storyId: string,
): Promise<GeneratedStory> {
  return apiRequest<GeneratedStory>(`/bedtime-stories/${childId}/${storyId}`);
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(
  childId: string,
  storyId: string,
): Promise<{ is_favorite: boolean }> {
  return apiRequest<{ is_favorite: boolean }>(
    `/bedtime-stories/${childId}/${storyId}/favorite`,
    {
      method: "PATCH",
    },
  );
}
