"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, Sparkles, Loader2, Bot, GraduationCap } from "lucide-react";
import { LanguagePreference } from "@/lib/types";
// Ensure this hook exists, or replace with console.log for testing
// import { useSpeech } from "@/hooks/use-speech"; 

// --- TYPES ---
interface GeneratedSentence {
  id: number;
  sentence: string;
  sentence_english: string;
  jyutping: string;
  context: string;
  difficulty: string;
  created_at?: string;
}

interface AISentencesProps {
  wordId: string; // or number, depending on your API
  languagePreference: LanguagePreference;
}

// --- MOCK DATA (For instant preview without Backend) ---
const MOCK_SENTENCES: GeneratedSentence[] = [
  {
    id: 1,
    sentence: "我想食一個紅色的蘋果。",
    jyutping: "ngo5 soeng2 sik6 jat1 go3 hung4 sik1 dik1 ping4 gwo2",
    sentence_english: "I want to eat a red apple.",
    context: "Daily Life",
    difficulty: "Easy"
  },
  {
    id: 2,
    sentence: "樹上有很多蘋果。",
    jyutping: "syu6 soeng6 jau5 han2 do1 ping4 gwo2",
    sentence_english: "There are many apples on the tree.",
    context: "Nature",
    difficulty: "Medium"
  }
];

export function AISentences({ wordId, languagePreference }: AISentencesProps) {
  const [sentences, setSentences] = useState<GeneratedSentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);
  
  // Mocking the speech hook if you don't have it ready yet
  const speak = (text: string, options: any) => {
    console.log("Speaking:", text);
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.8;
    u.onend = options.onEnd;
    window.speechSynthesis.speak(u);
  };

  const showCantonese =
    languagePreference === "cantonese" || languagePreference === "bilingual";
  const showEnglish =
    languagePreference === "english" || languagePreference === "bilingual";

  useEffect(() => {
    async function fetchSentences() {
      try {
        setLoading(true);
        // Try fetching from real API
        const response = await fetch(
          `http://localhost:8000/api/v1/vocabulary/${wordId}/sentences`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch");
        }

        const data = await response.json();
        if (data && data.length > 0) {
            setSentences(data);
        } else {
            setSentences(MOCK_SENTENCES); // Fallback if array empty
        }
      } catch (err) {
        console.warn("API unavailable, using mock sentences for design preview.");
        setSentences(MOCK_SENTENCES); // Fallback on error
      } finally {
        setLoading(false);
      }
    }

    fetchSentences();
  }, [wordId]);

  const playSentence = (sentence: GeneratedSentence) => {
    const textToSpeak =
      languagePreference === "english"
        ? sentence.sentence_english
        : sentence.sentence;

    setPlayingId(sentence.id);
    speak(textToSpeak, {
      rate: 0.8,
      onEnd: () => setPlayingId(null),
      onError: () => setPlayingId(null),
    });
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <Card className="p-8 bg-purple-50/50 border-none rounded-[32px] flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <span className="text-purple-400 font-bold animate-pulse">
          正在發想造句...
        </span>
      </Card>
    );
  }

  if (sentences.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-[40px] p-6 md:p-8 shadow-sm border border-white/60 relative overflow-hidden">
      
      {/* Decorative Background Icon */}
      <Bot className="absolute -top-6 -right-6 w-32 h-32 text-purple-100 -rotate-12 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="bg-white p-2.5 rounded-full shadow-sm">
            <Sparkles className="w-6 h-6 text-purple-500 fill-purple-500" />
        </div>
        <div>
            <h4 className="text-xl font-black text-purple-900 tracking-tight">
            AI 魔法造句
            </h4>
            <p className="text-xs font-bold text-purple-400 uppercase tracking-wide">
            Example Sentences
            </p>
        </div>
      </div>

      {/* Sentences List */}
      <div className="space-y-4 relative z-10">
        {sentences.map((sent, index) => (
          <div
            key={sent.id}
            className="group bg-white/80 backdrop-blur-md rounded-[32px] p-5 border-2 border-transparent hover:border-purple-200 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-md flex gap-4 items-start"
          >
            {/* Play Button (Big & Round) */}
            <button
              onClick={() => playSentence(sent)}
              disabled={playingId === sent.id}
              className={`
                shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
                ${playingId === sent.id 
                    ? "bg-purple-500 text-white scale-110 shadow-purple-200" 
                    : "bg-purple-100 text-purple-500 group-hover:bg-purple-500 group-hover:text-white"
                }
              `}
            >
              <Volume2 className={`w-6 h-6 ${playingId === sent.id ? "animate-pulse" : ""}`} />
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              {/* Cantonese */}
              {showCantonese && (
                <div className="mb-2">
                  <p className="text-lg font-black text-slate-700 leading-relaxed">
                    {sent.sentence}
                  </p>
                  {sent.jyutping && (
                    <p className="text-sm font-medium text-purple-400 font-mono mt-1">
                      {sent.jyutping}
                    </p>
                  )}
                </div>
              )}

              {/* English */}
              {showEnglish && (
                <p className="text-slate-500 font-medium italic mb-3">
                  "{sent.sentence_english}"
                </p>
              )}

              {/* Tags/Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-600 px-3 py-1 rounded-full border border-purple-100">
                   <Bot className="w-3 h-3" /> {sent.context || "General"}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100">
                   <GraduationCap className="w-3 h-3" /> {sent.difficulty || "Easy"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}