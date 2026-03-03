"use client";

import { useState } from "react";
import { Volume2, ChevronRight, Sparkles, Star, Lightbulb } from "lucide-react";
import type { Word, LanguagePreference } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
// Ensure you have this hook, or replace with standard synthesis
import { useSpeech } from "@/lib/speech"; 
import {
  getWordText,
  getDefinition,
  getPronunciation,
  getSpeechText,
} from "@/lib/language-utils";

interface WordOfTheDayProps {
  word: Word;
  onLearnMore: (word: Word) => void;
  languagePreference?: LanguagePreference;
}

export function WordOfTheDay({
  word,
  onLearnMore,
  languagePreference = "cantonese",
}: WordOfTheDayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { speak } = useSpeech();

  // Get localized content using your helpers
  const wordText = getWordText(word, languagePreference);
  const definition = getDefinition(word, languagePreference);
  const pronunciation = getPronunciation(word, languagePreference);
  const speechText = getSpeechText(word, languagePreference);

  const playPronunciation = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(speechText, {
      rate: 0.8,
      pitch: 1.1, // Slightly higher pitch for kid-friendly voice
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
    });
  };

  return (
    <section className="bg-white/80 backdrop-blur-md rounded-[40px] p-6 shadow-sm border border-white/50 relative overflow-hidden w-full group">
      
      {/* --- Decorative Elements --- */}
      <div className="absolute top-0 right-0 p-4 opacity-50 pointer-events-none">
        <Sparkles className="w-12 h-12 text-yellow-300 fill-yellow-100 animate-pulse" />
      </div>

      {/* --- Header --- */}
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="bg-yellow-400 p-2.5 rounded-2xl shadow-sm rotate-3">
          <Lightbulb className="w-6 h-6 text-white fill-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-700 tracking-tight">
             今日單字
          </h2>
          <p className="text-sm font-bold text-slate-400">
             Word of the Day
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 relative z-10">
        {/* --- Left: Image --- */}
        <div className="relative shrink-0 mx-auto sm:mx-0">
            {/* XP Badge */}
            {word.exposureCount === 0 && (
                <div className="absolute -top-2 -left-2 z-20 bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-md border-2 border-white flex items-center gap-1 animate-bounce">
                <Star className="w-3 h-3 fill-current" />
                +10 XP
                </div>
            )}
            
            <div className="w-32 h-32 rounded-[32px] bg-white flex items-center justify-center border-4 border-slate-50 shadow-sm overflow-hidden group-hover:scale-105 transition-transform duration-500">
                {word.image && word.image.startsWith("http") ? (
                    <img
                    src={word.image}
                    alt={word.word}
                    className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-6xl drop-shadow-sm filter">
                        {word.image || "📝"}
                    </span>
                )}
            </div>
        </div>

        {/* --- Right: Content --- */}
        <div className="flex-1 min-w-0 flex flex-col justify-center text-center sm:text-left">
          
          {/* Word & Audio */}
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                {wordText}
            </h3>
            <button
              onClick={playPronunciation}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm border-2 border-transparent",
                isPlaying 
                    ? "bg-[#38BDF8] text-white scale-110 border-blue-200" 
                    : "bg-slate-100 text-[#38BDF8] hover:bg-[#38BDF8] hover:text-white"
              )}
              aria-label="Play sound"
            >
              <Volume2 className={cn("w-5 h-5", isPlaying && "animate-pulse")} />
            </button>
          </div>

          {/* Pronunciation Pill */}
          {pronunciation && (
            <div className="mb-3">
                <span className="bg-slate-100 text-slate-500 text-sm font-bold px-3 py-1 rounded-full inline-block">
                {pronunciation}
                </span>
            </div>
          )}

          {/* Definition */}
          <p className="text-slate-600 font-medium leading-relaxed line-clamp-2 bg-slate-50/50 rounded-xl p-2 sm:p-0 sm:bg-transparent">
            {definition}
          </p>
        </div>
      </div>

      {/* --- Bottom: Action Button --- */}
      <Button
        onClick={() => onLearnMore(word)}
        className="w-full mt-6 h-14 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white shadow-lg hover:shadow-orange-200 hover:scale-[1.02] transition-all duration-300 border-b-4 border-orange-600/20 active:border-b-0 active:translate-y-1"
      >
        <span className="text-lg font-black tracking-wide mr-2">
            學習這個單字
        </span>
        <div className="bg-white/20 rounded-full p-1">
            <ChevronRight className="w-5 h-5 text-white" />
        </div>
      </Button>

    </section>
  );
}