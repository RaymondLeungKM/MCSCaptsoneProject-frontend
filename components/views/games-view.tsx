"use client";

import { useState } from "react";
import { ArrowLeft, Star, Check, X, Volume2 } from "lucide-react";
import type { Game, Word } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/child/game-card";
import { useSpeech } from "@/lib/speech";

interface GamesViewProps {
  games: Game[];
  words: Word[];
}

export function GamesView({ games, words }: GamesViewProps) {
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [gameState, setGameState] = useState<"playing" | "correct" | "wrong">(
    "playing",
  );
  const [score, setScore] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const { speak } = useSpeech();

  const gameWords = words.slice(0, 4);
  const currentWord = gameWords[currentWordIndex];

  const handlePlayGame = (game: Game) => {
    setActiveGame(game);
    setGameState("playing");
    setScore(0);
    setCurrentWordIndex(0);
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setGameState("correct");
      setScore((s) => s + 10);
    } else {
      setGameState("wrong");
    }

    setTimeout(() => {
      if (currentWordIndex < gameWords.length - 1) {
        setCurrentWordIndex((i) => i + 1);
        setGameState("playing");
      } else {
        // Game complete
        setActiveGame(null);
      }
    }, 1500);
  };

  const playWord = (word: string) => {
    speak(word, {
      rate: 0.7,
      pitch: 1.2,
    });
  };

  if (activeGame?.type === "matching") {
    // Shuffle options for matching game
    const options = [...gameWords].sort(() => Math.random() - 0.5).slice(0, 4);

    return (
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveGame(null)}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label="Go back"
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

        {/* Question */}
        <div
          className={cn(
            "bg-card rounded-3xl p-6 text-center border-4 transition-all",
            gameState === "correct" && "border-mint bg-mint/10",
            gameState === "wrong" && "border-destructive bg-destructive/10",
            gameState === "playing" && "border-primary/20",
          )}
        >
          {gameState === "correct" && (
            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="w-16 h-16 rounded-full bg-mint flex items-center justify-center">
                <Check className="w-8 h-8 text-card" />
              </div>
              <p className="text-xl font-bold text-mint">Great Job!</p>
            </div>
          )}
          {gameState === "wrong" && (
            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                <X className="w-8 h-8 text-destructive-foreground" />
              </div>
              <p className="text-xl font-bold text-destructive">Try Again!</p>
            </div>
          )}
          {gameState === "playing" && (
            <>
              <p className="text-lg text-muted-foreground mb-4">
                Find the picture for:
              </p>
              <div className="flex items-center justify-center gap-3">
                <h2 className="text-3xl font-bold text-foreground">
                  {currentWord.word}
                </h2>
                <button
                  onClick={() => playWord(currentWord.word)}
                  className="p-2 rounded-full bg-primary/10 hover:bg-primary/20"
                  aria-label="Listen to word"
                >
                  <Volume2 className="w-5 h-5 text-primary" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Options */}
        {gameState === "playing" && (
          <div className="grid grid-cols-2 gap-3">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option.id === currentWord.id)}
                className={cn(
                  "flex flex-col items-center p-4 rounded-2xl",
                  "bg-card border-4 border-primary/20 shadow-md",
                  "transition-all duration-200 hover:scale-105 active:scale-95",
                  "hover:border-primary/40",
                )}
              >
                <span className="text-5xl mb-2">
                  {option.category === "Animals" && "🦁"}
                  {option.category === "Food" && "🍎"}
                  {option.category === "Nature" && "🌳"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeGame?.type === "pronunciation") {
    return (
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveGame(null)}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-sunny fill-sunny" />
            <span className="font-bold text-lg">{score}</span>
          </div>
        </div>

        {/* Word to pronounce */}
        <div className="bg-card rounded-3xl p-8 text-center border-4 border-sky/50">
          <p className="text-lg text-muted-foreground mb-4">Say this word:</p>
          <span className="text-6xl mb-4 block">
            {currentWord.category === "Animals" && "🦁"}
            {currentWord.category === "Food" && "🍎"}
            {currentWord.category === "Nature" && "🌳"}
          </span>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {currentWord.word}
          </h2>
          <p className="text-muted-foreground font-mono">
            /{currentWord.pronunciation}/
          </p>

          <button
            onClick={() => playWord(currentWord.word)}
            className="mt-6 px-6 py-3 rounded-2xl bg-sky text-foreground font-bold flex items-center gap-2 mx-auto"
          >
            <Volume2 className="w-5 h-5" />
            Hear It
          </button>
        </div>

        <Button
          onClick={() => handleAnswer(true)}
          className="w-full h-14 text-lg font-bold rounded-2xl bg-mint hover:bg-mint/90 text-foreground"
        >
          I Said It! ✓
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-3xl">🎮</span>
        <h1 className="text-2xl font-bold text-foreground">Fun Games</h1>
      </div>

      <p className="text-muted-foreground">
        Play games to practice your words!
      </p>

      <div className="flex flex-col gap-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} onPlay={handlePlayGame} />
        ))}
      </div>
    </div>
  );
}
