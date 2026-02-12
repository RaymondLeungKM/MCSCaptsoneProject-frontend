"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  Star,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Trophy,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { AISentences } from "@/components/child/ai-sentences"; // Import AI Sentences

// --- TYPES ---
// Re-defining locally to ensure standalone functionality if types file is missing
export type LanguagePreference = "english" | "cantonese" | "bilingual" | "mandarin";

export interface DailyWordSummary {
  word_id: string;
  word: string;
  word_cantonese?: string;
  jyutping?: string;
  definition_cantonese?: string;
  exposure_count: number;
  story_priority: number;
  used_actively: boolean;
  last_practiced?: string;
}

interface DailyWordsViewerProps {
  childId?: string;
  childName?: string;
  languagePreference?: LanguagePreference;
}

// --- MOCK DATA (Fallback) ---
const MOCK_DAILY_WORDS: DailyWordSummary[] = [
  {
    word_id: "1",
    word: "Apple",
    word_cantonese: "蘋果",
    jyutping: "ping4 gwo2",
    definition_cantonese: "一種圓形的紅色或綠色水果",
    exposure_count: 5,
    story_priority: 9,
    used_actively: true,
  },
  {
    word_id: "2",
    word: "Elephant",
    word_cantonese: "大象",
    jyutping: "daai6 zoeng6",
    definition_cantonese: "一種長鼻大耳的巨型動物",
    exposure_count: 3,
    story_priority: 7,
    used_actively: false,
  },
  {
    word_id: "3",
    word: "Happy",
    word_cantonese: "開心",
    jyutping: "hoi1 sam1",
    definition_cantonese: "感到快樂和滿足",
    exposure_count: 8,
    story_priority: 10,
    used_actively: true,
  },
  {
    word_id: "4",
    word: "Run",
    word_cantonese: "跑",
    jyutping: "paau2",
    definition_cantonese: "快速移動",
    exposure_count: 2,
    story_priority: 4,
    used_actively: false,
  },
];

export function DailyWordsViewer({
  childId = "1",
  childName = "Emma",
  languagePreference = "bilingual",
}: DailyWordsViewerProps) {
  const [words, setWords] = useState<DailyWordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);

  useEffect(() => {
    loadDailyWords();
  }, [childId]);

  const loadDailyWords = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      // const fetchedWords = await getDailyWords(childId);
      // setWords(fetchedWords);
      
      // Using MOCK DATA for now to prevent errors
      setTimeout(() => {
        setWords(MOCK_DAILY_WORDS);
        if (MOCK_DAILY_WORDS.length > 0) {
            setSelectedWordId(MOCK_DAILY_WORDS[0].word_id);
        }
        setLoading(false);
      }, 800);

    } catch (err: any) {
      console.error("Error loading daily words:", err);
      // Fallback to mock data even on error
      setWords(MOCK_DAILY_WORDS);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md rounded-[32px] border-none shadow-sm p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
             <Skeleton className="h-8 w-48 rounded-full" />
             <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <Skeleton className="h-24 w-full rounded-[24px]" />
          <Skeleton className="h-24 w-full rounded-[24px]" />
        </div>
      </Card>
    );
  }

  const displayWords = isExpanded ? words : words.slice(0, 3);
  const activeWord = words.find(w => w.word_id === selectedWordId) || words[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
        
      {/* Main Container Card */}
      <Card className="bg-white/80 backdrop-blur-md rounded-[40px] border-4 border-white shadow-sm overflow-hidden">
        
        {/* Header Section */}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-2xl font-black text-slate-700 tracking-tight">
              <span className="bg-yellow-400 text-white p-2 rounded-2xl shadow-sm">
                <Sparkles className="w-6 h-6 fill-white" />
              </span>
              {languagePreference === "english" ? "Today's Learning" : "今日學習"}
            </CardTitle>
            <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none px-4 py-1.5 text-sm font-bold rounded-full">
              {words.length}{" "}
              {languagePreference === "english"
                ? words.length === 1 ? "word" : "words"
                : "個詞語"}
            </Badge>
          </div>
          <p className="text-slate-500 font-medium ml-12 mt-1">
            {languagePreference === "english"
              ? "These words will appear in your bedtime story!"
              : "這些詞語將會出現在你的睡前故事中！"}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          
          {/* Word List */}
          <div className="grid gap-3">
            {displayWords.map((word, index) => (
              <div
                key={word.word_id}
                onClick={() => setSelectedWordId(word.word_id)}
                className={cn(
                  "relative group cursor-pointer transition-all duration-300",
                  "flex items-center gap-4 p-4 rounded-[24px]",
                  selectedWordId === word.word_id 
                    ? "bg-yellow-50 border-2 border-yellow-400 shadow-md scale-[1.02]" 
                    : "bg-white border-2 border-slate-100 hover:border-yellow-200 hover:shadow-sm"
                )}
              >
                {/* Priority / Number Badge */}
                <div className="flex-shrink-0">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm transition-transform group-hover:scale-110",
                      word.story_priority >= 8
                        ? "bg-gradient-to-br from-yellow-400 to-orange-400 text-white"
                        : word.story_priority >= 5
                          ? "bg-gradient-to-br from-blue-400 to-cyan-400 text-white"
                          : "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500",
                    )}
                  >
                    {index + 1}
                  </div>
                </div>

                {/* Word Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-xl text-slate-700">
                      {word.word}
                    </span>
                    {languagePreference !== "english" && (
                        <>
                            <span className="text-lg font-bold text-slate-600">
                                {word.word_cantonese}
                            </span>
                            {word.jyutping && (
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                                {word.jyutping}
                            </span>
                            )}
                        </>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-400 mt-1 line-clamp-1">
                    {word.definition_cantonese}
                  </p>
                </div>

                {/* Stats Icons (Subtle) */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0 opacity-70">
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span>{word.exposure_count}x</span>
                  </div>
                  {word.used_actively && (
                     <div className="flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-50 px-2 py-1 rounded-full">
                        <Zap className="w-3 h-3 fill-orange-400" />
                        <span>Active</span>
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Expand Button */}
          {words.length > 3 && (
            <Button
              variant="ghost"
              className="w-full rounded-full hover:bg-slate-100 text-slate-400 font-bold"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <div className="flex items-center gap-2"><ChevronUp className="w-4 h-4" /> 收起</div>
              ) : (
                <div className="flex items-center gap-2"><ChevronDown className="w-4 h-4" /> 顯示全部 ({words.length})</div>
              )}
            </Button>
          )}

          {/* Summary Stats Footer */}
          <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-100 grid grid-cols-3 gap-4">
             <StatBox 
                icon={<Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                label="高優先級"
                value={words.filter((w) => w.story_priority >= 7).length}
                color="bg-yellow-50 text-yellow-700"
             />
             <StatBox 
                icon={<BookOpen className="w-4 h-4 text-blue-500" />}
                label="平均練習"
                value={(words.reduce((sum, w) => sum + w.exposure_count, 0) / words.length || 0).toFixed(1)}
                color="bg-blue-50 text-blue-700"
             />
             <StatBox 
                icon={<Trophy className="w-4 h-4 text-orange-500" />}
                label="已掌握"
                value={words.filter((w) => w.used_actively).length}
                color="bg-orange-50 text-orange-700"
             />
          </div>
        </CardContent>
      </Card>

      {/* --- AI SENTENCES INTEGRATION --- */}
      {/* This updates dynamically when you click a word above */}
      {activeWord && (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
             <AISentences 
                wordId={activeWord.word_id}
                languagePreference={languagePreference}
             />
          </div>
      )}

    </div>
  );
}

// Helper Component for the bottom stats
function StatBox({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-3 rounded-2xl", color)}>
            <div className="mb-1 opacity-80">{icon}</div>
            <div className="text-xl font-black leading-none mb-1">{value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</div>
        </div>
    )
}