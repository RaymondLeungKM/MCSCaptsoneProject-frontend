"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

import {
  getAnalyticsFoundationHealth,
  type AnalyticsFoundationHealthResponse,
} from "@/lib/api/admin-analytics";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  initialDays?: number;
  initialThreshold?: number;
};

const WINDOW_OPTIONS = [7, 14, 28, 90] as const;
const THRESHOLD_OPTIONS = [5, 10, 15, 25, 50] as const;

function getMetricLabel(key: string): string {
  switch (key) {
    case "analytics_event_log":
      return "事件紀錄";
    case "child_day_analytics":
      return "每日學習分析";
    case "mission_outcome_analytics":
      return "任務結果分析";
    case "content_performance_analytics":
      return "內容表現分析";
    default:
      return key;
  }
}

function getAgeBandLabel(ageBand: string): string {
  switch (ageBand) {
    case "3-4":
      return "3 至 4 歲";
    case "5-6":
      return "5 至 6 歲";
    case "7+":
      return "7 歲或以上";
    case "unknown":
      return "未標記";
    default:
      return ageBand;
  }
}

function getSuppressionReason(
  reason: string | null,
  threshold: number,
): string {
  switch (reason) {
    case "cohort_below_threshold":
      return `同組人數未達私隱門檻（至少 ${threshold} 人）`;
    case "analytics_consent_disabled":
      return "目前帳戶未開啟分析資料同意";
    default:
      return "已依私隱規則隱藏";
  }
}

function getEventTypeLabel(eventType: string): string {
  switch (eventType) {
    case "session.started":
      return "學習時段開始";
    case "session.ended":
      return "學習時段結束";
    case "revision.queue_viewed":
      return "查看複習隊列";
    case "revision.card_reviewed":
      return "完成複習卡";
    case "mission.assigned":
      return "任務已分派";
    case "mission.started":
      return "任務已開始";
    case "mission.completed":
      return "任務已完成";
    case "mission.skipped":
      return "任務已略過";
    case "mission.expired":
      return "任務已過期";
    case "content.word_exposed":
      return "詞語已接觸";
    case "content.word_mastered":
      return "詞語已掌握";
    case "content.story_opened":
      return "故事已開啟";
    case "content.story_completed":
      return "故事已完成";
    case "content.game_started":
      return "遊戲已開始";
    case "content.game_completed":
      return "遊戲已完成";
    default:
      return eventType;
  }
}

export function AnalyticsFoundationPanel({
  initialDays = 28,
  initialThreshold = 25,
}: Props) {
  const [health, setHealth] =
    useState<AnalyticsFoundationHealthResponse | null>(null);
  const [days, setDays] = useState(initialDays);
  const [threshold, setThreshold] = useState(initialThreshold);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadHealth(
    selectedDays = days,
    selectedThreshold = threshold,
  ) {
    setLoading(true);
    setError(null);
    try {
      const result = await getAnalyticsFoundationHealth(
        selectedDays,
        selectedThreshold,
      );
      setHealth(result);
    } catch (loadError) {
      console.error("Failed to load analytics foundation health:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "載入診斷資訊失敗，請稍後再試。",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHealth(initialDays, initialThreshold);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topEvents = useMemo(
    () => (health?.event_type_counts ?? []).slice(0, 8),
    [health],
  );

  const allCohortsSuppressed =
    (health?.cohort_diagnostics.length ?? 0) > 0 &&
    health?.cohort_diagnostics.every(
      (cohort) => cohort.suppression.is_suppressed,
    );

  const suppressionThreshold =
    health?.cohort_diagnostics[0]?.suppression.minimum_cohort_threshold ??
    threshold;

  const dailyTrend = health?.daily_event_counts ?? [];
  const maxDailyCount = Math.max(1, ...dailyTrend.map((item) => item.count));
  const trendPath = useMemo(() => {
    if (dailyTrend.length === 0) return "";

    const width = 360;
    const height = 96;
    return dailyTrend
      .map((item, index) => {
        const x =
          dailyTrend.length === 1
            ? width / 2
            : (index / (dailyTrend.length - 1)) * width;
        const y = height - (item.count / maxDailyCount) * height;
        return `${x},${Number.isFinite(y) ? y : height}`;
      })
      .join(" ");
  }, [dailyTrend, maxDailyCount]);

  return (
    <Card className="rounded-4xl border-none bg-white/85 shadow-sm backdrop-blur-md">
      <CardHeader className="space-y-4 border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="text-2xl font-black text-slate-800">
              P0 分析基礎層
            </CardTitle>
            <CardDescription className="mt-1">
              檢視事件層與分析層的覆蓋率、事件分佈，以及年齡分組私隱抑制狀態。
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={String(days)}
              onValueChange={(value) => {
                const next = Number(value);
                setDays(next);
                void loadHealth(next, threshold);
              }}
            >
              <SelectTrigger className="h-10 w-33 rounded-full border-slate-200 bg-white">
                <SelectValue placeholder="選擇時窗" />
              </SelectTrigger>
              <SelectContent>
                {WINDOW_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    最近 {option} 天
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(threshold)}
              onValueChange={(value) => {
                const next = Number(value);
                setThreshold(next);
                void loadHealth(days, next);
              }}
            >
              <SelectTrigger className="h-10 w-40 rounded-full border-slate-200 bg-white">
                <SelectValue placeholder="私隱門檻" />
              </SelectTrigger>
              <SelectContent>
                {THRESHOLD_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    門檻至少 {option} 人
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={() => void loadHealth()}
              disabled={loading}
              className="h-10 rounded-full bg-slate-800 px-4 font-bold text-white hover:bg-slate-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              重新整理
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {error && (
          <Alert className="rounded-3xl border-rose-200 bg-rose-50 text-rose-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!error && loading && !health && (
          <div className="flex items-center justify-center gap-3 py-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            載入診斷數據中...
          </div>
        )}

        {health && (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard
                label={getMetricLabel("analytics_event_log")}
                value={health.row_counts.analytics_event_log}
                tone="slate"
              />
              <MetricCard
                label={getMetricLabel("child_day_analytics")}
                value={health.row_counts.child_day_analytics}
                tone="emerald"
              />
              <MetricCard
                label={getMetricLabel("mission_outcome_analytics")}
                value={health.row_counts.mission_outcome_analytics}
                tone="amber"
              />
              <MetricCard
                label={getMetricLabel("content_performance_analytics")}
                value={health.row_counts.content_performance_analytics}
                tone="sky"
              />
            </div>

            {allCohortsSuppressed && (
              <Alert className="rounded-3xl border-amber-200 bg-amber-50 text-amber-900">
                <AlertDescription>
                  目前四個年齡分組都顯示為「已抑制」，原因是這個診斷面板採用了私隱保護門檻。
                  只有當同一年齡組的人數達到至少 {suppressionThreshold}{" "}
                  人時，系統才會允許顯示該組的比較結果。 你現在的資料中，3 至 4
                  歲組別有{" "}
                  {health.cohort_diagnostics.find(
                    (item) => item.age_band === "3-4",
                  )?.cohort_size ?? 0}{" "}
                  人， 其餘組別目前為 0
                  人，所以全部都被安全地隱藏，這是預期行為，不是錯誤。
                </AlertDescription>
              </Alert>
            )}

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                覆蓋率
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                已有分析資料小朋友:{" "}
                {health.coverage.children_with_aggregate_rows}/
                {health.coverage.total_children}
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {(health.coverage.coverage_ratio * 100).toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-slate-500">
                時窗 {health.start_day} 至 {health.end_day}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                目前私隱門檻：同組至少 {suppressionThreshold} 人
              </p>
            </div>

            <Card className="rounded-3xl border border-slate-100 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-black text-slate-800">
                  每日事件量趨勢
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyTrend.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    目前未有可視化趨勢資料。
                  </p>
                ) : (
                  <div className="rounded-2xl border border-slate-100 bg-white p-3">
                    <svg
                      viewBox="0 0 360 96"
                      className="h-28 w-full"
                      preserveAspectRatio="none"
                      role="img"
                      aria-label="每日事件量趨勢圖"
                    >
                      <polyline
                        fill="none"
                        stroke="rgb(37 99 235)"
                        strokeWidth="3"
                        points={trendPath}
                      />
                    </svg>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{health.start_day}</span>
                      <span>最高單日：{maxDailyCount}</span>
                      <span>{health.end_day}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="rounded-3xl border border-slate-100 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-black text-slate-800">
                    事件分佈（前 8 項）
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topEvents.length === 0 ? (
                    <p className="text-sm text-slate-500">目前未有事件資料。</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-100">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>事件</TableHead>
                            <TableHead className="text-right">數量</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topEvents.map((event) => (
                            <TableRow key={event.event_type}>
                              <TableCell className="text-xs font-semibold text-slate-700">
                                <div>{getEventTypeLabel(event.event_type)}</div>
                              </TableCell>
                              <TableCell className="text-right font-bold text-slate-700">
                                {event.count}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-slate-100 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-black text-slate-800">
                    私隱抑制診斷
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {health.cohort_diagnostics.map((cohort) => {
                      const suppressed = cohort.suppression.is_suppressed;
                      return (
                        <div
                          key={cohort.age_band}
                          className="flex items-center justify-between rounded-2xl border border-slate-100 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-700">
                              年齡層 {getAgeBandLabel(cohort.age_band)}
                            </p>
                            <p className="text-xs text-slate-500">
                              同組人數：{cohort.cohort_size}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold">
                            {suppressed ? (
                              <>
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span className="text-amber-700">
                                  已抑制：
                                  {getSuppressionReason(
                                    cohort.suppression.reason,
                                    cohort.suppression.minimum_cohort_threshold,
                                  )}
                                </span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                <span className="text-emerald-700">可顯示</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "emerald" | "amber" | "sky";
}) {
  const toneClass = {
    slate: "bg-slate-900 text-white",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    sky: "bg-sky-50 text-sky-700",
  }[tone];

  return (
    <div className={`rounded-3xl px-4 py-4 ${toneClass}`}>
      <p className="text-xs font-black tracking-[0.12em] opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}
