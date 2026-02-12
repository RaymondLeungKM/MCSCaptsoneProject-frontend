"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Star,
  Check,
  Repeat,
  Sparkles,
  Bot,
  Mic
} from "lucide-react";
import type { Word, LanguagePreference } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/lib/speech";
// Ensure these API functions exist in your project
import { updateWordProgress } from "@/lib/api/vocabulary"; 
import { trackDailyWord } from "@/lib/api/bedtime-stories";
import { AISentences } from "@/components/child/ai-sentences";
import {
  getWordText,
  getDefinition,
  getExample,
  getSpeechText,
} from "@/lib/language-utils";

interface WordLearningModalProps {
  word: Word;
  onClose: () => void;
  onComplete?: () => void;
  childId: string;
  languagePreference?: LanguagePreference;
}

type Step =
  | "intro"
  | "listen"
  | "repeat"
  | "example"
  | "ai-sentences"
  | "complete";

export function WordLearningModal({
  word,
  onClose,
  onComplete,
  childId,
  languagePreference = "cantonese",
}: WordLearningModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>("intro");
  const [isPlaying, setIsPlaying] = useState(false);
  const { speak } = useSpeech();
  const progressRecorded = useRef(false);

  // --- LANGUAGE UTILS ---
  const wordText = getWordText(word, languagePreference);
  const definition = getDefinition(word, languagePreference);
  const example = getExample(word, languagePreference);
  const speechText = getSpeechText(word, languagePreference);

  // --- PLAYBACK HANDLERS ---
  const playWord = () => {
    speak(speechText, {
      rate: 0.8,
      pitch: 1.1,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: (error) => {
        console.log("[WordLearning] Word playback error:", error);
        setIsPlaying(false);
      },
    });
  };

  const playExample = () => {
    speak(example, {
      rate: 0.8,
      pitch: 1.0,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: (error) => {
        console.log("[WordLearning] Example playback error:", error);
        setIsPlaying(false);
      },
    });
  };

  // --- PROGRESS TRACKING LOGIC (Untouched) ---
  useEffect(() => {
    async function recordProgress() {
      if (currentStep === "complete" && !progressRecorded.current) {
        progressRecorded.current = true;
        try {
          // Update general word progress
          // Note: Ensure these API functions handle errors gracefully if backend is offline
          try {
             await updateWordProgress(word.id, childId, {
               exposure_count: (word.exposureCount || 0) + 1,
             });
          } catch (e) { console.warn("Failed to update progress", e); }

          // Track word for daily story generation
          try {
             await trackDailyWord({
               child_id: childId,
               word_id: word.id,
               date: new Date().toISOString(),
               exposure_count: 1,
               used_actively: false,
               mastery_confidence: 0.5,
               learned_context: {
                 activity: "word_learning",
                 source: "vocabulary_explorer",
               },
               include_in_story: true,
               story_priority: 5,
             });
          } catch (e) { console.warn("Failed to track daily word", e); }

          console.log("Progress recorded successfully");
        } catch (error) {
          console.error("Failed to record word progress logic:", error);
        }
      }
    }
    recordProgress();
  }, [currentStep, word.id, word.exposureCount, childId]);

  // --- NAVIGATION LOGIC ---
  const steps: Step[] = [
    "intro",
    "listen",
    "repeat",
    "example",
    "ai-sentences",
    "complete",
  ];
  const currentIndex = steps.indexOf(currentStep);

  const goNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // --- VISUAL HELPERS ---
  const getCategoryEmoji = () => {
    switch (word.category) {
      case "Animals": return "🦁";
      case "Food": return "🍎";
      case "Nature": return "🌳";
      case "Colors": return "🎨";
      case "Vehicles": return "🚗";
      case "Family": return "👨‍👩‍👧";
      default: return "📚";
    }
  };

  // Step Progress Bar (Dots)
  const renderProgressDots = () => (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => (
        <div
          key={step}
          className={cn(
            "h-2.5 rounded-full transition-all duration-300",
            i === currentIndex 
              ? "bg-[#38BDF8] w-8" 
              : i < currentIndex 
                ? "bg-green-400 w-2.5" 
                : "bg-slate-200 w-2.5"
          )}
        />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* --- THE CARD --- */}
      <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden border-8 border-white animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* 1. Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
          {renderProgressDots()}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center hover:bg-slate-100 hover:rotate-90 transition-all text-slate-400"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* STEP: INTRO */}
          {currentStep === "intro" && (
            <div className="flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="w-40 h-40 rounded-[32px] bg-sky-50 flex items-center justify-center text-8xl mb-6 border-4 border-sky-100 shadow-sm overflow-hidden animate-bounce-slow">
                {word.image?.startsWith("http") ? (
                  <img src={word.image} alt={wordText} className="w-full h-full object-cover" />
                ) : (
                  <span>{word.image || getCategoryEmoji()}</span>
                )}
              </div>
              <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">
                {wordText}
              </h2>
              <p className="text-lg font-medium text-slate-500 bg-slate-100 px-4 py-2 rounded-xl mb-4">
                {definition}
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wide">
                  {word.categoryName}
                </span>
                <span
                  className={cn(
                    "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border",
                    word.difficulty === "easy" && "bg-green-50 text-green-600 border-green-200",
                    word.difficulty === "medium" && "bg-yellow-50 text-yellow-600 border-yellow-200",
                    word.difficulty === "hard" && "bg-red-50 text-red-600 border-red-200",
                  )}
                >
                  {word.difficulty || "Easy"}
                </span>
              </div>
            </div>
          )}

          {/* STEP: LISTEN */}
          {currentStep === "listen" && (
            <div className="flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-right-8">
              <div className="bg-blue-50 rounded-full p-4 mb-6">
                <p className="text-lg font-black text-blue-500">仔細聽 Listen!</p>
              </div>
              
              <button
                onClick={playWord}
                className={cn(
                  "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border-4 border-white",
                  isPlaying 
                    ? "bg-blue-400 scale-110 shadow-blue-200" 
                    : "bg-[#38BDF8] hover:scale-105 hover:bg-blue-400"
                )}
              >
                <Volume2 className={cn("w-14 h-14 text-white", isPlaying && "animate-pulse")} />
              </button>

              <h2 className="text-4xl font-black text-slate-800 mt-8 mb-2">
                {wordText}
              </h2>
              <div className="bg-slate-100 px-4 py-1 rounded-full">
                 <p className="text-lg font-bold text-slate-500 font-mono">
                   /{word.pronunciation || word.jyutping}/
                 </p>
              </div>
            </div>
          )}

          {/* STEP: REPEAT */}
          {currentStep === "repeat" && (
            <div className="flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-right-8">
              <div className="bg-orange-50 rounded-full p-4 mb-6">
                 <p className="text-lg font-black text-orange-500">換你試試 Your Turn!</p>
              </div>

              <div className="relative w-32 h-32 mb-6">
                 {/* Decorative Circles */}
                 <div className="absolute inset-0 bg-orange-200 rounded-full opacity-20 animate-ping" />
                 <div className="w-full h-full rounded-full bg-orange-100 flex items-center justify-center border-4 border-orange-200 relative z-10">
                    <Mic className="w-14 h-14 text-orange-400" />
                 </div>
              </div>

              <h2 className="text-3xl font-black text-slate-800 mb-2">
                {wordText}
              </h2>
              <p className="text-slate-400 font-bold mb-6">
                大聲說出來: <span className="text-orange-500 underline decoration-wavy">{wordText}</span>
              </p>
              
              <button
                onClick={playWord}
                className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-slate-500 flex items-center gap-2 transition-colors text-sm"
              >
                <Repeat className="w-4 h-4" />
                再聽一次
              </button>
            </div>
          )}

          {/* STEP: EXAMPLE */}
          {currentStep === "example" && (
            <div className="flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-right-8">
               <div className="bg-purple-50 rounded-full p-4 mb-6">
                 <p className="text-lg font-black text-purple-500">例句 Sentence</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-[32px] p-6 w-full border border-yellow-100 shadow-sm mb-6 relative overflow-hidden">
                <Sparkles className="absolute top-2 right-2 w-12 h-12 text-yellow-200 opacity-50" />
                <p className="text-xl font-bold text-slate-700 leading-relaxed">
                  "{example}"
                </p>
              </div>

              <button
                onClick={playExample}
                className={cn(
                  "px-8 py-4 rounded-full flex items-center gap-3 transition-all font-black text-lg shadow-md",
                  isPlaying 
                    ? "bg-purple-500 text-white scale-105" 
                    : "bg-white text-purple-600 border-2 border-purple-100 hover:bg-purple-50"
                )}
              >
                <Volume2 className="w-6 h-6" />
                {isPlaying ? "播放中..." : "播放例句"}
              </button>
            </div>
          )}

          {/* STEP: AI SENTENCES */}
          {currentStep === "ai-sentences" && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-pink-50 text-pink-500 px-4 py-2 rounded-full font-black text-sm mb-2">
                    <Bot className="w-4 h-4" /> AI 魔法
                </div>
                <h2 className="text-2xl font-black text-slate-800">
                  更多例句
                </h2>
              </div>
              
              {/* Embed the AI Component directly */}
              <div className="flex-1 bg-slate-50 rounded-[24px] p-2 border border-slate-100">
                  <AISentences
                    wordId={word.id}
                    languagePreference={languagePreference}
                  />
              </div>
            </div>
          )}

          {/* STEP: COMPLETE */}
          {currentStep === "complete" && (
            <div className="flex flex-col items-center justify-center text-center h-full animate-in zoom-in-95 duration-500">
              <div className="relative mb-6">
                 <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-50 animate-pulse" />
                 <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center relative z-10 border-4 border-green-200">
                    <Check className="w-16 h-16 text-green-500" strokeWidth={4} />
                 </div>
              </div>
              
              <h2 className="text-4xl font-black text-slate-800 mb-2">
                太棒了!
              </h2>
              <p className="text-lg text-slate-500 font-bold mb-8">
                你學會了一個新單字: <br/>
                <span className="text-2xl text-[#38BDF8]">{wordText}</span>
              </p>
              
              <div className="flex items-center gap-3 bg-yellow-100 text-yellow-700 px-6 py-3 rounded-2xl shadow-sm animate-bounce">
                <Star className="w-6 h-6 fill-yellow-500 text-yellow-600" />
                <span className="font-black text-xl">+10 XP</span>
              </div>
            </div>
          )}

        </div>

        {/* 3. Footer Navigation */}
        <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={goBack}
                disabled={currentIndex === 0}
                className="rounded-full text-slate-400 font-bold hover:bg-slate-100 hover:text-slate-600 px-6 h-12"
            >
                <ChevronLeft className="w-5 h-5 mr-1" />
                上一步
            </Button>

            {/* Next/Done Button */}
            {currentStep === "complete" ? (
                <Button
                    onClick={() => {
                        onComplete?.();
                        onClose();
                    }}
                    className="rounded-full bg-green-500 hover:bg-green-600 text-white font-black px-8 h-12 shadow-lg shadow-green-200 hover:scale-105 transition-all"
                >
                    完成
                    <Check className="w-5 h-5 ml-2" />
                </Button>
            ) : (
                <Button 
                    onClick={goNext} 
                    className="rounded-full bg-[#38BDF8] hover:bg-[#0EA5E9] text-white font-black px-8 h-12 shadow-lg shadow-blue-200 hover:scale-105 transition-all"
                >
                    下一步
                    <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
            )}
        </div>

      </div>
    </div>
  );
}