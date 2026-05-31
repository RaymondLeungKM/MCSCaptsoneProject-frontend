"use client";

import React from "react";
import { Word, LanguagePreference } from "@/lib/types";
import { Volume2, CheckCircle, Sparkles, Activity, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isBackendImageUrl,
  resolveBackendAssetUrl,
} from "@/lib/backend-assets";

interface WordCardProps {
  word: Word;
  languagePreference: LanguagePreference;
  onPlayAudio?: () => void;
  onClick?: () => void;
  className?: string;
}

export function WordCard({
  word,
  languagePreference,
  onPlayAudio,
  onClick,
  className = "",
}: WordCardProps) {
  const showCantonese =
    languagePreference === "cantonese" || languagePreference === "bilingual";
  const showEnglish =
    languagePreference === "english" || languagePreference === "bilingual";

  // Helper to determine labels based on language
  const labels = {
    mastered: languagePreference === "english" ? "Mastered" : "已掌握",
    example: languagePreference === "english" ? "Example" : "例句",
    action: languagePreference === "english" ? "Action" : "動作",
    difficulty: languagePreference === "english" ? "Level" : "難度",
    practiced: languagePreference === "english" ? "Practiced" : "練習",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative bg-white border-4 border-white rounded-[40px] shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden",
        className
      )}
    >
      {/* --- 1. Top Section: Image & Mastery --- */}
      <div className="h-48 bg-gradient-to-b from-blue-50 to-white flex items-center justify-center relative p-6">
        
        {/* Mastery Badge */}
        {word.mastered && (
          <div className="absolute top-4 right-4 bg-emerald-400 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            {labels.mastered}
          </div>
        )}

        {/* Image / Emoji */}
        <div className="transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
          {isBackendImageUrl(word.image) ? (
            <img
              src={resolveBackendAssetUrl(word.image)}
              alt={word.word}
              className="w-32 h-32 object-contain drop-shadow-md"
            />
          ) : (
            <span className="text-[6rem] leading-none drop-shadow-sm filter">
              {word.image || "📝"}
            </span>
          )}
        </div>
      </div>

      {/* --- 2. Content Section --- */}
      <div className="px-6 pb-6 pt-2 text-center relative">
        
        {/* Audio Button (Floating in center) */}
        {(word.audio_url || word.audio_url_english) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayAudio?.();
            }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 w-14 h-14 bg-[#38BDF8] hover:bg-[#0EA5E9] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all border-4 border-white"
            aria-label="Play pronunciation"
          >
            <Volume2 className="w-7 h-7 fill-current" />
          </button>
        )}

        {/* Spacer for audio button */}
        <div className="h-6" />

        {/* Main Word Display */}
        <div className="space-y-1 mb-6">
          {showCantonese && word.word_cantonese && (
            <div>
              <h3 className="text-5xl font-black text-slate-800 tracking-tight">
                {word.word_cantonese}
              </h3>
              {word.jyutping && (
                <p className="text-base font-bold text-slate-400 bg-slate-100 inline-block px-3 py-0.5 rounded-full mt-1">
                  {word.jyutping}
                </p>
              )}
            </div>
          )}

          {showEnglish && (
            <h4
              className={cn(
                "font-black tracking-tight",
                languagePreference === "bilingual" 
                  ? "text-2xl text-slate-400 mt-1" 
                  : "text-5xl text-slate-800"
              )}
            >
              {word.word}
            </h4>
          )}
        </div>

        {/* Definition Bubble */}
        <div className="bg-slate-50 rounded-2xl p-4 mb-4">
          {showCantonese && word.definition_cantonese && (
            <p className="text-xl font-bold text-slate-600 leading-relaxed">
              {word.definition_cantonese}
            </p>
          )}
          {showEnglish && (
            <p className={cn(
              "leading-relaxed",
              languagePreference === "bilingual" ? "text-base text-slate-400 font-medium mt-1" : "text-xl font-bold text-slate-600"
            )}>
              {word.definition}
            </p>
          )}
        </div>

        {/* Example Sentence (Yellow/Orange Pill) */}
        {((showCantonese && word.example_cantonese) || (showEnglish && word.example)) && (
          <div className="bg-orange-50 rounded-2xl p-4 text-left border border-orange-100 mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span className="text-sm font-black text-orange-400 uppercase tracking-wide">
                {labels.example}
              </span>
            </div>
            {showCantonese && word.example_cantonese && (
              <p className="text-lg font-bold text-slate-700">{word.example_cantonese}</p>
            )}
            {showEnglish && (
              <p className={cn(
                "text-lg",
                languagePreference === "bilingual" ? "text-slate-400 italic" : "font-bold text-slate-700"
              )}>  
                {word.example}
              </p>
            )}
          </div>
        )}

        {/* Physical Action (Blue Pill) */}
        {word.physicalAction && (
          <div className="bg-blue-50 rounded-2xl p-4 text-left border border-blue-100 mb-4">
             <div className="flex items-center gap-2 mb-1.5">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-black text-blue-400 uppercase tracking-wide">
                {labels.action}
              </span>
            </div>
            <p className="text-lg font-bold text-blue-700">
              {word.physicalAction}
            </p>
          </div>
        )}

        {/* Footer Stats */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-100">
           <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-xs font-bold text-slate-400">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              {labels.difficulty}: {{ easy: "初級", medium: "中級", hard: "進階" }[word.difficulty ?? ""] ?? "初級"}
           </div>
           <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-xs font-bold text-slate-400">
              <Repeat className="w-3 h-3" />
              {labels.practiced}: {word.exposureCount || 0}
           </div>
        </div>

      </div>
    </div>
  );
}

export default WordCard;