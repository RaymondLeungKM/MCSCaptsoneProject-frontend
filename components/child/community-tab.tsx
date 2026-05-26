"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Camera, RefreshCw, ImageOff, Volume2, Sparkles,
  GalleryHorizontalEnd, Loader2, Clock, CheckCircle2,
} from "lucide-react";
import type { Word, LanguagePreference } from "@/lib/types";
import type { WordResponse } from "@/lib/api/vocabulary";
import { getCapturedWords } from "@/lib/api/vocabulary";
import {
  submitCommunityPostFromCollection,
  getMyCommunityPosts,
  type CommunityPost,
} from "@/lib/api/community";
import { API_BASE_URL } from "@/lib/api/client";
import { useWordAudio } from "@/hooks/use-word-audio";
import { WordDetailModal } from "@/components/modals/word-detail-modal";
import { CommunityFeed } from "@/components/child/community-feed";
import { cn } from "@/lib/utils";
import { toChildFriendlyText } from "@/lib/child-text";

interface CommunityTabProps {
  childId: string;
  languagePreference?: LanguagePreference;
}

type SubTab = "mine" | "feed";

const isImageUrl = (v?: string) => !!v && (v.startsWith("http") || v.startsWith("/"));

function resolveImageUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function getCommunityTitle(post: CommunityPost): string {
  return (
    toChildFriendlyText(post.word_text_cantonese) ??
    toChildFriendlyText(post.word_text) ??
    "小發現"
  );
}

export function CommunityTab({ childId, languagePreference = "cantonese" }: CommunityTabProps) {
  const [subTab, setSubTab] = useState<SubTab>("mine");
  const [myWords, setMyWords] = useState<WordResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordResponse | null>(null);
  const { playWord, isPlaying } = useWordAudio();

  // ── Share / post state ──
  const [sharingWordId, setSharingWordId] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // ── My submissions (own posts + status) ──
  const [ownPosts, setOwnPosts] = useState<CommunityPost[]>([]);

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

  const loadOwnPosts = useCallback(async () => {
    try {
      const posts = await getMyCommunityPosts(childId);
      setOwnPosts(posts);
    } catch {
      // silently fail — not critical
    }
  }, [childId]);

  useEffect(() => {
    if (subTab === "mine") {
      void loadMyWords();
      void loadOwnPosts();
    }
  }, [subTab, loadMyWords, loadOwnPosts]);

  // ── Share selected word ──
  const handleShareWord = async (word: WordResponse) => {
    if (!isImageUrl(word.image_url)) {
      setShareError("呢張相片暫時未準備好，請揀另一張再試。");
      setTimeout(() => setShareError(null), 4000);
      return;
    }

    setSharingWordId(word.id);
    setShareSuccess(false);
    setShareError(null);
    try {
      const post = await submitCommunityPostFromCollection(childId, word.id);
      setOwnPosts((prev) => [post, ...prev.filter((item) => item.id !== post.id)]);
      setSelectedWord(null);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 5000);
    } catch {
      setShareError("提交失敗，請再試一次。");
      setTimeout(() => setShareError(null), 4000);
    } finally {
      setSharingWordId(null);
    }
  };

  const words = myWords;
  const alreadySharedWordIds = new Set([
    ...ownPosts
      .filter((post) => post.moderation_status === "pending" || post.moderation_status === "approved")
      .map((post) => post.word_id)
      .filter((wordId): wordId is string => Boolean(wordId)),
  ]);
  const pendingPosts = ownPosts.filter((post) => post.moderation_status === "pending");
  const approvedPosts = ownPosts.filter((post) => post.moderation_status === "approved");

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
    <div className="flex flex-col min-h-full pb-36 relative">
      {/* ── Header banner ── */}
      <div className="px-4 pt-5 pb-1">
        <div className="rounded-3xl bg-gradient-to-br from-teal-400 via-emerald-400 to-cyan-400 p-5 shadow-lg shadow-teal-200/50 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/20 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />
          <div className="relative flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/30 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white font-black text-2xl leading-tight">詞彙圖庫</h2>
                <p className="text-white/85 text-sm font-bold mt-1">點一下你的相片，再交畀家長審核分享！</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Success / error toast ── */}
      {shareSuccess && (
        <div className="mx-4 mt-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-emerald-700 font-bold text-base">
            🎉 相片已提交！等家長審核後就會出現囉！
          </p>
        </div>
      )}
      {shareError && (
        <div className="mx-4 mt-3 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3">
          <p className="text-rose-600 font-bold text-base">{shareError}</p>
        </div>
      )}

      {/* ── Sub-tab switcher ── */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
          <SubTabButton
            active={subTab === "mine"}
            onClick={() => setSubTab("mine")}
            icon={<Camera className="w-4 h-4" />}
            count={myWords.length}
            label="我的相片"
            description="自己拍的詞彙"
            activeColor="bg-teal-500"
          />
          <SubTabButton
            active={subTab === "feed"}
            onClick={() => setSubTab("feed")}
            icon={<Sparkles className="w-4 h-4" />}
            count={0}
            label="探索發現"
            description="大家的發現分享"
            activeColor="bg-pink-500"
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 pt-3">
        {subTab === "feed" && (
          <CommunityFeed childId={childId} languagePreference={languagePreference} />
        )}

        {subTab === "mine" && (
          <>
            {/* ── My Submissions section ── */}
            {ownPosts.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-xl flex items-center justify-center">
                    <GalleryHorizontalEnd className="w-4 h-4 text-pink-500" />
                  </div>
                  <h3 className="text-lg font-black text-slate-700">我的分享</h3>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {pendingPosts.map((post) => (
                    <div key={post.id}
                      className="shrink-0 w-40 rounded-[28px] border-[3px] border-amber-200 bg-[#fff8eb] p-3 shadow-sm">
                      <div className="flex h-28 items-center justify-center rounded-3xl border-[3px] border-white/70 bg-amber-50 p-2 overflow-hidden">
                        {isImageUrl(post.image_url) ? (
                          <img
                            src={resolveImageUrl(post.image_url)}
                            alt={getCommunityTitle(post)}
                            className="max-h-full max-w-full rounded-[18px] object-contain drop-shadow-sm"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Clock className="w-10 h-10 text-amber-400" />
                          </div>
                        )}
                      </div>
                      <div className="pt-3 text-center">
                        <p className="text-base font-black text-slate-700 truncate">
                          {getCommunityTitle(post)}
                        </p>
                        <span className="mt-2 inline-block text-sm font-black text-amber-600 bg-white rounded-full px-3 py-1 border border-amber-200">
                          ⏳ 等待審核
                        </span>
                      </div>
                    </div>
                  ))}
                  {/* Approved posts by this child */}
                  {approvedPosts.map((post) => (
                    <div key={post.id}
                      className="shrink-0 w-40 rounded-[28px] border-[3px] border-sky-200 bg-[#eef6ff] p-3 shadow-sm">
                      <div className="flex h-28 items-center justify-center rounded-3xl border-[3px] border-white/70 bg-white p-2 overflow-hidden">
                        {isImageUrl(post.image_url) ? (
                          <img
                            src={resolveImageUrl(post.image_url)}
                            alt={getCommunityTitle(post)}
                            className="max-h-full max-w-full rounded-[18px] object-contain drop-shadow-sm"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="pt-3 text-center">
                        <p className="text-base font-black text-slate-700 truncate">
                          {getCommunityTitle(post)}
                        </p>
                        <span className="mt-2 inline-block text-sm font-black text-emerald-600 bg-white rounded-full px-3 py-1 border border-emerald-200">
                          ✅ 已發佈
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── My Photo Words ── */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-teal-400">
                <div className="w-16 h-16 bg-teal-50 rounded-3xl flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <p className="text-base font-semibold text-teal-600">載入中…</p>
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

            {!loading && !error && words.length === 0 && <EmptyState />}

            {!loading && !error && words.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </>
        )}
      </div>

      {selectedWord && (
        <WordDetailModal
          word={toWord(selectedWord)}
          onClose={() => setSelectedWord(null)}
          languagePreference={languagePreference}
          childId={childId}
          footerAction={
            isImageUrl(selectedWord.image_url) ? (
              <button
                type="button"
                onClick={() => void handleShareWord(selectedWord)}
                disabled={sharingWordId === selectedWord.id || alreadySharedWordIds.has(selectedWord.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white shadow-md transition-all duration-200",
                  sharingWordId === selectedWord.id || alreadySharedWordIds.has(selectedWord.id)
                    ? "cursor-not-allowed bg-slate-300"
                    : "bg-linear-to-r from-pink-400 to-orange-400 hover:scale-105 active:scale-95",
                )}
              >
                {sharingWordId === selectedWord.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GalleryHorizontalEnd className="h-4 w-4" />
                )}
                {alreadySharedWordIds.has(selectedWord.id)
                  ? "已分享或等待審核"
                  : sharingWordId === selectedWord.id
                    ? "提交中..."
                    : "分享到社區"}
              </button>
            ) : null
          }
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
  description,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  count: number;
  label: string;
  description?: string;
  activeColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-between gap-2 py-4 px-4 rounded-xl transition-all duration-200",
        active ? `${activeColor} text-white shadow-sm` : "text-gray-500 hover:bg-gray-50",
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-left">
          <p className={cn("text-base font-black leading-tight", active ? "text-white" : "text-gray-700")}>
            {label}
          </p>
          {description && (
            <p className={cn("text-sm leading-tight mt-0.5 font-semibold", active ? "text-white/80" : "text-gray-400")}>
              {description}
            </p>
          )}
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
  const primary =
    toChildFriendlyText(showCantonese ? word.word_cantonese : undefined) ??
    toChildFriendlyText(word.word_cantonese) ??
    toChildFriendlyText(word.word) ??
    "相片詞語";
  const difficultyClass = DIFFICULTY_COLORS[word.difficulty] ?? DIFFICULTY_COLORS.easy;
  const difficultyLabel = DIFFICULTY_LABELS[word.difficulty] ?? "易";

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="group bg-white rounded-[28px] shadow-md hover:shadow-lg border border-gray-100 hover:border-teal-200 transition-all duration-200 hover:scale-[1.02] cursor-pointer overflow-hidden"
    >
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 p-3">
        {isImageUrl(word.image_url) ? (
          <div className="flex h-full w-full items-center justify-center rounded-[24px] bg-white/85 p-2 shadow-inner">
            <img
              src={resolveImageUrl(word.image_url)}
              alt={primary}
              className="max-h-full max-w-full rounded-[18px] object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.04]"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-6xl select-none drop-shadow-sm">📷</span>
          </div>
        )}

        <span className={cn(
          "absolute top-2.5 left-2.5 text-xs font-black px-2 py-0.5 rounded-full",
          difficultyClass,
        )}>
          {difficultyLabel}
        </span>

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

      <div className="px-5 py-4 space-y-1">
        <p className="font-black text-teal-900 text-2xl leading-tight truncate">
          {primary}
        </p>

        {word.jyutping && (
          <p className="text-teal-600 text-sm font-semibold truncate">{word.jyutping}</p>
        )}

        {word.definition_cantonese && (
          <p className="text-gray-500 text-sm leading-snug line-clamp-2 pt-0.5">
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5 text-center px-6">
      <div className="w-28 h-28 bg-teal-500 rounded-[36px] flex items-center justify-center shadow-md">
        <Camera className="w-14 h-14 text-white" />
      </div>
      <div className="max-w-sm">
        <p className="font-black text-white text-3xl drop-shadow-md">未有相片卡</p>
        <div className="bg-white/95 rounded-[28px] p-6 mt-4 shadow-xl border-2 border-teal-400">
          <p className="text-teal-950 font-black text-xl leading-relaxed">
            先用相機拍低身邊嘅物件
            <br />
            有自己嘅相片卡之後，再點開卡片交畀家長審核分享。
          </p>
        </div>
      </div>
    </div>
  );
}
