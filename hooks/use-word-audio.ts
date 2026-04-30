"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { generateSentenceAudio, generateWordAudio } from "@/lib/api/audio";
import { API_BASE_URL } from "@/lib/api/client";
import { getAudioUrl, getSpeechText } from "@/lib/language-utils";
import { useSpeech } from "@/lib/speech";
import type { LanguagePreference, Word } from "@/lib/types";

type AudioLanguage = "cantonese" | "english" | "mandarin";

function toAudioLanguage(
  languagePreference: LanguagePreference,
): AudioLanguage {
  if (languagePreference === "english") {
    return "english";
  }
  return "cantonese";
}

function resolveAudioUrl(audioUrl: string): string {
  if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
    return audioUrl;
  }

  const backendOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${backendOrigin}${audioUrl.startsWith("/") ? "" : "/"}${audioUrl}`;
}

interface PlayTextOptions {
  languagePreference: LanguagePreference;
  speechRate?: number;
}

interface PlayWordOptions extends PlayTextOptions {
  generateIfMissing?: boolean;
}

export function useWordAudio() {
  const { speak, stop: stopSpeech } = useSpeech();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Cache generated audio URLs so auto-play and replay always use the same file
  const generatedCacheRef = useRef<Map<string, string>>(new Map());

  const stop = useCallback(() => {
    stopSpeech();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, [stopSpeech]);

  const playAudioUrl = useCallback(
    async (audioUrl: string) => {
      stop();

      const audio = new Audio(resolveAudioUrl(audioUrl));
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);

      await audio.play();
    },
    [stop],
  );

  const speakFallback = useCallback(
    (text: string) => {
      stop();
      setIsPlaying(true);

      const started = speak(text, {
        rate: 0.8,
        pitch: 1.1,
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });

      if (!started) {
        setIsPlaying(false);
      }
    },
    [speak, stop],
  );

  const playWord = useCallback(
    async (word: Word, options: PlayWordOptions) => {
      const {
        languagePreference,
        speechRate = 0.85,
        generateIfMissing = true,
      } = options;
      const language = toAudioLanguage(languagePreference);

      setIsLoading(true);
      try {
        const existingAudioUrl = getAudioUrl(word, languagePreference);

        if (existingAudioUrl) {
          await playAudioUrl(existingAudioUrl);
          return;
        }

        if (generateIfMissing) {
          const cacheKey = `${word.id}:${language}`;
          const cachedUrl = generatedCacheRef.current.get(cacheKey);
          if (cachedUrl) {
            await playAudioUrl(cachedUrl);
            return;
          }
          const generated = await generateWordAudio({
            text: getSpeechText(word, languagePreference),
            language,
            speech_rate: speechRate,
          });
          generatedCacheRef.current.set(cacheKey, generated.audio_url);
          await playAudioUrl(generated.audio_url);
          return;
        }

        speakFallback(getSpeechText(word, languagePreference));
      } catch {
        speakFallback(getSpeechText(word, languagePreference));
      } finally {
        setIsLoading(false);
      }
    },
    [playAudioUrl, speakFallback],
  );

  const playSentence = useCallback(
    async (text: string, options: PlayTextOptions) => {
      const { languagePreference, speechRate = 0.85 } = options;
      const language = toAudioLanguage(languagePreference);

      setIsLoading(true);
      try {
        const generated = await generateSentenceAudio({
          text,
          language,
          speech_rate: speechRate,
        });
        await playAudioUrl(generated.audio_url);
      } catch {
        speakFallback(text);
      } finally {
        setIsLoading(false);
      }
    },
    [playAudioUrl, speakFallback],
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isPlaying,
    isLoading,
    stop,
    playWord,
    playSentence,
  };
}
