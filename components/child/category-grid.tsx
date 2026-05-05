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

  // Fetch words (with progress when childId is available) whenever a category is selected
  useEffect(() => {
    if (!selectedCategory) return;
    let cancelled = false;
    setIsLoadingWords(true);
    setWordsError(null);
    setCategoryWords([]);

    // For "My Collection" category, only fetch words uploaded by this specific child
    const isMyCollection = selectedCategory.name === "My Collection";
    const fetchFn = childId
      ? getWordsWithProgress(childId, selectedCategory.id, isMyCollection).then(
          (responses) => responses.map((r) => toWord(r, r.progress)),
        )
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
        <div className="bg-white/80 backdrop-blur-md rounded-[40px] p-6 md:p-8 shadow-sm border border-white/50 w-full animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Header – Back Button */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className="bg-white/70 hover:bg-white p-2 rounded-2xl shadow-sm border border-white/60 transition-all hover:scale-105 active:scale-95"
              aria-label="返回"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="text-3xl">{selectedCategory.icon}</span>
              <div>
                <h2 className="text-2xl font-black text-slate-700 tracking-tight leading-tight">
                  {catName}
                </h2>
                <p className="text-xs font-bold text-slate-400">
                  {isLoadingWords
                    ? "載入中…"
                    : `${categoryWords.length} 個詞語`}
                </p>
              </div>
            </div>
          </div>

          {/* Loading Skeletons */}
          {isLoadingWords && (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-[28px] bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Error */}
          {wordsError && !isLoadingWords && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">😕</p>
              <p className="text-slate-500 font-bold text-sm">{wordsError}</p>
            </div>
          )}

          {/* Empty */}
          {!isLoadingWords && !wordsError && categoryWords.length === 0 && (
            <div className="text-center py-12">
              <p className="text-5xl mb-3">🔍</p>
              <p className="text-slate-500 font-bold text-sm">暫時還沒有詞語</p>
            </div>
          )}

          {/* Word Grid */}
          {!isLoadingWords && categoryWords.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
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
                      "group relative flex flex-col items-center justify-start p-4 h-44 rounded-[28px] border-[3px]",
                      "cursor-pointer transition-all duration-300 shadow-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                      colorClass,
                      word.mastered && "ring-2 ring-green-400 ring-offset-1",
                    )}
                  >
                    {/* Mastered badge */}
                    {word.mastered && (
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-green-400 flex items-center justify-center shadow-sm">
                        <Check
                          className="w-3.5 h-3.5 text-white"
                          strokeWidth={3}
                        />
                      </div>
                    )}
                    {/* Image / Emoji */}
                    <div
                      className={cn(
                        "w-20 h-20 rounded-2xl flex items-center justify-center mb-2 overflow-hidden shrink-0",
                        bgColorClass,
                        "border-2 border-white/60 shadow-sm",
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
                        <span className="text-4xl">{word.image || "📝"}</span>
                      )}
                    </div>

                    {/* Word Label */}
                    <span className="text-base font-black tracking-tight text-center leading-tight">
                      {wordText}
                    </span>

                    {/* Jyutping */}
                    {word.jyutping && (
                      <span className="mt-1 px-2 py-0.5 rounded-full bg-white/40 text-[10px] font-bold tracking-wide">
                        {word.jyutping}
                      </span>
                    )}

                    {childId && (
                      <MemoryStarsProgress
                        exposureCount={word.exposureCount}
                        languagePreference={languagePreference}
                        variant="badge"
                        className="mt-2"
                      />
                    )}

                    {/* Audio Button */}
                    <button
                      type="button"
                      onClick={(e) => handlePlayWord(e, word)}
                      className="absolute bottom-3 right-3 bg-white/70 hover:bg-white rounded-full p-1.5 shadow-sm transition-all duration-200 hover:scale-110"
                      aria-label={`播放 ${word.word_cantonese || word.word}`}
                    >
                      <Volume2
                        className={cn(
                          "w-4 h-4",
                          (isPlaying || isAudioLoading) && "animate-pulse",
                        )}
                      />
                    </button>
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
      <div className="bg-white/80 backdrop-blur-md rounded-[40px] p-6 md:p-8 shadow-sm border border-white/50 w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-yellow-400 p-2.5 rounded-2xl shadow-sm rotate-3">
            <Sparkles className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-700 tracking-tight">
              {headerText}
            </h2>
            <p className="text-sm font-bold text-slate-400">{subHeaderText}</p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4">
          {categories.map((category) => {
            const categoryName = getCategoryName(category, languagePreference);
            const colorClasses = getColorClass(category.color);

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={cn(
                  "group relative flex flex-col items-center justify-center p-4 h-44 rounded-4xl border-[3px]",
                  "transition-all duration-300 shadow-sm",
                  colorClasses,
                )}
              >
                {/* Icon */}
                <span className="text-5xl mb-3 drop-shadow-sm filter transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  {category.icon}
                </span>

                {/* Name */}
                <span className="text-lg font-black tracking-tight text-center leading-tight">
                  {categoryName}
                </span>

                {/* Word Count Tag */}
                <span className="mt-2 px-2.5 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase tracking-wide">
                  {category.wordCount} 詞語
                </span>

                {/* Play Button Indicator (appears on hover) */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <div className="bg-white rounded-full p-1.5 shadow-sm">
                    <Play className="w-4 h-4 fill-current" />
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
