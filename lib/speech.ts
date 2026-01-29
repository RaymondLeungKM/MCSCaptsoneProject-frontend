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
      // Prefer English voices
      this.preferredVoice =
        this.voices.find((v) => v.lang.startsWith("en") && v.localService) ||
        this.voices.find((v) => v.lang.startsWith("en")) ||
        this.voices[0] ||
        null;

      this.initialized = this.voices.length > 0;

      if (this.initialized) {
        console.log(
          "[Speech] Voices loaded:",
          this.voices.length,
          "Preferred:",
          this.preferredVoice?.name,
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
      onStart,
      onEnd,
      onError,
    } = options;

    try {
      // Force load voices synchronously if not already loaded
      // This is critical for Chrome - voices must be available immediately
      if (!this.initialized || this.voices.length === 0) {
        this.voices = window.speechSynthesis.getVoices();
        if (this.voices.length > 0) {
          this.preferredVoice =
            this.voices.find(
              (v) => v.lang.startsWith("en") && v.localService,
            ) ||
            this.voices.find((v) => v.lang.startsWith("en")) ||
            this.voices[0] ||
            null;
          this.initialized = true;
          console.log(
            "[Speech] Voices loaded synchronously:",
            this.voices.length,
            "Preferred:",
            this.preferredVoice?.name,
          );
        } else {
          console.warn("[Speech] No voices available yet - speaking anyway");
        }
      }

      // Cancel any ongoing speech only if actually speaking or pending
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        console.log("[Speech] Canceling previous speech");
        window.speechSynthesis.cancel();
        // Give a tiny moment for cancel to complete
        // This prevents Chrome from interrupting the next utterance
      }

      console.log("[Speech] Speaking:", text.substring(0, 20) + "...");

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      utterance.lang = "en-US";

      // Set preferred voice if available
      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
        console.log("[Speech] Using voice:", this.preferredVoice.name);
      } else {
        console.log("[Speech] No preferred voice set - using default");
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
