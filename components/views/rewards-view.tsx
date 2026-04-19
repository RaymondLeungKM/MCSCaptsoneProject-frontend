"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Flame,
  Gamepad2,
  Lock,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";

import {
  getAchievements,
  getDailyStats,
  getProgressStats,
  type ChildAchievementResponse,
  type DailyStatsResponse,
  type ProgressStatsResponse,
} from "@/lib/api/progress";
import type { ChildProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface RewardsViewProps {
  profile: ChildProfile;
  onOpenTab?: (tab: "learn" | "games" | "stories") => void;
  refreshKey?: number;
}

type MilestoneMetric = "words" | "streak" | "level" | "xp";

interface MilestoneBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  metric: MilestoneMetric;
  requirement: number;
  accent: string;
}

const milestoneCatalog: MilestoneBadge[] = [
  {
    id: "words-1",
    name: "第一步",
    icon: "🌟",
    description: "學會第一個單字。",
    metric: "words",
    requirement: 1,
    accent: "from-yellow-300 to-orange-300",
  },
  {
    id: "words-10",
    name: "詞彙探索家",
    icon: "🔍",
    description: "累積學會 10 個單字。",
    metric: "words",
    requirement: 10,
    accent: "from-sky-300 to-cyan-300",
  },
  {
    id: "words-25",
    name: "單字冠軍",
    icon: "🏆",
    description: "累積學會 25 個單字。",
    metric: "words",
    requirement: 25,
    accent: "from-amber-300 to-yellow-300",
  },
  {
    id: "streak-3",
    name: "穩定練習者",
    icon: "🔥",
    description: "連續學習 3 天。",
    metric: "streak",
    requirement: 3,
    accent: "from-orange-300 to-rose-300",
  },
  {
    id: "streak-7",
    name: "火力全開",
    icon: "💥",
    description: "連續學習 7 天。",
    metric: "streak",
    requirement: 7,
    accent: "from-rose-300 to-pink-300",
  },
  {
    id: "level-3",
    name: "成長新星",
    icon: "⭐",
    description: "升到等級 3。",
    metric: "level",
    requirement: 3,
    accent: "from-violet-300 to-fuchsia-300",
  },
  {
    id: "level-5",
    name: "超級新星",
    icon: "🌠",
    description: "升到等級 5。",
    metric: "level",
    requirement: 5,
    accent: "from-indigo-300 to-violet-300",
  },
  {
    id: "xp-100",
    name: "能量滿滿",
    icon: "⚡",
    description: "累積 100 XP。",
    metric: "xp",
    requirement: 100,
    accent: "from-emerald-300 to-teal-300",
  },
  {
    id: "xp-250",
    name: "閃亮冒險家",
    icon: "✨",
    description: "累積 250 XP。",
    metric: "xp",
    requirement: 250,
    accent: "from-cyan-300 to-sky-300",
  },
  {
    id: "xp-500",
    name: "獎勵大師",
    icon: "👑",
    description: "累積 500 XP。",
    metric: "xp",
    requirement: 500,
    accent: "from-yellow-300 to-amber-400",
  },
];

function getMetricValue(
  profile: ChildProfile,
  metric: MilestoneMetric,
): number {
  switch (metric) {
    case "words":
      return profile.wordsLearned;
    case "streak":
      return profile.currentStreak;
    case "level":
      return profile.level;
    case "xp":
      return profile.xp;
  }
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("zh-HK", {
    month: "numeric",
    day: "numeric",
  });
}

function RewardStat({
  icon: Icon,
  value,
  label,
  helper,
  className,
}: {
  icon: typeof Trophy;
  value: string;
  label: string;
  helper: string;
  className: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-md">
      <div
        className={cn(
          "mb-3 flex h-12 w-12 items-center justify-center rounded-2xl",
          className,
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-3xl font-black text-slate-800">{value}</p>
      <p className="mt-1 text-sm font-black text-slate-600">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-500">{helper}</p>
    </div>
  );
}

export function RewardsView({
  profile,
  onOpenTab,
  refreshKey = 0,
}: RewardsViewProps) {
  const [progressStats, setProgressStats] =
    useState<ProgressStatsResponse | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStatsResponse[]>([]);
  const [achievements, setAchievements] = useState<ChildAchievementResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRewardsData() {
      setLoading(true);

      try {
        const [progressResult, dailyResult, achievementsResult] =
          await Promise.allSettled([
            getProgressStats(profile.id),
            getDailyStats(profile.id, 7),
            getAchievements(profile.id),
          ]);

        if (cancelled) {
          return;
        }

        setProgressStats(
          progressResult.status === "fulfilled" ? progressResult.value : null,
        );
        setDailyStats(
          dailyResult.status === "fulfilled" ? dailyResult.value : [],
        );
        setAchievements(
          achievementsResult.status === "fulfilled"
            ? achievementsResult.value
            : [],
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRewardsData();

    return () => {
      cancelled = true;
    };
  }, [profile.id, refreshKey]);

  const milestoneBadges = useMemo(
    () =>
      milestoneCatalog.map((badge) => {
        const currentValue = getMetricValue(profile, badge.metric);
        const unlocked = currentValue >= badge.requirement;
        const progress = Math.min(
          (currentValue / badge.requirement) * 100,
          100,
        );

        return {
          ...badge,
          currentValue,
          unlocked,
          progress,
        };
      }),
    [profile],
  );

  const unlockedMilestones = milestoneBadges.filter((badge) => badge.unlocked);
  const lockedMilestones = milestoneBadges.filter((badge) => !badge.unlocked);
  const nextTargets = (["words", "streak", "level", "xp"] as const)
    .map((metric) => lockedMilestones.find((badge) => badge.metric === metric))
    .filter((badge): badge is (typeof lockedMilestones)[number] =>
      Boolean(badge),
    );

  const weeklyXp = dailyStats.reduce((sum, day) => sum + day.xp_earned, 0);
  const weeklyMinutes = dailyStats.reduce(
    (sum, day) => sum + day.total_minutes,
    0,
  );
  const activeDays = dailyStats.filter(
    (day) => day.total_minutes > 0 || day.session_count > 0,
  ).length;
  const maxDailyXp = Math.max(...dailyStats.map((day) => day.xp_earned), 1);
  const totalBadgeCount = achievements.length + unlockedMilestones.length;

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[40px] border border-white/60 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="bg-linear-to-r from-yellow-100/80 via-orange-100/70 to-sky-100/70 px-6 py-8 md:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-black text-amber-600 shadow-sm">
                <Trophy className="h-4 w-4" />
                獎勵基地
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-800 md:text-4xl">
                {profile.name} 的獎勵牆
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500 md:text-base">
                這裡會整理你已經獲得的徽章、最近的努力成果，和下一個快要解鎖的目標。
              </p>
            </div>

            <div className="rounded-4xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur-md md:w-[320px]">
              <div className="flex items-center justify-between text-sm font-black text-slate-500">
                <span>今日目標進度</span>
                <span>
                  {profile.todayProgress}/{profile.dailyGoal}
                </span>
              </div>
              <Progress
                value={
                  profile.dailyGoal > 0
                    ? Math.min(
                        (profile.todayProgress / profile.dailyGoal) * 100,
                        100,
                      )
                    : 0
                }
                className="mt-3 h-3 rounded-full bg-slate-100"
                indicatorClassName="bg-linear-to-r from-emerald-400 to-sky-400"
              />
              <div className="mt-4 flex items-center justify-between text-sm font-semibold text-slate-500">
                <span>等級 {profile.level}</span>
                <span>{profile.xp} XP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-3 md:px-8 md:py-8">
          <RewardStat
            icon={Trophy}
            value={String(totalBadgeCount)}
            label="已獲得徽章"
            helper="包括系統成就和學習里程碑。"
            className="bg-yellow-100 text-yellow-600"
          />
          <RewardStat
            icon={Star}
            value={String(weeklyXp)}
            label="本週 XP"
            helper="最近 7 天累積的學習能量。"
            className="bg-sky-100 text-sky-600"
          />
          <RewardStat
            icon={Flame}
            value={String(profile.currentStreak)}
            label="連續學習"
            helper={`最近 7 天有 ${activeDays} 天完成練習。`}
            className="bg-rose-100 text-rose-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-72 rounded-4xl" />
          <Skeleton className="h-72 rounded-4xl" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">
                    下一個解鎖目標
                  </h3>
                  <p className="text-sm font-semibold text-slate-500">
                    再努力一點點，就可以拿到新的徽章。
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {nextTargets.length > 0 ? (
                  nextTargets.map((badge) => (
                    <div
                      key={badge.id}
                      className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-3xl",
                            badge.accent,
                          )}
                        >
                          {badge.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-lg font-black text-slate-800">
                                {badge.name}
                              </p>
                              <p className="text-sm font-medium text-slate-500">
                                {badge.description}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="rounded-full border-slate-200 bg-white px-3 py-1 text-slate-600"
                            >
                              {badge.currentValue}/{badge.requirement}
                            </Badge>
                          </div>
                          <Progress
                            value={badge.progress}
                            className="mt-4 h-3 rounded-full bg-white"
                            indicatorClassName="bg-linear-to-r from-amber-400 to-orange-400"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-center">
                    <p className="text-lg font-black text-emerald-700">
                      全部里程碑都解鎖了
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-600">
                      目前這一批挑戰已經全部完成，做得很好。
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">
                    已獲得的徽章
                  </h3>
                  <p className="text-sm font-semibold text-slate-500">
                    每次練習、升級和連續打卡都會留下足跡。
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {achievements.map((achievement) => (
                  <div
                    key={`achievement-${achievement.achievement_id}`}
                    className="rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-teal-50 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-4xl">
                        {achievement.achievement_icon}
                      </div>
                      <Badge className="rounded-full bg-emerald-500 px-3 py-1 text-white hover:bg-emerald-500">
                        已解鎖
                      </Badge>
                    </div>
                    <p className="mt-3 text-base font-black text-slate-800">
                      {achievement.achievement_name}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      於 {formatShortDate(achievement.earned_at)} 獲得
                    </p>
                  </div>
                ))}

                {unlockedMilestones.map((badge) => (
                  <div
                    key={badge.id}
                    className="rounded-3xl border border-amber-100 bg-linear-to-br from-amber-50 to-yellow-50 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-4xl">{badge.icon}</div>
                      <Badge className="rounded-full bg-amber-500 px-3 py-1 text-white hover:bg-amber-500">
                        里程碑
                      </Badge>
                    </div>
                    <p className="mt-3 text-base font-black text-slate-800">
                      {badge.name}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {badge.description}
                    </p>
                  </div>
                ))}

                {achievements.length === 0 &&
                  unlockedMilestones.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center sm:col-span-2 lg:col-span-3">
                      <p className="text-lg font-black text-slate-700">
                        第一個徽章快來了
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        去學習或玩一局遊戲，很快就會看到第一個獎勵。
                      </p>
                    </div>
                  )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
                  <Star className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">
                    本週獎勵節奏
                  </h3>
                  <p className="text-sm font-semibold text-slate-500">
                    最近 7 天一共學習了 {weeklyMinutes} 分鐘。
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {dailyStats.length > 0 ? (
                  dailyStats.map((day) => (
                    <div
                      key={day.date}
                      className="rounded-[22px] bg-slate-50/80 p-4"
                    >
                      <div className="flex items-center justify-between text-sm font-black text-slate-600">
                        <span>{formatShortDate(day.date)}</span>
                        <span>+{day.xp_earned} XP</span>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Progress
                          value={Math.max(
                            (day.xp_earned / maxDailyXp) * 100,
                            day.xp_earned > 0 ? 12 : 0,
                          )}
                          className="h-3 flex-1 rounded-full bg-white"
                          indicatorClassName="bg-linear-to-r from-pink-400 to-orange-400"
                        />
                        <span className="min-w-16 text-right text-xs font-bold text-slate-500">
                          {day.total_minutes} 分鐘
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                    <p className="font-black text-slate-700">還沒有本週記錄</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      開始今天的學習後，這裡會出現你的獎勵成長曲線。
                    </p>
                  </div>
                )}
              </div>

              {progressStats && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] bg-indigo-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500">
                      主動詞彙
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-800">
                      {progressStats.active_vocabulary}
                    </p>
                  </div>
                  <div className="rounded-[22px] bg-emerald-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500">
                      平均曝光次數
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-800">
                      {progressStats.average_exposures_per_word.toFixed(1)}
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">
                    下一步行動
                  </h3>
                  <p className="text-sm font-semibold text-slate-500">
                    做這些活動，最快累積新的獎勵。
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <Button
                  type="button"
                  className="justify-start rounded-3xl bg-emerald-500 px-5 py-6 text-left font-black hover:bg-emerald-500/90"
                  onClick={() => onOpenTab?.("learn")}
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  去學習拿更多單字徽章
                </Button>
                <Button
                  type="button"
                  className="justify-start rounded-3xl bg-orange-500 px-5 py-6 text-left font-black hover:bg-orange-500/90"
                  onClick={() => onOpenTab?.("games")}
                >
                  <Gamepad2 className="mr-2 h-5 w-5" />
                  去遊戲維持連續打卡
                </Button>
                <Button
                  type="button"
                  className="justify-start rounded-3xl bg-violet-500 px-5 py-6 text-left font-black hover:bg-violet-500/90"
                  onClick={() => onOpenTab?.("stories")}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  去故事區賺更多 XP
                </Button>
              </div>
            </section>
          </div>
        </div>
      )}

      {!loading && lockedMilestones.length > 0 && (
        <section className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">尚未解鎖</h3>
              <p className="text-sm font-semibold text-slate-500">
                這些里程碑還差一點點，繼續前進就會亮起來。
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {lockedMilestones.map((badge) => (
              <div
                key={badge.id}
                className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4 opacity-80"
              >
                <div className="flex items-center justify-between">
                  <div className="text-4xl grayscale">{badge.icon}</div>
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-3 text-base font-black text-slate-700">
                  {badge.name}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {badge.description}
                </p>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  {badge.currentValue}/{badge.requirement}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
