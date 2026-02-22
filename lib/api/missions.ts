/**
 * Missions API
 * Offline and daily missions for parent-child activities
 */
import { apiRequest } from "./client";
import type { OfflineMission } from "../types";

// ─── Backend response shapes ────────────────────────────────────────────────

export interface MissionResponse {
  id: string;
  title: string;
  description: string;
  context:
    | "mealtime"
    | "bedtime"
    | "playtime"
    | "outdoor"
    | "shopping"
    | "general";
  is_offline: boolean;
  is_active: boolean;
  target_words: string[];
  conversation_prompts: string[];
  created_at: string;
}

export interface MissionProgressResponse {
  mission_id: string;
  completed: boolean;
  completed_date: string | null;
  parent_notes: string | null;
}

// ─── Public helper ───────────────────────────────────────────────────────────

/**
 * Map backend MissionResponse + optional progress into the frontend OfflineMission type.
 */
export function toOfflineMission(
  m: MissionResponse,
  progress?: MissionProgressResponse,
): OfflineMission {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    targetWords: m.target_words,
    context: m.context,
    conversationPrompts: m.conversation_prompts,
    completed: progress?.completed ?? false,
    completedDate: progress?.completed_date
      ? new Date(progress.completed_date)
      : undefined,
    parentNotes: progress?.parent_notes ?? undefined,
  };
}

// ─── API functions ───────────────────────────────────────────────────────────

/**
 * Get offline (real-world activity) missions for a child.
 */
export async function getOfflineMissions(
  childId: string,
): Promise<MissionResponse[]> {
  return apiRequest<MissionResponse[]>(`/missions/offline/${childId}`);
}

/**
 * Get digital daily missions for a child.
 */
export async function getDailyMissions(
  childId: string,
): Promise<MissionResponse[]> {
  return apiRequest<MissionResponse[]>(`/missions/daily/${childId}`);
}

/**
 * Get completion progress for all missions for a child.
 */
export async function getMissionProgress(
  childId: string,
): Promise<MissionProgressResponse[]> {
  return apiRequest<MissionProgressResponse[]>(`/missions/${childId}/progress`);
}

/**
 * Mark a mission as complete (or un-complete) for a child.
 */
export async function completeMission(
  missionId: string,
  childId: string,
  completed: boolean,
  parentNotes?: string,
): Promise<MissionProgressResponse> {
  return apiRequest<MissionProgressResponse>(
    `/missions/${missionId}/complete/${childId}`,
    {
      method: "POST",
      body: JSON.stringify({ completed, parent_notes: parentNotes ?? null }),
    },
  );
}
