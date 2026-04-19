/**
 * Vocabulary API
 */
import { apiRequest } from "./client";
import { resolveCategoryColor } from "../category-colors";
import type { Word, Category } from "../types";

export interface WordResponse {
  id: string;
  word: string;
  word_cantonese?: string;
  jyutping?: string;
  category: string;
  category_name?: string;
  category_name_cantonese?: string;
  pronunciation?: string;
  definition: string;
  definition_cantonese?: string;
  example: string;
  example_cantonese?: string;
  difficulty: "easy" | "medium" | "hard";
  physical_action?: string;
  image_url?: string;
  audio_url?: string;
  audio_url_english?: string;
  contexts: string[];
  related_words: string[];
  total_exposures: number;
  success_rate: number;
  is_active: boolean;
  created_at: string;
  created_by_child_id?: string;
}

export interface CapturedWordsParams {
  limit?: number;
  includeMongodb?: boolean;
}

export interface WordProgressResponse {
  id: number;
  child_id: string;
  word_id: string;
  exposure_count: number;
  mastered: boolean;
  mastered_at?: string;
  last_practiced?: string;
  correct_attempts: number;
  total_attempts: number;
  success_rate: number;
  visual_exposures: number;
  auditory_exposures: number;
  kinesthetic_exposures: number;
}

export interface GeneratedSentenceResponse {
  id?: number;
  sentence: string;
  sentence_english?: string;
  jyutping?: string;
  context?: string;
  difficulty?: string;
  created_at?: string;
}

export interface SentenceGenerationResponse {
  word: string;
  word_cantonese: string;
  sentences: GeneratedSentenceResponse[];
  total_generated: number;
}

export interface CategoryResponse {
  id: string;
  name: string;
  name_cantonese?: string;
  icon: string;
  color: string;
  description?: string;
  description_cantonese?: string;
  word_count: number;
  is_active: boolean;
}

/**
 * Get all categories.
 * Pass childId to receive per-child word counts for user-owned categories (e.g. My Collection).
 */
export async function getCategories(
  childId?: string,
): Promise<CategoryResponse[]> {
  const query = childId ? `?child_id=${childId}` : "";
  return apiRequest<CategoryResponse[]>(`/categories/${query}`);
}

/**
 * Get words with optional filters
 */
export async function getWords(params?: {
  category?: string;
  difficulty?: string;
  childId?: string;
  includeExternal?: boolean;
  includeMongodb?: boolean;
  limit?: number;
  offset?: number;
}): Promise<WordResponse[]> {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append("category", params.category);
  if (params?.difficulty) queryParams.append("difficulty", params.difficulty);
  if (params?.childId) queryParams.append("child_id", params.childId);
  if (typeof params?.includeExternal === "boolean") {
    queryParams.append("include_external", params.includeExternal ? "true" : "false");
  }
  if (params?.includeMongodb) queryParams.append("include_mongodb", "true");
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.offset) queryParams.append("offset", params.offset.toString());

  const query = queryParams.toString();
  return apiRequest<WordResponse[]>(`/vocabulary/${query ? `?${query}` : ""}`);
}

/**
 * Get external/camera-captured words for a child.
 * Includes PostgreSQL uploaded words and optional MongoDB captures.
 */
export async function getCapturedWords(
  childId: string,
  params?: CapturedWordsParams,
): Promise<WordResponse[]> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.includeMongodb) queryParams.append("include_mongodb", "true");

  const query = queryParams.toString();
  return apiRequest<WordResponse[]>(
    `/vocabulary/external/captured/${childId}${query ? `?${query}` : ""}`,
  );
}

/**
 * Get community words — anonymised captures shared by children
 * whose parents enabled community sharing.
 */
export async function getCommunityWords(
  limit?: number,
): Promise<WordResponse[]> {
  const query = limit ? `?limit=${limit}` : "";
  return apiRequest<WordResponse[]>(`/vocabulary/community${query}`);
}

/**
 * Get words with child's progress
 * @param ownOnly - when true, only return words uploaded by this child (use for My Collection)
 */
export async function getWordsWithProgress(
  childId: string,
  category?: string,
  ownOnly = false,
): Promise<(WordResponse & { progress?: WordProgressResponse })[]> {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (ownOnly) params.append("own_only", "true");
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/vocabulary/child/${childId}${query}`);
}

/**
 * Get specific word
 */
export async function getWord(wordId: string): Promise<WordResponse> {
  return apiRequest<WordResponse>(`/vocabulary/${wordId}`);
}

/**
 * Get saved AI-generated sentences for a word
 */
export async function getWordSentences(
  wordId: string,
): Promise<GeneratedSentenceResponse[]> {
  return apiRequest<GeneratedSentenceResponse[]>(
    `/vocabulary/${wordId}/sentences`,
  );
}

/**
 * Generate AI sentences for a word and save them on backend
 */
export async function generateWordSentences(
  wordId: string,
  params?: { num_sentences?: number; contexts?: string[] },
): Promise<SentenceGenerationResponse> {
  const queryParams = new URLSearchParams();

  if (params?.num_sentences) {
    queryParams.append("num_sentences", params.num_sentences.toString());
  }

  if (params?.contexts?.length) {
    params.contexts.forEach((context) =>
      queryParams.append("contexts", context),
    );
  }

  const query = queryParams.toString();
  return apiRequest<SentenceGenerationResponse>(
    `/vocabulary/${wordId}/generate-sentences${query ? `?${query}` : ""}`,
    {
      method: "POST",
    },
  );
}

/**
 * Update word progress
 */
export async function updateWordProgress(
  wordId: string,
  childId: string,
  data: {
    exposure_count?: number;
    mastered?: boolean;
    correct_attempts?: number;
    total_attempts?: number;
  },
): Promise<WordProgressResponse> {
  return apiRequest<WordProgressResponse>(
    `/vocabulary/${wordId}/progress/${childId}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/**
 * Convert API response to Word type
 */
export function toWord(
  response: WordResponse,
  progress?: WordProgressResponse,
): Word {
  return {
    id: response.id,
    word: response.word,
    word_cantonese: response.word_cantonese,
    jyutping: response.jyutping,
    image: response.image_url || "",
    category: response.category,
    categoryName: response.category_name,
    category_name_cantonese: response.category_name_cantonese,
    pronunciation: response.pronunciation || "",
    definition: response.definition,
    definition_cantonese: response.definition_cantonese,
    example: response.example,
    example_cantonese: response.example_cantonese,
    difficulty: response.difficulty,
    mastered: progress?.mastered || false,
    exposureCount: progress?.exposure_count || 0,
    lastPracticed: progress?.last_practiced
      ? new Date(progress.last_practiced)
      : undefined,
    physicalAction: response.physical_action,
    contexts: response.contexts,
    relatedWords: response.related_words,
    audio_url: response.audio_url,
    audio_url_english: response.audio_url_english,
  };
}

/**
 * Convert API response to Category type
 */
export function toCategory(response: CategoryResponse, index = 0): Category {
  return {
    id: response.id,
    name: response.name,
    name_cantonese: response.name_cantonese,
    icon: response.icon,
    color: resolveCategoryColor(response.color, response.name, index),
    description: response.description,
    description_cantonese: response.description_cantonese,
    wordCount: response.word_count,
  };
}
