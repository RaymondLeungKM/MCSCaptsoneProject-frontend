"use client";

import Lottie from "lottie-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  CartoonDog,
  CartoonKeyframes,
  CartoonOwl,
} from "./cartoon-characters";
import { cn } from "@/lib/utils";

const MASTER_LOOP_MS = 90_000;

const ZOO_MESSAGES = [
  "故事動物園開門啦，動物朋友排好隊等你！",
  "小火車正送緊靈感入站，故事慢慢成形中。",
  "飼養員幫你收集今日嘅詞語，準備放入故事！",
  "獅子、長頸鹿同大象一齊排演精彩場面。",
  "再等一陣，動物園探險故事就會送到你面前。",
  "最後整理中，等埋呢一站就可以出發啦！",
] as const;

const ZOO_STAGES = [
  { label: "開園中", emoji: "🎪" },
  { label: "招呼動物", emoji: "🦒" },
  { label: "砌故事", emoji: "📚" },
] as const;

const ZOO_ENCLOSURES = [
  {
    id: "lion",
    emoji: "🦁",
    title: "獅子山谷",
    subtitle: "排緊最威風嘅出場",
    gradient: "from-amber-100 via-yellow-50 to-orange-100",
    border: "border-orange-300",
    accent: "text-orange-700",
    badge: "bg-orange-500",
    emojiDelay: "0s",
  },
  {
    id: "elephant",
    emoji: "🐘",
    title: "大象樂園",
    subtitle: "用鼻哥運送新點子",
    gradient: "from-sky-100 via-cyan-50 to-blue-100",
    border: "border-sky-300",
    accent: "text-sky-700",
    badge: "bg-sky-500",
    emojiDelay: "0.5s",
  },
  {
    id: "giraffe",
    emoji: "🦒",
    title: "長頸鹿高塔",
    subtitle: "伸高頸望住下一頁",
    gradient: "from-yellow-100 via-amber-50 to-lime-100",
    border: "border-amber-300",
    accent: "text-amber-700",
    badge: "bg-amber-500",
    emojiDelay: "1s",
  },
  {
    id: "monkey",
    emoji: "🐵",
    title: "森林遊樂場",
    subtitle: "跳上跳落搵緊結尾",
    gradient: "from-emerald-100 via-lime-50 to-teal-100",
    border: "border-emerald-300",
    accent: "text-emerald-700",
    badge: "bg-emerald-500",
    emojiDelay: "1.5s",
  },
] as const;

const CLOUDS = [
  { top: "6%", left: "-10%", size: 92, duration: "28s", delay: "0s" },
  { top: "14%", left: "58%", size: 68, duration: "24s", delay: "-7s" },
  { top: "27%", left: "12%", size: 78, duration: "31s", delay: "-12s" },
] as const;

const PEN_SIGNS = ["🪵", "🌿", "🎈", "✨"] as const;

type LottieActorId = "dog" | "owl" | "tram";
type LottieAnimationData = Record<string, unknown>;
type LoadedLottieAnimations = Partial<Record<LottieActorId, LottieAnimationData>>;

interface CinematicActorConfig {
  actor: LottieActorId;
  className: string;
  width: number;
  height: number;
  speed?: number;
  style?: CSSProperties;
}

interface CinematicSceneConfig {
  id: string;
  badge: string;
  title: string;
  gradient: string;
  actors: readonly CinematicActorConfig[];
}

const LOTTIE_ASSET_PATHS: Record<LottieActorId, string> = {
  dog: "/animations/cute-dog.json",
  owl: "/animations/cute-owl.json",
  tram: "/animations/safari-tram.json",
};

const VIDEO_LOOP_SOURCES = [
  "/videos/zoo-background-loop.webm",
  "/videos/zoo-background-loop.mp4",
] as const;

const CINEMATIC_SCENES = [
  {
    id: "welcome-parade",
    badge: "故事巡遊",
    title: "動物朋友入場中",
    gradient: "from-cyan-100 via-white/80 to-emerald-100",
    actors: [
      { actor: "dog", className: "left-3 top-14", width: 132, height: 132 },
      { actor: "owl", className: "right-4 top-4", width: 108, height: 108 },
      {
        actor: "tram",
        className: "bottom-5 left-[-8%]",
        width: 176,
        height: 88,
        speed: 1,
        style: { animation: "zoo-tram-run 16s linear infinite" },
      },
    ],
  },
  {
    id: "owl-lookout",
    badge: "高塔觀察",
    title: "貓頭鷹睇緊下一頁",
    gradient: "from-sky-100 via-violet-50 to-emerald-100",
    actors: [
      { actor: "owl", className: "left-1/2 top-6 -translate-x-1/2", width: 148, height: 148, speed: 0.95 },
      { actor: "dog", className: "left-4 bottom-10", width: 112, height: 112, speed: 1.05 },
      {
        actor: "tram",
        className: "bottom-3 left-[-6%]",
        width: 154,
        height: 76,
        speed: 0.92,
        style: { animation: "zoo-tram-run 18s linear infinite" },
      },
    ],
  },
  {
    id: "dog-conductor",
    badge: "靈感收集",
    title: "小狗隊長搬運點子",
    gradient: "from-amber-100 via-orange-50 to-sky-100",
    actors: [
      { actor: "dog", className: "left-8 top-8", width: 152, height: 152, speed: 1.02 },
      { actor: "owl", className: "right-8 top-10", width: 96, height: 96, speed: 0.9 },
      {
        actor: "tram",
        className: "bottom-4 left-[-10%]",
        width: 188,
        height: 94,
        speed: 1.08,
        style: { animation: "zoo-tram-run 15s linear infinite" },
      },
    ],
  },
  {
    id: "tram-glide",
    badge: "園內列車",
    title: "小火車送故事入站",
    gradient: "from-emerald-100 via-teal-50 to-cyan-100",
    actors: [
      { actor: "owl", className: "right-5 top-6", width: 118, height: 118, speed: 1 },
      { actor: "dog", className: "left-5 bottom-10", width: 120, height: 120, speed: 0.98 },
      {
        actor: "tram",
        className: "bottom-1 left-[-12%]",
        width: 214,
        height: 102,
        speed: 1,
        style: { animation: "zoo-tram-run 14s linear infinite" },
      },
    ],
  },
  {
    id: "sunset-story",
    badge: "黃昏排演",
    title: "準備故事高潮",
    gradient: "from-yellow-100 via-rose-50 to-sky-100",
    actors: [
      { actor: "owl", className: "left-8 top-8", width: 104, height: 104, speed: 0.92 },
      { actor: "dog", className: "right-5 top-12", width: 138, height: 138, speed: 1.06 },
      {
        actor: "tram",
        className: "bottom-4 left-[-8%]",
        width: 170,
        height: 84,
        speed: 0.95,
        style: { animation: "zoo-tram-run 17s linear infinite" },
      },
    ],
  },
  {
    id: "grand-finale",
    badge: "最後整理",
    title: "故事即將出發",
    gradient: "from-cyan-100 via-white/80 to-lime-100",
    actors: [
      { actor: "dog", className: "left-6 top-8", width: 138, height: 138, speed: 1 },
      { actor: "owl", className: "right-6 top-6", width: 122, height: 122, speed: 1 },
      {
        actor: "tram",
        className: "bottom-4 left-[-9%]",
        width: 198,
        height: 96,
        speed: 1.1,
        style: { animation: "zoo-tram-run 14.5s linear infinite" },
      },
    ],
  },
] as const satisfies readonly CinematicSceneConfig[];

async function loadOptionalAnimationData(path: string): Promise<LottieAnimationData | null> {
  try {
    const response = await fetch(path, { cache: "force-cache" });
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as LottieAnimationData;
    return payload;
  } catch {
    return null;
  }
}

async function hasAvailableMedia(paths: readonly string[]): Promise<boolean> {
  for (const path of paths) {
    try {
      const response = await fetch(path, { method: "HEAD" });
      if (response.ok) {
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

function isLottieEntry(
  entry: readonly [LottieActorId, LottieAnimationData] | null
): entry is readonly [LottieActorId, LottieAnimationData] {
  return entry !== null;
}

function PulsingDots() {
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          data-zoo-motion="true"
          className="inline-block h-3.5 w-3.5 rounded-full bg-white/85"
          style={{
            animation: `zoo-dots-pulse 2.1s ease-in-out ${index * 0.24}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function FloatingCloud({
  top,
  left,
  size,
  duration,
  delay,
}: {
  top: string;
  left: string;
  size: number;
  duration: string;
  delay: string;
}) {
  return (
    <div
      data-zoo-motion="true"
      className="pointer-events-none absolute"
      style={{
        top,
        left,
        width: size,
        height: size * 0.52,
        animation: `zoo-cloud-drift ${duration} linear ${delay} infinite`,
      }}
    >
      <div className="absolute bottom-0 left-[12%] h-[58%] w-[62%] rounded-full bg-white/85 blur-[1px]" />
      <div className="absolute bottom-[20%] left-0 h-[52%] w-[42%] rounded-full bg-white/85" />
      <div className="absolute bottom-[24%] right-[8%] h-[48%] w-[42%] rounded-full bg-white/80" />
    </div>
  );
}

function SafariTram() {
  return (
    <div className="relative h-16 w-28">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          data-zoo-motion="true"
          className="absolute bottom-[2.7rem] left-1.5 h-3.5 w-3.5 rounded-full bg-white/65"
          style={{
            animation: `zoo-tram-puff 2.3s ease-out ${index * 0.42}s infinite`,
          }}
        />
      ))}
      <div
        data-zoo-motion="true"
        className="absolute bottom-[2.95rem] left-1.5 text-[11px]"
        style={{ animation: "zoo-flag-wave 1.8s ease-in-out infinite" }}
      >
        🚩
      </div>
      <div
        data-zoo-motion="true"
        className="absolute inset-0"
        style={{ animation: "zoo-tram-bob 2.4s ease-in-out infinite" }}
      >
        <div className="absolute bottom-5 left-3 h-7 w-20 rounded-[18px] border-[3px] border-amber-700 bg-amber-400 shadow-md" />
        <div className="absolute bottom-10 left-8 h-4 w-10 rounded-t-[12px] border-[3px] border-amber-700 border-b-0 bg-amber-300" />
        <div className="absolute bottom-[2.1rem] left-[1.15rem] flex gap-1.5">
          <span className="h-3 w-4 rounded bg-white/70" />
          <span className="h-3 w-4 rounded bg-white/70" />
          <span className="h-3 w-4 rounded bg-white/70" />
        </div>
        <div className="absolute bottom-[2.8rem] left-[1.4rem] flex gap-[0.6rem]">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-950/75" />
          <span className="h-2.5 w-2.5 rounded-full bg-orange-950/70" />
        </div>
        <div
          data-zoo-motion="true"
          className="absolute bottom-3 left-[1.1rem] h-5 w-5 rounded-full border-[3px] border-slate-700 bg-slate-800"
          style={{ animation: "zoo-wheel-spin 1.2s linear infinite" }}
        />
        <div
          data-zoo-motion="true"
          className="absolute bottom-3 right-[1.05rem] h-5 w-5 rounded-full border-[3px] border-slate-700 bg-slate-800"
          style={{ animation: "zoo-wheel-spin 1.2s linear infinite" }}
        />
        <div className="absolute bottom-[2.65rem] right-4 text-lg">🎟️</div>
      </div>
    </div>
  );
}

function CinematicActorSprite({
  actor,
  animations,
}: {
  actor: CinematicActorConfig;
  animations: LoadedLottieAnimations;
}) {
  const animationData = animations[actor.actor];

  if (animationData) {
    return (
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{ width: actor.width, height: actor.height }}
      />
    );
  }

  if (actor.actor === "dog") {
    return <CartoonDog size={Math.round(Math.min(actor.width, actor.height))} animate="scene" />;
  }

  if (actor.actor === "owl") {
    return <CartoonOwl size={Math.round(Math.min(actor.width, actor.height))} animate="scene" />;
  }

  const tramScale = Math.min(actor.width / 112, actor.height / 64);

  return (
    <div className="flex h-full w-full items-end justify-start">
      <div className="origin-bottom-left" style={{ transform: `scale(${tramScale})` }}>
        <SafariTram />
      </div>
    </div>
  );
}

interface StoryGeneratingAnimationProps {
  isVisible: boolean;
}

export function StoryGeneratingAnimation({ isVisible }: StoryGeneratingAnimationProps) {
  const [messageIdx, setMessageIdx] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [activeZoneIdx, setActiveZoneIdx] = useState(0);
  const [lottieAnimations, setLottieAnimations] = useState<LoadedLottieAnimations>({});
  const [hasVideoLoop, setHasVideoLoop] = useState(false);
  const cinematicAssetsResolved = useRef(false);
  const messageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const zoneTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    setMessageIdx(0);
    setStageIdx(0);
    setActiveZoneIdx(0);

    const messageDuration = Math.round(MASTER_LOOP_MS / ZOO_MESSAGES.length);
    const stageDuration = Math.round(MASTER_LOOP_MS / ZOO_STAGES.length);

    messageTimer.current = setInterval(() => {
      setMessageIdx((previous) => (previous + 1) % ZOO_MESSAGES.length);
    }, messageDuration);

    stageTimer.current = setInterval(() => {
      setStageIdx((previous) => (previous + 1) % ZOO_STAGES.length);
    }, stageDuration);

    zoneTimer.current = setInterval(() => {
      setActiveZoneIdx((previous) => (previous + 1) % ZOO_ENCLOSURES.length);
    }, 3_600);

    return () => {
      if (messageTimer.current) {
        clearInterval(messageTimer.current);
      }
      if (stageTimer.current) {
        clearInterval(stageTimer.current);
      }
      if (zoneTimer.current) {
        clearInterval(zoneTimer.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || cinematicAssetsResolved.current) {
      return;
    }

    cinematicAssetsResolved.current = true;
    let isCancelled = false;

    void (async () => {
      const animationEntries = await Promise.all(
        (Object.entries(LOTTIE_ASSET_PATHS) as Array<[LottieActorId, string]>).map(
          async ([actorId, path]) => {
            const payload = await loadOptionalAnimationData(path);
            return payload ? ([actorId, payload] as const) : null;
          }
        )
      );

      if (!isCancelled) {
        setLottieAnimations(
          Object.fromEntries(animationEntries.filter(isLottieEntry)) as LoadedLottieAnimations
        );
      }

      const videoAvailable = await hasAvailableMedia(VIDEO_LOOP_SOURCES);
      if (!isCancelled) {
        setHasVideoLoop(videoAvailable);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const activeEnclosure =
    ZOO_ENCLOSURES[activeZoneIdx % ZOO_ENCLOSURES.length] ?? ZOO_ENCLOSURES[0];
  const activeCinematicScene =
    CINEMATIC_SCENES[messageIdx % CINEMATIC_SCENES.length] ?? CINEMATIC_SCENES[0];
  const cinematicActors = activeCinematicScene.actors as readonly CinematicActorConfig[];

  return (
    <div className="fixed inset-0 z-50">
      <CartoonKeyframes />
      <style>{`
        @keyframes zoo-cloud-drift {
          0% { transform: translate3d(-18px, 0px, 0); }
          50% { transform: translate3d(22px, -8px, 0); }
          100% { transform: translate3d(-18px, 0px, 0); }
        }
        @keyframes zoo-sun-glow {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes zoo-banner-wave {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        @keyframes zoo-bounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes zoo-sway {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes zoo-leaf-sway {
          0%, 100% { transform: rotate(-4deg) translateY(0px); }
          50% { transform: rotate(4deg) translateY(-4px); }
        }
        @keyframes zoo-mascot-bob {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-14px) rotate(2deg); }
        }
        @keyframes zoo-owl-look {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes zoo-tram-run {
          0% { transform: translateX(-14%); }
          100% { transform: translateX(112%); }
        }
        @keyframes zoo-wheel-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes zoo-tram-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes zoo-flag-wave {
          0%, 100% { transform: rotate(-10deg) translateY(0px); }
          50% { transform: rotate(12deg) translateY(-1px); }
        }
        @keyframes zoo-tram-puff {
          0% { transform: translate3d(0px, 0px, 0px) scale(0.55); opacity: 0; }
          20% { opacity: 0.55; }
          100% { transform: translate3d(-22px, -18px, 0px) scale(1.35); opacity: 0; }
        }
        @keyframes zoo-card-glow {
          0%, 100% { box-shadow: 0 0 0 rgba(255,255,255,0); }
          50% { box-shadow: 0 0 0 10px rgba(255,255,255,0.18); }
        }
        @keyframes zoo-scene-fade {
          0% { opacity: 0; transform: translateY(10px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0px) scale(1); }
        }
        @keyframes zoo-text-in {
          0% { transform: translateY(20px) scale(0.92); opacity: 0; }
          70% { transform: translateY(-6px) scale(1.03); opacity: 1; }
          100% { transform: translateY(0px) scale(1); opacity: 1; }
        }
        @keyframes zoo-dots-pulse {
          0%, 100% { transform: translateY(0px) scale(0.84); opacity: 0.48; }
          50% { transform: translateY(-5px) scale(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-zoo-motion="true"] {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <div
        className="fixed inset-0 overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #72d5ff 0%, #b3ecff 36%, #dff9f2 62%, #88d17b 100%)",
        }}
        aria-live="polite"
        aria-busy="true"
        aria-label="故事動物園準備中，請稍候"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_40%)]" />

        <div
          className="pointer-events-none absolute left-[-3rem] top-[-2.5rem] h-48 w-48 rounded-full bg-yellow-300/95 blur-[1px]"
          style={{ animation: "zoo-sun-glow 6s ease-in-out infinite" }}
        />
        <div className="pointer-events-none absolute left-[-1rem] top-[-0.5rem] h-56 w-56 rounded-full bg-yellow-200/35 blur-2xl" />

        {CLOUDS.map((cloud, index) => (
          <FloatingCloud key={`${cloud.top}-${index}`} {...cloud} />
        ))}

        <div className="pointer-events-none absolute bottom-[-8%] left-[-12%] h-56 w-72 rounded-[50%] bg-emerald-300/70 blur-sm" />
        <div className="pointer-events-none absolute bottom-[-9%] right-[-12%] h-64 w-80 rounded-[50%] bg-lime-300/70 blur-sm" />

        <div className="relative mx-auto flex h-full w-full max-w-[520px] items-center justify-center px-4 py-6">
          <div className="relative w-full rounded-[36px] border-[4px] border-white/70 bg-white/30 px-4 py-5 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-md sm:px-6 sm:py-6">
            <div className="pt-4 text-center">
              <div className="inline-flex items-center justify-center rounded-full bg-white/85 px-4 py-2 text-sm font-black text-sky-700 shadow-sm">
                動物園故事製作中
              </div>
              <div
                className="mx-auto mt-3 inline-flex items-center gap-2 rounded-[24px] border-[4px] border-emerald-300 bg-emerald-100 px-5 py-3 text-slate-800 shadow-md"
                style={{ animation: "zoo-banner-wave 3.8s ease-in-out infinite" }}
              >
                <span className="text-2xl">🎡</span>
                <span className="text-xl font-black sm:text-2xl">歡迎嚟到故事動物園</span>
              </div>
            </div>

            <div className="mt-5 rounded-[30px] border-[3px] border-sky-200/80 bg-white/72 p-3 shadow-[0_18px_34px_rgba(8,145,178,0.16)]">
              <div
                key={activeCinematicScene.id}
                data-zoo-motion="true"
                className={cn(
                  "relative h-[258px] overflow-hidden rounded-[28px] border-[3px] border-white/90 bg-gradient-to-br p-4 shadow-inner",
                  activeCinematicScene.gradient
                )}
                style={{ animation: "zoo-scene-fade 0.7s ease both" }}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.72),transparent_52%)]" />
                {hasVideoLoop ? (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="absolute inset-0 h-full w-full object-cover opacity-30"
                  >
                    {VIDEO_LOOP_SOURCES.map((source) => (
                      <source
                        key={source}
                        src={source}
                        type={source.endsWith(".webm") ? "video/webm" : "video/mp4"}
                      />
                    ))}
                  </video>
                ) : null}

                <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-white/88 px-3 py-1 text-xs font-black text-emerald-700 shadow-sm">
                    {activeCinematicScene.badge}
                  </span>
                  <span className="rounded-full bg-slate-900/10 px-3 py-1 text-xs font-black text-slate-700 backdrop-blur-sm">
                    {activeCinematicScene.title}
                  </span>
                </div>

                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0))]" />
                <div className="absolute inset-x-5 bottom-5 h-4 rounded-full border-[3px] border-dashed border-amber-600/70 bg-amber-100/70" />

                {cinematicActors.map((actor) => (
                  <div
                    key={`${activeCinematicScene.id}-${actor.actor}-${actor.className}`}
                    data-zoo-motion="true"
                    className={cn(
                      "absolute flex items-end justify-center transition-all duration-700",
                      actor.className
                    )}
                    style={actor.style}
                    aria-hidden="true"
                  >
                    <CinematicActorSprite actor={actor} animations={lottieAnimations} />
                  </div>
                ))}

                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-[linear-gradient(180deg,rgba(17,24,39,0),rgba(20,83,45,0.16))]" />
              </div>
            </div>

            <div className="mt-5 rounded-[30px] border-[3px] border-emerald-200/90 bg-white/78 p-3 shadow-inner sm:p-4">
              <div className="rounded-[24px] border-[3px] border-white/90 bg-gradient-to-b from-sky-100 via-[#f2fff4] to-emerald-100 p-3 sm:p-4">
                <div className="rounded-[22px] border-[2px] border-emerald-200 bg-white/80 px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-500">
                        今日焦點區域
                      </p>
                      <p className={cn("mt-1 text-lg font-black sm:text-xl", activeEnclosure.accent)}>
                        {activeEnclosure.title}
                      </p>
                      <p className="text-sm font-bold text-slate-500">
                        {activeEnclosure.subtitle}
                      </p>
                    </div>
                    <div
                      className="text-5xl"
                      style={{ animation: "zoo-bounce 3.4s ease-in-out infinite" }}
                    >
                      {activeEnclosure.emoji}
                    </div>
                  </div>
                </div>

                <div className="relative mt-4 overflow-hidden rounded-[28px] border-[3px] border-emerald-200 bg-gradient-to-b from-sky-200 via-[#ddfff0] to-[#95da7d] px-3 pb-16 pt-4 sm:px-4">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_70%)]" />
                  <div
                    data-zoo-motion="true"
                    className="absolute left-1/2 top-3 w-40 -translate-x-1/2 rounded-[22px] border-[3px] border-emerald-500 bg-yellow-100 px-4 py-2 text-center shadow-sm"
                    style={{ animation: "zoo-banner-wave 4.4s ease-in-out infinite" }}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                      動物園大門
                    </p>
                    <p className="text-base font-black text-emerald-700">歡迎入場</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-14 sm:gap-4">
                    {ZOO_ENCLOSURES.map((enclosure, index) => {
                      const isActive = index === activeZoneIdx;

                      return (
                        <div
                          key={enclosure.id}
                          className={cn(
                            "relative overflow-hidden rounded-[24px] border-[3px] p-3 transition-all duration-500",
                            enclosure.border,
                            `bg-gradient-to-br ${enclosure.gradient}`,
                            isActive
                              ? "scale-[1.02] shadow-[0_18px_35px_rgba(34,197,94,0.22)]"
                              : "shadow-[0_10px_18px_rgba(148,163,184,0.16)]"
                          )}
                          style={
                            isActive
                              ? { animation: "zoo-card-glow 2.8s ease-in-out infinite" }
                              : undefined
                          }
                        >
                          <div
                            className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/45 blur-md"
                            style={{ animation: "zoo-sun-glow 4.4s ease-in-out infinite" }}
                          />
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className={cn("text-base font-black sm:text-lg", enclosure.accent)}>
                                {enclosure.title}
                              </p>
                              <p className="mt-1 text-xs font-bold leading-snug text-slate-500 sm:text-sm">
                                {enclosure.subtitle}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "rounded-full px-2 py-1 text-xs font-black text-white",
                                enclosure.badge
                              )}
                            >
                              {PEN_SIGNS[index]}
                            </span>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-2">
                            <div
                              className="text-5xl sm:text-6xl"
                              style={{
                                animation: isActive
                                  ? `zoo-bounce 1.9s ease-in-out ${enclosure.emojiDelay} infinite`
                                  : `zoo-sway 4.8s ease-in-out ${enclosure.emojiDelay} infinite`,
                              }}
                            >
                              {enclosure.emoji}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="rounded-full bg-white/75 px-2.5 py-1 text-[11px] font-black text-slate-500">
                                觀察中
                              </span>
                              <span
                                className="text-lg"
                                style={{ animation: "zoo-leaf-sway 3.8s ease-in-out infinite" }}
                              >
                                🌿
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="absolute inset-x-6 bottom-11 h-4 rounded-full border-[3px] border-dashed border-amber-600/70 bg-amber-100/70" />
                  <div
                    data-zoo-motion="true"
                    className="absolute bottom-[1.6rem] left-0"
                    style={{ width: "32%", animation: "zoo-tram-run 18s linear infinite" }}
                  >
                    <SafariTram />
                  </div>

                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-[linear-gradient(180deg,rgba(17,24,39,0),rgba(20,83,45,0.12))]" />
                </div>
              </div>
            </div>

            <div className="mt-5 text-center">
              <p
                key={messageIdx}
                className="text-xl font-black leading-snug text-white drop-shadow-[0_3px_10px_rgba(14,116,144,0.35)] sm:text-2xl"
                style={{
                  animation:
                    "zoo-text-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                }}
              >
                {ZOO_MESSAGES[messageIdx]}
              </p>
              <PulsingDots />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              {ZOO_STAGES.map((stage, index) => (
                <div key={stage.label} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-black transition-all duration-500 sm:text-base",
                      index === stageIdx
                        ? "bg-white text-emerald-700 shadow-lg"
                        : "bg-white/30 text-white/80"
                    )}
                  >
                    <span className="text-lg">{stage.emoji}</span>
                    <span>{stage.label}</span>
                  </div>
                  {index < ZOO_STAGES.length - 1 ? (
                    <span className="text-white/80">•</span>
                  ) : null}
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-sm font-black text-white/90">
              小火車正喺動物園收集靈感，故事好快就會送到你面前。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
