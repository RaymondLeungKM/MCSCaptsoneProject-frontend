"use client";

import {
  useState,
  useEffect,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import type { Category, LanguagePreference, Word } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getCategoryName, getWordText } from "@/lib/language-utils";
import { Sparkles, Play, ArrowLeft, Volume2, Check } from "lucide-react";
import { getWords, getWordsWithProgress, toWord } from "@/lib/api/vocabulary";
import { useWordAudio } from "@/hooks/use-word-audio";
import { WordDetailModal } from "@/components/modals/word-detail-modal";
import { MemoryStarsProgress } from "@/components/child/memory-stars-progress";
import { updateWordProgress } from "@/lib/api/vocabulary";
import { trackDailyWord } from "@/lib/api/bedtime-stories";
import { useToast } from "@/components/ui/use-toast";

interface CategoryGridProps {
  categories: Category[];
  onCategorySelect?: (category: Category) => void; // Optional: if provided, navigates away
  onWordSelect?: (word: Word) => void; // Optional: called when a word card is tapped
  languagePreference?: LanguagePreference;
  childId?: string; // Required for progress tracking
  onWordLearned?: () => void; // Called when a word is mastered
}

// 🎨 Vivid Pastel Colors for the Cards
const getColorClass = (color: string) => {
  const c = color?.toLowerCase() || "blue";
  const map: Record<string, string> = {
    red: "bg-red-100 text-red-600 border-red-300 hover:bg-red-200 hover:scale-105",
    blue: "bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200 hover:scale-105",
    green:
      "bg-green-100 text-green-600 border-green-300 hover:bg-green-200 hover:scale-105",
    yellow:
      "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200 hover:scale-105",
    purple:
      "bg-purple-100 text-purple-600 border-purple-300 hover:bg-purple-200 hover:scale-105",
    orange:
      "bg-orange-100 text-orange-600 border-orange-300 hover:bg-orange-200 hover:scale-105",
    pink: "bg-pink-100 text-pink-600 border-pink-300 hover:bg-pink-200 hover:scale-105",
    teal: "bg-teal-100 text-teal-600 border-teal-300 hover:bg-teal-200 hover:scale-105",
  };
  return map[c] || map.blue;
};

// Resolve an image value: if it looks like a URL, return it; otherwise treat as emoji
const isImageUrl = (value?: string) =>
  !!value && (value.startsWith("http") || value.startsWith("/"));

const isMyCollectionCategory = (category: Category) => {
  const normalizedName = category.name.trim().toLowerCase();
  const normalizedCantonese = (category.name_cantonese || "").trim();

  return (
    normalizedName === "my collection" ||
    normalizedCantonese === "我的" ||
    normalizedCantonese === "我的收藏"
  );
};

export function CategoryGrid({
  categories,
  onCategorySelect,
  onWordSelect,
  languagePreference = "cantonese",
  childId,
  onWordLearned,
}: CategoryGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [categoryWords, setCategoryWords] = useState<Word[]>([]);
  const [isLoadingWords, setIsLoadingWords] = useState(false);
  const [wordsError, setWordsError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const { playWord, isPlaying, isLoading: isAudioLoading } = useWordAudio();
  const { toast } = useToast();

  // Fetch words (with progress when childId is available) whenever a category is selected
  useEffect(() => {
    if (!selectedCategory) return;
    let cancelled = false;
    setIsLoadingWords(true);
    setWordsError(null);
    setCategoryWords([]);

    // For My Collection, only fetch words uploaded by this specific child.
    const isMyCollection = isMyCollectionCategory(selectedCategory);
    const fetchFn = childId
      ? getWordsWithProgress(
          childId,
          isMyCollection ? undefined : selectedCategory.id,
          isMyCollection,
        ).then((responses) => responses.map((r) => toWord(r, r.progress)))
      : getWords({ category: selectedCategory.id, limit: 50 }).then(
          (responses) => responses.map((r) => toWord(r)),
        );

    fetchFn
      .then((words) => {
        if (!cancelled) setCategoryWords(words);
      })
      .catch(() => {
        if (!cancelled) setWordsError("載入詞語失敗，請稍後再試。");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingWords(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategory, languagePreference, childId]);

  // Called by WordDetailModal when progress changes — update the local word's state immediately
  const handleProgressUpdate = (
    wordId: string,
    mastered: boolean,
    exposureCount: number,
  ) => {
    setCategoryWords((prev) =>
      prev.map((w) =>
        w.id === wordId ? { ...w, mastered, exposureCount } : w,
      ),
    );
    // Refresh profile stats on any progress update (today_progress + mastered count)
    onWordLearned?.();
  };

  const handleCategoryClick = (category: Category) => {
    if (onCategorySelect) {
      // External handler provided (e.g., navigate to learn tab)
      onCategorySelect(category);
    } else {
      // Internal mode: show words inline
      setSelectedCategory(category);
    }
  };

  const handleWordActivate = (word: Word) => {
    if (onWordSelect) {
      onWordSelect(word);
    } else {
      setSelectedWord(word);
    }
  };

  const handleWordCardKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    word: Word,
  ) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleWordActivate(word);
    }
  };

  const handlePlayWord = (e: MouseEvent<HTMLButtonElement>, word: Word) => {
    e.stopPropagation();
    void playWord(word, { languagePreference, speechRate: 0.75 });

    if (!childId) {
      return;
    }

    const nextExposureCount = (word.exposureCount || 0) + 1;

    void updateWordProgress(word.id, childId, {
      exposure_count: nextExposureCount,
    })
      .then(async (progress) => {
        const didIncreaseExposure =
          progress.exposure_count > (word.exposureCount || 0);

        setCategoryWords((prev) =>
          prev.map((candidate) =>
            candidate.id === word.id
              ? {
                  ...candidate,
                  mastered: progress.mastered,
                  exposureCount: progress.exposure_count,
                }
              : candidate,
          ),
        );
        onWordLearned?.();

        if (didIncreaseExposure) {
          try {
            await trackDailyWord({
              child_id: childId,
              word_id: word.id,
              date: new Date().toISOString(),
              exposure_count: 1,
              used_actively: false,
              mastery_confidence: 0.35,
              learned_context: {
                activity: "listen_pronunciation",
                source: "learn_category_grid",
              },
              include_in_story: true,
              story_priority: 5,
            });
          } catch {
            // Keep audio playback and progress UI non-blocking when daily tracking fails.
          }
        } else {
          const isAtMaxStars = progress.exposure_count >= 6;
          toast({
            title: isAtMaxStars ? "已經 6/6 粒星" : "今日已加過星星",
            description: isAtMaxStars
              ? "呢個詞語已經滿星啦，繼續聽都好叻！"
              : "同一個詞語今日只可以加 1 粒星，聽日再加油！",
          });
        }
      })
      .catch(() => {
        // Keep audio playback non-blocking when progress sync fails.
      });
  };

  const headerText = "探索主題";
  const subHeaderText = "選擇一個主題開始學習";

  // ── WORD LIST VIEW ──────────────────────────────────────────────────────────
  if (selectedCategory) {
    const catName = getCategoryName(selectedCategory, languagePreference);
    const colorClass = getColorClass(selectedCategory.color);
    // Extract just the bg color for image bg (e.g. "bg-blue-100")
    const bgColorClass = colorClass.split(" ")[0];

    return (
      <>
        <WordDetailModal
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
          languagePreference={languagePreference}
          childId={childId}
          onProgressUpdate={handleProgressUpdate}
        />
        <div className="flex max-h-[calc(100dvh-110px)] w-full flex-col overflow-y-auto rounded-[32px] border border-white/50 bg-white/80 p-4 shadow-sm backdrop-blur-md sm:max-h-[calc(100vh-140px)] sm:rounded-[40px] sm:p-6 md:p-8">
          {/* Header – Back Button */}
          <div className="mb-4 flex items-center gap-2.5 sm:mb-6 sm:gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className="rounded-xl border border-white/60 bg-white/70 p-2 shadow-sm transition-all hover:scale-105 hover:bg-white active:scale-95 sm:rounded-2xl"
              aria-label="返回"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="text-4xl sm:text-5xl">
                {selectedCategory.icon}
              </span>
              <div>
                <h2 className="child-tab-hero-title !text-2xl sm:!text-4xl !text-slate-700">
                  {catName}
                </h2>
                <p className="child-tab-hero-copy !mt-0 !max-w-none !text-sm !text-slate-400 sm:!text-base">
                  {isLoadingWords
                    ? "載入中…"
                    : `${categoryWords.length} 個詞語`}
                </p>
              </div>
            </div>
          </div>

          {/* Loading Skeletons */}
          {isLoadingWords && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-[24px] bg-slate-100 animate-pulse sm:h-40 sm:rounded-[28px]"
                />
              ))}
            </div>
          )}

          {/* Error */}
          {wordsError && !isLoadingWords && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">😕</p>
              <p className="child-tab-card-copy !mt-0 !font-bold">
                {wordsError}
              </p>
            </div>
          )}

          {/* Empty */}
          {!isLoadingWords && !wordsError && categoryWords.length === 0 && (
            <div className="text-center py-12">
              <p className="text-5xl mb-3">🔍</p>
              <p className="child-tab-card-copy !mt-0 !font-bold">
                暫時還沒有詞語
              </p>
            </div>
          )}

          {/* Word Grid */}
          {!isLoadingWords && categoryWords.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {categoryWords.map((word) => {
                const wordText = getWordText(word, languagePreference);

                return (
                  <div
                    key={word.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleWordActivate(word)}
                    onKeyDown={(event) => handleWordCardKeyDown(event, word)}
                    className={cn(
                      "group relative flex min-h-[15.5rem] flex-col items-center justify-start rounded-[24px] border-[3px] p-3.5 pb-3",
                      "cursor-pointer transition-all duration-300 shadow-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                      "sm:min-h-[18.5rem] sm:rounded-[28px] sm:p-5 sm:pb-4",
                      colorClass,
                      word.mastered && "ring-2 ring-green-400 ring-offset-1",
                    )}
                  >
                    {/* Mastered badge */}
                    {word.mastered && (
                      <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-green-400 flex items-center justify-center shadow-sm">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    )}
                    {/* Image / Emoji */}
                    <div
                      className={cn(
                        "mb-2.5 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[22px]",
                        bgColorClass,
                        "border-3 border-white/60 shadow-sm",
                        "sm:mb-3 sm:h-28 sm:w-28 sm:rounded-3xl",
                      )}
                    >
                      {isImageUrl(word.image) ? (
                        <img
                          src={word.image}
                          alt={word.word}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <span className="text-5xl drop-shadow-sm filter sm:text-7xl">
                          {word.image || "📝"}
                        </span>
                      )}
                    </div>

                    {/* Word Label */}
                    <span className="child-tab-card-title !mt-0 !text-center !text-base !leading-tight sm:!text-xl">
                      {wordText}
                    </span>

                    {/* Jyutping */}
                    {word.jyutping && (
                      <span className="mt-1.5 rounded-full bg-white/40 px-2.5 py-1 text-[11px] font-bold tracking-wide sm:mt-2 sm:px-3 sm:text-sm">
                        {word.jyutping}
                      </span>
                    )}

                    <div className="mt-auto flex w-full flex-col items-center gap-2 pt-3 sm:pt-4">
                      <button
                        type="button"
                        onClick={(e) => handlePlayWord(e, word)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 shadow-sm transition-all duration-200 hover:scale-110 hover:bg-white sm:h-12 sm:w-12"
                        aria-label={`播放 ${word.word_cantonese || word.word}`}
                      >
                        <Volume2
                          className={cn(
                            "h-4.5 w-4.5 sm:h-5 sm:w-5",
                            (isPlaying || isAudioLoading) && "animate-pulse",
                          )}
                        />
                      </button>
                      {childId && (
                        <MemoryStarsProgress
                          exposureCount={word.exposureCount}
                          languagePreference={languagePreference}
                          variant="badge"
                          className="w-full max-w-full"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  }

  // ── CATEGORY GRID VIEW ──────────────────────────────────────────────────────
  return (
    <>
      <WordDetailModal
        word={selectedWord}
        onClose={() => setSelectedWord(null)}
        languagePreference={languagePreference}
        childId={childId}
        onProgressUpdate={handleProgressUpdate}
      />
      <div className="w-full rounded-[32px] border border-white/50 bg-white/80 p-4 shadow-sm backdrop-blur-md sm:rounded-[40px] sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2.5 sm:mb-6 sm:gap-3">
          <div className="rotate-3 rounded-xl bg-yellow-400 p-2 shadow-sm sm:rounded-2xl sm:p-2.5">
            <Sparkles className="h-5 w-5 fill-white text-white sm:h-6 sm:w-6" />
          </div>
          <div>
            <h2 className="child-tab-compact-title">{headerText}</h2>
            <p className="child-tab-compact-copy">{subHeaderText}</p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {categories.map((category) => {
            const categoryName = getCategoryName(category, languagePreference);
            const colorClasses = getColorClass(category.color);
            const bgColorClass = colorClasses.split(" ")[0];

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={cn(
                  "group relative flex h-40 flex-col items-center justify-start rounded-[24px] border-[3px] p-3.5 sm:h-56 sm:rounded-[28px] sm:p-5",
                  "transition-all duration-300 shadow-sm",
                  colorClasses,
                )}
              >
                <div
                  className={cn(
                    "mb-2.5 flex h-20 w-20 shrink-0 items-center justify-center rounded-[22px] border-3 border-white/60 shadow-sm sm:mb-3 sm:h-28 sm:w-28 sm:rounded-3xl",
                    bgColorClass,
                  )}
                >
                  <span className="text-4xl drop-shadow-sm filter transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 sm:text-6xl">
                    {category.icon}
                  </span>
                </div>

                {/* Name */}
                <span className="child-tab-card-title !mt-0 !text-center !text-base !leading-tight !text-blue-600 sm:!text-lg">
                  {categoryName}
                </span>

                {/* Word Count Tag */}
                <span className="child-tab-caption mt-1.5 rounded-full bg-white/40 px-2.5 py-1 !text-[11px] sm:mt-2 sm:px-3 sm:!text-sm">
                  {category.wordCount} 詞語
                </span>

                {/* Play Button Indicator (appears on hover) */}
                <div className="absolute bottom-2.5 right-2.5 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:bottom-3 sm:right-3">
                  <div className="bg-white rounded-full p-1.5 shadow-sm">
                    <Play className="h-3.5 w-3.5 fill-current sm:h-4 sm:w-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
