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

export interface LearningControlStatusResponse {
  child_id: string;
  local_date: string;
  today_minutes: number;
  active_session_minutes: number;
  session_count: number;
  has_activity_today: boolean;
  daily_screen_time_limit: number | null;
  screen_time_warning_threshold: number;
  enable_time_limits: boolean;
  remaining_minutes: number | null;
  warning_reached: boolean;
  limit_reached: boolean;
  daily_reminder_enabled: boolean;
  daily_reminder_time: string;
}

export interface DailyStatsResponse {
  date: string;
  total_minutes: number;
  words_encountered: number;
  words_mastered: number;
  activities_completed: number;
  xp_earned: number;
  session_count: number;
  average_engagement: number;
  daily_goal_progress: number;
  goal_achieved: boolean;
}

export interface ChildAchievementResponse {
  achievement_id: string;
  achievement_name: string;
  achievement_icon: string;
  earned_at: string;
  viewed: boolean;
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
 * Get today's accumulated learning time and effective reminder/time-limit state
 */
export async function getLearningControlStatus(
  childId: string,
): Promise<LearningControlStatusResponse> {
  return apiRequest<LearningControlStatusResponse>(
    `/progress/${childId}/usage-status`,
  );
}

/**
 * Get daily stats
 */
export async function getDailyStats(
  childId: string,
  days: number = 7,
): Promise<DailyStatsResponse[]> {
  return apiRequest<DailyStatsResponse[]>(
    `/analytics/${childId}/daily?days=${days}`,
  );
}

/**
 * Get achievements
 */
export async function getAchievements(
  childId: string,
): Promise<ChildAchievementResponse[]> {
  return apiRequest<ChildAchievementResponse[]>(
    `/analytics/${childId}/achievements`,
  );
}
