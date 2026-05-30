"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  Gamepad2,
  Gift,
  History,
  Lightbulb,
  MapPin,
  Medal,
  MessageCircle,
  Moon,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Trophy,
  Utensils,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthToken } from "@/lib/api/client";
import {
  completeMission,
  getDailyMissions,
  getMissionSummary,
  getOfflineMissions,
  type MissionSummaryResponse,
  toOfflineMission,
} from "@/lib/api/missions";
import { offlineMissions as mockOfflineMissions } from "@/lib/mock-data";
import type { OfflineMission } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ParentMissionsTabProps {
  childId?: string;
}

type ParentMissionSection = {
  id: "daily" | "offline";
  title: string;
  subtitle: string;
  emptyMessage: string;
  missions: OfflineMission[];
};

const mockDailyMissions: OfflineMission[] = [
  {
    id: "daily-m1",
    title: "今日說一說紅色",
    description: "請小朋友找出三樣紅色物件，並逐一說出它們的名字。",
    context: "general",
    targetWords: ["紅色", "蘋果", "氣球"],
    completed: false,
    conversationPrompts: ["我看到紅色蘋果！", "這個氣球也是紅色的。"],
  },
  {
    id: "daily-m2",
    title: "動作詞小挑戰",
    description: "跟著指令做動作，再把動作詞說出來。",
    context: "playtime",
    targetWords: ["跳", "跑", "拍手"],
    completed: false,
    conversationPrompts: ["我會跳高高！", "現在一起拍手吧！"],
  },
  {
    id: "daily-m3",
    title: "心情分享",
    description: "請孩子說出今天的心情，並配上一個表情或動作。",
    context: "general",
    targetWords: ["開心", "傷心", "生氣"],
    completed: false,
    conversationPrompts: ["我今天很開心！", "你可以做一個開心的表情嗎？"],
  },
];

const mockMissionSummary: MissionSummaryResponse = {
  child_id: "mock-child-id",
  local_today: "2026-05-30",
  completed_today: 2,
  completed_this_week: 4,
  weekly_goal: 5,
  streak_days: 3,
  total_completed: 14,
  family_points: 135,
  level: 3,
  level_title: "共學隊長",
  next_level_points: 220,
  points_to_next_level: 85,
  next_reward_label: "再完成 1 個任務，即可達成本週共學目標。",
  encouragement:
    "已連續陪孩子完成 3 天任務，持續陪跑有助孩子把詞語自然帶進日常生活。",
  recent_completions: [
    {
      mission_id: "offline-m2",
      title: "超市對話練習",
      context: "shopping",
      is_offline: true,
      surface: "parent",
      assignment_date: "2026-05-29",
      completed_at: "2026-05-29T11:30:00.000Z",
      completion_notes: "孩子主動說出了兩個食物詞語。",
      target_words: ["蘋果", "牛奶", "麵包"],
      points_earned: 15,
    },
    {
      mission_id: "daily-m1",
      title: "今日說一說紅色",
      context: "general",
      is_offline: false,
      surface: "both",
      assignment_date: "2026-05-28",
      completed_at: "2026-05-28T09:15:00.000Z",
      completion_notes: null,
      target_words: ["紅色", "蘋果", "氣球"],
      points_earned: 10,
    },
  ],
};

const RECENT_HISTORY_PREVIEW_COUNT = 2;

function updateMissionCompletion(
  missions: OfflineMission[],
  missionId: string,
  completed: boolean,
): OfflineMission[] {
  return missions.map((mission) =>
    mission.id === missionId
      ? {
          ...mission,
          completed,
          completedDate: completed ? new Date() : undefined,
        }
      : mission,
  );
}

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("zh-HK", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function getContextIcon(context: OfflineMission["context"]) {
  switch (context) {
    case "mealtime":
      return <Utensils className="w-5 h-5" />;
    case "bedtime":
      return <Moon className="w-5 h-5" />;
    case "playtime":
      return <Gamepad2 className="w-5 h-5" />;
    case "outdoor":
      return <MapPin className="w-5 h-5" />;
    case "shopping":
      return <ShoppingBag className="w-5 h-5" />;
    default:
      return <MessageCircle className="w-5 h-5" />;
  }
}

function getContextLabel(context: OfflineMission["context"]) {
  switch (context) {
    case "mealtime":
      return "用餐時間";
    case "bedtime":
      return "睡前時光";
    case "playtime":
      return "遊戲時間";
    case "outdoor":
      return "戶外活動";
    case "shopping":
      return "購物時間";
    default:
      return "日常對話";
  }
}

function getContextColorClasses(context: OfflineMission["context"]) {
  switch (context) {
    case "mealtime":
      return "bg-orange-100 text-orange-600 border-orange-200";
    case "bedtime":
      return "bg-indigo-100 text-indigo-600 border-indigo-200";
    case "playtime":
      return "bg-pink-100 text-pink-600 border-pink-200";
    case "outdoor":
      return "bg-green-100 text-green-600 border-green-200";
    case "shopping":
      return "bg-blue-100 text-blue-600 border-blue-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

export function ParentMissionsTab({ childId }: ParentMissionsTabProps = {}) {
  const [dailyMissions, setDailyMissions] = useState<OfflineMission[]>([]);
  const [offlineMissions, setOfflineMissions] = useState<OfflineMission[]>([]);
  const [missionSummary, setMissionSummary] =
    useState<MissionSummaryResponse>(mockMissionSummary);
  const [showAllRecentCompletions, setShowAllRecentCompletions] =
    useState(false);
  const [selectedMissionKey, setSelectedMissionKey] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMockData =
    !childId ||
    childId === "1" ||
    childId === "mock-child-id" ||
    childId.length < 10;

  const loadMissionDashboard = useCallback(
    async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
      if (isMockData) {
        setDailyMissions(mockDailyMissions);
        setOfflineMissions(mockOfflineMissions);
        setMissionSummary(mockMissionSummary);
        if (showLoading) {
          setLoading(false);
        }
        return;
      }

      const token = getAuthToken();
      if (!token) {
        setDailyMissions(mockDailyMissions);
        setOfflineMissions(mockOfflineMissions);
        setMissionSummary(mockMissionSummary);
        if (showLoading) {
          setLoading(false);
        }
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      try {
        setError(null);
        const [dailyResult, offlineResult, summaryResult] =
          await Promise.allSettled([
            getDailyMissions(childId!),
            getOfflineMissions(childId!),
            getMissionSummary(childId!),
          ]);

        const mappedDaily =
          dailyResult.status === "fulfilled"
            ? dailyResult.value.map((mission) => toOfflineMission(mission))
            : [];

        const mappedOffline =
          offlineResult.status === "fulfilled"
            ? offlineResult.value.map((mission) => toOfflineMission(mission))
            : [];

        setDailyMissions(mappedDaily);
        setOfflineMissions(mappedOffline);
        setMissionSummary(
          summaryResult.status === "fulfilled"
            ? summaryResult.value
            : mockMissionSummary,
        );

        if (
          dailyResult.status === "rejected" ||
          offlineResult.status === "rejected" ||
          summaryResult.status === "rejected"
        ) {
          setError("部分任務或追蹤資料暫時未能載入，現正顯示可用內容。");
        }
      } catch (loadError) {
        console.error("[Parent Missions] Error:", loadError);
        setError("無法載入任務，顯示示例資料。");
        setDailyMissions(mockDailyMissions);
        setOfflineMissions(mockOfflineMissions);
        setMissionSummary(mockMissionSummary);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [childId, isMockData],
  );

  useEffect(() => {
    void loadMissionDashboard();
  }, [loadMissionDashboard]);

  async function toggleMissionComplete(missionId: string) {
    const target = [...dailyMissions, ...offlineMissions].find(
      (mission) => mission.id === missionId,
    );
    if (!target) return;

    const newCompleted = !target.completed;
    const previousDailyMissions = dailyMissions;
    const previousOfflineMissions = offlineMissions;

    setDailyMissions((current) =>
      updateMissionCompletion(current, missionId, newCompleted),
    );
    setOfflineMissions((current) =>
      updateMissionCompletion(current, missionId, newCompleted),
    );

    if (!isMockData && childId) {
      try {
        await completeMission(missionId, childId, newCompleted);
        await loadMissionDashboard({ showLoading: false });
      } catch (completionError) {
        console.warn(
          "[Parent Missions] Could not sync completion:",
          completionError,
        );
        setDailyMissions(previousDailyMissions);
        setOfflineMissions(previousOfflineMissions);
      }
    }
  }

  const sections: ParentMissionSection[] = [
    {
      id: "daily",
      title: "每日互動任務",
      subtitle: "會顯示在小朋友首頁，也會在這裡供家長跟進。",
      emptyMessage: "目前未有可用的每日任務。",
      missions: dailyMissions,
    },
    {
      id: "offline",
      title: "生活實戰任務",
      subtitle: "家長可在真實情境中陪伴小朋友一起完成。",
      emptyMessage: "目前未有可用的生活實戰任務。",
      missions: offlineMissions,
    },
  ];

  const allMissions = sections.flatMap((section) => section.missions);
  const completedCount = allMissions.filter(
    (mission) => mission.completed,
  ).length;
  const progressPercentage =
    allMissions.length > 0 ? (completedCount / allMissions.length) * 100 : 0;
  const weeklyProgressPercentage =
    missionSummary.weekly_goal > 0
      ? Math.min(
          (missionSummary.completed_this_week / missionSummary.weekly_goal) *
            100,
          100,
        )
      : 0;
  const canExpandRecentHistory =
    missionSummary.recent_completions.length > RECENT_HISTORY_PREVIEW_COUNT;
  const visibleRecentCompletions = showAllRecentCompletions
    ? missionSummary.recent_completions
    : missionSummary.recent_completions.slice(0, RECENT_HISTORY_PREVIEW_COUNT);

  if (loading) {
    return (
      <div className="space-y-6 w-full p-4 md:p-6 bg-white/50 backdrop-blur-sm rounded-4xl">
        <Skeleton className="h-32 w-full rounded-4xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full p-4 md:p-6 bg-white/50 backdrop-blur-sm rounded-4xl">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-linear-to-br from-yellow-100 to-orange-100 rounded-2xl mb-2 shadow-sm">
          <Sparkles className="w-8 h-8 text-orange-500 animate-pulse" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
          任務中心
        </h2>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto">
          這裡會同時顯示小朋友的每日任務，以及適合家長陪伴完成的生活實戰任務。
        </p>
        {error && (
          <p className="text-xs text-amber-600 font-medium flex items-center justify-center gap-1">
            <RefreshCw className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>

      <Card className="border-none shadow-xl bg-linear-to-r from-blue-500 to-cyan-400 text-white overflow-hidden relative rounded-3xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10">
          <Trophy className="w-48 h-48" />
        </div>
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-2xl font-bold flex items-center gap-2 justify-center md:justify-start">
                <Trophy className="w-6 h-6 text-yellow-300" />
                今日任務總覽
              </h3>
              <p className="text-blue-100 font-medium">
                {allMissions.length === 0
                  ? "目前未有已發佈任務。"
                  : completedCount === allMissions.length
                    ? "🎉 太棒了！今天的任務已全部完成。"
                    : `目前已完成 ${completedCount} / ${allMissions.length} 個任務。`}
              </p>
            </div>
            <div className="w-full md:w-1/2 space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-blue-100">
                <span>完成度</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="h-4 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: <Medal className="w-5 h-5 text-amber-500" />,
            title: "家庭星星",
            value: `${missionSummary.family_points}`,
            desc: "每日任務 +10，生活實戰 +15",
            color: "bg-amber-50 text-amber-700 border-amber-100",
          },
          {
            icon: <Flame className="w-5 h-5 text-rose-500" />,
            title: "連續陪跑",
            value: `${missionSummary.streak_days} 天`,
            desc:
              missionSummary.streak_days > 0
                ? "每天完成至少一個任務就能延續節奏。"
                : "今天完成第一個任務即可建立新節奏。",
            color: "bg-emerald-50 text-emerald-700 border-emerald-100",
          },
          {
            icon: <Gift className="w-5 h-5 text-violet-500" />,
            title: "本週目標",
            value: `${missionSummary.completed_this_week}/${missionSummary.weekly_goal}`,
            desc: missionSummary.next_reward_label,
            color: "bg-violet-50 text-violet-700 border-violet-100",
          },
        ].map((item, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-transform hover:-translate-y-1 bg-white",
              item.color,
            )}
          >
            <span className="text-3xl mb-2">{item.icon}</span>
            <h4 className="font-bold text-sm">{item.title}</h4>
            <span className="text-2xl font-black mt-1">{item.value}</span>
            <span className="text-xs opacity-80 mt-1">{item.desc}</span>
          </div>
        ))}
      </div>

      <Card className="border-none shadow-lg bg-linear-to-br from-orange-50 via-white to-yellow-50 rounded-3xl overflow-hidden">
        <CardContent className="p-6 md:p-7">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">
                    家庭共學獎勵
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">
                    讓家長看得到努力，也讓孩子感受到陪伴的累積成果。
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-orange-100 bg-white/80 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">
                    等級 {missionSummary.level}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                    {missionSummary.level_title}
                  </span>
                </div>
                <p className="text-sm text-slate-700 font-medium">
                  {missionSummary.encouragement}
                </p>
                <p className="text-sm text-orange-700 font-bold">
                  {missionSummary.points_to_next_level > 0
                    ? `再累積 ${missionSummary.points_to_next_level} 顆家庭星星，就能升到下一級。`
                    : "已達目前最高等級，繼續完成任務可保持家庭共學節奏。"}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-100 bg-white/80 p-5 shadow-sm space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  本週進度
                </p>
                <p className="text-2xl font-black text-slate-800 mt-1">
                  {missionSummary.completed_this_week} /{" "}
                  {missionSummary.weekly_goal}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>本週共學目標</span>
                  <span>{Math.round(weeklyProgressPercentage)}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-amber-400 to-orange-400 transition-all duration-700"
                    style={{ width: `${weeklyProgressPercentage}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-slate-600 font-medium">
                {missionSummary.next_reward_label}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="px-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              最近完成紀錄
            </h3>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              家長可回顧最近陪孩子完成的任務，追蹤共學節奏和累積的家庭星星。
            </p>
          </div>

          {canExpandRecentHistory && (
            <button
              type="button"
              onClick={() => setShowAllRecentCompletions((current) => !current)}
              className="self-start sm:self-auto px-4 py-2 rounded-full border border-amber-200 bg-white text-sm font-bold text-amber-700 hover:bg-amber-50 transition-colors"
            >
              {showAllRecentCompletions
                ? "收起較早紀錄"
                : `查看另外 ${missionSummary.recent_completions.length - RECENT_HISTORY_PREVIEW_COUNT} 筆紀錄`}
            </button>
          )}
        </div>

        {missionSummary.recent_completions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 px-5 py-6 text-center text-sm font-medium text-slate-500">
            完成第一個任務後，這裡會記錄最近的共學成果。
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {visibleRecentCompletions.map((item) => (
              <div
                key={`${item.mission_id}:${item.assignment_date}`}
                className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={cn(
                          "text-xs font-bold tracking-wider px-2 py-0.5 rounded-full border",
                          getContextColorClasses(item.context),
                        )}
                      >
                        {getContextLabel(item.context)}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {item.is_offline ? "生活實戰任務" : "每日互動任務"}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {formatHistoryDate(item.completed_at)} 完成
                    </p>
                  </div>
                  <div className="shrink-0 px-3 py-2 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider">
                      星星
                    </p>
                    <p className="text-xl font-black">+{item.points_earned}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.target_words.map((word, index) => (
                    <span
                      key={`${item.mission_id}:${item.assignment_date}:${word}:${index}`}
                      className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-full"
                    >
                      {word}
                    </span>
                  ))}
                </div>

                {item.completion_notes && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800 font-medium">
                    {item.completion_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {sections.map((section) => (
        <div key={section.id} className="space-y-4">
          <div className="px-2">
            <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              {section.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              {section.subtitle}
            </p>
          </div>

          {section.missions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 px-5 py-6 text-center text-sm font-medium text-slate-500">
              {section.emptyMessage}
            </div>
          ) : (
            <div className="grid gap-4">
              {section.missions.map((mission) => {
                const missionKey = `${section.id}:${mission.id}`;
                const isSelected = selectedMissionKey === missionKey;
                const contextColors = getContextColorClasses(mission.context);

                return (
                  <div
                    key={missionKey}
                    className={cn(
                      "group relative rounded-3xl border-2 transition-all duration-300 ease-in-out bg-white overflow-hidden",
                      mission.completed
                        ? "border-green-200 bg-green-50/50"
                        : "border-slate-100 hover:border-blue-200 hover:shadow-lg",
                      isSelected ? "ring-2 ring-blue-400 ring-offset-2" : "",
                    )}
                  >
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() =>
                        setSelectedMissionKey(isSelected ? null : missionKey)
                      }
                    >
                      <div className="flex items-start gap-5">
                        <div
                          className={cn(
                            "shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-sm transition-transform group-hover:scale-110",
                            contextColors,
                          )}
                        >
                          {getContextIcon(mission.context)}
                        </div>

                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span
                                  className={cn(
                                    "text-xs font-bold tracking-wider px-2 py-0.5 rounded-full border",
                                    contextColors,
                                  )}
                                >
                                  {getContextLabel(mission.context)}
                                </span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                  {section.title}
                                </span>
                                {mission.completed && (
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> 已完成
                                  </span>
                                )}
                              </div>
                              <h3
                                className={cn(
                                  "text-lg font-bold text-slate-800 truncate pr-4",
                                  mission.completed &&
                                    "line-through opacity-60",
                                )}
                              >
                                {mission.title}
                              </h3>
                            </div>

                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                void toggleMissionComplete(mission.id);
                              }}
                              className={cn(
                                "shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95",
                                mission.completed
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "bg-white border-slate-200 text-slate-300 hover:border-green-400 hover:text-green-400",
                              )}
                              title={
                                mission.completed
                                  ? "標記為未完成"
                                  : "標記為完成"
                              }
                            >
                              <Check className="w-6 h-6 stroke-3" />
                            </button>
                          </div>

                          <p className="text-slate-500 text-sm mt-1 line-clamp-1 group-hover:line-clamp-none transition-all">
                            {mission.description}
                          </p>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {mission.targetWords.map((word, index) => (
                              <span
                                key={`${missionKey}:${word}:${index}`}
                                className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-full"
                              >
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center mt-2 -mb-2">
                        {isSelected ? (
                          <ChevronUp className="w-4 h-4 text-slate-300" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                        )}
                      </div>
                    </div>

                    <div
                      className={cn(
                        "grid transition-all duration-300 ease-in-out bg-slate-50 border-t border-slate-100",
                        isSelected
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0",
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="p-5 space-y-4">
                          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                              <MessageCircle className="w-4 h-4 text-blue-500" />
                              可以這樣提問：
                            </h4>
                            <ul className="space-y-3">
                              {mission.conversationPrompts.map(
                                (prompt, index) => (
                                  <li
                                    key={`${missionKey}:prompt:${index}`}
                                    className="flex items-start gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg"
                                  >
                                    <span className="text-blue-500 font-bold text-lg leading-none mt-0.5">
                                      •
                                    </span>
                                    <span className="italic font-medium">
                                      「{prompt}」
                                    </span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>

                          <div className="flex items-start gap-3 bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-100">
                            <span className="text-xl">
                              <Lightbulb className="w-5 h-5 text-yellow-600" />
                            </span>
                            <div className="text-sm">
                              <strong className="block mb-1 font-bold">
                                家長小貼士
                              </strong>
                              {section.id === "daily"
                                ? "可先讓孩子在畫面內完成任務，再在真實情境中請他們把詞語說出來，幫助從辨認過渡到主動輸出。"
                                : "多問開放式問題，並給予小朋友足夠時間思考和回應。就算他們沒有即時用準確的字眼回答也沒關係，多加鼓勵即可！"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div className="bg-linear-to-br from-indigo-50 to-blue-50 rounded-4xl p-6 border-2 border-indigo-100">
        <h3 className="text-lg font-black text-indigo-900 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-indigo-500 fill-indigo-500" />
          使用小提醒
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex gap-3">
            <span className="font-bold text-indigo-400 text-lg">01</span>
            <div>
              <strong className="block text-indigo-900">每日任務</strong>
              <span className="text-indigo-700/80">
                適合小朋友先在介面上完成，再由家長延伸成口語練習。
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-indigo-400 text-lg">02</span>
            <div>
              <strong className="block text-indigo-900">生活實戰任務</strong>
              <span className="text-indigo-700/80">
                適合家長在用餐、外出、睡前等真實情境陪伴完成。
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-indigo-400 text-lg">03</span>
            <div>
              <strong className="block text-indigo-900">兩個介面任務</strong>
              <span className="text-indigo-700/80">
                兩個介面只決定顯示對象；是否屬於每日任務或生活實戰任務仍由任務類型決定。
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-indigo-400 text-lg">04</span>
            <div>
              <strong className="block text-indigo-900">多加鼓勵</strong>
              <span className="text-indigo-700/80">
                讚賞每一次嘗試，比糾正得快更能建立孩子的信心。
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
