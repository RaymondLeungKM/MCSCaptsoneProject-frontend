"use client";

import { useState } from "react";
import { Volume2, ChevronRight, Sparkles } from "lucide-react";
import type { Word } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSpeech } from "@/lib/speech";

interface WordOfTheDayProps {
  word: Word;
  onLearnMore: (word: Word) => void;
}

export function WordOfTheDay({ word, onLearnMore }: WordOfTheDayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { speak } = useSpeech();

  const playPronunciation = () => {
    speak(word.word, {
      rate: 0.7,
      pitch: 1.2,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
    });
  };

  return (
    <section className="bg-card rounded-3xl p-5 shadow-lg border-4 border-sunny/50 relative overflow-hidden">
      {/* Decorative sparkles */}
      <div className="absolute top-2 right-2 text-sunny">
        <Sparkles className="w-6 h-6 animate-pulse" />
      </div>

      {/* XP Badge for new words */}
      {word.exposureCount === 0 && (
        <div className="absolute top-2 left-2 px-3 py-1 rounded-full bg-sunny text-sm font-bold text-foreground shadow-md flex items-center gap-1">
          <Star className="w-4 h-4 fill-current" />
          +10 XP
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🌟</span>
        <h2 className="text-lg font-bold text-foreground">Word of the Day</h2>
      </div>

      <div className="flex gap-4">
        {/* Word Image */}
        <div className="w-28 h-28 rounded-2xl bg-sunny/30 flex items-center justify-center text-6xl border-4 border-sunny/50 shadow-inner flex-shrink-0">
          {word.image}
        </div>

        <div className="flex-1 min-w-0">
          {/* Word */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-2xl font-bold text-foreground">{word.word}</h3>
            <button
              onClick={playPronunciation}
              className={cn(
                "p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-all",
                isPlaying && "animate-pulse bg-primary/30",
              )}
              aria-label={`Listen to pronunciation of ${word.word}`}
            >
              <Volume2
                className={cn(
                  "w-5 h-5 text-primary",
                  isPlaying && "animate-bounce",
                )}
              />
            </button>
          </div>

          {/* Pronunciation */}
          <p className="text-sm text-muted-foreground mb-2 font-mono">
            /{word.pronunciation}/
          </p>

          {/* Simple Definition */}
          <p className="text-sm text-foreground leading-relaxed line-clamp-2">
            {word.definition}
          </p>

          {/* Learning status */}
          {word.exposureCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Practiced {word.exposureCount} time
              {word.exposureCount > 1 ? "s" : ""} • Practice mode
            </p>
          )}
        </div>
      </div>

      {/* Learn More Button */}
      <Button
        onClick={() => onLearnMore(word)}
        className="w-full mt-4 rounded-2xl h-12 text-base font-bold gap-2 bg-primary hover:bg-primary/90"
      >
        Learn This Word
        <ChevronRight className="w-5 h-5" />
      </Button>
    </section>
  );
}
