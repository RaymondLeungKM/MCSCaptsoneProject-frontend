"use client";

import { useState, useEffect } from "react";
import { BookOpen, Heart, Clock, Sparkles, Moon, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BedtimeStoryGenerator,
  StoryCard,
} from "@/components/child/bedtime-story";
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
      setError(
        languagePreference === "english"
          ? "Failed to load stories"
          : "無法載入故事",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStoryGenerated = (newStory: GeneratedStory) => {
    setStories((prev) => [newStory, ...prev]);
    onReadStory(newStory);
  };

  const allStories = stories;
  const favoriteStories = stories.filter((s) => s.is_favorite);

  const renderStoryList = (storiesToShow: GeneratedStory[]) => {
    if (storiesToShow.length === 0) {
      return (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            {activeTab === "favorites"
              ? languagePreference === "english"
                ? "No favorite stories yet"
                : "未有最愛故事"
              : languagePreference === "english"
                ? "No stories generated yet"
                : "未有生成故事"}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {languagePreference === "english"
              ? "Generate your first bedtime story!"
              : "生成你的第一個睡前故事！"}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {storiesToShow.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            languagePreference={languagePreference}
            onRead={onReadStory}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 rounded-2xl text-white">
        <Moon className="w-10 h-10" />
        <div>
          <h1 className="text-2xl font-bold">
            {languagePreference === "english" ? "Bedtime Stories" : "睡前故事"}
          </h1>
          <p className="text-sm opacity-90">
            {languagePreference === "english"
              ? `${childName}'s Story Library`
              : `${childName}的故事圖書館`}
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
      />

      {/* Story Library */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {languagePreference === "english" ? "Story Library" : "故事圖書館"}
          </h2>
          {stories.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              {stories.length}{" "}
              {languagePreference === "english"
                ? stories.length === 1
                  ? "story"
                  : "stories"
                : "個故事"}
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
                {languagePreference === "english" ? "Retry" : "重試"}
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {languagePreference === "english" ? "All Stories" : "全部故事"}
                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {allStories.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                {languagePreference === "english" ? "Favorites" : "最愛"}
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
            <div className="text-2xl font-bold text-purple-600">
              {stories.length}
            </div>
            <div className="text-xs text-gray-600">
              {languagePreference === "english" ? "Stories" : "故事"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600">
              {favoriteStories.length}
            </div>
            <div className="text-xs text-gray-600">
              {languagePreference === "english" ? "Favorites" : "最愛"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {stories.reduce((sum, s) => sum + s.reading_time_minutes, 0)}
            </div>
            <div className="text-xs text-gray-600">
              {languagePreference === "english" ? "Minutes" : "分鐘"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
