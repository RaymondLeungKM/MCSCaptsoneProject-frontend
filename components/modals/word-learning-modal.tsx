"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Star,
  Check,
  Repeat,
} from "lucide-react";
import type { Word, LanguagePreference } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/lib/speech";
import { updateWordProgress } from "@/lib/api/vocabulary";
import { trackDailyWord } from "@/lib/api/bedtime-stories";
import { AISentences } from "@/components/child/ai-sentences";
import {
  getWordText,
  getDefinition,
  getExample,
  getSpeechText,
} from "@/lib/language-utils";

interface WordLearningModalProps {
  word: Word;
  onClose: () => void;
  onComplete?: () => void;
  childId: string;
  languagePreference?: LanguagePreference;
}

type Step =
  | "intro"
  | "listen"
  | "repeat"
  | "example"
  | "ai-sentences"
  | "complete";

export function WordLearningModal({
  word,
  onClose,
  onComplete,
  childId,
  languagePreference = "cantonese",
}: WordLearningModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>("intro");
  const [isPlaying, setIsPlaying] = useState(false);
  const { speak } = useSpeech();
  const progressRecorded = useRef(false);

  const wordText = getWordText(word, languagePreference);
  const definition = getDefinition(word, languagePreference);
  const example = getExample(word, languagePreference);
  const speechText = getSpeechText(word, languagePreference);

  const playWord = () => {
    speak(speechText, {
      rate: 0.6,
      pitch: 1.1,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: (error) => {
        console.log("[WordLearning] Word playback error:", error);
        setIsPlaying(false);
      },
    });
  };

  // Record progress when reaching complete step (only once)
  useEffect(() => {
    async function recordProgress() {
      if (currentStep === "complete" && !progressRecorded.current) {
        progressRecorded.current = true;
        try {
          // Update general word progress
          await updateWordProgress(word.id, childId, {
            exposure_count: (word.exposureCount || 0) + 1,
          });

          // Track word for daily story generation
          await trackDailyWord({
            child_id: childId,
            word_id: word.id,
            date: new Date().toISOString(),
            exposure_count: 1,
            used_actively: false,
            mastery_confidence: 0.5,
            learned_context: {
              activity: "word_learning",
              source: "vocabulary_explorer",
            },
            include_in_story: true,
            story_priority: 5,
          });

          console.log(
            "Progress recorded successfully (word progress + daily tracking)",
          );
        } catch (error) {
          console.error("Failed to record word progress:", error);
        }
      }
    }
    recordProgress();
  }, [currentStep, word.id, word.exposureCount, childId]);

  const playExample = () => {
    speak(example, {
      rate: 0.7,
      pitch: 1.1,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: (error) => {
        console.log("[WordLearning] Example playback error:", error);
        setIsPlaying(false);
      },
    });
  };

  const steps: Step[] = [
    "intro",
    "listen",
    "repeat",
    "example",
    "ai-sentences",
    "complete",
  ];
  const currentIndex = steps.indexOf(currentStep);

  const goNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const getCategoryEmoji = () => {
    switch (word.category) {
      case "Animals":
        return "🦁";
      case "Food":
        return "🍎";
      case "Nature":
        return "🌳";
      case "Colors":
        return "🎨";
      case "Vehicles":
        return "🚗";
      case "Family":
        return "👨‍👩‍👧";
      default:
        return "📚";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card rounded-3xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {steps.map((step, i) => (
              <div
                key={step}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i <= currentIndex ? "bg-primary w-4" : "bg-muted",
                )}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px] flex flex-col">
          {currentStep === "intro" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-32 h-32 rounded-3xl bg-sunny/30 flex items-center justify-center text-7xl mb-6 border-4 border-sunny/50 shadow-lg overflow-hidden">
                {word.image?.startsWith("http") ? (
                  <img
                    src={word.image}
                    alt={wordText}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{word.image || getCategoryEmoji()}</span>
                )}
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {wordText}
              </h2>
              <p className="text-lg text-muted-foreground">{definition}</p>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {word.categoryName}
                </span>
                <span
                  className={cn(
                    "text-sm px-3 py-1 rounded-full",
                    word.difficulty === "easy" && "bg-mint/30 text-foreground",
                    word.difficulty === "medium" &&
                      "bg-sunny/30 text-foreground",
                    word.difficulty === "hard" && "bg-coral/30 text-foreground",
                  )}
                >
                  {word.difficulty}
                </span>
              </div>
            </div>
          )}

          {currentStep === "listen" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-lg text-muted-foreground mb-6">
                Listen carefully!
              </p>
              <button
                onClick={playWord}
                className={cn(
                  "w-32 h-32 rounded-full flex items-center justify-center transition-all",
                  "bg-primary shadow-xl",
                  isPlaying && "animate-pulse scale-110",
                )}
                aria-label="Listen to word"
              >
                <Volume2
                  className={cn(
                    "w-16 h-16 text-primary-foreground",
                    isPlaying && "animate-bounce",
                  )}
                />
              </button>
              <h2 className="text-3xl font-bold text-foreground mt-6">
                {wordText}
              </h2>
              <p className="text-lg text-muted-foreground font-mono mt-2">
                /{word.pronunciation}/
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Tap the button to hear the word
              </p>
            </div>
          )}

          {currentStep === "repeat" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-lg text-muted-foreground mb-6">Now you try!</p>
              <div className="w-32 h-32 rounded-full bg-sky/30 flex items-center justify-center border-4 border-sky/50 mb-6">
                <Repeat className="w-16 h-16 text-sky" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {wordText}
              </h2>
              <p className="text-muted-foreground font-mono mb-4">
                /{word.pronunciation}/
              </p>
              <p className="text-foreground">
                Say it out loud: <strong>{wordText}</strong>
              </p>
              <button
                onClick={playWord}
                className="mt-4 px-6 py-3 rounded-2xl bg-muted hover:bg-muted/80 flex items-center gap-2 transition-colors"
              >
                <Volume2 className="w-5 h-5" />
                Hear it again
              </button>
            </div>
          )}

          {currentStep === "example" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-lg text-muted-foreground mb-6">
                Use it in a sentence!
              </p>
              <div className="bg-sunny/20 rounded-2xl p-6 w-full max-w-sm border-4 border-sunny/30">
                <p className="text-xl text-foreground leading-relaxed">
                  &ldquo;{example}&rdquo;
                </p>
              </div>
              <button
                onClick={playExample}
                className={cn(
                  "mt-6 px-6 py-3 rounded-2xl flex items-center gap-2 transition-all",
                  "bg-primary text-primary-foreground",
                  isPlaying && "animate-pulse",
                )}
              >
                <Volume2 className="w-5 h-5" />
                Listen to sentence
              </button>
              <p className="text-sm text-muted-foreground mt-4">
                Try making your own sentence with <strong>{wordText}</strong>!
              </p>
            </div>
          )}

          {currentStep === "ai-sentences" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  More Examples
                </h2>
                <p className="text-muted-foreground">
                  See how to use <strong>{wordText}</strong> in different
                  sentences
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-2">
                <AISentences
                  wordId={word.id}
                  languagePreference={languagePreference}
                />
              </div>
            </div>
          )}

          {currentStep === "complete" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-full bg-mint flex items-center justify-center mb-6 animate-bounce">
                <Check className="w-12 h-12 text-card" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Great Job!
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                You learned a new word: <strong>{wordText}</strong>
              </p>
              <div className="flex items-center gap-2 bg-sunny/30 px-4 py-2 rounded-full">
                <Star className="w-5 h-5 text-sunny fill-sunny" />
                <span className="font-bold text-foreground">+10 XP</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentIndex === 0}
            className="rounded-2xl bg-transparent"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Button>

          {currentStep === "complete" ? (
            <Button
              onClick={() => {
                console.log("Done button clicked, calling onComplete...");
                onComplete?.();
                onClose();
              }}
              className="rounded-2xl bg-primary"
            >
              Done
              <Check className="w-5 h-5 ml-1" />
            </Button>
          ) : (
            <Button onClick={goNext} className="rounded-2xl bg-primary">
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
