"use client";

/**
 * SocialTab – Epic 10.2 (Phase 10)
 *
 * Parent Social Networking tab with:
 *   • Pending community post moderation
 *   • Friend connections & friend requests
 *   • Shared progress dashboard
 *   • Community challenges & leaderboards
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  UserPlus,
  Shield,
  Trophy,
  CheckCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Flame,
  BookOpen,
  Star,
  Search,
  Copy,
  Hash,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPendingPosts,
  moderatePost,
  getFriends,
  getFriendChallenges,
  sendFriendRequest,
  searchUserById,
  sendFriendRequestById,
  respondToFriendRequest,
  respondToFriendChallenge,
  getFriendsProgress,
  getCommunityFeed,
  getChallenges,
  getChallengeLeaderboard,
  createFriendChallenge,
  type CommunityPost,
  type Friendship,
  type FriendProgress,
  type UserSearchResult,
  type CommunityChallenge,
  type ChallengeParticipation,
  type FriendChallenge,
  type FriendChallengeMetric,
  type FriendChallengeViewStatus,
} from "@/lib/api/community";
import { API_BASE_URL } from "@/lib/api/client";
import { getChildren, type ChildResponse } from "@/lib/api/children";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function daysLeft(endAt: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(endAt).getTime() - Date.now()) / 86_400_000),
  );
}

function resolveFriendIdentity(
  friendship: Friendship,
  currentUserId?: string | null,
) {
  return friendship.requester_id === currentUserId
    ? { name: friendship.addressee_name ?? "好友", id: friendship.addressee_id }
    : {
        name: friendship.requester_name ?? "好友",
        id: friendship.requester_id,
      };
}

function friendChallengeMetricLabel(metricType: FriendChallengeMetric): string {
  switch (metricType) {
    case "practice_days":
      return "練習天數";
    case "new_words":
      return "新學詞語";
    case "active_words":
      return "主動活用";
  }
}

function friendChallengeTargetUnit(metricType: FriendChallengeMetric): string {
  return metricType === "practice_days" ? "天" : "個";
}

function friendChallengeStatusLabel(status: FriendChallengeViewStatus): string {
  switch (status) {
    case "pending":
      return "待回覆";
    case "active":
      return "進行中";
    case "completed":
      return "已完成";
    case "expired":
      return "已結束";
    case "declined":
      return "已拒絕";
  }
}

// ===========================================================================
// Sub-components
// ===========================================================================

// ---------------------------------------------------------------------------
// ModerationPanel
// ---------------------------------------------------------------------------

function ModerationPanel() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setPosts(await getPendingPosts());
      } catch (err) {
        console.warn("[Moderation] Failed to load pending posts:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handle = async (postId: string, status: "approved" | "rejected") => {
    setActing(postId);
    try {
      await moderatePost(postId, status);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      // ignore
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <Shield className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-bold">沒有待審核的相片</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="rounded-[20px] border-none shadow-sm">
          <CardContent className="p-4 flex gap-4 items-start">
            {post.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveImageUrl(post.image_url)}
                alt="待審照片"
                className="w-20 h-20 rounded-2xl object-cover shrink-0 border-2 border-white shadow"
              />
            )}

            <div className="flex-1 min-w-0">
              {post.word_text_cantonese && (
                <p className="font-black text-slate-700 text-lg">
                  {post.word_text_cantonese}
                </p>
              )}
              {post.word_text && (
                <p className="text-slate-500 text-sm font-bold">
                  {post.word_text}
                </p>
              )}
              {post.caption && (
                <p className="text-slate-400 text-xs mt-1 italic">
                  「{post.caption}」
                </p>
              )}
              <p className="text-xs text-slate-300 mt-1">
                {new Date(post.created_at).toLocaleString("zh-HK")}
              </p>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => void handle(post.id, "approved")}
                disabled={acting === post.id}
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl gap-1"
              >
                {acting === post.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ThumbsUp className="w-3 h-3" />
                )}
                批准
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handle(post.id, "rejected")}
                disabled={acting === post.id}
                className="border-red-200 text-red-500 hover:bg-red-50 rounded-xl gap-1"
              >
                <ThumbsDown className="w-3 h-3" />
                拒絕
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChildPhotoGrid – lazy-loads approved community posts for one child
// ---------------------------------------------------------------------------

function ChildPhotoGrid({ childId }: { childId?: string }) {
  // childId is not available from FriendChildStats (privacy) – if absent skip
  if (!childId) return null;

  const [photos, setPhotos] = useState<CommunityPost[] | null>(null);

  useEffect(() => {
    void getCommunityFeed({ childId, limit: 6 })
      .then(setPhotos)
      .catch(() => setPhotos([]));
  }, [childId]);

  if (photos === null) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
      </div>
    );
  }

  if (photos.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-2">
        最新拍攝
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {photos.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <div
            key={p.id}
            className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100"
          >
            <img
              src={resolveImageUrl(p.image_url)}
              alt={p.word_text_cantonese ?? p.word_text ?? ""}
              className="w-full h-full object-cover"
            />
            {(p.word_text_cantonese || p.word_text) && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-1.5 py-1">
                <p className="text-white text-[9px] font-black truncate">
                  {p.word_text_cantonese ?? p.word_text}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FriendProfileModal
// ---------------------------------------------------------------------------

// Gradient palettes cycling per child index
const CHILD_GRADIENTS = [
  "from-violet-500 to-blue-500",
  "from-rose-400 to-orange-400",
  "from-emerald-400 to-teal-500",
  "from-fuchsia-500 to-pink-400",
];

function FriendProfileModal({
  progress,
  onClose,
}: {
  progress: FriendProgress;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const totalWords = progress.children_stats.reduce(
    (s, c) => s + c.words_learned,
    0,
  );
  const bestStreak = Math.max(
    0,
    ...progress.children_stats.map((c) => c.current_streak),
  );

  if (!mounted) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes fp-backdrop { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fp-slide-up { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
      <div
        className="fixed inset-0 bg-black/55 z-9999 flex items-end backdrop-blur-sm"
        style={{ animation: "fp-backdrop 0.25s ease" }}
        onClick={onClose}
      >
        <div
          ref={sheetRef}
          className="w-full h-[92dvh] bg-white/96 backdrop-blur-xl rounded-t-3xl flex flex-col shadow-2xl"
          style={{
            animation: "fp-slide-up 0.38s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-slate-300 rounded-full" />
          </div>
          <div className="relative bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 mx-3 rounded-3xl px-5 pt-5 pb-6 mb-4 shadow-lg overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-4 w-20 h-20 bg-white/10 rounded-full" />

            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Avatar + name */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 bg-white/25 rounded-2xl flex items-center justify-center font-black text-white text-3xl shadow-inner">
                {progress.friend_name[0]}
              </div>
              <div>
                <p className="font-black text-white text-xl leading-tight">
                  {progress.friend_name}
                </p>
                <p className="text-white/70 text-sm font-bold mt-0.5">
                  {progress.children_stats.length} 個小朋友
                </p>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/20 rounded-2xl px-3 py-2.5 text-center">
                <p className="text-2xl font-black text-white">{totalWords}</p>
                <p className="text-[10px] text-white/70 font-bold mt-0.5 flex items-center justify-center gap-0.5">
                  <BookOpen className="w-2.5 h-2.5" />
                  總詞彙量
                </p>
              </div>
              <div className="bg-white/20 rounded-2xl px-3 py-2.5 text-center">
                <p className="text-2xl font-black text-white">{bestStreak}</p>
                <p className="text-[10px] text-white/70 font-bold mt-0.5 flex items-center justify-center gap-0.5">
                  <Flame className="w-2.5 h-2.5" />
                  最長連勝
                </p>
              </div>
              <div className="bg-white/20 rounded-2xl px-3 py-2.5 text-center">
                <p className="text-2xl font-black text-white">
                  {Math.max(0, ...progress.children_stats.map((c) => c.level))}
                </p>
                <p className="text-[10px] text-white/70 font-bold mt-0.5 flex items-center justify-center gap-0.5">
                  <Star className="w-2.5 h-2.5" />
                  最高等級
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 pb-6 space-y-4 px-3">
            {progress.children_stats.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm">好友還未添加小朋友</p>
              </div>
            ) : (
              progress.children_stats.map((child, i) => {
                const gradient = CHILD_GRADIENTS[i % CHILD_GRADIENTS.length];
                return (
                  <div
                    key={i}
                    className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-slate-100"
                  >
                    {/* Child header strip */}
                    <div
                      className={`bg-linear-to-r ${gradient} px-4 py-3 flex items-center gap-3`}
                    >
                      <span className="text-4xl leading-none drop-shadow">
                        {child.avatar}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-white text-base">
                            {child.child_name}
                          </p>
                          <span className="text-[10px] bg-white/25 text-white font-black rounded-full px-2 py-0.5">
                            Lv.{child.level}
                          </span>
                        </div>
                        <p className="text-white/70 text-xs font-bold">
                          {child.age} 歲
                        </p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                      <div className="py-3 text-center">
                        <p className="text-2xl font-black text-blue-500">
                          {child.words_learned}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-0.5 mt-0.5">
                          <BookOpen className="w-2.5 h-2.5" />
                          已學詞語
                        </p>
                      </div>
                      <div className="py-3 text-center">
                        <p className="text-2xl font-black text-orange-500">
                          {child.current_streak}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-0.5 mt-0.5">
                          <Flame className="w-2.5 h-2.5" />
                          連勝天數
                        </p>
                      </div>
                      <div className="py-3 text-center">
                        <p className="text-2xl font-black text-purple-500">
                          {child.level}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-0.5 mt-0.5">
                          <Star className="w-2.5 h-2.5" />
                          學習等級
                        </p>
                      </div>
                    </div>

                    {/* Recent words */}
                    {child.recent_words.length > 0 && (
                      <div className="px-4 pt-3 pb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-2">
                          最近學習
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {child.recent_words.map((w, wi) => (
                            <span
                              key={wi}
                              className="text-xs bg-blue-50 border border-blue-100 text-blue-600 font-bold rounded-full px-2.5 py-1"
                            >
                              {w}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Community photos – loaded lazily; child_id not in stats */}
                    {/* Photos section omitted – child IDs are not exposed in privacy-safe stats */}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// FriendsPanel  (merged with progress dashboard)
// ---------------------------------------------------------------------------

function FriendsPanel() {
  const { user: currentUser } = useAuth();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [progressMap, setProgressMap] = useState<
    Record<string, FriendProgress>
  >({});
  const [pendingIncoming, setPendingIncoming] = useState<Friendship[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<Friendship[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<FriendProgress | null>(
    null,
  );
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );
  const [responding, setResponding] = useState<string | null>(null);
  // User-ID search
  const [searchId, setSearchId] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<UserSearchResult | null>(null);
  const [searchMsg, setSearchMsg] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);
  const [sendingById, setSendingById] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [allFriends, progressList] = await Promise.all([
        getFriends(true),
        getFriendsProgress().catch(() => [] as FriendProgress[]),
      ]);
      setFriends(allFriends.filter((f) => f.status === "accepted"));
      const pending = allFriends.filter((f) => f.status === "pending");
      setPendingIncoming(
        pending.filter((f) => f.addressee_id === currentUser?.id),
      );
      setPendingOutgoing(
        pending.filter((f) => f.requester_id === currentUser?.id),
      );
      const map: Record<string, FriendProgress> = {};
      for (const p of progressList) map[p.friend_id] = p;
      setProgressMap(map);
    } catch (err) {
      console.warn("[Social] Failed to load friends:", err);
    } finally {
      setLoading(false);
    }
  };

  /** Derive the other person's display name and id from a friendship record */
  const getFriendInfo = (f: Friendship) =>
    resolveFriendIdentity(f, currentUser?.id);

  useEffect(() => {
    void load();
  }, []);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setSending(true);
    setSendMsg(null);
    try {
      await sendFriendRequest(email.trim());
      setSendMsg({ ok: true, msg: "邀請已發送！" });
      setEmail("");
    } catch (err: any) {
      setSendMsg({ ok: false, msg: err?.message ?? "發送失敗" });
    } finally {
      setSending(false);
    }
  };

  const handleSearchById = async () => {
    const id = searchId.trim();
    if (!id) return;
    setSearching(true);
    setFoundUser(null);
    setSearchMsg(null);
    try {
      const result = await searchUserById(id);
      setFoundUser(result);
    } catch (err: any) {
      setSearchMsg({ ok: false, msg: err?.message ?? "找不到該用戶" });
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequestById = async () => {
    if (!foundUser) return;
    setSendingById(true);
    setSearchMsg(null);
    try {
      await sendFriendRequestById(foundUser.id);
      setSearchMsg({
        ok: true,
        msg: `已向 ${foundUser.full_name} 發送好友邀請！`,
      });
      setFoundUser(null);
      setSearchId("");
      await load();
    } catch (err: any) {
      setSearchMsg({ ok: false, msg: err?.message ?? "發送失敗" });
    } finally {
      setSendingById(false);
    }
  };

  const handleCopyId = () => {
    if (!currentUser?.id) return;
    void navigator.clipboard.writeText(currentUser.id).then(() => {
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    });
  };

  const handleRespond = async (id: string, status: "accepted" | "blocked") => {
    setResponding(id);
    try {
      await respondToFriendRequest(id, status);
      await load();
    } finally {
      setResponding(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Add Friends (collapsible) ── */}
      <Card className="rounded-[20px] border-none shadow-sm overflow-hidden">
        <button
          onClick={() => setAddOpen((v) => !v)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <span className="font-black text-slate-700 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-500" />
            新增好友
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              addOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {addOpen && (
          <div className="px-4 pb-4 space-y-5 border-t border-slate-100 pt-4">
            {/* My ID */}
            {currentUser && (
              <div className="space-y-1.5">
                <p className="text-xs font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <Hash className="w-3 h-3" />
                  我的用戶 ID（分享給好友讓對方搜尋你）
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 break-all">
                    {currentUser.id}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyId}
                    className="shrink-0 rounded-xl border-slate-200"
                  >
                    {idCopied ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Search by ID */}
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                <Search className="w-3 h-3" />
                按用戶 ID 搜尋
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="輸入對方的用戶 ID"
                  value={searchId}
                  onChange={(e) => {
                    setSearchId(e.target.value);
                    setFoundUser(null);
                    setSearchMsg(null);
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && void handleSearchById()
                  }
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                />
                <Button
                  onClick={() => void handleSearchById()}
                  disabled={searching || !searchId.trim()}
                  className="bg-purple-500 hover:bg-purple-600 rounded-xl"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "搜尋"
                  )}
                </Button>
              </div>
              {foundUser && (
                <div className="flex items-center justify-between bg-purple-50 rounded-xl px-3 py-2 border border-purple-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center font-black text-purple-600 text-sm">
                      {foundUser.full_name[0]}
                    </div>
                    <div>
                      <p className="font-black text-slate-700 text-sm">
                        {foundUser.full_name}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {foundUser.id.slice(0, 8)}…
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => void handleSendRequestById()}
                    disabled={sendingById}
                    className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl"
                  >
                    {sendingById ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <UserPlus className="w-3 h-3" />
                    )}
                    <span className="ml-1">添加</span>
                  </Button>
                </div>
              )}
              {searchMsg && (
                <p
                  className={`text-sm font-bold ${
                    searchMsg.ok ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {searchMsg.msg}
                </p>
              )}
            </div>

            {/* Invite by email */}
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                <UserPlus className="w-3 h-3" />
                按電郵邀請
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="輸入對方的電郵地址"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleInvite()}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                />
                <Button
                  onClick={() => void handleInvite()}
                  disabled={sending || !email.trim()}
                  className="bg-blue-500 hover:bg-blue-600 rounded-xl"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "邀請"
                  )}
                </Button>
              </div>
              {sendMsg && (
                <p
                  className={`text-sm font-bold ${
                    sendMsg.ok ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {sendMsg.msg}
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* ── Incoming pending requests ── */}
      {pendingIncoming.length > 0 && (
        <div>
          <p className="font-black text-slate-500 text-sm mb-3 uppercase tracking-wide">
            待接受邀請
          </p>
          <div className="space-y-3">
            {pendingIncoming.map((f) => {
              // Show the name of the person who sent the request
              const senderName = f.requester_name ?? "未知用戶";
              return (
                <Card
                  key={f.id}
                  className="rounded-[20px] border-none shadow-sm"
                >
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-black text-blue-600">
                        {senderName[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-700">
                          {senderName}
                        </p>
                        <p className="text-xs text-slate-400">想成為你的朋友</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => void handleRespond(f.id, "accepted")}
                        disabled={responding === f.id}
                        className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        接受
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleRespond(f.id, "blocked")}
                        disabled={responding === f.id}
                        className="text-red-400 border-red-200 hover:bg-red-50 rounded-xl"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        拒絕
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Outgoing pending requests – current user sent these, waiting for reply */}
      {pendingOutgoing.length > 0 && (
        <div>
          <p className="font-black text-slate-500 text-sm mb-3 uppercase tracking-wide">
            已發出邀請（等待回覆）
          </p>
          <div className="space-y-3">
            {pendingOutgoing.map((f) => {
              // Show the name of the person who was invited
              const recipientName = f.addressee_name ?? "未知用戶";
              return (
                <Card
                  key={f.id}
                  className="rounded-[20px] border-none shadow-sm"
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-500">
                      {recipientName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-700">
                        {recipientName}
                      </p>
                      <p className="text-xs text-slate-400">
                        等待對方接受邀請…
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 rounded-full px-2 py-1 shrink-0">
                      待確認
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Friends list ── */}
      <div>
        <p className="font-black text-slate-500 text-sm mb-3 uppercase tracking-wide">
          好友 ({friends.length})
        </p>
        {friends.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-bold text-sm">
              還沒有好友，點擊上方「新增好友」開始吧！
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((f) => {
              const { name, id } = getFriendInfo(f);
              const progress = progressMap[id];
              const children = progress?.children_stats ?? [];
              return (
                <Card
                  key={f.id}
                  className="rounded-[20px] border-none shadow-sm cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
                  onClick={() =>
                    setSelectedFriend(
                      progress ?? {
                        friend_id: id,
                        friend_name: name,
                        children_stats: [],
                      },
                    )
                  }
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-linear-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center font-black text-white text-lg shadow-sm shrink-0">
                      {name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-700 truncate">
                        {name}
                      </p>
                      {children.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {children.map((child, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-xs bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5 font-bold text-slate-500"
                            >
                              <span>{child.avatar}</span>
                              {child.child_name}
                              <span className="text-purple-400">
                                Lv.{child.level}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-bold mt-0.5">
                          點擊查看詳情
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Friend profile modal ── */}
      {selectedFriend && (
        <FriendProfileModal
          progress={selectedFriend}
          onClose={() => setSelectedFriend(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChallengesPanel
// ---------------------------------------------------------------------------

function ChallengesPanel() {
  const { user: currentUser } = useAuth();
  const [friendChallenges, setFriendChallenges] = useState<FriendChallenge[]>(
    [],
  );
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [children, setChildren] = useState<ChildResponse[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);
  const [respondingChallengeId, setRespondingChallengeId] = useState<
    string | null
  >(null);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [inviteChildSelections, setInviteChildSelections] = useState<
    Record<string, string>
  >({});
  const [metricType, setMetricType] =
    useState<FriendChallengeMetric>("practice_days");
  const [targetCount, setTargetCount] = useState("5");
  const [durationDays, setDurationDays] = useState("7");
  const [communityChallenges, setCommunityChallenges] = useState<
    CommunityChallenge[]
  >([]);
  const [leaderboards, setLeaderboards] = useState<
    Record<string, ChallengeParticipation[]>
  >({});
  const [loadingFriendChallenges, setLoadingFriendChallenges] = useState(true);
  const [loadingCommunityChallenges, setLoadingCommunityChallenges] =
    useState(true);

  const loadFriendChallenges = async () => {
    if (!currentUser) {
      setFriendChallenges([]);
      setFriends([]);
      setChildren([]);
      setLoadingFriendChallenges(false);
      return;
    }

    setLoadingFriendChallenges(true);
    try {
      const [challengeResult, friendsResult, childrenResult] =
        await Promise.allSettled([
          getFriendChallenges(),
          getFriends(true),
          getChildren(),
        ]);

      const nextChallenges =
        challengeResult.status === "fulfilled" ? challengeResult.value : [];
      const nextFriends =
        friendsResult.status === "fulfilled"
          ? friendsResult.value.filter((friend) => friend.status === "accepted")
          : [];
      const nextChildren =
        childrenResult.status === "fulfilled" ? childrenResult.value : [];

      setFriendChallenges(
        nextChallenges.filter(
          (challenge) => challenge.view_status !== "declined",
        ),
      );
      setFriends(nextFriends);
      setChildren(nextChildren);

      const defaultChildId = nextChildren[0]?.id;
      if (defaultChildId) {
        setSelectedChildId((current) => current || defaultChildId);
        setInviteChildSelections((current) => {
          const next = { ...current };
          for (const challenge of nextChallenges) {
            if (challenge.view_status === "pending" && !next[challenge.id]) {
              next[challenge.id] = defaultChildId;
            }
          }
          return next;
        });
      }
    } catch (err) {
      console.warn("[FriendChallenges] Failed to load:", err);
      setFriendChallenges([]);
      setFriends([]);
      setChildren([]);
    } finally {
      setLoadingFriendChallenges(false);
    }
  };

  const loadCommunityChallenges = async () => {
    setLoadingCommunityChallenges(true);
    try {
      const data = await getChallenges("active");
      setCommunityChallenges(data);

      const boards = await Promise.allSettled(
        data.map((challenge) =>
          getChallengeLeaderboard(challenge.id).then((board) => ({
            id: challenge.id,
            board,
          })),
        ),
      );
      const merged: Record<string, ChallengeParticipation[]> = {};
      for (const result of boards) {
        if (result.status === "fulfilled") {
          merged[result.value.id] = result.value.board;
        }
      }
      setLeaderboards(merged);
    } catch (err) {
      console.warn("[Challenges] Failed to load:", err);
      setCommunityChallenges([]);
      setLeaderboards({});
    } finally {
      setLoadingCommunityChallenges(false);
    }
  };

  useEffect(() => {
    void loadFriendChallenges();
    void loadCommunityChallenges();
  }, [currentUser?.id]);

  const acceptedFriends = friends.map((friendship) =>
    resolveFriendIdentity(friendship, currentUser?.id),
  );
  const pendingInvites = friendChallenges.filter(
    (challenge) => challenge.view_status === "pending",
  );
  const activeFriendChallenges = friendChallenges.filter(
    (challenge) => challenge.view_status === "active",
  );
  const completedFriendChallenges = friendChallenges.filter(
    (challenge) =>
      challenge.view_status === "completed" ||
      challenge.view_status === "expired",
  );

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds((current) =>
      current.includes(friendId)
        ? current.filter((id) => id !== friendId)
        : [...current, friendId],
    );
  };

  const handleCreateChallenge = async () => {
    const parsedTarget = Number(targetCount);
    const parsedDuration = Number(durationDays);

    if (!selectedChildId) {
      setCreateMessage({ ok: false, msg: "請先選擇參加挑戰的小朋友。" });
      return;
    }
    if (selectedFriendIds.length === 0) {
      setCreateMessage({ ok: false, msg: "請至少選擇一位好友。" });
      return;
    }
    if (
      !Number.isFinite(parsedTarget) ||
      parsedTarget < 1 ||
      parsedTarget > 50
    ) {
      setCreateMessage({ ok: false, msg: "目標請輸入 1 至 50 之間的數字。" });
      return;
    }
    if (
      !Number.isFinite(parsedDuration) ||
      parsedDuration < 3 ||
      parsedDuration > 30
    ) {
      setCreateMessage({ ok: false, msg: "挑戰天數請輸入 3 至 30。" });
      return;
    }

    setCreating(true);
    setCreateMessage(null);
    try {
      await createFriendChallenge({
        child_id: selectedChildId,
        invited_parent_ids: selectedFriendIds,
        metric_type: metricType,
        target_count: parsedTarget,
        duration_days: parsedDuration,
      });
      setCreateMessage({ ok: true, msg: "好友挑戰已發出！" });
      setSelectedFriendIds([]);
      setMetricType("practice_days");
      setTargetCount("5");
      setDurationDays("7");
      setCreateOpen(false);
      await loadFriendChallenges();
    } catch (err: any) {
      setCreateMessage({ ok: false, msg: err?.message ?? "建立挑戰失敗" });
    } finally {
      setCreating(false);
    }
  };

  const handleRespondToInvite = async (
    challengeId: string,
    inviteStatus: "accepted" | "declined",
  ) => {
    const selectedInviteChildId =
      inviteChildSelections[challengeId] || children[0]?.id;
    if (inviteStatus === "accepted" && !selectedInviteChildId) {
      return;
    }

    setRespondingChallengeId(challengeId);
    try {
      await respondToFriendChallenge(challengeId, {
        invite_status: inviteStatus,
        child_id:
          inviteStatus === "accepted" ? selectedInviteChildId : undefined,
      });
      await loadFriendChallenges();
    } finally {
      setRespondingChallengeId(null);
    }
  };

  if (loadingFriendChallenges && loadingCommunityChallenges) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
        <button
          onClick={() => setCreateOpen((open) => !open)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <span className="font-black text-slate-700 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-orange-500" />
            發起好友挑戰
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              createOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {createOpen && (
          <div className="px-4 pb-4 pt-4 border-t border-slate-100 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wide">
                  參加小朋友
                </p>
                <select
                  value={selectedChildId}
                  onChange={(event) => setSelectedChildId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  disabled={children.length === 0}
                >
                  {children.length === 0 && (
                    <option value="">未找到小朋友資料</option>
                  )}
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.avatar} {child.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wide">
                  挑戰類型
                </p>
                <select
                  value={metricType}
                  onChange={(event) =>
                    setMetricType(event.target.value as FriendChallengeMetric)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200"
                >
                  <option value="practice_days">練習天數</option>
                  <option value="new_words">新學詞語</option>
                  <option value="active_words">主動活用</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wide">
                  目標
                </p>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={targetCount}
                  onChange={(event) => setTargetCount(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wide">
                  挑戰天數
                </p>
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={durationDays}
                  onChange={(event) => setDurationDays(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wide">
                邀請好友
              </p>
              {acceptedFriends.length === 0 ? (
                <p className="text-sm font-bold text-slate-400">
                  先在「好友」分頁新增好友後，才可以開始私人挑戰。
                </p>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {acceptedFriends.map((friend) => {
                    const selected = selectedFriendIds.includes(friend.id);
                    return (
                      <button
                        key={friend.id}
                        type="button"
                        onClick={() => toggleFriendSelection(friend.id)}
                        className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                          selected
                            ? "border-orange-200 bg-orange-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-black text-slate-700 text-sm">
                              {friend.name}
                            </p>
                            <p className="text-xs font-bold text-slate-400">
                              點擊{selected ? "取消" : "加入"}邀請名單
                            </p>
                          </div>
                          {selected && (
                            <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {createMessage && (
              <p
                className={`text-sm font-bold ${
                  createMessage.ok ? "text-green-600" : "text-red-500"
                }`}
              >
                {createMessage.msg}
              </p>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => void handleCreateChallenge()}
                disabled={
                  creating ||
                  children.length === 0 ||
                  acceptedFriends.length === 0 ||
                  selectedFriendIds.length === 0
                }
                className="bg-orange-500 hover:bg-orange-600 rounded-xl"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trophy className="w-4 h-4 mr-2" />
                )}
                發出挑戰
              </Button>
            </div>
          </div>
        )}
      </Card>

      {loadingFriendChallenges ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {pendingInvites.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-black text-slate-500 uppercase tracking-wide">
                收到的挑戰邀請
              </p>
              {pendingInvites.map((challenge) => (
                <Card
                  key={challenge.id}
                  className="rounded-[20px] border-none shadow-sm overflow-hidden"
                >
                  <div className="bg-linear-to-r from-orange-400 to-amber-400 px-5 py-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xl font-black text-white">
                        {challenge.emoji} {challenge.title_zh}
                      </p>
                      <p className="text-sm font-bold text-white/85">
                        {challenge.creator_name ?? "好友"} 邀請你一起參加
                      </p>
                    </div>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white">
                      {friendChallengeStatusLabel(challenge.view_status)}
                    </span>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-bold text-slate-500">
                      類型：
                      <span className="text-slate-700 font-black">
                        {friendChallengeMetricLabel(challenge.metric_type)}
                      </span>
                      <span className="mx-2 text-slate-300">•</span>
                      目標：
                      <span className="text-slate-700 font-black">
                        {challenge.target_count}
                        {friendChallengeTargetUnit(challenge.metric_type)}
                      </span>
                    </p>

                    <div className="space-y-2">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-wide">
                        選擇參加的小朋友
                      </p>
                      <select
                        value={
                          inviteChildSelections[challenge.id] ||
                          children[0]?.id ||
                          ""
                        }
                        onChange={(event) =>
                          setInviteChildSelections((current) => ({
                            ...current,
                            [challenge.id]: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200"
                      >
                        {children.map((child) => (
                          <option key={child.id} value={child.id}>
                            {child.avatar} {child.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void handleRespondToInvite(challenge.id, "declined")
                        }
                        disabled={respondingChallengeId === challenge.id}
                        className="rounded-xl border-red-200 text-red-500 hover:bg-red-50"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        拒絕
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          void handleRespondToInvite(challenge.id, "accepted")
                        }
                        disabled={
                          respondingChallengeId === challenge.id ||
                          children.length === 0
                        }
                        className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                      >
                        {respondingChallengeId === challenge.id ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        )}
                        接受挑戰
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeFriendChallenges.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-black text-slate-500 uppercase tracking-wide">
                好友挑戰進行中
              </p>
              {activeFriendChallenges.map((challenge) => {
                const acceptedParticipants = [...challenge.participants]
                  .filter(
                    (participant) => participant.invite_status === "accepted",
                  )
                  .sort((left, right) => right.progress - left.progress);

                return (
                  <Card
                    key={challenge.id}
                    className="overflow-hidden rounded-[20px] border-none py-0 gap-0 shadow-sm"
                  >
                    <div className="bg-linear-to-r from-orange-400 to-amber-400 px-5 py-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xl font-black text-white">
                          {challenge.emoji} {challenge.title_zh}
                        </p>
                        <p className="text-sm text-white/85 font-bold">
                          {challenge.creator_name ?? "好友"} 發起 · 還有{" "}
                          {daysLeft(challenge.ends_at)} 天
                        </p>
                      </div>
                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white">
                        {friendChallengeStatusLabel(challenge.view_status)}
                      </span>
                    </div>

                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-orange-50 px-3 py-3 border border-orange-100">
                          <p className="text-[10px] font-black text-orange-500 uppercase tracking-wide">
                            類型
                          </p>
                          <p className="text-sm font-black text-slate-700 mt-1">
                            {friendChallengeMetricLabel(challenge.metric_type)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-blue-50 px-3 py-3 border border-blue-100">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-wide">
                            我的進度
                          </p>
                          <p className="text-sm font-black text-slate-700 mt-1">
                            {challenge.my_progress}/{challenge.target_count}
                            {friendChallengeTargetUnit(challenge.metric_type)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Progress
                          value={
                            (challenge.my_progress /
                              Math.max(challenge.target_count, 1)) *
                            100
                          }
                          className="h-2 rounded-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-wide">
                            好友排行榜
                          </p>
                          {challenge.pending_participant_count > 0 && (
                            <p className="text-xs font-bold text-slate-400">
                              還有 {challenge.pending_participant_count}{" "}
                              位好友未回覆
                            </p>
                          )}
                        </div>
                        {acceptedParticipants.map((participant, index) => (
                          <div
                            key={participant.id}
                            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2"
                          >
                            <span className="w-5 text-center text-sm font-black text-slate-500">
                              {index + 1}
                            </span>
                            <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg shrink-0">
                              {participant.child_avatar ??
                                participant.parent_name?.[0] ??
                                "👧"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-slate-700 truncate">
                                {participant.child_name ??
                                  participant.parent_name ??
                                  "好友"}
                              </p>
                              <p className="text-xs font-bold text-slate-400 truncate">
                                {participant.parent_name}
                              </p>
                            </div>
                            <span className="text-sm font-black text-slate-600 shrink-0">
                              {participant.progress}/{challenge.target_count}
                            </span>
                            {participant.is_completed && (
                              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {completedFriendChallenges.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-black text-slate-500 uppercase tracking-wide">
                已完成或已結束
              </p>
              {completedFriendChallenges.map((challenge) => (
                <Card
                  key={challenge.id}
                  className="rounded-[20px] border-none shadow-sm"
                >
                  <CardContent className="p-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-black text-slate-700">
                        {challenge.emoji} {challenge.title_zh}
                      </p>
                      <p className="text-sm font-bold text-slate-400 mt-1">
                        {friendChallengeStatusLabel(challenge.view_status)} ·
                        我的成績 {challenge.my_progress}/
                        {challenge.target_count}
                        {friendChallengeTargetUnit(challenge.metric_type)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black shrink-0 ${
                        challenge.view_status === "completed"
                          ? "bg-green-50 text-green-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {friendChallengeStatusLabel(challenge.view_status)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {pendingInvites.length === 0 &&
            activeFriendChallenges.length === 0 &&
            completedFriendChallenges.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-bold text-sm">
                  還沒有好友挑戰，先邀請朋友一起開始吧！
                </p>
              </div>
            )}
        </>
      )}

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-500 uppercase tracking-wide">
              社群挑戰
            </p>
            <p className="text-sm font-bold text-slate-400 mt-1">
              保留現有公開排行榜，讓家長也可以加入平台活動。
            </p>
          </div>
        </div>

        {loadingCommunityChallenges ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : communityChallenges.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-bold text-sm">目前沒有進行中的社群挑戰。</p>
          </div>
        ) : (
          communityChallenges.map((challenge) => {
            const board = leaderboards[challenge.id] ?? [];
            const top5 = board.slice(0, 5);
            return (
              <Card
                key={challenge.id}
                className="overflow-hidden rounded-[20px] border-none py-0 gap-0 shadow-sm"
              >
                <div className="bg-linear-to-r from-amber-50 via-orange-50 to-yellow-50 border-b border-amber-100 px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-orange-400 to-amber-400 text-white flex items-center justify-center text-xl shadow-sm shrink-0">
                      {challenge.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl font-black text-slate-800 truncate">
                        {challenge.title_zh ?? challenge.title}
                      </p>
                      {challenge.description_zh && (
                        <p className="text-sm text-slate-500 font-bold mt-0.5">
                          {challenge.description_zh}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right rounded-2xl bg-white/90 border border-orange-100 px-3 py-2 shadow-xs shrink-0">
                    <p className="text-orange-500 font-black text-lg leading-none">
                      {daysLeft(challenge.ends_at)}
                    </p>
                    <p className="text-slate-400 text-xs font-bold mt-1">
                      天後結束
                    </p>
                  </div>
                </div>

                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-bold text-slate-500">
                    目標：
                    <span className="text-slate-700 font-black">
                      {challenge.target_count}
                    </span>{" "}
                    次
                  </p>

                  {top5.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-wide">
                        排行榜
                      </p>
                      {top5.map((participant, index) => (
                        <div
                          key={participant.id}
                          className="flex items-center gap-3 bg-slate-50/80 border border-slate-100 rounded-2xl px-3 py-3"
                        >
                          <span className="text-sm font-black text-slate-500 w-5 text-center">
                            {index + 1}
                          </span>
                          <div className="w-10 h-10 rounded-full bg-white border border-orange-100 flex items-center justify-center text-base shadow-xs shrink-0">
                            {participant.child_avatar ??
                              participant.child_name?.[0] ??
                              "👧"}
                          </div>
                          <div className="w-28 sm:w-36 min-w-0">
                            <p className="text-sm font-black text-slate-700 truncate">
                              {participant.child_name ?? "參加者"}
                            </p>
                            <p className="text-[11px] font-bold text-slate-400 truncate mt-0.5">
                              {(participant.parent_name ?? "家庭") +
                                (participant.participant_code
                                  ? ` · #${participant.participant_code}`
                                  : "")}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <Progress
                              value={
                                (participant.progress /
                                  (challenge.target_count || 1)) *
                                100
                              }
                              className="h-2 rounded-full"
                            />
                          </div>
                          <span className="text-sm font-black text-slate-600 w-12 text-right">
                            {participant.progress}/{challenge.target_count}
                          </span>
                          {participant.is_completed && (
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-slate-400 text-center py-2">
                      還沒有人參加，鼓勵孩子開始吧！
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// SocialTab (main export)
// ===========================================================================

export function SocialTab() {
  const [activeTab, setActiveTab] = useState("moderation");
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  // Fetch pending posts count for badge
  useEffect(() => {
    void getPendingPosts()
      .then((posts) => setPendingCount(posts.length))
      .catch(() => setPendingCount(0));
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="bg-purple-400 p-2.5 rounded-xl -rotate-3 shadow-sm">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-700">社群與好友</h2>
          <p className="text-sm font-bold text-slate-400">與朋友一起學習成長</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-white/60 rounded-2xl p-1 gap-1">
          <TabsTrigger
            value="moderation"
            className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-sm relative"
          >
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            審核照片
            {pendingCount !== null && pendingCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center absolute -top-1 -right-1">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="friends"
            className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-sm"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            好友
          </TabsTrigger>

          <TabsTrigger
            value="challenges"
            className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-sm"
          >
            <Trophy className="w-3.5 h-3.5 mr-1.5" />
            挑戰
          </TabsTrigger>
        </TabsList>

        <TabsContent value="moderation" className="mt-5">
          <ModerationPanel />
        </TabsContent>

        <TabsContent value="friends" className="mt-5">
          <FriendsPanel />
        </TabsContent>

        <TabsContent value="challenges" className="mt-5">
          <ChallengesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
