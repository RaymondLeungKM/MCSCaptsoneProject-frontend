"use client";

import { useEffect, useState } from "react";
import {
  Flame,
  BookOpen,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  Shield,
  Clock3,
  Activity,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type {
  ChildProfile,
  LearningInsight,
  ProgressStats,
  WeeklyDeltaMetric,
  WeeklyDeltaSummary,
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  approveActiveVocabRequest,
  getPendingActiveVocabRequests,
  rejectActiveVocabRequest,
  type ActiveVocabularyApprovalRequest,
} from "@/lib/api/vocabulary";
import {
  getParentalControls,
  updateParentalControls,
} from "@/lib/api/parent-dashboard";

interface OverviewTabProps {
  profile: ChildProfile;
  stats: ProgressStats;
  insights?: LearningInsight[];
  weeklyDelta?: WeeklyDeltaSummary | null;
  onActiveVocabularyApproved?: () => void | Promise<void>;
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

const insightPriorityOrder = {
  high: 0,
  medium: 1,
  low: 2,
} as const;

function sortInsightsByPriority(insights: LearningInsight[]) {
  return [...insights].sort((left, right) => {
    const priorityDiff =
      insightPriorityOrder[left.priority] -
      insightPriorityOrder[right.priority];

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return Date.parse(right.generated_at) - Date.parse(left.generated_at);
  });
}

function getTranslatedCategory(category: string) {
  return categoryTranslations[category] || category;
}

function getCategorySuggestion(category: string) {
  switch (category) {
    case "Animals":
    case "動物":
      return "可用玩偶、動物圖卡或故事書做命名和角色扮演。";
    case "Food":
    case "食物":
      return "可在用餐時做指認、描述味道和顏色的小遊戲。";
    case "Colors":
    case "顏色":
      return "可在家中做顏色尋寶和物件配對，加強分類記憶。";
    case "Nature":
    case "大自然":
      return "可到公園觀察實物，邊看邊說名稱和特徵。";
    case "Vehicles":
    case "交通工具":
      return "可用玩具車和街景圖片做分類與情境命名練習。";
    case "Family":
    case "家庭":
      return "可用家庭照片做人物稱呼和關係配對練習。";
    case "Numbers":
    case "數字":
      return "可把數字詞彙放進收拾玩具或點心分配的情境中練習。";
    case "Body":
    case "身體部位":
      return "可用唱遊和跟做指令活動，把詞彙和動作連起來。";
    case "Actions":
    case "動作":
      return "可讓孩子邊做邊說，把動詞和身體動作一起記。";
    default:
      return "可用圖片、實物或動作配對，幫助孩子把詞彙放進生活情境。";
  }
}

function getFocusLabel(progress: number) {
  if (progress < 40) {
    return "需加強";
  }

  if (progress < 80) {
    return "持續複習";
  }

  return "表現穩定";
}

function getInsightEyebrow(insight: LearningInsight) {
  switch (insight.insight_type) {
    case "milestone":
      return "學習里程碑";
    case "strength":
      return "目前優勢";
    case "weakness":
      return "留意重點";
    case "recommendation":
    default:
      return "家長建議";
  }
}

export function OverviewTab({
  profile,
  stats,
  insights = [],
  weeklyDelta = null,
  onActiveVocabularyApproved,
}: OverviewTabProps) {
  const dailyProgress =
    profile.dailyGoal > 0
      ? Math.min((profile.todayProgress / profile.dailyGoal) * 100, 100)
      : 0;
  const overallProgress =
    stats.totalWords > 0 ? (stats.masteredWords / stats.totalWords) * 100 : 0;
  const remaining = Math.max(0, profile.dailyGoal - profile.todayProgress);
  const days = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];
  const weeklySeries = days.map((_, index) => stats.weeklyProgress[index] ?? 0);
  const timeOfDayLabel: Record<string, string> = {
    morning: "早上",
    afternoon: "下午",
    evening: "晚上",
  };
  const weeklyTotal = weeklySeries.reduce((sum, value) => sum + value, 0);
  const peakValue = Math.max(...weeklySeries, 0);
  const hasWeeklyActivity = peakValue > 0;
  const peakDayIndex = weeklySeries.findIndex((value) => value === peakValue);
  const maxWeeklyValue = hasWeeklyActivity ? peakValue : 1;
  const categoryRanking = [...stats.categoryProgress].sort(
    (left, right) => right.progress - left.progress,
  );
  const categoryFocusList = [...stats.categoryProgress]
    .filter(
      (category) =>
        category.progress > 0 ||
        (category.total ?? 0) > 0 ||
        (category.mastered ?? 0) > 0,
    )
    .sort((left, right) => {
      const leftGap = Math.max((left.total ?? 0) - (left.mastered ?? 0), 0);
      const rightGap = Math.max((right.total ?? 0) - (right.mastered ?? 0), 0);

      if (left.progress !== right.progress) {
        return left.progress - right.progress;
      }

      if (leftGap !== rightGap) {
        return rightGap - leftGap;
      }

      return (right.total ?? 0) - (left.total ?? 0);
    })
    .slice(0, 3);
  const strongestCategory = categoryRanking[0];
  const focusCategory = categoryFocusList[0];
  const sortedInsights = sortInsightsByPriority(insights);
  const spotlightInsight = sortedInsights[0];
  const supportingInsights = sortedInsights.slice(1, 3);
  const weeklyChangeActions =
    spotlightInsight && spotlightInsight.action_items.length > 0
      ? spotlightInsight.action_items.slice(0, 2)
      : [
          focusCategory
            ? `本週先複習「${getTranslatedCategory(focusCategory.category)}」，把較弱的主題拉回穩定。`
            : `今天可安排在${timeOfDayLabel[profile.preferredTimeOfDay]}做一段 10 分鐘短練習。`,
          stats.multiSensoryEngagement >= 80
            ? "可加入更多口語輸出，讓孩子把已認得的詞彙說出來。"
            : "建議在同一輪練習中加入圖片、動作和實物配對。",
        ];
  const weeklyChangeSummary = spotlightInsight
    ? {
        eyebrow: getInsightEyebrow(spotlightInsight),
        title: spotlightInsight.title,
        detail: spotlightInsight.description,
      }
    : {
        eyebrow: "本週節奏",
        title:
          dailyProgress >= 100
            ? "今日目標已完成，節奏保持穩定"
            : focusCategory
              ? `本週先補強「${getTranslatedCategory(focusCategory.category)}」`
              : "學習節奏仍在建立中",
        detail:
          dailyProgress >= 100
            ? `今天已完成 ${profile.todayProgress} / ${profile.dailyGoal} 個詞彙目標，可安排一次輕鬆複習鞏固記憶。`
            : focusCategory
              ? getCategorySuggestion(focusCategory.category)
              : "完成幾次學習後，這裡會開始顯示本週最值得留意的變化。",
      };

  const parentTips =
    sortedInsights.length > 0
      ? sortedInsights.slice(0, 3).map((insight) => ({
          id: insight.id,
          eyebrow: getInsightEyebrow(insight),
          title: insight.title,
          detail: insight.action_items[0] || insight.description,
        }))
      : [
          {
            id: "goal",
            eyebrow: "今日節奏",
            title: dailyProgress >= 100 ? "今日目標已完成" : "今日尚有練習空間",
            detail:
              dailyProgress >= 100
                ? "可以用 5 分鐘輕鬆複習鞏固記憶。"
                : `距離今日目標還差 ${remaining} 個詞彙，建議在${timeOfDayLabel[profile.preferredTimeOfDay]}安排一段短練習。`,
          },
          {
            id: "engagement",
            eyebrow: "參與模式",
            title:
              stats.multiSensoryEngagement >= 80
                ? "多感官參與表現穩定"
                : "可再增加多感官提示",
            detail:
              stats.multiSensoryEngagement >= 80
                ? "可加入更多口說輸出任務，幫助孩子把已認得的詞彙說出來。"
                : "建議多用動作、圖片或實物配對，提升多感官參與度。",
          },
          {
            id: "focus",
            eyebrow: "複習主題",
            title: focusCategory
              ? `本週可優先複習「${getTranslatedCategory(focusCategory.category)}」`
              : "繼續保持每日小步前進",
            detail: focusCategory
              ? getCategorySuggestion(focusCategory.category)
              : "掌握度會隨著穩定練習逐步建立。",
          },
        ];

  const completionRate =
    stats.totalWords > 0
      ? Math.round((stats.masteredWords / stats.totalWords) * 100)
      : 0;
  const retentionIndex = Math.round(
    Math.min(
      100,
      completionRate * 0.7 + Math.min(stats.averageExposuresPerWord, 8) * 3.75,
    ),
  );
  const retentionDelta = weeklyDelta?.words_learned.delta ?? 0;
  const retentionTrendLabel =
    retentionDelta > 0 ? "上升" : retentionDelta < 0 ? "回落" : "持平";

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
                    ? `目前掌握最好的是「${getTranslatedCategory(strongestCategory.category)}」。`
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

      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-4xl border-2 border-slate-100 shadow-sm xl:order-1">
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
                  value={
                    hasWeeklyActivity && peakDayIndex >= 0
                      ? days[peakDayIndex]
                      : "暫無"
                  }
                />
              </div>
              {weeklyDelta && (
                <div className="rounded-3xl bg-linear-to-r from-sky-50 to-white p-4 ring-1 ring-slate-100">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-500">
                        相比上週
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        這一列由後端摘要直接提供，避免前端各自計算不同週期。
                      </p>
                    </div>
                    <div className="w-full rounded-2xl bg-white px-4 py-3 text-left shadow-sm ring-1 ring-slate-100 sm:mt-0.5 sm:w-auto sm:min-w-38 sm:flex-none sm:text-right">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        比較時間
                      </p>
                      <p className="text-sm font-black text-slate-700">
                        本週 vs 上週
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <WeeklyDeltaPill
                      label="新詞彙"
                      metric={weeklyDelta.words_learned}
                      unit="個"
                    />
                    <WeeklyDeltaPill
                      label="學習時間"
                      metric={weeklyDelta.learning_time}
                      unit="分"
                    />
                    <WeeklyDeltaPill
                      label="學習回合"
                      metric={weeklyDelta.sessions}
                      unit="次"
                    />
                    <WeeklyDeltaPill
                      label="活躍日"
                      metric={weeklyDelta.active_days}
                      unit="天"
                    />
                  </div>
                </div>
              )}
              <div className="rounded-[28px] bg-linear-to-b from-slate-50 to-white p-4 ring-1 ring-slate-100">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      每日詞彙軌跡
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      依照每天接觸到的不同詞彙數量統計
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm ring-1 ring-slate-100">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-500">
                      本週峰值
                    </p>
                    <p className="text-lg font-black text-slate-700">
                      {peakValue} 個
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-3">
                  {days.map((day, index) => {
                    const dayValue = weeklySeries[index];
                    const heightPercent = (dayValue / maxWeeklyValue) * 100;
                    const barHeight =
                      dayValue > 0 ? Math.max(heightPercent, 14) : 0;

                    return (
                      <div
                        key={day}
                        className="group flex flex-col items-center gap-2"
                      >
                        <p
                          className={`text-xs font-black ${
                            dayValue > 0 ? "text-slate-700" : "text-slate-300"
                          }`}
                        >
                          {dayValue}
                        </p>
                        <div className="flex h-28 w-full items-end rounded-[20px] bg-slate-100/90 p-2 shadow-inner shadow-slate-200/60">
                          <div
                            className="w-full rounded-[14px] bg-linear-to-t from-sky-500 to-cyan-300 shadow-[0_10px_24px_rgba(14,165,233,0.24)] transition-all duration-700 group-hover:from-orange-400 group-hover:to-amber-300"
                            style={{ height: `${barHeight}%` }}
                          />
                        </div>
                        <p className="text-[11px] font-bold text-slate-400">
                          {day}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-4xl border-2 border-slate-100 shadow-sm xl:order-3">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-700">
                <Target className="h-5 w-5 text-sky-500" />
                主題掌握焦點
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryFocusList.length > 0 ? (
                categoryFocusList.map((category) => {
                  const translatedName = getTranslatedCategory(
                    category.category,
                  );
                  const remainingWords = Math.max(
                    (category.total ?? 0) - (category.mastered ?? 0),
                    0,
                  );

                  return (
                    <div
                      key={category.category}
                      className="rounded-3xl bg-slate-50 px-4 py-4"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-700">
                            {translatedName}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-400">
                            {getFocusLabel(category.progress)}
                          </p>
                        </div>
                        <span className="text-sm font-black text-slate-400">
                          {Math.round(category.progress)}%
                        </span>
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
                      <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                        {category.total && category.mastered !== undefined
                          ? `已掌握 ${category.mastered} / ${category.total} 個詞彙，尚有 ${remainingWords} 個可加強。`
                          : "可優先安排這個主題的短練習，幫助掌握度更穩定。"}
                      </p>
                      <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                        {getCategorySuggestion(category.category)}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6">
                  <p className="text-sm font-black text-slate-700">
                    暫時未有主題掌握資料
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                    完成幾次學習後，這裡會顯示最需要加強的主題和對應的複習建議。
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-4xl border-none bg-linear-to-br from-slate-900 via-slate-800 to-sky-900 shadow-sm xl:order-2">
            <CardHeader className="pb-4 text-white">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-sky-200">
                <TrendingUp className="h-3.5 w-3.5" />
                即時洞察
              </div>
              <CardTitle className="flex items-center gap-2 text-lg font-black text-white">
                <Sparkles className="h-5 w-5 text-amber-300" />
                本週新變化
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-white">
              <div className="rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-200">
                  {weeklyChangeSummary.eyebrow}
                </p>
                <p className="mt-2 text-xl font-black leading-8 text-white">
                  {weeklyChangeSummary.title}
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-300">
                  {weeklyChangeSummary.detail}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <MiniMetric
                  icon={<Layers className="h-4 w-4 text-amber-300" />}
                  label="本週焦點"
                  value={
                    focusCategory
                      ? getTranslatedCategory(focusCategory.category)
                      : "建立節奏"
                  }
                  className="bg-white/8 text-white ring-1 ring-white/10"
                  labelClassName="text-slate-400"
                  valueClassName="text-white"
                />
                <MiniMetric
                  icon={<BookOpen className="h-4 w-4 text-sky-300" />}
                  label="主動詞彙"
                  value={`${stats.activeVocabulary} 個`}
                  className="bg-white/8 text-white ring-1 ring-white/10"
                  labelClassName="text-slate-400"
                  valueClassName="text-white"
                />
                <MiniMetric
                  icon={<Activity className="h-4 w-4 text-emerald-300" />}
                  label="多感官參與"
                  value={`${stats.multiSensoryEngagement}%`}
                  className="bg-white/8 text-white ring-1 ring-white/10"
                  labelClassName="text-slate-400"
                  valueClassName="text-white"
                />
              </div>

              <div className="space-y-2">
                {weeklyChangeActions.map((action) => (
                  <div
                    key={action}
                    className="flex items-start gap-3 rounded-2xl bg-white/6 px-4 py-3"
                  >
                    <div className="mt-0.5 rounded-full bg-emerald-400/20 p-1 text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium leading-6 text-slate-200">
                      {action}
                    </p>
                  </div>
                ))}
              </div>

              {supportingInsights.length > 0 && (
                <div className="space-y-2">
                  {supportingInsights.map((insight) => (
                    <div
                      key={insight.id}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">
                        {getInsightEyebrow(insight)}
                      </p>
                      <p className="mt-1 text-sm font-bold leading-6 text-white">
                        {insight.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-4xl border-2 border-slate-100 shadow-sm xl:order-4">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-700">
                <Sparkles className="h-5 w-5 text-amber-500" />
                家長小提示
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {parentTips.map((tip, index) => (
                <div
                  key={tip.id || index}
                  className="rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-500">
                    {tip.eyebrow}
                  </p>
                  <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
                    {tip.title}
                  </p>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                    {tip.detail}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <PendingActiveVocabularyCard
          childId={profile.id}
          onApproved={onActiveVocabularyApproved}
        />
      </div>
    </div>
  );
}

function PendingActiveVocabularyCard({
  childId,
  onApproved,
}: {
  childId: string;
  onApproved?: () => void | Promise<void>;
}) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ActiveVocabularyApprovalRequest[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [actingWordId, setActingWordId] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      setRequests([]);
      return;
    }

    void (async () => {
      setLoading(true);
      try {
        setRequests(await getPendingActiveVocabRequests(childId));
      } catch {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [childId]);

  const handleRequest = async (
    wordId: string,
    action: "approve" | "reject",
  ) => {
    const request = requests.find((item) => item.word_id === wordId);
    const wordLabel = request?.word_cantonese || request?.word || "該詞語";

    setActingWordId(wordId);
    try {
      if (action === "approve") {
        await approveActiveVocabRequest(wordId, childId);
        setRequests((prev) =>
          prev.filter((pendingRequest) => pendingRequest.word_id !== wordId),
        );
        toast({
          title: "已批准詞語",
          description: `${wordLabel} 已加入主動詞彙。`,
        });
        if (onApproved) {
          void Promise.resolve(onApproved()).catch((refreshError) => {
            console.error(
              "Failed to refresh parent dashboard after approval",
              refreshError,
            );
          });
        }
      } else {
        await rejectActiveVocabRequest(wordId, childId);
        setRequests((prev) =>
          prev.filter((pendingRequest) => pendingRequest.word_id !== wordId),
        );
        toast({
          title: "已拒絕詞語",
          description: `${wordLabel} 已從待確認清單移除。`,
        });
      }
    } catch (error) {
      console.error(`Failed to ${action} active vocabulary request`, error);
      toast({
        title: action === "approve" ? "批准失敗" : "拒絕失敗",
        description: "未能更新詞語狀態，請稍後再試。",
        variant: "destructive",
      });
    } finally {
      setActingWordId(null);
    }
  };

  if (!getAuthToken()) {
    return null;
  }

  return (
    <Card className="rounded-4xl border-2 border-amber-100 bg-amber-50/60 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-700">
          <Shield className="h-5 w-5 text-amber-500" />
          待家長確認主動詞彙
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm font-medium text-slate-500">
            正在載入確認請求...
          </p>
        ) : requests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-amber-200 bg-white/70 px-5 py-6">
            <p className="text-sm font-black text-slate-700">
              目前沒有待確認詞語
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              當孩子在兒童模式中按下「請家長確認」後，這裡就會出現批准或拒絕的清單。
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.word_id}
                className="rounded-3xl bg-white px-4 py-4 shadow-sm ring-1 ring-amber-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-slate-700">
                      {request.word_cantonese || request.word}
                    </p>
                    {request.word_cantonese && (
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {request.word}
                      </p>
                    )}
                    <p className="mt-2 text-xs font-bold text-amber-600">
                      請求時間：
                      {new Date(request.requested_at).toLocaleString("zh-HK")}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      已累積 {request.exposure_count} 次接觸
                      {request.last_practiced &&
                        `，最近練習於 ${new Date(request.last_practiced).toLocaleDateString("zh-HK")}`}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        void handleRequest(request.word_id, "approve")
                      }
                      disabled={actingWordId === request.word_id}
                      className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      批准
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void handleRequest(request.word_id, "reject")
                      }
                      disabled={actingWordId === request.word_id}
                      className="rounded-2xl border-rose-200 text-rose-500 hover:bg-rose-50"
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      拒絕
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
  className,
  labelClassName,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("rounded-3xl bg-slate-50 p-4", className)}>
      <div className="mb-3 inline-flex rounded-2xl bg-white p-2 shadow-sm">
        {icon}
      </div>
      <p
        className={cn(
          "text-xs font-bold uppercase tracking-[0.18em] text-slate-400",
          labelClassName,
        )}
      >
        {label}
      </p>
      <p
        className={cn("mt-1 text-lg font-black text-slate-800", valueClassName)}
      >
        {value}
      </p>
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

function WeeklyDeltaPill({
  label,
  metric,
  unit,
}: {
  label: string;
  metric: WeeklyDeltaMetric;
  unit: string;
}) {
  const deltaToneClass =
    metric.delta > 0
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : metric.delta < 0
        ? "bg-rose-50 text-rose-600 ring-rose-100"
        : "bg-slate-50 text-slate-600 ring-slate-100";
  const deltaLabel =
    metric.delta > 0
      ? `+${metric.delta}${unit}`
      : metric.delta < 0
        ? `${metric.delta}${unit}`
        : "持平";

  return (
    <div className="rounded-3xl bg-white px-4 pb-4 pt-5 shadow-sm ring-1 ring-slate-100">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-sm font-bold leading-tight tracking-[0.04em] text-slate-400">
          {label}
        </p>
        <span
          className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ring-1 ${deltaToneClass}`}
        >
          {deltaLabel}
        </span>
      </div>

      <p className="mt-3 text-lg font-black text-slate-800">
        本週 {metric.current}
        {unit}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-500">
        上週 {metric.previous}
        {unit}
      </p>
    </div>
  );
}
