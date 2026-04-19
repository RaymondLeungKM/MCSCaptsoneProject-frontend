"use client";

/**
 * CommunityFeed – Epic 10.1 (Phase 10)
 *
 * Kid-friendly discovery feed showing approved community photo check-ins.
 * - Anonymised: no real names or locations shown
 * - Children can star posts
 * - Parents can share photos by picking from the child's existing My Collection
 *   (no new file uploads – reuses photos already in the vocabulary)
 */

import { useEffect, useState } from "react";
import {
  Star,
  GalleryHorizontalEnd,
  Loader2,
  ImageOff,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getCommunityFeed,
  reactToPost,
  removeReaction,
  submitCommunityPostFromCollection,
  type CommunityPost,
} from "@/lib/api/community";
import { getWordsWithProgress, toWord } from "@/lib/api/vocabulary";
import type { Word } from "@/lib/types";
import { API_BASE_URL } from "@/lib/api/client";

interface CommunityFeedProps {
  childId: string;
  languagePreference?: "cantonese" | "english" | "bilingual";
}

function resolveImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

const isImageUrl = (value?: string) =>
  !!value && (value.startsWith("http") || value.startsWith("/"));

export function CommunityFeed({
  childId,
  languagePreference = "cantonese",
}: CommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactedIds, setReactedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Collection picker state
  const [showPicker, setShowPicker] = useState(false);
  const [collectionWords, setCollectionWords] = useState<Word[]>([]);
  const [loadingCollection, setLoadingCollection] = useState(false);

  // ─── Load Feed ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCommunityFeed({ limit: 30 });
        if (!cancelled) setPosts(data);
      } catch {
        if (!cancelled) setError("無法載入社區動態，請稍後再試。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Star / Un-star ─────────────────────────────────────────────────────────
  const handleReact = async (postId: string) => {
    const alreadyReacted = reactedIds.has(postId);
    // Optimistic update
    setReactedIds((prev) => {
      const next = new Set(prev);
      if (alreadyReacted) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              reaction_count: p.reaction_count + (alreadyReacted ? -1 : 1),
            }
          : p,
      ),
    );

    try {
      if (alreadyReacted) {
        await removeReaction(postId, childId);
      } else {
        await reactToPost(postId, childId);
      }
    } catch {
      // Rollback optimistic update on error
      setReactedIds((prev) => {
        const next = new Set(prev);
        if (alreadyReacted) next.add(postId);
        else next.delete(postId);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                reaction_count: p.reaction_count + (alreadyReacted ? 1 : -1),
              }
            : p,
        ),
      );
    }
  };

  // ─── Open Collection Picker ─────────────────────────────────────────────────
  const openPicker = async () => {
    setShowPicker(true);
    if (collectionWords.length > 0) return; // use cached list
    setLoadingCollection(true);
    try {
      const responses = await getWordsWithProgress(childId, undefined, true);
      const words = responses
        .map((r) => toWord(r, r.progress))
        .filter((w) => isImageUrl(w.image));
      setCollectionWords(words);
    } catch {
      setError("無法載入我的收藏，請稍後再試。");
      setShowPicker(false);
    } finally {
      setLoadingCollection(false);
    }
  };

  // ─── Pick & Submit ──────────────────────────────────────────────────────────
  const handlePickWord = async (word: Word) => {
    setShowPicker(false);
    setSubmitting(true);
    setSubmitSuccess(false);
    try {
      await submitCommunityPostFromCollection(childId, word.id);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch {
      setError("提交失敗，請再試一次。");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-pink-400 p-2.5 rounded-xl -rotate-3 shadow-sm">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-700">小朋友的發現</h2>
            <p className="text-sm font-bold text-slate-400">
              看看其他人找到甚麼！
            </p>
          </div>
        </div>

        {/* Pick from My Collection button */}
        <button
          onClick={() => void openPicker()}
          disabled={submitting}
          className={cn(
            "flex items-center gap-2 bg-linear-to-r from-pink-400 to-orange-400",
            "text-white px-4 py-2.5 rounded-full font-black text-sm shadow-md",
            "hover:scale-105 active:scale-95 transition-all",
            submitting && "opacity-60 cursor-not-allowed",
          )}
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <GalleryHorizontalEnd className="w-4 h-4" />
          )}
          {languagePreference === "english" ? "Share a Find!" : "分享發現！"}
        </button>
      </div>

      {/* Collection Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-4xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-700">
                  {languagePreference === "english"
                    ? "Pick from My Collection"
                    : "選擇我的收藏"}
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">
                  {languagePreference === "english"
                    ? "Choose a photo to share with friends!"
                    : "選一張相片與大家分享！"}
                </p>
              </div>
              <button
                onClick={() => setShowPicker(false)}
                className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-all"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-4 flex-1">
              {loadingCollection ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
                </div>
              ) : collectionWords.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-5xl mb-3">📸</p>
                  <p className="text-slate-500 font-bold text-sm">
                    {languagePreference === "english"
                      ? "No photos in your collection yet!"
                      : "你的收藏還沒有相片！"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {collectionWords.map((word) => (
                    <button
                      key={word.id}
                      onClick={() => void handlePickWord(word)}
                      className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-pink-400 transition-all hover:scale-105 bg-slate-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveImageUrl(word.image)}
                        alt={word.word_cantonese || word.word}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent px-2 py-1.5">
                        <p className="text-white text-[10px] font-black truncate text-center">
                          {word.word_cantonese || word.word}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit success notice */}
      {submitSuccess && (
        <Alert className="bg-green-50 border-green-200 rounded-2xl">
          <AlertDescription className="text-green-700 font-bold">
            🎉{" "}
            {languagePreference === "english"
              ? "Photo submitted! A grown-up will review it first."
              : "相片已提交！等家長審核後就會出現囉！"}
          </AlertDescription>
        </Alert>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-52 rounded-3xl bg-white/60 animate-pulse border-2 border-white"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && posts.length === 0 && (
        <div className="bg-white/60 backdrop-blur-md rounded-[40px] p-12 text-center border border-white/50 shadow-sm">
          <div className="bg-pink-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-pink-400" />
          </div>
          <h3 className="text-xl font-black text-slate-700 mb-2">
            {languagePreference === "english"
              ? "No discoveries yet!"
              : "還沒有發現！"}
          </h3>
          <p className="text-slate-500 font-bold text-sm">
            {languagePreference === "english"
              ? "Be the first to share a photo!"
              : "成為第一個分享相片的人吧！"}
          </p>
        </div>
      )}

      {/* Feed grid */}
      {!loading && posts.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {posts.map((post) => {
            const starred = reactedIds.has(post.id);
            return (
              <div
                key={post.id}
                className="relative bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden border-2 border-white shadow-md group"
              >
                {/* Image */}
                <div className="aspect-square overflow-hidden bg-slate-100">
                  {post.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveImageUrl(post.image_url)}
                      alt={post.word_text || "Discovery"}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-10 h-10 text-slate-300" />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    {post.word_text_cantonese || post.word_text ? (
                      <p className="font-black text-slate-700 text-sm truncate">
                        {post.word_text_cantonese || post.word_text}
                      </p>
                    ) : null}
                    {post.caption && (
                      <p className="text-slate-400 text-xs font-bold truncate">
                        {post.caption}
                      </p>
                    )}
                  </div>

                  {/* Star button */}
                  <button
                    onClick={() => void handleReact(post.id)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-black transition-all",
                      starred
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-slate-100 text-slate-400 hover:bg-yellow-50 hover:text-yellow-500",
                    )}
                  >
                    <Star
                      className={cn(
                        "w-3.5 h-3.5",
                        starred && "fill-yellow-500",
                      )}
                    />
                    {post.reaction_count}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
