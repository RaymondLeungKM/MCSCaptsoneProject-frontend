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
  sendFriendRequest,
  searchUserById,
  sendFriendRequestById,
  respondToFriendRequest,
  getFriendsProgress,
  getCommunityFeed,
  getChallenges,
  getChallengeLeaderboard,
  type CommunityPost,
  type Friendship,
  type FriendProgress,
  type UserSearchResult,
  type CommunityChallenge,
  type ChallengeParticipation,
} from "@/lib/api/community";
import { API_BASE_URL } from "@/lib/api/client";

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
    f.requester_id === currentUser?.id
      ? { name: f.addressee_name ?? "好友", id: f.addressee_id }
      : { name: f.requester_name ?? "好友", id: f.requester_id };

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
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [leaderboards, setLeaderboards] = useState<
    Record<string, ChallengeParticipation[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await getChallenges("active");
        setChallenges(data);

        // Load leaderboards for all challenges in parallel
        const boards = await Promise.allSettled(
          data.map((c) =>
            getChallengeLeaderboard(c.id).then((board) => ({
              id: c.id,
              board,
            })),
          ),
        );
        const merged: Record<string, ChallengeParticipation[]> = {};
        for (const r of boards) {
          if (r.status === "fulfilled") {
            merged[r.value.id] = r.value.board;
          }
        }
        setLeaderboards(merged);
      } catch (err) {
        console.warn("[Challenges] Failed to load:", err);
        setChallenges([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <Trophy className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-bold text-sm">目前沒有進行中的挑戰，下次再來！</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {challenges.map((c) => {
        const board = leaderboards[c.id] ?? [];
        const top5 = board.slice(0, 5);
        return (
          <Card
            key={c.id}
            className="rounded-[20px] border-none shadow-sm overflow-hidden"
          >
            {/* Header strip */}
            <div className="bg-linear-to-r from-yellow-400 to-orange-400 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xl font-black text-white">
                  {c.emoji} {c.title_zh ?? c.title}
                </p>
                {c.description_zh && (
                  <p className="text-sm text-white/80 font-bold">
                    {c.description_zh}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-white font-black text-lg">
                  {daysLeft(c.ends_at)}
                </p>
                <p className="text-white/70 text-xs font-bold">天後結束</p>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Target */}
              <p className="text-sm font-bold text-slate-500">
                目標：
                <span className="text-slate-700 font-black">
                  {c.target_count}
                </span>{" "}
                次
              </p>

              {/* Leaderboard */}
              {top5.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wide">
                    排行榜
                  </p>
                  {top5.map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2"
                    >
                      <span className="text-sm font-black text-slate-500 w-5 text-center">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <Progress
                          value={(p.progress / (c.target_count || 1)) * 100}
                          className="h-2 rounded-full"
                        />
                      </div>
                      <span className="text-sm font-black text-slate-600 w-12 text-right">
                        {p.progress}/{c.target_count}
                      </span>
                      {p.is_completed && (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {top5.length === 0 && (
                <p className="text-sm font-bold text-slate-400 text-center py-2">
                  還沒有人參加，鼓勵孩子開始吧！
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
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
