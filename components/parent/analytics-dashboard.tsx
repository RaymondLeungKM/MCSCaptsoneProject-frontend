"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  Clock,
  Target,
  Flame,
  Star,
  Shield,
  Calendar,
  BarChart3,
  LineChart,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDashboardSummary,
  getAnalyticsCharts,
  getParentBenchmarks,
  getWordsByDate,
} from "@/lib/api/parent-dashboard";
import { API_BASE_URL, getAuthToken } from "@/lib/api/client";
import { lookupEmojiOrFallback } from "@/lib/word-emoji";
import type { ParentBenchmarks } from "@/lib/types";

// --- TYPES (Locally defined to ensure standalone functionality) ---
interface DashboardSummary {
  total_words_learned: number;
  current_streak: number;
  level: number;
  xp: number;
  weekly_words_learned: number;
  weekly_learning_time: number;
  weekly_sessions: number;
  weekly_xp_earned: number;
  category_progress: {
    category_id: string;
    category_name: string;
    category_name_cantonese?: string;
    words_learned: number;
    total_words: number;
    progress_percentage: number;
  }[];
  recent_insights: LearningInsight[];
  latest_report?: WeeklyReport;
}

interface AnalyticsCharts {
  time_series: {
    dates: string[];
    words_learned: number[];
  };
}

interface LearningInsight {
  id: string;
  title: string;
  description: string;
  type: "milestone" | "pattern" | "struggle" | "achievement";
  priority: "high" | "medium" | "low";
}

interface WeeklyReport {
  id: string;
  week_start: string;
  week_end: string;
  total_words_learned: number;
  total_learning_time: number;
  days_active: number;
  growth_percentage: number;
  strengths: string[];
  recommendations: string[];
}

interface WordEntry {
  id: string;
  word: string;
  word_cantonese?: string;
  jyutping?: string;
  image_url?: string;
  category: string;
  category_cantonese?: string;
  definition: string;
  definition_cantonese?: string;
  exposure_count: number;
  mastery_confidence?: number;
}

interface WordsByDateResult {
  date: string;
  child_id: string;
  words_count: number;
  words: WordEntry[];
}

// --- ROBUST MOCK DATA GENERATOR (Restored Full Logic) ---
// Simulates 3 months of data dynamically so the chart actually works
const generateMockData = () => {
  const today = new Date();
  const dates = [];
  const words = [];

  // Generate 90 days of data
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString());
    // Random daily words (0-5) with some variance
    words.push(Math.floor(Math.random() * 6));
  }

  return {
    summary: {
      total_words_learned: 142,
      current_streak: 12,
      level: 8,
      xp: 1250,
      weekly_words_learned: 18,
      weekly_learning_time: 145,
      weekly_sessions: 6,
      weekly_xp_earned: 320,
      category_progress: [
        {
          category_id: "1",
          category_name: "動物",
          words_learned: 24,
          total_words: 24,
          progress_percentage: 100,
        },
        {
          category_id: "2",
          category_name: "食物",
          words_learned: 12,
          total_words: 18,
          progress_percentage: 66,
        },
        {
          category_id: "3",
          category_name: "顏色",
          words_learned: 10,
          total_words: 12,
          progress_percentage: 83,
        },
        {
          category_id: "4",
          category_name: "大自然",
          words_learned: 8,
          total_words: 20,
          progress_percentage: 40,
        },
        {
          category_id: "5",
          category_name: "家庭",
          words_learned: 5,
          total_words: 10,
          progress_percentage: 50,
        },
      ],
      recent_insights: [
        {
          id: "1",
          title: "學習里程碑！",
          description: "Emma 已經連續 7 天完成學習，專注力顯著提升。",
          type: "milestone",
          priority: "high",
        },
        {
          id: "2",
          title: "視覺學習優勢",
          description: "數據顯示 Emma 對圖片配對遊戲的反應最快，正確率最高。",
          type: "pattern",
          priority: "medium",
        },
        {
          id: "3",
          title: "難點提示",
          description: "「大自然」類別的詞彙記憶較弱，建議多帶去公園實地觀察。",
          type: "struggle",
          priority: "low",
        },
      ],
      latest_report: {
        id: "r1",
        week_start: "2023-10-23",
        week_end: "2023-10-29",
        total_words_learned: 18,
        total_learning_time: 145,
        days_active: 6,
        growth_percentage: 15,
        strengths: ["動物識別", "發音準確度", "持續性"],
        recommendations: [
          "嘗試增加晚間共讀時間",
          "複習「顏色」相關詞彙",
          "進行更多戶外實物對照練習",
        ],
      },
    } as DashboardSummary,
    charts: {
      time_series: {
        dates: dates,
        words_learned: words,
      },
    } as AnalyticsCharts,
  };
};

const MOCK_WORDS_BY_DATE: WordEntry[] = [
  {
    id: "w1",
    word: "cat",
    word_cantonese: "貓",
    jyutping: "maau1",
    category: "Animals",
    category_cantonese: "動物",
    definition: "A small domesticated animal",
    definition_cantonese: "一種小型家養動物",
    exposure_count: 3,
    mastery_confidence: 0.8,
  },
  {
    id: "w2",
    word: "dog",
    word_cantonese: "狗",
    jyutping: "gau2",
    category: "Animals",
    category_cantonese: "動物",
    definition: "A common pet",
    definition_cantonese: "常見的寵物",
    exposure_count: 2,
    mastery_confidence: 0.7,
  },
  {
    id: "w3",
    word: "apple",
    word_cantonese: "蘋果",
    jyutping: "ping4 gwo2",
    category: "Food",
    category_cantonese: "食物",
    definition: "A fruit",
    definition_cantonese: "一種水果",
    exposure_count: 4,
    mastery_confidence: 0.9,
  },
  {
    id: "w4",
    word: "red",
    word_cantonese: "紅色",
    jyutping: "hung4 sik1",
    category: "Colors",
    category_cantonese: "顏色",
    definition: "A color",
    definition_cantonese: "一種顏色",
    exposure_count: 5,
    mastery_confidence: 1.0,
  },
  {
    id: "w5",
    word: "tree",
    word_cantonese: "樹",
    jyutping: "syu6",
    category: "Nature",
    category_cantonese: "大自然",
    definition: "A large plant",
    definition_cantonese: "一種大型植物",
    exposure_count: 2,
    mastery_confidence: 0.6,
  },
];

const MOCK_DB = generateMockData();

function isStoredImageUrl(url?: string): boolean {
  if (!url) return false;
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  );
}

function looksLikeEmoji(value?: string): boolean {
  return !!value && /\p{Extended_Pictographic}/u.test(value);
}

function resolveImageUrl(url?: string): string {
  if (!url || !isStoredImageUrl(url)) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  const base = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

// Map global insight_type to local type labels
function mapInsightType(
  insightType: string,
): "milestone" | "pattern" | "struggle" | "achievement" {
  const map: Record<
    string,
    "milestone" | "pattern" | "struggle" | "achievement"
  > = {
    strength: "achievement",
    weakness: "struggle",
    recommendation: "pattern",
    milestone: "milestone",
  };
  return map[insightType] ?? "pattern";
}

interface AnalyticsDashboardProps {
  childId: string;
}

const BENCHMARK_RANGE_OPTIONS = [7, 28, 90] as const;

const BENCHMARK_BAND_META = {
  ahead: {
    label: "高於同齡平均",
    detail: "目前表現位於同齡較前位置",
    badgeClassName:
      "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 shadow-sm",
  },
  on_track: {
    label: "與同齡相若",
    detail: "目前表現大致落在同齡中段",
    badgeClassName: "bg-sky-50 text-sky-800 ring-1 ring-sky-200 shadow-sm",
  },
  needs_support: {
    label: "需要更多練習",
    detail: "目前表現比同齡平均低少少，可以先加強呢部分",
    badgeClassName:
      "bg-amber-50 text-amber-800 ring-1 ring-amber-200 shadow-sm",
  },
} as const;

function getBenchmarkBandMeta(
  band: ParentBenchmarks["pace_benchmark"] extends infer T
    ? T extends { band: infer B }
      ? B
      : never
    : never,
) {
  return BENCHMARK_BAND_META[band];
}

const MOCK_BENCHMARKS: ParentBenchmarks = {
  child_id: "mock-123",
  age_band: "5-6",
  range_days: 28,
  pace_benchmark: {
    band: "ahead",
    percentile_band: "P75-P100",
    trend: "up",
    child_value: 4.6,
    cohort_value: 3.4,
    tips: "可維持目前節奏，並逐步增加主動開口機會。",
  },
  engagement_benchmark: {
    band: "on_track",
    percentile_band: "P25-P75",
    trend: "flat",
    child_value: 18.2,
    cohort_value: 16.5,
    tips: "可把練習分成短段落，讓孩子更容易保持參與。",
  },
  category_benchmarks: [
    {
      category_id: "animals",
      category_name: "動物",
      band: "ahead",
      percentile_band: "P75-P100",
      trend: "up",
      child_value: 84,
      cohort_value: 68,
      tips: "可把已掌握主題延伸到故事和角色扮演。",
    },
    {
      category_id: "food",
      category_name: "食物",
      band: "on_track",
      percentile_band: "P25-P75",
      trend: "flat",
      child_value: 61,
      cohort_value: 58,
      tips: "可在用餐情境加入描述味道和顏色的句子。",
    },
    {
      category_id: "nature",
      category_name: "大自然",
      band: "needs_support",
      percentile_band: "P0-P25",
      trend: "down",
      child_value: 39,
      cohort_value: 55,
      tips: "可透過戶外實物觀察，幫助孩子建立穩定連結。",
    },
  ],
  suppression: {
    is_suppressed: false,
    reason: null,
    minimum_cohort_threshold: 1,
  },
};

export function AnalyticsDashboard({ childId }: AnalyticsDashboardProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<AnalyticsCharts | null>(null);
  const [benchmarks, setBenchmarks] = useState<ParentBenchmarks | null>(null);
  const [benchmarkRangeDays, setBenchmarkRangeDays] = useState<number>(28);
  const [loading, setLoading] = useState(true);
  const [benchmarksLoading, setBenchmarksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(
    async ({ background = false }: { background?: boolean } = {}) => {
      if (!background) {
        setLoading(true);
      }
      setError(null);
      try {
        const token = getAuthToken();
        const isMockChild = !childId || childId.length < 10;

        if (!token || isMockChild) {
          setSummary(MOCK_DB.summary);
          setCharts(MOCK_DB.charts);
          return;
        }

        const [apiSummary, apiCharts] = await Promise.all([
          getDashboardSummary(childId),
          getAnalyticsCharts(childId, "all"),
        ]);

        setSummary({
          total_words_learned: apiSummary.total_words_learned,
          current_streak: apiSummary.current_streak,
          level: apiSummary.level,
          xp: apiSummary.xp,
          weekly_words_learned: apiSummary.weekly_words_learned,
          weekly_learning_time: apiSummary.weekly_learning_time,
          weekly_sessions: apiSummary.weekly_sessions,
          weekly_xp_earned: apiSummary.weekly_xp_earned,
          category_progress: (apiSummary.category_progress ?? []).map((cp) => ({
            category_id: cp.category_id,
            category_name: cp.category_name,
            category_name_cantonese: cp.category_name_cantonese,
            words_learned: cp.words_learned,
            total_words: cp.total_words,
            progress_percentage: cp.progress_percentage,
          })),
          recent_insights: (apiSummary.recent_insights ?? []).map((ins) => ({
            id: ins.id,
            title: ins.title,
            description: ins.description,
            type: mapInsightType(ins.insight_type),
            priority: ins.priority,
          })),
          latest_report: apiSummary.latest_report
            ? {
                id: apiSummary.latest_report.id,
                week_start: apiSummary.latest_report.week_start_date,
                week_end: apiSummary.latest_report.week_end_date,
                total_words_learned:
                  apiSummary.latest_report.total_words_learned,
                total_learning_time:
                  apiSummary.latest_report.total_learning_time,
                days_active: apiSummary.latest_report.days_active,
                growth_percentage: apiSummary.latest_report.growth_percentage,
                strengths: apiSummary.latest_report.strengths,
                recommendations: apiSummary.latest_report.recommendations,
              }
            : undefined,
        });

        setCharts({
          time_series: {
            dates: apiCharts.time_series.dates,
            words_learned: apiCharts.time_series.words_learned,
          },
        });

        console.log("[Analytics] Loaded real data for child:", childId);
      } catch (error: any) {
        console.error("Failed to load analytics:", error);
        setError("無法載入分析數據，請稍後再試。");
      } finally {
        if (!background) {
          setLoading(false);
        }
      }
    },
    [childId],
  );

  const loadBenchmarks = useCallback(
    async ({ background = false }: { background?: boolean } = {}) => {
      if (!background) {
        setBenchmarksLoading(true);
      }

      try {
        const token = getAuthToken();
        const isMockChild = !childId || childId.length < 10;

        if (!token || isMockChild) {
          setBenchmarks({
            ...MOCK_BENCHMARKS,
            child_id: childId || MOCK_BENCHMARKS.child_id,
            range_days: benchmarkRangeDays,
          });
          return;
        }

        const apiBenchmarks = await getParentBenchmarks(
          childId,
          benchmarkRangeDays,
        );
        setBenchmarks(apiBenchmarks);
      } catch (benchmarkError) {
        console.error("Failed to load benchmarks:", benchmarkError);
      } finally {
        if (!background) {
          setBenchmarksLoading(false);
        }
      }
    },
    [benchmarkRangeDays, childId],
  );

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    void loadBenchmarks();
  }, [loadBenchmarks]);

  useEffect(() => {
    const handleWindowFocus = () => {
      void Promise.all([
        loadDashboardData({ background: true }),
        loadBenchmarks({ background: true }),
      ]);
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [loadBenchmarks, loadDashboardData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-[28px]" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-4xl" />
        <Skeleton className="h-64 w-full rounded-4xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
        <h3 className="mb-2 text-lg font-semibold text-red-900">
          無法載入分析數據
        </h3>
        <Button onClick={() => void loadDashboardData()} variant="destructive">
          重試
        </Button>
      </div>
    );
  }

  if (!summary || !charts) return null;

  return (
    <div className="space-y-8 w-full rounded-4xl bg-white/50 p-4 backdrop-blur-sm md:p-6">
      {/* Header */}
      <div className="text-center space-y-3 mb-6">
        <div className="mb-2 inline-flex items-center justify-center rounded-2xl bg-linear-to-br from-blue-100 to-cyan-100 p-3 shadow-sm">
          <LineChart className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
          詳細數據分析
        </h2>
        <p className="text-slate-500 font-medium max-w-lg mx-auto">
          透過圖表深入了解小朋友的學習趨勢與習慣
        </p>
      </div>

      {/* 1. Overview Cards (Same functionality, New Design) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen className="h-6 w-6" />}
          label="總詞彙量"
          value={summary.total_words_learned}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={<Flame className="h-6 w-6" />}
          label="連續打卡"
          value={`${summary.current_streak} 天`}
          color="bg-orange-100 text-orange-600"
        />
        <StatCard
          icon={<Target className="h-6 w-6" />}
          label="目前等級"
          value={`Lv ${summary.level}`}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={<Star className="h-6 w-6" />}
          label="總經驗值"
          value={summary.xp.toLocaleString()}
          color="bg-yellow-100 text-yellow-600"
        />
      </div>

      {/* 2. Learning Calendar */}
      <LearningCalendar charts={charts} childId={childId} />

      {/* 3. Stats Grid (Weekly & Category) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Stats */}
        <Card className="rounded-4xl border-none bg-white/60 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-500" />
            本週概況
          </h3>
          <div className="space-y-4">
            <WeeklyStatRow
              label="新學詞彙"
              value={summary.weekly_words_learned}
              icon={<BookOpen className="h-4 w-4" />}
              color="text-blue-500 bg-blue-50"
            />
            <WeeklyStatRow
              label="學習時長"
              value={`${summary.weekly_learning_time} 分鐘`}
              icon={<Clock className="h-4 w-4" />}
              color="text-green-500 bg-green-50"
            />
            <WeeklyStatRow
              label="學習次數"
              value={`${summary.weekly_sessions} 次`}
              icon={<Target className="h-4 w-4" />}
              color="text-purple-500 bg-purple-50"
            />
            <WeeklyStatRow
              label="獲得經驗"
              value={summary.weekly_xp_earned}
              icon={<Star className="h-4 w-4" />}
              color="text-yellow-500 bg-yellow-50"
            />
          </div>
        </Card>

        {/* Category Progress */}
        <Card className="rounded-4xl border-none bg-white/60 p-6 shadow-sm">
          <h4 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-500" />
            各主題掌握度
          </h4>
          <div className="space-y-5">
            {summary.category_progress.map((cat) => (
              <div key={cat.category_id} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-700">
                    {cat.category_name_cantonese || cat.category_name}
                  </span>
                  <span className="text-slate-400">
                    {cat.words_learned} / {cat.total_words}
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-teal-400 to-emerald-400 transition-all duration-1000"
                    style={{ width: `${cat.progress_percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <BenchmarkChartsPanel
        benchmarks={benchmarks}
        isLoading={benchmarksLoading}
        benchmarkRangeDays={benchmarkRangeDays}
        onRangeChange={setBenchmarkRangeDays}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 4. Recent Insights */}
        {summary.recent_insights.length > 0 && (
          <Card className="h-full rounded-4xl border-none bg-white/60 p-6 shadow-sm">
            <h4 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              AI 學習洞察
            </h4>
            <div className="space-y-3">
              {summary.recent_insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </Card>
        )}

        {/* 5. Latest Report */}
        <Card className="h-full rounded-4xl border-none bg-linear-to-br from-indigo-50 to-purple-50 p-6 shadow-sm">
          <h4 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            最新學習週報
          </h4>
          {summary.latest_report ? (
            <ReportSummary report={summary.latest_report} />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
              <BarChart3 className="w-10 h-10 text-indigo-200" />
              <p className="text-sm font-bold text-indigo-400">暫無週報</p>
              <p className="max-w-50 text-xs text-indigo-300">
                學習週報每週自動生成，繼續學習後即可查閱。
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function BenchmarkChartsPanel({
  benchmarks,
  isLoading,
  benchmarkRangeDays,
  onRangeChange,
}: {
  benchmarks: ParentBenchmarks | null;
  isLoading: boolean;
  benchmarkRangeDays: number;
  onRangeChange: (days: number) => void;
}) {
  const metricCards = [
    {
      id: "pace",
      title: "學習節奏",
      unit: "詞 / 活躍日",
      metric: benchmarks?.pace_benchmark ?? null,
      accent: "from-sky-500 to-cyan-400",
    },
    {
      id: "engagement",
      title: "參與度",
      unit: "分 / 活躍日",
      metric: benchmarks?.engagement_benchmark ?? null,
      accent: "from-emerald-500 to-teal-400",
    },
  ];

  return (
    <Card className="rounded-4xl border border-sky-100/70 bg-linear-to-br from-slate-100 via-sky-50 to-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-sky-700">
            <Shield className="h-3.5 w-3.5" />
            同齡小朋友比較
          </div>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-800">
            同齡學習比較圖
          </h3>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            用圖表查看孩子與同齡組的學習節奏、參與度，以及各主題掌握度差距。
          </p>
        </div>

        <div className="w-full lg:w-72 rounded-[28px] bg-white/90 p-4 ring-1 ring-sky-100 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            比較時間
          </p>
          <Select
            value={String(benchmarkRangeDays)}
            disabled={isLoading}
            onValueChange={(value) => {
              const parsed = Number.parseInt(value, 10);
              if (Number.isFinite(parsed) && parsed !== benchmarkRangeDays) {
                onRangeChange(parsed);
              }
            }}
          >
            <SelectTrigger className="mt-3 h-12 w-full rounded-2xl border-white/20 bg-white text-slate-800 shadow-sm">
              <SelectValue placeholder="選擇天數" />
            </SelectTrigger>
            <SelectContent>
              {BENCHMARK_RANGE_OPTIONS.map((days) => (
                <SelectItem key={days} value={String(days)}>
                  最近 {days} 日
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs font-medium text-slate-500">
            {isLoading
              ? "正在更新呢個比較部分..."
              : "只會更新呢個比較部分嘅資料"}
          </p>
        </div>
      </div>

      {benchmarks?.suppression.is_suppressed ? (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900">
          請先在設定頁啟用分析資料同意，之後即可查看同齡學習比較圖表。
        </div>
      ) : (
        <>
          <div
            className={cn(
              "mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]",
              isLoading && "opacity-75 transition-opacity",
            )}
          >
            <div className="rounded-[28px] bg-white p-5 ring-1 ring-slate-100 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-slate-800">
                <Users className="h-5 w-5 text-sky-500" />
                <h4 className="text-lg font-black">重點指標比較</h4>
              </div>
              <div className="space-y-5">
                {metricCards.map(({ id, title, unit, metric, accent }) =>
                  metric ? (
                    <BenchmarkComparisonChart
                      key={id}
                      title={title}
                      unit={unit}
                      childValue={metric.child_value}
                      cohortValue={metric.cohort_value}
                      band={metric.band}
                      tip={metric.tips}
                      accent={accent}
                    />
                  ) : null,
                )}
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-5 ring-1 ring-slate-100 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-slate-800">
                <BarChart3 className="h-5 w-5 text-emerald-500" />
                <h4 className="text-lg font-black">主題掌握度比較</h4>
              </div>
              <div className="space-y-4">
                {(benchmarks?.category_benchmarks ?? [])
                  .slice(0, 4)
                  .map((item) => (
                    <CategoryBenchmarkBars
                      key={item.category_id}
                      benchmark={item}
                    />
                  ))}
                {!benchmarks?.category_benchmarks?.length && (
                  <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm font-medium text-slate-500">
                    目前主題資料仍在累積，稍後會顯示各主題對照圖。
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

function BenchmarkComparisonChart({
  title,
  unit,
  childValue,
  cohortValue,
  band,
  tip,
  accent,
}: {
  title: string;
  unit: string;
  childValue: number;
  cohortValue: number;
  band: ParentBenchmarks["pace_benchmark"] extends infer T
    ? T extends { band: infer B }
      ? B
      : never
    : never;
  tip: string;
  accent: string;
}) {
  const maxValue = Math.max(childValue, cohortValue, 1);
  const childWidth = Math.max((childValue / maxValue) * 100, 8);
  const cohortWidth = Math.max((cohortValue / maxValue) * 100, 8);
  const bandMeta = getBenchmarkBandMeta(band);

  return (
    <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-800">{title}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{unit}</p>
        </div>
        <div className="text-right">
          <div
            className={cn(
              "inline-flex rounded-full px-3 py-1 text-[11px] font-black tracking-[0.04em]",
              bandMeta.badgeClassName,
            )}
          >
            {bandMeta.label}
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-500">
            {bandMeta.detail}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <ChartBarRow
          label="你的孩子"
          value={childValue}
          width={childWidth}
          barClassName={`bg-linear-to-r ${accent}`}
          valueClassName="text-slate-800"
        />
        <ChartBarRow
          label="同齡平均"
          value={cohortValue}
          width={cohortWidth}
          barClassName="bg-slate-300"
          valueClassName="text-slate-600"
        />
      </div>

      <p className="mt-4 text-sm font-medium leading-6 text-slate-500">{tip}</p>
    </div>
  );
}

function ChartBarRow({
  label,
  value,
  width,
  barClassName,
  valueClassName,
}: {
  label: string;
  value: number;
  width: number;
  barClassName: string;
  valueClassName: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-bold">
        <span className="text-slate-500">{label}</span>
        <span className={valueClassName}>{value.toFixed(1)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none",
            barClassName,
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function CategoryBenchmarkBars({
  benchmark,
}: {
  benchmark: ParentBenchmarks["category_benchmarks"][number];
}) {
  const bandMeta = getBenchmarkBandMeta(benchmark.band);

  return (
    <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-800">
            {benchmark.category_name}
          </p>
          <div
            className={cn(
              "mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-black tracking-[0.04em]",
              bandMeta.badgeClassName,
            )}
          >
            {bandMeta.label}
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-500">
            {bandMeta.detail}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-600">
            你的孩子 {benchmark.child_value.toFixed(0)}%
          </p>
          <p className="text-xs font-bold text-slate-500">
            同齡平均 {benchmark.cohort_value.toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">你的孩子</span>
            <span className="text-slate-800">
              {benchmark.child_value.toFixed(0)}%
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-linear-to-r from-amber-400 to-orange-400 transition-[width] duration-700 ease-out motion-reduce:transition-none"
              style={{ width: `${Math.min(benchmark.child_value, 100)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">同齡平均</span>
            <span className="text-slate-600">
              {benchmark.cohort_value.toFixed(0)}%
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-300 transition-[width] duration-700 ease-out motion-reduce:transition-none"
              style={{ width: `${Math.min(benchmark.cohort_value, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS (Styled) ---

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="p-5 rounded-[28px] border-none shadow-sm bg-white hover:scale-105 transition-transform duration-200">
      <div className="flex flex-col gap-3">
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center",
            color,
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-black text-slate-800 mt-1">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function WeeklyStatRow({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-xl", color)}>{icon}</div>
        <p className="text-sm font-bold text-slate-600">{label}</p>
      </div>
      <p className="text-sm font-black text-slate-800">{value}</p>
    </div>
  );
}

function InsightCard({ insight }: { insight: LearningInsight }) {
  const priorityStyles = {
    high: "bg-red-50 border-red-100 text-red-900",
    medium: "bg-orange-50 border-orange-100 text-orange-900",
    low: "bg-blue-50 border-blue-100 text-blue-900",
  };

  const typeMap: Record<string, string> = {
    milestone: "里程碑",
    struggle: "需要關注",
    pattern: "學習模式",
    achievement: "成就",
  };

  return (
    <div
      className={cn(
        "p-4 rounded-2xl border transition-all hover:shadow-md bg-white",
        priorityStyles[insight.priority],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="font-bold text-sm">{insight.title}</h5>
            <Badge
              variant="outline"
              className="text-[10px] bg-white/50 border-black/10 h-5 px-1.5"
            >
              {typeMap[insight.type]}
            </Badge>
          </div>
          <p className="text-xs opacity-90 leading-relaxed font-medium">
            {insight.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReportSummary({ report }: { report: WeeklyReport }) {
  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/60 p-3 rounded-2xl">
          <p className="text-xs text-indigo-400 font-bold mb-1">詞彙學習</p>
          <p className="text-xl font-black text-indigo-900">
            {report.total_words_learned}
          </p>
        </div>
        <div className="bg-white/60 p-3 rounded-2xl">
          <p className="text-xs text-indigo-400 font-bold mb-1">活躍天數</p>
          <p className="text-xl font-black text-indigo-900">
            {report.days_active}/7
          </p>
        </div>
        <div className="bg-white/60 p-3 rounded-2xl">
          <p className="text-xs text-indigo-400 font-bold mb-1">學習時長</p>
          <p className="text-xl font-black text-indigo-900">
            {report.total_learning_time}m
          </p>
        </div>
        <div className="bg-white/60 p-3 rounded-2xl">
          <p className="text-xs text-indigo-400 font-bold mb-1">成長幅度</p>
          <p className="text-xl font-black flex items-center gap-1 text-indigo-900">
            {report.growth_percentage > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            {Math.abs(report.growth_percentage)}%
          </p>
        </div>
      </div>

      {report.strengths.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 強項
          </h5>
          <div className="flex flex-wrap gap-2">
            {report.strengths.map((strength, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-white text-indigo-700 text-xs font-bold rounded-full shadow-sm border border-indigo-100"
              >
                {strength}
              </span>
            ))}
          </div>
        </div>
      )}

      {report.recommendations.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> 建議
          </h5>
          <ul className="space-y-2">
            {report.recommendations.map((rec, i) => (
              <li
                key={i}
                className="text-xs text-indigo-800 bg-white/40 p-2 rounded-lg flex items-start gap-2 font-medium"
              >
                <span className="text-indigo-400 mt-0.5">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// --- LEARNING CALENDAR ---

function LearningCalendar({
  charts,
  childId,
}: {
  charts: AnalyticsCharts;
  childId: string;
}) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateWords, setDateWords] = useState<WordsByDateResult | null>(null);
  const [wordsError, setWordsError] = useState<string | null>(null);
  const [loadingWords, setLoadingWords] = useState(false);
  const wordsRequestIdRef = useRef(0);

  // Build date (YYYY-MM-DD) → word count map from time_series data
  const dateCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    const { dates, words_learned } = charts.time_series;
    dates.forEach((d, i) => {
      const dateStr =
        d.length === 10 ? d : new Date(d).toISOString().split("T")[0];
      map[dateStr] = (map[dateStr] ?? 0) + words_learned[i];
    });
    return map;
  }, [charts]);

  // Build calendar cells for the currently displayed month
  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number | null; dateStr: string | null }> = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, dateStr: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, dateStr });
    }
    return cells;
  }, [currentMonth]);

  const handleDayClick = async (dateStr: string) => {
    const requestId = ++wordsRequestIdRef.current;
    setSelectedDate(dateStr);
    setDateWords(null);
    setWordsError(null);

    const count = dateCountMap[dateStr] ?? 0;
    if (count === 0) {
      setLoadingWords(false);
      setDateWords({
        date: dateStr,
        child_id: childId,
        words_count: 0,
        words: [],
      });
      return;
    }

    const isMockChild = !childId || childId.length < 10;
    if (isMockChild) {
      setLoadingWords(false);
      setDateWords({
        date: dateStr,
        child_id: childId,
        words_count: count,
        words: MOCK_WORDS_BY_DATE.slice(
          0,
          Math.min(count, MOCK_WORDS_BY_DATE.length),
        ),
      });
      return;
    }

    setLoadingWords(true);
    try {
      const result = await getWordsByDate(childId, dateStr);
      if (requestId !== wordsRequestIdRef.current) return;
      const typedResult = result as WordsByDateResult;
      setDateWords(typedResult);
    } catch {
      if (requestId !== wordsRequestIdRef.current) return;
      setWordsError("載入當天學習記錄失敗，請稍後再試。");
      setDateWords(null);
    } finally {
      if (requestId === wordsRequestIdRef.current) {
        setLoadingWords(false);
      }
    }
  };

  const goToPrevMonth = () => {
    wordsRequestIdRef.current += 1;
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
    setSelectedDate(null);
    setDateWords(null);
    setWordsError(null);
    setLoadingWords(false);
  };

  const goToNextMonth = () => {
    wordsRequestIdRef.current += 1;
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
    setSelectedDate(null);
    setDateWords(null);
    setWordsError(null);
    setLoadingWords(false);
  };

  const isCurrentMonth =
    currentMonth.getMonth() === today.getMonth() &&
    currentMonth.getFullYear() === today.getFullYear();

  const closeDateDialog = (open: boolean) => {
    if (!open) {
      wordsRequestIdRef.current += 1;
      setSelectedDate(null);
      setDateWords(null);
      setWordsError(null);
      setLoadingWords(false);
    }
  };

  return (
    <>
      <Card className="rounded-4xl border-none bg-white/80 p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-xl font-bold text-slate-700 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            學習進度趨勢
          </h4>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="上個月"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="min-w-22.5 text-center text-sm font-bold text-slate-700">
              {currentMonth.toLocaleDateString("zh-HK", {
                year: "numeric",
                month: "long",
              })}
            </span>
            <button
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              className={cn(
                "p-2 rounded-full transition-colors",
                isCurrentMonth
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-slate-100",
              )}
              aria-label="下個月"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 mb-1">
          {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
            <div
              key={d}
              className="text-center text-xs font-bold text-slate-400 py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarCells.map((cell, idx) => {
            const dateStr = cell.dateStr;

            if (!cell.day || !dateStr) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }
            const count = dateCountMap[dateStr] ?? 0;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasWords = count > 0;

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(dateStr)}
                className={cn(
                  "relative flex flex-col items-center justify-center aspect-square rounded-xl text-sm font-bold transition-all duration-150",
                  isSelected
                    ? "bg-blue-500 text-white shadow-md"
                    : hasWords
                      ? count >= 5
                        ? "bg-blue-300 text-blue-950 hover:bg-blue-400 cursor-pointer"
                        : count >= 3
                          ? "bg-blue-200 text-blue-900 hover:bg-blue-300 cursor-pointer"
                          : "bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                      : "text-slate-300 hover:bg-slate-50 cursor-pointer",
                  isToday &&
                    !isSelected &&
                    "ring-2 ring-blue-300 text-slate-600",
                )}
              >
                <span>{cell.day}</span>
                {hasWords && !isSelected && (
                  <span className="absolute bottom-1 text-[10px] font-bold opacity-70">
                    {count}
                  </span>
                )}
                {isSelected && (
                  <span className="absolute bottom-0.5 text-[9px] font-bold text-white/80">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 justify-end text-xs text-slate-400">
          <span>詞彙量：</span>
          {[
            ["1–2", "bg-blue-100"],
            ["3–4", "bg-blue-200"],
            ["5+", "bg-blue-300"],
          ].map(([label, color]) => (
            <div key={label} className="flex items-center gap-1">
              <div
                className={cn(
                  "h-3 w-3 rounded-sm border border-blue-100",
                  color,
                )}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={selectedDate !== null} onOpenChange={closeDateDialog}>
        <DialogContent className="max-w-2xl rounded-[28px] border-none p-0 overflow-hidden">
          <div className="bg-linear-to-br from-blue-50 to-cyan-50 px-6 py-5">
            <DialogHeader className="pr-10 text-left">
              <DialogTitle className="pr-2 text-xl font-black leading-tight text-slate-800">
                {selectedDate
                  ? `${new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                      "zh-HK",
                      {
                        month: "long",
                        day: "numeric",
                      },
                    )} ・ 學習詞彙`
                  : "學習詞彙"}
              </DialogTitle>
              <DialogDescription className="pr-2 text-left font-medium leading-6 text-slate-500">
                {loadingWords
                  ? "正在載入當天的學習記錄。"
                  : wordsError
                    ? wordsError
                    : `${dateWords?.words_count ?? 0} 個詞彙學習記錄`}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-4 py-5 sm:px-6">
            {loadingWords ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-2xl" />
                ))}
              </div>
            ) : wordsError ? (
              <div className="py-10 text-center text-rose-500">
                <p className="text-sm font-medium">{wordsError}</p>
              </div>
            ) : !dateWords || dateWords.words.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <p className="text-sm font-medium">這天沒有學習記錄</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {dateWords.words.map((word) => (
                  <div
                    key={word.id}
                    className="flex items-start gap-3 rounded-3xl bg-slate-50 p-4 sm:gap-4"
                  >
                    <WordDateImage word={word} />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="wrap-break-word text-base font-black leading-tight text-slate-800">
                          {word.word_cantonese || word.word}
                        </span>
                        {word.jyutping && (
                          <span className="wrap-break-word text-xs font-medium text-slate-400">
                            [{word.jyutping}]
                          </span>
                        )}
                      </div>
                      <p className="wrap-break-word text-sm leading-6 text-slate-500">
                        {word.definition_cantonese || word.definition}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className="border-slate-200 text-[10px] text-slate-500"
                        >
                          {word.category_cantonese || word.category}
                        </Badge>
                        {word.word_cantonese &&
                          word.word &&
                          word.word_cantonese !== word.word && (
                            <Badge
                              variant="outline"
                              className="border-slate-200 text-[10px] text-slate-500"
                            >
                              {word.word}
                            </Badge>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function WordDateImage({ word }: { word: WordEntry }) {
  const [failed, setFailed] = useState(false);
  const storedVisual = word.image_url?.trim();
  const imageSrc =
    !failed && storedVisual && isStoredImageUrl(storedVisual)
      ? resolveImageUrl(storedVisual)
      : "";
  const placeholderEmoji = looksLikeEmoji(storedVisual)
    ? storedVisual
    : lookupEmojiOrFallback(word.word, word.word_cantonese || word.word);

  if (!imageSrc) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100">
        <span className="text-2xl leading-none">{placeholderEmoji}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt={word.word_cantonese || word.word}
      className="h-14 w-14 shrink-0 rounded-2xl object-cover bg-slate-100"
      onError={() => setFailed(true)}
    />
  );
}
