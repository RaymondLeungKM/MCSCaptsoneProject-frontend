"use client";

/**
 * OwlCompanion — Duolingo / Khan Academy style floating mascot.
 *
 * Behaviour goals:
 *   - Always-present friendly character in the bottom-right corner
 *   - Periodic idle animations (bob, blink, occasional "wave/jump" attention burst)
 *   - Notification dot when a fresh tip is waiting; clears once the bubble is read
 *   - Tap opens a small dialog card with avatar header, name, level badge,
 *     a contextual tip, and quick actions (next tip / thumbs up / close)
 *   - Tap outside or press Escape to dismiss
 *   - Tier unlocks (Lv.3 dog, Lv.6 cat) trigger a one-time celebration with confetti
 *   - Mood/messages cycle from a tier-specific pool
 *   - Mascot becomes "alert" (bigger pulse, dot visible) every ~25s when idle
 */

import type { ReactElement } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import confetti from "canvas-confetti";
import { ChevronRight, Sparkles, ThumbsUp, X } from "lucide-react";
import { CartoonCat, CartoonDog, CartoonOwl } from "./cartoon-characters";

type MascotId = "owl" | "dog" | "cat";

interface MascotTier {
  id: MascotId;
  unlockLevel: number;
  name: string;
  /** Short role label shown under the name. */
  role: string;
  /** Base ring/glow colour (CSS). */
  accent: string;
  /** Bubble border colour. */
  bubbleBorder: string;
  /** Bubble title/text colour. */
  bubbleText: string;
  /** Notification dot colour. */
  dot: string;
  /** Greeting text shown once when the tier first unlocks. */
  unlockMessage: string;
  /** Rotating contextual tips/encouragements. */
  messages: string[];
  /** Renders the SVG mascot at a given pixel size. */
  render: (size: number) => ReactElement;
}

const MASCOT_TIERS: MascotTier[] = [
  {
    id: "owl",
    unlockLevel: 1,
    name: "貓頭鷹",
    role: "你嘅學習老師",
    accent: "rgba(139, 92, 246, 0.55)",
    bubbleBorder: "#c4b5fd",
    bubbleText: "#5b21b6",
    dot: "#facc15",
    unlockMessage: "你好！我係 Ollie，會喺呢度陪你學廣東話呀。",
    messages: [
      "你今日做得好好！再讀多一次，你會記得更清楚。",
      "提示：大聲讀出嚟，發音會更標準。",
      "你知唔知？每日學三個新詞，一個月就識九十個！",
      "覺得難？慢慢嚟，我會陪住你 💜",
      "完成一個小任務就可以攞星星，加油！",
    ],
    render: (size) => <CartoonOwl size={size} animate="scene" variant="storybook" />,
  },
  {
    id: "dog",
    unlockLevel: 3,
    name: "Bingo 小狗",
    role: "你嘅冒險隊長",
    accent: "rgba(251, 146, 60, 0.6)",
    bubbleBorder: "#fdba74",
    bubbleText: "#c2410c",
    dot: "#fb923c",
    unlockMessage: "汪！Lv.3 解鎖啦！我係 Bingo，會同你一齊衝關。",
    messages: [
      "汪汪！再試多一次，你就會成功！",
      "你今日連續學咗幾日啦？保持落去！",
      "想拎金獎？挑戰一個新類別啦！",
      "我哋一齊去探險，搵晒所有詞語！",
    ],
    render: (size) => <CartoonDog size={size} animate="scene" />,
  },
  {
    id: "cat",
    unlockLevel: 6,
    name: "Mimi 小貓",
    role: "你嘅進階導師",
    accent: "rgba(244, 114, 182, 0.6)",
    bubbleBorder: "#f9a8d4",
    bubbleText: "#be185d",
    dot: "#fb7185",
    unlockMessage: "喵！Lv.6 解鎖！我係 Mimi，跟住我升上更高級。",
    messages: [
      "喵～你已經好叻啦，挑戰故事模式吖？",
      "記住節奏慢慢講，會更清楚！",
      "嘗試自己造一個句子，會學得更深！",
      "你做到嘅 — 我見證緊你進步 💖",
    ],
    render: (size) => <CartoonCat size={size} animate="scene" />,
  },
];

interface OwlCompanionProps {
  level?: number;
}

export function OwlCompanion({ level = 1 }: OwlCompanionProps) {
  const [open, setOpen] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [hasNewTip, setHasNewTip] = useState(true);
  const [isWaving, setIsWaving] = useState(false);
  const [unlockGreeting, setUnlockGreeting] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const previousMascotIdRef = useRef<MascotId | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const activeMascot = useMemo<MascotTier>(() => {
    return MASCOT_TIERS[0];
  }, []);

  // Reset message rotation when the active mascot changes.
  useEffect(() => {
    setMsgIdx(0);
    setLiked(false);
  }, [activeMascot.id]);

  // One-time unlock celebration for newly reached tiers.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storageKey = `mascot-unlock:${activeMascot.id}`;
    const firstAppearance = previousMascotIdRef.current !== activeMascot.id;
    previousMascotIdRef.current = activeMascot.id;

    if (
      activeMascot.unlockLevel > 1 &&
      firstAppearance &&
      !window.localStorage.getItem(storageKey)
    ) {
      window.localStorage.setItem(storageKey, "seen");
      setUnlockGreeting(activeMascot.unlockMessage);
      setHasNewTip(true);
      setOpen(true);
      // Friendly celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          startVelocity: 38,
          origin: { x: 0.85, y: 0.85 },
          colors: ["#a78bfa", "#fbbf24", "#f472b6", "#34d399", "#60a5fa"],
        });
      } catch {
        /* confetti is best-effort */
      }
    }
  }, [activeMascot]);

  // Periodic "wave" attention burst + notification dot when idle.
  useEffect(() => {
    if (open) return;
    const interval = window.setInterval(() => {
      setIsWaving(true);
      setHasNewTip(true);
      window.setTimeout(() => setIsWaving(false), 1800);
    }, 25_000);
    return () => window.clearInterval(interval);
  }, [open]);

  // Dismiss on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        !cardRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openCard = useCallback(() => {
    setOpen(true);
    setHasNewTip(false);
    setIsWaving(false);
    setLiked(false);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([10, 18, 10]);
    }
  }, []);

  const nextTip = useCallback(() => {
    setUnlockGreeting(null);
    setLiked(false);
    setMsgIdx((prev) => (prev + 1) % activeMascot.messages.length);
  }, [activeMascot.messages.length]);

  const handleLike = useCallback(() => {
    setLiked(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }
  }, []);

  const bubbleMessage =
    unlockGreeting ?? activeMascot.messages[msgIdx % activeMascot.messages.length];

  return (
    <>
      <style>{`
        @keyframes owl-mascot-idle {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-7px) rotate(1deg); }
        }
        @keyframes owl-mascot-wave {
          0%   { transform: translateY(0) rotate(0deg) scale(1); }
          15%  { transform: translateY(-18px) rotate(-8deg) scale(1.06); }
          30%  { transform: translateY(-2px) rotate(6deg) scale(1.02); }
          45%  { transform: translateY(-22px) rotate(-6deg) scale(1.08); }
          60%  { transform: translateY(-2px) rotate(4deg) scale(1.02); }
          80%  { transform: translateY(-10px) rotate(-2deg) scale(1.04); }
          100% { transform: translateY(0) rotate(0deg) scale(1); }
        }
        @keyframes owl-ring-pulse {
          0%, 100% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.12); opacity: 0.9; }
        }
        @keyframes owl-ring-attention {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes owl-dot-bob {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.95; }
          50% { transform: translateY(-3px) scale(1.12); opacity: 1; }
        }
        @keyframes owl-card-in {
          0% { transform: translate3d(0, 14px, 0) scale(0.94); opacity: 0; }
          100% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
        }
        @keyframes owl-heart-burst {
          0% { transform: scale(0.4); opacity: 0; }
          40% { transform: scale(1.4); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Card / speech bubble */}
      {open && (
        <div
          ref={cardRef}
          role="dialog"
          aria-label={`${activeMascot.name} 對話`}
          className="fixed bottom-[148px] right-3 z-50 w-[300px] sm:w-[340px] rounded-3xl bg-white shadow-[0_24px_50px_rgba(15,23,42,0.22)]"
          style={{
            border: `3px solid ${activeMascot.bubbleBorder}`,
            animation: "owl-card-in 220ms cubic-bezier(0.22, 1, 0.36, 1) both",
            transformOrigin: "bottom right",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 rounded-t-3xl px-4 py-3"
            style={{
              background: `linear-gradient(135deg, ${activeMascot.bubbleBorder}55, #ffffff)`,
            }}
          >
            <div
              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white"
              style={{ border: `2px solid ${activeMascot.bubbleBorder}` }}
            >
              {activeMascot.render(46)}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-base font-black leading-tight"
                style={{ color: activeMascot.bubbleText }}
              >
                {activeMascot.name}
              </p>
              <p className="text-xs font-bold leading-tight text-slate-500">
                {activeMascot.role} · Lv.{Math.max(level, activeMascot.unlockLevel)}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="關閉"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Message */}
          <div className="px-4 pb-3 pt-2">
            <p
              key={bubbleMessage}
              className="text-base font-black leading-snug text-slate-800"
              style={{ animation: "owl-card-in 280ms ease both" }}
            >
              {bubbleMessage}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2.5">
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition active:scale-95"
              style={{
                background: liked ? `${activeMascot.bubbleBorder}` : "#f1f5f9",
                color: liked ? activeMascot.bubbleText : "#475569",
              }}
              aria-label="鍾意呢個提示"
            >
              {liked ? (
                <span
                  className="inline-block"
                  style={{ animation: "owl-heart-burst 360ms ease both" }}
                >
                  💖
                </span>
              ) : (
                <ThumbsUp className="h-4 w-4" />
              )}
              <span>{liked ? "多謝你！" : "鍾意"}</span>
            </button>
            <button
              onClick={nextTip}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-black text-white transition active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${activeMascot.bubbleText}, ${activeMascot.bubbleBorder})`,
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>下一個提示</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Pointer tail */}
          <div
            className="absolute -bottom-2.5 right-9 h-4 w-4 rotate-45 bg-white"
            style={{
              borderRight: `3px solid ${activeMascot.bubbleBorder}`,
              borderBottom: `3px solid ${activeMascot.bubbleBorder}`,
            }}
          />
        </div>
      )}

      {/* Mascot button */}
      <button
        ref={buttonRef}
        onClick={openCard}
        aria-label={`同 ${activeMascot.name} 傾偈`}
        aria-expanded={open}
        className="fixed bottom-28 right-3 z-40 flex h-24 w-24 items-center justify-center"
        style={{ outline: "none" }}
      >
        {/* Notification dot */}
        {hasNewTip && !open && (
          <span
            aria-hidden
            className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[10px] font-black text-white shadow-md"
            style={{
              background: activeMascot.dot,
              animation: "owl-dot-bob 1.4s ease-in-out infinite",
            }}
          >
            !
          </span>
        )}
        {/* The mascot itself */}
        <span
          className="relative flex items-center justify-center"
          style={{
            animation: isWaving
              ? "owl-mascot-wave 1.8s ease-in-out"
              : "owl-mascot-idle 3.2s ease-in-out infinite",
            transformOrigin: "50% 80%",
            filter: "drop-shadow(0 14px 24px rgba(15, 23, 42, 0.24))",
          }}
        >
          {activeMascot.render(88)}
        </span>
      </button>
    </>
  );
}
