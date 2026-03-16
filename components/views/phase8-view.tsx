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
import {
  getReviewQueue,
  submitReview,
  getLearningSpeedProfile,
  getGraphRecommendations,
  getWordGraph,
} from "@/lib/api/phase8";

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------
const TABS = [
  {
    id: "review" as const,
    label: "間隔重複",
    labelEn: "Review",
    icon: Brain,
    color: "indigo",
  },
  {
    id: "graph" as const,
    label: "詞彙關係圖",
    labelEn: "Word Graph",
    icon: GitBranch,
    color: "emerald",
  },
  {
    id: "tutor" as const,
    label: "小博士",
    labelEn: "AI Tutor",
    icon: MessageSquare,
    color: "amber",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

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
      <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p
          className="text-sm"
          style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
        >
          載入複習卡…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-slate-500">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p
          className="text-sm text-center max-w-xs"
          style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
        >
          {error}
        </p>
        <button
          onClick={load}
          className="mt-2 text-sm text-indigo-500 hover:underline"
        >
          重試
        </button>
      </div>
    );
  }

  if (!queue || queue.cards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <CheckCircle2 className="w-14 h-14 text-emerald-400" />
        <p
          className="text-xl font-black text-slate-700"
          style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
        >
          今日複習全部完成！🎉
        </p>
        <p
          className="text-sm text-slate-400"
          style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
        >
          繼續保持，明天再來複習！
        </p>
        {profile && (
          <div className="mt-4 bg-indigo-50 rounded-2xl p-4 text-left w-full max-w-sm">
            <p
              className="font-bold text-indigo-700 text-sm mb-2"
              style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
            >
              你的學習速度分析
            </p>
            <p
              className="text-xs text-slate-600"
              style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
            >
              {profile.assessment}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-black text-indigo-600">
                  {profile.total_cards}
                </p>
                <p
                  className="text-[10px] text-slate-400"
                  style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                >
                  總卡數
                </p>
              </div>
              <div>
                <p className="text-lg font-black text-emerald-600">
                  {Math.round(profile.graduation_rate * 100)}%
                </p>
                <p
                  className="text-[10px] text-slate-400"
                  style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                >
                  畢業率
                </p>
              </div>
              <div>
                <p className="text-lg font-black text-amber-600">
                  {profile.avg_interval.toFixed(1)}天
                </p>
                <p
                  className="text-[10px] text-slate-400"
                  style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                >
                  平均間隔
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (cardIndex >= queue.cards.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <CheckCircle2 className="w-14 h-14 text-emerald-400" />
        <p
          className="text-xl font-black text-slate-700"
          style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
        >
          本節複習完成！👏
        </p>
        <button
          onClick={load}
          className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold px-6 py-2.5 rounded-full transition-colors"
          style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
        >
          再次載入
        </button>
      </div>
    );
  }

  const currentCard = queue.cards[cardIndex];

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Result feedback */}
      {lastResult && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 text-center animate-in fade-in duration-200">
          <p
            className="text-indigo-700 font-bold text-sm"
            style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          >
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
      <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p
          className="text-sm"
          style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
        >
          載入詞彙關係圖…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-slate-500">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p
          className="text-sm text-center max-w-xs"
          style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
        >
          {error}
        </p>
      </div>
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
        <p
          className="text-sm text-slate-400 text-center py-6"
          style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
        >
          繼續學習詞彙，詞彙圖譜會自動建立！
        </p>
      )}

      {/* Graph-based recommendations */}
      {recommendations && recommendations.recommended_words.length > 0 && (
        <div className="mt-2">
          <p
            className="text-sm font-bold text-slate-600 mb-3 text-center"
            style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          >
            🌟 接下來可以學這些詞語！
          </p>
          <div className="grid grid-cols-3 gap-2">
            {recommendations.recommended_words.map((w) => (
              <button
                key={w.word_id}
                onClick={() => handleNodeClick(w)}
                className="flex flex-col items-center gap-0.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 border-2 border-emerald-200 text-emerald-800 rounded-2xl px-2 py-3 transition-all duration-150"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
              >
                <span className="text-xl font-black leading-none">
                  {w.word_cantonese || w.word}
                </span>
                {w.jyutping && (
                  <span className="text-emerald-400 text-[11px] font-semibold">
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

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200",
              activeTab === id
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <Icon className="w-4 h-4" />
            <span style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-100">
        {activeTab === "review" && (
          <ReviewView childId={profile.id} onPlayAudio={onPlayAudio} />
        )}
        {activeTab === "graph" && <GraphView childId={profile.id} />}
        {activeTab === "tutor" && (
          <AITutorChat childId={profile.id} className="h-full" />
        )}
      </div>
    </div>
  );
}
