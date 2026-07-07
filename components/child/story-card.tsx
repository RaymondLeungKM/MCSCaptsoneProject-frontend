"use client";

import {
  CalendarClock,
  Clock,
  CheckCircle,
  Play,
  BookOpen,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- TYPES ---
// Compact display data for bedtime story cards.
export interface StoryCardData {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  generatedAt?: string;
  emoji?: string;
  color?: string; // "blue", "orange", "purple", etc.
}

interface StoryCardProps {
  story: StoryCardData;
  onRead: (story: StoryCardData) => void;
  onPlayAudio?: (story: StoryCardData) => void;
  isAudioPlaying?: boolean;
  isAudioLoading?: boolean;
  variant?: "default" | "compact";
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

function formatStoryTimestamp(
  value: string | undefined,
  includeYear: boolean = false,
): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (!includeYear) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
    );
    const diffDays = Math.round(
      (today.getTime() - targetDay.getTime()) / (24 * 60 * 60 * 1000),
    );
    const timeLabel = new Intl.DateTimeFormat("zh-HK", {
      hour: "numeric",
      minute: "2-digit",
    }).format(parsed);

    if (diffDays === 0) {
      return `今日 ${timeLabel}`;
    }

    if (diffDays === 1) {
      return `昨日 ${timeLabel}`;
    }
  }

  return new Intl.DateTimeFormat("zh-HK", {
    ...(includeYear ? { year: "numeric" } : {}),
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export function StoryCard({
  story,
  onRead,
  onPlayAudio,
  isAudioPlaying = false,
  isAudioLoading = false,
  variant = "default",
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
  const generatedAtLabel = formatStoryTimestamp(story.generatedAt);
  const generatedAtTitle = formatStoryTimestamp(story.generatedAt, true);
  const statusLabel = story.completed ? "已閱讀" : "新故事";

  const actionButton = onPlayAudio ? (
    <button
      onClick={(event) => {
        event.stopPropagation();
        onPlayAudio(story);
      }}
      className={cn(
        "flex items-center justify-center rounded-full transition-colors",
        variant === "compact"
          ? "h-10 w-10 bg-slate-100 hover:bg-slate-200 sm:h-11 sm:w-11"
          : "h-10 w-10 bg-slate-100 hover:bg-slate-200",
      )}
      aria-label={`播放 ${story.title}`}
    >
      <Play
        className={cn(
          variant === "compact"
            ? "h-5 w-5 fill-current text-slate-500"
            : "w-4.5 h-4.5 fill-current ml-0.5 text-slate-500",
          (isAudioPlaying || isAudioLoading) && "animate-pulse",
        )}
      />
    </button>
  ) : variant === "compact" ? (
    <div className="rounded-full bg-sky-100 px-3.5 py-2 text-sm font-black text-sky-700 transition-colors group-hover:bg-sky-500 group-hover:text-white sm:px-4">
      重讀
    </div>
  ) : (
    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#38BDF8] group-hover:text-white transition-colors">
      <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
    </div>
  );

  if (variant === "compact") {
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
          "group relative flex min-h-[12rem] w-full cursor-pointer flex-col overflow-hidden rounded-[30px] border-4 bg-white shadow-sm transition-all duration-300 sm:min-h-[11rem] sm:flex-row",
          "hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-300",
          story.completed
            ? "border-emerald-300 hover:border-emerald-400"
            : "border-white hover:border-purple-200",
        )}
      >
        <div
          className={cn(
            "flex h-28 w-full shrink-0 items-center justify-center p-4 sm:h-auto sm:w-32",
            styles,
          )}
        >
          <span className="text-6xl drop-shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 sm:text-7xl">
            {displayEmoji}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                {generatedAtLabel && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-500"
                    title={generatedAtTitle ?? generatedAtLabel}
                  >
                    <CalendarClock className="h-3.5 w-3.5" />
                    {generatedAtLabel}
                  </span>
                )}
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1",
                    story.completed
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600",
                  )}
                >
                  {statusLabel}
                </span>
              </div>

              <h3 className="mt-2 line-clamp-2 text-base font-black leading-tight text-slate-700 transition-colors group-hover:text-purple-600 sm:mt-3 sm:text-xl">
                {story.title}
              </h3>
            </div>

            {story.completed && (
              <div className="hidden rounded-full bg-emerald-50 p-2 text-emerald-500 sm:block">
                <CheckCircle className="h-5 w-5 fill-emerald-100" />
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-500">
              <Clock className="h-4 w-4" />
              {story.duration}
            </span>
            <div className="flex items-center justify-end gap-2">
              {story.completed && (
                <div className="rounded-full bg-emerald-50 p-2 text-emerald-500 sm:hidden">
                  <CheckCircle className="h-5 w-5 fill-emerald-100" />
                </div>
              )}
              {actionButton}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        "group relative flex w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-4xl sm:w-[17rem] sm:min-w-[17rem] sm:h-[23rem]",
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
          "relative flex min-h-[13rem] w-full flex-1 flex-col items-center justify-center p-5 sm:min-h-0",
          styles,
        )}
      >
        {generatedAtLabel && (
          <div
            className="absolute left-3 top-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm sm:left-4 sm:top-4 sm:max-w-[12rem]"
            title={generatedAtTitle ?? generatedAtLabel}
          >
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{generatedAtLabel}</span>
          </div>
        )}

        {story.completed && (
          <div className="absolute top-4 right-4 bg-white text-emerald-500 rounded-full p-2 shadow-sm">
            <CheckCircle className="w-6 h-6 fill-emerald-100" />
          </div>
        )}

        <span className="text-8xl drop-shadow-sm filter transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 sm:text-9xl">
          {displayEmoji}
        </span>
      </div>

      <div className="flex w-full flex-col justify-between bg-white p-5 text-left sm:h-36 sm:p-6">
        <div>
          <h3 className="child-tab-section-title !mt-0 !text-base !leading-tight !text-slate-700 transition-colors group-hover:!text-purple-600">
            {story.title}
          </h3>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="child-tab-card-title flex items-center gap-2 !mt-0 !text-lg !text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
            <Clock className="w-4 h-4" />
            {story.duration}
          </span>
          {actionButton}
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
          <h2 className="child-tab-compact-title !text-slate-700">故事時間</h2>
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
