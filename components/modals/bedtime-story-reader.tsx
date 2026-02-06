"use client";

import { useState } from "react";
import { X, Volume2, Heart, Moon, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GeneratedStory, LanguagePreference } from "@/lib/types";
import { useSpeech } from "@/hooks/use-speech";

interface BedtimeStoryReaderProps {
  story: GeneratedStory | null;
  isOpen: boolean;
  onClose: () => void;
  languagePreference: LanguagePreference;
}

export function BedtimeStoryReader({
  story,
  isOpen,
  onClose,
  languagePreference,
}: BedtimeStoryReaderProps) {
  const [showJyutping, setShowJyutping] = useState(
    languagePreference !== "english",
  );
  const [showEnglish, setShowEnglish] = useState(
    languagePreference === "bilingual",
  );
  const { speak, stop, isReading } = useSpeech();

  if (!story) return null;

  const handleReadAloud = () => {
    if (isReading) {
      stop();
    } else {
      const textToRead =
        showEnglish && story.content_english
          ? story.content_english
          : story.content_cantonese;
      speak(textToRead);
    }
  };

  // Split content into paragraphs
  const paragraphs = story.content_cantonese
    .split("\n")
    .filter((p) => p.trim());

  // Get consistent word count from word_usage
  const wordCount = story.word_usage ? Object.keys(story.word_usage).length : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 custom-scrollbar">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full">
                <Moon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {showEnglish && story.title_english
                    ? story.title_english
                    : story.title}
                </DialogTitle>
                {showEnglish && story.title_english && (
                  <p className="text-sm text-gray-600 mt-1">{story.title}</p>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Story Metadata */}
        <div className="flex flex-wrap gap-2 pb-4 border-b border-purple-200">
          {story.theme && (
            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              {story.theme}
            </Badge>
          )}
          <Badge variant="outline" className="border-purple-300">
            ✨ {wordCount} {languagePreference === "english" ? "words" : "詞語"}
          </Badge>
          <Badge variant="outline" className="border-purple-300">
            ⏱️ {story.reading_time_minutes}{" "}
            {languagePreference === "english" ? "min" : "分鐘"}
          </Badge>
          {story.ai_model && (
            <Badge variant="outline" className="text-xs border-purple-300">
              🤖 {story.ai_model}
            </Badge>
          )}
        </div>

        {/* Reading Controls */}
        <div className="flex flex-wrap items-center gap-4 py-4 border-b border-purple-200 bg-white/50 dark:bg-gray-800/50 rounded-lg px-4">
          <Button
            onClick={handleReadAloud}
            variant={isReading ? "destructive" : "default"}
            className={`gap-2 ${!isReading && "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"}`}
          >
            <Volume2 className={`h-4 w-4 ${isReading && "animate-pulse"}`} />
            {isReading
              ? languagePreference === "english"
                ? "Stop"
                : "停止"
              : languagePreference === "english"
                ? "Read Aloud"
                : "朗讀"}
          </Button>

          {story.jyutping && (
            <div className="flex items-center gap-2">
              <Switch
                id="show-jyutping"
                checked={showJyutping}
                onCheckedChange={setShowJyutping}
              />
              <Label htmlFor="show-jyutping" className="text-sm cursor-pointer">
                {languagePreference === "english"
                  ? "Show Jyutping"
                  : "顯示拼音"}
              </Label>
            </div>
          )}

          {story.content_english && (
            <div className="flex items-center gap-2">
              <Switch
                id="show-english"
                checked={showEnglish}
                onCheckedChange={setShowEnglish}
              />
              <Label htmlFor="show-english" className="text-sm cursor-pointer">
                {languagePreference === "english" ? "Show English" : "顯示英文"}
              </Label>
            </div>
          )}
        </div>

        {/* Story Content */}
        <div className="space-y-6 py-6 px-6 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-inner border-2 border-purple-100">
          <div className="flex items-center gap-2 text-purple-600 mb-4">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-150"></div>
          </div>

          {paragraphs.map((paragraph, index) => (
            <div
              key={index}
              className="space-y-3 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-100 first-letter:text-4xl first-letter:font-bold first-letter:text-purple-600 first-letter:mr-1 first-letter:float-left">
                {paragraph}
              </p>

              {showEnglish && story.content_english && (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic pl-4 border-l-2 border-purple-300 bg-purple-50/50 dark:bg-purple-900/20 py-2 rounded-r">
                  {story.content_english.split("\n")[index] || ""}
                </p>
              )}

              {showJyutping && story.jyutping && (
                <p className="text-xs text-purple-600 dark:text-purple-400 pl-4 bg-purple-50 dark:bg-purple-900/20 py-1 rounded">
                  {story.jyutping.split("\n")[index] || ""}
                </p>
              )}
            </div>
          ))}

          <div className="flex items-center gap-2 text-purple-600 mt-4 justify-center">
            <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
            <span className="text-2xl">✨</span>
            <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
          </div>
        </div>

        {/* Featured Words Section */}
        {story.word_usage && Object.keys(story.word_usage).length > 0 && (
          <div className="mt-6 p-6 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl border-2 border-purple-200">
            <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2 text-lg">
              <span className="text-2xl">📖</span>
              {languagePreference === "english" ? "Featured Words" : "故事詞語"}
            </h3>
            <div className="text-sm text-purple-700 dark:text-purple-300 mb-3">
              {languagePreference === "english"
                ? `${Object.keys(story.word_usage).length} words used in this story`
                : `故事中使用了 ${Object.keys(story.word_usage).length} 個詞語`}
            </div>
            <div className="space-y-3">
              {Object.entries(story.word_usage).map(([word, usage], idx) => (
                <div
                  key={word}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-[1.02] border border-purple-200 hover:border-purple-400 cursor-default"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="font-bold text-purple-700 dark:text-purple-300 text-lg mb-2">
                    {word}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {usage}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cultural References */}
        {story.cultural_references && story.cultural_references.length > 0 && (
          <div className="mt-4 p-6 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-xl border-2 border-yellow-200">
            <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-3 flex items-center gap-2 text-lg">
              <span className="text-2xl">🏙️</span>
              {languagePreference === "english"
                ? "Cultural Elements"
                : "文化元素"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {story.cultural_references.map((ref, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="bg-white dark:bg-gray-800 border-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                >
                  {ref}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Footer with read count */}
        <div className="mt-6 pt-4 border-t border-purple-200 text-center">
          {story.read_count > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4" />
              {languagePreference === "english"
                ? `Read ${story.read_count} time${story.read_count > 1 ? "s" : ""}`
                : `已閱讀 ${story.read_count} 次`}
            </p>
          )}
          <p className="text-xs mt-2 text-gray-400">
            {new Date(story.generation_date).toLocaleString("zh-HK")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
