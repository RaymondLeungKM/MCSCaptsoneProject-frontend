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

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const list = value
    .filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    )
    .slice(0, 8);

  return list.length > 0 ? list : undefined;
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

export interface ParentMicroMissionCreateRequest {
  title: string;
  description: string;
  context: MissionContext;
  target_words: string[];
  conversation_prompts: string[];
}

export interface MissionCompletionResponse {
  mission_id: string;
  completed: boolean;
  completed_date: string | null;
  parent_notes: string | null;
}

export interface MissionCompletionHistoryResponse {
  mission_id: string;
  title: string;
  context: MissionContext;
  is_offline: boolean;
  surface: MissionSurface;
  assignment_date: string;
  completed_at: string;
  completion_notes: string | null;
  target_words: string[];
  points_earned: number;
}

export interface MissionSummaryResponse {
  child_id: string;
  local_today: string;
  completed_today: number;
  completed_this_week: number;
  weekly_goal: number;
  streak_days: number;
  total_completed: number;
  family_points: number;
  level: number;
  level_title: string;
  next_level_points: number;
  points_to_next_level: number;
  next_reward_label: string;
  encouragement: string;
  recent_completions: MissionCompletionHistoryResponse[];
}

// ─── Public helper ───────────────────────────────────────────────────────────

/**
 * Map backend MissionResponse + optional completion into the frontend OfflineMission type.
 */
export function toOfflineMission(
  m: MissionResponse,
  completion?: MissionCompletionResponse,
): OfflineMission {
  const assignmentCompleted = m.assignment
    ? m.assignment.status === "completed"
    : undefined;
  const completed = assignmentCompleted ?? completion?.completed ?? false;
  const completedDate =
    m.assignment?.completed_at ?? completion?.completed_date;
  const parentNotes =
    m.assignment?.completion_notes ?? completion?.parent_notes;
  const metadata = m.assignment?.selection_metadata ?? {};
  const isClusterMission = Boolean(metadata?.is_cluster);

  return {
    id: m.id,
    title: m.title,
    description: m.description,
    targetWords: m.target_words,
    context: m.context,
    conversationPrompts: m.conversation_prompts,
    completed,
    completedDate: completedDate ? new Date(completedDate) : undefined,
    parentNotes: parentNotes ?? undefined,
    isClusterMission,
    clusterId: asString(metadata?.cluster_id),
    clusterSeedWordId: asString(metadata?.seed_word_id),
    clusterDepth: asNumber(metadata?.cluster_depth),
    clusterStrategy: asString(metadata?.cluster_strategy),
    clusterThemeLabel: asString(metadata?.cluster_theme_label),
    clusterRelatedThemeLabels: asStringArray(
      metadata?.cluster_related_theme_labels,
    ),
    clusterWords: asStringArray(metadata?.target_words_display),
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
 * Get mission tracking summary, incentives, and recent completions for a child.
 */
export async function getMissionSummary(
  childId: string,
): Promise<MissionSummaryResponse> {
  return apiRequest<MissionSummaryResponse>(`/missions/${childId}/summary`);
}

/**
 * Mark a mission as complete (or un-complete) for a child.
 */
export async function completeMission(
  missionId: string,
  childId: string,
  completed: boolean,
  parentNotes?: string,
): Promise<MissionCompletionResponse> {
  return apiRequest<MissionCompletionResponse>(
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

/**
 * Create a short parent-authored micro-mission and deliver it to child mode today.
 */
export async function createParentMicroMission(
  childId: string,
  data: ParentMicroMissionCreateRequest,
): Promise<MissionResponse> {
  return apiRequest<MissionResponse>(`/missions/parent/${childId}/micro`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
