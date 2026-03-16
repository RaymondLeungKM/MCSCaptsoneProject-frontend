"use client";

import {
  Flame,
  BookOpen,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  Clock3,
  Activity,
} from "lucide-react";
import type { ChildProfile, ProgressStats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface OverviewTabProps {
  profile: ChildProfile;
  stats: ProgressStats;
}

// --- 1. DEFINE TRANSLATIONS HERE (Outside the function) ---
const categoryTranslations: Record<string, string> = {
  Animals: "動物",
  Food: "食物",
  Colors: "顏色",
  Nature: "大自然",
  Vehicles: "交通工具",
  Family: "家庭",
  Numbers: "數字",
  Body: "身體部位",
  Actions: "動作",
};

export function OverviewTab({ profile, stats }: OverviewTabProps) {
  const dailyProgress =
    profile.dailyGoal > 0
      ? Math.min((profile.todayProgress / profile.dailyGoal) * 100, 100)
      : 0;
  const overallProgress =
    stats.totalWords > 0 ? (stats.masteredWords / stats.totalWords) * 100 : 0;
  const remaining = Math.max(0, profile.dailyGoal - profile.todayProgress);
  const days = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];
  const timeOfDayLabel: Record<string, string> = {
    morning: "早上",
    afternoon: "下午",
    evening: "晚上",
  };
  const weeklyTotal = stats.weeklyProgress.reduce(
    (sum, value) => sum + value,
    0,
  );
  const peakValue = Math.max(...stats.weeklyProgress, 0);
  const peakDayIndex = stats.weeklyProgress.findIndex(
    (value) => value === peakValue,
  );
  const categoryRanking = [...stats.categoryProgress].sort(
    (left, right) => right.progress - left.progress,
  );
  const strongestCategory = categoryRanking[0];
  const focusCategory = [...stats.categoryProgress].sort(
    (left, right) => left.progress - right.progress,
  )[0];

  const parentTips = [
    dailyProgress >= 100
      ? "今日目標已完成，可以用 5 分鐘輕鬆複習鞏固記憶。"
      : `距離今日目標還差 ${remaining} 個詞彙，建議在${timeOfDayLabel[profile.preferredTimeOfDay]}安排一段短練習。`,
    stats.multiSensoryEngagement >= 80
      ? "多感官參與度表現不錯，可以加入更多口說輸出任務。"
      : "建議多用動作、圖片或實物配對，提升多感官參與度。",
    focusCategory
      ? `本週可優先複習「${categoryTranslations[focusCategory.category] || focusCategory.category}」，加快整體掌握度。`
      : "繼續保持每日小步前進，掌握度會更穩定。",
  ];

  return (
    <div className="space-y-6 font-zen">
      <Card className="overflow-hidden rounded-4xl border-none bg-linear-to-br from-sky-50 via-white to-orange-50 shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-sky-700 shadow-sm">
                <Sparkles className="h-4 w-4" />
                今日學習摘要
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-slate-800 md:text-4xl">
                  {profile.name} 今日進度穩定向前
                </h2>
                <p className="max-w-2xl text-sm font-medium leading-7 text-slate-500 md:text-base">
                  已完成 {profile.todayProgress} / {profile.dailyGoal}{" "}
                  個今日目標， 本週累積學習 {weeklyTotal} 個詞彙，
                  {strongestCategory
                    ? `目前掌握最好的是「${categoryTranslations[strongestCategory.category] || strongestCategory.category}」。`
                    : "目前正在建立穩定的學習節奏。"}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <HeroPill
                  icon={<Flame className="h-5 w-5 text-orange-500" />}
                  label="連續學習"
                  value={`${profile.currentStreak} 日`}
                />
                <HeroPill
                  icon={<Trophy className="h-5 w-5 text-amber-500" />}
                  label="目前等級"
                  value={`Lv ${profile.level}`}
                />
                <HeroPill
                  icon={<BookOpen className="h-5 w-5 text-sky-500" />}
                  label="已掌握詞彙"
                  value={`${stats.masteredWords} 個`}
                />
              </div>
            </div>

            <div className="rounded-[28px] bg-white/85 p-5 shadow-sm ring-1 ring-white/70">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    今日目標
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-800">
                    {profile.todayProgress}
                    <span className="ml-1 text-base font-bold text-slate-400">
                      / {profile.dailyGoal}
                    </span>
                  </p>
                </div>
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-600">
                  <Target className="h-6 w-6" />
                </div>
              </div>
              <Progress
                value={dailyProgress}
                className="h-3 rounded-full bg-slate-100"
                indicatorClassName="bg-sky-500"
              />
              <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                {dailyProgress >= 100
                  ? "今日目標已完成，建議進行一次輕鬆複習，幫助孩子把新詞彙記得更牢。"
                  : `距離達標還差 ${remaining} 個詞彙，最適合安排在${timeOfDayLabel[profile.preferredTimeOfDay]}進行 10 分鐘短練習。`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card className="rounded-4xl border-2 border-slate-100 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-700">
              <Calendar className="h-5 w-5 text-sky-500" />
              本週學習節奏
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <MiniMetric
                icon={<TrendingUp className="h-4 w-4 text-sky-500" />}
                label="本週新詞彙"
                value={`${weeklyTotal}`}
              />
              <MiniMetric
                icon={<Clock3 className="h-4 w-4 text-emerald-500" />}
                label="平均輸入次數"
                value={`${stats.averageExposuresPerWord.toFixed(1)} 次`}
              />
              <MiniMetric
                icon={<Activity className="h-4 w-4 text-violet-500" />}
                label="最活躍日"
                value={peakDayIndex >= 0 ? days[peakDayIndex] : "暫無"}
              />
            </div>
            <div className="flex h-44 items-end justify-between gap-2 px-1 pt-2">
              {days.map((day, index) => {
                const maxValue = Math.max(...stats.weeklyProgress, 1);
                const heightPercent =
                  (stats.weeklyProgress[index] / maxValue) * 100;
                return (
                  <div
                    key={day}
                    className="group flex flex-1 flex-col items-center gap-2"
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-slate-100">
                      <div
                        className="absolute bottom-0 w-full rounded-[18px] bg-linear-to-t from-sky-500 to-cyan-300 transition-all duration-700 group-hover:from-orange-400 group-hover:to-amber-300"
                        style={{ height: `${Math.max(heightPercent, 8)}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black text-slate-700">
                        {stats.weeklyProgress[index]}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {day}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-4xl border-2 border-slate-100 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-700">
              <Sparkles className="h-5 w-5 text-amber-500" />
              家長小提示
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {parentTips.map((tip, index) => (
              <div
                key={index}
                className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-slate-600"
              >
                {tip}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-4xl border-2 border-slate-100 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-700">
              <BookOpen className="h-5 w-5 text-sky-500" />
              詞彙掌握結構
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3 rounded-3xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm font-bold text-slate-600">
                <span>整體掌握度</span>
                <span>
                  {stats.masteredWords} / {stats.totalWords}
                </span>
              </div>
              <Progress
                value={overallProgress}
                className="h-3 rounded-full bg-white"
                indicatorClassName="bg-sky-500"
              />
              <p className="text-sm font-medium text-slate-500">
                目前已掌握 {Math.round(overallProgress)}% 的整體課程詞彙。
              </p>
            </div>

            <div className="space-y-4">
              <MetricRow
                label="主動詞彙"
                value={`${stats.activeVocabulary} 個`}
                progress={
                  stats.activeVocabulary + stats.passiveVocabulary > 0
                    ? (stats.activeVocabulary /
                        (stats.activeVocabulary + stats.passiveVocabulary)) *
                      100
                    : 0
                }
                indicatorClassName="bg-emerald-500"
              />
              <MetricRow
                label="被動詞彙"
                value={`${stats.passiveVocabulary} 個`}
                progress={
                  stats.activeVocabulary + stats.passiveVocabulary > 0
                    ? (stats.passiveVocabulary /
                        (stats.activeVocabulary + stats.passiveVocabulary)) *
                      100
                    : 0
                }
                indicatorClassName="bg-violet-400"
              />
              <MetricRow
                label="多感官參與度"
                value={`${stats.multiSensoryEngagement}%`}
                progress={stats.multiSensoryEngagement}
                indicatorClassName="bg-amber-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-4xl border-2 border-slate-100 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-700">
              <Layers className="h-5 w-5 text-emerald-500" />
              主題掌握焦點
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryRanking.slice(0, 5).map((category) => {
              const translatedName =
                categoryTranslations[category.category] || category.category;
              return (
                <div
                  key={category.category}
                  className="rounded-3xl bg-slate-50 px-4 py-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm font-bold">
                    <span className="text-slate-700">{translatedName}</span>
                    <span className="text-slate-400">{category.progress}%</span>
                  </div>
                  <Progress
                    value={category.progress}
                    className="h-2.5 rounded-full bg-white"
                    indicatorClassName={
                      category.progress >= 80
                        ? "bg-emerald-500"
                        : category.progress >= 40
                          ? "bg-sky-500"
                          : "bg-orange-400"
                    }
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HeroPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-white/85 px-4 py-3 shadow-sm ring-1 ring-white/70">
      <div className="mb-2 flex items-center gap-2">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-slate-800">{value}</p>
    </div>
  );
}

function MiniMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <div className="mb-3 inline-flex rounded-2xl bg-white p-2 shadow-sm">
        {icon}
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-slate-800">{value}</p>
    </div>
  );
}

function MetricRow({
  label,
  value,
  progress,
  indicatorClassName,
}: {
  label: string;
  value: string;
  progress: number;
  indicatorClassName: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-bold text-slate-600">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <Progress
        value={progress}
        className="h-2.5 rounded-full bg-slate-100"
        indicatorClassName={indicatorClassName}
      />
    </div>
  );
}
