/**
 * Missions API
 * Offline and daily missions for parent-child activities
 */
import { apiRequest } from "./client";
import type { OfflineMission } from "../types";

// ─── Backend response shapes ────────────────────────────────────────────────

export type MissionContext =
  | "mealtime"
  | "bedtime"
  | "playtime"
  | "outdoor"
  | "shopping"
  | "general";

export type MissionStatus = "draft" | "published" | "archived";

export type MissionSurface = "child" | "parent" | "both";

export interface MissionAssignmentResponse {
  id: string;
  child_id: string;
  mission_id: string;
  assignment_date: string;
  source: "system" | "admin" | "parent" | "seed";
  status: "assigned" | "in_progress" | "completed" | "skipped" | "expired";
  surface: MissionSurface;
  priority: number;
  selection_reason: string | null;
  selection_metadata: Record<string, unknown> | null;
  available_from: string | null;
  expires_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  skipped_at: string | null;
  completion_notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface MissionResponse {
  id: string;
  slug: string;
  title: string;
  description: string;
  context: MissionContext;
  is_offline: boolean;
  status?: MissionStatus;
  locale?: string;
  age_min?: number | null;
  age_max?: number | null;
  difficulty?: string | null;
  surface?: MissionSurface;
  sort_order?: number;
  selection_tags?: string[];
  catalog_metadata?: Record<string, unknown> | null;
  published_at?: string | null;
  archived_at?: string | null;
  is_active: boolean;
  target_words: string[];
  conversation_prompts: string[];
  created_at: string;
  updated_at?: string | null;
  assignment?: MissionAssignmentResponse;
}

export interface MissionMutationRequest {
  slug: string;
  title: string;
  description: string;
  context: MissionContext;
  is_offline: boolean;
  status: MissionStatus;
  locale: string;
  age_min?: number | null;
  age_max?: number | null;
  difficulty?: string | null;
  surface: MissionSurface;
  sort_order: number;
  selection_tags: string[];
  catalog_metadata?: Record<string, unknown> | null;
  published_at?: string | null;
  archived_at?: string | null;
  target_words: string[];
  conversation_prompts: string[];
  is_active?: boolean;
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

/**
 * Get the full mission catalog for admin management.
 */
export async function listAdminMissions(
  includeInactive: boolean = true,
): Promise<MissionResponse[]> {
  return apiRequest<MissionResponse[]>(
    `/missions/admin/catalog?include_inactive=${String(includeInactive)}`,
  );
}

/**
 * Create a mission catalog entry as an admin.
 */
export async function createAdminMission(
  data: MissionMutationRequest,
): Promise<MissionResponse> {
  return apiRequest<MissionResponse>("/missions/admin/catalog", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update a mission catalog entry as an admin.
 */
export async function updateAdminMission(
  missionId: string,
  data: Partial<MissionMutationRequest>,
): Promise<MissionResponse> {
  return apiRequest<MissionResponse>(`/missions/admin/catalog/${missionId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
