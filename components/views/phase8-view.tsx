"use client";

/**
 * Phase 8 View – Advanced AI & Personalization
 *
 * Tabbed container exposing:
 *   Tab 1 – 「間隔重複」  Spaced Repetition review session
 *   Tab 2 – 「詞彙關係圖」 Word Knowledge Graph explorer
 *   Tab 3 – 「小博士」    AI Tutor Chat
 *
 * Props mirror the existing ChildProfile shapes used throughout the app.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  Brain,
  GitBranch,
  MessageSquare,
  CheckCircle2,
  Loader2,
  AlertCircle,
  BookOpen,
  Clock3,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ChildProfile,
  ReviewQueue,
  ReviewResult,
  WordGraph,
  GraphRecommendation,
  LearningSpeedProfile,
} from "@/lib/types";
import { SpacedRepetitionCard } from "@/components/child/spaced-repetition-card";
import { WordKnowledgeGraph } from "@/components/child/word-knowledge-graph";
import { AITutorChat } from "@/components/child/ai-tutor-chat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  getReviewQueue,
  submitReview,
  getLearningSpeedProfile,
  getGraphRecommendations,
  getWordGraph,
} from "@/lib/api/word-personalization";

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------
const TABS = [
  {
    id: "review" as const,
    label: "間隔重複",
    labelEn: "Review",
    icon: Brain,
    description: "用智能複習卡，按最適合你的節奏記住詞彙。",
    heroGradient: "from-indigo-100/80 via-sky-100/70 to-violet-100/70",
    iconTone: "bg-indigo-100 text-indigo-600",
    activeTone: "text-indigo-600",
    panelTone: "border-indigo-100 bg-indigo-50/50",
    cta: "先翻卡，再評分，系統會安排下一次複習。",
  },
  {
    id: "graph" as const,
    label: "詞彙關係圖",
    labelEn: "Word Graph",
    icon: GitBranch,
    description: "看見單字之間的連結，讓新詞更容易記住。",
    heroGradient: "from-emerald-100/80 via-teal-100/70 to-cyan-100/70",
    iconTone: "bg-emerald-100 text-emerald-600",
    activeTone: "text-emerald-600",
    panelTone: "border-emerald-100 bg-emerald-50/50",
    cta: "點擊節點探索更多相關詞語和語意關係。",
  },
  {
    id: "tutor" as const,
    label: "小博士",
    labelEn: "AI Tutor",
    icon: MessageSquare,
    description: "用對話方式問問題，讓 AI 陪你理解和造句。",
    heroGradient: "from-amber-100/80 via-orange-100/70 to-yellow-100/70",
    iconTone: "bg-amber-100 text-amber-600",
    activeTone: "text-amber-600",
    panelTone: "border-amber-100 bg-amber-50/50",
    cta: "想知道意思、讀音或例句時，直接向小博士發問。",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

const learningStyleLabels = {
  visual: "視覺型",
  auditory: "聽覺型",
  kinesthetic: "動作型",
  mixed: "混合型",
} as const;

const languageLabels = {
  cantonese: "粵語",
  english: "英文",
  bilingual: "雙語",
} as const;

function SmartStatCard({
  icon: Icon,
  value,
  label,
  helper,
  tone,
}: {
  icon: typeof Brain;
  value: string;
  label: string;
  helper: string;
  tone: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-md">
      <div
        className={cn(
          "mb-3 flex h-12 w-12 items-center justify-center rounded-2xl",
          tone,
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <p className="child-tab-stat-value !mt-0">{value}</p>
      <p className="child-tab-stat-label !mt-1 !text-slate-600">{label}</p>
      <p className="child-tab-card-copy !mt-2">{helper}</p>
    </div>
  );
}

function StatusPanel({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  tone,
}: {
  icon: typeof Brain;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tone: string;
}) {
  return (
    <div className="rounded-4xl border border-white/60 bg-white/80 p-8 text-center shadow-sm backdrop-blur-md">
      <div
        className={cn(
          "mx-auto flex h-16 w-16 items-center justify-center rounded-full",
          tone,
        )}
      >
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="child-tab-section-title !mt-5 !text-2xl">{title}</h3>
      <p className="child-tab-section-copy mx-auto !mt-2 max-w-md !text-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          type="button"
          className="mt-5 rounded-full font-black"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-view: Spaced Repetition
// ---------------------------------------------------------------------------
interface ReviewViewProps {
  childId: string;
  onPlayAudio?: (url: string) => void;
}

function ReviewView({ childId, onPlayAudio }: ReviewViewProps) {
  const [queue, setQueue] = useState<ReviewQueue | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [lastResult, setLastResult] = useState<ReviewResult | null>(null);
  const [profile, setProfile] = useState<LearningSpeedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [q, p] = await Promise.all([
        getReviewQueue(childId),
        getLearningSpeedProfile(childId),
      ]);
      setQueue(q);
      setProfile(p);
      setCardIndex(0);
    } catch {
      setError("無法載入複習卡。請確認後端已啟動。");
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRate = useCallback(
    async (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
      if (!queue) return;
      const card = queue.cards[cardIndex];
      try {
        const result = await submitReview(childId, card.word_id, quality);
        setLastResult(result);
        // Move to next card after short delay
        setTimeout(() => {
          setLastResult(null);
          setCardIndex((i) => i + 1);
        }, 1400);
      } catch {
        // silently fail – try again on the next card
        setCardIndex((i) => i + 1);
      }
    },
    [childId, queue, cardIndex],
  );

  if (loading) {
    return (
      <StatusPanel
        icon={Loader2}
        title="載入複習卡中"
        description="正在準備今天最適合你的複習內容。"
        tone="bg-indigo-100 text-indigo-600"
      />
    );
  }

  if (error) {
    return (
      <StatusPanel
        icon={AlertCircle}
        title="暫時打不開複習卡"
        description={error}
        actionLabel="重新載入"
        onAction={() => void load()}
        tone="bg-rose-100 text-rose-500"
      />
    );
  }

  if (!queue || queue.cards.length === 0) {
    return (
      <div className="space-y-5 rounded-4xl border border-white/60 bg-white/80 p-8 text-center shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div>
          <h3 className="child-tab-section-title !text-2xl">
            今日複習全部完成
          </h3>
          <p className="child-tab-section-copy !mt-2 !text-sm">
            你的記憶節奏很穩定，明天再回來系統會安排新的複習卡。
          </p>
        </div>
        {profile && (
          <div className="grid gap-3 rounded-3xl border border-indigo-100 bg-indigo-50/80 p-5 text-left sm:grid-cols-3">
            <div>
              <p className="child-tab-stat-label !text-indigo-500">總卡數</p>
              <p className="child-tab-stat-value">{profile.total_cards}</p>
            </div>
            <div>
              <p className="child-tab-stat-label !text-emerald-500">畢業率</p>
              <p className="child-tab-stat-value">
                {Math.round(profile.graduation_rate * 100)}%
              </p>
            </div>
            <div>
              <p className="child-tab-stat-label !text-amber-500">平均間隔</p>
              <p className="child-tab-stat-value">
                {profile.avg_interval.toFixed(1)}天
              </p>
            </div>
            <p className="child-tab-card-copy sm:col-span-3 !mt-0">
              {profile.assessment}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (cardIndex >= queue.cards.length) {
    return (
      <StatusPanel
        icon={CheckCircle2}
        title="本節複習完成"
        description="這一輪卡片已經結束，可以再載入一組新的複習內容。"
        actionLabel="再次載入"
        onAction={() => void load()}
        tone="bg-emerald-100 text-emerald-500"
      />
    );
  }

  const currentCard = queue.cards[cardIndex];

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Result feedback */}
      {lastResult && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 text-center animate-in fade-in duration-200">
          <p className="child-tab-copy !text-sm !font-bold !text-indigo-700">
            {lastResult.message}
          </p>
        </div>
      )}

      <SpacedRepetitionCard
        card={currentCard}
        onRate={handleRate}
        onPlayAudio={onPlayAudio}
        currentIndex={cardIndex}
        totalCards={queue.cards.length}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-view: Word Graph
// ---------------------------------------------------------------------------
interface GraphViewProps {
  childId: string;
}

function GraphView({ childId }: GraphViewProps) {
  const [graph, setGraph] = useState<WordGraph | null>(null);
  const [recommendations, setRecommendations] =
    useState<GraphRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const recs = await getGraphRecommendations(childId, 6);
      setRecommendations(recs);
      // Load graph for the first recommended word if available
      if (recs.recommended_words.length > 0) {
        const wg = await getWordGraph(
          childId,
          recs.recommended_words[0].word_id,
          1,
        );
        setGraph(wg);
      }
    } catch {
      setError("無法載入詞彙關係圖。請確認後端已啟動。");
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleNodeClick = useCallback(
    async (node: { word_id: string; word: string }) => {
      try {
        const wg = await getWordGraph(childId, node.word_id, 1);
        setGraph(wg);
      } catch {
        // ignore
      }
    },
    [childId],
  );

  if (loading) {
    return (
      <StatusPanel
        icon={Loader2}
        title="載入詞彙關係圖中"
        description="正在整理你最近學過的單字連結。"
        tone="bg-emerald-100 text-emerald-600"
      />
    );
  }

  if (error) {
    return (
      <StatusPanel
        icon={AlertCircle}
        title="暫時打不開詞彙圖譜"
        description={error}
        actionLabel="重新整理"
        onAction={() => void loadRecommendations()}
        tone="bg-rose-100 text-rose-500"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Graph */}
      {graph ? (
        <>
          <WordKnowledgeGraph
            graph={graph}
            childId={childId}
            onNodeClick={handleNodeClick}
            className="w-full"
          />
        </>
      ) : (
        <div className="rounded-4xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
          <p className="child-tab-card-title !text-lg !text-slate-700">
            繼續學習詞彙，詞彙圖譜會自動建立
          </p>
          <p className="child-tab-card-copy">
            當你學的詞越多，這張圖會變得越完整。
          </p>
        </div>
      )}

      {/* Graph-based recommendations */}
      {recommendations && recommendations.recommended_words.length > 0 && (
        <div className="mt-2 rounded-4xl border border-emerald-100 bg-emerald-50/70 p-5">
          <p className="child-tab-card-title !mb-3 !text-center !text-sm !text-emerald-700">
            🌟 接下來可以學這些詞語！
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {recommendations.recommended_words.map((w) => (
              <button
                key={w.word_id}
                onClick={() => handleNodeClick(w)}
                className="flex flex-col items-center gap-0.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 border-2 border-emerald-200 text-emerald-800 rounded-2xl px-2 py-3 transition-all duration-150"
              >
                <span className="child-tab-card-title line-clamp-3 !mt-0 !text-center !text-lg !leading-tight !text-emerald-800 sm:!text-xl">
                  {w.word_cantonese || w.word}
                </span>
                {w.jyutping && (
                  <span className="child-tab-copy !mt-0 !text-[11px] !text-emerald-400">
                    {w.jyutping.split(" ")[0]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Phase 8 View
// ---------------------------------------------------------------------------
interface Phase8ViewProps {
  profile: ChildProfile;
  onPlayAudio?: (url: string) => void;
}

export function Phase8View({ profile, onPlayAudio }: Phase8ViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("review");
  const activeTabMeta = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];
  const ActiveIcon = activeTabMeta.icon;
  const dailyGoalProgress =
    profile.dailyGoal > 0
      ? Math.min((profile.todayProgress / profile.dailyGoal) * 100, 100)
      : 0;

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[40px] border border-white/60 bg-white/80 shadow-sm backdrop-blur-md">
        <div
          className={cn(
            "px-4 py-5 md:px-8 md:py-8",
            `bg-linear-to-r ${activeTabMeta.heroGradient}`,
          )}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3 md:space-y-4">
              <div className="child-tab-chip !px-3 !py-1.5 !text-xs text-slate-700 md:!px-4 md:!py-2 md:!text-sm">
                <Brain className="h-4 w-4 text-violet-500" />
                Brain Lab
              </div>
              <div>
                <h2 className="child-tab-hero-title !text-2xl md:!text-4xl">
                  {profile.name} 的智能學習站
                </h2>
                <p className="child-tab-hero-copy !text-sm md:!text-base">
                  用 AI 複習、詞彙圖譜和即時問答，讓練習方式跟上你的學習節奏。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full bg-sky-500 px-3 py-1 text-white hover:bg-sky-500">
                  {learningStyleLabels[profile.learningStyle]}
                </Badge>
                <Badge className="rounded-full bg-emerald-500 px-3 py-1 text-white hover:bg-emerald-500">
                  {languageLabels[profile.languagePreference || "cantonese"]}
                </Badge>
                <Badge className="rounded-full bg-violet-500 px-3 py-1 text-white hover:bg-violet-500">
                  專注 {profile.attentionSpan} 分鐘
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 md:hidden">
                <div className="rounded-2xl bg-white/75 px-3 py-3 text-center shadow-sm backdrop-blur-md">
                  <p className="child-tab-caption !text-[10px]">XP</p>
                  <p className="child-tab-stat-value !mt-1 !text-lg">
                    {profile.xp}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/75 px-3 py-3 text-center shadow-sm backdrop-blur-md">
                  <p className="child-tab-caption !text-[10px]">目標</p>
                  <p className="child-tab-stat-value !mt-1 !text-lg">
                    {profile.todayProgress}/{profile.dailyGoal}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/75 px-3 py-3 text-center shadow-sm backdrop-blur-md">
                  <p className="child-tab-caption !text-[10px]">專注</p>
                  <p className="child-tab-stat-value !mt-1 !text-lg">
                    {profile.attentionSpan} 分
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden rounded-4xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur-md md:block md:w-85">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl",
                    activeTabMeta.iconTone,
                  )}
                >
                  <ActiveIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="child-tab-caption">{activeTabMeta.labelEn}</p>
                  <h3 className="child-tab-section-title !mt-1 !text-2xl">
                    {activeTabMeta.label}
                  </h3>
                  <p className="child-tab-section-copy !mt-1 !text-sm">
                    {activeTabMeta.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-3xl bg-white/80 p-4">
                <p className="child-tab-card-copy !mt-0 !text-sm">
                  {activeTabMeta.cta}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4 md:grid md:grid-cols-[0.9fr_1.1fr] md:gap-6 md:px-8 md:py-8">
          <div className="order-2 space-y-4 md:order-1 md:space-y-6">
            <div className="hidden gap-4 sm:grid-cols-3 md:grid md:grid-cols-1 xl:grid-cols-3">
              <SmartStatCard
                icon={Star}
                value={`${profile.xp}`}
                label="總 XP"
                helper="每次互動都在累積智能學習能量。"
                tone="bg-amber-100 text-amber-500"
              />
              <SmartStatCard
                icon={Target}
                value={`${profile.todayProgress}/${profile.dailyGoal}`}
                label="今日目標"
                helper="看看今天還差多少就能達標。"
                tone="bg-emerald-100 text-emerald-600"
              />
              <SmartStatCard
                icon={Clock3}
                value={`${profile.attentionSpan} 分鐘`}
                label="專注節奏"
                helper="這個 Brain 頁面會配合你的專注時間。"
                tone="bg-violet-100 text-violet-600"
              />
            </div>

            <section className="hidden rounded-4xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-md md:block">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="child-tab-section-title !text-xl">智能工具</h3>
                  <p className="child-tab-section-copy !text-sm">
                    選擇你現在想用的 AI 學習方式。
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "rounded-3xl border p-4 text-left transition-all",
                        isActive
                          ? `bg-white shadow-sm ${tab.panelTone} ring-1 ring-white`
                          : "border-slate-100 bg-slate-50/70 hover:border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                            isActive ? tab.iconTone : "bg-white text-slate-500",
                          )}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="child-tab-card-title !mt-0 !text-lg">
                                {tab.label}
                              </p>
                              <p className="child-tab-caption">{tab.labelEn}</p>
                            </div>
                            {isActive && (
                              <Badge className="rounded-full bg-slate-800 px-3 py-1 text-white hover:bg-slate-800">
                                使用中
                              </Badge>
                            )}
                          </div>
                          <p className="child-tab-card-copy">
                            {tab.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="hidden rounded-4xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-md md:block">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl",
                    activeTabMeta.iconTone,
                  )}
                >
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="child-tab-section-title !text-xl">
                    今日智能提示
                  </h3>
                  <p className="child-tab-section-copy !text-sm">
                    目前工具會根據你的進度這樣幫你。
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "mt-5 rounded-3xl border p-5",
                  activeTabMeta.panelTone,
                )}
              >
                <p className="child-tab-card-title !mt-0 !text-base">
                  {activeTabMeta.label}
                </p>
                <p className="child-tab-card-copy">{activeTabMeta.cta}</p>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-500">
                    <span>今日智能學習進度</span>
                    <span>
                      {profile.todayProgress}/{profile.dailyGoal}
                    </span>
                  </div>
                  <Progress
                    value={dailyGoalProgress}
                    className="h-3 rounded-full bg-white"
                    indicatorClassName="bg-linear-to-r from-emerald-400 to-sky-400"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="order-1 space-y-4 md:order-2 md:space-y-6">
            <section className="rounded-4xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur-md md:p-6">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl",
                    activeTabMeta.iconTone,
                  )}
                >
                  <ActiveIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="child-tab-section-title !text-xl">
                    {activeTabMeta.label}
                  </h3>
                  <p className="child-tab-section-copy hidden md:block !text-sm">
                    {activeTabMeta.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 md:hidden">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "child-tab-card-title min-w-0 rounded-[28px] border px-2 py-3 !mt-0 !text-center !text-[13px] !leading-tight transition-all",
                        isActive
                          ? `${tab.panelTone} ${tab.activeTone} shadow-sm`
                          : "border-slate-200 bg-slate-50 text-slate-500",
                      )}
                    >
                      <span className="flex flex-col items-center justify-center gap-1.5">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-balance">{tab.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                className={cn(
                  "mt-4 rounded-3xl border p-4 md:hidden",
                  activeTabMeta.panelTone,
                )}
              >
                <p className="child-tab-card-title !mt-0 !text-sm !text-slate-700">
                  {activeTabMeta.description}
                </p>
                <p className="child-tab-card-copy !text-xs">
                  {activeTabMeta.cta}
                </p>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>今日進度</span>
                    <span>
                      {profile.todayProgress}/{profile.dailyGoal}
                    </span>
                  </div>
                  <Progress
                    value={dailyGoalProgress}
                    className="h-2.5 rounded-full bg-white"
                    indicatorClassName="bg-linear-to-r from-emerald-400 to-sky-400"
                  />
                </div>
              </div>

              <div className="mt-4 min-h-80 md:mt-5 md:min-h-112">
                {activeTab === "review" && (
                  <ReviewView childId={profile.id} onPlayAudio={onPlayAudio} />
                )}
                {activeTab === "graph" && <GraphView childId={profile.id} />}
                {activeTab === "tutor" && (
                  <AITutorChat childId={profile.id} className="h-full" />
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
