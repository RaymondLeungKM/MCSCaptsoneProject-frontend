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
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { AISentences } from "@/components/child/ai-sentences";
import { getWords, getWordsWithProgress, getCapturedWords } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api/client";
import { getGraphRecommendations } from "@/lib/api/phase8";
import type { LanguagePreference, Word } from "@/lib/types";
import { useWordAudio } from "@/hooks/use-word-audio";
import { WordDetailModal } from "@/components/modals/word-detail-modal";
import { MemoryStarsProgress } from "@/components/child/memory-stars-progress";

// --- TYPES ---
export interface DailyWordSummary {
  word_id: string;
  word: string; // Backend identifier (usually English), kept for data tracking but hidden in UI
  word_cantonese?: string;
  jyutping?: string;
  definition_cantonese?: string;
  image_url?: string;
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
  variant?: "full" | "home";
}

function applyProgressUpdate(
  items: DailyWordSummary[],
  wordId: string,
  mastered: boolean,
  exposureCount: number,
) {
  return items.map((item) =>
    item.word_id === wordId
      ? {
          ...item,
          used_actively: mastered || item.used_actively,
          exposure_count: exposureCount,
        }
      : item,
  );
}

function isSameLocalDay(dateLike?: string) {
  if (!dateLike) {
    return false;
  }

  const parsedDate = new Date(dateLike);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const today = new Date();

  return (
    parsedDate.getFullYear() === today.getFullYear() &&
    parsedDate.getMonth() === today.getMonth() &&
    parsedDate.getDate() === today.getDate()
  );
}

function isImageUrl(value?: string) {
  return (
    !!value &&
    (value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("/") ||
      value.startsWith("data:image/"))
  );
}

function resolveImageUrl(url?: string) {
  const safeUrl = url?.trim() ?? "";

  if (!isImageUrl(safeUrl)) {
    return "";
  }

  if (
    safeUrl.startsWith("http://") ||
    safeUrl.startsWith("https://") ||
    safeUrl.startsWith("data:image/")
  ) {
    return safeUrl;
  }

  const base = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${base}${safeUrl.startsWith("/") ? "" : "/"}${safeUrl}`;
}

export function DailyWordsViewer({
  childId = "1",
  childName = "Emma",
  languagePreference = "cantonese", // Defaulted to Cantonese
  onWordLearned,
  variant = "full",
}: DailyWordsViewerProps) {
  const showDefaultLibrary = variant === "full";
  const { playWord, isLoading, isPlaying } = useWordAudio();
  const [words, setWords] = useState<DailyWordSummary[]>([]);
  const [loading, setLoading] = useState(showDefaultLibrary);
  const [error, setError] = useState<string | null>(null);

  // Camera tab state (API-backed)
  const [cameraWords, setCameraWords] = useState<DailyWordSummary[]>([]);
  const [cameraLoading, setCameraLoading] = useState(true);

  // Graph recommendation reason for 預設字庫
  const [graphReason, setGraphReason] = useState<string | null>(null);

  // Tab & Expansion State
  const [activeTab, setActiveTab] = useState<"default" | "camera">("camera");
  const [isExpanded, setIsExpanded] = useState(false);

  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [modalWord, setModalWord] = useState<Word | null>(null);

  // Build a full Word object from a DailyWordSummary for use in the modal
  const buildWord = (summary: DailyWordSummary): Word => ({
    id: summary.word_id,
    word: summary.word,
    word_cantonese: summary.word_cantonese,
    jyutping: summary.jyutping,
    image: summary.image_url || "",
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
    if (showDefaultLibrary) {
      void loadDailyWords();
    } else {
      setWords([]);
      setLoading(false);
      setError(null);
      setGraphReason(null);
    }

    void loadCameraWords();
  }, [childId, showDefaultLibrary]);

  // Handle auto-selecting the first word when switching tabs
  const currentTab = showDefaultLibrary ? activeTab : "camera";
  const currentWords = currentTab === "default" ? words : cameraWords;

  useEffect(() => {
    if (currentWords.length > 0) {
      setSelectedWordId(currentWords[0].word_id);
    } else {
      setSelectedWordId(null);
    }
  }, [activeTab, words, cameraWords]);

  const loadCameraWords = async () => {
    setCameraLoading(true);
    try {
      if (childId && childId !== "1") {
        try {
          const captured = await getCapturedWords(childId, {
            limit: 30,
            includeMongodb: true,
          });

          const todayCameraWords = captured
            .filter((item) => isSameLocalDay(item.created_at))
            .sort(
              (left, right) =>
                new Date(right.created_at).getTime() -
                new Date(left.created_at).getTime(),
            )
            .map((item) => ({
              word_id: item.id,
              word: item.word,
              word_cantonese: item.word_cantonese,
              jyutping: item.jyutping,
              definition_cantonese:
                item.definition_cantonese || item.definition,
              image_url: item.image_url,
              exposure_count: item.total_exposures || 0,
              used_actively: (item.success_rate || 0) >= 0.7,
              story_priority: Math.max(
                1,
                Math.min(10, Math.round((item.success_rate || 0) * 10 || 5)),
              ),
              last_practiced: item.created_at,
            }));

          setCameraWords(todayCameraWords);
        } catch (captureErr) {
          console.warn("Failed to load camera-captured words", captureErr);
          setCameraWords([]);
        }
      } else {
        setCameraWords([]);
      }
    } catch (err) {
      console.error("Error loading camera words:", err);
      setCameraWords([]);
    } finally {
      setCameraLoading(false);
    }
  };

  const loadDailyWords = async () => {
    setLoading(true);
    setError(null);
    setGraphReason(null);

    try {
      let dailyWords: DailyWordSummary[] = [];

      if (childId && childId !== "1") {
        // Fetch full word+progress data and graph recommendations in parallel
        const [wordsWithProgress, graphRec] = await Promise.allSettled([
          getWordsWithProgress(childId),
          getGraphRecommendations(childId, 8),
        ]);

        const allWords =
          wordsWithProgress.status === "fulfilled"
            ? wordsWithProgress.value
            : [];

        // Build a map from word_id → mapped DailyWordSummary
        const wordMap = new Map<string, DailyWordSummary>();
        for (const item of allWords as any[]) {
          const progress = item.progress;
          const exposureCount = progress?.exposure_count ?? 0;
          const successRate = progress?.success_rate ?? 0;
          wordMap.set(item.id, {
            word_id: item.id,
            word: item.word,
            word_cantonese: item.word_cantonese,
            jyutping: item.jyutping,
            definition_cantonese: item.definition_cantonese || item.definition,
            image_url: item.image_url,
            exposure_count: exposureCount,
            used_actively: progress?.mastered ?? false,
            story_priority: Math.max(
              1,
              Math.min(10, Math.round(10 - Math.min(exposureCount, 9))),
            ),
            last_practiced: progress?.last_practiced,
          });
        }

        // Use graph recommendations to order words if available
        if (
          graphRec.status === "fulfilled" &&
          graphRec.value.recommended_words.length > 0
        ) {
          setGraphReason(graphRec.value.reason);
          const recommendedIds = graphRec.value.recommended_words.map(
            (w) => w.word_id,
          );

          // Boost: recommended words first (in recommendation order), then
          // remaining words sorted by story_priority
          const recommended = recommendedIds
            .map((id) => wordMap.get(id))
            .filter((w): w is DailyWordSummary => w !== undefined);

          const recommendedSet = new Set(recommendedIds);
          const remaining = Array.from(wordMap.values())
            .filter((w) => !recommendedSet.has(w.word_id))
            .sort((a, b) => b.story_priority - a.story_priority);

          dailyWords = [...recommended, ...remaining].slice(0, 8);
        } else {
          // Fallback: sort by story_priority (existing behaviour)
          dailyWords = Array.from(wordMap.values())
            .sort((a, b) => b.story_priority - a.story_priority)
            .slice(0, 8);
        }
      }

      if (!dailyWords.length) {
        const fallbackWords = await getWords({
          childId,
          includeExternal: true,
          includeMongodb: true,
          limit: 12,
        });
        dailyWords = fallbackWords.map((item) => ({
          word_id: item.id,
          word: item.word,
          word_cantonese: item.word_cantonese,
          jyutping: item.jyutping,
          definition_cantonese: item.definition_cantonese || item.definition,
          image_url: item.image_url,
          exposure_count: item.total_exposures || 0,
          used_actively: (item.success_rate || 0) >= 0.7,
          story_priority: Math.max(
            1,
            Math.min(10, Math.round((item.success_rate || 0) * 10 || 5)),
          ),
        }));
      }

      setWords(dailyWords);
    } catch (err) {
      console.error("Error loading daily words:", err);
      setError("載入每日詞語失敗，請稍後再試。");
      setWords([]);
    } finally {
      setLoading(false);
    }
  };

  if (showDefaultLibrary && error) {
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

  const isInitialLoading = showDefaultLibrary ? loading && cameraLoading : cameraLoading;

  if (isInitialLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md rounded-[40px] border-4 border-white shadow-sm p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <Skeleton className="h-14 w-full rounded-full mb-6" />{" "}
          {/* Tab Skeleton */}
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
        </div>
      </Card>
    );
  }

  const displayWords = isExpanded ? currentWords : currentWords.slice(0, 3);
  const activeWord =
    currentWords.find((w) => w.word_id === selectedWordId) || currentWords[0];

  const handlePlayWord = (word: DailyWordSummary) => {
    const playableWord = buildWord(word);
    void playWord(playableWord, {
      languagePreference: "cantonese",
      speechRate: 0.8,
    });
  };

  return (
    <>
      <WordDetailModal
        word={modalWord}
        onClose={() => setModalWord(null)}
        languagePreference="cantonese"
        childId={childId !== "1" ? childId : undefined}
        onProgressUpdate={(wordId, mastered, exposureCount) => {
          setWords((prev) =>
            applyProgressUpdate(prev, wordId, mastered, exposureCount),
          );
          setCameraWords((prev) =>
            applyProgressUpdate(prev, wordId, mastered, exposureCount),
          );
          onWordLearned?.();
        }}
      />
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Main Container Card */}
        <Card className="bg-white/80 backdrop-blur-md rounded-[40px] border-4 border-white shadow-sm overflow-hidden">
          {/* Header Section */}
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <CardTitle className="child-tab-section-title flex min-w-0 items-center gap-3 !text-2xl !text-slate-700 !tracking-tight">
                <span className="bg-yellow-400 text-white p-2 rounded-2xl shadow-sm rotate-3">
                  <Sparkles className="w-6 h-6 fill-white" />
                </span>
                {showDefaultLibrary ? "今日學習" : "今日發現"}
              </CardTitle>
              <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none px-4 py-1.5 text-sm font-bold rounded-full">
                共 {currentWords.length} 個詞語
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            {showDefaultLibrary ? (
              <div className="flex bg-slate-100/80 p-1.5 rounded-full mb-6">
                <button
                  onClick={() => {
                    setActiveTab("camera");
                    setIsExpanded(false);
                  }}
                  className={cn(
                    "child-tab-card-title flex-1 flex items-center justify-center gap-2 py-3 rounded-full !mt-0 !text-sm transition-all duration-300 md:!text-base",
                    activeTab === "camera"
                      ? "bg-white text-purple-500 shadow-md scale-[1.02]"
                      : "text-slate-400 hover:text-slate-600",
                  )}
                >
                  <Camera className="w-5 h-5" />
                  相機探索
                </button>
                <button
                  onClick={() => {
                    setActiveTab("default");
                    setIsExpanded(false);
                  }}
                  className={cn(
                    "child-tab-card-title flex-1 flex items-center justify-center gap-2 py-3 rounded-full !mt-0 !text-sm transition-all duration-300 md:!text-base",
                    activeTab === "default"
                      ? "bg-white text-[#38BDF8] shadow-md scale-[1.02]"
                      : "text-slate-400 hover:text-slate-600",
                  )}
                >
                  <BookOpen className="w-5 h-5" />
                  預設字庫
                </button>
              </div>
            ) : (
              <div className="mb-6 rounded-[28px] border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-cyan-50 px-5 py-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-sm">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="child-tab-caption !tracking-[0.14em] !text-teal-500">
                      今日相機探索
                    </p>
                    <p className="child-tab-card-title !text-base !text-slate-700">
                      這裡只顯示你今天用相機發現的新詞語。
                    </p>
                    <p className="child-tab-section-copy !mt-1">
                      預設字庫已經放在學習頁，首頁只保留今日最即時的相機探索。
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="child-tab-copy mb-6 text-center !font-bold">
              {showDefaultLibrary
                ? currentTab === "default"
                  ? (graphReason ?? "這些詞語將會出現在你的睡前故事中！")
                  : "這些是你用相機發現的新鮮事物！"
                : "把今天親自拍到的東西先放在首頁，再慢慢帶進學習和分享流程。"}
            </p>

            <p className="child-tab-copy !-mt-3 !mb-6 !text-center !text-xs !font-bold !text-emerald-600">
              {showDefaultLibrary
                ? "點開詞語後按「請家長確認」，再由家長到家長中心批准，主動詞彙才會增加。"
                : "點開相片卡後先請家長確認，批准後才會加入學習，再決定是否分享到社區。"}
            </p>

            {/* Word List */}
            {(activeTab === "camera" && cameraLoading) ||
            (activeTab === "default" && loading) ? (
              <div className="grid gap-3">
                <Skeleton className="h-52 w-full rounded-4xl" />
                <Skeleton className="h-52 w-full rounded-4xl" />
                <Skeleton className="h-52 w-full rounded-4xl" />
              </div>
            ) : displayWords.length > 0 ? (
              <div className="grid gap-3">
                {displayWords.map((word, index) => {
                  const visualValue = word.image_url?.trim() ?? "";
                  const photoUrl = resolveImageUrl(visualValue);
                  const emojiVisual =
                    visualValue && !photoUrl ? visualValue : "";

                  return (
                    <div
                      key={word.word_id}
                      onClick={() => {
                        setSelectedWordId(word.word_id);
                        setModalWord(buildWord(word));
                      }}
                      className={cn(
                        "group relative cursor-pointer overflow-hidden rounded-4xl border-2 p-3 transition-all duration-300 sm:p-4",
                        selectedWordId === word.word_id
                          ? "border-yellow-300 bg-linear-to-br from-yellow-50 via-orange-50 to-white shadow-md sm:scale-[1.01]"
                          : "border-slate-100 bg-white hover:border-yellow-200 hover:shadow-sm",
                      )}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
                        <div className="relative shrink-0 overflow-hidden rounded-[28px] border-4 border-white/80 bg-linear-to-br from-sky-100 via-white to-yellow-50 shadow-sm sm:w-40 md:w-44">
                          <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
                            <div
                              className={cn(
                                "flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black text-white shadow-sm",
                                activeTab === "camera"
                                  ? "bg-linear-to-br from-purple-400 to-fuchsia-400"
                                  : word.story_priority >= 8
                                    ? "bg-linear-to-br from-yellow-400 to-orange-400"
                                    : word.story_priority >= 5
                                      ? "bg-linear-to-br from-blue-400 to-cyan-400"
                                      : "bg-linear-to-br from-slate-300 to-slate-400",
                              )}
                            >
                              {index + 1}
                            </div>
                            <Badge className="rounded-full border-none bg-white/90 px-3 py-1 text-xs font-black text-slate-600 shadow-sm backdrop-blur-sm">
                              {currentTab === "camera" ? "相機探索" : "今日推薦"}
                            </Badge>
                          </div>

                          {photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photoUrl}
                              alt={word.word_cantonese || word.word}
                              className="h-48 w-full object-cover sm:h-full sm:min-h-48"
                            />
                          ) : emojiVisual ? (
                            <div className="flex h-48 w-full flex-col items-center justify-center gap-3 px-4 text-center sm:h-full sm:min-h-48">
                              <div className="rounded-[2rem] bg-white/75 px-6 py-4 shadow-sm backdrop-blur-sm">
                                <span className="text-7xl leading-none drop-shadow-sm sm:text-8xl">
                                  {emojiVisual}
                                </span>
                              </div>
                              <p className="child-tab-card-title !mt-0 !text-sm !leading-snug !text-slate-500">
                                {currentTab === "camera"
                                  ? "相機找到的圖像"
                                  : "今日詞語圖示"}
                              </p>
                            </div>
                          ) : (
                            <div className="flex h-48 w-full flex-col items-center justify-center gap-3 px-4 text-center text-slate-500 sm:h-full sm:min-h-48">
                              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 text-slate-400 shadow-sm">
                                {currentTab === "camera" ? (
                                  <Camera className="h-8 w-8" />
                                ) : (
                                  <BookOpen className="h-8 w-8" />
                                )}
                              </div>
                              <p className="child-tab-card-title !mt-0 !text-sm !leading-snug !text-slate-500">
                                {currentTab === "camera"
                                  ? "相片準備中"
                                  : "插圖準備中"}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 rounded-[28px] bg-slate-50/70 p-4 sm:p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="child-tab-caption !text-[11px] !tracking-[0.22em]">
                                {showDefaultLibrary
                                  ? currentTab === "camera"
                                  ? "今日相機探索"
                                  : "今日故事詞語"
                                  : "今日相機探索"}
                              </p>
                              <h3 className="child-tab-hero-title !mt-2 wrap-break-word !text-[2.1rem] !leading-[0.95] !text-slate-800 sm:!text-[2.6rem]">
                                {word.word_cantonese || word.word}
                              </h3>
                              {word.jyutping && (
                                <span className="mt-3 inline-flex max-w-full rounded-2xl border border-sky-100 bg-white px-3 py-2 text-base font-black text-sky-600 shadow-sm">
                                  {word.jyutping}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                handlePlayWord(word);
                              }}
                              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-sky-400 to-cyan-300 text-white shadow-sm transition-transform hover:scale-105"
                              aria-label={`播放 ${word.word_cantonese || word.word}`}
                            >
                              <Volume2
                                className={cn(
                                  "h-7 w-7",
                                  (isPlaying || isLoading) && "animate-pulse",
                                )}
                              />
                            </button>
                          </div>

                          <p className="child-tab-card-copy !mt-0 !text-base !font-bold !leading-relaxed sm:!text-lg">
                            {word.definition_cantonese ||
                              "點一下學習這個新詞語。"}
                          </p>

                          <MemoryStarsProgress
                            exposureCount={word.exposure_count}
                            languagePreference={languagePreference}
                            className="max-w-full"
                          />

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Badge className="rounded-full border-none bg-emerald-100 px-3 py-1.5 text-sm font-black text-emerald-700 hover:bg-emerald-100">
                              已練習 {word.exposure_count} 次
                            </Badge>
                            <span className="child-tab-caption !tracking-wide">
                              點一下打開學習卡
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  {activeTab === "default" ? (
                    <BookOpen className="w-10 h-10 text-slate-300" />
                  ) : (
                    <Camera className="w-10 h-10 text-slate-300" />
                  )}
                </div>
                <p className="child-tab-card-title !text-lg !text-slate-500">
                  {showDefaultLibrary
                    ? currentTab === "default"
                      ? "暫時未有今日詞語。"
                      : "尚未發現新詞語。"
                    : "今天暫時未有新發現。"}
                </p>
                <p className="child-tab-card-copy !text-slate-400">
                  {showDefaultLibrary
                    ? currentTab === "default"
                      ? "開始學習後會自動產生建議。"
                      : "請用相機探索周圍的世界！"
                    : "先用相機拍攝身邊物件，預設字庫則可以到學習頁查看。"}
                </p>
              </div>
            )}

            {/* Expand Button */}
            {currentWords.length > 3 && (
              <Button
                variant="ghost"
                className="w-full rounded-full hover:bg-slate-100 text-slate-400 font-bold mt-2"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <div className="flex items-center gap-2">
                    <ChevronUp className="w-5 h-5" /> 收起
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ChevronDown className="w-5 h-5" /> 顯示全部 (
                    {currentWords.length})
                  </div>
                )}
              </Button>
            )}

            {/* Summary Stats Footer */}
            <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-100 grid grid-cols-3 gap-4">
              {showDefaultLibrary ? (
                <>
                  <StatBox
                    icon={
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    }
                    label="高優先級"
                    value={currentWords.filter((w) => w.story_priority >= 7).length}
                    color="bg-yellow-50 text-yellow-700 border border-yellow-100"
                  />
                  <StatBox
                    icon={<BookOpen className="w-5 h-5 text-blue-500" />}
                    label="平均練習"
                    value={(
                      currentWords.reduce((sum, w) => sum + w.exposure_count, 0) /
                      (currentWords.length || 1)
                    ).toFixed(1)}
                    color="bg-blue-50 text-blue-700 border border-blue-100"
                  />
                  <StatBox
                    icon={<Trophy className="w-5 h-5 text-orange-500" />}
                    label="主動詞彙"
                    value={currentWords.filter((w) => w.used_actively).length}
                    color="bg-orange-50 text-orange-700 border border-orange-100"
                  />
                </>
              ) : (
                <>
                  <StatBox
                    icon={<Camera className="w-5 h-5 text-teal-500" />}
                    label="新發現"
                    value={currentWords.length}
                    color="bg-teal-50 text-teal-700 border border-teal-100"
                  />
                  <StatBox
                    icon={<Zap className="w-5 h-5 text-blue-500" />}
                    label="已開始練習"
                    value={currentWords.filter((w) => w.exposure_count > 0).length}
                    color="bg-blue-50 text-blue-700 border border-blue-100"
                  />
                  <StatBox
                    icon={<Trophy className="w-5 h-5 text-orange-500" />}
                    label="已會主動說"
                    value={currentWords.filter((w) => w.used_actively).length}
                    color="bg-orange-50 text-orange-700 border border-orange-100"
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
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
        "flex flex-col items-center justify-center p-3 rounded-2xl shadow-sm",
        color,
      )}
    >
      <div className="mb-1 opacity-90">{icon}</div>
      <div className="child-tab-stat-value !mb-1 !mt-0 !text-2xl !leading-none">{value}</div>
      <div className="child-tab-caption opacity-80">
        {label}
      </div>
    </div>
  );
}
