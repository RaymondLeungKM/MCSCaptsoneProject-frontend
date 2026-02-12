"use client";

import { useState } from "react";
import { Moon, Sparkles, BookOpen, Clock, Heart, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GeneratedStory, LanguagePreference } from "@/lib/types";
import { generateStory } from "@/lib/api/bedtime-stories";

interface BedtimeStoryGeneratorProps {
  childId?: string;
  childName?: string;
  languagePreference?: LanguagePreference;
  onStoryGenerated?: (story: GeneratedStory) => void;
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
  childName = "Emma",
  languagePreference = "bilingual",
  onStoryGenerated,
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

    try {
      const response = await generateStory({
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
        include_english: languagePreference === "bilingual",
        include_jyutping: true,
      });

      setGeneratedStory(response.story);
      if (onStoryGenerated) onStoryGenerated(response.story);
    } catch (err) {
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
    <div className="w-full max-w-xl mx-auto space-y-8">
      {/* --- GENERATOR CARD --- */}
      <Card className="overflow-hidden border-8 border-white bg-gradient-to-br from-[#F3E5F5] to-[#E1BEE7] rounded-[40px] shadow-lg">
        {/* Header */}
        <div className="p-8 text-center space-y-2">
          <div className="inline-flex p-4 bg-white rounded-full shadow-md mb-2">
            <Moon className="w-8 h-8 text-purple-500 fill-purple-500" />
          </div>
          <h2 className="text-3xl font-black text-purple-900 tracking-tight">
            生成睡前故事
          </h2>
          <p className="text-purple-700 font-medium">
            為
            <span className="font-bold underline decoration-wavy decoration-purple-400">
              {childName}
            </span>
            創作一個個人化故事，使用今天學習的詞語
          </p>
        </div>

        {/* Theme Selection Grid */}
        <div className="bg-white/60 backdrop-blur-md p-6 rounded-[32px] mx-4 mb-4">
          <h3 className="text-sm font-black text-purple-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" /> 選擇主題
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => setSelectedTheme(theme.value)}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300",
                  selectedTheme === theme.value
                    ? "bg-purple-600 border-purple-600 text-white shadow-lg scale-105"
                    : "bg-white border-transparent hover:border-purple-200 text-slate-600 hover:bg-purple-50",
                )}
              >
                <span className="text-2xl mb-1">{theme.emoji}</span>
                <span className="text-xs font-bold">{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info Row */}
        <div className="px-8 pb-4 flex justify-between text-xs font-bold text-purple-800 opacity-70">
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
              "w-full h-16 rounded-full text-xl font-black text-white shadow-lg transition-all",
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
          <div className="px-6 pb-5 text-sm text-red-600 font-bold">
            {error}
          </div>
        )}
      </Card>

      {/* --- RESULT CARD (Displays when story is ready) --- */}
      {generatedStory && (
        <div className="animate-in slide-in-from-bottom-8 fade-in duration-700">
          <StoryCard story={generatedStory} />
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: STORY CARD ---
function StoryCard({ story }: { story: GeneratedStory }) {
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
            <h3 className="text-2xl font-black text-slate-800 leading-tight mb-1">
              {story.title}
            </h3>
            <p className="text-slate-400 font-bold text-sm">
              {story.title_english}
            </p>
          </div>
          <button className="p-2 bg-pink-50 rounded-full text-pink-500 hover:bg-pink-100 transition-colors">
            <Heart className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {story.featured_words.map((word) => (
            <Badge
              key={word}
              className="bg-purple-100 text-purple-600 hover:bg-purple-200 border-none px-3 py-1 rounded-full"
            >
              {word}
            </Badge>
          ))}
          <Badge className="bg-slate-100 text-slate-500 border-none px-3 py-1 rounded-full">
            <Clock className="w-3 h-3 mr-1" /> {story.reading_time_minutes} min
          </Badge>
        </div>

        <div className="bg-slate-50 p-6 rounded-[24px] mb-6">
          <p className="text-lg text-slate-600 leading-relaxed font-medium">
            {story.content_cantonese}
          </p>
        </div>

        <Button className="w-full h-14 rounded-full bg-[#38BDF8] text-white font-black text-lg shadow-lg hover:scale-[1.02] transition-transform">
          <BookOpen className="w-5 h-5 mr-2" />
          開始閱讀
        </Button>
      </div>
    </Card>
  );
}
