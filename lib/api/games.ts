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
  /** Correct answers / pairs found */
  score: number;
  /** Total rounds / total pairs */
  max_score: number;
  /** Elapsed wall-clock seconds */
  duration_seconds: number;
  /** Word IDs that were shown to the child */
  words_seen: string[];
  /** Word IDs the child answered correctly */
  words_correct: string[];
  /** 1–3 stars earned */
  stars: number;
}

export interface GameSessionResponse {
  id: number;
  child_id: string;
  game_id: string;
  score: number;
  max_score: number;
  duration_seconds: number;
  words_seen: string[];
  words_correct: string[];
  stars: number;
  xp_earned: number;
  created_at: string;
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
 * Record a completed mini-game session.
 * Returns the saved session including XP awarded to the child.
 * Silently ignores errors so a network failure never blocks the game-over screen.
 */
export async function recordGameSession(
  gameId: string,
  data: GameSessionRequest,
): Promise<GameSessionResponse | null> {
  try {
    return await apiRequest<GameSessionResponse>(`/games/${gameId}/play`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}
