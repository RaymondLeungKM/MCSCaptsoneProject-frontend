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
} from "lucide-react";
import type {
  DashboardSummary,
  AnalyticsCharts,
  LearningInsight,
  WeeklyReport,
} from "@/lib/types";
import {
  getDashboardSummary,
  getAnalyticsCharts,
} from "@/lib/api/parent-dashboard";

interface AnalyticsDashboardProps {
  childId: string;
}

export function AnalyticsDashboard({ childId }: AnalyticsDashboardProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<AnalyticsCharts | null>(null);
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [childId, period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryData, chartsData] = await Promise.all([
        getDashboardSummary(childId),
        getAnalyticsCharts(childId, period),
      ]);
      setSummary(summaryData);
      setCharts(chartsData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!summary || !charts) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Words Learned"
          value={summary.total_words_learned}
          color="bg-blue-500"
        />
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          label="Current Streak"
          value={`${summary.current_streak} days`}
          color="bg-orange-500"
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Level"
          value={summary.level}
          color="bg-purple-500"
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="Total XP"
          value={summary.xp.toLocaleString()}
          color="bg-green-500"
        />
      </div>

      {/* Weekly Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">This Week</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <WeeklyStat
            label="Words Learned"
            value={summary.weekly_words_learned}
            icon={<BookOpen className="h-4 w-4" />}
          />
          <WeeklyStat
            label="Learning Time"
            value={`${summary.weekly_learning_time} min`}
            icon={<Clock className="h-4 w-4" />}
          />
          <WeeklyStat
            label="Sessions"
            value={summary.weekly_sessions}
            icon={<Calendar className="h-4 w-4" />}
          />
          <WeeklyStat
            label="XP Earned"
            value={summary.weekly_xp_earned}
            icon={<Star className="h-4 w-4" />}
          />
        </div>
      </Card>

      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Learning Progress</h3>
        <div className="flex gap-2">
          {(["week", "month", "all"] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p === "week" ? "7 Days" : p === "month" ? "30 Days" : "All Time"}
            </Button>
          ))}
        </div>
      </div>

      {/* Simple Text-Based Charts (placeholder for future chart library) */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Words Learned Over Time</h4>
        <div className="space-y-2">
          {charts.time_series.dates.map((date, i) => (
            <div key={date} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-24">
                {new Date(date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                <div
                  className="bg-blue-500 h-full flex items-center justify-end px-2 text-xs text-white font-medium"
                  style={{
                    width: `${Math.max(10, (charts.time_series.words_learned[i] / Math.max(...charts.time_series.words_learned)) * 100)}%`,
                  }}
                >
                  {charts.time_series.words_learned[i]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Category Progress */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Progress by Category</h4>
        <div className="space-y-3">
          {summary.category_progress.map((cat) => (
            <div key={cat.category_id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{cat.category_name}</span>
                <span className="text-muted-foreground">
                  {cat.words_learned}/{cat.total_words}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${cat.progress_percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Insights */}
      {summary.recent_insights.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Recent Insights</h4>
          <div className="space-y-3">
            {summary.recent_insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </Card>
      )}

      {/* Latest Report */}
      {summary.latest_report && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Latest Weekly Report</h4>
          <ReportSummary report={summary.latest_report} />
        </Card>
      )}
    </div>
  );
}

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
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`${color} text-white p-2 rounded-lg`}>{icon}</div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function WeeklyStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: LearningInsight }) {
  const priorityColors = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-blue-100 text-blue-800 border-blue-200",
  };

  return (
    <div
      className={`p-3 rounded-lg border ${priorityColors[insight.priority]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h5 className="font-medium text-sm">{insight.title}</h5>
          <p className="text-xs mt-1 opacity-90">{insight.description}</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {insight.insight_type}
        </Badge>
      </div>
    </div>
  );
}

function ReportSummary({ report }: { report: WeeklyReport }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Words Learned</p>
          <p className="text-2xl font-bold">{report.total_words_learned}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Learning Time</p>
          <p className="text-2xl font-bold">{report.total_learning_time}m</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Days Active</p>
          <p className="text-2xl font-bold">{report.days_active}/7</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Growth</p>
          <p className="text-2xl font-bold flex items-center gap-1">
            {report.growth_percentage > 0 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
            {Math.abs(report.growth_percentage)}%
          </p>
        </div>
      </div>

      {report.strengths.length > 0 && (
        <div>
          <h5 className="text-sm font-medium mb-2">Strengths</h5>
          <div className="flex flex-wrap gap-2">
            {report.strengths.map((strength, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                {strength}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {report.recommendations.length > 0 && (
        <div>
          <h5 className="text-sm font-medium mb-2">Recommendations</h5>
          <ul className="text-sm space-y-1">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="text-muted-foreground">
                • {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
