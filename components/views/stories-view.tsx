"use client";

import { useState, useEffect } from "react";
import { BookOpen, Heart, Clock, Sparkles, Moon, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BedtimeStoryGenerator } from "@/components/child/bedtime-story";
import { StoryCard } from "@/components/child/story-card"; // <-- Import from new location
import type { StoryCardData } from "@/components/child/story-card";
import { DailyWordsViewer } from "@/components/child/daily-words-viewer";
import { getChildStories } from "@/lib/api/bedtime-stories";
import type { GeneratedStory, LanguagePreference } from "@/lib/types";

interface StoriesViewProps {
  childId: string;
  childName: string;
  languagePreference: LanguagePreference;
  onReadStory: (story: GeneratedStory) => void;
}

export function StoriesView({
  childId,
  childName,
  languagePreference,
  onReadStory,
}: StoriesViewProps) {
  const [stories, setStories] = useState<GeneratedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");

  useEffect(() => {
    loadStories();
  }, [childId]);

  const loadStories = async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedStories = await getChildStories(childId, 50);
      setStories(fetchedStories);
    } catch (err: any) {
      console.error("Error loading stories:", err);
      setError("無法載入故事");
    } finally {
      setLoading(false);
    }
  };

  const handleStoryGenerated = (newStory: GeneratedStory) => {
    setStories((prev) => [newStory, ...prev.filter((story) => story.id !== newStory.id)]);
    onReadStory(newStory);
  };

  const allStories = stories;
  const favoriteStories = stories.filter((s) => s.is_favorite);

  const toStoryCardData = (story: GeneratedStory): StoryCardData => ({
    id: story.id,
    title: story.title,
    duration: `${story.reading_time_minutes || 5} 分鐘`,
    completed: (story.read_count || 0) > 0,
    emoji:
      story.theme === "animals"
        ? "🦊"
        : story.theme === "nature"
          ? "🌙"
          : story.theme === "adventure"
            ? "🚀"
            : "📖",
    color: story.is_favorite ? "purple" : "blue",
  });

  const renderStoryList = (storiesToShow: GeneratedStory[]) => {
    if (storiesToShow.length === 0) {
      return (
        <div className="text-center py-16">
          <BookOpen className="w-20 h-20 mx-auto text-gray-300 mb-6" />
          <p className="text-lg text-gray-600 font-semibold">
            {activeTab === "favorites" ? "未有最愛故事" : "未有生成故事"}
          </p>
          <p className="text-base text-gray-500 mt-3">
            生成你的第一個睡前故事！
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {storiesToShow.map((story) => (
          <StoryCard
            key={story.id}
            story={toStoryCardData(story)}
            onRead={() => onReadStory(story)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-7 rounded-3xl text-white shadow-lg">
        <Moon className="w-12 h-12 shrink-0" />
        <div>
          <h1 className="text-4xl font-black md:text-[2.75rem]">
            睡前故事
          </h1>
          <p className="text-lg opacity-95 font-semibold md:text-xl">
            {childName}的故事圖書館
          </p>
        </div>
      </div>

      {/* Daily Words Viewer */}
      <DailyWordsViewer
        childId={childId}
        childName={childName}
        languagePreference={languagePreference}
      />

      {/* Story Generator */}
      <BedtimeStoryGenerator
        childId={childId}
        childName={childName}
        languagePreference={languagePreference}
        onStoryGenerated={handleStoryGenerated}
        onReadStory={onReadStory}
      />

      {/* Story Library */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black flex items-center gap-3 md:text-[2.2rem]">
            <BookOpen className="w-6 h-6" />
            故事圖書館
          </h2>
          {stories.length > 0 && (
            <div className="flex items-center gap-3 text-lg text-gray-600 font-semibold">
              <Calendar className="w-4 h-4" />
              {stories.length} 個故事
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              <Button
                onClick={loadStories}
                variant="outline"
                size="sm"
                className="ml-2"
              >
                重試
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2 h-14">
              <TabsTrigger value="all" className="flex items-center gap-2 text-base font-black">
                <BookOpen className="w-4 h-4" />
                全部故事
                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {allStories.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="flex items-center gap-2 text-base font-black"
              >
                <Heart className="w-4 h-4" />
                最愛
                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {favoriteStories.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {renderStoryList(allStories)}
            </TabsContent>

            <TabsContent value="favorites" className="mt-4">
              {renderStoryList(favoriteStories)}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Stats Section */}
      {stories.length > 0 && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-black text-purple-600">
              {stories.length}
            </div>
            <div className="text-sm font-bold text-gray-600">故事</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-pink-600">
              {favoriteStories.length}
            </div>
            <div className="text-sm font-bold text-gray-600">最愛</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-indigo-600">
              {stories.reduce((sum, s) => sum + s.reading_time_minutes, 0)}
            </div>
            <div className="text-sm font-bold text-gray-600">分鐘</div>
          </div>
        </div>
      )}
    </div>
  );
}
