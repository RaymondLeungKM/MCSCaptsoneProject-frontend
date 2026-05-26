"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Volume2,
  Zap,
  BookOpen,
  Link2,
  Star,
  Check,
  PartyPopper,
} from "lucide-react";
import type { Word, LanguagePreference } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getWordText, getDefinition, getExample } from "@/lib/language-utils";
import { useWordAudio } from "@/hooks/use-word-audio";
import { AISentences } from "@/components/child/ai-sentences";
import {
  isBackendImageUrl,
  resolveBackendAssetUrl,
} from "@/lib/backend-assets";
import { toChildFriendlyList } from "@/lib/child-text";
import {
  updateWordProgress,
  requestActiveVocabApproval,
} from "@/lib/api/vocabulary";
import { trackDailyWord } from "@/lib/api/bedtime-stories";

interface WordDetailModalProps {
  word: Word | null;
  onClose: () => void;
  languagePreference?: LanguagePreference;
  childId?: string;
  footerAction?: React.ReactNode;
  onProgressUpdate?: (
    wordId: string,
    mastered: boolean,
    exposureCount: number,
  ) => void;
}

// Maps category.color (CSS class fragment) → a simple hex for a tinted hero bg
const PASTEL_BG: Record<string, string> = {
  red: "#FEE2E2",
  blue: "#DBEAFE",
  green: "#DCFCE7",
  yellow: "#FEF9C3",
  purple: "#F3E8FF",
  orange: "#FFEDD5",
  pink: "#FCE7F3",
  teal: "#CCFBF1",
};

const PASTEL_BORDER: Record<string, string> = {
  red: "#FECACA",
  blue: "#BFDBFE",
  green: "#BBF7D0",
  yellow: "#FDE68A",
  purple: "#E9D5FF",
  orange: "#FED7AA",
  pink: "#FBCFE8",
  teal: "#99F6E4",
};

function getColorKey(colorClass: string): string {
  const keys = Object.keys(PASTEL_BG);
  return keys.find((k) => colorClass.toLowerCase().includes(k)) ?? "blue";
}

const DIFFICULTY_CONFIG = {
  easy: {
    label: "初級",
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
  },
  medium: {
    label: "中級",
    bg: "bg-yellow-50",
    text: "text-yellow-600",
    border: "border-yellow-200",
  },
  hard: {
    label: "進階",
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
  },
};

const CONTEXT_TRANSLATION: Record<string, string> = {
  sky: "天空",
  nature: "大自然",
  trees: "樹木",
  forest: "森林",
  ocean: "海洋",
  beach: "沙灘",
  water: "水",
  home: "家",
  kitchen: "廚房",
  bedroom: "睡房",
  school: "學校",
  park: "公園",
  garden: "花園",
  playground: "遊樂場",
  supermarket: "超市",
  store: "商店",
  city: "城市",
  street: "街道",
  farm: "農場",
  zoo: "動物園",
  outdoors: "戶外",
  indoors: "室內",
  animals: "動物",
  food: "食物",
  sports: "運動",
  music: "音樂",
  meal_time: "用膳時間",
  bedtime: "睡前",
  bath_time: "洗澡時間",
  morning: "早上",
  evening: "晚上",
};
const EXPOSURE_GOAL = 6;

export function WordDetailModal({
  word,
  onClose,
  languagePreference = "cantonese",
  childId,
  footerAction,
  onProgressUpdate,
}: WordDetailModalProps) {
  const { playWord, playSentence, isPlaying, isLoading } = useWordAudio();
  const [mastered, setMastered] = useState(false);
  const [pendingParentApproval, setPendingParentApproval] = useState(false);
  const [requestingParentApproval, setRequestingParentApproval] =
    useState(false);
  const [exposureCount, setExposureCount] = useState(0);
  const [recordingExposure, setRecordingExposure] = useState(false);

  // Reset state when a new word is opened
  useEffect(() => {
    if (!word) return;
    setMastered(word.mastered ?? false);
    setPendingParentApproval(word.pendingActiveVocabApproval ?? false);
    setExposureCount(word.exposureCount ?? 0);
    setRecordingExposure(false);
  }, [word?.id]);

  const recordExposure = async (
    activity: string,
    options?: {
      masteryConfidence?: number;
      storyPriority?: number;
    },
  ) => {
    if (!word || !childId || recordingExposure) return;

    const nextCount = exposureCount + 1;
    setRecordingExposure(true);

    try {
      const progress = await updateWordProgress(word.id, childId, {
        exposure_count: nextCount,
      });

      setExposureCount(progress.exposure_count);
      onProgressUpdate?.(word.id, mastered, progress.exposure_count);

      try {
        await trackDailyWord({
          child_id: childId,
          word_id: word.id,
          date: new Date().toISOString(),
          exposure_count: 1,
          used_actively: false,
          mastery_confidence: options?.masteryConfidence ?? 0.35,
          learned_context: {
            activity,
            source: "vocabulary_modal",
          },
          include_in_story: true,
          story_priority: options?.storyPriority ?? 5,
        });
      } catch (trackingError) {
        console.warn("Failed to track exposure", trackingError);
      }
    } catch {
      /* silent */
    } finally {
      setRecordingExposure(false);
    }
  };

  const handleRequestParentApproval = async () => {
    if (
      !word ||
      !childId ||
      requestingParentApproval ||
      mastered ||
      pendingParentApproval
    ) {
      return;
    }

    setRequestingParentApproval(true);
    try {
      const progress = await requestActiveVocabApproval(word.id, childId);
      setPendingParentApproval(progress.pending_active_vocab_approval);
      setMastered(progress.mastered);
    } catch {
      /* silent */
    } finally {
      setRequestingParentApproval(false);
    }
  };

  if (!word) return null;

  const wordText = getWordText(word, languagePreference);
  const definition = getDefinition(word, languagePreference);
  const example = getExample(word, languagePreference);
  const relatedWords = toChildFriendlyList(word.relatedWords);
  const contexts = toChildFriendlyList(word.contexts);

  const colorKey = getColorKey(word.category ?? "");
  const heroBg = PASTEL_BG[colorKey] ?? PASTEL_BG.blue;
  const heroBorder = PASTEL_BORDER[colorKey] ?? PASTEL_BORDER.blue;

  const diff = DIFFICULTY_CONFIG[word.difficulty] ?? DIFFICULTY_CONFIG.easy;
  const exposureProgress = Math.min(exposureCount, EXPOSURE_GOAL);
  const exposureRemaining = Math.max(EXPOSURE_GOAL - exposureCount, 0);
  const exposureProgressPercent = (exposureProgress / EXPOSURE_GOAL) * 100;
  const reachedExposureGoal = exposureCount >= EXPOSURE_GOAL;

  const exposureHeadline = reachedExposureGoal
    ? "記憶小星星集齊啦！"
    : `已收集 ${exposureProgress} / ${EXPOSURE_GOAL} 粒記憶小星星`;

  const exposureEncouragement = reachedExposureGoal
    ? "太叻啦！這個詞語已超過練習目標，會更容易記住。"
    : exposureCount === 0
      ? "按一下聆聽發音，先點亮第一粒記憶小星星吧！"
      : `再收集 ${exposureRemaining} 粒小星星，就到達今日記憶目標！`;

  const handlePlayWord = () => {
    void playWord(word, { languagePreference, speechRate: 0.8 });
    void recordExposure("listen_pronunciation", {
      masteryConfidence: 0.35,
      storyPriority: 5,
    });
  };

  const handlePlayExample = () => {
    void playSentence(example, { languagePreference, speechRate: 0.8 });
    void recordExposure("listen_example", {
      masteryConfidence: 0.45,
      storyPriority: 6,
    });
  };

  const showCantonese = Boolean(word.word_cantonese);
  const showEnglishSub = false;
  const activeVocabularyLabel = "主動詞彙";
  const requestParentApprovalLabel = "請家長確認";
  const pendingApprovalLabel = "等待家長確認";
  const activeVocabularyHint = "先集齊 6 粒記憶小星星，之後才可以在這裡送出請求，再由家長到家長中心確認。";
  const activeVocabularyPendingHint = "已送出確認請求。這個詞語要等家長在家長中心批准後，才會計入主動詞彙。";
  const activeVocabularyCompleteHint = "這個詞語已經計入主動詞彙。";
  const collectStarsFirstLabel = `先集齊 ${EXPOSURE_GOAL} 粒星`;

  const modal = (
    <div className="fixed inset-0 z-9999">
      {/* Backdrop – blurs and dims the page behind the modal */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative z-10 flex min-h-full items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
        {/* Card */}
        <div
          className={cn(
            "relative w-full max-w-lg bg-white",
            "rounded-[40px]",
            "border-4 border-white shadow-2xl",
            "max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain sm:max-h-[90dvh]",
            "animate-in zoom-in-95 fade-in duration-300",
          )}
        >
        {/* ── HERO ───────────────────────────────────────────── */}
        <div
          className="relative flex shrink-0 flex-col items-center px-6 pt-8 pb-6"
          style={{
            backgroundColor: heroBg,
            borderBottom: `3px solid ${heroBorder}`,
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-sm border border-white/60 transition-all hover:scale-105 hover:rotate-90 text-slate-400"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image */}
          <div
            className="w-32 h-32 rounded-3xl flex items-center justify-center overflow-hidden shadow-md mb-4"
            style={{
              border: `3px solid ${heroBorder}`,
              backgroundColor: heroBg,
            }}
          >
            {isBackendImageUrl(word.image) ? (
              <img
                src={resolveBackendAssetUrl(word.image)}
                alt={word.word}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span className="text-6xl">{word.image || "📝"}</span>
            )}
          </div>

          {/* Word Name */}
          <div className="text-center mb-3">
            {showCantonese ? (
              <>
                <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-tight">
                  {word.word_cantonese}
                </h2>
                {showEnglishSub && (
                  <p className="text-base font-bold text-slate-400 mt-1">
                    {word.word}
                  </p>
                )}
              </>
            ) : (
              <h2 className="text-4xl font-black text-slate-800 tracking-tight">
                {word.word}
              </h2>
            )}

            {/* Jyutping / Pronunciation */}
            {word.jyutping && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/80 text-sm font-bold text-slate-500 border border-white/60 shadow-sm font-mono">
                {word.jyutping}
              </span>
            )}
          </div>

          {/* Badges Row */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {(word.category_name_cantonese || word.categoryName) && (
              <span className="px-3 py-1 bg-white/70 rounded-full text-xs font-bold text-slate-500 border border-white/50">
                {word.category_name_cantonese || word.categoryName}
              </span>
            )}
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide",
                diff.bg,
                diff.text,
                diff.border,
              )}
            >
              {diff.label}
            </span>
            {mastered && (
              <span className="px-3 py-1 rounded-full text-xs font-bold border bg-green-50 text-green-600 border-green-200 flex items-center gap-1">
                <Check className="w-3 h-3" />
                {activeVocabularyLabel}
              </span>
            )}
          </div>

          {childId && (
            <div className="mt-4 w-full max-w-sm rounded-[28px] border border-white/70 bg-white/70 px-4 py-4 shadow-md backdrop-blur-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm",
                      reachedExposureGoal
                        ? "bg-linear-to-br from-yellow-300 to-orange-300 text-yellow-900"
                        : "bg-linear-to-br from-sky-300 to-cyan-200 text-white",
                    )}
                  >
                    {reachedExposureGoal ? (
                      <PartyPopper className="h-5 w-5" />
                    ) : (
                      <Zap className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                      記憶小星星
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-700">
                      {exposureHeadline}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white px-3 py-2 text-right shadow-sm border border-white/80 shrink-0">
                  <p className="text-xl font-black leading-none text-slate-700">
                    {exposureCount}
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {reachedExposureGoal ? "星星+" : `目標 ${EXPOSURE_GOAL}`}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-6 gap-2">
                {Array.from({ length: EXPOSURE_GOAL }).map((_, index) => {
                  const isLit = index < exposureProgress;

                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex h-10 items-center justify-center rounded-2xl border transition-all duration-300",
                        isLit
                          ? "border-yellow-200 bg-linear-to-br from-yellow-200 via-amber-200 to-orange-200 text-yellow-700 shadow-sm scale-[1.03]"
                          : "border-white/80 bg-white/70 text-slate-300",
                      )}
                    >
                      <Star
                        className={cn("h-4 w-4", isLit && "fill-current")}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80 shadow-inner">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    reachedExposureGoal
                      ? "bg-linear-to-r from-emerald-400 via-lime-300 to-yellow-300"
                      : "bg-linear-to-r from-sky-400 via-cyan-300 to-emerald-300",
                    recordingExposure && "animate-pulse",
                  )}
                  style={{ width: `${exposureProgressPercent}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs font-bold leading-relaxed text-slate-500">
                  {exposureEncouragement}
                </p>

                {recordingExposure && (
                  <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-400 shadow-sm">
                    記錄中...
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Play Button + Mastery Toggle */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handlePlayWord}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full font-black text-white shadow-md transition-all",
                "duration-200 hover:scale-105 active:scale-95",
                isPlaying
                  ? "bg-blue-400 scale-105"
                  : "bg-[#38BDF8] hover:bg-[#0EA5E9]",
              )}
            >
              <Volume2
                className={cn("w-5 h-5", isPlaying && "animate-pulse")}
              />
              {isLoading
                ? "準備中..."
                : isPlaying
                  ? "播放中..."
                  : "聆聽發音"}
            </button>

            {childId &&
              (mastered ? (
                // Non-interactive celebration badge — mastery cannot be reverted
                <div
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-full font-black border-2 select-none",
                    "bg-green-100 text-green-700 border-green-300",
                    "transition-all duration-500",
                  )}
                >
                  <Check className="w-5 h-5" />
                  已列入主動詞彙
                </div>
              ) : pendingParentApproval ? (
                <div className="flex items-center gap-2 px-5 py-3 rounded-full font-black border-2 border-amber-300 bg-amber-50 text-amber-700 select-none">
                  <PartyPopper className="w-5 h-5" />
                  {pendingApprovalLabel}
                </div>
              ) : (
                // Parent-confirmation request button
                <button
                  onClick={handleRequestParentApproval}
                  disabled={requestingParentApproval || !reachedExposureGoal}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-full font-black shadow-md transition-all",
                    "duration-200 hover:scale-105 active:scale-95 border-2",
                    requestingParentApproval
                      ? "bg-yellow-100 text-yellow-600 border-yellow-300 opacity-70"
                      : !reachedExposureGoal
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-80"
                        : "bg-white/80 text-slate-500 border-white/60 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-300",
                  )}
                  aria-label={requestParentApprovalLabel}
                >
                  <Star
                    className={cn(
                      "w-5 h-5",
                      requestingParentApproval && "animate-spin",
                    )}
                  />
                  {requestingParentApproval
                    ? "..."
                    : reachedExposureGoal
                      ? requestParentApprovalLabel
                      : collectStarsFirstLabel}
                </button>
              ))}
          </div>

          {childId && (
            <div className="mt-3 space-y-1 text-center text-xs font-bold text-slate-500">
              <p>
                每次聽發音或播放例句，都會點亮一粒記憶小星星。
              </p>
              <p className="text-emerald-600">
                {mastered
                  ? activeVocabularyCompleteHint
                  : pendingParentApproval
                    ? activeVocabularyPendingHint
                    : activeVocabularyHint}
              </p>
            </div>
          )}

          {footerAction && (
            <div className="mt-3 flex justify-center">
              {footerAction}
            </div>
          )}
        </div>

        {/* ── SCROLLABLE BODY ─────────────────────────────────── */}
        <div className="custom-scrollbar px-5 py-5 touch-pan-y">
          <div className="space-y-4 pb-2">
          {/* Definition */}
          <Section
            icon={<BookOpen className="w-4 h-4" />}
            title="意思"
            color="sky"
          >
            <p className="text-base font-bold text-slate-700 leading-relaxed">
              {definition}
            </p>
          </Section>

          {/* Example Sentence */}
          <Section
            icon={<span className="text-base">💬</span>}
            title="例句"
            color="purple"
            action={
              <button
                onClick={handlePlayExample}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 rounded-full text-purple-600 text-xs font-black transition-colors"
                aria-label="播放例句"
              >
                <Volume2
                  className={cn("w-3.5 h-3.5", isPlaying && "animate-pulse")}
                />
                播放
              </button>
            }
          >
            <p className="text-base font-bold text-slate-700 leading-relaxed italic">
              "{example}"
            </p>
          </Section>

          {/* AI Sample Sentences */}
          <Section
            icon={<span className="text-base">✨</span>}
            title="更多例句"
            color="pink"
          >
            <AISentences
              wordId={word.id}
              languagePreference={languagePreference}
              word={word}
            />
          </Section>

          {/* Related Words */}
          {relatedWords.length > 0 && (
            <Section
              icon={<Link2 className="w-4 h-4" />}
              title="相關詞語"
              color="teal"
            >
              <div className="flex flex-wrap gap-2">
                {relatedWords.map((rw) => (
                  <span
                    key={rw}
                    className="px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-sm font-bold"
                  >
                    {rw}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Contexts */}
          {contexts.length > 0 && (
            <Section
              icon={<span className="text-base">🗺️</span>}
              title="在哪裡聽到？"
              color="green"
            >
              <ul className="space-y-1">
                {contexts.map((label) => {
                  return (
                    <li
                      key={label}
                      className="flex items-center gap-2 text-sm font-bold text-slate-600"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                      {label}
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          {/* Bottom padding to clear shadow */}
          <div className="h-2" />
          </div>
        </div>
      </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ── REUSABLE SECTION CARD ─────────────────────────────────────────────────────

type SectionColor = "sky" | "purple" | "orange" | "pink" | "teal" | "green";

const SECTION_STYLES: Record<
  SectionColor,
  { card: string; icon: string; title: string }
> = {
  sky: {
    card: "bg-sky-50 border-sky-100",
    icon: "bg-sky-100 text-sky-600",
    title: "text-sky-700",
  },
  purple: {
    card: "bg-purple-50 border-purple-100",
    icon: "bg-purple-100 text-purple-600",
    title: "text-purple-700",
  },
  orange: {
    card: "bg-orange-50 border-orange-100",
    icon: "bg-orange-100 text-orange-500",
    title: "text-orange-600",
  },
  pink: {
    card: "bg-pink-50 border-pink-100",
    icon: "bg-pink-100 text-pink-600",
    title: "text-pink-700",
  },
  teal: {
    card: "bg-teal-50 border-teal-100",
    icon: "bg-teal-100 text-teal-600",
    title: "text-teal-700",
  },
  green: {
    card: "bg-green-50 border-green-100",
    icon: "bg-green-100 text-green-600",
    title: "text-green-700",
  },
};

function Section({
  icon,
  title,
  color,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: SectionColor;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const s = SECTION_STYLES[color];
  return (
    <div className={cn("rounded-3xl border p-4", s.card)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-7 h-7 rounded-xl flex items-center justify-center text-sm",
              s.icon,
            )}
          >
            {icon}
          </span>
          <span
            className={cn(
              "text-sm font-black uppercase tracking-wide",
              s.title,
            )}
          >
            {title}
          </span>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
