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
  Clock3,
  Activity,
  CheckCircle2,
  Shield,
  XCircle,
} from "lucide-react";
import type { ChildProfile, LearningInsight, ProgressStats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getAuthToken } from "@/lib/api/client";
import {
  approveActiveVocabRequest,
  getPendingActiveVocabRequests,
  rejectActiveVocabRequest,
  type ActiveVocabularyApprovalRequest,
} from "@/lib/api/vocabulary";

interface OverviewTabProps {
  profile: ChildProfile;
  stats: ProgressStats;
  insights?: LearningInsight[];
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

  const parentTips =
    insights.length > 0
      ? [...insights]
          .sort((left, right) => {
            const priorityDiff =
              insightPriorityOrder[left.priority] -
              insightPriorityOrder[right.priority];

            if (priorityDiff !== 0) {
              return priorityDiff;
            }

            return (
              Date.parse(right.generated_at) - Date.parse(left.generated_at)
            );
          })
          .slice(0, 3)
          .map((insight) => ({
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
                value={
                  hasWeeklyActivity && peakDayIndex >= 0
                    ? days[peakDayIndex]
                    : "暫無"
                }
              />
            </div>
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
            {categoryFocusList.length > 0 ? (
              categoryFocusList.map((category) => {
                const translatedName = getTranslatedCategory(category.category);
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
    setActingWordId(wordId);
    try {
      if (action === "approve") {
        await approveActiveVocabRequest(wordId, childId);
        await onApproved?.();
      } else {
        await rejectActiveVocabRequest(wordId, childId);
      }

      setRequests((prev) =>
        prev.filter((request) => request.word_id !== wordId),
      );
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
