"use client";

import { useState } from "react";
import { Moon, Sparkles, BookOpen, Clock, Heart, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GeneratedStory, LanguagePreference } from "@/lib/types";
import { generateStoryWithExternalProgram } from "@/lib/api/bedtime-stories";

interface BedtimeStoryGeneratorProps {
  childId?: string;
  childName?: string;
  languagePreference?: LanguagePreference;
  onStoryGenerated?: (story: GeneratedStory) => void;
  onReadStory?: (story: GeneratedStory) => void;
}

const themes = [
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

export function BedtimeStoryGenerator({
  childId = "1",
  childName = "小朋友",
  languagePreference = "cantonese",
  onStoryGenerated,
  onReadStory,
}: BedtimeStoryGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>("bedtime");
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleGenerateStory = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedStory(null);

    // Keep the generation overlay visible long enough for the transition to register.
    const MIN_OVERLAY_MS = 3000;
    const startTime = Date.now();

    try {
      const story = await generateStoryWithExternalProgram({
        child_id: childId,
        theme: selectedTheme as
          | "adventure"
          | "family"
          | "animals"
          | "nature"
          | "friendship"
          | "bedtime",
        reading_time_minutes: 5,
        word_count_target: 400,
        include_english: false,
        include_jyutping: true,
      });

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_OVERLAY_MS) {
        await new Promise((resolve) => {
          setTimeout(resolve, MIN_OVERLAY_MS - elapsed);
        });
      }

      setGeneratedStory(story);
      if (onStoryGenerated) onStoryGenerated(story);
    } catch (err) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_OVERLAY_MS) {
        await new Promise((resolve) => {
          setTimeout(resolve, MIN_OVERLAY_MS - elapsed);
        });
      }

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("生成故事失敗，請稍後再試。");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      {isGenerating && (
        <div className="fixed inset-0 z-[9999] overflow-hidden bg-slate-950/90 backdrop-blur-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.2),rgba(15,23,42,0.82))]" />
          <div className="relative z-10 flex min-h-full flex-col items-center justify-center gap-4 px-4 py-6 text-center sm:gap-6 sm:px-8">
            <div className="rounded-[28px] border border-white/15 bg-white/5 p-1 shadow-[0_24px_80px_rgba(15,23,42,0.45)] sm:rounded-[36px]">
              <video
                src="/story-generating.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="block h-auto rounded-[24px] bg-black object-contain sm:rounded-[32px]"
                style={{
                  width: "min(94vw, 110vh, 1280px)",
                  maxHeight: "min(62vh, 720px)",
                }}
              />
            </div>
            <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-md sm:px-8 sm:py-6">
              <div className="mb-3 flex items-center justify-center gap-3">
                <Sparkles className="w-7 h-7 animate-spin text-yellow-300" />
                <span className="text-2xl font-black text-white sm:text-3xl">正在施展魔法...</span>
                <Sparkles className="w-7 h-7 animate-spin text-yellow-300 [animation-direction:reverse]" />
              </div>
              <p className="text-base font-semibold text-white/80 sm:text-lg">
                為{childName}創作專屬故事，請稍候
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
          <h2 className="child-tab-hero-title text-purple-900">
            生成睡前故事
          </h2>
          <p className="child-tab-hero-copy !mt-0 !max-w-none !text-sm !font-bold !text-purple-700 sm:!text-lg md:!text-xl">
            為
            <span className="font-bold underline decoration-wavy decoration-purple-400">
              {childName}
            </span>
            創作一個個人化故事，使用今天學習的詞語
          </p>
        </div>

        {/* Theme Selection Grid */}
        <div className="bg-white/60 backdrop-blur-md p-4 sm:p-6 rounded-[32px] mx-3 sm:mx-4 mb-4">
          <h3 className="child-tab-section-title mb-4 flex items-center gap-2 text-purple-900">
            <Sparkles className="w-4 h-4 text-yellow-500" /> 選擇主題
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => setSelectedTheme(theme.value)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border-2 transition-all duration-300",
                  selectedTheme === theme.value
                    ? "bg-purple-100 border-purple-400 text-purple-900 shadow-md scale-105"
                    : "bg-white border-transparent hover:border-purple-200 text-slate-600 hover:bg-purple-50",
                )}
              >
                <span className="text-xl">{theme.emoji}</span>
                <span className="child-tab-card-title !mt-0 !text-sm sm:!text-base">{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info Row */}
        <div className="child-tab-copy px-5 pb-3 sm:px-8 sm:pb-4 flex flex-col sm:flex-row justify-between items-center gap-0.5 sm:gap-0 !text-xs sm:!text-sm !font-bold !text-purple-800 opacity-70">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" /> 閱讀時間：5 分鐘
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" /> 故事長度：~400 字
          </div>
        </div>

        {/* Generate Button */}
        <div className="p-4">
          <Button
            onClick={handleGenerateStory}
            disabled={isGenerating}
            className={cn(
              "w-full h-12 sm:h-16 rounded-full text-xl sm:text-3xl font-black text-white shadow-lg transition-all",
              isGenerating
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-[1.02] active:scale-95 shadow-purple-300/50",
            )}
          >
            {isGenerating ? (
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

        {error && (
          <div className="child-tab-copy px-6 pb-5 !text-sm !font-bold !text-red-600">
            {error}
          </div>
        )}
      </Card>

      {/* --- RESULT CARD (Displays when story is ready) --- */}
      {generatedStory && (
        <div>
          <StoryCard
            story={generatedStory}
            onRead={() => onReadStory?.(generatedStory)}
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
      <div className="h-32 bg-gradient-to-r from-indigo-400 to-purple-400 relative">
        <Sparkles className="absolute top-4 right-4 text-white/30 w-12 h-12" />
        <div className="absolute -bottom-8 left-6 w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-md">
          🍎
        </div>
      </div>

      <div className="pt-10 px-8 pb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="child-tab-section-title mb-1 !text-3xl md:!text-[2.4rem]">
              {story.title}
            </h3>
          </div>
          <button className="p-2 bg-pink-50 rounded-full text-pink-500 hover:bg-pink-100 transition-colors">
            <Heart className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
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

        <div className="bg-slate-50 p-6 rounded-[24px] mb-6">
          <p className="child-tab-card-copy !mt-0 !text-xl !leading-relaxed !text-slate-600 md:!text-2xl">
            {story.content_cantonese}
          </p>
        </div>

        <Button
          onClick={onRead}
          disabled={!onRead}
    className="w-full h-14 rounded-full bg-[#38BDF8] text-white font-black text-xl shadow-lg hover:scale-[1.02] transition-transform disabled:cursor-not-allowed disabled:opacity-60"
        >
          <BookOpen className="w-5 h-5 mr-2" />
          開始閱讀
        </Button>
      </div>
    </Card>
  );
}
