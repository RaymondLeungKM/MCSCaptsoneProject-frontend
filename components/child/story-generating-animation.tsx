"use client";

/**
 * StoryGeneratingAnimation
 * A ~60-second cinematic "mini-movie" shown while a new story is being generated.
 * Designed to keep young children entertained while they wait:
 *   - 6 hand-crafted chapters of ~10s each that auto-advance and loop
 *   - Each chapter is a full painterly scene with animated cartoon actors
 *   - Big captions, chapter titles, and a friendly progress meter
 *   - All-CSS animation (no media files required); respects prefers-reduced-motion
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartoonCat,
  CartoonDog,
  CartoonKeyframes,
  CartoonOwl,
} from "./cartoon-characters";
import { cn } from "@/lib/utils";

const CHAPTER_DURATION_MS = 10_000;

type ActorId = "owl" | "dog" | "cat";

interface ActorSpec {
  id: ActorId;
  size: number;
  /** Tailwind absolute-positioning classes */
  position: string;
  /** Optional inline transform/animation for this scene */
  style?: React.CSSProperties;
}

interface Chapter {
  id: string;
  title: string;
  caption: string;
  /** Background gradient (CSS `background` value). */
  background: string;
  /** Foreground decorations (suns, stars, leaves...) drawn before actors. */
  decor: React.ReactNode;
  /** Animated actors for this scene. */
  actors: ActorSpec[];
}

function Sun({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      data-mm-motion="true"
      className={cn(
        "pointer-events-none absolute rounded-full bg-yellow-300",
        className,
      )}
      style={{
        boxShadow: "0 0 60px 20px rgba(253, 224, 71, 0.55)",
        animation: "mm-sun-pulse 5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

function Moon({ className }: { className?: string }) {
  return (
    <div
      data-mm-motion="true"
      className={cn(
        "pointer-events-none absolute h-20 w-20 rounded-full bg-slate-100",
        className,
      )}
      style={{
        boxShadow: "0 0 50px 14px rgba(226, 232, 240, 0.5)",
        animation: "mm-sun-pulse 6s ease-in-out infinite",
      }}
    />
  );
}

function Cloud({
  top,
  left,
  scale = 1,
  duration = "28s",
  delay = "0s",
}: {
  top: string;
  left: string;
  scale?: number;
  duration?: string;
  delay?: string;
}) {
  return (
    <div
      data-mm-motion="true"
      className="pointer-events-none absolute"
      style={{
        top,
        left,
        transform: `scale(${scale})`,
        animation: `mm-cloud-drift ${duration} linear ${delay} infinite`,
      }}
    >
      <div className="relative h-12 w-28">
        <div className="absolute bottom-0 left-2 h-9 w-16 rounded-full bg-white/90" />
        <div className="absolute bottom-2 left-0 h-7 w-12 rounded-full bg-white/90" />
        <div className="absolute bottom-2 right-0 h-8 w-14 rounded-full bg-white/90" />
        <div className="absolute bottom-5 left-6 h-7 w-14 rounded-full bg-white" />
      </div>
    </div>
  );
}

function Tree({
  className,
  trunk = "#7c3a0c",
  canopy = "#16a34a",
}: {
  className?: string;
  trunk?: string;
  canopy?: string;
}) {
  return (
    <div className={cn("pointer-events-none absolute", className)}>
      <div
        data-mm-motion="true"
        className="relative"
        style={{ animation: "mm-tree-sway 4.6s ease-in-out infinite", transformOrigin: "50% 100%" }}
      >
        <div
          className="absolute left-1/2 bottom-0 h-12 w-4 -translate-x-1/2 rounded-md"
          style={{ background: trunk }}
        />
        <div className="relative">
          <div
            className="h-20 w-24 rounded-full"
            style={{ background: canopy, boxShadow: "inset -6px -8px 0 rgba(0,0,0,0.12)" }}
          />
          <div
            className="absolute -top-6 left-3 h-16 w-16 rounded-full"
            style={{ background: canopy, boxShadow: "inset -4px -6px 0 rgba(0,0,0,0.12)" }}
          />
          <div
            className="absolute -top-4 right-2 h-14 w-14 rounded-full"
            style={{ background: canopy, boxShadow: "inset -4px -6px 0 rgba(0,0,0,0.12)" }}
          />
        </div>
      </div>
    </div>
  );
}

function Star({
  top,
  left,
  size = 10,
  delay = "0s",
}: {
  top: string;
  left: string;
  size?: number;
  delay?: string;
}) {
  return (
    <span
      data-mm-motion="true"
      className="pointer-events-none absolute text-yellow-200"
      style={{
        top,
        left,
        fontSize: size,
        animation: `mm-twinkle 2.4s ease-in-out ${delay} infinite`,
      }}
    >
      ✦
    </span>
  );
}

function Hill({
  className,
  color = "#16a34a",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute rounded-[50%]",
        className,
      )}
      style={{ background: color }}
    />
  );
}

function BookOpen({ className }: { className?: string }) {
  return (
    <div
      data-mm-motion="true"
      className={cn("pointer-events-none absolute", className)}
      style={{ animation: "mm-book-float 3.2s ease-in-out infinite" }}
    >
      <div className="relative h-32 w-44">
        <div
          className="absolute inset-0 rounded-md bg-amber-100"
          style={{
            boxShadow:
              "0 14px 30px rgba(120, 53, 15, 0.35), inset 0 -6px 0 rgba(180, 83, 9, 0.25)",
          }}
        />
        <div className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-amber-700/40" />
        <div className="absolute left-2 top-2 right-1/2 mr-1 space-y-1.5">
          <div className="h-1.5 w-full rounded bg-amber-700/30" />
          <div className="h-1.5 w-3/4 rounded bg-amber-700/30" />
          <div className="h-1.5 w-5/6 rounded bg-amber-700/30" />
          <div className="h-1.5 w-2/3 rounded bg-amber-700/30" />
        </div>
        <div className="absolute right-2 top-2 left-1/2 ml-1 space-y-1.5">
          <div className="h-1.5 w-5/6 rounded bg-amber-700/30" />
          <div className="h-1.5 w-full rounded bg-amber-700/30" />
          <div className="h-1.5 w-2/3 rounded bg-amber-700/30" />
          <div className="h-1.5 w-3/4 rounded bg-amber-700/30" />
        </div>
        <span
          data-mm-motion="true"
          className="absolute -top-3 left-3 text-2xl"
          style={{ animation: "mm-sparkle 1.8s ease-in-out infinite" }}
        >
          ✨
        </span>
        <span
          data-mm-motion="true"
          className="absolute -top-1 right-2 text-xl"
          style={{ animation: "mm-sparkle 1.8s ease-in-out 0.4s infinite" }}
        >
          ⭐
        </span>
      </div>
    </div>
  );
}

function ScrollMap({ className }: { className?: string }) {
  return (
    <div
      data-mm-motion="true"
      className={cn("pointer-events-none absolute", className)}
      style={{ animation: "mm-map-tilt 3.4s ease-in-out infinite" }}
    >
      <div className="relative h-24 w-36 rounded-md bg-amber-50 shadow-[0_10px_24px_rgba(120,53,15,0.35)]">
        <div className="absolute inset-2 rounded-sm border-2 border-dashed border-amber-700/60" />
        <span className="absolute left-3 top-3 text-lg">🏰</span>
        <span className="absolute right-3 bottom-3 text-lg">⛰️</span>
        <span className="absolute right-4 top-4 text-base">⭐</span>
        <span
          className="absolute left-4 bottom-4 text-base"
          data-mm-motion="true"
          style={{ animation: "mm-sparkle 1.6s ease-in-out infinite" }}
        >
          ✨
        </span>
      </div>
    </div>
  );
}

function TrainCar({ className }: { className?: string }) {
  return (
    <div
      data-mm-motion="true"
      className={cn("pointer-events-none absolute", className)}
      style={{ animation: "mm-train-roll 7.5s linear infinite" }}
    >
      <div className="relative h-24 w-44">
        <div
          data-mm-motion="true"
          className="absolute -top-2 left-6 h-3 w-3 rounded-full bg-white/80"
          style={{ animation: "mm-steam 1.6s ease-out infinite" }}
        />
        <div
          data-mm-motion="true"
          className="absolute -top-4 left-9 h-4 w-4 rounded-full bg-white/70"
          style={{ animation: "mm-steam 1.6s ease-out 0.4s infinite" }}
        />
        <div className="absolute bottom-3 left-0 h-10 w-32 rounded-lg bg-rose-500 shadow-md" />
        <div className="absolute bottom-12 left-3 h-6 w-12 rounded-t-md bg-rose-600" />
        <div className="absolute bottom-3 left-32 h-10 w-12 rounded-r-lg bg-amber-300" />
        <div className="absolute bottom-0 left-2 h-4 w-4 rounded-full bg-slate-800" />
        <div className="absolute bottom-0 left-14 h-4 w-4 rounded-full bg-slate-800" />
        <div className="absolute bottom-0 left-26 h-4 w-4 rounded-full bg-slate-800" />
        <div className="absolute bottom-0 right-2 h-4 w-4 rounded-full bg-slate-800" />
      </div>
    </div>
  );
}

const CHAPTERS: Chapter[] = [
  {
    id: "dawn",
    title: "第一章 · 森林清晨",
    caption: "太陽公公起床啦，貓頭鷹老師準備出發收集故事！",
    background: "linear-gradient(180deg, #fde68a 0%, #fbbf24 35%, #fcd34d 60%, #65a30d 100%)",
    decor: (
      <>
        <Sun className="left-6 top-8 h-24 w-24" />
        <Cloud top="14%" left="55%" />
        <Cloud top="22%" left="20%" scale={0.85} duration="32s" delay="-8s" />
        <Hill className="-bottom-10 -left-6 h-44 w-72" color="#65a30d" />
        <Hill className="-bottom-12 right-0 h-40 w-80" color="#4d7c0f" />
        <Tree className="bottom-16 left-4 scale-90" />
        <Tree className="bottom-12 right-6 scale-110" canopy="#15803d" />
      </>
    ),
    actors: [
      {
        id: "owl",
        size: 160,
        position: "bottom-24 left-1/2 -translate-x-1/2",
        style: { animation: "mm-bob 2.2s ease-in-out infinite" },
      },
    ],
  },
  {
    id: "friends",
    title: "第二章 · 朋友集合",
    caption: "汪汪！小狗 Bingo 同小貓 Mimi 都嚟啦，一齊去探險！",
    background: "linear-gradient(180deg, #bae6fd 0%, #7dd3fc 40%, #86efac 100%)",
    decor: (
      <>
        <Sun className="right-8 top-10 h-20 w-20" />
        <Cloud top="10%" left="10%" />
        <Cloud top="18%" left="60%" scale={1.15} duration="34s" delay="-6s" />
        <Hill className="-bottom-12 -left-4 h-48 w-80" color="#4ade80" />
        <Hill className="-bottom-14 right-0 h-44 w-80" color="#22c55e" />
        <Tree className="bottom-14 left-2" canopy="#15803d" />
        <Tree className="bottom-10 right-2 scale-110" canopy="#166534" />
      </>
    ),
    actors: [
      {
        id: "dog",
        size: 130,
        position: "bottom-20 left-8",
        style: { animation: "mm-bob 1.8s ease-in-out infinite" },
      },
      {
        id: "owl",
        size: 140,
        position: "bottom-24 left-1/2 -translate-x-1/2",
        style: { animation: "mm-bob 2.1s ease-in-out 0.3s infinite" },
      },
      {
        id: "cat",
        size: 130,
        position: "bottom-20 right-8",
        style: { animation: "mm-bob 1.9s ease-in-out 0.6s infinite" },
      },
    ],
  },
  {
    id: "map",
    title: "第三章 · 神秘地圖",
    caption: "嘩！佢哋發現一張藏寶圖，今日嘅故事原來係冒險！",
    background: "linear-gradient(180deg, #fed7aa 0%, #fdba74 45%, #f97316 100%)",
    decor: (
      <>
        <Sun className="right-6 top-6 h-24 w-24" />
        <Cloud top="14%" left="8%" duration="30s" />
        <Hill className="-bottom-10 -left-6 h-44 w-72" color="#ca8a04" />
        <Hill className="-bottom-12 right-0 h-44 w-80" color="#a16207" />
        <ScrollMap className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      </>
    ),
    actors: [
      {
        id: "owl",
        size: 130,
        position: "top-1/2 left-6 -translate-y-1/2",
        style: { animation: "mm-lean-right 2.6s ease-in-out infinite" },
      },
      {
        id: "dog",
        size: 130,
        position: "top-1/2 right-6 -translate-y-1/2",
        style: { animation: "mm-lean-left 2.6s ease-in-out infinite" },
      },
    ],
  },
  {
    id: "train",
    title: "第四章 · 故事火車",
    caption: "嗚嗚嗚！故事火車經過彩虹隧道，向住下一頁出發！",
    background: "linear-gradient(180deg, #c4b5fd 0%, #a78bfa 35%, #f0abfc 65%, #fcd34d 100%)",
    decor: (
      <>
        <div
          data-mm-motion="true"
          className="pointer-events-none absolute inset-x-0 top-12 mx-auto h-32 w-72 rounded-[100%] border-[10px] border-transparent"
          style={{
            borderTopColor: "#f43f5e",
            borderImage:
              "linear-gradient(90deg, #f43f5e, #f97316, #facc15, #4ade80, #38bdf8, #a78bfa) 1",
            animation: "mm-sun-pulse 4s ease-in-out infinite",
          }}
        />
        <Cloud top="10%" left="6%" duration="28s" />
        <Cloud top="14%" left="65%" scale={0.9} delay="-4s" />
        <Hill className="-bottom-8 -left-6 h-36 w-72" color="#7c3aed" />
        <Hill className="-bottom-12 right-0 h-44 w-80" color="#5b21b6" />
        <div className="absolute inset-x-0 bottom-10 h-1.5 bg-amber-900/40" />
        <div className="absolute inset-x-0 bottom-12 grid grid-cols-12 gap-0">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="h-3 bg-amber-800/60" />
          ))}
        </div>
        <TrainCar className="bottom-14 left-0" />
      </>
    ),
    actors: [
      {
        id: "owl",
        size: 90,
        position: "bottom-28 left-[28%]",
        style: { animation: "mm-bob 2.2s ease-in-out infinite" },
      },
      {
        id: "cat",
        size: 80,
        position: "bottom-28 left-[40%]",
        style: { animation: "mm-bob 2.4s ease-in-out 0.4s infinite" },
      },
    ],
  },
  {
    id: "stars",
    title: "第五章 · 星空奇遇",
    caption: "夜空下，奇妙嘅故事生物喺度等緊我哋一齊登場。",
    background: "linear-gradient(180deg, #1e1b4b 0%, #4338ca 45%, #7c3aed 80%, #312e81 100%)",
    decor: (
      <>
        <Moon className="right-10 top-10" />
        {Array.from({ length: 22 }).map((_, i) => (
          <Star
            key={i}
            top={`${5 + ((i * 17) % 55)}%`}
            left={`${(i * 47) % 100}%`}
            size={10 + (i % 4) * 4}
            delay={`${(i % 7) * 0.25}s`}
          />
        ))}
        <Hill className="-bottom-12 -left-6 h-40 w-72" color="#312e81" />
        <Hill className="-bottom-14 right-0 h-44 w-80" color="#1e1b4b" />
      </>
    ),
    actors: [
      {
        id: "cat",
        size: 140,
        position: "bottom-20 left-10",
        style: { animation: "mm-bob 2.4s ease-in-out infinite" },
      },
      {
        id: "owl",
        size: 160,
        position: "bottom-28 left-1/2 -translate-x-1/2",
        style: { animation: "mm-fly 4s ease-in-out infinite" },
      },
      {
        id: "dog",
        size: 140,
        position: "bottom-20 right-10",
        style: { animation: "mm-bob 2.2s ease-in-out 0.5s infinite" },
      },
    ],
  },
  {
    id: "book",
    title: "第六章 · 故事登場",
    caption: "鈴鈴！故事準備好啦，揭開書頁就會開始囉！",
    background: "linear-gradient(180deg, #fef3c7 0%, #fde68a 45%, #fbbf24 100%)",
    decor: (
      <>
        <Sun className="left-1/2 top-4 h-28 w-28 -translate-x-1/2" />
        {Array.from({ length: 14 }).map((_, i) => (
          <Star
            key={i}
            top={`${10 + ((i * 13) % 60)}%`}
            left={`${(i * 53) % 100}%`}
            size={12 + (i % 3) * 4}
            delay={`${(i % 5) * 0.2}s`}
          />
        ))}
        <BookOpen className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      </>
    ),
    actors: [
      {
        id: "owl",
        size: 110,
        position: "bottom-12 left-6",
        style: { animation: "mm-fly 3.4s ease-in-out infinite" },
      },
      {
        id: "dog",
        size: 110,
        position: "bottom-12 right-6",
        style: { animation: "mm-bob 2s ease-in-out 0.3s infinite" },
      },
    ],
  },
];

interface ChapterShortMeta {
  emoji: string;
  sticker: string;
  cue: string;
  detail: string;
  badgeBackground: string;
  cameraAnimation: string;
}

const CHAPTER_SHORT_META: Record<string, ChapterShortMeta> = {
  dawn: {
    emoji: "🌞",
    sticker: "晨光開場",
    cue: "貓頭鷹老師起飛收集今日故事靈感。",
    detail: "開場畫面生成中",
    badgeBackground: "linear-gradient(135deg, #facc15, #fb7185)",
    cameraAnimation: "mm-camera-drift-a 10s ease-in-out both",
  },
  friends: {
    emoji: "🎉",
    sticker: "朋友集合",
    cue: "Bingo 同 Mimi 衝入鏡頭，一齊陪你等故事。",
    detail: "角色入場中",
    badgeBackground: "linear-gradient(135deg, #38bdf8, #22c55e)",
    cameraAnimation: "mm-camera-drift-b 10s ease-in-out both",
  },
  map: {
    emoji: "🗺️",
    sticker: "冒險提示",
    cue: "地圖放大，故事主線同關鍵詞開始拼接。",
    detail: "情節路線編排中",
    badgeBackground: "linear-gradient(135deg, #fb923c, #f97316)",
    cameraAnimation: "mm-camera-drift-c 10s ease-in-out both",
  },
  train: {
    emoji: "🚂",
    sticker: "高速過場",
    cue: "故事火車穿過彩虹，將畫面推向下一幕。",
    detail: "轉場鏡頭渲染中",
    badgeBackground: "linear-gradient(135deg, #a78bfa, #f472b6)",
    cameraAnimation: "mm-camera-drift-d 10s ease-in-out both",
  },
  stars: {
    emoji: "🌙",
    sticker: "夜空高潮",
    cue: "星空場景鋪開，奇妙角色準備登場。",
    detail: "高潮情緒上色中",
    badgeBackground: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    cameraAnimation: "mm-camera-drift-e 10s ease-in-out both",
  },
  book: {
    emoji: "📖",
    sticker: "即將揭曉",
    cue: "書頁打開，完整故事快要送到你面前。",
    detail: "最後整理中",
    badgeBackground: "linear-gradient(135deg, #f59e0b, #f97316)",
    cameraAnimation: "mm-camera-drift-f 10s ease-in-out both",
  },
};

function ActorSprite({ actor }: { actor: ActorSpec }) {
  if (actor.id === "owl") return <CartoonOwl size={actor.size} animate="scene" />;
  if (actor.id === "dog") return <CartoonDog size={actor.size} animate="scene" />;
  return <CartoonCat size={actor.size} animate="scene" />;
}

interface StoryGeneratingAnimationProps {
  isVisible: boolean;
}

export function StoryGeneratingAnimation({ isVisible }: StoryGeneratingAnimationProps) {
  const [chapterIdx, setChapterIdx] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    setChapterIdx(0);
    setElapsedMs(0);
    startRef.current = performance.now();

    const tick = (now: number) => {
      if (startRef.current == null) return;
      const elapsed = now - startRef.current;
      setElapsedMs(elapsed);
      const idx =
        Math.floor(elapsed / CHAPTER_DURATION_MS) % CHAPTERS.length;
      setChapterIdx(idx);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [isVisible]);

  const totalMs = CHAPTERS.length * CHAPTER_DURATION_MS;
  const progress = useMemo(() => {
    if (!isVisible) return 0;
    return Math.min(100, ((elapsedMs % totalMs) / totalMs) * 100);
  }, [elapsedMs, totalMs, isVisible]);

  if (!isVisible) return null;

  const chapter = CHAPTERS[chapterIdx] ?? CHAPTERS[0];
  const chapterNumber = chapterIdx + 1;
  const chapterMeta = CHAPTER_SHORT_META[chapter.id] ?? CHAPTER_SHORT_META.dawn;
  const loopedElapsedMs = elapsedMs % totalMs;
  const chapterElapsedMs = loopedElapsedMs % CHAPTER_DURATION_MS;
  const chapterProgress = Math.min(100, (chapterElapsedMs / CHAPTER_DURATION_MS) * 100);
  const remainingTotalSeconds = Math.max(1, Math.ceil((totalMs - loopedElapsedMs) / 1000));
  const elapsedSeconds = Math.min(60, Math.floor(loopedElapsedMs / 1000));

  return (
    <div
      className="fixed inset-0 z-[120] overflow-hidden"
      aria-live="polite"
      aria-busy="true"
      aria-label="故事製作中"
    >
      <CartoonKeyframes />
      <style>{`
        @keyframes mm-sun-pulse {
          0%, 100% { transform: scale(1); opacity: 0.96; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes mm-cloud-drift {
          0%   { transform: translate3d(-30px, 0, 0); }
          50%  { transform: translate3d(40px, -6px, 0); }
          100% { transform: translate3d(-30px, 0, 0); }
        }
        @keyframes mm-tree-sway {
          0%, 100% { transform: rotate(-2.5deg); }
          50% { transform: rotate(2.5deg); }
        }
        @keyframes mm-bob {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-14px) rotate(2deg); }
        }
        @keyframes mm-fly {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-26px) rotate(4deg); }
        }
        @keyframes mm-lean-left {
          0%, 100% { transform: translateY(-50%) rotate(0deg); }
          50% { transform: translateY(-52%) rotate(-6deg); }
        }
        @keyframes mm-lean-right {
          0%, 100% { transform: translateY(-50%) rotate(0deg); }
          50% { transform: translateY(-52%) rotate(6deg); }
        }
        @keyframes mm-sparkle {
          0%, 100% { transform: scale(0.85) rotate(0deg); opacity: 0.65; }
          50% { transform: scale(1.25) rotate(20deg); opacity: 1; }
        }
        @keyframes mm-twinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes mm-book-float {
          0%, 100% { transform: translate(-50%, -50%) rotate(-2deg); }
          50% { transform: translate(-50%, -54%) rotate(2deg); }
        }
        @keyframes mm-map-tilt {
          0%, 100% { transform: translate(-50%, -50%) rotate(-4deg); }
          50% { transform: translate(-50%, -52%) rotate(4deg); }
        }
        @keyframes mm-train-roll {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(120%); }
        }
        @keyframes mm-steam {
          0% { transform: translate3d(0, 0, 0) scale(0.6); opacity: 0; }
          25% { opacity: 0.7; }
          100% { transform: translate3d(-18px, -28px, 0) scale(1.5); opacity: 0; }
        }
        @keyframes mm-scene-in {
          0% { opacity: 0; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes mm-caption-in {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes mm-progress-shine {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes mm-camera-drift-a {
          0% { transform: scale(1.02) translate3d(0, 0, 0); }
          50% { transform: scale(1.08) translate3d(0, -20px, 0); }
          100% { transform: scale(1.04) translate3d(0, -8px, 0); }
        }
        @keyframes mm-camera-drift-b {
          0% { transform: scale(1.04) translate3d(-10px, 0, 0); }
          50% { transform: scale(1.1) translate3d(12px, -12px, 0); }
          100% { transform: scale(1.06) translate3d(0, -6px, 0); }
        }
        @keyframes mm-camera-drift-c {
          0% { transform: scale(1.02) translate3d(0, 6px, 0); }
          50% { transform: scale(1.09) translate3d(0, -10px, 0); }
          100% { transform: scale(1.05) translate3d(-6px, -4px, 0); }
        }
        @keyframes mm-camera-drift-d {
          0% { transform: scale(1.03) translate3d(-14px, 0, 0); }
          50% { transform: scale(1.1) translate3d(8px, -10px, 0); }
          100% { transform: scale(1.06) translate3d(0, -4px, 0); }
        }
        @keyframes mm-camera-drift-e {
          0% { transform: scale(1.01) translate3d(0, 0, 0); }
          50% { transform: scale(1.08) translate3d(0, -16px, 0); }
          100% { transform: scale(1.05) translate3d(6px, -8px, 0); }
        }
        @keyframes mm-camera-drift-f {
          0% { transform: scale(1.02) translate3d(0, 0, 0); }
          50% { transform: scale(1.1) translate3d(0, -18px, 0); }
          100% { transform: scale(1.06) translate3d(0, -8px, 0); }
        }
        @keyframes mm-chip-in {
          0% { opacity: 0; transform: translate3d(0, 12px, 0) scale(0.92); }
          100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes mm-frame-glow {
          0%, 100% { box-shadow: 0 28px 80px rgba(15, 23, 42, 0.36), 0 0 0 rgba(255,255,255,0); }
          50% { box-shadow: 0 34px 90px rgba(15, 23, 42, 0.42), 0 0 32px rgba(255,255,255,0.22); }
        }
        @keyframes mm-orb-float {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(0, -18px, 0) scale(1.08); }
        }
        @keyframes mm-pill-pulse {
          0%, 100% { transform: scale(1); opacity: 0.92; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-mm-motion="true"] { animation: none !important; }
        }
      `}</style>

      <div className="absolute inset-0" style={{ background: chapter.background }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_46%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(15,23,42,0.1))]" />
      <div
        data-mm-motion="true"
        className="pointer-events-none absolute -left-10 top-16 h-56 w-56 rounded-full bg-white/20 blur-3xl"
        style={{ animation: "mm-orb-float 6.8s ease-in-out infinite" }}
      />
      <div
        data-mm-motion="true"
        className="pointer-events-none absolute -right-10 bottom-20 h-72 w-72 rounded-full bg-fuchsia-300/20 blur-3xl"
        style={{ animation: "mm-orb-float 8s ease-in-out infinite reverse" }}
      />
      <div
        data-mm-motion="true"
        className="pointer-events-none absolute left-[10%] top-[18%] h-16 w-16 rounded-full bg-white/18 blur-xl"
        style={{ animation: "mm-orb-float 5.5s ease-in-out infinite" }}
      />
      <div
        data-mm-motion="true"
        className="pointer-events-none absolute right-[12%] top-[38%] h-20 w-20 rounded-full bg-cyan-200/20 blur-xl"
        style={{ animation: "mm-orb-float 7.1s ease-in-out infinite reverse" }}
      />

      <div className="relative flex h-full items-center justify-center px-4 py-4 sm:px-8">
        <div className="relative h-[78vh] max-h-[820px] w-full max-w-[430px]">
          <div className="absolute inset-0 rounded-[42px] bg-slate-950/35 blur-2xl scale-[0.96]" />

          <div
            data-mm-motion="true"
            className="relative h-full overflow-hidden rounded-[42px] border-[6px] border-white/85 bg-white/12 shadow-[0_30px_90px_rgba(15,23,42,0.38)]"
            style={{ animation: "mm-frame-glow 5.4s ease-in-out infinite" }}
          >
            <div
              key={chapter.id}
              data-mm-motion="true"
              className="absolute inset-0 origin-center"
              style={{
                background: chapter.background,
                animation: `mm-scene-in 0.7s ease both, ${chapterMeta.cameraAnimation}`,
              }}
            >
              {chapter.decor}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.5),transparent_38%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(17,24,39,0.06)_48%,rgba(17,24,39,0.2)_100%)]" />

              {chapter.actors.map((actor, i) => (
                <div
                  key={`${chapter.id}-${actor.id}-${i}`}
                  className={cn("absolute", actor.position)}
                  style={actor.style}
                >
                  <ActorSprite actor={actor} />
                </div>
              ))}

              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_54%,rgba(0,0,0,0.2)_100%)]" />
            </div>

            <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
              <div className="rounded-full bg-black/32 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-white backdrop-blur-sm">
                <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-rose-400 align-middle animate-pulse" />
                Story Reel
              </div>
              <div className="rounded-full bg-white/88 px-3 py-1.5 text-xs font-black text-violet-700 shadow-md">
                {elapsedSeconds}s / 60s
              </div>
            </div>

            <div className="absolute left-4 top-20 flex flex-col items-center gap-2 rounded-full bg-black/18 px-2 py-3 backdrop-blur-sm">
              <span className="text-xl">{chapterMeta.emoji}</span>
              {CHAPTERS.map((item, index) => {
                const isActive = index === chapterIdx;
                const isComplete = index < chapterIdx;

                return (
                  <span
                    key={item.id}
                    className={cn(
                      "block h-2.5 w-2.5 rounded-full transition-all duration-300",
                      isActive
                        ? "h-8 bg-white shadow-[0_0_14px_rgba(255,255,255,0.85)]"
                        : isComplete
                          ? "bg-white/85"
                          : "bg-white/35",
                    )}
                  />
                );
              })}
            </div>

            <div className="absolute right-4 top-20 left-16 flex justify-end">
              <div
                key={`${chapter.id}-sticker`}
                data-mm-motion="true"
                className="max-w-[54%] rounded-[24px] border border-white/80 bg-white/88 px-4 py-3 shadow-[0_14px_38px_rgba(15,23,42,0.16)]"
                style={{ animation: "mm-chip-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-500">
                  Reel Moment
                </p>
                <p className="mt-1 text-sm font-black leading-tight text-slate-800">
                  {chapterMeta.sticker}
                </p>
              </div>
            </div>

            <div className="absolute inset-x-0 top-[5.8rem] flex justify-center px-4">
              <div
                data-mm-motion="true"
                className="rounded-full border border-white/70 bg-white/20 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white backdrop-blur-sm"
                style={{ animation: "mm-pill-pulse 3.2s ease-in-out infinite" }}
              >
                9:16 Story Short Mode
              </div>
            </div>

            <div className="absolute inset-x-4 bottom-24">
              <div
                key={`${chapter.id}-text`}
                data-mm-motion="true"
                className="rounded-[28px] border-4 border-white/85 bg-white/92 p-4 shadow-[0_20px_55px_rgba(15,23,42,0.26)] backdrop-blur-md"
                style={{ animation: "mm-caption-in 0.55s cubic-bezier(0.34,1.56,0.64,1) both" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-md"
                    style={{ background: chapterMeta.badgeBackground }}
                  >
                    {chapterMeta.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-500">
                      {chapter.title}
                    </p>
                    <p className="mt-1 text-xl font-black leading-snug text-slate-800">
                      {chapter.caption}
                    </p>
                    <p className="mt-2 text-sm font-bold leading-relaxed text-slate-500">
                      {chapterMeta.cue}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute inset-x-4 bottom-4">
              <div className="rounded-[24px] border border-white/45 bg-black/22 px-4 py-3 text-white shadow-[0_12px_24px_rgba(15,23,42,0.2)] backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/70">
                      生成狀態
                    </p>
                    <p className="mt-1 text-sm font-black text-white">
                      {chapterMeta.detail}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                      剩餘時間
                    </p>
                    <p className="mt-1 text-lg font-black text-white">
                      {remainingTotalSeconds}s
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/20 shadow-inner">
                  <div
                    className="h-full rounded-full transition-[width] duration-200 ease-linear"
                    style={{
                      width: `${progress}%`,
                      background:
                        "linear-gradient(90deg, #f97316, #facc15, #84cc16, #38bdf8, #a78bfa, #f472b6)",
                      backgroundSize: "200% 100%",
                      animation: "mm-progress-shine 3s linear infinite",
                    }}
                  />
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white/80 transition-[width] duration-200 ease-linear"
                    style={{ width: `${chapterProgress}%` }}
                  />
                </div>

                <div className="mt-3 grid grid-cols-6 gap-1.5">
                  {CHAPTERS.map((item, index) => (
                    <span
                      key={item.id}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        index === chapterIdx
                          ? "bg-white"
                          : index < chapterIdx
                            ? "bg-white/75"
                            : "bg-white/20",
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
