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
  Languages,
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
  const [showEnglish, setShowEnglish] = useState(
    languagePreference === "bilingual",
  );

  const { speak, stop } = useSpeech();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAllAudio = () => {
    stop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0);
      stopAllAudio();
      setShowSettings(false);
    }
    return () => {
      stopAllAudio();
    };
  }, [isOpen, story]);

  if (!story) return null;

  // --- CONTENT SPLITTING LOGIC ---
  const pages = useMemo(() => {
    const sentences =
      story.content_cantonese?.split(/(?<=[.!?。！？])\s+/) || [];
    const engSentences = story.content_english?.split(/(?<=[.!?])\s+/) || [];
    const jyutSentences = story.jyutping?.split("\n") || [];

    const chunks = [];
    let currentChunk = { cantonese: "", english: "", jyutping: "" };
    let count = 0;

    sentences.forEach((sentence, i) => {
      currentChunk.cantonese += sentence + " ";
      if (engSentences[i]) currentChunk.english += engSentences[i] + " ";
      if (jyutSentences[i]) currentChunk.jyutping += jyutSentences[i] + " ";

      count++;
      if (count >= 3 || i === sentences.length - 1) {
        chunks.push({ ...currentChunk });
        currentChunk = { cantonese: "", english: "", jyutping: "" };
        count = 0;
      }
    });

    return chunks;
  }, [story]);

  const totalPages = pages.length + 1;
  const isStatsPage = currentPage === pages.length;

  // --- AUDIO ---
  const handlePlayPage = () => {
    if (isPlaying) {
      stopAllAudio();
      setIsPlaying(false);
    } else {
      if (story.audio_url) {
        try {
          const audio = new Audio(story.audio_url);
          audioRef.current = audio;
          setIsPlaying(true);
          audio.onended = () => setIsPlaying(false);
          audio.onerror = () => setIsPlaying(false);
          void audio.play();
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
    stopAllAudio();
    setIsPlaying(false);
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    } else {
      if (onComplete) onComplete(story.id);
      onClose();
    }
  };

  const handlePrev = () => {
    stopAllAudio();
    setIsPlaying(false);
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90dvh] max-h-[90dvh] p-0 bg-transparent border-none shadow-none flex items-stretch justify-center overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{story.title || "Bedtime story"}</DialogTitle>
          <DialogDescription>
            {`Story reader dialog with ${totalPages} pages.`}
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
                    ? "完 (The End)"
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
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-[#D7CCC8]">
                <Languages className="w-4 h-4 text-slate-400" />
                <Label
                  htmlFor="english"
                  className="text-sm font-bold text-slate-600"
                >
                  英文 (English)
                </Label>
                <Switch
                  id="english"
                  checked={showEnglish}
                  onCheckedChange={setShowEnglish}
                />
              </div>
            </div>
          </div>

          {/* MAIN PAGE AREA */}
          <div className="flex-1 p-6 md:p-12 overflow-y-auto overscroll-contain min-h-0 flex flex-col relative bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
            {!isStatsPage ? (
              // --- STORY PAGES ---
              <div className="flex flex-col h-full justify-center items-center text-center space-y-8 animate-in fade-in duration-500 key={currentPage}">
                {/* Cantonese */}
                <p className="text-2xl md:text-4xl font-black text-slate-800 leading-relaxed tracking-tight">
                  {pages[currentPage]?.cantonese}
                </p>

                {/* Jyutping */}
                {showJyutping && pages[currentPage]?.jyutping && (
                  <p className="text-sm md:text-base font-mono text-purple-600 bg-purple-50 px-4 py-2 rounded-xl inline-block border border-purple-100">
                    {pages[currentPage].jyutping}
                  </p>
                )}

                {/* English */}
                {showEnglish && pages[currentPage]?.english && (
                  <p className="text-lg md:text-xl font-medium text-slate-500 italic font-serif">
                    "{pages[currentPage].english}"
                  </p>
                )}

                {/* Page Number Footer */}
                <div className="absolute bottom-4 text-slate-300 text-xs font-bold">
                  - {currentPage + 1} -
                </div>
              </div>
            ) : (
              // --- STATS / END PAGE ---
              <div className="w-full space-y-6 animate-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Star className="w-10 h-10 text-yellow-500 fill-yellow-500" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800">
                    故事讀完了！
                  </h2>
                  <p className="text-slate-500 font-bold">
                    做得好！ Great Job!
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
