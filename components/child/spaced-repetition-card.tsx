"use client";

/**
 * Spaced Repetition Card – Epic 8.2
 *
 * A flip-card flashcard that lets the child:
 *  1. See the Cantonese word on the front
 *  2. Flip to reveal definition + image + Jyutping on the back
 *  3. Rate recall quality (0-5) which drives the SM-2 schedule
 */
import React, { useState, useCallback } from "react";
import { Volume2, RotateCcw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpacedRepetitionCard as SRCard } from "@/lib/types";

// ---------------------------------------------------------------------------
// Quality button config
// ---------------------------------------------------------------------------
const QUALITY_BUTTONS = [
  {
    quality: 0 as const,
    label: "完全唔識",
    labelEn: "No idea",
    color: "bg-red-500 hover:bg-red-600",
    emoji: "😰",
  },
  {
    quality: 2 as const,
    label: "有少少印象",
    labelEn: "Vague",
    color: "bg-orange-400 hover:bg-orange-500",
    emoji: "🤔",
  },
  {
    quality: 3 as const,
    label: "記得，但困難",
    labelEn: "Hard",
    color: "bg-yellow-400 hover:bg-yellow-500",
    emoji: "😅",
  },
  {
    quality: 4 as const,
    label: "記得！",
    labelEn: "Good",
    color: "bg-green-500 hover:bg-green-600",
    emoji: "😊",
  },
  {
    quality: 5 as const,
    label: "完全識！",
    labelEn: "Perfect",
    color: "bg-emerald-500 hover:bg-emerald-600",
    emoji: "🌟",
  },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface SpacedRepetitionCardProps {
  card: SRCard;
  onRate: (quality: 0 | 1 | 2 | 3 | 4 | 5) => void;
  onPlayAudio?: (audioUrl: string) => void;
  currentIndex: number;
  totalCards: number;
}

export function SpacedRepetitionCard({
  card,
  onRate,
  onPlayAudio,
  currentIndex,
  totalCards,
}: SpacedRepetitionCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = useCallback(() => setIsFlipped((v) => !v), []);

  const handlePlayAudio = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (card.audio_url && onPlayAudio) {
        onPlayAudio(card.audio_url);
      }
    },
    [card.audio_url, onPlayAudio],
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto select-none">
      {/* Progress indicator */}
      <div className="flex items-center justify-between w-full text-base text-slate-500">
        <span className="font-medium">
          {currentIndex + 1} / {totalCards}
        </span>
        {card.is_new && (
          <span className="bg-blue-100 text-blue-700 text-sm font-bold px-3 py-1 rounded-full">
            新詞彙
          </span>
        )}
        {card.is_graduated && (
          <span className="bg-emerald-100 text-emerald-700 text-sm font-bold px-3 py-1 rounded-full">
            已畢業 🎓
          </span>
        )}
      </div>

      {/* Flip card */}
      <div
        className="relative w-full aspect-[4/3] cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={handleFlip}
      >
        <div
          className={cn(
            "relative w-full h-full transition-transform duration-500",
            "[transform-style:preserve-3d]",
            isFlipped && "[transform:rotateY(180deg)]",
          )}
        >
          {/* ---- FRONT ---- */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl flex flex-col items-center justify-center p-6 [backface-visibility:hidden]">
            {/* Cantonese word */}
            <p
              className="text-white font-black text-center leading-tight text-6xl mb-3"
              style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
            >
              {card.word_cantonese || card.word || "?"}
            </p>

            {/* Jyutping */}
            {card.jyutping && (
              <p className="text-indigo-100 text-2xl font-semibold mt-2">
                {card.jyutping}
              </p>
            )}

            {/* Audio button */}
            {card.audio_url && (
              <button
                onClick={handlePlayAudio}
                className="mt-6 bg-white/20 hover:bg-white/30 text-white rounded-full p-4 transition-colors"
                aria-label="播放發音"
              >
                <Volume2 className="w-7 h-7" />
              </button>
            )}

            <p className="text-indigo-200 text-sm mt-8 flex items-center gap-1">
              <RotateCcw className="w-4 h-4" /> 點擊翻面
            </p>
          </div>

          {/* ---- BACK ---- */}
          <div className="absolute inset-0 rounded-3xl bg-white shadow-xl flex flex-col items-center justify-center p-6 [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-y-auto">
            {/* Image */}
            {card.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.image_url}
                alt={card.word_cantonese || card.word || ""}
                className="w-32 h-32 object-cover rounded-3xl shadow mb-4"
              />
            ) : (
              <div className="w-32 h-32 bg-slate-100 rounded-3xl flex items-center justify-center text-6xl mb-4">
                📖
              </div>
            )}

            {/* Word & jyutping */}
            <p
              className="text-5xl font-black text-slate-800 text-center"
              style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
            >
              {card.word_cantonese || card.word}
            </p>
            {card.jyutping && (
              <p className="text-indigo-500 font-semibold text-lg mt-1">
                {card.jyutping}
              </p>
            )}

            {/* Definition */}
            {card.definition_cantonese && (
              <p
                className="text-slate-600 text-base text-center mt-4 leading-relaxed"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
              >
                {card.definition_cantonese}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quality rating buttons (only when flipped) */}
      {isFlipped && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p
            className="text-center text-sm text-slate-500 mb-2 font-medium"
            style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          >
            你記得幾好？
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {QUALITY_BUTTONS.map(({ quality, label, emoji, color }) => (
              <button
                key={quality}
                onClick={() => onRate(quality)}
                className={cn(
                  "flex flex-col items-center py-2 px-1 rounded-xl text-white font-bold transition-transform active:scale-95 shadow-sm",
                  color,
                )}
              >
                <span className="text-lg">{emoji}</span>
                <span
                  className="text-[10px] leading-tight mt-0.5 text-center"
                  style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-slate-400 mt-2">
            根據你的評分，系統會幫你安排最佳複習時間
          </p>
        </div>
      )}

      {/* Flip hint when not yet flipped */}
      {!isFlipped && (
        <p className="text-slate-400 text-base flex items-center gap-2">
          點擊卡片翻面查看答案 <ChevronRight className="w-5 h-5" />
        </p>
      )}
    </div>
  );
}
