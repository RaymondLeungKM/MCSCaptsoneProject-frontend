"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  Clock,
  Target,
  Flame,
  Star,
  Calendar,
  BarChart3,
  LineChart,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDashboardSummary,
  getAnalyticsCharts,
} from "@/lib/api/parent-dashboard";
import { getAuthToken } from "@/lib/api/client";

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
    words_learned: number;
    total_words: number;
    progress_percentage: number;
  }[];
  recent_insights: LearningInsight[];
  latest_report: WeeklyReport;
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

const MOCK_DB = generateMockData();

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

export function AnalyticsDashboard({ childId }: AnalyticsDashboardProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<AnalyticsCharts | null>(null);
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial Load Logic
  useEffect(() => {
    loadData();
  }, [childId]);

  // Chart Refresh Logic
  useEffect(() => {
    if (summary) {
      loadCharts();
    }
  }, [period]);

  const loadData = async () => {
    setLoading(true);
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
        getAnalyticsCharts(childId, period),
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
              total_words_learned: apiSummary.latest_report.total_words_learned,
              total_learning_time: apiSummary.latest_report.total_learning_time,
              days_active: apiSummary.latest_report.days_active,
              growth_percentage: apiSummary.latest_report.growth_percentage,
              strengths: apiSummary.latest_report.strengths,
              recommendations: apiSummary.latest_report.recommendations,
            }
          : MOCK_DB.summary.latest_report,
      });

      setCharts({
        time_series: {
          dates: apiCharts.time_series.dates,
          words_learned: apiCharts.time_series.words_learned,
        },
      });

      console.log("[Analytics] Loaded real data for child:", childId);
    } catch (error: any) {
      console.error("Failed to load analytics, falling back to mock:", error);
      setSummary(MOCK_DB.summary);
      setCharts(MOCK_DB.charts);
    } finally {
      setLoading(false);
    }
  };

  const loadCharts = async () => {
    setChartsLoading(true);
    try {
      const token = getAuthToken();
      const isMockChild = !childId || childId.length < 10;

      if (!token || isMockChild) {
        setChartsLoading(false);
        return;
      }

      const apiCharts = await getAnalyticsCharts(childId, period);
      setCharts({
        time_series: {
          dates: apiCharts.time_series.dates,
          words_learned: apiCharts.time_series.words_learned,
        },
      });
    } catch (error) {
      console.error("Failed to load charts:", error);
      setCharts(MOCK_DB.charts);
    } finally {
      setChartsLoading(false);
    }
  };

  // --- CORE LOGIC: DATA AGGREGATION (Restored) ---
  const getAggregatedData = () => {
    if (!charts) return { labels: [], values: [] };

    const { dates, words_learned } = charts.time_series;
    const dataPoints = dates.map((d, i) => ({
      date: new Date(d),
      value: words_learned[i],
    }));

    if (period === "week") {
      // Show last 7 days
      const last7 = dataPoints.slice(-7);
      return {
        labels: last7.map((d) =>
          d.date.toLocaleDateString("zh-HK", { weekday: "short" }),
        ), // e.g. 週一
        values: last7.map((d) => d.value),
      };
    } else if (period === "month") {
      // Aggregate into weeks for 30-day view
      const last30 = dataPoints.slice(-30);
      const weeklyMap: Record<string, number> = {};

      last30.forEach((p) => {
        // Calculate the "Week of" date
        const d = new Date(p.date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day == 0 ? -6 : 1); // Adjust to Monday
        const monday = new Date(d.setDate(diff));
        const key = `${monday.getMonth() + 1}月${monday.getDate()}日`; // Format: 5月12日

        weeklyMap[key] = (weeklyMap[key] || 0) + p.value;
      });

      return {
        labels: Object.keys(weeklyMap),
        values: Object.values(weeklyMap),
      };
    } else {
      // Aggregate into months for all-time view
      const monthlyMap: Record<string, number> = {};
      dataPoints.forEach((p) => {
        const key = p.date.toLocaleDateString("zh-HK", {
          year: "numeric",
          month: "short",
        }); // e.g. 2023年 10月
        monthlyMap[key] = (monthlyMap[key] || 0) + p.value;
      });

      return {
        labels: Object.keys(monthlyMap),
        values: Object.values(monthlyMap),
      };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-[28px]" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-[32px]" />
        <Skeleton className="h-64 w-full rounded-[32px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-center">
        <h3 className="mb-2 text-lg font-semibold text-red-900">
          無法載入分析數據
        </h3>
        <Button onClick={loadData} variant="destructive">
          重試
        </Button>
      </div>
    );
  }

  if (!summary || !charts) return null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 md:p-6 bg-white/50 backdrop-blur-sm rounded-[32px]">
      {/* Header */}
      <div className="text-center space-y-3 mb-6">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl mb-2 shadow-sm">
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

      {/* 2. Main Chart with Logic-Based Period Selector */}
      <Card className="p-6 rounded-[32px] border-none shadow-sm bg-white/80">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h4 className="text-xl font-bold text-slate-700 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-slate-400" />
              學習進度趨勢
            </h4>
            {!chartsLoading && (
              <p className="text-sm text-slate-500 mt-1">
                這段期間共學習了{" "}
                <span className="font-bold text-blue-600">
                  {getAggregatedData().values.reduce((a, b) => a + b, 0)}
                </span>{" "}
                個新詞彙
              </p>
            )}
          </div>

          <div className="flex bg-slate-100 p-1 rounded-full shrink-0">
            {(["week", "month", "all"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all",
                  period === p
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {p === "week" ? "最近7天" : p === "month" ? "最近30天" : "全部"}
              </button>
            ))}
          </div>
        </div>

        {chartsLoading ? (
          <div className="space-y-4 pt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="flex-1 h-8 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          (() => {
            const { labels, values } = getAggregatedData();
            const maxValue = Math.max(...values, 1);

            return (
              <div className="space-y-4 min-h-[200px]">
                {labels.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p>暫無學習活動</p>
                  </div>
                ) : (
                  labels.map((label, i) => (
                    <div key={label} className="group flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-400 w-16 text-right flex-shrink-0 truncate">
                        {label}
                      </span>
                      <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden relative">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 transition-all duration-1000 ease-out group-hover:from-blue-500 group-hover:to-indigo-500 relative"
                          style={{
                            width: `${Math.max((values[i] / maxValue) * 100, 2)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 w-6 text-left">
                        {values[i]}
                      </span>
                    </div>
                  ))
                )}
              </div>
            );
          })()
        )}
      </Card>

      {/* 3. Stats Grid (Weekly & Category) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Stats */}
        <Card className="p-6 rounded-[32px] border-none shadow-sm bg-white/60">
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
        <Card className="p-6 rounded-[32px] border-none shadow-sm bg-white/60">
          <h4 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-500" />
            各主題掌握度
          </h4>
          <div className="space-y-5">
            {summary.category_progress.map((cat) => (
              <div key={cat.category_id} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-700">{cat.category_name}</span>
                  <span className="text-slate-400">
                    {cat.words_learned} / {cat.total_words}
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-1000"
                    style={{ width: `${cat.progress_percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 4. Recent Insights */}
        {summary.recent_insights.length > 0 && (
          <Card className="p-6 rounded-[32px] border-none shadow-sm bg-white/60 h-full">
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
        {summary.latest_report && (
          <Card className="p-6 rounded-[32px] border-none shadow-sm bg-gradient-to-br from-indigo-50 to-purple-50 h-full">
            <h4 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              最新學習週報
            </h4>
            <ReportSummary report={summary.latest_report} />
          </Card>
        )}
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
