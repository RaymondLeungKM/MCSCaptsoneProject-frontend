"use client";

/**
 * CommunityFeed – Epic 10.1 (Phase 10)
 *
 * Kid-friendly discovery feed showing approved community photo check-ins.
 * - Anonymised: no real names or locations shown
 * - Children can star posts
 * - Parents can submit new photo check-ins from this view
 */

import { useEffect, useState, useRef } from "react";
import { Star, Camera, Loader2, ImageOff, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getCommunityFeed,
  reactToPost,
  removeReaction,
  submitCommunityPost,
  type CommunityPost,
} from "@/lib/api/community";
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

export function CommunityFeed({
  childId,
  languagePreference = "cantonese",
}: CommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactedIds, setReactedIds] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ─── Photo Submission ────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadSuccess(false);
    try {
      await submitCommunityPost(childId, file);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch {
      setError("上傳失敗，請再試一次。");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

        {/* Upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex items-center gap-2 bg-linear-to-r from-pink-400 to-orange-400",
            "text-white px-4 py-2.5 rounded-full font-black text-sm shadow-md",
            "hover:scale-105 active:scale-95 transition-all",
            uploading && "opacity-60 cursor-not-allowed",
          )}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          {languagePreference === "english" ? "Share a Find!" : "分享發現！"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Upload success notice */}
      {uploadSuccess && (
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
