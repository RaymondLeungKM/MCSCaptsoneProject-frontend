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

import { useEffect, useState } from "react";
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
} from "lucide-react";
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
  respondToFriendRequest,
  getFriendsProgress,
  getChallenges,
  getChallengeLeaderboard,
  type CommunityPost,
  type Friendship,
  type FriendProgress,
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
// FriendsPanel
// ---------------------------------------------------------------------------

function FriendsPanel() {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingIn, setPendingIn] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );
  const [responding, setResponding] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const all = await getFriends(true);
      setFriends(all.filter((f) => f.status === "accepted"));
      setPendingIn(all.filter((f) => f.status === "pending"));
    } finally {
      setLoading(false);
    }
  };

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
    <div className="space-y-6">
      {/* Invite */}
      <Card className="rounded-[20px] border-none shadow-sm bg-blue-50">
        <CardContent className="p-4 space-y-3">
          <p className="font-black text-slate-700 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-500" />
            邀請朋友
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="輸入對方的電郵地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleInvite()}
              className="flex-1 border border-blue-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            <Button
              onClick={() => void handleInvite()}
              disabled={sending || !email.trim()}
              className="bg-blue-500 hover:bg-blue-600 rounded-xl"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "邀請"}
            </Button>
          </div>
          {sendMsg && (
            <p
              className={`text-sm font-bold ${sendMsg.ok ? "text-green-600" : "text-red-500"}`}
            >
              {sendMsg.msg}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pending requests */}
      {pendingIn.length > 0 && (
        <div>
          <p className="font-black text-slate-500 text-sm mb-3 uppercase tracking-wide">
            待接受邀請
          </p>
          <div className="space-y-3">
            {pendingIn.map((f) => {
              const isRequester = true; // Simplified; addressee sees pending
              const otherName = f.requester_name ?? "未知用戶";
              return (
                <Card
                  key={f.id}
                  className="rounded-[20px] border-none shadow-sm"
                >
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-black text-blue-600">
                        {otherName[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-700">{otherName}</p>
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

      {/* Accepted friends */}
      <div>
        <p className="font-black text-slate-500 text-sm mb-3 uppercase tracking-wide">
          好友 ({friends.length})
        </p>
        {friends.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="font-bold text-sm">還沒有好友，邀請親朋好友吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((f) => {
              const otherName =
                f.requester_name === f.addressee_name
                  ? f.requester_name
                  : (f.requester_name ?? f.addressee_name ?? "好友");
              return (
                <Card
                  key={f.id}
                  className="rounded-[20px] border-none shadow-sm"
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-11 h-11 bg-linear-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center font-black text-white text-lg shadow">
                      {(otherName ?? "?")[0]}
                    </div>
                    <div>
                      <p className="font-black text-slate-700">{otherName}</p>
                      <p className="text-xs text-slate-400 font-bold">
                        ✓ 已成為好友
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FriendProgressPanel
// ---------------------------------------------------------------------------

function FriendProgressPanel() {
  const [data, setData] = useState<FriendProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setData(await getFriendsProgress());
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

  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-bold text-sm">
          與好友連結後，就能查看彼此的學習進度！
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {data.map((friend) => (
        <Card
          key={friend.friend_id}
          className="rounded-[20px] border-none shadow-sm"
        >
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="text-base font-black text-slate-700">
              {friend.friend_name} 的小朋友
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            {friend.children_stats.map((child, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-slate-50 rounded-2xl p-3"
              >
                <div className="text-3xl">{child.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-700">
                    {child.child_name}
                  </p>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {child.words_learned} 詞
                    </span>
                    <span className="text-xs font-bold text-orange-400 flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {child.current_streak} 日
                    </span>
                    <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Lv.{child.level}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
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
            value="progress"
            className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-sm"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            進度分享
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

        <TabsContent value="progress" className="mt-5">
          <FriendProgressPanel />
        </TabsContent>

        <TabsContent value="challenges" className="mt-5">
          <ChallengesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
