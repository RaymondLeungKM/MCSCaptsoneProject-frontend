"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, Sparkles, Loader2, Bot, GraduationCap } from "lucide-react";
import { LanguagePreference } from "@/lib/types";
import {
  generateWordSentences,
  getWordSentences,
  type GeneratedSentenceResponse,
} from "@/lib/api/vocabulary";
import { useWordAudio } from "@/hooks/use-word-audio";

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

function translateContext(context?: string): string {
  const map: Record<string, string> = {
    General: "一般", general: "一般",
    Mealtime: "用餐", mealtime: "用餐",
    Bedtime: "睡前", bedtime: "睡前",
    Outdoor: "戶外", outdoor: "戶外",
    Shopping: "購物", shopping: "購物",
    Playtime: "遊戲", playtime: "遊戲",
    School: "學校", school: "學校",
    Home: "家庭", home: "家庭",
  };
  return map[context ?? ""] ?? context ?? "一般";
}

function translateDifficulty(difficulty?: string): string {
  const map: Record<string, string> = {
    easy: "初級", Easy: "初級",
    medium: "中級", Medium: "中級",
    hard: "進階", Hard: "進階",
  };
  return map[difficulty ?? ""] ?? "初級";
}

export function AISentences({ wordId, languagePreference }: AISentencesProps) {
  const [sentences, setSentences] = useState<GeneratedSentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const {
    playSentence: playSentenceAudio,
    isPlaying,
    isLoading: isAudioLoading,
  } = useWordAudio();

  const showCantonese =
    languagePreference === "cantonese" || languagePreference === "bilingual";
  const showEnglish =
    languagePreference === "english" || languagePreference === "bilingual";

  useEffect(() => {
    async function fetchSentences() {
      try {
        setLoading(true);
        setError(null);

        const toSentence = (
          item: GeneratedSentenceResponse,
          index: number,
        ): GeneratedSentence => ({
          id: item.id ?? index + 1,
          sentence: item.sentence,
          sentence_english: item.sentence_english || "",
          jyutping: item.jyutping || "",
          context: item.context || "General",
          difficulty: item.difficulty || "easy",
          created_at: item.created_at,
        });

        const existingSentences = await getWordSentences(wordId);

        if (existingSentences.length > 0) {
          setSentences(existingSentences.map(toSentence));
          return;
        }

        const generated = await generateWordSentences(wordId, {
          num_sentences: 3,
        });

        setSentences(generated.sentences.map(toSentence));
      } catch (err: any) {
        // Ollama / AI service not running — hide component silently instead of red error
        const msg: string = err?.message ?? String(err);
        const status: number = err?.status ?? err?.statusCode ?? 0;
        if (
          status === 503 ||
          status === 500 ||
          msg.includes("Ollama") ||
          msg.includes("Cannot connect") ||
          msg.includes("connect to Ollama") ||
          msg.includes("AI service") ||
          msg.includes("generate-sentences")
        ) {
          setSentences([]);
          return;
        }
        setError(msg || "未能載入 AI 例句，請稍後再試。");
        setSentences([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSentences();
  }, [wordId, reloadKey]);

  useEffect(() => {
    if (!isPlaying && playingId !== null) {
      setPlayingId(null);
    }
  }, [isPlaying, playingId]);

  const playSentence = async (sentence: GeneratedSentence) => {
    const textToSpeak =
      languagePreference === "english"
        ? sentence.sentence_english || sentence.sentence
        : sentence.sentence;

    if (!textToSpeak?.trim()) {
      return;
    }

    setPlayingId(sentence.id);
    try {
      await playSentenceAudio(textToSpeak, {
        languagePreference,
        speechRate: 0.8,
      });
    } catch {
      setPlayingId(null);
    }
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <Card className="p-8 bg-purple-50/50 border-none rounded-4xl flex flex-col items-center justify-center gap-3 min-h-50">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <span className="text-purple-400 font-bold animate-pulse">
          正在發想造句...
        </span>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50/60 border-red-100 rounded-4xl flex flex-col items-start gap-3">
        <p className="text-sm font-bold text-red-600">{error}</p>
        <Button
          onClick={() => {
            setLoading(true);
            setError(null);
            setSentences([]);
            setPlayingId(null);
            setReloadKey((previous) => previous + 1);
          }}
          className="h-9 rounded-full"
          variant="outline"
        >
          重新載入
        </Button>
      </Card>
    );
  }

  if (sentences.length === 0) return null;

  return (
    <div className="bg-linear-to-br from-violet-50 to-purple-50 rounded-[40px] p-6 md:p-8 shadow-sm border border-white/60 relative overflow-hidden">
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
        </div>
      </div>

      {/* Sentences List */}
      <div className="space-y-4 relative z-10">
        {sentences.map((sent, index) => (
          <div
            key={sent.id}
            className="group bg-white/80 backdrop-blur-md rounded-4xl p-5 border-2 border-transparent hover:border-purple-200 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-md flex gap-4 items-start"
          >
            {/* Play Button (Big & Round) */}
            <button
              onClick={() => playSentence(sent)}
              disabled={(playingId === sent.id && isPlaying) || isAudioLoading}
              className={`
                shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
                ${
                  playingId === sent.id && (isPlaying || isAudioLoading)
                    ? "bg-purple-500 text-white scale-110 shadow-purple-200"
                    : "bg-purple-100 text-purple-500 group-hover:bg-purple-500 group-hover:text-white"
                }
              `}
            >
              <Volume2
                className={`w-6 h-6 ${playingId === sent.id && (isPlaying || isAudioLoading) ? "animate-pulse" : ""}`}
              />
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
                  <Bot className="w-3 h-3" /> {translateContext(sent.context)}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100">
                  <GraduationCap className="w-3 h-3" />{" "}
                  {translateDifficulty(sent.difficulty)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
