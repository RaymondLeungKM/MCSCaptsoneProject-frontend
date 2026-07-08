"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Volume2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Star,
  Settings,
  Type,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSpeech } from "@/lib/speech";
import type { GeneratedStory, LanguagePreference } from "@/lib/types";

interface BedtimeStoryReaderProps {
  isOpen: boolean;
  onClose: () => void;
  story: GeneratedStory | null;
  languagePreference?: LanguagePreference;
  onComplete?: (storyId: string) => void;
}

export function BedtimeStoryReader({
  isOpen,
  onClose,
  story,
  languagePreference = "cantonese",
  onComplete,
}: BedtimeStoryReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [showJyutping, setShowJyutping] = useState(
    languagePreference !== "english",
  );

  const { speak, stop } = useSpeech();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedPageRef = useRef<number | null>(null);
  const pageAudioEndTimeRef = useRef<number | null>(null);
  const STORY_PAGE_TARGET_CHARS = 120;

  // Thematic decorations shown when no AI image has been generated yet
  const PAGE_DECORATIONS = [
    { emoji: "🌅", gradient: "from-amber-100 via-orange-100 to-yellow-50" },
    { emoji: "🌳", gradient: "from-green-100 via-emerald-100 to-teal-50" },
    { emoji: "⭐", gradient: "from-purple-100 via-violet-100 to-indigo-50" },
    { emoji: "🌙", gradient: "from-blue-100 via-sky-100 to-slate-50" },
  ] as const;

  const resetPlayback = () => {
    stop();
    if (audioRef.current) {
      audioRef.current.ontimeupdate = null;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    pageAudioEndTimeRef.current = null;
    lastPlayedPageRef.current = null;
    setIsPlaying(false);
  };

  const pausePlaybackForNavigation = () => {
    if (audioRef.current) {
      audioRef.current.ontimeupdate = null;
      audioRef.current.pause();
    } else {
      stop();
    }
    pageAudioEndTimeRef.current = null;
    lastPlayedPageRef.current = null;
    setIsPlaying(false);
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0);
      resetPlayback();
      setShowSettings(false);
    }
    return () => {
      resetPlayback();
    };
  }, [isOpen, story]);

  const resolvedStoryAudioUrl = (() => {
    if (!story?.audio_url) {
      return null;
    }

    if (
      story.audio_url.startsWith("http://") ||
      story.audio_url.startsWith("https://")
    ) {
      return story.audio_url;
    }

    if (typeof window === "undefined") {
      return story.audio_url;
    }

    return new URL(story.audio_url, window.location.origin).toString();
  })();

  if (!story) return null;

  const pages = useMemo(() => {
    const getNarrativeChunks = (
      text: string,
    ): { chunks: string[]; joiner: string } => {
      if (!text.trim()) {
        return { chunks: [], joiner: " " };
      }

      const paragraphs = text
        .split(/\n+/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

      if (paragraphs.length > 1) {
        return { chunks: paragraphs, joiner: "\n\n" };
      }

      const sentences = text
        .split(/(?<=[.!?。！？])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);

      return {
        chunks: sentences.length > 0 ? sentences : [text.trim()],
        joiner: " ",
      };
    };

    const paginateNarrative = (text: string, targetChars: number): string[] => {
      if (!text.trim()) {
        return [""];
      }

      const { chunks, joiner } = getNarrativeChunks(text);
      const storyPages: string[] = [];
      let currentChunk = "";

      for (const chunk of chunks) {
        const candidate = currentChunk
          ? `${currentChunk}${joiner}${chunk}`
          : chunk;

        if (currentChunk && candidate.length > targetChars) {
          storyPages.push(currentChunk.trim());
          currentChunk = chunk;
        } else {
          currentChunk = candidate;
        }
      }

      if (currentChunk) {
        storyPages.push(currentChunk.trim());
      }

      return storyPages.length > 0 ? storyPages : [text.trim()];
    };

    const splitNarrativeAcrossPageCount = (
      text: string,
      pageCount: number,
    ): string[] => {
      if (pageCount <= 0) {
        return [];
      }

      if (!text.trim()) {
        return Array(pageCount).fill("");
      }

      const { chunks, joiner } = getNarrativeChunks(text);
      if (chunks.length <= pageCount) {
        return Array.from(
          { length: pageCount },
          (_, index) => chunks[index]?.trim() ?? "",
        );
      }

      const partSize = Math.ceil(chunks.length / pageCount);
      return Array.from({ length: pageCount }, (_, index) =>
        chunks
          .slice(index * partSize, (index + 1) * partSize)
          .join(joiner)
          .trim(),
      );
    };

    const splitLinesAcrossPageCount = (
      text: string,
      pageCount: number,
    ): string[] => {
      if (pageCount <= 0) {
        return [];
      }

      if (!text.trim()) {
        return Array(pageCount).fill("");
      }

      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length <= pageCount) {
        return Array.from(
          { length: pageCount },
          (_, index) => lines[index]?.trim() ?? "",
        );
      }

      const partSize = Math.ceil(lines.length / pageCount);
      return Array.from({ length: pageCount }, (_, index) =>
        lines
          .slice(index * partSize, (index + 1) * partSize)
          .join(" ")
          .trim(),
      );
    };

    const cantParts = paginateNarrative(
      story.content_cantonese ?? "",
      STORY_PAGE_TARGET_CHARS,
    );
    const storyPageCount = Math.max(cantParts.length, 1);
    const engParts = splitNarrativeAcrossPageCount(
      story.content_english ?? "",
      storyPageCount,
    );
    const jyutParts = splitLinesAcrossPageCount(
      story.jyutping ?? "",
      storyPageCount,
    );

    return Array.from({ length: storyPageCount }, (_, i) => ({
      cantonese: cantParts[i] ?? "",
      english: engParts[i] ?? "",
      jyutping: jyutParts[i] ?? "",
      imageUrl: story.part_images?.[i] ?? null,
    }));
  }, [story]);

  const totalPages = pages.length + 1;
  const isStatsPage = currentPage === pages.length;
  const storyVocabulary = useMemo(() => {
    const featuredWords = story.featured_words
      .flatMap((word) => word.split(/[\n,、，]+/))
      .map((word) => word.trim())
      .filter(Boolean);

    if (featuredWords.length > 0) {
      return featuredWords;
    }

    if (story.vocab_used) {
      return story.vocab_used
        .split(/[\n,、，]+/)
        .map((word) => word.trim())
        .filter(Boolean);
    }

    if (story.word_usage) {
      return Object.keys(story.word_usage)
        .map((word) => word.trim())
        .filter(Boolean);
    }

    return [] as string[];
  }, [story.featured_words, story.vocab_used, story.word_usage]);
  const vocabularyEntries = useMemo(() => {
    if (story.word_usage) {
      return Object.entries(story.word_usage)
        .map(([word, usage]) => ({
          word: word.trim(),
          usage: usage.trim(),
        }))
        .filter((entry) => entry.word.length > 0);
    }

    return storyVocabulary.map((word) => ({ word, usage: null }));
  }, [story.word_usage, storyVocabulary]);
  const storyKeepsakeDate = useMemo(() => {
    const rawDate =
      story.generated_at || story.generation_date || story.created_at;

    if (!rawDate) {
      return "";
    }

    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return rawDate;
    }

    return new Intl.DateTimeFormat("zh-HK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(parsedDate);
  }, [story.created_at, story.generated_at, story.generation_date]);

  const pageAudioRatios = useMemo(() => {
    if (pages.length === 0) {
      return [] as Array<{ startRatio: number; endRatio: number }>;
    }

    const pageCharCounts = pages.map((page) => page.cantonese.trim().length);
    const totalChars = pageCharCounts.reduce((sum, count) => sum + count, 0);

    if (totalChars <= 0) {
      return Array.from({ length: pages.length }, (_, index) => ({
        startRatio: index / pages.length,
        endRatio: (index + 1) / pages.length,
      }));
    }

    let cumulativeChars = 0;
    return pageCharCounts.map((count) => {
      const startRatio = cumulativeChars / totalChars;
      cumulativeChars += count;
      return {
        startRatio,
        endRatio: cumulativeChars / totalChars,
      };
    });
  }, [pages]);

  const waitForAudioMetadata = (audio: HTMLAudioElement) =>
    new Promise<void>((resolve, reject) => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        resolve();
        return;
      }

      const handleLoadedMetadata = () => {
        cleanup();
        resolve();
      };

      const handleError = () => {
        cleanup();
        reject(new Error("Failed to load story audio metadata"));
      };

      const cleanup = () => {
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("error", handleError);
      };

      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("error", handleError);

      if (audio.readyState >= 1) {
        cleanup();
        resolve();
      }
    });

  const seekAudioToCurrentPage = async (audio: HTMLAudioElement) => {
    await waitForAudioMetadata(audio);

    if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
      return;
    }

    const safePageIndex = Math.max(
      0,
      Math.min(currentPage, pageAudioRatios.length - 1),
    );
    const pageAudioRatio = pageAudioRatios[safePageIndex] ?? {
      startRatio: 0,
      endRatio: 1,
    };
    const targetTime = Math.min(
      Math.max(pageAudioRatio.startRatio * audio.duration, 0),
      Math.max(audio.duration - 0.05, 0),
    );
    const pageEndTime = Math.min(
      Math.max(pageAudioRatio.endRatio * audio.duration, targetTime + 0.05),
      audio.duration,
    );

    audio.currentTime = targetTime;
    pageAudioEndTimeRef.current = pageEndTime;
    audio.ontimeupdate = () => {
      const currentPageEndTime = pageAudioEndTimeRef.current;

      if (currentPageEndTime === null) {
        return;
      }

      if (audio.currentTime >= currentPageEndTime - 0.05) {
        audio.ontimeupdate = null;
        pageAudioEndTimeRef.current = null;
        audio.pause();
        audio.currentTime = targetTime;
        lastPlayedPageRef.current = null;
      }
    };
    lastPlayedPageRef.current = safePageIndex;
  };

  const createStoryAudio = () => {
    if (!resolvedStoryAudioUrl) {
      return null;
    }

    if (audioRef.current) {
      audioRef.current.ontimeupdate = null;
      audioRef.current.pause();
    }

    const audio = new Audio(resolvedStoryAudioUrl);
    audioRef.current = audio;
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => {
      pageAudioEndTimeRef.current = null;
      setIsPlaying(false);
      audio.currentTime = 0;
      lastPlayedPageRef.current = null;
    };
    audio.onerror = () => {
      pageAudioEndTimeRef.current = null;
      setIsPlaying(false);
      lastPlayedPageRef.current = null;
    };
    return audio;
  };

  // --- AUDIO ---
  const handlePlayPage = async () => {
    if (isPlaying) {
      pausePlaybackForNavigation();
    } else {
      if (resolvedStoryAudioUrl) {
        try {
          let audio = audioRef.current;

          if (!audio || audio.src !== resolvedStoryAudioUrl) {
            audio = createStoryAudio();
          }

          if (!audio) {
            throw new Error("Story audio is not available");
          }

          if (lastPlayedPageRef.current !== currentPage) {
            await seekAudioToCurrentPage(audio);
          }

          await audio.play();
        } catch {
          const textToRead = pages[currentPage]?.cantonese || "故事結束";
          setIsPlaying(true);
          speak(textToRead, {
            rate: 0.9,
            onEnd: () => setIsPlaying(false),
          });
        }
      } else {
        const textToRead = pages[currentPage]?.cantonese || "故事結束";
        setIsPlaying(true);
        speak(textToRead, {
          rate: 0.9,
          onEnd: () => setIsPlaying(false),
        });
      }
    }
  };

  // --- NAVIGATION ---
  const handleNext = () => {
    pausePlaybackForNavigation();
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    } else {
      if (onComplete) onComplete(story.id);
      onClose();
    }
  };

  const handlePrev = () => {
    pausePlaybackForNavigation();
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[100vw] sm:max-w-3xl md:max-w-4xl w-full h-[100dvh] sm:h-[90dvh] max-h-[100dvh] sm:max-h-[90dvh] p-0 bg-transparent border-none shadow-none flex items-center justify-center overflow-hidden"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{story.title || "睡前故事"}</DialogTitle>
          <DialogDescription>
            {`故事閱讀視窗，共 ${totalPages} 頁。`}
          </DialogDescription>
        </DialogHeader>

        {/* --- BOOK CONTAINER --- */}
        <div className="relative w-full max-w-3xl bg-[#FFF9F0] rounded-2xl sm:rounded-[40px] shadow-2xl border-4 sm:border-[12px] border-[#5D4037] overflow-hidden flex flex-col h-full max-h-full min-h-0 animate-in zoom-in-95 duration-300">
          {/* HEADER (Book Spine) */}
          <div className="bg-[#5D4037] p-4 flex items-center justify-between text-white shadow-md z-10">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-lg line-clamp-1 leading-tight">
                  {story.title}
                </h2>
                <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">
                  {isStatsPage
                    ? "完結"
                    : `第 ${currentPage + 1} 頁 / 共 ${totalPages} 頁`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Settings Toggle */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  showSettings
                    ? "bg-white text-[#5D4037]"
                    : "bg-white/10 hover:bg-white/20",
                )}
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-sm"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* SETTINGS DRAWER */}
          <div
            className={cn(
              "bg-[#EFEBE9] border-b border-[#D7CCC8] overflow-hidden transition-all duration-300 ease-in-out",
              showSettings ? "max-h-32 p-4" : "max-h-0 p-0",
            )}
          >
            <div className="flex flex-wrap gap-6 justify-center">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-[#D7CCC8]">
                <Type className="w-4 h-4 text-slate-400" />
                <Label
                  htmlFor="jyutping"
                  className="text-sm font-bold text-slate-600"
                >
                  拼音 (Jyutping)
                </Label>
                <Switch
                  id="jyutping"
                  checked={showJyutping}
                  onCheckedChange={setShowJyutping}
                />
              </div>
            </div>
          </div>

          {/* MAIN PAGE AREA */}
          <div className="flex-1 p-4 md:p-6 overflow-hidden overscroll-contain min-h-0 flex flex-col relative bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
            {!isStatsPage ? (
              // --- STORY PAGES ---
              <div
                key={currentPage}
                className="flex flex-col h-full min-h-0 animate-in fade-in duration-500"
              >
                {/* Illustration Area */}
                <div className="shrink-0 w-full rounded-2xl overflow-hidden relative mb-4 shadow-md h-36 sm:h-44 md:h-[210px]">
                  {pages[currentPage]?.imageUrl ? (
                    <img
                      src={pages[currentPage].imageUrl}
                      alt={`第 ${currentPage + 1} 頁插圖`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={cn(
                        "w-full h-full flex items-center justify-center bg-linear-to-br",
                        PAGE_DECORATIONS[currentPage % PAGE_DECORATIONS.length]
                          ?.gradient,
                      )}
                    >
                      <span className="text-8xl select-none drop-shadow-sm">
                        {
                          PAGE_DECORATIONS[
                            currentPage % PAGE_DECORATIONS.length
                          ]?.emoji
                        }
                      </span>
                    </div>
                  )}
                  {/* Page badge */}
                  <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#5D4037] shadow-sm">
                    第 {currentPage + 1} 頁
                  </div>
                </div>

                {/* Text Area */}
                <div className="flex-1 min-h-0 flex flex-col justify-start items-stretch md:items-center text-left md:text-center space-y-4 overflow-y-auto pt-2 pb-20 md:pb-8 px-1 md:px-0">
                  {/* Cantonese */}
                  <p className="whitespace-pre-wrap text-2xl md:text-[2.25rem] font-black text-slate-800 leading-relaxed tracking-tight">
                    {pages[currentPage]?.cantonese}
                  </p>

                  {/* Jyutping */}
                  {showJyutping && pages[currentPage]?.jyutping && (
                    <p className="text-base md:text-lg font-mono text-purple-600 bg-purple-50 px-4 py-2 rounded-xl inline-block border border-purple-100">
                      {pages[currentPage].jyutping}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              // --- STATS / END PAGE ---
              <div className="w-full h-full overflow-y-auto space-y-6 animate-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Star className="w-10 h-10 text-yellow-500 fill-yellow-500" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800">
                    故事讀完了！
                  </h2>
                  <p className="text-slate-500 font-bold">做得好！</p>
                </div>

                {/* Cultural References */}
                {story.cultural_references &&
                  story.cultural_references.length > 0 && (
                    <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                      <h3 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                        <span className="text-xl">🏙️</span> 文化小知識
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {story.cultural_references.map((ref, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-white text-orange-600 border border-orange-200"
                          >
                            {ref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Words Used In Story */}
                {vocabularyEntries.length > 0 && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
                    <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <span className="text-xl">📖</span> 故事詞彙
                    </h3>
                    <div className="space-y-3">
                      {vocabularyEntries.map((entry) => (
                        <div
                          key={`${story.id}-${entry.word}`}
                          className="rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-sm"
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <span className="text-xl font-black text-blue-700 sm:text-2xl">
                              {entry.word}
                            </span>
                            {entry.usage && (
                              <span className="text-sm font-semibold leading-relaxed text-slate-500 sm:max-w-[60%] sm:text-right">
                                {entry.usage}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center pt-4 text-slate-400">
                  <p className="text-xs font-semibold tracking-[0.2em] text-slate-400/90 sm:text-sm">
                    睡前故事珍藏
                  </p>
                  {storyKeepsakeDate && (
                    <p className="mt-1 text-sm font-medium text-slate-400 sm:text-base">
                      {storyKeepsakeDate}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER CONTROLS */}
          <div className="p-4 md:p-6 bg-[#EFEBE9] border-t border-[#D7CCC8] flex items-center justify-between gap-4 relative z-10">
            {/* Prev Button */}
            <Button
              onClick={handlePrev}
              disabled={currentPage === 0}
              variant="ghost"
              className="h-14 w-14 rounded-full hover:bg-black/5 disabled:opacity-20 transition-all"
            >
              <ChevronLeft className="w-8 h-8 text-[#5D4037]" />
            </Button>

            {/* Play Button */}
            {!isStatsPage && (
              <button
                onClick={handlePlayPage}
                className={cn(
                  "h-18 w-18 md:h-20 md:w-20 rounded-full flex items-center justify-center shadow-xl transition-all border-[6px] border-[#FFF9F0] absolute left-1/2 -translate-x-1/2 -top-10",
                  isPlaying
                    ? "bg-orange-400 scale-110"
                    : "bg-[#38BDF8] hover:bg-[#0EA5E9] hover:scale-105",
                )}
              >
                <Volume2
                  className={cn(
                    "w-8 h-8 text-white fill-current",
                    isPlaying && "animate-pulse",
                  )}
                />
              </button>
            )}

            {/* Next Button */}
            <Button
              onClick={handleNext}
              className={cn(
                "h-14 px-8 rounded-full font-black text-lg transition-all shadow-md",
                isStatsPage
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-[#5D4037] hover:bg-[#4E342E] text-white",
              )}
            >
              {isStatsPage ? "完成 Finish" : "下一頁"}
              {isStatsPage ? (
                <Star className="w-5 h-5 ml-2 fill-current" />
              ) : (
                <ChevronRight className="w-6 h-6 ml-1" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
