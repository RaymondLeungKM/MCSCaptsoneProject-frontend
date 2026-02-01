"use client";

import { useState } from "react";
import { Moon, Sparkles, BookOpen, Heart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GeneratedStory,
  StoryGenerationRequest,
  LanguagePreference,
} from "@/lib/types";
import { generateStory, toggleFavorite } from "@/lib/api/bedtime-stories";
import { useToast } from "@/hooks/use-toast";

interface BedtimeStoryGeneratorProps {
  childId: string;
  childName: string;
  languagePreference: LanguagePreference;
  onStoryGenerated?: (story: GeneratedStory) => void;
}

const themes = [
  { value: "bedtime", label: "睡前", emoji: "😴", description: "平靜舒適" },
  { value: "adventure", label: "冒險", emoji: "🗺️", description: "探索驚喜" },
  { value: "animals", label: "動物", emoji: "🐼", description: "可愛有趣" },
  { value: "family", label: "家庭", emoji: "👨‍👩‍👧", description: "溫馨有愛" },
  { value: "nature", label: "大自然", emoji: "🌳", description: "探索戶外" },
  { value: "friendship", label: "友誼", emoji: "🤝", description: "朋友故事" },
];

export function BedtimeStoryGenerator({
  childId,
  childName,
  languagePreference,
  onStoryGenerated,
}: BedtimeStoryGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>("bedtime");
  const { toast } = useToast();

  const handleGenerateStory = async () => {
    setIsGenerating(true);

    try {
      const request: StoryGenerationRequest = {
        child_id: childId,
        theme: selectedTheme as any,
        word_count_target: 400,
        reading_time_minutes: 5,
        include_english:
          languagePreference === "bilingual" ||
          languagePreference === "english",
        include_jyutping: languagePreference !== "english",
      };

      const response = await generateStory(request);

      toast({
        title: "故事生成成功！ Story Generated!",
        description: `${response.story.title} - ${response.words_used.length} 個詞語 ${response.words_used.length} words`,
      });

      if (onStoryGenerated) {
        onStoryGenerated(response.story);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message;

      if (errorMsg.includes("No words learned today")) {
        toast({
          title: "未有學習記錄 No Words Learned",
          description:
            "今天還未學習新詞語。請先完成一些學習活動！ Please complete some learning activities first!",
          variant: "destructive",
        });
      } else if (errorMsg.includes("No AI API key")) {
        toast({
          title: "功能未啟用 Feature Not Enabled",
          description:
            "AI 故事生成功能需要 API 密鑰。請聯繫管理員。 AI story generation requires an API key. Please contact administrator.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "生成失敗 Generation Failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Moon className="h-6 w-6 text-purple-600" />
          <CardTitle className="text-2xl">
            {languagePreference === "english"
              ? "Generate Bedtime Story"
              : "生成睡前故事"}
          </CardTitle>
        </div>
        <CardDescription>
          {languagePreference === "english"
            ? `Create a personalized story for ${childName} using today's learned words`
            : `為${childName}創作一個個人化故事，使用今天學習的詞語`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            {languagePreference === "english" ? "Choose a Theme" : "選擇主題"}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {themes.map((theme) => (
              <Button
                key={theme.value}
                variant={selectedTheme === theme.value ? "default" : "outline"}
                className={`h-auto py-3 flex flex-col items-center gap-1 ${
                  selectedTheme === theme.value
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "hover:bg-purple-100"
                }`}
                onClick={() => setSelectedTheme(theme.value)}
              >
                <span className="text-2xl">{theme.emoji}</span>
                <span className="text-sm font-semibold">{theme.label}</span>
                <span className="text-xs opacity-75">{theme.description}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="bg-white/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-purple-600" />
            <span className="font-medium">
              {languagePreference === "english"
                ? "Reading Time:"
                : "閱讀時間："}
            </span>
            <span>
              5 {languagePreference === "english" ? "minutes" : "分鐘"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-purple-600" />
            <span className="font-medium">
              {languagePreference === "english"
                ? "Story Length:"
                : "故事長度："}
            </span>
            <span>
              ~400 {languagePreference === "english" ? "characters" : "字"}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleGenerateStory}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 text-lg"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Sparkles className="mr-2 h-5 w-5 animate-spin" />
              {languagePreference === "english"
                ? "Creating Magic..."
                : "創作魔法中..."}
            </>
          ) : (
            <>
              <Moon className="mr-2 h-5 w-5" />
              {languagePreference === "english" ? "Generate Story" : "生成故事"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

interface StoryCardProps {
  story: GeneratedStory;
  languagePreference: LanguagePreference;
  onRead: (story: GeneratedStory) => void;
}

export function StoryCard({
  story,
  languagePreference,
  onRead,
}: StoryCardProps) {
  const [isFavorite, setIsFavorite] = useState(story.is_favorite);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const { toast } = useToast();

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTogglingFavorite(true);

    try {
      const result = await toggleFavorite(story.child_id, story.id);
      setIsFavorite(result.is_favorite);
      toast({
        title: result.is_favorite
          ? languagePreference === "english"
            ? "Added to Favorites"
            : "已加入最愛"
          : languagePreference === "english"
            ? "Removed from Favorites"
            : "已從最愛移除",
      });
    } catch (error) {
      toast({
        title: languagePreference === "english" ? "Error" : "錯誤",
        description:
          languagePreference === "english"
            ? "Failed to update favorite"
            : "無法更新最愛",
        variant: "destructive",
      });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const formattedDate = new Date(story.generation_date).toLocaleDateString(
    "zh-HK",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onRead(story)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {languagePreference === "english" && story.title_english
                ? story.title_english
                : story.title}
            </CardTitle>
            <CardDescription>{formattedDate}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
            className="shrink-0"
          >
            <Heart
              className={`h-5 w-5 ${
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
              }`}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {story.theme && <Badge variant="secondary">{story.theme}</Badge>}
          <Badge variant="outline">
            {story.featured_words.length}{" "}
            {languagePreference === "english" ? "words" : "詞語"}
          </Badge>
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {story.reading_time_minutes}{" "}
            {languagePreference === "english" ? "min" : "分鐘"}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 line-clamp-3">
          {story.content_cantonese.substring(0, 150)}...
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>
            {story.read_count}{" "}
            {languagePreference === "english" ? "reads" : "次閱讀"}
          </span>
          {story.word_count && (
            <span>
              {story.word_count}{" "}
              {languagePreference === "english" ? "characters" : "字"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
