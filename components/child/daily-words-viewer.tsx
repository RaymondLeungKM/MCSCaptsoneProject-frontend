"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  Star,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Trophy,
  Zap,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { AISentences } from "@/components/child/ai-sentences"; // Import AI Sentences
import { getWords, getWordsWithProgress } from "@/lib/api";
import type { LanguagePreference, Word } from "@/lib/types";
import { useWordAudio } from "@/hooks/use-word-audio";
import { WordDetailModal } from "@/components/modals/word-detail-modal";

// --- TYPES ---
export interface DailyWordSummary {
  word_id: string;
  word: string;
  word_cantonese?: string;
  jyutping?: string;
  definition_cantonese?: string;
  exposure_count: number;
  story_priority: number;
  used_actively: boolean;
  last_practiced?: string;
}

interface DailyWordsViewerProps {
  childId?: string;
  childName?: string;
  languagePreference?: LanguagePreference;
  onWordLearned?: () => void;
}

export function DailyWordsViewer({
  childId = "1",
  childName = "Emma",
  languagePreference = "bilingual",
  onWordLearned,
}: DailyWordsViewerProps) {
  const { playWord, isLoading, isPlaying } = useWordAudio();
  const [words, setWords] = useState<DailyWordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [modalWord, setModalWord] = useState<Word | null>(null);

  // Build a full Word object from a DailyWordSummary for use in the modal
  const buildWord = (summary: DailyWordSummary): Word => ({
    id: summary.word_id,
    word: summary.word,
    word_cantonese: summary.word_cantonese,
    jyutping: summary.jyutping,
    image: "",
    category: "",
    pronunciation: summary.jyutping || "",
    definition: summary.definition_cantonese || "",
    definition_cantonese: summary.definition_cantonese,
    example: summary.word_cantonese || summary.word,
    example_cantonese: summary.word_cantonese,
    difficulty: "easy",
    mastered: summary.used_actively,
    exposureCount: summary.exposure_count,
    contexts: [],
    relatedWords: [],
  });

  useEffect(() => {
    loadDailyWords();
  }, [childId]);

  const loadDailyWords = async () => {
    setLoading(true);
    setError(null);

    try {
      let dailyWords: DailyWordSummary[] = [];

      if (childId && childId !== "1") {
        const wordsWithProgress = await getWordsWithProgress(childId);
        dailyWords = wordsWithProgress
          .map((item: any) => {
            const progress = item.progress;
            const exposureCount = progress?.exposure_count ?? 0;
            const successRate = progress?.success_rate ?? 0;

            return {
              word_id: item.id,
              word: item.word,
              word_cantonese: item.word_cantonese,
              jyutping: item.jyutping,
              definition_cantonese:
                item.definition_cantonese || item.definition,
              exposure_count: exposureCount,
              used_actively: exposureCount >= 6 || successRate >= 0.7,
              story_priority: Math.max(
                1,
                Math.min(10, Math.round(10 - Math.min(exposureCount, 9))),
              ),
              last_practiced: progress?.last_practiced,
            };
          })
          .sort((a, b) => b.story_priority - a.story_priority)
          .slice(0, 8);
      }

      if (!dailyWords.length) {
        const fallbackWords = await getWords({ limit: 8 });
        dailyWords = fallbackWords.map((item) => ({
          word_id: item.id,
          word: item.word,
          word_cantonese: item.word_cantonese,
          jyutping: item.jyutping,
          definition_cantonese: item.definition_cantonese || item.definition,
          exposure_count: item.total_exposures || 0,
          used_actively: (item.success_rate || 0) >= 0.7,
          story_priority: Math.max(
            1,
            Math.min(10, Math.round((item.success_rate || 0) * 10 || 5)),
          ),
        }));
      }

      setWords(dailyWords);
      if (dailyWords.length > 0) {
        setSelectedWordId(dailyWords[0].word_id);
      }
    } catch (err) {
      console.error("Error loading daily words:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("載入每日詞語失敗，請稍後再試。");
      }
      setWords([]);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Card className="bg-white/80 backdrop-blur-md rounded-4xl border-none shadow-sm p-6">
        <Alert variant="destructive" className="rounded-2xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button
            onClick={() => void loadDailyWords()}
            variant="outline"
            className="rounded-full"
          >
            重新載入
          </Button>
        </div>
      </Card>
    );
  }

  if (!loading && words.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-md rounded-4xl border-none shadow-sm p-6">
        <Alert className="rounded-2xl border-slate-200 bg-slate-50 text-slate-700">
          <AlertDescription>
            {languagePreference === "english"
              ? "No daily words available yet. Start a learning session to generate recommendations."
              : "暫時未有今日詞語，開始學習後會自動產生建議。"}
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md rounded-4xl border-none shadow-sm p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
        </div>
      </Card>
    );
  }

  const displayWords = isExpanded ? words : words.slice(0, 3);
  const activeWord =
    words.find((w) => w.word_id === selectedWordId) || words[0];

  const handlePlayWord = (word: DailyWordSummary) => {
    const playableWord: Word = {
      id: word.word_id,
      word: word.word,
      word_cantonese: word.word_cantonese,
      jyutping: word.jyutping,
      image: "",
      category: "",
      pronunciation: word.jyutping || "",
      definition: word.definition_cantonese || "",
      definition_cantonese: word.definition_cantonese,
      example: word.word,
      example_cantonese: word.word_cantonese,
      difficulty: "easy",
      mastered: word.used_actively,
      exposureCount: word.exposure_count,
      contexts: [],
      relatedWords: [],
    };

    void playWord(playableWord, {
      languagePreference,
      speechRate: 0.8,
    });
  };

  return (
    <>
      <WordDetailModal
        word={modalWord}
        onClose={() => setModalWord(null)}
        languagePreference={languagePreference}
        childId={childId !== "1" ? childId : undefined}
        onProgressUpdate={(wordId, mastered, exposureCount) => {
          // Update the local word list optimistically
          setWords((prev) =>
            prev.map((w) =>
              w.word_id === wordId
                ? {
                    ...w,
                    used_actively: mastered || w.used_actively,
                    exposure_count: exposureCount,
                  }
                : w,
            ),
          );
          // Notify parent so ProfileHeader re-fetches (today_progress + mastered count)
          onWordLearned?.();
        }}
      />
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Main Container Card */}
        <Card className="bg-white/80 backdrop-blur-md rounded-[40px] border-4 border-white shadow-sm overflow-hidden">
          {/* Header Section */}
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-2xl font-black text-slate-700 tracking-tight">
                <span className="bg-yellow-400 text-white p-2 rounded-2xl shadow-sm">
                  <Sparkles className="w-6 h-6 fill-white" />
                </span>
                {languagePreference === "english"
                  ? "Today's Learning"
                  : "今日學習"}
              </CardTitle>
              <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none px-4 py-1.5 text-sm font-bold rounded-full">
                {words.length}{" "}
                {languagePreference === "english"
                  ? words.length === 1
                    ? "word"
                    : "words"
                  : "個詞語"}
              </Badge>
            </div>
            <p className="text-slate-500 font-medium ml-12 mt-1">
              {languagePreference === "english"
                ? "These words will appear in your bedtime story!"
                : "這些詞語將會出現在你的睡前故事中！"}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Word List */}
            <div className="grid gap-3">
              {displayWords.map((word, index) => (
                <div
                  key={word.word_id}
                  onClick={() => {
                    setSelectedWordId(word.word_id);
                    setModalWord(buildWord(word));
                  }}
                  className={cn(
                    "relative group cursor-pointer transition-all duration-300",
                    "flex items-center gap-4 p-4 rounded-3xl",
                    selectedWordId === word.word_id
                      ? "bg-yellow-50 border-2 border-yellow-400 shadow-md scale-[1.02]"
                      : "bg-white border-2 border-slate-100 hover:border-yellow-200 hover:shadow-sm",
                  )}
                >
                  {/* Priority / Number Badge */}
                  <div className="shrink-0">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm transition-transform group-hover:scale-110",
                        word.story_priority >= 8
                          ? "bg-linear-to-br from-yellow-400 to-orange-400 text-white"
                          : word.story_priority >= 5
                            ? "bg-linear-to-br from-blue-400 to-cyan-400 text-white"
                            : "bg-linear-to-br from-slate-200 to-slate-300 text-slate-500",
                      )}
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* Word Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-xl text-slate-700">
                        {word.word}
                      </span>
                      {languagePreference !== "english" && (
                        <>
                          <span className="text-lg font-bold text-slate-600">
                            {word.word_cantonese}
                          </span>
                          {word.jyutping && (
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                              {word.jyutping}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-400 mt-1 line-clamp-1">
                      {word.definition_cantonese}
                    </p>
                  </div>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handlePlayWord(word);
                    }}
                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                    aria-label={`Listen to ${word.word}`}
                  >
                    <Volume2
                      className={cn(
                        "w-4 h-4 text-slate-500",
                        (isPlaying || isLoading) && "animate-pulse",
                      )}
                    />
                  </button>

                  {/* Stats Icons (Subtle) */}
                  <div className="flex flex-col items-end gap-1 shrink-0 opacity-70">
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span>{word.exposure_count}x</span>
                    </div>
                    {word.used_actively && (
                      <div className="flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-50 px-2 py-1 rounded-full">
                        <Zap className="w-3 h-3 fill-orange-400" />
                        <span>Active</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Expand Button */}
            {words.length > 3 && (
              <Button
                variant="ghost"
                className="w-full rounded-full hover:bg-slate-100 text-slate-400 font-bold"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <div className="flex items-center gap-2">
                    <ChevronUp className="w-4 h-4" /> 收起
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4" /> 顯示全部 ({words.length}
                    )
                  </div>
                )}
              </Button>
            )}

            {/* Summary Stats Footer */}
            <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-100 grid grid-cols-3 gap-4">
              <StatBox
                icon={
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                }
                label="高優先級"
                value={words.filter((w) => w.story_priority >= 7).length}
                color="bg-yellow-50 text-yellow-700"
              />
              <StatBox
                icon={<BookOpen className="w-4 h-4 text-blue-500" />}
                label="平均練習"
                value={(
                  words.reduce((sum, w) => sum + w.exposure_count, 0) /
                    words.length || 0
                ).toFixed(1)}
                color="bg-blue-50 text-blue-700"
              />
              <StatBox
                icon={<Trophy className="w-4 h-4 text-orange-500" />}
                label="已掌握"
                value={words.filter((w) => w.used_actively).length}
                color="bg-orange-50 text-orange-700"
              />
            </div>
          </CardContent>
        </Card>

        {/* --- AI SENTENCES INTEGRATION --- */}
        {/* This updates dynamically when you click a word above */}
        {activeWord && (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
            <AISentences
              wordId={activeWord.word_id}
              languagePreference={languagePreference}
            />
          </div>
        )}
      </div>
    </>
  );
}

// Helper Component for the bottom stats
function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-3 rounded-2xl",
        color,
      )}
    >
      <div className="mb-1 opacity-80">{icon}</div>
      <div className="text-xl font-black leading-none mb-1">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wide opacity-70">
        {label}
      </div>
    </div>
  );
}
