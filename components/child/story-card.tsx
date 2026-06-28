"use client";

import { Clock, CheckCircle, Play, BookOpen, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// --- TYPES ---
// Compact display data for bedtime story cards.
export interface StoryCardData {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  emoji?: string;
  color?: string; // "blue", "orange", "purple", etc.
}

interface StoryCardProps {
  story: StoryCardData;
  onRead: (story: StoryCardData) => void;
  onPlayAudio?: (story: StoryCardData) => void;
  isAudioPlaying?: boolean;
  isAudioLoading?: boolean;
}

// --- HELPER: Pastel Color Mapping ---
const getCoverStyles = (color: string = "blue", completed: boolean) => {
  const map: Record<string, string> = {
    purple: "bg-purple-100 text-purple-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    pink: "bg-pink-100 text-pink-600",
    yellow: "bg-yellow-100 text-yellow-600",
  };

  const baseColor = map[color] || map.blue;

  if (completed) {
    return "bg-emerald-100 text-emerald-600 border-emerald-400 opacity-80";
  }

  return baseColor;
};

export function StoryCard({
  story,
  onRead,
  onPlayAudio,
  isAudioPlaying = false,
  isAudioLoading = false,
}: StoryCardProps) {
  // Emoji Fallbacks if not in DB
  const storyEmojis: Record<string, string> = {
    "The Hungry Caterpillar": "🐛",
    "Colors All Around": "🌈",
    "Animal Friends": "🦊",
    "Space Adventure": "🚀",
  };

  const displayEmoji = story.emoji || storyEmojis[story.title] || "📖";
  const styles = getCoverStyles(story.color || "blue", story.completed);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onRead(story)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onRead(story);
        }
      }}
      className={cn(
        "group relative flex flex-col rounded-4xl overflow-hidden min-w-[17rem] w-[17rem] h-[23rem] cursor-pointer",
        "border-4 transition-all duration-300",
        "hover:scale-105 active:scale-95 shadow-sm hover:shadow-xl",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-300",
        story.completed
          ? "border-emerald-400"
          : "border-white hover:border-purple-200",
        "bg-white",
      )}
    >
      <div
        className={cn(
          "flex-1 w-full flex flex-col items-center justify-center relative p-5",
          styles,
        )}
      >
        {story.completed && (
          <div className="absolute top-4 right-4 bg-white text-emerald-500 rounded-full p-2 shadow-sm">
            <CheckCircle className="w-6 h-6 fill-emerald-100" />
          </div>
        )}

        <span className="text-9xl drop-shadow-sm filter transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
          {displayEmoji}
        </span>
      </div>

      <div className="p-6 bg-white w-full text-left flex flex-col justify-between h-36">
        <div>
          <h3 className="child-tab-section-title !mt-0 !text-base !leading-tight !text-slate-700 group-hover:!text-purple-600 transition-colors">
            {story.title}
          </h3>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="child-tab-card-title flex items-center gap-2 !mt-0 !text-lg !text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
            <Clock className="w-4 h-4" />
            {story.duration}
          </span>

          {onPlayAudio && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onPlayAudio(story);
              }}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              aria-label={`播放 ${story.title}`}
            >
              <Play
                className={cn(
                  "w-4.5 h-4.5 fill-current ml-0.5 text-slate-500",
                  (isAudioPlaying || isAudioLoading) && "animate-pulse",
                )}
              />
            </button>
          )}

          {!story.completed && !onPlayAudio && (
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#38BDF8] group-hover:text-white transition-colors">
              <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- LIST COMPONENT ---

interface StoriesListProps {
  stories: StoryCardData[];
  onReadStory: (story: StoryCardData) => void;
}

export function StoriesList({ stories, onReadStory }: StoriesListProps) {
  return (
    // Wrapped in Glass Card for visibility on night background
    <section className="bg-white/80 backdrop-blur-md rounded-[40px] p-6 md:p-8 shadow-sm border border-white/50 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-400 p-2.5 rounded-2xl shadow-sm -rotate-3">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="child-tab-compact-title !text-slate-700">
            故事時間
          </h2>
          <p className="child-tab-compact-copy">重溫你最愛的故事！</p>
        </div>
      </div>

      {/* Horizontal Scroll List */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-2 -mx-4 md:mx-0 scrollbar-hide snap-x">
        {stories.map((story) => (
          <div key={story.id} className="snap-center">
            <StoryCard story={story} onRead={onReadStory} />
          </div>
        ))}

        {/* "More" Placeholder Card (Optional) */}
        <div className="min-w-28 flex items-center justify-center opacity-50">
          <div className="text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Star className="w-6 h-6 text-slate-400" />
            </div>
            <p className="child-tab-compact-copy !text-sm">
              更多故事
              <br />
              即將推出
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
