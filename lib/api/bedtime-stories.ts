/**
 * API functions for bedtime stories
 */
import { apiRequest } from "./client";
import { APIError } from "./client";
import {
  DailyWordSummary,
  GeneratedStory,
  StoryGenerationRequest,
  StoryGenerationResponse,
} from "../types";

const EXTERNAL_STORY_POLL_INTERVAL_MS = 5000;
const EXTERNAL_STORY_POLL_ATTEMPTS = 24;
const STORY_MATCH_SKEW_MS = 15000;

function toMediaProxyUrl(audioUrl: string): string {
  if (!audioUrl) {
    return audioUrl;
  }

  if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
    return audioUrl;
  }

  const normalizedPath = audioUrl.startsWith("/") ? audioUrl : `/${audioUrl}`;
  const proxyPath = `/api/media${normalizedPath}`;

  if (typeof window !== "undefined") {
    return new URL(proxyPath, window.location.origin).toString();
  }

  return proxyPath;
}

function normalizeGeneratedStory(
  story: GeneratedStory | null | undefined,
): GeneratedStory | null | undefined {
  if (!story) {
    return story;
  }

  if (!story.audio_url) {
    return story;
  }

  return {
    ...story,
    audio_url: toMediaProxyUrl(story.audio_url),
  };
}

function normalizeStoryGenerationResponse(
  response: StoryGenerationResponse,
): StoryGenerationResponse {
  if (!response.story) {
    return response;
  }

  return {
    ...response,
    story: normalizeGeneratedStory(response.story),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeTheme(theme?: string | null): string {
  return (theme || "bedtime").toLowerCase();
}

function findMatchingGeneratedStory(
  stories: GeneratedStory[],
  request: StoryGenerationRequest,
  pendingSince: string,
): GeneratedStory | undefined {
  const requestedTheme = normalizeTheme(request.theme);
  const pendingSinceMs = Date.parse(pendingSince);

  return stories.find((story) => {
    if (story.child_id !== request.child_id) {
      return false;
    }

    if (normalizeTheme(story.theme) !== requestedTheme) {
      return false;
    }

    if (Number.isNaN(pendingSinceMs)) {
      return true;
    }

    const storyTimestampMs = Date.parse(
      story.generated_at || story.generation_date,
    );
    if (Number.isNaN(storyTimestampMs)) {
      return true;
    }

    return storyTimestampMs >= pendingSinceMs - STORY_MATCH_SKEW_MS;
  });
}

async function waitForExternalStoryResult(
  request: StoryGenerationRequest,
  pendingSince: string,
): Promise<GeneratedStory> {
  for (let attempt = 0; attempt < EXTERNAL_STORY_POLL_ATTEMPTS; attempt += 1) {
    const stories = await getChildStories(request.child_id, 10);
    const matchingStory = findMatchingGeneratedStory(
      stories,
      request,
      pendingSince,
    );

    if (matchingStory) {
      return matchingStory;
    }

    if (attempt < EXTERNAL_STORY_POLL_ATTEMPTS - 1) {
      await sleep(EXTERNAL_STORY_POLL_INTERVAL_MS);
    }
  }

  throw new Error("故事仍在生成中，請稍後到故事列表查看。");
}

async function invokeExternalStory(
  request: StoryGenerationRequest,
): Promise<StoryGenerationResponse> {
  return apiRequest<StoryGenerationResponse>(
    "/bedtime-stories/external/invoke",
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}

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
  const response = await apiRequest<StoryGenerationResponse>(
    "/bedtime-stories/generate",
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );

  return normalizeStoryGenerationResponse(response);
}

/**
 * Generate a bedtime story using the external story-generation program.
 */
export async function generateStoryWithExternalProgram(
  request: StoryGenerationRequest,
): Promise<GeneratedStory> {
  const pendingSince = new Date().toISOString();

  try {
    const response = normalizeStoryGenerationResponse(
      await invokeExternalStory(request),
    );

    if (response.story) {
      return response.story;
    }

    if (response.pending) {
      return waitForExternalStoryResult(
        request,
        response.pending_since || pendingSince,
      );
    }

    throw new Error(response.message || "生成故事失敗，請稍後再試。");
  } catch (error) {
    if (error instanceof APIError && error.status === 504) {
      return waitForExternalStoryResult(request, pendingSince);
    }

    throw error;
  }
}

/**
 * Get all stories for a child
 */
export async function getChildStories(
  childId: string,
  limit: number = 10,
): Promise<GeneratedStory[]> {
  const stories = await apiRequest<Array<GeneratedStory | null>>(
    `/bedtime-stories/list/${childId}?limit=${limit}`,
  );

  return stories
    .filter(Boolean)
    .map((story) => normalizeGeneratedStory(story)!);
}

/**
 * Get a specific story
 */
export async function getStory(
  childId: string,
  storyId: string,
): Promise<GeneratedStory> {
  const story = await apiRequest<GeneratedStory | null>(
    `/bedtime-stories/${childId}/${storyId}`,
  );

  if (!story) {
    throw new Error("讀取故事失敗：伺服器未返回故事內容。");
  }

  return normalizeGeneratedStory(story)!;
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
