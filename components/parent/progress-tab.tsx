"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle,
  Clock,
  FolderKanban,
  Lightbulb,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Volume2,
} from "lucide-react";
import type { ProgressStats, Word } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useSpeech } from "@/lib/speech";
import { getWordsWithProgress, toWord } from "@/lib/api/vocabulary";
import { getProgressStats } from "@/lib/api/progress";
import { getAuthToken } from "@/lib/api/client";

const EXPOSURE_TARGET = 6;

const CATEGORY_TRANSLATIONS: Record<string, string> = {
  Animals: "動物",
  Food: "食物",
  Colors: "顏色",
  Nature: "大自然",
  Vehicles: "交通工具",
  Family: "家庭",
  Numbers: "數字",
  Body: "身體部位",
  Actions: "動作",
};

const FILTER_OPTIONS = [
  { id: "all", label: "全部" },
  { id: "learning", label: "學習中" },
  { id: "mastered", label: "已掌握" },
] as const;

const VIEW_OPTIONS = [
  { id: "focus", label: "重點整理", icon: Sparkles },
  { id: "categories", label: "按主題", icon: FolderKanban },
  { id: "allWords", label: "全部詞語", icon: BookOpen },
] as const;

type WordFilter = (typeof FILTER_OPTIONS)[number]["id"];
type ProgressView = (typeof VIEW_OPTIONS)[number]["id"];

interface ProgressTabProps {
  childId: string;
  stats: ProgressStats;
  words: Word[];
}

interface CategorySummary {
  key: string;
  label: string;
  progress: number;
  total: number;
  mastered: number;
  needsPracticeCount: number;
  words: Word[];
  learningWords: Word[];
}

function getTranslatedCategory(category: string) {
  return CATEGORY_TRANSLATIONS[category] || category;
}

function getWordLabel(word: Word) {
  return word.word_cantonese || word.word;
}

function getWordCategoryLabel(word: Word) {
  return (
    word.category_name_cantonese ||
    word.categoryName ||
    getTranslatedCategory(word.category) ||
    "一般"
  );
}

function sortWordsForDisplay(words: Word[]) {
  return [...words].sort((left, right) => {
    if (left.mastered !== right.mastered) {
      return Number(left.mastered) - Number(right.mastered);
    }

    const leftExposure = left.exposureCount || 0;
    const rightExposure = right.exposureCount || 0;

    if (!left.mastered && leftExposure !== rightExposure) {
      return leftExposure - rightExposure;
    }

    if (left.mastered && leftExposure !== rightExposure) {
      return rightExposure - leftExposure;
    }

    return getWordLabel(left).localeCompare(getWordLabel(right), "zh-HK");
  });
}

function getProgressTone(progress: number) {
  if (progress >= 80) {
    return {
      label: "表現穩定",
      pill: "bg-[#E8F5E9] text-[#2E7D32]",
      bar: "bg-[#66BB6A]",
    };
  }

  if (progress >= 40) {
    return {
      label: "持續累積",
      pill: "bg-[#FFF8E1] text-[#F9A825]",
      bar: "bg-[#FFCA28]",
    };
  }

  return {
    label: "建議優先複習",
    pill: "bg-[#FFF3E0] text-[#EF6C00]",
    bar: "bg-[#FFB74D]",
  };
}

function buildCategorySummaries(
  words: Word[],
  categoryProgress: ProgressStats["categoryProgress"],
  useStatsCounts: boolean,
) {
  const statsByCategory = new Map(
    categoryProgress.map((item) => [item.category, item]),
  );
  const groupedWords = new Map<string, Word[]>();

  for (const word of words) {
    const key = word.category || word.categoryName || "general";
    const existing = groupedWords.get(key);

    if (existing) {
      existing.push(word);
    } else {
      groupedWords.set(key, [word]);
    }
  }

  if (groupedWords.size === 0 && useStatsCounts) {
    return categoryProgress
      .map((item) => ({
        key: item.category,
        label: getTranslatedCategory(item.category),
        progress: item.progress,
        total: item.total ?? 0,
        mastered: item.mastered ?? 0,
        needsPracticeCount: Math.max(
          (item.total ?? 0) - (item.mastered ?? 0),
          0,
        ),
        words: [],
        learningWords: [],
      }))
      .sort((left, right) => {
        if (left.progress !== right.progress) {
          return right.progress - left.progress;
        }

        return right.total - left.total;
      });
  }

  return Array.from(groupedWords.entries())
    .map(([key, categoryWords]) => {
      const sortedWords = sortWordsForDisplay(categoryWords);
      const derivedMastered = sortedWords.filter(
        (word) => word.mastered,
      ).length;
      const stat = statsByCategory.get(key);
      const total = useStatsCounts
        ? (stat?.total ?? sortedWords.length)
        : sortedWords.length;
      const mastered = useStatsCounts
        ? (stat?.mastered ?? derivedMastered)
        : derivedMastered;
      const progress =
        useStatsCounts && stat
          ? stat.progress
          : total > 0
            ? Math.round((mastered / total) * 100)
            : 0;
      const learningWords = sortedWords.filter((word) => !word.mastered);

      return {
        key,
        label:
          sortedWords[0] !== undefined
            ? getWordCategoryLabel(sortedWords[0])
            : getTranslatedCategory(key),
        progress,
        total,
        mastered,
        needsPracticeCount: learningWords.filter(
          (word) => (word.exposureCount || 0) < 3,
        ).length,
        words: sortedWords,
        learningWords,
      };
    })
    .sort((left, right) => {
      if (left.progress !== right.progress) {
        return right.progress - left.progress;
      }

      return right.total - left.total;
    });
}

function SummaryMetricCard({
  value,
  label,
  detail,
  className,
  valueClassName,
}: {
  value: string | number;
  label: string;
  detail: string;
  className: string;
  valueClassName: string;
}) {
  return (
    <Card className={cn("rounded-[28px] border-none shadow-sm", className)}>
      <CardContent className="space-y-3 p-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-400">
          {label}
        </p>
        <div className="space-y-1">
          <p className={cn("text-4xl font-black", valueClassName)}>{value}</p>
          <p className="text-sm font-bold text-gray-500">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function WordListItem({
  word,
  onPlay,
  compact = false,
}: {
  word: Word;
  onPlay: (wordText: string) => void;
  compact?: boolean;
}) {
  const exposureCount = word.exposureCount || 0;

  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-3 rounded-3xl border-2 bg-white transition-all shadow-[0_2px_10px_rgba(0,0,0,0.03)]",
        compact ? "p-3" : "p-4",
        word.mastered
          ? "border-transparent hover:border-[#E8F5E9]"
          : "border-transparent hover:border-[#FFF3E0]",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full",
            compact ? "h-10 w-10" : "h-12 w-12",
            word.mastered ? "bg-[#E8F5E9]" : "bg-[#FFF3E0]",
          )}
        >
          {word.mastered ? (
            <CheckCircle
              className={cn(compact ? "h-5 w-5" : "h-6 w-6", "text-[#66BB6A]")}
            />
          ) : (
            <Clock
              className={cn(compact ? "h-5 w-5" : "h-6 w-6", "text-[#FF9800]")}
            />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={cn(
                "truncate font-black text-gray-700",
                compact ? "text-base" : "text-lg",
              )}
            >
              {getWordLabel(word)}
            </h4>
            <button
              onClick={() => onPlay(getWordLabel(word))}
              className="rounded-full p-2 text-[#29B6F6] opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100"
              aria-label={`Listen to ${getWordLabel(word)}`}
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>
          <p className="truncate text-xs font-bold text-gray-400">
            {word.word} · {getWordCategoryLabel(word)}
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="flex justify-end gap-1">
          {Array.from({ length: EXPOSURE_TARGET }, (_, index) => index + 1).map(
            (star) => (
              <Star
                key={star}
                className={cn(
                  compact ? "h-3 w-3" : "h-3.5 w-3.5",
                  star <= exposureCount
                    ? "fill-[#FFCA28] text-[#FFCA28]"
                    : "text-gray-200",
                )}
              />
            ),
          )}
        </div>
        <p className="mt-1 text-[10px] font-bold text-gray-300">
          {exposureCount}/{EXPOSURE_TARGET} 次練習
        </p>
      </div>
    </div>
  );
}

export function ProgressTab({ childId, stats, words }: ProgressTabProps) {
  const [realWords, setRealWords] = useState<Word[]>(words);
  const [realStats, setRealStats] = useState<ProgressStats>(stats);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<WordFilter>("all");
  const [view, setView] = useState<ProgressView>("focus");
  const { speak } = useSpeech();

  const isMockData =
    !childId ||
    childId === "1" ||
    childId === "mock-child-id" ||
    childId.length < 10;

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

        const [wordsData, progressStats] = await Promise.allSettled([
          getWordsWithProgress(childId),
          getProgressStats(childId),
        ]);

        const loadedWords =
          wordsData.status === "fulfilled"
            ? wordsData.value.map((word) => toWord(word, word.progress))
            : [];

        const totalWords = loadedWords.length;
        const masteredWords = loadedWords.filter(
          (word) => word.mastered,
        ).length;

        setRealWords(loadedWords);

        if (progressStats.status === "fulfilled") {
          const progress = progressStats.value;
          setRealStats({
            totalWords: progress.total_words || totalWords,
            masteredWords: progress.mastered_words || masteredWords,
            weeklyProgress: progress.weekly_progress || [],
            streakDays: progress.streak_days || 0,
            categoryProgress: (progress.category_progress || []).map(
              (category) => ({
                category: category.category,
                progress: category.progress,
                mastered: category.mastered,
                total: category.total,
              }),
            ),
            averageExposuresPerWord: progress.average_exposures_per_word || 0,
            activeVocabulary: progress.active_vocabulary || 0,
            passiveVocabulary: progress.passive_vocabulary || 0,
            multiSensoryEngagement: progress.multi_sensory_engagement || 0,
          });
          console.log(
            `[Progress] Stats loaded: ${progress.total_words} words, streak ${progress.streak_days}`,
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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredWords = sortWordsForDisplay(realWords).filter((word) => {
    const matchesSearch =
      !normalizedQuery ||
      getWordLabel(word).toLowerCase().includes(normalizedQuery) ||
      word.word.toLowerCase().includes(normalizedQuery) ||
      getWordCategoryLabel(word).toLowerCase().includes(normalizedQuery);
    const matchesFilter =
      filter === "all" ||
      (filter === "mastered" && word.mastered) ||
      (filter === "learning" && !word.mastered);

    return matchesSearch && matchesFilter;
  });

  const filteredLearningWords = filteredWords.filter((word) => !word.mastered);
  const filteredMasteredWords = filteredWords.filter((word) => word.mastered);
  const allCategorySummaries = buildCategorySummaries(
    realWords,
    realStats.categoryProgress,
    true,
  );
  const filteredCategorySummaries = buildCategorySummaries(
    filteredWords,
    realStats.categoryProgress,
    false,
  );
  const wordsNeedingPractice = filteredLearningWords.filter(
    (word) => (word.exposureCount || 0) < 3,
  );
  const nearMasteryWords = [...filteredLearningWords]
    .filter((word) => (word.exposureCount || 0) >= 4)
    .sort(
      (left, right) => (right.exposureCount || 0) - (left.exposureCount || 0),
    );
  const secondaryFocusWords =
    nearMasteryWords.length > 0
      ? nearMasteryWords.slice(0, 5)
      : filteredMasteredWords.slice(0, 5);
  const masteryRate =
    realStats.totalWords > 0
      ? Math.round((realStats.masteredWords / realStats.totalWords) * 100)
      : 0;
  const reviewQueueCount = realWords.filter(
    (word) => !word.mastered && (word.exposureCount || 0) < 3,
  ).length;
  const almostThereCount = realWords.filter(
    (word) => !word.mastered && (word.exposureCount || 0) >= 4,
  ).length;
  const strongestCategory = [...allCategorySummaries]
    .filter((category) => category.total > 0)
    .sort((left, right) => {
      if (left.progress !== right.progress) {
        return right.progress - left.progress;
      }

      return right.mastered - left.mastered;
    })[0];
  const focusCategory = [...allCategorySummaries]
    .filter((category) => category.total > 0)
    .sort((left, right) => {
      if (left.progress !== right.progress) {
        return left.progress - right.progress;
      }

      return right.needsPracticeCount - left.needsPracticeCount;
    })[0];
  const hasActiveFilters = normalizedQuery.length > 0 || filter !== "all";

  const playWord = (wordText: string) => {
    speak(wordText, {
      rate: 0.8,
      pitch: 1.1,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28 rounded-[28px]" />
          <Skeleton className="h-28 rounded-[28px]" />
          <Skeleton className="h-28 rounded-[28px]" />
          <Skeleton className="h-28 rounded-[28px]" />
        </div>
        <Skeleton className="h-48 rounded-4xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-4xl" />
          <Skeleton className="h-32 rounded-4xl" />
          <Skeleton className="h-32 rounded-4xl" />
        </div>
        <Skeleton className="h-128 rounded-4xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-zen">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetricCard
          value={realStats.totalWords}
          label="詞彙總量"
          detail="目前累積接觸過的詞語"
          className="border border-gray-100 bg-white"
          valueClassName="text-[#546E7A]"
        />
        <SummaryMetricCard
          value={realStats.masteredWords}
          label="已掌握"
          detail={`掌握率 ${masteryRate}%`}
          className="bg-[#E8F5E9]"
          valueClassName="text-[#43A047]"
        />
        <SummaryMetricCard
          value={reviewQueueCount}
          label="需優先複習"
          detail="接觸少於 3 次的詞語"
          className="bg-[#FFF3E0]"
          valueClassName="text-[#FB8C00]"
        />
        <SummaryMetricCard
          value={almostThereCount}
          label="快將掌握"
          detail="已接觸 4 次或以上"
          className="bg-[#E3F2FD]"
          valueClassName="text-[#1E88E5]"
        />
      </div>

      <Card className="overflow-hidden rounded-4xl border-none bg-linear-to-br from-[#E1F5FE] via-white to-[#FFF8E1] shadow-sm">
        <CardContent className="p-6 md:p-7">
          <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-black text-[#0288D1] shadow-sm">
                <Sparkles className="h-4 w-4" />
                進度焦點
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 md:text-3xl">
                  {focusCategory
                    ? `先集中複習「${focusCategory.label}」會更有效`
                    : "先看重點，再決定今天的複習方向"}
                </h3>
                <p className="max-w-2xl text-sm font-medium leading-7 text-slate-500 md:text-base">
                  {focusCategory
                    ? `這個主題目前掌握度 ${focusCategory.progress}%，仍有 ${Math.max(
                        focusCategory.total - focusCategory.mastered,
                        0,
                      )} 個詞語在建立中。`
                    : "先從仍在學習中的詞語開始，再查看主題分佈，會比瀏覽長清單更容易找到重點。"}
                  {wordsNeedingPractice.length > 0
                    ? ` 現時最需要幫忙的是接觸次數較少的 ${wordsNeedingPractice.length} 個詞語。`
                    : " 目前低接觸詞語不多，可安排簡短複習鞏固。"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl bg-white/85 p-4 shadow-sm ring-1 ring-white/60">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#90A4AE]">
                  最穩定主題
                </p>
                <p className="mt-2 text-xl font-black text-slate-800">
                  {strongestCategory?.label || "持續建立中"}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  {strongestCategory
                    ? `${strongestCategory.progress}% 掌握度`
                    : "等累積更多詞語後會顯示"}
                </p>
              </div>

              <div className="rounded-3xl bg-white/85 p-4 shadow-sm ring-1 ring-white/60">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#90A4AE]">
                  詞彙使用
                </p>
                <p className="mt-2 text-xl font-black text-slate-800">
                  {realStats.activeVocabulary} 主動 /{" "}
                  {realStats.passiveVocabulary} 被動
                </p>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  平均每個詞語接觸{" "}
                  {realStats.averageExposuresPerWord.toFixed(1)} 次
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-4xl border-2 border-gray-100 bg-white shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-xl font-black text-gray-700">
                <BookOpen className="h-6 w-6 text-[#29B6F6]" />
                生字進度
              </h3>
              <p className="text-sm font-medium text-gray-500">
                先看重點，再按主題或全部詞語深入查看。
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
              <div className="relative w-full xl:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="搜尋詞語或主題..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-12 rounded-full border-none bg-[#F5F7F8] pl-9 font-bold text-gray-600 focus-visible:ring-2 focus-visible:ring-[#29B6F6]"
                />
              </div>

              <div className="flex flex-wrap gap-2 xl:justify-end">
                {FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setFilter(option.id)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-black transition-all",
                      filter === option.id
                        ? "-translate-y-px bg-[#29B6F6] text-white shadow-md"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Tabs
            value={view}
            onValueChange={(nextValue) => setView(nextValue as ProgressView)}
            className="space-y-6"
          >
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-[20px] bg-[#F4F8FB] p-2">
              {VIEW_OPTIONS.map((option) => {
                const Icon = option.icon;

                return (
                  <TabsTrigger
                    key={option.id}
                    value={option.id}
                    className="rounded-full px-4 py-2 font-black data-[state=active]:bg-white data-[state=active]:text-[#0288D1] data-[state=active]:shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {filteredWords.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#CFD8DC] bg-[#FAFBFC] px-6 py-12 text-center">
                <p className="text-base font-black text-gray-500">
                  {hasActiveFilters
                    ? "目前篩選條件下找不到詞語"
                    : "暫時還沒有詞語資料"}
                </p>
                <p className="mt-2 text-sm font-medium text-gray-400">
                  {hasActiveFilters
                    ? "可嘗試清除搜尋內容，或切換到其他篩選條件。"
                    : "當孩子開始累積詞語後，這裡會顯示主題重點和複習方向。"}
                </p>
              </div>
            ) : (
              <>
                <TabsContent value="focus" className="space-y-6">
                  <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card className="rounded-[28px] border border-[#FFE0B2] bg-[#FFF8F1] shadow-none">
                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#FFB74D]">
                              優先複習
                            </p>
                            <h4 className="mt-2 flex items-center gap-2 text-xl font-black text-gray-700">
                              <Target className="h-5 w-5 text-[#FB8C00]" />
                              先處理低接觸詞語
                            </h4>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-[#EF6C00] shadow-sm">
                            {wordsNeedingPractice.length} 個
                          </span>
                        </div>

                        <div className="space-y-3">
                          {wordsNeedingPractice.length > 0 ? (
                            wordsNeedingPractice
                              .slice(0, 5)
                              .map((word) => (
                                <WordListItem
                                  key={word.id}
                                  word={word}
                                  onPlay={playWord}
                                  compact
                                />
                              ))
                          ) : (
                            <div className="rounded-[20px] border border-dashed border-[#FFCC80] bg-white px-4 py-6 text-center">
                              <p className="font-black text-[#EF6C00]">
                                目前沒有特別落後的詞語
                              </p>
                              <p className="mt-2 text-sm font-medium text-[#8D6E63]">
                                可以轉去查看快將掌握的詞語，做最後幾次鞏固。
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-[28px] border border-[#BBDEFB] bg-[#F5FBFF] shadow-none">
                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#64B5F6]">
                              {nearMasteryWords.length > 0
                                ? "快將掌握"
                                : "掌握較穩定"}
                            </p>
                            <h4 className="mt-2 flex items-center gap-2 text-xl font-black text-gray-700">
                              <TrendingUp className="h-5 w-5 text-[#1E88E5]" />
                              {nearMasteryWords.length > 0
                                ? "再加一點練習就可以"
                                : "可帶入生活情境鞏固"}
                            </h4>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-[#1E88E5] shadow-sm">
                            {secondaryFocusWords.length} 個
                          </span>
                        </div>

                        <div className="space-y-3">
                          {secondaryFocusWords.length > 0 ? (
                            secondaryFocusWords.map((word) => (
                              <WordListItem
                                key={word.id}
                                word={word}
                                onPlay={playWord}
                                compact
                              />
                            ))
                          ) : (
                            <div className="rounded-[20px] border border-dashed border-[#90CAF9] bg-white px-4 py-6 text-center">
                              <p className="font-black text-[#1E88E5]">
                                暫時沒有符合條件的詞語
                              </p>
                              <p className="mt-2 text-sm font-medium text-[#607D8B]">
                                可先在「按主題」查看哪個主題還有較多學習中的詞語。
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#90A4AE]">
                          主題總覽
                        </p>
                        <h4 className="mt-1 text-xl font-black text-gray-700">
                          一眼看出哪個主題最需要家長介入
                        </h4>
                      </div>
                      <span className="rounded-full bg-[#F4F8FB] px-3 py-1 text-sm font-black text-[#607D8B]">
                        {filteredCategorySummaries.length} 個主題
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {filteredCategorySummaries.map((category) => {
                        const tone = getProgressTone(category.progress);

                        return (
                          <div
                            key={category.key}
                            className="rounded-3xl border border-gray-100 bg-[#FCFDFD] p-5 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h5 className="text-lg font-black text-gray-700">
                                  {category.label}
                                </h5>
                                <p className="mt-1 text-xs font-bold text-gray-400">
                                  {category.mastered}/{category.total} 已掌握
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "rounded-full px-3 py-1 text-xs font-black",
                                  tone.pill,
                                )}
                              >
                                {tone.label}
                              </span>
                            </div>

                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                                <span>主題掌握度</span>
                                <span>{category.progress}%</span>
                              </div>
                              <Progress
                                value={category.progress}
                                className="h-2.5 bg-[#EDF2F6]"
                                indicatorClassName={tone.bar}
                              />
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {category.learningWords.length > 0 ? (
                                category.learningWords
                                  .slice(0, 3)
                                  .map((word) => (
                                    <span
                                      key={word.id}
                                      className="rounded-full bg-[#F5F7F8] px-3 py-1 text-xs font-black text-[#607D8B]"
                                    >
                                      {getWordLabel(word)}
                                    </span>
                                  ))
                              ) : (
                                <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-black text-[#43A047]">
                                  此主題已全部掌握
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="categories" className="space-y-3">
                  <Accordion type="multiple" className="space-y-3">
                    {filteredCategorySummaries.map((category) => {
                      const tone = getProgressTone(category.progress);

                      return (
                        <AccordionItem
                          key={category.key}
                          value={category.key}
                          className="overflow-hidden rounded-3xl border border-gray-100 bg-[#FCFDFD] px-5 shadow-sm"
                        >
                          <AccordionTrigger className="items-center gap-4 py-5 hover:no-underline">
                            <div className="flex w-full flex-col gap-3 text-left md:flex-row md:items-center md:justify-between">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="text-lg font-black text-gray-700">
                                    {category.label}
                                  </span>
                                  <span
                                    className={cn(
                                      "rounded-full px-3 py-1 text-xs font-black",
                                      tone.pill,
                                    )}
                                  >
                                    {category.progress}%
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-gray-400">
                                  {category.mastered}/{category.total} 已掌握
                                  {category.needsPracticeCount > 0
                                    ? ` · ${category.needsPracticeCount} 個建議優先複習`
                                    : " · 目前節奏穩定"}
                                </p>
                              </div>

                              <div className="w-full max-w-xs">
                                <Progress
                                  value={category.progress}
                                  className="h-2.5 bg-[#EDF2F6]"
                                  indicatorClassName={tone.bar}
                                />
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="pb-5">
                            <div className="grid gap-3 md:grid-cols-2">
                              {category.words.map((word) => (
                                <WordListItem
                                  key={word.id}
                                  word={word}
                                  onPlay={playWord}
                                  compact
                                />
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </TabsContent>

                <TabsContent value="allWords" className="space-y-6">
                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-2 text-lg font-black text-gray-700">
                          <Clock className="h-5 w-5 text-[#FB8C00]" />
                          學習中
                        </h4>
                        <span className="rounded-full bg-[#FFF3E0] px-3 py-1 text-sm font-black text-[#EF6C00]">
                          {filteredLearningWords.length}
                        </span>
                      </div>

                      {filteredLearningWords.length > 0 ? (
                        filteredLearningWords.map((word) => (
                          <WordListItem
                            key={word.id}
                            word={word}
                            onPlay={playWord}
                          />
                        ))
                      ) : (
                        <div className="rounded-3xl border border-dashed border-[#FFCC80] bg-[#FFF8F1] px-4 py-8 text-center">
                          <p className="font-black text-[#EF6C00]">
                            目前沒有學習中的詞語
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-2 text-lg font-black text-gray-700">
                          <CheckCircle className="h-5 w-5 text-[#43A047]" />
                          已掌握
                        </h4>
                        <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-sm font-black text-[#2E7D32]">
                          {filteredMasteredWords.length}
                        </span>
                      </div>

                      {filteredMasteredWords.length > 0 ? (
                        filteredMasteredWords.map((word) => (
                          <WordListItem
                            key={word.id}
                            word={word}
                            onPlay={playWord}
                          />
                        ))
                      ) : (
                        <div className="rounded-3xl border border-dashed border-[#A5D6A7] bg-[#F4FBF4] px-4 py-8 text-center">
                          <p className="font-black text-[#2E7D32]">
                            目前沒有已掌握詞語
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none bg-[#E3F2FD] shadow-sm">
        <CardContent className="flex items-start gap-4 p-5">
          <div className="shrink-0 rounded-full bg-white p-2 shadow-sm">
            <Lightbulb className="h-6 w-6 text-[#29B6F6]" />
          </div>
          <div>
            <h3 className="mb-1 font-black text-[#1565C0]">學習小貼士</h3>
            <p className="text-sm font-bold leading-relaxed text-[#546E7A]">
              先看「重點整理」內接觸次數較少的詞語，再去「按主題」查看哪個主題最需要加強，會比直接瀏覽長清單更容易安排複習。
              <br />
              小朋友通常需要在不同情境下接觸一個詞語六至十二次，才能真正掌握。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
