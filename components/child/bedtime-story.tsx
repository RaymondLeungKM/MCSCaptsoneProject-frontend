"use client";

import { useEffect, useRef, useState } from "react";
import { Moon, Sparkles, BookOpen, Clock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  GeneratedStory,
  LanguagePreference,
  StoryGenerationRequest,
} from "@/lib/types";
import {
  generateStoryWithExternalProgram,
  type StoryProgress,
  type StoryProgressCallback,
} from "@/lib/api/bedtime-stories";

export type BedtimeStoryTheme = NonNullable<StoryGenerationRequest["theme"]>;

interface BedtimeStoryGeneratorProps {
  childId?: string;
  childName?: string;
  languagePreference?: LanguagePreference;
  selectedTheme?: BedtimeStoryTheme;
  isGenerating?: boolean;
  generatedStory?: GeneratedStory | null;
  error?: string | null;
  onSelectedThemeChange?: (theme: BedtimeStoryTheme) => void;
  onIsGeneratingChange?: (isGenerating: boolean) => void;
  onGeneratedStoryChange?: (story: GeneratedStory | null) => void;
  onErrorChange?: (error: string | null) => void;
  onGenerateStory?: (
    request: StoryGenerationRequest,
    onProgress?: StoryProgressCallback,
  ) => Promise<void>;
  onStoryGenerated?: (story: GeneratedStory) => void;
  onReadStory?: (story: GeneratedStory) => void;
}

const themes: Array<{
  value: BedtimeStoryTheme;
  label: string;
  emoji: string;
  color: string;
}> = [
  {
    value: "bedtime",
    label: "睡前",
    emoji: "😴",
    color: "bg-indigo-100 text-indigo-600 border-indigo-200",
  },
  {
    value: "adventure",
    label: "冒險",
    emoji: "🗺️",
    color: "bg-emerald-100 text-emerald-600 border-emerald-200",
  },
  {
    value: "animals",
    label: "動物",
    emoji: "🐼",
    color: "bg-orange-100 text-orange-600 border-orange-200",
  },
  {
    value: "family",
    label: "家庭",
    emoji: "🏠",
    color: "bg-pink-100 text-pink-600 border-pink-200",
  },
  {
    value: "nature",
    label: "大自然",
    emoji: "🌳",
    color: "bg-green-100 text-green-600 border-green-200",
  },
  {
    value: "friendship",
    label: "友誼",
    emoji: "🤝",
    color: "bg-yellow-100 text-yellow-600 border-yellow-200",
  },
];

const NO_WORDS_LEARNED_ERROR =
  "No words learned today to include in story. Please complete some learning activities first.";

function isNoWordsLearnedError(message: string | null | undefined): boolean {
  return Boolean(
    message &&
    (message.includes("No words learned today") ||
      message === NO_WORDS_LEARNED_ERROR),
  );
}

export function BedtimeStoryGenerator({
  childId = "1",
  childName = "小朋友",
  selectedTheme,
  isGenerating,
  generatedStory,
  error,
  onSelectedThemeChange,
  onIsGeneratingChange,
  onGeneratedStoryChange,
  onErrorChange,
  onGenerateStory,
  onStoryGenerated,
  onReadStory,
}: BedtimeStoryGeneratorProps) {
  const [internalIsGenerating, setInternalIsGenerating] = useState(false);
  const [internalSelectedTheme, setInternalSelectedTheme] =
    useState<BedtimeStoryTheme>("bedtime");
  const [internalGeneratedStory, setInternalGeneratedStory] =
    useState<GeneratedStory | null>(null);
  const [internalError, setInternalError] = useState<string | null>(null);
  const { toast } = useToast();
  const lastHandledErrorRef = useRef<string | null>(null);
  const generationVideoRef = useRef<HTMLVideoElement | null>(null);

  const currentIsGenerating = isGenerating ?? internalIsGenerating;
  const currentSelectedTheme = selectedTheme ?? internalSelectedTheme;
  const currentGeneratedStory = generatedStory ?? internalGeneratedStory;
  const currentError = error ?? internalError;

  const setCurrentIsGenerating =
    onIsGeneratingChange ?? setInternalIsGenerating;
  const setCurrentSelectedTheme =
    onSelectedThemeChange ?? setInternalSelectedTheme;
  const setCurrentGeneratedStory =
    onGeneratedStoryChange ?? setInternalGeneratedStory;
  const setCurrentError = onErrorChange ?? setInternalError;
  const inlineError = isNoWordsLearnedError(currentError) ? null : currentError;

  // Real-progress for the generation overlay. There is no backend-reported
  // percentage, so we derive a TARGET from the actual generation signals (the
  // invoke call and each poll attempt; see generateStoryWithExternalProgram).
  // The displayed bar (`genProgress`) then glides smoothly toward that target,
  // so it moves continuously between the ~5s poll events instead of stepping.
  const [genProgress, setGenProgress] = useState(0);
  const progressTargetRef = useRef(0);

  // Map a real progress signal onto a 0-100 target. Progress advances only on
  // real events, but the curve is calibrated to the measured TYPICAL generation
  // time (~78s / ~16 polls), so a normal run reaches ~90%+ right as the story
  // arrives, keeping the final snap to 100% small. Eases toward a 97% ceiling
  // for slower runs.
  const PROGRESS_TIME_CONSTANT = 6.5; // in poll units (~5s each) => ~92% by ~80s
  const progressFromSignal = (signal: StoryProgress): number => {
    if (signal.phase === "done") return 100;
    if (signal.phase === "invoking") return 8;
    // Ease-out curve: rises quickly early, then approaches a 97% ceiling.
    const eased = 1 - Math.exp(-signal.attempt / PROGRESS_TIME_CONSTANT);
    return Math.min(97, Math.round(8 + eased * 92));
  };

  // Play the generation video WITH sound. Generation starts from a user click
  // (a valid user gesture), so browsers allow unmuted autoplay. If a browser
  // still blocks it, fall back to muted so the video always plays.
  useEffect(() => {
    if (!currentIsGenerating) return;
    const video = generationVideoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = 0.6;
    const tryPlay = video.play();
    if (tryPlay && typeof tryPlay.catch === "function") {
      tryPlay.catch(() => {
        video.muted = true;
        void video.play().catch(() => {});
      });
    }
  }, [currentIsGenerating]);

  // Glide the displayed progress toward the target while generating.
  useEffect(() => {
    if (!currentIsGenerating) return;
    const id = window.setInterval(() => {
      setGenProgress((current) => {
        const target = progressTargetRef.current;
        if (current >= target) return current;
        // Ease ~12% of the remaining gap each tick for a smooth approach.
        const next = current + Math.max(0.4, (target - current) * 0.12);
        return next >= target ? target : next;
      });
    }, 60);
    return () => window.clearInterval(id);
  }, [currentIsGenerating]);

  useEffect(() => {
    // When generation stops, snap the bar to 100% briefly, then reset.
    if (!currentIsGenerating && genProgress > 0 && genProgress < 100) {
      progressTargetRef.current = 100;
      setGenProgress(100);
      const resetTimer = setTimeout(() => {
        progressTargetRef.current = 0;
        setGenProgress(0);
      }, 600);
      return () => clearTimeout(resetTimer);
    }
    if (!currentIsGenerating) {
      progressTargetRef.current = 0;
      setGenProgress(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIsGenerating]);

  useEffect(() => {
    if (!isNoWordsLearnedError(currentError)) {
      lastHandledErrorRef.current = null;
      return;
    }

    if (lastHandledErrorRef.current === currentError) {
      return;
    }

    lastHandledErrorRef.current = currentError;
    toast({
      title: "今日未有詞語可以加入故事",
      description: "你今日仲未學到新詞語，先完成幾個學習活動，再生成故事啦。",
      variant: "destructive",
    });
    setCurrentError(null);
  }, [currentError, setCurrentError, toast]);

  const handleGenerateStory = async () => {
    const request: StoryGenerationRequest = {
      child_id: childId,
      theme: currentSelectedTheme,
      reading_time_minutes: 5,
      word_count_target: 400,
      include_english: false,
      include_jyutping: true,
    };

    setCurrentIsGenerating(true);
    setCurrentError(null);
    setCurrentGeneratedStory(null);
    progressTargetRef.current = 0;
    setGenProgress(0);

    // Keep the generation overlay visible long enough for the transition to register.
    const MIN_OVERLAY_MS = 3000;
    const startTime = Date.now();

    try {
      // Real poll/invoke events set the TARGET; the glide effect eases the
      // displayed bar toward it. Completion is applied immediately so the bar
      // finishes without waiting for the easing loop.
      const reportProgress: StoryProgressCallback = (signal) => {
        const value = progressFromSignal(signal);
        progressTargetRef.current = value;
        if (signal.phase === "done") setGenProgress(value);
      };

      if (onGenerateStory) {
        await onGenerateStory(request, reportProgress);
        return;
      }

      const story = await generateStoryWithExternalProgram(
        request,
        reportProgress,
      );

      setCurrentGeneratedStory(story);
      if (onStoryGenerated) onStoryGenerated(story);
    } catch (err) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_OVERLAY_MS) {
        await new Promise((resolve) => {
          setTimeout(resolve, MIN_OVERLAY_MS - elapsed);
        });
      }

      if (err instanceof Error) {
        setCurrentError(err.message);
      } else {
        setCurrentError("生成故事失敗，請稍後再試。");
      }
    } finally {
      setCurrentIsGenerating(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      {currentIsGenerating && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden px-5 py-8">
          {/* Dreamy branded backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,#f5e6ff_0%,transparent_45%),radial-gradient(circle_at_85%_80%,#ffe4f2_0%,transparent_45%),linear-gradient(160deg,#efe0ff_0%,#f7e8ff_40%,#ffe9f6_100%)]" />
          {/* Soft floating orbs */}
          <div className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-purple-300/30 blur-3xl [animation:mm-orb_9s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute -right-16 bottom-16 h-72 w-72 rounded-full bg-pink-300/30 blur-3xl [animation:mm-orb_11s_ease-in-out_infinite_reverse]" />
          {/* Twinkling stars */}
          <div className="pointer-events-none absolute inset-0">
            {[
              { top: "12%", left: "16%", s: 18, d: "0s" },
              { top: "22%", left: "82%", s: 14, d: "0.6s" },
              { top: "68%", left: "10%", s: 16, d: "1.1s" },
              { top: "78%", left: "88%", s: 20, d: "0.3s" },
              { top: "40%", left: "6%", s: 12, d: "1.5s" },
              { top: "55%", left: "92%", s: 14, d: "0.9s" },
            ].map((star, i) => (
              <span
                key={i}
                className="absolute text-amber-300 [animation:mm-twinkle_2.4s_ease-in-out_infinite]"
                style={{
                  top: star.top,
                  left: star.left,
                  fontSize: star.s,
                  animationDelay: star.d,
                }}
              >
                ✦
              </span>
            ))}
          </div>

          <style>{`
            @keyframes mm-orb { 0%,100%{transform:translate3d(0,0,0) scale(1);} 50%{transform:translate3d(0,-22px,0) scale(1.08);} }
            @keyframes mm-twinkle { 0%,100%{opacity:.3;transform:scale(.8);} 50%{opacity:1;transform:scale(1.25);} }
            @keyframes mm-float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }
          `}</style>

          {/* Centered content */}
          <div className="relative z-10 flex w-full max-w-[440px] flex-col items-center text-center">
            <p className="mb-1 text-xs font-black uppercase tracking-[0.3em] text-purple-400">
              Story Magic
            </p>
            <h3 className="mb-5 text-2xl font-black text-purple-900 sm:text-3xl [animation:mm-float_4s_ease-in-out_infinite]">
              ✨ 正在為{childName}創作故事…
            </h3>

            {/* Video hero */}
            <div className="w-full overflow-hidden rounded-[28px] bg-black shadow-[0_20px_60px_rgba(147,51,234,0.35)] ring-4 ring-white/70">
              <video
                ref={generationVideoRef}
                src="/story-generating.mp4"
                autoPlay
                loop
                playsInline
                className="block aspect-video w-full bg-black object-cover"
              />
            </div>

            {/* Progress */}
            <div className="mt-5 w-full">
              <div className="mb-1.5 flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-purple-500">
                <span>創作進度</span>
                <span>{Math.round(genProgress)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/70 shadow-inner">
                <div
                  className="h-full rounded-full transition-[width] duration-200 ease-linear"
                  style={{
                    width: `${genProgress}%`,
                    background:
                      "linear-gradient(90deg, #f97316, #facc15, #84cc16, #38bdf8, #a78bfa, #f472b6)",
                  }}
                />
              </div>
              <p className="mt-3 text-sm font-bold text-purple-500/80">
                魔法小精靈努力寫緊故事，請耐心等一等 🪄
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- GENERATOR CARD --- */}
      <Card className="overflow-hidden border-8 border-white bg-gradient-to-br from-[#F3E5F5] to-[#E1BEE7] rounded-[40px] shadow-lg">
        {/* Header */}
        <div className="p-5 sm:p-8 text-center space-y-2">
          <div className="inline-flex p-4 bg-white rounded-full shadow-md mb-2">
            <Moon className="w-8 h-8 text-purple-500 fill-purple-500" />
          </div>
          <h2 className="child-tab-hero-title text-purple-900">生成睡前故事</h2>
          <p className="child-tab-hero-copy !mt-0 !max-w-none !text-sm !font-bold !text-purple-700 sm:!text-lg md:!text-xl">
            為
            <span className="font-bold underline decoration-wavy decoration-purple-400">
              {childName}
            </span>
            創作一個個人化故事，使用今天學習的詞語
          </p>
        </div>

        {/* Theme Selection Grid */}
        <div className="mx-3 mb-4 rounded-[32px] bg-white/60 p-4 backdrop-blur-md sm:mx-4 sm:p-6">
          <h3 className="child-tab-section-title mb-4 flex items-center gap-2 text-purple-900">
            <Sparkles className="w-4 h-4 text-yellow-500" /> 選擇主題
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => setCurrentSelectedTheme(theme.value)}
                className={cn(
                  "flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-3 text-center transition-all duration-300 sm:min-h-0 sm:p-2",
                  currentSelectedTheme === theme.value
                    ? "bg-purple-100 border-purple-400 text-purple-900 shadow-md scale-105"
                    : "bg-white border-transparent hover:border-purple-200 text-slate-600 hover:bg-purple-50",
                )}
              >
                <span className="text-2xl sm:text-xl">{theme.emoji}</span>
                <span className="child-tab-card-title !mt-0 !text-sm sm:!text-base">
                  {theme.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Info Row */}
        <div className="child-tab-copy px-5 pb-3 sm:px-8 sm:pb-4 flex flex-col sm:flex-row justify-between items-center gap-0.5 sm:gap-0 !text-xs sm:!text-sm !font-bold !text-purple-800 opacity-70">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            聽故事時間：5分鐘
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" /> 故事長度：~700 字
          </div>
        </div>

        {/* Generate Button */}
        <div className="p-4">
          <Button
            onClick={handleGenerateStory}
            disabled={currentIsGenerating}
            className={cn(
              "w-full h-12 sm:h-16 rounded-full text-xl sm:text-3xl font-black text-white shadow-lg transition-all",
              currentIsGenerating
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-[1.02] active:scale-95 shadow-purple-300/50",
            )}
          >
            {currentIsGenerating ? (
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 animate-spin" />
                正在施展魔法...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Moon className="w-6 h-6 fill-white" />
                生成故事
              </div>
            )}
          </Button>
        </div>

        {inlineError && (
          <div className="child-tab-copy px-6 pb-5 !text-sm !font-bold !text-red-600">
            {inlineError}
          </div>
        )}
      </Card>

      {/* --- RESULT CARD (Displays when story is ready) --- */}
      {currentGeneratedStory && (
        <div>
          <StoryCard
            story={currentGeneratedStory}
            onRead={() => onReadStory?.(currentGeneratedStory)}
          />
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: STORY CARD ---
function StoryCard({
  story,
  onRead,
}: {
  story: GeneratedStory;
  onRead?: () => void;
}) {
  return (
    <Card className="relative overflow-hidden bg-white border-4 border-white rounded-[40px] shadow-xl">
      {/* Header Art */}
      <div className="relative h-28 bg-gradient-to-r from-indigo-400 to-purple-400 sm:h-32">
        <Sparkles className="absolute top-4 right-4 text-white/30 w-12 h-12" />
        <div className="absolute -bottom-7 left-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-md sm:-bottom-8 sm:left-6 sm:h-16 sm:w-16">
          🍎
        </div>
      </div>

      <div className="px-4 pb-5 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="child-tab-section-title mb-1 !text-2xl !leading-tight sm:!text-3xl md:!text-[2.4rem]">
              {story.title}
            </h3>
          </div>
          <button className="rounded-full bg-pink-50 p-2 text-pink-500 transition-colors hover:bg-pink-100">
            <Heart className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2 sm:mb-6">
          {story.featured_words.map((word) => (
            <Badge
              key={word}
              className="bg-purple-100 text-purple-600 hover:bg-purple-200 border-none px-3 py-1 rounded-full text-sm font-black"
            >
              {word}
            </Badge>
          ))}
          <Badge className="bg-slate-100 text-slate-500 border-none px-3 py-1 rounded-full text-sm font-black">
            <Clock className="w-3 h-3 mr-1" /> {story.reading_time_minutes} 分鐘
          </Badge>
        </div>

        <div className="mb-5 rounded-[24px] bg-slate-50 p-4 sm:mb-6 sm:p-6">
          <p className="child-tab-card-copy !mt-0 !text-lg !leading-relaxed !text-slate-600 sm:!text-xl md:!text-2xl">
            {story.content_cantonese}
          </p>
        </div>

        <Button
          onClick={onRead}
          disabled={!onRead}
          className="h-12 w-full rounded-full bg-[#38BDF8] text-lg font-black text-white shadow-lg transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:text-xl"
        >
          <BookOpen className="w-5 h-5 mr-2" />
          開始閱讀
        </Button>
      </div>
    </Card>
  );
}
