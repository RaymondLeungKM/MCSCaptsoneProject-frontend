import { apiRequest } from "./client";

export type AudioLanguage = "cantonese" | "english" | "mandarin";

export interface AudioGenerationResponse {
  audio_url: string;
  audio_filename: string;
  audio_duration_seconds: number;
  audio_generate_provider: string;
  audio_generate_voice_name?: string;
  message?: string;
}

export async function generateWordAudio(request: {
  word_id?: string;
  text?: string;
  language?: AudioLanguage;
  voice_name?: string;
  speech_rate?: number;
  update_word_record?: boolean;
}): Promise<AudioGenerationResponse> {
  return apiRequest<AudioGenerationResponse>("/audio/generate-word-audio", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function generateSentenceAudio(request: {
  text: string;
  language?: AudioLanguage;
  voice_name?: string;
  speech_rate?: number;
}): Promise<AudioGenerationResponse> {
  return apiRequest<AudioGenerationResponse>("/audio/generate-sentence-audio", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function generateStoryAudio(request: {
  story_id?: string;
  child_id?: string;
  text?: string;
  use_ssml?: boolean;
  language?: AudioLanguage;
  voice_name?: string;
  speech_rate?: number;
  update_story_record?: boolean;
}): Promise<AudioGenerationResponse> {
  return apiRequest<AudioGenerationResponse>("/audio/generate-story-audio", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
