"use client";

import { useState, useEffect, useCallback } from "react";
import { Camera, Users, RefreshCw, ImageOff, Volume2, Sparkles } from "lucide-react";
import type { Word, LanguagePreference } from "@/lib/types";
import type { WordResponse } from "@/lib/api/vocabulary";
import { getCapturedWords, getCommunityWords } from "@/lib/api/vocabulary";
import { useWordAudio } from "@/hooks/use-word-audio";
import { WordDetailModal } from "@/components/modals/word-detail-modal";
import { cn } from "@/lib/utils";

interface CommunityTabProps {
  childId: string;
  languagePreference?: LanguagePreference;
}

type SubTab = "mine" | "community";

const isImageUrl = (v?: string) => !!v && (v.startsWith("http") || v.startsWith("/"));

export function CommunityTab({ childId, languagePreference = "cantonese" }: CommunityTabProps) {
  const [subTab, setSubTab] = useState<SubTab>("mine");
  const [myWords, setMyWords] = useState<WordResponse[]>([]);
  const [communityWords, setCommunityWords] = useState<WordResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordResponse | null>(null);
  const { playWord, isPlaying } = useWordAudio();

  const showCantonese = languagePreference === "cantonese" || languagePreference === "bilingual";

  const loadMyWords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const words = await getCapturedWords(childId, { limit: 50, includeMongodb: false });
      setMyWords(words);
    } catch {
      setError("無法載入相片詞彙，請再試。");
    } finally {
      setLoading(false);
    }
  }, [childId]);

  const loadCommunityWords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const words = await getCommunityWords(50);
      setCommunityWords(words);
    } catch {
      setError("無法載入社區詞彙，請再試。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (subTab === "mine") {
      loadMyWords();
    } else {
      loadCommunityWords();
    }
  }, [subTab, loadMyWords, loadCommunityWords]);

  const words = subTab === "mine" ? myWords : communityWords;

  // Convert WordResponse → Word shape for WordDetailModal
  const toWord = (w: WordResponse): Word => ({
    id: w.id,
    word: w.word,
    word_cantonese: w.word_cantonese,
    jyutping: w.jyutping,
    category: w.category,
    pronunciation: w.pronunciation ?? "",
    definition: w.definition,
    definition_cantonese: w.definition_cantonese,
    example: w.example,
    example_cantonese: w.example_cantonese,
    difficulty: w.difficulty,
    physicalAction: w.physical_action,
    image: w.image_url ?? "",
    audio_url: w.audio_url,
    audio_url_english: w.audio_url_english,
    contexts: w.contexts,
    relatedWords: w.related_words,
    exposureCount: w.total_exposures,
    mastered: false,
  });

  return (
    <div className="flex flex-col min-h-full pb-36">
      {/* ── Header banner ── */}
      <div className="px-4 pt-5 pb-1">
        <div className="rounded-3xl bg-gradient-to-br from-teal-400 via-emerald-400 to-cyan-400 p-5 shadow-lg shadow-teal-200/50 relative overflow-hidden">
          {/* decorative blobs */}
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/20 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />

          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 bg-white/30 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-black text-xl leading-tight">詞彙圖庫</h2>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-tab switcher ── */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
          <SubTabButton
            active={subTab === "mine"}
            onClick={() => setSubTab("mine")}
            icon={<Camera className="w-4 h-4" />}
            count={myWords.length}
            label="我的相片"
            activeColor="bg-teal-500"
          />
          <SubTabButton
            active={subTab === "community"}
            onClick={() => setSubTab("community")}
            icon={<Users className="w-4 h-4" />}
            count={communityWords.length}
            label="社區詞彙"
            activeColor="bg-emerald-500"
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 pt-3">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-teal-400">
            <div className="w-16 h-16 bg-teal-50 rounded-3xl flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-teal-600">載入中…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center">
              <ImageOff className="w-8 h-8 text-rose-400" />
            </div>
            <p className="text-sm font-semibold text-rose-500 text-center">{error}</p>
          </div>
        )}

        {!loading && !error && words.length === 0 && <EmptyState subTab={subTab} />}

        {!loading && !error && words.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {words.map((word) => (
              <WordTile
                key={word.id}
                word={word}
                showCantonese={showCantonese}
                onPlay={() => void playWord(toWord(word), { languagePreference })}
                onClick={() => setSelectedWord(word)}
                isPlaying={isPlaying}
              />
            ))}
          </div>
        )}
      </div>

      {selectedWord && (
        <WordDetailModal
          word={toWord(selectedWord)}
          onClose={() => setSelectedWord(null)}
          languagePreference={languagePreference}
          childId={childId}
        />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Sub-tab button
────────────────────────────────────────────────────────── */

function SubTabButton({
  active,
  onClick,
  icon,
  count,
  label,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  count: number;
  label: string;
  activeColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-between gap-2 py-3 px-4 rounded-xl transition-all duration-200",
        active ? `${activeColor} text-white shadow-sm` : "text-gray-500 hover:bg-gray-50",
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-left">
          <p className={cn("text-sm font-bold leading-tight", active ? "text-white" : "text-gray-700")}>
            {label}
          </p>
        </div>
      </div>
      {count > 0 && (
        <span className={cn(
          "text-xs font-black px-2 py-0.5 rounded-full min-w-[24px] text-center",
          active ? "bg-white/30 text-white" : "bg-teal-100 text-teal-700",
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────
   Word tile — redesigned for readability
────────────────────────────────────────────────────────── */

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-700",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "易",
  medium: "中",
  hard: "難",
};

function WordTile({
  word,
  showCantonese,
  onPlay,
  onClick,
  isPlaying,
}: {
  word: WordResponse;
  showCantonese: boolean;
  onPlay: () => void;
  onClick: () => void;
  isPlaying: boolean;
}) {
  const primary = showCantonese && word.word_cantonese ? word.word_cantonese : word.word;
  const difficultyClass = DIFFICULTY_COLORS[word.difficulty] ?? DIFFICULTY_COLORS.easy;
  const difficultyLabel = DIFFICULTY_LABELS[word.difficulty] ?? "易";

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="group bg-white rounded-[24px] shadow-md hover:shadow-lg border border-gray-100 hover:border-teal-200 transition-all duration-200 hover:scale-[1.02] cursor-pointer overflow-hidden"
    >
      {/* ── Image area ── */}
      <div className="relative h-36 bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 flex items-center justify-center overflow-hidden">
        {isImageUrl(word.image_url) ? (
          <img
            src={word.image_url}
            alt={word.word}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-6xl select-none drop-shadow-sm">📷</span>
          </div>
        )}

        {/* Difficulty badge */}
        <span className={cn(
          "absolute top-2.5 left-2.5 text-xs font-black px-2 py-0.5 rounded-full",
          difficultyClass,
        )}>
          {difficultyLabel}
        </span>

        {/* Play audio button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          className={cn(
            "absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-150",
            isPlaying
              ? "bg-teal-500 text-white scale-110"
              : "bg-white/95 text-teal-600 hover:bg-teal-500 hover:text-white",
          )}
          aria-label="播放發音"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {/* ── Text area ── */}
      <div className="px-4 py-3 space-y-0.5">
        {/* Primary label (Cantonese or English) */}
        <p className="font-black text-teal-900 text-lg leading-tight truncate">
          {primary}
        </p>

        {/* Jyutping romanization */}
        {word.jyutping && (
          <p className="text-teal-600 text-xs font-semibold truncate">{word.jyutping}</p>
        )}

        {/* Definition snippet */}
        {word.definition_cantonese && (
          <p className="text-gray-500 text-xs leading-snug line-clamp-2 pt-0.5">
            {word.definition_cantonese}
          </p>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Empty state
────────────────────────────────────────────────────────── */

function EmptyState({ subTab }: { subTab: SubTab }) {
  if (subTab === "mine") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5 text-center px-6">
        <div className="w-24 h-24 bg-teal-500 rounded-[32px] flex items-center justify-center shadow-md">
          <Camera className="w-12 h-12 text-white" />
        </div>
        <div className="max-w-xs">
          <p className="font-black text-white text-2xl drop-shadow-md">未有相片詞彙</p>
          <div className="bg-white/95 rounded-2xl p-5 mt-4 shadow-xl border-2 border-teal-400">
            <p className="text-teal-950 font-black text-lg leading-relaxed">
              用相機拍攝身邊嘅物件
              <br />
              就可以學習廣東話詞彙！
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5 text-center px-6">
      <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center shadow-md">
        <Users className="w-12 h-12 text-white" />
      </div>
      <div className="max-w-xs">
        <p className="font-black text-white text-2xl drop-shadow-md">社區詞彙庫</p>
        <div className="bg-white/95 rounded-2xl p-5 mt-4 shadow-xl border-2 border-emerald-400">
          <p className="text-emerald-950 font-black text-lg leading-relaxed">
            其他小朋友分享嘅詞彙
            <br />
            將會在這裡出現！
          </p>
        </div>
      </div>
    </div>
  );
}
