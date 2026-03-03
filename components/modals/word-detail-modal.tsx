"use client";

import { useEffect, useRef, useState } from "react";
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
import { updateWordProgress } from "@/lib/api/vocabulary";
import { trackDailyWord } from "@/lib/api/bedtime-stories";

interface WordDetailModalProps {
  word: Word | null;
  onClose: () => void;
  languagePreference?: LanguagePreference;
  childId?: string;
  onProgressUpdate?: (
    wordId: string,
    mastered: boolean,
    exposureCount: number,
  ) => void;
}

const isImageUrl = (value?: string) =>
  !!value && (value.startsWith("http") || value.startsWith("/"));

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

export function WordDetailModal({
  word,
  onClose,
  languagePreference = "cantonese",
  childId,
  onProgressUpdate,
}: WordDetailModalProps) {
  const { playWord, playSentence, isPlaying, isLoading } = useWordAudio();
  const [mastered, setMastered] = useState(false);
  const [markingMastered, setMarkingMastered] = useState(false);
  const [justMastered, setJustMastered] = useState(false);
  const exposureRecorded = useRef(false);

  // Reset state when a new word is opened
  useEffect(() => {
    if (!word) return;
    setMastered(word.mastered ?? false);
    setJustMastered(false);
    exposureRecorded.current = false;
  }, [word?.id]);

  // Record an exposure once when the modal opens for this word
  useEffect(() => {
    if (!word || !childId || exposureRecorded.current) return;
    exposureRecorded.current = true;
    const nextCount = (word.exposureCount ?? 0) + 1;
    // Update word progress and track in DailyWordTracking (needed for today_progress)
    Promise.allSettled([
      updateWordProgress(word.id, childId, { exposure_count: nextCount }),
      trackDailyWord({
        child_id: childId,
        word_id: word.id,
        date: new Date().toISOString(),
        exposure_count: 1,
        used_actively: false,
        mastery_confidence: 0.3,
        learned_context: {
          activity: "word_detail",
          source: "vocabulary_modal",
        },
        include_in_story: true,
        story_priority: 5,
      }),
    ]).then(() => onProgressUpdate?.(word.id, mastered, nextCount));
  }, [word?.id, childId]);

  // One-way: mark a word as mastered (cannot be reverted via the UI)
  const handleMarkMastered = async () => {
    if (!word || !childId || markingMastered || mastered) return;
    setMarkingMastered(true);
    try {
      await updateWordProgress(word.id, childId, { mastered: true });
      setMastered(true);
      setJustMastered(true);
      onProgressUpdate?.(word.id, true, word.exposureCount ?? 0);
      // Brief celebration flash then settle
      setTimeout(() => setJustMastered(false), 2000);
    } catch {
      /* silent */
    } finally {
      setMarkingMastered(false);
    }
  };

  if (!word) return null;

  const wordText = getWordText(word, languagePreference);
  const definition = getDefinition(word, languagePreference);
  const example = getExample(word, languagePreference);

  const colorKey = getColorKey(word.category ?? "");
  const heroBg = PASTEL_BG[colorKey] ?? PASTEL_BG.blue;
  const heroBorder = PASTEL_BORDER[colorKey] ?? PASTEL_BORDER.blue;

  const diff = DIFFICULTY_CONFIG[word.difficulty] ?? DIFFICULTY_CONFIG.easy;

  const handlePlayWord = () => {
    void playWord(word, { languagePreference, speechRate: 0.8 });
  };

  const handlePlayExample = () => {
    void playSentence(example, { languagePreference, speechRate: 0.8 });
  };

  const showCantonese = languagePreference !== "english" && word.word_cantonese;
  const showEnglishSub =
    languagePreference === "cantonese" && word.word_cantonese;

  const modal = (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      {/* Backdrop – blurs and dims the page behind the modal */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className={cn(
          "relative w-full max-w-lg bg-white",
          "rounded-[40px]",
          "shadow-2xl border-4 border-white",
          "flex flex-col max-h-[90vh] overflow-hidden",
          "animate-in zoom-in-95 fade-in duration-300",
        )}
      >
        {/* ── HERO ───────────────────────────────────────────── */}
        <div
          className="relative flex flex-col items-center pt-8 pb-6 px-6"
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
            {isImageUrl(word.image) ? (
              <img
                src={word.image}
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
            {languagePreference !== "english" && word.jyutping && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/80 text-sm font-bold text-slate-500 border border-white/60 shadow-sm font-mono">
                {word.jyutping}
              </span>
            )}
            {languagePreference === "english" && word.pronunciation && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/80 text-sm font-bold text-slate-500 border border-white/60 shadow-sm font-mono">
                /{word.pronunciation}/
              </span>
            )}
          </div>

          {/* Badges Row */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {word.categoryName && (
              <span className="px-3 py-1 bg-white/70 rounded-full text-xs font-bold text-slate-500 border border-white/50">
                {word.categoryName}
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
                {languagePreference === "english" ? "Mastered" : "已掌握"}
              </span>
            )}
          </div>

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
                  : languagePreference === "english"
                    ? "Listen"
                    : "聆聽發音"}
            </button>

            {childId &&
              (mastered ? (
                // Non-interactive celebration badge — mastery cannot be reverted
                <div
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-full font-black border-2 select-none",
                    justMastered
                      ? "bg-yellow-300 text-yellow-800 border-yellow-400 scale-110 shadow-lg animate-pulse"
                      : "bg-green-100 text-green-700 border-green-300",
                    "transition-all duration-500",
                  )}
                >
                  {justMastered ? (
                    <PartyPopper className="w-5 h-5" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  {justMastered
                    ? languagePreference === "english"
                      ? "Mastered! 🎉"
                      : "掌握了！🎉"
                    : languagePreference === "english"
                      ? "Mastered"
                      : "已掌握"}
                </div>
              ) : (
                // Mark-as-mastered button — one tap, then disappears
                <button
                  onClick={handleMarkMastered}
                  disabled={markingMastered}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-full font-black shadow-md transition-all",
                    "duration-200 hover:scale-105 active:scale-95 border-2",
                    markingMastered
                      ? "bg-yellow-100 text-yellow-600 border-yellow-300 opacity-70"
                      : "bg-white/80 text-slate-500 border-white/60 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-300",
                  )}
                  aria-label="Mark as mastered"
                >
                  <Star
                    className={cn("w-5 h-5", markingMastered && "animate-spin")}
                  />
                  {markingMastered
                    ? "..."
                    : languagePreference === "english"
                      ? "I know it!"
                      : "我識啦！"}
                </button>
              ))}
          </div>
        </div>

        {/* ── SCROLLABLE BODY ─────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Definition */}
          <Section
            icon={<BookOpen className="w-4 h-4" />}
            title={languagePreference === "english" ? "Meaning" : "意思"}
            color="sky"
          >
            <p className="text-base font-bold text-slate-700 leading-relaxed">
              {definition}
            </p>
          </Section>

          {/* Example Sentence */}
          <Section
            icon={<span className="text-base">💬</span>}
            title={languagePreference === "english" ? "Example" : "例句"}
            color="purple"
            action={
              <button
                onClick={handlePlayExample}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 rounded-full text-purple-600 text-xs font-black transition-colors"
                aria-label="Play example sentence"
              >
                <Volume2
                  className={cn("w-3.5 h-3.5", isPlaying && "animate-pulse")}
                />
                {languagePreference === "english" ? "Play" : "播放"}
              </button>
            }
          >
            <p className="text-base font-bold text-slate-700 leading-relaxed italic">
              "{example}"
            </p>
          </Section>

          {/* Physical Action */}
          {word.physicalAction && (
            <Section
              icon={<Zap className="w-4 h-4" />}
              title={
                languagePreference === "english" ? "Try This!" : "動一動！"
              }
              color="orange"
            >
              <p className="text-base font-bold text-slate-700 leading-relaxed">
                {word.physicalAction}
              </p>
            </Section>
          )}

          {/* AI Sample Sentences */}
          <Section
            icon={<span className="text-base">✨</span>}
            title={
              languagePreference === "english" ? "More Sentences" : "更多例句"
            }
            color="pink"
          >
            <AISentences
              wordId={word.id}
              languagePreference={languagePreference}
            />
          </Section>

          {/* Related Words */}
          {word.relatedWords && word.relatedWords.length > 0 && (
            <Section
              icon={<Link2 className="w-4 h-4" />}
              title={
                languagePreference === "english" ? "Related Words" : "相關詞語"
              }
              color="teal"
            >
              <div className="flex flex-wrap gap-2">
                {word.relatedWords.map((rw) => (
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
          {word.contexts && word.contexts.length > 0 && (
            <Section
              icon={<span className="text-base">🗺️</span>}
              title={
                languagePreference === "english"
                  ? "Where You'll Hear It"
                  : "在哪裡聽到？"
              }
              color="green"
            >
              <ul className="space-y-1">
                {word.contexts.map((ctx) => (
                  <li
                    key={ctx}
                    className="flex items-center gap-2 text-sm font-bold text-slate-600"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                    {ctx}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Bottom padding to clear shadow */}
          <div className="h-2" />
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
