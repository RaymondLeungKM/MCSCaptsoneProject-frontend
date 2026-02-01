"use client";

import { useState } from "react";
import { X, Volume2, Heart, Moon } from "lucide-react";
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="h-6 w-6 text-purple-600" />
              <DialogTitle className="text-2xl">
                {showEnglish && story.title_english
                  ? story.title_english
                  : story.title}
              </DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Story Metadata */}
        <div className="flex flex-wrap gap-2 pb-4 border-b">
          {story.theme && <Badge variant="secondary">{story.theme}</Badge>}
          <Badge variant="outline">
            {story.featured_words.length}{" "}
            {languagePreference === "english" ? "words" : "詞語"}
          </Badge>
          <Badge variant="outline">
            {story.reading_time_minutes}{" "}
            {languagePreference === "english" ? "min" : "分鐘"}
          </Badge>
          {story.ai_model && (
            <Badge variant="outline" className="text-xs">
              AI: {story.ai_model}
            </Badge>
          )}
        </div>

        {/* Reading Controls */}
        <div className="flex flex-wrap items-center gap-4 py-4 border-b">
          <Button
            onClick={handleReadAloud}
            variant={isReading ? "destructive" : "default"}
            className="gap-2"
          >
            <Volume2 className="h-4 w-4" />
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
        <div className="space-y-6 py-6 px-4 bg-white/60 rounded-lg">
          {paragraphs.map((paragraph, index) => (
            <div key={index} className="space-y-2">
              <p className="text-lg leading-relaxed text-gray-800">
                {paragraph}
              </p>

              {showEnglish && story.content_english && (
                <p className="text-sm text-gray-600 italic pl-4 border-l-2 border-purple-200">
                  {story.content_english.split("\n")[index] || ""}
                </p>
              )}

              {showJyutping && story.jyutping && (
                <p className="text-xs text-purple-600 pl-4">
                  {story.jyutping.split("\n")[index] || ""}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Featured Words Section */}
        {story.word_usage && Object.keys(story.word_usage).length > 0 && (
          <div className="mt-6 p-4 bg-purple-100/50 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <span className="text-xl">📖</span>
              {languagePreference === "english" ? "Featured Words" : "故事詞語"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(story.word_usage).map(([word, usage]) => (
                <div key={word} className="bg-white p-3 rounded-md text-sm">
                  <div className="font-semibold text-purple-700">{word}</div>
                  <div className="text-xs text-gray-600 mt-1">{usage}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cultural References */}
        {story.cultural_references && story.cultural_references.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-100/50 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <span className="text-xl">🏙️</span>
              {languagePreference === "english"
                ? "Cultural Elements"
                : "文化元素"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {story.cultural_references.map((ref, idx) => (
                <Badge key={idx} variant="outline" className="bg-white">
                  {ref}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Footer with read count */}
        <div className="mt-6 pt-4 border-t text-center text-sm text-gray-500">
          {story.read_count > 0 && (
            <p>
              {languagePreference === "english"
                ? `Read ${story.read_count} time${story.read_count > 1 ? "s" : ""}`
                : `已閱讀 ${story.read_count} 次`}
            </p>
          )}
          <p className="text-xs mt-1 text-gray-400">
            {new Date(story.generation_date).toLocaleString("zh-HK")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
