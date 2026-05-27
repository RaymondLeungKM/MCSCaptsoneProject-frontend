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
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const pausePlaybackForNavigation = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    } else {
      stop();
    }
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

  if (!story) return null;

  const pages = useMemo(() => {
    const getNarrativeChunks = (text: string): { chunks: string[]; joiner: string } => {
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

  const createStoryAudio = () => {
    if (!story?.audio_url) {
      return null;
    }

    const audio = new Audio(story.audio_url);
    audioRef.current = audio;
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => {
      setIsPlaying(false);
      audio.currentTime = 0;
    };
    audio.onerror = () => setIsPlaying(false);
    return audio;
  };

  // --- AUDIO ---
  const handlePlayPage = async () => {
    if (isPlaying) {
      pausePlaybackForNavigation();
    } else {
      if (story.audio_url) {
        try {
          let audio = audioRef.current;

          if (!audio || audio.src !== story.audio_url) {
            audio = createStoryAudio();
          }

          if (!audio) {
            throw new Error("Story audio is not available");
          }

          if (
            audio.duration &&
            audio.currentTime >= Math.max(audio.duration - 0.25, 0)
          ) {
            audio.currentTime = 0;
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
      <DialogContent className="max-w-4xl w-full h-[90dvh] max-h-[90dvh] p-0 bg-transparent border-none shadow-none flex items-stretch justify-center overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{story.title || "睡前故事"}</DialogTitle>
          <DialogDescription>
            {`故事閱讀視窗，共 ${totalPages} 頁。`}
          </DialogDescription>
        </DialogHeader>

        {/* --- BOOK CONTAINER --- */}
        <div className="relative w-full max-w-3xl bg-[#FFF9F0] rounded-[40px] shadow-2xl border-[12px] border-[#5D4037] overflow-hidden flex flex-col h-full max-h-full min-h-0 animate-in zoom-in-95 duration-300">
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
                <div
                  className="shrink-0 w-full rounded-2xl overflow-hidden relative mb-4 shadow-md h-36 sm:h-44 md:h-[210px]"
                >
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
                          PAGE_DECORATIONS[currentPage % PAGE_DECORATIONS.length]
                            ?.emoji
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
                  <p className="text-slate-500 font-bold">
                    做得好！
                  </p>
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

                {/* Word Usage */}
                {story.word_usage && (
                  <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                    <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <span className="text-xl">📖</span> 故事詞彙
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(story.word_usage).map(
                        ([word, usage], idx) => (
                          <div
                            key={idx}
                            className="bg-white p-2 rounded-lg text-sm border border-blue-100 flex justify-between px-3"
                          >
                            <span className="font-bold text-slate-700">
                              {word}
                            </span>
                            <span className="text-slate-400 text-xs">
                              {usage}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                <div className="text-center pt-4 text-slate-400 text-xs">
                  <p>
                    {story.ai_model ? `由 ${story.ai_model} 生成` : "AI Story"}
                  </p>
                  <p>{new Date(story.generation_date).toLocaleDateString()}</p>
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
