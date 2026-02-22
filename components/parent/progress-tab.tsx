"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Volume2,
  CheckCircle,
  Clock,
  Star,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import type { ProgressStats, Word } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSpeech } from "@/lib/speech";
import { getWordsWithProgress, toWord } from "@/lib/api/vocabulary";
import { getProgressStats } from "@/lib/api/progress";
import { getAuthToken } from "@/lib/api/client";

interface ProgressTabProps {
  childId: string;
  stats: ProgressStats;
  words: Word[];
}

export function ProgressTab({ childId, stats, words }: ProgressTabProps) {
  const [realWords, setRealWords] = useState<Word[]>(words);
  const [realStats, setRealStats] = useState<ProgressStats>(stats);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "mastered" | "learning">("all");
  const { speak } = useSpeech();

  // Check if we have a real child ID (not mock)
  const isMockData =
    !childId ||
    childId === "1" ||
    childId === "mock-child-id" ||
    childId.length < 10;

  // Fetch real data if we have a real child ID
  useEffect(() => {
    async function loadRealData() {
      if (isMockData) {
        setLoading(false);
        return;
      }

      try {
        const token = getAuthToken();
        if (!token) {
          console.log("No auth token, using mock data");
          setLoading(false);
          return;
        }

        // Fetch words and progress stats in parallel
        const [wordsData, progressStats] = await Promise.allSettled([
          getWordsWithProgress(childId),
          getProgressStats(childId),
        ]);

        // Process words
        const loadedWords =
          wordsData.status === "fulfilled"
            ? wordsData.value.map((w) => toWord(w, w.progress))
            : [];

        const totalWords = loadedWords.length;
        const masteredWords = loadedWords.filter((w) => w.mastered).length;

        setRealWords(loadedWords);

        // Merge real progress stats if available, else derive from words
        if (progressStats.status === "fulfilled") {
          const ps = progressStats.value;
          setRealStats({
            totalWords: ps.total_words || totalWords,
            masteredWords: ps.mastered_words || masteredWords,
            weeklyProgress: ps.weekly_progress || [],
            streakDays: ps.streak_days || 0,
            categoryProgress: (ps.category_progress || []).map((cp) => ({
              category: cp.category,
              progress: cp.progress,
            })),
            averageExposuresPerWord: ps.average_exposures_per_word || 0,
            activeVocabulary: ps.active_vocabulary || 0,
            passiveVocabulary: ps.passive_vocabulary || 0,
            multiSensoryEngagement: ps.multi_sensory_engagement || 0,
          });
          console.log(
            `[Progress] Stats loaded: ${ps.total_words} words, streak ${ps.streak_days}`,
          );
        } else {
          setRealStats({
            totalWords,
            masteredWords,
            weeklyProgress: [],
            streakDays: 0,
            categoryProgress: [],
            averageExposuresPerWord: 0,
            activeVocabulary: 0,
            passiveVocabulary: 0,
            multiSensoryEngagement: 0,
          });
          console.log(`[Progress] Derived stats from ${totalWords} words`);
        }
      } catch (error) {
        console.error("Failed to load word progress:", error);
      } finally {
        setLoading(false);
      }
    }

    loadRealData();
  }, [childId, isMockData]);

  // Filter Logic
  const filteredWords = realWords.filter((word) => {
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
      rate: 0.8, // Slightly slower for kids
      pitch: 1.1, // Slightly higher pitch
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-[32px]" />
          <Skeleton className="h-32 rounded-[32px]" />
          <Skeleton className="h-32 rounded-[32px]" />
        </div>
        <Skeleton className="h-96 rounded-[32px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-zen">
      {/* 1. TOP SUMMARY CARDS (Cozy Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Words */}
        <Card className="rounded-[32px] border-none bg-white shadow-sm border-2 border-gray-100">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <span className="text-5xl font-black text-[#546E7A] mb-1">
              {realStats.totalWords}
            </span>
            <span className="text-sm font-bold text-[#90A4AE] uppercase tracking-widest">
              詞彙總量 (Total)
            </span>
          </CardContent>
        </Card>

        {/* Mastered */}
        <Card className="rounded-[32px] border-none bg-[#E8F5E9] shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <span className="text-5xl font-black text-[#66BB6A] mb-1">
              {realStats.masteredWords}
            </span>
            <span className="text-sm font-bold text-[#81C784] uppercase tracking-widest">
              已掌握 (Mastered)
            </span>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="rounded-[32px] border-none bg-[#FFF3E0] shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <span className="text-5xl font-black text-[#FF9800] mb-1">
              {realStats.totalWords - realStats.masteredWords}
            </span>
            <span className="text-sm font-bold text-[#FFB74D] uppercase tracking-widest">
              學習中 (Learning)
            </span>
          </CardContent>
        </Card>
      </div>

      {/* 2. WORD LIBRARY SECTION */}
      <Card className="rounded-[32px] border-2 border-gray-100 shadow-sm bg-white">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-xl font-black text-gray-700 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#29B6F6]" />
              生字庫 (Word Library)
            </h3>

            {/* SEARCH BAR */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜尋生字..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-12 rounded-full bg-[#F5F7F8] border-none font-bold text-gray-600 focus-visible:ring-2 focus-visible:ring-[#29B6F6]"
              />
            </div>
          </div>

          {/* FILTER BUTTONS */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: "all", label: "全部 (All)" },
              { id: "mastered", label: "已掌握 (Mastered)" },
              { id: "learning", label: "學習中 (Learning)" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-black transition-all whitespace-nowrap",
                  filter === f.id
                    ? "bg-[#29B6F6] text-white shadow-md transform -translate-y-[1px]"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 3. WORD LIST */}
          <div className="space-y-3">
            {filteredWords.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 font-bold">
                  找不到相關生字 (No words found)
                </p>
              </div>
            ) : (
              filteredWords.map((word) => (
                <div
                  key={word.id}
                  className={cn(
                    "group flex items-center justify-between p-4 rounded-[24px] border-2 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.03)]",
                    word.mastered
                      ? "border-transparent bg-white hover:border-[#E8F5E9]"
                      : "border-transparent bg-white hover:border-[#FFF3E0]",
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                        word.mastered ? "bg-[#E8F5E9]" : "bg-[#FFF3E0]",
                      )}
                    >
                      {word.mastered ? (
                        <CheckCircle className="w-6 h-6 text-[#66BB6A]" />
                      ) : (
                        <Clock className="w-6 h-6 text-[#FF9800]" />
                      )}
                    </div>

                    {/* Word Info */}
                    <div>
                      <h4 className="text-lg font-black text-gray-700 flex items-center gap-2">
                        {word.word}
                        <button
                          onClick={() => playWord(word.word)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-gray-100 text-[#29B6F6]"
                          aria-label={`Listen to ${word.word}`}
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                      </h4>
                      <p className="text-xs font-bold text-gray-400 uppercase">
                        {word.categoryName || "一般"}
                      </p>
                    </div>
                  </div>

                  {/* Progress Stars */}
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "w-3 h-3",
                            star <= (word.exposureCount || 0)
                              ? "text-[#FFCA28] fill-[#FFCA28]" // Yellow filled stars
                              : "text-gray-200",
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-gray-300">
                      {word.exposureCount}/6 次練習
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. LEARNING TIP CARD */}
      <Card className="rounded-[24px] border-none bg-[#E3F2FD] shadow-sm">
        <CardContent className="p-5 flex gap-4 items-start">
          <div className="bg-white p-2 rounded-full shadow-sm flex-shrink-0">
            <Lightbulb className="w-6 h-6 text-[#29B6F6]" />
          </div>
          <div>
            <h3 className="font-black text-[#1565C0] mb-1">
              學習小貼士 (Learning Tip)
            </h3>
            <p className="text-sm font-bold text-[#546E7A] leading-relaxed">
              小朋友通常需要係唔同情況下接觸一個生字 6 到 12
              次，先至會真正入腦。
              <br />
              建議多啲練習星星比較少嘅生字啦！
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
