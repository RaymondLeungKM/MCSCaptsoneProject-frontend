"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Star,
  Sparkles,
} from "lucide-react";
import type { Story, StoryPage, DialogicPrompt } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/lib/speech";

interface DialogicStoryModalProps {
  story: Story;
  onClose: () => void;
}

export function DialogicStoryModal({
  story,
  onClose,
}: DialogicStoryModalProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showAction, setShowAction] = useState(false);

  const { speak, stop } = useSpeech();

  const currentPage = story.pages[currentPageIndex];
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === story.pages.length - 1;
  const hasPrompts =
    currentPage.dialogicPrompts && currentPage.dialogicPrompts.length > 0;
  const currentPrompt = hasPrompts
    ? currentPage.dialogicPrompts![currentPromptIndex]
    : null;

  const speakText = useCallback(
    (text: string, onEnd?: () => void) => {
      console.log("[DialogicStory] speakText called:", {
        text: text.substring(0, 50),
        isMuted,
      });

      if (isMuted) {
        onEnd?.();
        return;
      }

      const result = speak(text, {
        rate: 0.75,
        pitch: 1.1,
        onStart: () => {
          console.log("[DialogicStory] Speech started");
          setIsPlaying(true);
        },
        onEnd: () => {
          console.log("[DialogicStory] Speech ended");
          setIsPlaying(false);
          onEnd?.();
        },
        onError: (error) => {
          console.log("[DialogicStory] Speech error:", error);
          setIsPlaying(false);
          onEnd?.();
        },
      });

      console.log("[DialogicStory] speak() returned:", result);
    },
    [isMuted, speak],
  );

  const stopSpeaking = useCallback(() => {
    stop();
    setIsPlaying(false);
    setIsAutoPlaying(false);
  }, [stop]);

  const playCurrentPage = useCallback(() => {
    speakText(currentPage.text, () => {
      // After reading, show prompt if available
      if (hasPrompts && !showPrompt) {
        setTimeout(() => setShowPrompt(true), 500);
      }
    });
  }, [currentPage.text, hasPrompts, showPrompt, speakText]);

  const handlePromptContinue = () => {
    if (
      hasPrompts &&
      currentPromptIndex < currentPage.dialogicPrompts!.length - 1
    ) {
      // Move to next prompt
      setCurrentPromptIndex((prev) => prev + 1);
    } else {
      // Done with prompts, show action if available
      setShowPrompt(false);
      setCurrentPromptIndex(0);

      if (currentPage.physicalAction) {
        setShowAction(true);
      } else {
        // Go to next page
        goToNextPage();
      }
    }
  };

  const handleActionDone = () => {
    setShowAction(false);
    goToNextPage();
  };

  const goToNextPage = useCallback(() => {
    if (isLastPage) {
      setIsComplete(true);
      setIsAutoPlaying(false);
    } else {
      setCurrentPageIndex((prev) => prev + 1);
      setShowPrompt(false);
      setShowAction(false);
      setCurrentPromptIndex(0);
    }
  }, [isLastPage]);

  const goToPrevPage = () => {
    if (!isFirstPage) {
      stopSpeaking();
      setCurrentPageIndex((prev) => prev - 1);
      setShowPrompt(false);
      setShowAction(false);
      setCurrentPromptIndex(0);
    }
  };

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      stopSpeaking();
      setIsAutoPlaying(false);
    } else {
      setIsAutoPlaying(true);
      if (!isPlaying) {
        playCurrentPage();
      }
    }
  };

  // Auto-play logic
  useEffect(() => {
    if (
      isAutoPlaying &&
      !isPlaying &&
      !showPrompt &&
      !showAction &&
      !isComplete
    ) {
      const timer = setTimeout(() => {
        playCurrentPage();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    isAutoPlaying,
    isPlaying,
    showPrompt,
    showAction,
    isComplete,
    playCurrentPage,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const restartStory = () => {
    setCurrentPageIndex(0);
    setIsComplete(false);
    setIsAutoPlaying(false);
    setShowPrompt(false);
    setShowAction(false);
    stopSpeaking();
  };

  const renderHighlightedText = (text: string, highlightedWords: string[]) => {
    const words = text.split(" ");
    return words.map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?]/g, "");
      const isHighlighted = highlightedWords.some(
        (hw) =>
          cleanWord.includes(hw.toLowerCase()) ||
          hw.toLowerCase().includes(cleanWord),
      );

      return (
        <span
          key={index}
          className={cn(
            "transition-colors",
            isHighlighted &&
              "text-primary font-bold bg-primary/10 px-1 rounded",
          )}
        >
          {word}{" "}
        </span>
      );
    });
  };

  if (isComplete) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-card rounded-3xl max-h-[90vh] overflow-hidden">
          <div className="p-8 text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <h2 className="text-3xl font-bold text-foreground">Great Job!</h2>
            <p className="text-muted-foreground text-lg">
              You finished reading {story.title}!
            </p>

            <div className="flex gap-3 justify-center">
              <Button onClick={restartStory} variant="outline" size="lg">
                <RotateCcw className="w-5 h-5 mr-2" />
                Read Again
              </Button>
              <Button onClick={onClose} size="lg">
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-card rounded-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <h2 className="text-xl font-bold text-foreground truncate">
            {story.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Close story"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 pt-2">
          <div className="flex gap-1">
            {story.pages.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-all",
                  i < currentPageIndex
                    ? "bg-mint"
                    : i === currentPageIndex
                      ? "bg-primary"
                      : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Page Content */}
          {!showPrompt && !showAction && (
            <div className="space-y-4">
              {/* Emoji */}
              <div className="text-center">
                <span className="text-8xl">{currentPage.emoji}</span>
              </div>

              {/* Text */}
              <div className="bg-muted/30 rounded-2xl p-6">
                <p className="text-2xl leading-relaxed text-foreground">
                  {renderHighlightedText(
                    currentPage.text,
                    currentPage.highlightedWords,
                  )}
                </p>
              </div>

              {/* Play Button */}
              <div className="flex justify-center">
                <Button
                  onClick={playCurrentPage}
                  disabled={isPlaying}
                  size="lg"
                  className="gap-2"
                >
                  <Volume2 className="w-5 h-5" />
                  {isPlaying ? "Reading..." : "Read to Me"}
                </Button>
              </div>
            </div>
          )}

          {/* Dialogic Prompt */}
          {showPrompt && currentPrompt && (
            <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center gap-2 justify-center text-primary">
                <Sparkles className="w-6 h-6" />
                <h3 className="text-lg font-bold">Let's Talk!</h3>
              </div>

              <div className="bg-primary/10 border-2 border-primary/30 rounded-2xl p-6 space-y-4">
                <p className="text-xl font-medium text-foreground">
                  {currentPrompt.question}
                </p>

                <div className="flex gap-3 justify-center">
                  <Button onClick={handlePromptContinue} size="lg">
                    I Answered! →
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  💬 Talk about your answer together!
                </p>
              </div>
            </div>
          )}

          {/* Physical Action */}
          {showAction && currentPage.physicalAction && (
            <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center gap-2 justify-center text-sunny">
                <Sparkles className="w-6 h-6" />
                <h3 className="text-lg font-bold">Let's Move!</h3>
              </div>

              <div className="bg-sunny/10 border-2 border-sunny/30 rounded-2xl p-6 space-y-4">
                <div className="text-center text-6xl">🤸</div>
                <p className="text-xl font-medium text-foreground text-center">
                  {currentPage.physicalAction}
                </p>

                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleActionDone}
                    size="lg"
                    className="bg-sunny hover:bg-sunny/90"
                  >
                    I Did It! →
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="border-t bg-muted/30 p-4 flex items-center justify-between">
          <Button
            onClick={goToPrevPage}
            disabled={isFirstPage}
            variant="outline"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={() => setIsMuted(!isMuted)}
              variant="ghost"
              size="icon"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>

            <Button
              onClick={toggleAutoPlay}
              variant={isAutoPlaying ? "default" : "outline"}
              size="icon"
              aria-label={isAutoPlaying ? "Pause auto-play" : "Start auto-play"}
            >
              {isAutoPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
          </div>

          <Button
            onClick={() => {
              if (!showPrompt && !showAction) {
                goToNextPage();
              }
            }}
            disabled={isLastPage || showPrompt || showAction}
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
