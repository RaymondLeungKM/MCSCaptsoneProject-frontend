// Centralized speech synthesis utility with proper initialization
// Handles browser quirks and voice loading, especially Chrome's strict requirements

import { useCallback } from "react";

class SpeechService {
  private initialized = false;
  private voices: SpeechSynthesisVoice[] = [];
  private preferredVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.init();
    }
  }

  private init() {
    // Load voices - they may load async
    const loadVoices = () => {
      this.voices = window.speechSynthesis.getVoices();
      this.initialized = this.voices.length > 0;

      if (this.initialized) {
        console.log("[Speech] Voices loaded:", this.voices.length);
        // Log available Chinese voices
        const chineseVoices = this.voices.filter(
          (v) =>
            v.lang.includes("zh") ||
            v.lang.includes("yue") ||
            v.lang.includes("cmn"),
        );
        console.log(
          "[Speech] Chinese voices available:",
          chineseVoices.map((v) => `${v.name} (${v.lang})`),
        );
      }
    };

    // Try loading immediately
    loadVoices();

    // Also listen for voices changed event (Chrome/Safari loads async)
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  private selectVoice(
    text: string,
    langCode?: string,
  ): SpeechSynthesisVoice | null {
    // Detect if text contains Chinese characters
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);

    if (langCode) {
      // Use provided language code
      return (
        this.voices.find((v) => v.lang === langCode) ||
        this.voices.find((v) => v.lang.startsWith(langCode.split("-")[0])) ||
        null
      );
    } else if (hasChinese) {
      // Auto-detect Chinese - prefer Cantonese (yue/zh-HK), then Mandarin
      return (
        this.voices.find((v) => v.lang.includes("yue")) ||
        this.voices.find((v) => v.lang === "zh-HK") ||
        this.voices.find((v) => v.lang === "zh-TW") ||
        this.voices.find((v) => v.lang === "zh-CN") ||
        this.voices.find((v) => v.lang.startsWith("zh")) ||
        null
      );
    } else {
      // English text
      return (
        this.voices.find((v) => v.lang.startsWith("en") && v.localService) ||
        this.voices.find((v) => v.lang.startsWith("en")) ||
        null
      );
    }
  }

  isAvailable(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  // Synchronous speak method to maintain user gesture context in Chrome
  speak(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      volume?: number;
      lang?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: string) => void;
    } = {},
  ): boolean {
    if (!this.isAvailable()) {
      options.onError?.("Speech synthesis not available");
      return false;
    }

    const {
      rate = 0.8,
      pitch = 1.1,
      volume = 1,
      lang,
      onStart,
      onEnd,
      onError,
    } = options;

    try {
      // Force load voices synchronously if not already loaded
      if (!this.initialized || this.voices.length === 0) {
        this.voices = window.speechSynthesis.getVoices();
        this.initialized = this.voices.length > 0;
        if (this.initialized) {
          console.log(
            "[Speech] Voices loaded synchronously:",
            this.voices.length,
          );
        } else {
          console.warn("[Speech] No voices available yet - speaking anyway");
        }
      }

      // Cancel any ongoing speech
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        console.log("[Speech] Canceling previous speech");
        window.speechSynthesis.cancel();
      }

      console.log("[Speech] Speaking:", text.substring(0, 30) + "...");

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Select appropriate voice based on text content or provided lang
      const selectedVoice = this.selectVoice(text, lang);

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        console.log(
          "[Speech] Using voice:",
          selectedVoice.name,
          "Lang:",
          selectedVoice.lang,
        );
      } else {
        // Detect language from text
        const hasChinese = /[\u4e00-\u9fa5]/.test(text);
        utterance.lang = hasChinese ? "zh-HK" : "en-US";
        console.log(
          "[Speech] No voice found, using default lang:",
          utterance.lang,
        );
      }

      utterance.onstart = () => {
        console.log("[Speech] Started speaking");
        onStart?.();
      };

      utterance.onend = () => {
        console.log("[Speech] Finished speaking normally");
        onEnd?.();
      };

      utterance.onerror = (event) => {
        console.log("[Speech] Error event:", event.error);
        // Ignore 'canceled' and 'interrupted' errors as they're expected when stopping or switching speech
        if (event.error !== "canceled" && event.error !== "interrupted") {
          console.error("[Speech] Unexpected error:", event.error);
          onError?.(event.error);
        } else {
          console.log("[Speech] Speech was", event.error);
          onEnd?.();
        }
      };

      // Speak the utterance - must happen synchronously in user gesture context
      window.speechSynthesis.speak(utterance);
      console.log(
        "[Speech] Utterance queued, speaking:",
        window.speechSynthesis.speaking,
        "pending:",
        window.speechSynthesis.pending,
      );
      return true;
    } catch (error) {
      console.error("[Speech] Exception:", error);
      onError?.(error instanceof Error ? error.message : "Unknown error");
      return false;
    }
  }

  stop() {
    console.log("[Speech] stop() called");
    if (this.isAvailable()) {
      window.speechSynthesis.cancel();
    }
  }
}

// Singleton instance
export const speechService = new SpeechService();

// Hook for React components
export function useSpeech() {
  const speak = useCallback(
    (
      text: string,
      options?: {
        rate?: number;
        pitch?: number;
        onStart?: () => void;
        onEnd?: () => void;
        onError?: (error: string) => void;
      },
    ) => {
      return speechService.speak(text, options);
    },
    [],
  );

  const stop = useCallback(() => {
    speechService.stop();
  }, []);

  const isAvailable = useCallback(() => {
    return speechService.isAvailable();
  }, []);

  return { speak, stop, isAvailable };
}
