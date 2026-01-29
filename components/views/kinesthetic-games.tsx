"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Star,
  Check,
  Volume2,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { Game, Word } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/lib/speech";

interface KinestheticGamesViewProps {
  game: Game;
  words?: Word[];
  onBack: () => void;
}

export function KinestheticGamesView({
  game,
  words = [],
  onBack,
}: KinestheticGamesViewProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showAction, setShowAction] = useState(true);
  const [gameComplete, setGameComplete] = useState(false);
  const { speak } = useSpeech();

  // Get words with physical actions
  const gameWords = words.filter((w) => w.physicalAction).slice(0, 5);
  const currentWord = gameWords[currentWordIndex];

  useEffect(() => {
    if (currentWord && showAction) {
      // Speak the word and instruction
      setTimeout(() => {
        speak(currentWord.word, {
          rate: 0.7,
          pitch: 1.2,
        });
      }, 500);
    }
  }, [currentWord, showAction, speak]);

  const handleActionComplete = () => {
    setScore((prev) => prev + 10);
    setShowAction(false);

    // Show celebration briefly
    setTimeout(() => {
      if (currentWordIndex < gameWords.length - 1) {
        setCurrentWordIndex((prev) => prev + 1);
        setShowAction(true);
      } else {
        setGameComplete(true);
      }
    }, 1500);
  };

  const playWord = (word: string) => {
    speak(word, {
      rate: 0.7,
      pitch: 1.2,
    });
  };

  if (gameComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-6">
        <div className="text-8xl animate-bounce">🏆</div>
        <h2 className="text-4xl font-bold text-foreground">Awesome Job!</h2>
        <p className="text-xl text-muted-foreground">
          You acted out {gameWords.length} words!
        </p>
        <div className="flex items-center gap-2 text-2xl font-bold text-sunny">
          <Star className="w-8 h-8 fill-sunny" />
          <span>{score} points!</span>
        </div>
        <Button onClick={onBack} size="lg">
          Play Again
        </Button>
      </div>
    );
  }

  if (game.type === "charades") {
    return (
      <div className="flex flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-muted hover:bg-muted/80"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-sunny fill-sunny" />
            <span className="font-bold text-lg">{score}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          {gameWords.map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-2 rounded-full",
                i < currentWordIndex
                  ? "bg-mint"
                  : i === currentWordIndex
                    ? "bg-primary"
                    : "bg-muted",
              )}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-card rounded-3xl p-8 text-center space-y-6 border-4 border-primary/20">
          {showAction ? (
            <>
              <div className="flex items-center justify-center gap-2 text-primary">
                <Sparkles className="w-6 h-6" />
                <h3 className="text-lg font-bold">Act It Out!</h3>
              </div>

              <div className="space-y-4">
                <div className="text-7xl">
                  {currentWord.category === "Animals" && "🦁"}
                  {currentWord.category === "Food" && "🍎"}
                  {currentWord.category === "Nature" && "🌈"}
                </div>

                <button
                  onClick={() => playWord(currentWord.word)}
                  className="text-4xl font-bold text-foreground hover:text-primary transition-colors flex items-center gap-3 mx-auto"
                >
                  {currentWord.word}
                  <Volume2 className="w-8 h-8" />
                </button>

                <div className="bg-sunny/20 border-2 border-sunny/40 rounded-2xl p-6 mt-6">
                  <p className="text-2xl font-medium text-foreground">
                    {currentWord.physicalAction}
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  onClick={handleActionComplete}
                  size="lg"
                  className="text-xl px-8 py-6"
                >
                  I Did It! 🎉
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                💡 Show a grown-up how you're acting it out!
              </p>
            </>
          ) : (
            <div className="space-y-4 animate-in zoom-in duration-300">
              <div className="text-7xl">🎉</div>
              <h3 className="text-3xl font-bold text-mint">Great Job!</h3>
              <div className="flex items-center justify-center gap-2 text-xl">
                <Check className="w-6 h-6 text-mint" />
                <span>+10 points</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (game.type === "actions") {
    return (
      <div className="flex flex-col gap-4 p-4">
        {/* Similar layout but for movement sequences */}
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 rounded-full bg-muted">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-sunny fill-sunny" />
            <span className="font-bold text-lg">{score}</span>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-8 text-center space-y-6">
          <h2 className="text-2xl font-bold">Move & Learn!</h2>
          <p className="text-lg text-muted-foreground">
            Do the action for each word you hear!
          </p>
          {/* Game implementation */}
        </div>
      </div>
    );
  }

  if (game.type === "scavenger") {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 rounded-full bg-muted">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold">Word Hunt!</h2>
        </div>

        <div className="bg-card rounded-3xl p-6 space-y-4">
          <div className="text-6xl text-center">🏃</div>
          <h3 className="text-2xl font-bold text-center">Find These Things:</h3>

          <div className="space-y-3">
            {gameWords.map((word, index) => (
              <div
                key={word.id}
                className="flex items-center gap-4 p-4 bg-muted rounded-2xl"
              >
                <span className="text-3xl">
                  {word.category === "Animals" && "🦁"}
                  {word.category === "Food" && "🍎"}
                  {word.category === "Nature" && "🌳"}
                </span>
                <span className="text-xl font-bold flex-1">{word.word}</span>
                <button
                  onClick={() => playWord(word.word)}
                  className="p-2 bg-primary/20 rounded-full"
                >
                  <Volume2 className="w-5 h-5 text-primary" />
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-muted-foreground">
            🏠 Look around your house or outside!
          </p>
        </div>
      </div>
    );
  }

  return null;
}
