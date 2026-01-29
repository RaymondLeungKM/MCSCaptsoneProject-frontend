"use client";

import { useState } from "react";
import { Search, Filter, Check, Clock, Star, Volume2 } from "lucide-react";
import type { ProgressStats, Word } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useSpeech } from "@/lib/speech";

interface ProgressTabProps {
  stats: ProgressStats;
  words: Word[];
}

export function ProgressTab({ stats, words }: ProgressTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "mastered" | "learning">("all");
  const { speak } = useSpeech();

  const filteredWords = words.filter((word) => {
    const matchesSearch = word.word
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "mastered" && word.mastered) ||
      (filter === "learning" && !word.mastered);
    return matchesSearch && matchesFilter;
  });

  const playWord = (wordText: string) => {
    speak(wordText, {
      rate: 0.7,
      pitch: 1.2,
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-2">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">
              {stats.totalWords}
            </p>
            <p className="text-sm text-muted-foreground">Total Words</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-mint/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-mint">
              {stats.masteredWords}
            </p>
            <p className="text-sm text-muted-foreground">Mastered</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-sunny/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-sunny">
              {stats.totalWords - stats.masteredWords}
            </p>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Word List */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg">Word Library</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "mastered", "learning"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredWords.map((word) => (
              <div
                key={word.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 transition-colors",
                  word.mastered ? "border-mint/30 bg-mint/5" : "border-border",
                )}
              >
                {/* Status Icon */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    word.mastered ? "bg-mint" : "bg-sunny/30",
                  )}
                >
                  {word.mastered ? (
                    <Check className="w-5 h-5 text-card" />
                  ) : (
                    <Clock className="w-5 h-5 text-sunny" />
                  )}
                </div>

                {/* Word Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground">{word.word}</h3>
                    <button
                      onClick={() => playWord(word.word)}
                      className="p-1 rounded-full hover:bg-muted transition-colors"
                      aria-label={`Listen to ${word.word}`}
                    >
                      <Volume2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {word.categoryName}
                  </p>
                </div>

                {/* Progress */}
                <div className="flex flex-col items-end gap-1">
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
                  <span className="text-xs text-muted-foreground">
                    {word.exposureCount}/6 exposures
                  </span>
                </div>
              </div>
            ))}

            {filteredWords.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No words found matching your search.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Learning Tips */}
      <Card className="border-2 border-sky/30 bg-sky/5">
        <CardContent className="p-4">
          <h3 className="font-bold text-foreground mb-2">Learning Tip</h3>
          <p className="text-sm text-muted-foreground">
            Children typically need 6-12 exposures to a word in different
            contexts before it becomes part of their permanent vocabulary. Keep
            practicing with the words that have fewer stars!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
