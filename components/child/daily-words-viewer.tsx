"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getDailyWords } from "@/lib/api/bedtime-stories";
import type { DailyWordSummary, LanguagePreference } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DailyWordsViewerProps {
  childId: string;
  childName: string;
  languagePreference: LanguagePreference;
}

export function DailyWordsViewer({
  childId,
  childName,
  languagePreference,
}: DailyWordsViewerProps) {
  const [words, setWords] = useState<DailyWordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadDailyWords();
  }, [childId]);

  const loadDailyWords = async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedWords = await getDailyWords(childId);
      setWords(fetchedWords);
    } catch (err: any) {
      console.error("Error loading daily words:", err);
      setError(
        languagePreference === "english"
          ? "Failed to load today's words"
          : "無法載入今日詞語",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
          <Button
            onClick={loadDailyWords}
            variant="outline"
            size="sm"
            className="ml-2"
          >
            {languagePreference === "english" ? "Retry" : "重試"}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (words.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-2 border-yellow-200">
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <Sparkles className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
            <p className="text-gray-600 font-medium">
              {languagePreference === "english"
                ? "No words learned today yet"
                : "今天還未學習新詞語"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {languagePreference === "english"
                ? "Start learning to generate stories!"
                : "開始學習來生成故事！"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayWords = isExpanded ? words : words.slice(0, 3);

  return (
    <Card className="bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 dark:from-yellow-950 dark:via-orange-950 dark:to-pink-950 border-2 border-yellow-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            {languagePreference === "english" ? "Today's Learning" : "今日學習"}
          </CardTitle>
          <Badge variant="secondary" className="bg-yellow-600 text-white">
            {words.length}{" "}
            {languagePreference === "english"
              ? words.length === 1
                ? "word"
                : "words"
              : "個詞語"}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {languagePreference === "english"
            ? "These words will be featured in your bedtime story!"
            : "這些詞語將會出現在你的睡前故事中！"}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {displayWords.map((word, index) => (
          <div
            key={word.word_id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur",
              "border-2 border-yellow-200 hover:border-yellow-300 transition-colors",
            )}
          >
            {/* Priority Indicator */}
            <div className="flex-shrink-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                  word.story_priority >= 8
                    ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                    : word.story_priority >= 5
                      ? "bg-gradient-to-br from-orange-400 to-pink-500 text-white"
                      : "bg-gradient-to-br from-pink-400 to-purple-500 text-white",
                )}
              >
                {index + 1}
              </div>
            </div>

            {/* Word Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-lg text-gray-800 dark:text-gray-100">
                  {languagePreference === "english"
                    ? word.word
                    : word.word_cantonese || word.word}
                </span>
                {word.jyutping && languagePreference !== "english" && (
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {word.jyutping}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                {languagePreference === "english"
                  ? word.definition_cantonese
                  : word.definition_cantonese}
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <TrendingUp className="w-3 h-3" />
                <span>{word.exposure_count}x</span>
              </div>
              {word.story_priority >= 7 && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              )}
            </div>
          </div>
        ))}

        {/* Expand/Collapse Button */}
        {words.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                {languagePreference === "english" ? "Show less" : "顯示較少"}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                {languagePreference === "english"
                  ? `Show all ${words.length} words`
                  : `顯示全部 ${words.length} 個詞語`}
              </>
            )}
          </Button>
        )}

        {/* Summary Info */}
        <div className="pt-3 border-t border-yellow-200 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-gray-500">
              {languagePreference === "english" ? "High Priority" : "高優先"}
            </div>
            <div className="text-lg font-bold text-yellow-600">
              {words.filter((w) => w.story_priority >= 7).length}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">
              {languagePreference === "english" ? "Avg Exposure" : "平均次數"}
            </div>
            <div className="text-lg font-bold text-orange-600">
              {(
                words.reduce((sum, w) => sum + w.exposure_count, 0) /
                words.length
              ).toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">
              {languagePreference === "english" ? "Active Use" : "主動使用"}
            </div>
            <div className="text-lg font-bold text-pink-600">
              {words.filter((w) => w.used_actively).length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
