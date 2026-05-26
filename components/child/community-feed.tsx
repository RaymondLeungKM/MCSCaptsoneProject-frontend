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
  ImageOff,
  Trophy,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toChildFriendlyText } from "@/lib/child-text";
import {
  getCommunityFeed,
  reactToPost,
  removeReaction,
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

const isImageUrl = (value?: string) =>
  !!value && (value.startsWith("http") || value.startsWith("/"));

function getPostTitle(post: CommunityPost): string {
  return (
    toChildFriendlyText(post.word_text_cantonese) ??
    toChildFriendlyText(post.word_text) ??
    "小發現"
  );
}

function getPostCaption(post: CommunityPost, title: string): string | null {
  const caption = toChildFriendlyText(post.caption);
  if (!caption || caption === title) {
    return null;
  }

  return caption;
}

export function CommunityFeed({
  childId,
  languagePreference = "cantonese",
}: CommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactedIds, setReactedIds] = useState<Set<string>>(new Set());

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

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
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
      </div>

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
          <h3 className="text-xl font-black text-slate-700 mb-2">還沒有發現！</h3>
          <p className="text-slate-500 font-bold text-sm">
            先到「我的相片」揀相，再分享發現吧！
          </p>
        </div>
      )}

      {/* Feed grid */}
      {!loading && posts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {posts.map((post) => {
            const starred = reactedIds.has(post.id);
            const title = getPostTitle(post);
            const caption = getPostCaption(post, title);
            return (
              <div
                key={post.id}
                className="group overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-md transition-all duration-200 hover:border-sky-200 hover:shadow-lg"
              >
                <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-3 sm:h-44">
                  {isImageUrl(post.image_url) ? (
                    <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-white/85 p-2 shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveImageUrl(post.image_url)}
                        alt={title}
                        className="max-h-full max-w-full rounded-[18px] object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-10 h-10 text-slate-300" />
                    </div>
                  )}

                  <button
                    onClick={() => void handleReact(post.id)}
                    className={cn(
                      "absolute top-3 right-3 shrink-0 flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-black transition-all shadow-sm",
                      starred
                        ? "border-yellow-200 bg-yellow-100 text-yellow-600"
                        : "border-white bg-white/95 text-slate-400 hover:bg-yellow-50 hover:text-yellow-500",
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

                <div className="px-5 py-4 space-y-1">
                  <div className="min-w-0">
                    <p className="text-2xl font-black tracking-tight text-slate-700 truncate">
                      {title}
                    </p>
                    {caption && (
                      <p className="mt-2 text-sm font-bold text-slate-500 line-clamp-2 break-all">
                        {caption}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
