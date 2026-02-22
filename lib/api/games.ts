/**
 * Games API
 * List games and record play sessions
 */
import { apiRequest } from "./client";
import type { Game } from "../types";

// ─── Backend response shapes ────────────────────────────────────────────────

export interface GameResponse {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  game_type:
    | "matching"
    | "ispy"
    | "spelling"
    | "pronunciation"
    | "charades"
    | "actions"
    | "scavenger";
  physical_activity: boolean;
  multi_sensory: boolean;
  parent_participation: boolean;
  min_words: number;
  max_words: number;
  difficulty: string;
  is_active: boolean;
  created_at: string;
}

export interface GameSessionRequest {
  child_id: string;
  words_used: string[];
  duration_minutes: number;
  score?: number;
}

// ─── Public helper ───────────────────────────────────────────────────────────

/**
 * Map backend GameResponse to the frontend Game type.
 */
export function toGame(g: GameResponse): Game {
  return {
    id: g.id,
    name: g.name,
    description: g.description ?? "",
    icon: g.icon,
    color: g.color,
    type: g.game_type,
    physicalActivity: g.physical_activity,
    multiSensory: g.multi_sensory,
    parentParticipation: g.parent_participation,
  };
}

// ─── API functions ───────────────────────────────────────────────────────────

/**
 * Get all active games.
 */
export async function getGames(): Promise<GameResponse[]> {
  return apiRequest<GameResponse[]>("/games/");
}

/**
 * Get a single game by ID.
 */
export async function getGame(gameId: string): Promise<GameResponse> {
  return apiRequest<GameResponse>(`/games/${gameId}`);
}

/**
 * Record a game play session for a child.
 */
export async function recordGameSession(
  gameId: string,
  data: GameSessionRequest,
): Promise<{
  message: string;
  game_id: string;
  words_used: number;
  duration: number;
}> {
  return apiRequest(`/games/${gameId}/play`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
