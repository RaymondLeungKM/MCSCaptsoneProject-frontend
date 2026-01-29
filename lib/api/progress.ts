/**
 * Progress & Analytics API
 */
import { apiRequest } from "./client";

export interface LearningSessionCreate {
  child_id: string;
  start_time: string;
  words_encountered?: string[];
  activities_completed?: Array<{
    type: string;
    id: string;
    duration_minutes: number;
  }>;
}

export interface LearningSessionUpdate {
  end_time: string;
  words_encountered: string[];
  words_used_actively?: string[];
  activities_completed: Array<{
    type: string;
    id: string;
    duration_minutes: number;
  }>;
  engagement_level?: "low" | "medium" | "high";
  interactions_count?: number;
}

export interface ProgressStatsResponse {
  total_words: number;
  mastered_words: number;
  active_vocabulary: number;
  passive_vocabulary: number;
  weekly_progress: number[];
  streak_days: number;
  category_progress: Array<{
    category: string;
    progress: number;
    mastered: number;
    total: number;
  }>;
  average_exposures_per_word: number;
  multi_sensory_engagement: number;
}

/**
 * Start a learning session
 */
export async function startLearningSession(
  data: LearningSessionCreate,
): Promise<{ id: string }> {
  return apiRequest("/progress/session", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * End a learning session
 */
export async function endLearningSession(
  sessionId: string,
  data: LearningSessionUpdate,
): Promise<void> {
  return apiRequest(`/progress/session/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Get overall progress stats for a child
 */
export async function getProgressStats(
  childId: string,
): Promise<ProgressStatsResponse> {
  return apiRequest<ProgressStatsResponse>(`/progress/${childId}/stats`);
}

/**
 * Get daily stats
 */
export async function getDailyStats(
  childId: string,
  days: number = 7,
): Promise<any[]> {
  return apiRequest(`/analytics/${childId}/daily?days=${days}`);
}

/**
 * Get achievements
 */
export async function getAchievements(childId: string): Promise<any[]> {
  return apiRequest(`/analytics/${childId}/achievements`);
}
