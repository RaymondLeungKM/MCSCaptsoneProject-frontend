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
} from "lucide-react";
import type { Story, StoryPage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/lib/speech";

interface StoryReaderModalProps {
  story: Story;
  onClose: () => void;
}

export function StoryReaderModal({ story, onClose }: StoryReaderModalProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { speak, stop } = useSpeech();

  const currentPage = story.pages[currentPageIndex];
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === story.pages.length - 1;

  const speakText = useCallback(
    (text: string, onEnd?: () => void) => {
      if (isMuted) {
        onEnd?.();
        return;
      }

      speak(text, {
        rate: 0.75,
        pitch: 1.1,
        onStart: () => setIsPlaying(true),
        onEnd: () => {
          setIsPlaying(false);
          onEnd?.();
        },
        onError: (error) => {
          console.log("[StoryReader] Speech error:", error);
          setIsPlaying(false);
          onEnd?.();
        },
      });
    },
    [isMuted, speak],
  );

  const stopSpeaking = useCallback(() => {
    stop();
    setIsPlaying(false);
    setIsAutoPlaying(false);
  }, [stop]);

  const playCurrentPage = useCallback(() => {
    speakText(currentPage.text);
  }, [currentPage.text, speakText]);

  const goToNextPage = useCallback(() => {
    if (isLastPage) {
      setIsComplete(true);
      setIsAutoPlaying(false);
    } else {
      setCurrentPageIndex((prev) => prev + 1);
    }
  }, [isLastPage]);

  const goToPrevPage = useCallback(() => {
    stopSpeaking();
    if (!isFirstPage) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  }, [isFirstPage, stopSpeaking]);

  const toggleAutoPlay = useCallback(() => {
    if (isAutoPlaying) {
      stopSpeaking();
    } else {
      setIsAutoPlaying(true);
    }
  }, [isAutoPlaying, stopSpeaking]);

  // Auto-play when enabled or page changes
  useEffect(() => {
    if (isAutoPlaying && !isPlaying && !isComplete) {
      speakText(currentPage.text, () => {
        // Wait a moment before going to next page
        setTimeout(() => {
          if (isAutoPlaying) {
            goToNextPage();
          }
        }, 1000);
      });
    }
  }, [
    isAutoPlaying,
    isPlaying,
    currentPage.text,
    speakText,
    goToNextPage,
    isComplete,
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
        <span key={index}>
          <span
            className={cn(
              "transition-colors",
              isHighlighted &&
                "bg-sunny/50 text-foreground font-bold px-1 rounded",
            )}
          >
            {word}
          </span>
          {index < words.length - 1 && " "}
        </span>
      );
    });
  };

  if (isComplete) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative w-full max-w-lg mx-4 bg-card rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-mint flex items-center justify-center mb-6 animate-bounce">
              <Star className="w-12 h-12 text-card fill-card" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              The End!
            </h2>
            <p className="text-lg text-muted-foreground mb-2">
              Great job reading <strong>{story.title}</strong>!
            </p>
            <div className="flex items-center gap-2 bg-sunny/30 px-4 py-2 rounded-full mb-6">
              <Star className="w-5 h-5 text-sunny fill-sunny" />
              <span className="font-bold text-foreground">+25 XP</span>
            </div>
            <p className="text-muted-foreground mb-6">
              You learned{" "}
              {story.pages.reduce(
                (acc, p) => acc + p.highlightedWords.length,
                0,
              )}{" "}
              new words!
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={restartStory}
                className="rounded-2xl bg-transparent"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Read Again
              </Button>
              <Button onClick={onClose} className="rounded-2xl bg-primary">
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card rounded-t-[2rem] sm:rounded-3xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <div>
              <h2 className="font-bold text-foreground text-sm">
                {story.title}
              </h2>
              <p className="text-xs text-muted-foreground">
                Page {currentPageIndex + 1} of {story.pages.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{
              width: `${((currentPageIndex + 1) / story.pages.length) * 100}%`,
            }}
          />
        </div>

        {/* Content */}
        <div className="p-6 min-h-[350px] flex flex-col">
          {/* Page Emoji/Illustration */}
          <div className="flex justify-center mb-6">
            <div
              className={cn(
                "w-28 h-28 rounded-3xl flex items-center justify-center text-6xl",
                "bg-sky/20 border-4 border-sky/30 shadow-lg",
                isPlaying && "animate-pulse",
              )}
            >
              {currentPage.emoji}
            </div>
          </div>

          {/* Story Text */}
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xl leading-relaxed text-center text-foreground text-balance">
              {renderHighlightedText(
                currentPage.text,
                currentPage.highlightedWords,
              )}
            </p>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "p-3 rounded-full transition-all",
                isMuted
                  ? "bg-muted text-muted-foreground"
                  : "bg-muted hover:bg-muted/80",
              )}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={playCurrentPage}
              disabled={isPlaying || isMuted}
              className={cn(
                "p-4 rounded-full transition-all",
                "bg-primary text-primary-foreground",
                isPlaying && "animate-pulse",
                (isPlaying || isMuted) && "opacity-50",
              )}
              aria-label="Listen to this page"
            >
              <Volume2
                className={cn("w-6 h-6", isPlaying && "animate-bounce")}
              />
            </button>

            <button
              onClick={toggleAutoPlay}
              className={cn(
                "p-3 rounded-full transition-all",
                isAutoPlaying
                  ? "bg-coral text-card"
                  : "bg-mint/30 hover:bg-mint/50 text-foreground",
              )}
              aria-label={isAutoPlaying ? "Stop auto-play" : "Auto-play story"}
            >
              {isAutoPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-2">
            {isAutoPlaying
              ? "Auto-playing story..."
              : "Tap the speaker to listen, or play button for auto-read"}
          </p>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <Button
            variant="outline"
            onClick={goToPrevPage}
            disabled={isFirstPage}
            className="rounded-2xl bg-transparent"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Button>

          {/* Page indicators */}
          <div className="flex gap-1">
            {story.pages.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentPageIndex ? "bg-primary w-4" : "bg-muted",
                )}
              />
            ))}
          </div>

          <Button onClick={goToNextPage} className="rounded-2xl bg-primary">
            {isLastPage ? "Finish" : "Next"}
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
