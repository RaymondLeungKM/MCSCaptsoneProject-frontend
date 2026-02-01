/**
 * Children API
 */
import { apiRequest } from "./client";
import type { ChildProfile, LanguagePreference } from "../types";

export interface ChildCreateRequest {
  name: string;
  age: number;
  avatar?: string;
  daily_goal?: number;
  learning_style?: "visual" | "auditory" | "kinesthetic" | "mixed";
  attention_span?: number;
  preferred_time_of_day?: "morning" | "afternoon" | "evening";
  interests?: string[];
  language_preference?: LanguagePreference;
}

export interface ChildResponse {
  id: string;
  parent_id: string;
  name: string;
  avatar: string;
  age: number;
  level: number;
  xp: number;
  words_learned: number;
  current_streak: number;
  daily_goal: number;
  today_progress: number;
  learning_style: "visual" | "auditory" | "kinesthetic" | "mixed";
  attention_span: number;
  preferred_time_of_day: "morning" | "afternoon" | "evening";
  created_at: string;
  last_active?: string;
  interests: string[];
  language_preference?: LanguagePreference;
}

/**
 * Get all children for current user
 */
export async function getChildren(): Promise<ChildResponse[]> {
  return apiRequest<ChildResponse[]>("/children/");
}

/**
 * Get specific child by ID
 */
export async function getChild(childId: string): Promise<ChildResponse> {
  return apiRequest<ChildResponse>(`/children/${childId}`);
}

/**
 * Create new child profile
 */
export async function createChild(
  data: ChildCreateRequest,
): Promise<ChildResponse> {
  return apiRequest<ChildResponse>("/children/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update child profile
 */
export async function updateChild(
  childId: string,
  data: Partial<ChildCreateRequest>,
): Promise<ChildResponse> {
  return apiRequest<ChildResponse>(`/children/${childId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Delete child profile
 */
export async function deleteChild(childId: string): Promise<void> {
  return apiRequest<void>(`/children/${childId}`, {
    method: "DELETE",
  });
}

/**
 * Convert API response to ChildProfile type
 */
export function toChildProfile(response: ChildResponse): ChildProfile {
  return {
    id: response.id,
    name: response.name,
    avatar: response.avatar,
    age: response.age,
    level: response.level,
    xp: response.xp,
    wordsLearned: response.words_learned,
    currentStreak: response.current_streak,
    interests: response.interests,
    dailyGoal: response.daily_goal,
    todayProgress: response.today_progress,
    learningStyle: response.learning_style,
    attentionSpan: response.attention_span,
    preferredTimeOfDay: response.preferred_time_of_day,
    languagePreference: response.language_preference || "cantonese",
  };
}
