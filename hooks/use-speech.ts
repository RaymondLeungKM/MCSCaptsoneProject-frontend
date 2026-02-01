// Re-export and extend useSpeech hook with reading state
import { useState, useCallback } from "react";
import { speechService } from "@/lib/speech";

export function useSpeech() {
  const [isReading, setIsReading] = useState(false);

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
      return speechService.speak(text, {
        ...options,
        onStart: () => {
          setIsReading(true);
          options?.onStart?.();
        },
        onEnd: () => {
          setIsReading(false);
          options?.onEnd?.();
        },
        onError: (error) => {
          setIsReading(false);
          options?.onError?.(error);
        },
      });
    },
    [],
  );

  const stop = useCallback(() => {
    speechService.stop();
    setIsReading(false);
  }, []);

  const isAvailable = useCallback(() => {
    return speechService.isAvailable();
  }, []);

  return { speak, stop, isAvailable, isReading };
}
