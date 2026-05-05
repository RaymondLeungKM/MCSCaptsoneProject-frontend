/**
 * Vocabulary API
 */
import { apiRequest, API_BASE_URL, getAuthToken } from "./client";
import { resolveCategoryColor } from "../category-colors";
import type { Word, Category } from "../types";

export interface ImageUploadResponse {
  success: boolean;
  image_url: string;
  filename: string;
  size: number;
  content_type?: string;
}

function getBackendBaseUrl(): string {
  return API_BASE_URL.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
}

function isBackendAssetPath(value: string): boolean {
  return (
    value.startsWith("/") ||
    value.startsWith("uploads/") ||
    value.startsWith("audio/")
  );
}

function resolveBackendAssetUrl(value?: string): string | undefined {
  if (!value) {
    return value;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  if (!isBackendAssetPath(value)) {
    return value;
  }

  return `${getBackendBaseUrl()}${value.startsWith("/") ? "" : "/"}${value}`;
}

function normalizeWordResponse<T extends WordResponse>(response: T): T {
  return {
    ...response,
    image_url: resolveBackendAssetUrl(response.image_url),
    audio_url: resolveBackendAssetUrl(response.audio_url),
    audio_url_english: resolveBackendAssetUrl(response.audio_url_english),
  } as T;
}

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

export interface AdminWordResponse extends WordResponse {
  creator_user_id?: string;
  creator_user_email?: string;
  creator_child_name?: string;
  is_user_uploaded?: boolean;
}

export interface WordMutationRequest {
  word: string;
  word_cantonese?: string;
  category: string;
  pronunciation?: string;
  jyutping?: string;
  definition: string;
  definition_cantonese?: string;
  example: string;
  example_cantonese?: string;
  difficulty: "easy" | "medium" | "hard";
  physical_action?: string;
  image_url?: string;
  audio_url?: string;
  audio_url_english?: string;
  contexts?: string[];
  related_words?: string[];
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
  pending_active_vocab_approval: boolean;
  active_vocab_requested_at?: string;
  correct_attempts: number;
  total_attempts: number;
  success_rate: number;
  visual_exposures: number;
  auditory_exposures: number;
  kinesthetic_exposures: number;
}

export interface ActiveVocabularyApprovalRequest {
  child_id: string;
  word_id: string;
  word: string;
  word_cantonese?: string;
  image_url?: string;
  requested_at: string;
  exposure_count: number;
  last_practiced?: string;
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
  sort_order: number;
}

export interface CategoryMutationRequest {
  name: string;
  name_cantonese?: string;
  icon?: string;
  color?: string;
  description?: string;
  description_cantonese?: string;
  is_active?: boolean;
  sort_order?: number;
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
 * Get all categories, including hidden ones, for admin management.
 */
export async function getAdminCategories(): Promise<CategoryResponse[]> {
  return apiRequest<CategoryResponse[]>("/categories/admin/all");
}

/**
 * Create a shared vocabulary category as an admin.
 */
export async function createAdminCategory(
  data: CategoryMutationRequest,
): Promise<CategoryResponse> {
  return apiRequest<CategoryResponse>("/categories/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update a shared vocabulary category as an admin.
 */
export async function updateAdminCategory(
  categoryId: string,
  data: Partial<CategoryMutationRequest>,
): Promise<CategoryResponse> {
  return apiRequest<CategoryResponse>(`/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Soft-delete a shared vocabulary category as an admin.
 */
export async function deleteAdminCategory(categoryId: string): Promise<void> {
  return apiRequest<void>(`/categories/${categoryId}`, {
    method: "DELETE",
  });
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
    queryParams.append(
      "include_external",
      params.includeExternal ? "true" : "false",
    );
  }
  if (params?.includeMongodb) queryParams.append("include_mongodb", "true");
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.offset) queryParams.append("offset", params.offset.toString());

  const query = queryParams.toString();
  const words = await apiRequest<WordResponse[]>(
    `/vocabulary/${query ? `?${query}` : ""}`,
  );
  return words.map(normalizeWordResponse);
}

/**
 * Get all admin-manageable words, including My Collection entries with creator metadata.
 */
export async function getAdminWords(params?: {
  category?: string;
  difficulty?: string;
  creatorSearch?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminWordResponse[]> {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append("category", params.category);
  if (params?.difficulty) queryParams.append("difficulty", params.difficulty);
  if (params?.creatorSearch) {
    queryParams.append("creator_search", params.creatorSearch);
  }
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.offset) queryParams.append("offset", params.offset.toString());

  const query = queryParams.toString();
  const words = await apiRequest<AdminWordResponse[]>(
    `/vocabulary/admin/all${query ? `?${query}` : ""}`,
  );
  return words.map(normalizeWordResponse);
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
  const words = await apiRequest<WordResponse[]>(
    `/vocabulary/external/captured/${childId}${query ? `?${query}` : ""}`,
  );
  return words.map(normalizeWordResponse);
}

/**
 * Get community words — anonymised captures shared by children
 * whose parents enabled community sharing.
 */
export async function getCommunityWords(
  limit?: number,
): Promise<WordResponse[]> {
  const query = limit ? `?limit=${limit}` : "";
  const words = await apiRequest<WordResponse[]>(
    `/vocabulary/community${query}`,
  );
  return words.map(normalizeWordResponse);
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
  const words = await apiRequest<
    (WordResponse & { progress?: WordProgressResponse })[]
  >(`/vocabulary/child/${childId}${query}`);
  return words.map((word) => ({
    ...word,
    ...normalizeWordResponse(word),
  }));
}

export async function getPendingActiveVocabRequests(
  childId: string,
): Promise<ActiveVocabularyApprovalRequest[]> {
  const requests = await apiRequest<ActiveVocabularyApprovalRequest[]>(
    `/vocabulary/child/${childId}/active-vocab/pending`,
  );

  return requests.map((request) => ({
    ...request,
    image_url: resolveBackendAssetUrl(request.image_url),
  }));
}

export async function requestActiveVocabApproval(
  wordId: string,
  childId: string,
): Promise<WordProgressResponse> {
  return apiRequest<WordProgressResponse>(
    `/vocabulary/${wordId}/progress/${childId}/request-active-vocab`,
    {
      method: "POST",
    },
  );
}

export async function approveActiveVocabRequest(
  wordId: string,
  childId: string,
): Promise<WordProgressResponse> {
  return apiRequest<WordProgressResponse>(
    `/vocabulary/${wordId}/progress/${childId}/approve-active-vocab`,
    {
      method: "POST",
    },
  );
}

export async function rejectActiveVocabRequest(
  wordId: string,
  childId: string,
): Promise<WordProgressResponse> {
  return apiRequest<WordProgressResponse>(
    `/vocabulary/${wordId}/progress/${childId}/reject-active-vocab`,
    {
      method: "POST",
    },
  );
}

/**
 * Get specific word
 */
export async function getWord(wordId: string): Promise<WordResponse> {
  const word = await apiRequest<WordResponse>(`/vocabulary/${wordId}`);
  return normalizeWordResponse(word);
}

/**
 * Create a shared vocabulary item as an admin.
 */
export async function createAdminWord(
  data: WordMutationRequest,
): Promise<WordResponse> {
  const word = await apiRequest<WordResponse>("/vocabulary/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return normalizeWordResponse(word);
}

/**
 * Update a shared vocabulary item as an admin.
 */
export async function updateAdminWord(
  wordId: string,
  data: Partial<WordMutationRequest>,
): Promise<WordResponse> {
  const word = await apiRequest<WordResponse>(`/vocabulary/${wordId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return normalizeWordResponse(word);
}

/**
 * Soft-delete a shared vocabulary item as an admin.
 */
export async function deleteAdminWord(wordId: string): Promise<void> {
  return apiRequest<void>(`/vocabulary/${wordId}`, {
    method: "DELETE",
  });
}

/**
 * Upload an admin-managed vocabulary image and return the stored path.
 */
export async function uploadVocabularyImage(
  file: File,
): Promise<ImageUploadResponse> {
  const form = new FormData();
  form.append("file", file);

  const token = getAuthToken();
  const response = await fetch(
    `${getBackendBaseUrl()}/api/v1/uploads/upload-image`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    },
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: `Upload failed (${response.status})` }));
    throw new Error(errorData.detail || `Upload failed (${response.status})`);
  }

  return response.json();
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
  const normalizedResponse = normalizeWordResponse(response);

  return {
    id: normalizedResponse.id,
    word: normalizedResponse.word,
    word_cantonese: normalizedResponse.word_cantonese,
    jyutping: normalizedResponse.jyutping,
    image: normalizedResponse.image_url || "",
    category: normalizedResponse.category,
    categoryName: normalizedResponse.category_name,
    category_name_cantonese: normalizedResponse.category_name_cantonese,
    pronunciation: normalizedResponse.pronunciation || "",
    definition: normalizedResponse.definition,
    definition_cantonese: normalizedResponse.definition_cantonese,
    example: normalizedResponse.example,
    example_cantonese: normalizedResponse.example_cantonese,
    difficulty: normalizedResponse.difficulty,
    mastered: progress?.mastered || false,
    exposureCount: progress?.exposure_count || 0,
    pendingActiveVocabApproval:
      progress?.pending_active_vocab_approval || false,
    activeVocabRequestedAt: progress?.active_vocab_requested_at
      ? new Date(progress.active_vocab_requested_at)
      : undefined,
    lastPracticed: progress?.last_practiced
      ? new Date(progress.last_practiced)
      : undefined,
    physicalAction: normalizedResponse.physical_action,
    contexts: normalizedResponse.contexts,
    relatedWords: normalizedResponse.related_words,
    audio_url: normalizedResponse.audio_url,
    audio_url_english: normalizedResponse.audio_url_english,
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
