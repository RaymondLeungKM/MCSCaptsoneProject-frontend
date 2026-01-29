"use client";

import { useState } from "react";
import { Volume2, ChevronRight, ArrowLeft, Star, Check } from "lucide-react";
import type { Category, Word } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/lib/speech";

interface LearnViewProps {
  categories: Category[];
  words: Word[];
  onSelectWord: (word: Word) => void;
}

export function LearnView({ categories, words, onSelectWord }: LearnViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const { speak } = useSpeech();

  const categoryWords = selectedCategory
    ? words.filter((w) => w.categoryName === selectedCategory.name)
    : [];

  const playWord = (word: string) => {
    speak(word, {
      rate: 0.7,
      pitch: 1.2,
    });
  };

  if (selectedCategory) {
    return (
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-3xl">{selectedCategory.icon}</span>
            <h1 className="text-2xl font-bold text-foreground">
              {selectedCategory.name}
            </h1>
          </div>
        </div>

        {/* Words Grid */}
        <div className="grid grid-cols-2 gap-3">
          {categoryWords.map((word) => (
            <div
              key={word.id}
              onClick={() => onSelectWord(word)}
              className={cn(
                "relative flex flex-col items-center p-4 rounded-2xl cursor-pointer",
                "border-4 shadow-md transition-all duration-200",
                "hover:scale-105 active:scale-95 hover:shadow-lg",
                selectedCategory.color,
                word.mastered
                  ? "border-mint"
                  : "border-primary/20 hover:border-primary/40",
              )}
            >
              {word.mastered && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-mint flex items-center justify-center">
                  <Check className="w-4 h-4 text-card" />
                </div>
              )}

              {/* XP Badge for new words */}
              {word.exposureCount === 0 && (
                <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-sunny text-xs font-bold text-foreground shadow-md flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  +10 XP
                </div>
              )}

              <div
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-2",
                  selectedCategory.color,
                )}
              >
                {word.image}
              </div>

              <p className="font-bold text-foreground">{word.word}</p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playWord(word.word);
                }}
                className="mt-2 p-2 rounded-full bg-primary/10 hover:bg-primary/20"
                aria-label={`Listen to ${word.word}`}
              >
                <Volume2 className="w-4 h-4 text-primary" />
              </button>

              {/* Exposure indicator */}
              <div className="flex flex-col items-center gap-1 mt-2">
                <div className="flex gap-1">
                  {[...Array(6)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-3 h-3",
                        i < word.exposureCount
                          ? "text-sunny fill-sunny"
                          : "text-muted",
                      )}
                    />
                  ))}
                </div>
                {word.exposureCount > 0 && (
                  <p className="text-xs text-muted-foreground">Practice mode</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {categoryWords.length === 0 && (
          <div className="text-center py-12">
            <p className="text-6xl mb-4">🔍</p>
            <p className="text-muted-foreground">
              No words in this category yet!
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-3xl">📖</span>
        <h1 className="text-2xl font-bold text-foreground">Learn New Words</h1>
      </div>

      <p className="text-muted-foreground">
        Choose a topic you want to explore!
      </p>

      <div className="flex flex-col gap-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl w-full text-left",
              "border-4 border-transparent transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg",
              category.color,
              "hover:border-foreground/20",
            )}
          >
            <div className="w-14 h-14 rounded-2xl bg-card/50 flex items-center justify-center text-3xl shadow-inner">
              {category.icon}
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-foreground text-lg">
                {category.name}
              </h3>
              <p className="text-sm text-foreground/70">
                {category.wordCount} words to learn
              </p>
            </div>

            <ChevronRight className="w-6 h-6 text-foreground/50" />
          </button>
        ))}
      </div>
    </div>
  );
}
