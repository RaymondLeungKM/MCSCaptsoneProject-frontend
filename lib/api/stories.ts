/**
 * Story content API helpers for the admin console.
 */
import { apiRequest } from "./client";

export interface StoryResponse {
  id: string;
  child_id?: string | null;
  title: string;
  title_english?: string | null;
  theme?: string | null;
  story_type: string;
  generation_date: string;
  generated_at: string;
  generated_by?: string | null;
  content_cantonese: string;
  content_english?: string | null;
  jyutping?: string | null;
  vocab_used?: string | null;
  story_text: string;
  story_text_ssml: string;
  story_generate_provdier?: string | null;
  story_generate_model?: string | null;
  featured_words: string[];
  word_usage?: Record<string, string> | null;
  audio_url?: string | null;
  audio_duration_seconds?: number | null;
  audio_filename: string;
  audio_generate_provider?: string | null;
  audio_generate_voice_name?: string | null;
  reading_time_minutes: number;
  word_count?: number | null;
  difficulty_level: string;
  cultural_references?: string[] | null;
  read_count: number;
  is_favorite: boolean;
  parent_approved: boolean;
  is_active: boolean;
  sort_order: number;
  ai_model?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface StoryMutationRequest {
  child_id?: string | null;
  title: string;
  title_english?: string | null;
  theme?: string | null;
  story_type?: string;
  generated_by?: string | null;
  content_cantonese: string;
  content_english?: string | null;
  jyutping?: string | null;
  vocab_used?: string | null;
  story_text?: string | null;
  story_text_ssml?: string | null;
  story_generate_provdier?: string | null;
  story_generate_model?: string | null;
  featured_words?: string[];
  word_usage?: Record<string, string> | null;
  audio_url?: string | null;
  audio_duration_seconds?: number | null;
  audio_filename?: string | null;
  audio_generate_provider?: string | null;
  audio_generate_voice_name?: string | null;
  reading_time_minutes?: number;
  word_count?: number | null;
  difficulty_level?: string;
  cultural_references?: string[] | null;
  ai_model?: string | null;
  generation_prompt?: string | null;
  generation_time_seconds?: number | null;
  is_active?: boolean;
  sort_order?: number;
}

export async function listAdminStories(): Promise<StoryResponse[]> {
  return apiRequest<StoryResponse[]>("/stories/admin/all");
}

export async function listPublicCuratedStories(): Promise<StoryResponse[]> {
  return apiRequest<StoryResponse[]>("/stories/");
}

export async function createAdminStory(
  data: StoryMutationRequest,
): Promise<StoryResponse> {
  return apiRequest<StoryResponse>("/stories/admin", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAdminStory(
  storyId: string,
  data: StoryMutationRequest,
): Promise<StoryResponse> {
  return apiRequest<StoryResponse>(`/stories/admin/${storyId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAdminStory(storyId: string): Promise<void> {
  return apiRequest<void>(`/stories/admin/${storyId}`, {
    method: "DELETE",
  });
}
