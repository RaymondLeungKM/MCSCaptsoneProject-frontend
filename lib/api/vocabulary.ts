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
 * Get all categories
 */
export async function getCategories(): Promise<CategoryResponse[]> {
  return apiRequest<CategoryResponse[]>("/categories/");
}

/**
 * Get words with optional filters
 */
export async function getWords(params?: {
  category?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
}): Promise<WordResponse[]> {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append("category", params.category);
  if (params?.difficulty) queryParams.append("difficulty", params.difficulty);
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.offset) queryParams.append("offset", params.offset.toString());

  const query = queryParams.toString();
  return apiRequest<WordResponse[]>(`/vocabulary/${query ? `?${query}` : ""}`);
}

/**
 * Get words with child's progress
 */
export async function getWordsWithProgress(
  childId: string,
  category?: string,
): Promise<(WordResponse & { progress?: WordProgressResponse })[]> {
  const query = category ? `?category=${category}` : "";
  return apiRequest(`/vocabulary/child/${childId}${query}`);
}

/**
 * Get specific word
 */
export async function getWord(wordId: string): Promise<WordResponse> {
  return apiRequest<WordResponse>(`/vocabulary/${wordId}`);
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
