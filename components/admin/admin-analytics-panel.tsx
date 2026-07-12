"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleHelp, Download, Loader2, RefreshCw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getEngagementTrends,
  getMissionFunnel,
  getParticipationTrends,
  type AdminAnalyticsFilters,
  type EngagementTrendsResponse,
  type MissionFunnelResponse,
  type ParticipationTrendsResponse,
} from "@/lib/api/admin-analytics";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AGE_BAND_OPTIONS = ["all", "3-4", "5-6", "7+"] as const;

const FUNNEL_STATUS_LABELS: Record<string, string> = {
  assigned: "已指派",
  started: "已開始",
  completed: "已完成",
  skipped: "已跳過",
  expired: "已逾期",
};

function formatInputDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function defaultDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 27);
  return {
    from: formatInputDate(start),
    to: formatInputDate(end),
  };
}

function csvEscape(value: string | number): string {
  const source = String(value);
  if (source.includes(",") || source.includes("\n") || source.includes('"')) {
    return `"${source.replaceAll('"', '""')}"`;
  }
  return source;
}

function toFunnelStatusLabel(status: string): string {
  return FUNNEL_STATUS_LABELS[status] ?? status;
}

function translateDataKey(dataKey: string): string {
  if (dataKey === "dau") return "日活躍兒童";
  if (dataKey === "wau") return "週活躍兒童";
  return dataKey;
}

type RawMetricCard = {
  label: string;
  value: string | number;
  tone: "sky" | "emerald" | "amber" | "rose";
};

type FeatureSummaryCard = {
  feature: string;
  tone: "sky" | "emerald" | "amber" | "rose";
  description: string;
  metrics: Array<{ label: string; value: string }>;
};

export function AdminAnalyticsPanel() {
  const range = defaultDateRange();

  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const [ageBand, setAgeBand] = useState<string>("all");

  const [participation, setParticipation] =
    useState<ParticipationTrendsResponse | null>(null);
  const [funnel, setFunnel] = useState<MissionFunnelResponse | null>(null);
  const [engagement, setEngagement] = useState<EngagementTrendsResponse | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters: AdminAnalyticsFilters = useMemo(
    () => ({
      from,
      to,
      ageBand: ageBand === "all" ? undefined : ageBand,
    }),
    [ageBand, from, to],
  );

  async function loadAnalytics() {
    setLoading(true);
    setError(null);
    try {
      const [p, f, e] = await Promise.all([
        getParticipationTrends(filters),
        getMissionFunnel(filters),
        getEngagementTrends(filters),
      ]);
      setParticipation(p);
      setFunnel(f);
      setEngagement(e);
    } catch (loadError) {
      console.error("Failed to load admin analytics:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "載入數據總覽失敗，請稍後再試。",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const funnelChartData = useMemo(() => {
    if (!funnel) return [];
    return [
      {
        status: "assigned",
        statusLabel: toFunnelStatusLabel("assigned"),
        value: funnel.overall.assigned,
      },
      {
        status: "started",
        statusLabel: toFunnelStatusLabel("started"),
        value: funnel.overall.started,
      },
      {
        status: "completed",
        statusLabel: toFunnelStatusLabel("completed"),
        value: funnel.overall.completed,
      },
      {
        status: "skipped",
        statusLabel: toFunnelStatusLabel("skipped"),
        value: funnel.overall.skipped,
      },
      {
        status: "expired",
        statusLabel: toFunnelStatusLabel("expired"),
        value: funnel.overall.expired,
      },
    ];
  }, [funnel]);

  const engagementRawMetricCards = useMemo((): RawMetricCard[] => {
    if (!engagement) {
      return [];
    }

    const raw = engagement.raw_inputs;
    return [
      {
        label: "平均互動分鐘",
        value: `${engagement.summary.average_session_minutes.toFixed(2)} 分鐘`,
        tone: "sky",
      },
      {
        label: "日均使用分鐘",
        value: `${raw.average_usage_minutes_per_day.toFixed(2)} 分鐘`,
        tone: "emerald",
      },
      {
        label: "週均使用分鐘",
        value: `${raw.average_usage_minutes_per_week.toFixed(2)} 分鐘`,
        tone: "sky",
      },
      {
        label: "日均學會詞數",
        value: `${raw.average_words_learned_per_day.toFixed(2)} 詞`,
        tone: "amber",
      },
      {
        label: "任務完成率",
        value: `${(raw.mission_completion_rate * 100).toFixed(1)}%`,
        tone: "rose",
      },
      {
        label: "任務完成中位分鐘",
        value: `${raw.mission_median_completion_minutes.toFixed(2)} 分鐘`,
        tone: "emerald",
      },
      {
        label: "日均遊戲分鐘",
        value: `${raw.average_game_minutes_per_day.toFixed(2)} 分鐘`,
        tone: "sky",
      },
      {
        label: "日均相片擷取詞條",
        value: `${raw.average_photo_captures_per_day_proxy.toFixed(2)} 條`,
        tone: "amber",
      },
      {
        label: "故事完成率",
        value: `${(raw.story_completion_rate * 100).toFixed(1)}%`,
        tone: "rose",
      },
      {
        label: "每位活躍孩子平均到期複習卡",
        value: `${raw.average_due_revision_cards_per_active_child.toFixed(2)} 張`,
        tone: "emerald",
      },
      {
        label: "複習逾期率",
        value: `${(raw.overdue_revision_ratio * 100).toFixed(1)}%`,
        tone: "sky",
      },
      {
        label: "週均分享相片貼文數",
        value: `${raw.shared_photo_posts_per_week.toFixed(2)} 篇`,
        tone: "amber",
      },
      {
        label: "每篇分享相片平均反應數",
        value: `${raw.average_reactions_per_shared_photo.toFixed(2)} 次`,
        tone: "rose",
      },
      {
        label: "週均私人挑戰發起數",
        value: `${raw.private_challenges_initiated_per_week.toFixed(2)} 次`,
        tone: "emerald",
      },
      {
        label: "週均公開挑戰參與數",
        value: `${raw.public_challenge_participations_per_week.toFixed(2)} 次`,
        tone: "sky",
      },
    ];
  }, [engagement]);

  const featureSummaryCards = useMemo((): FeatureSummaryCard[] => {
    if (!engagement) {
      return [];
    }

    const raw = engagement.raw_inputs;
    return [
      {
        feature: "詞彙學習",
        tone: "sky",
        description: "詞彙學習與主動使用情況",
        metrics: [
          {
            label: "日均學會詞數",
            value: `${raw.average_words_learned_per_day.toFixed(2)} 詞`,
          },
          {
            label: "主動詞使用比率",
            value: `${(raw.average_active_word_usage_ratio * 100).toFixed(1)}%`,
          },
        ],
      },
      {
        feature: "拍照擷取",
        tone: "emerald",
        description: "拍照擷取與分享活躍度",
        metrics: [
          {
            label: "日均相片擷取詞條",
            value: `${raw.average_photo_captures_per_day_proxy.toFixed(2)} 條`,
          },
          {
            label: "週均分享相片貼文",
            value: `${raw.shared_photo_posts_per_week.toFixed(2)} 篇`,
          },
        ],
      },
      {
        feature: "故事",
        tone: "amber",
        description: "故事接觸與完成情況",
        metrics: [
          {
            label: "週均故事閱讀次數",
            value: `${raw.story_reads_per_week.toFixed(2)} 次`,
          },
          {
            label: "故事完成率",
            value: `${(raw.story_completion_rate * 100).toFixed(1)}%`,
          },
        ],
      },
      {
        feature: "複習模組",
        tone: "rose",
        description: "複習負載與逾期風險",
        metrics: [
          {
            label: "每位活躍孩子平均到期複習卡",
            value: `${raw.average_due_revision_cards_per_active_child.toFixed(2)} 張`,
          },
          {
            label: "複習逾期率",
            value: `${(raw.overdue_revision_ratio * 100).toFixed(1)}%`,
          },
        ],
      },
      {
        feature: "任務",
        tone: "emerald",
        description: "任務完成效率",
        metrics: [
          {
            label: "任務完成率",
            value: `${(raw.mission_completion_rate * 100).toFixed(1)}%`,
          },
          {
            label: "任務完成中位分鐘",
            value: `${raw.mission_median_completion_minutes.toFixed(2)} 分鐘`,
          },
        ],
      },
      {
        feature: "遊戲",
        tone: "sky",
        description: "遊戲互動投入程度",
        metrics: [
          {
            label: "日均遊戲分鐘",
            value: `${raw.average_game_minutes_per_day.toFixed(2)} 分鐘`,
          },
          {
            label: "平均互動分鐘",
            value: `${engagement.summary.average_session_minutes.toFixed(2)} 分鐘`,
          },
        ],
      },
      {
        feature: "社群挑戰",
        tone: "amber",
        description: "家長與孩子的社群挑戰參與",
        metrics: [
          {
            label: "週均私人挑戰發起數",
            value: `${raw.private_challenges_initiated_per_week.toFixed(2)} 次`,
          },
          {
            label: "週均公開挑戰參與數",
            value: `${raw.public_challenge_participations_per_week.toFixed(2)} 次`,
          },
        ],
      },
    ];
  }, [engagement]);

  function exportCsv() {
    if (!participation || !funnel || !engagement) {
      return;
    }

    const lines: string[] = [];
    lines.push("區段,指標,數值");
    lines.push(
      `摘要,活躍兒童,${csvEscape(participation.summary.total_active_children)}`,
    );
    lines.push(
      `摘要,平均日活躍兒童,${csvEscape(participation.summary.average_dau)}`,
    );
    lines.push(
      `摘要,平均週活躍兒童,${csvEscape(participation.summary.average_wau)}`,
    );
    lines.push(
      `摘要,已指派任務完成率,${csvEscape(funnel.overall.completion_rate)}`,
    );
    lines.push(
      `摘要,平均互動分鐘,${csvEscape(engagement.summary.average_session_minutes)}`,
    );
    lines.push(
      `摘要,日均使用分鐘,${csvEscape(engagement.raw_inputs.average_usage_minutes_per_day)}`,
    );
    lines.push(
      `摘要,週均使用分鐘,${csvEscape(engagement.raw_inputs.average_usage_minutes_per_week)}`,
    );
    lines.push(
      `摘要,日均學會詞數,${csvEscape(engagement.raw_inputs.average_words_learned_per_day)}`,
    );
    lines.push(
      `摘要,任務完成率,${csvEscape(engagement.raw_inputs.mission_completion_rate)}`,
    );
    lines.push(
      `摘要,任務完成中位分鐘,${csvEscape(engagement.raw_inputs.mission_median_completion_minutes)}`,
    );
    lines.push(
      `摘要,日均遊戲分鐘,${csvEscape(engagement.raw_inputs.average_game_minutes_per_day)}`,
    );
    lines.push(
      `摘要,每位活躍孩子平均到期複習卡,${csvEscape(engagement.raw_inputs.average_due_revision_cards_per_active_child)}`,
    );
    lines.push(
      `摘要,複習逾期率,${csvEscape(engagement.raw_inputs.overdue_revision_ratio)}`,
    );
    lines.push(
      `摘要,日均相片擷取詞條,${csvEscape(engagement.raw_inputs.average_photo_captures_per_day_proxy)}`,
    );
    lines.push(
      `摘要,週均故事閱讀次數,${csvEscape(engagement.raw_inputs.story_reads_per_week)}`,
    );
    lines.push(
      `摘要,故事完成率,${csvEscape(engagement.raw_inputs.story_completion_rate)}`,
    );
    lines.push(
      `摘要,週均分享相片貼文數,${csvEscape(engagement.raw_inputs.shared_photo_posts_per_week)}`,
    );
    lines.push(
      `摘要,每篇分享相片平均反應數,${csvEscape(engagement.raw_inputs.average_reactions_per_shared_photo)}`,
    );
    lines.push(
      `摘要,週均私人挑戰發起數,${csvEscape(engagement.raw_inputs.private_challenges_initiated_per_week)}`,
    );
    lines.push(
      `摘要,週均公開挑戰參與數,${csvEscape(engagement.raw_inputs.public_challenge_participations_per_week)}`,
    );

    lines.push("");
    lines.push("區段,功能,指標,數值");
    featureSummaryCards.forEach((card) => {
      card.metrics.forEach((metric) => {
        lines.push(
          [
            "核心功能",
            csvEscape(card.feature),
            csvEscape(metric.label),
            csvEscape(metric.value),
          ].join(","),
        );
      });
    });

    lines.push("");
    lines.push("區段,日期,日活躍兒童,週活躍兒童,七日回流率");
    participation.points.forEach((point) => {
      lines.push(
        [
          "參與趨勢",
          csvEscape(point.day),
          csvEscape(point.dau),
          csvEscape(point.wau),
          csvEscape(point.return_rate_7d),
        ].join(","),
      );
    });

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `數據總覽-${from}-到-${to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="rounded-4xl border-none bg-white/85 shadow-sm backdrop-blur-md">
      <CardHeader className="border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <CardTitle className="text-2xl font-black text-slate-800">
              數據總覽
            </CardTitle>
            <p className="mt-1 text-sm font-medium text-slate-500">
              查看平台參與趨勢、任務進度與主要功能使用情況。支援日期與年齡層篩選。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              disabled={!participation || !funnel || !engagement}
              onClick={exportCsv}
            >
              <Download className="mr-2 h-4 w-4" />
              匯出資料檔
            </Button>
            <Button
              type="button"
              className="h-10 rounded-full bg-slate-900 px-4 font-bold text-white hover:bg-slate-800"
              onClick={() => void loadAnalytics()}
              disabled={loading}
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

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
          <Input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
          <Select value={ageBand} onValueChange={setAgeBand}>
            <SelectTrigger>
              <SelectValue placeholder="年齡層" />
            </SelectTrigger>
            <SelectContent>
              {AGE_BAND_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "all" ? "全部年齡" : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            className="h-10 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-500"
            onClick={() => void loadAnalytics()}
            disabled={loading}
          >
            套用篩選
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {error && (
          <Alert className="rounded-3xl border-rose-200 bg-rose-50 text-rose-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!error && loading && !participation && (
          <div className="flex items-center justify-center gap-3 py-10 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            載入數據總覽中...
          </div>
        )}

        {participation && funnel && engagement && (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SnapshotCard
                label="活躍兒童"
                value={participation.summary.total_active_children}
                tone="sky"
              />
              <SnapshotCard
                label="平均日活躍兒童"
                value={participation.summary.average_dau}
                tone="emerald"
              />
              <SnapshotCard
                label="已指派任務完成率"
                value={`${(funnel.overall.completion_rate * 100).toFixed(1)}%`}
                tone="amber"
              />
              <SnapshotCard
                label="平均週活躍兒童"
                value={participation.summary.average_wau}
                tone="rose"
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="rounded-3xl border border-slate-100 shadow-none">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-black text-slate-800">
                      參與趨勢（日活躍兒童 / 週活躍兒童）
                    </CardTitle>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          aria-label="查看參與趨勢說明"
                        >
                          <CircleHelp className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="end"
                        className="w-96 text-xs text-slate-700"
                      >
                        <p className="font-bold text-slate-900">參與趨勢說明</p>
                        <p className="mt-2">
                          這張圖直接顯示每日活躍兒童數，以及最近七天的滾動活躍兒童數。
                        </p>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={participation.points}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        formatter={(value, name) => [
                          value,
                          translateDataKey(String(name)),
                        ]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="dau"
                        name="日活躍兒童"
                        stroke="#0284c7"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="wau"
                        name="週活躍兒童"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-slate-100 shadow-none">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-black text-slate-800">
                      任務狀態總覽
                    </CardTitle>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          aria-label="查看任務狀態說明"
                        >
                          <CircleHelp className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="end"
                        className="w-96 text-xs text-slate-700"
                      >
                        <p className="font-bold text-slate-900">任務狀態說明</p>
                        <p className="mt-2">
                          顯示已指派、已開始、已完成、已跳過與已逾期的任務數量。
                        </p>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="statusLabel" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        formatter={(value) => [value, "數量"]}
                        labelFormatter={(label) => `狀態：${String(label)}`}
                      />
                      <Bar
                        dataKey="value"
                        fill="#f97316"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-600">互動原始數據</h3>
              <p className="text-xs text-slate-500">
                只保留可直接理解的原始數值，不再顯示綜合分數或分佈圖。
              </p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {engagementRawMetricCards.map((card) => (
                  <SnapshotCard
                    key={card.label}
                    label={card.label}
                    value={card.value}
                    tone={card.tone}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-600">
                核心功能原始指標
              </h3>
              <p className="text-xs text-slate-500">
                每個功能只保留一組最能代表該功能的原始數據。
              </p>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {featureSummaryCards.map((card) => (
                  <Card
                    key={card.feature}
                    className="rounded-3xl border border-slate-100 shadow-none"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-black text-slate-800">
                        {card.feature}
                      </CardTitle>
                      <p className="text-xs text-slate-500">
                        {card.description}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {card.metrics.map((metric) => (
                        <div
                          key={`${card.feature}-${metric.label}`}
                          className="rounded-2xl bg-slate-50 px-4 py-3"
                        >
                          <p className="text-xs font-semibold text-slate-500">
                            {metric.label}
                          </p>
                          <p
                            className={`mt-1 text-2xl font-black ${card.tone === "rose" ? "text-rose-700" : card.tone === "amber" ? "text-amber-700" : card.tone === "emerald" ? "text-emerald-700" : "text-sky-700"}`}
                          >
                            {metric.value}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

type SnapshotCardProps = {
  label: string;
  value: string | number;
  tone: "sky" | "emerald" | "amber" | "rose";
};

function SnapshotCard({ label, value, tone }: SnapshotCardProps) {
  const toneClass =
    tone === "emerald"
      ? "from-emerald-50 to-emerald-100 text-emerald-700"
      : tone === "amber"
        ? "from-amber-50 to-amber-100 text-amber-700"
        : tone === "rose"
          ? "from-rose-50 to-rose-100 text-rose-700"
          : "from-sky-50 to-sky-100 text-sky-700";

  return (
    <div className={`rounded-3xl bg-linear-to-br ${toneClass} px-5 py-4`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}
