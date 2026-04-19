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
  Volume2,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { AISentences } from "@/components/child/ai-sentences";
import { getWords, getWordsWithProgress, getCapturedWords } from "@/lib/api";
import type { LanguagePreference, Word } from "@/lib/types";
import { useWordAudio } from "@/hooks/use-word-audio";
import { WordDetailModal } from "@/components/modals/word-detail-modal";

// --- TYPES ---
export interface DailyWordSummary {
  word_id: string;
  word: string; // Backend identifier (usually English), kept for data tracking but hidden in UI
  word_cantonese?: string;
  jyutping?: string;
  definition_cantonese?: string;
  image_url?: string;
  exposure_count: number;
  story_priority: number;
  used_actively: boolean;
  last_practiced?: string;
}

interface DailyWordsViewerProps {
  childId?: string;
  childName?: string;
  languagePreference?: LanguagePreference;
  capturedWords?: DailyWordSummary[]; // Added for the camera tab
  onWordLearned?: () => void;
}

// --- MOCK CAMERA DATA (For UI Testing) ---
const MOCK_CAMERA_WORDS: DailyWordSummary[] = [
  {
    word_id: "cam-1",
    word: "Cup",
    word_cantonese: "水杯",
    jyutping: "seoi2 bui1",
    definition_cantonese: "用來盛水的容器",
    exposure_count: 1,
    story_priority: 10,
    used_actively: false,
  },
  {
    word_id: "cam-2",
    word: "Apple",
    word_cantonese: "蘋果",
    jyutping: "ping4 gwo2",
    definition_cantonese: "一種甜美的水果，有紅色和綠色",
    exposure_count: 2,
    story_priority: 9,
    used_actively: false,
  },
];

export function DailyWordsViewer({
  childId = "1",
  childName = "Emma",
  languagePreference = "cantonese", // Defaulted to Cantonese
  capturedWords = MOCK_CAMERA_WORDS,
  onWordLearned,
}: DailyWordsViewerProps) {
  const { playWord, isLoading, isPlaying } = useWordAudio();
  const [words, setWords] = useState<DailyWordSummary[]>([]);
  const [cameraWords, setCameraWords] = useState<DailyWordSummary[]>(capturedWords);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab & Expansion State
  const [activeTab, setActiveTab] = useState<"default" | "camera">("default");
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [modalWord, setModalWord] = useState<Word | null>(null);

  // Build a full Word object from a DailyWordSummary for use in the modal
  const buildWord = (summary: DailyWordSummary): Word => ({
    id: summary.word_id,
    word: summary.word,
    word_cantonese: summary.word_cantonese,
    jyutping: summary.jyutping,
    image: summary.image_url || "",
    category: "",
    pronunciation: summary.jyutping || "",
    definition: summary.definition_cantonese || "",
    definition_cantonese: summary.definition_cantonese,
    example: summary.word_cantonese || summary.word,
    example_cantonese: summary.word_cantonese,
    difficulty: "easy",
    mastered: summary.used_actively,
    exposureCount: summary.exposure_count,
    contexts: [],
    relatedWords: [],
  });

  useEffect(() => {
    loadDailyWords();
  }, [childId]);

  // Handle auto-selecting the first word when switching tabs
  const currentWords = activeTab === "default" ? words : cameraWords;
  
  useEffect(() => {
    if (currentWords.length > 0) {
      setSelectedWordId(currentWords[0].word_id);
    } else {
      setSelectedWordId(null);
    }
  }, [activeTab, words, capturedWords]);

  const loadDailyWords = async () => {
    setLoading(true);
    setError(null);

    try {
      let dailyWords: DailyWordSummary[] = [];
      let cameraWordsData: DailyWordSummary[] = capturedWords;

      if (childId && childId !== "1") {
        try {
          const captured = await getCapturedWords(childId, {
            limit: 30,
            includeMongodb: true,
          });

          cameraWordsData = captured.map((item) => ({
            word_id: item.id,
            word: item.word,
            word_cantonese: item.word_cantonese,
            jyutping: item.jyutping,
            definition_cantonese: item.definition_cantonese || item.definition,
            image_url: item.image_url,
            exposure_count: item.total_exposures || 0,
            used_actively: (item.success_rate || 0) >= 0.7,
            story_priority: Math.max(
              1,
              Math.min(10, Math.round((item.success_rate || 0) * 10 || 5)),
            ),
          }));
        } catch (captureErr) {
          console.warn("Failed to load camera-captured words, using fallback data", captureErr);
        }
      }

      if (childId && childId !== "1") {
        const wordsWithProgress = await getWordsWithProgress(childId);
        dailyWords = wordsWithProgress
          .map((item: any) => {
            const progress = item.progress;
            const exposureCount = progress?.exposure_count ?? 0;
            const successRate = progress?.success_rate ?? 0;

            return {
              word_id: item.id,
              word: item.word,
              word_cantonese: item.word_cantonese,
              jyutping: item.jyutping,
              definition_cantonese: item.definition_cantonese || item.definition,
              image_url: item.image_url,
              exposure_count: exposureCount,
              used_actively: exposureCount >= 6 || successRate >= 0.7,
              story_priority: Math.max(1, Math.min(10, Math.round(10 - Math.min(exposureCount, 9)))),
              last_practiced: progress?.last_practiced,
            };
          })
          .sort((a, b) => b.story_priority - a.story_priority)
          .slice(0, 8);
      }

      if (!dailyWords.length) {
        const fallbackWords = await getWords({
          childId,
          includeExternal: true,
          includeMongodb: true,
          limit: 12,
        });
        dailyWords = fallbackWords.map((item) => ({
          word_id: item.id,
          word: item.word,
          word_cantonese: item.word_cantonese,
          jyutping: item.jyutping,
          definition_cantonese: item.definition_cantonese || item.definition,
          image_url: item.image_url,
          exposure_count: item.total_exposures || 0,
          used_actively: (item.success_rate || 0) >= 0.7,
          story_priority: Math.max(1, Math.min(10, Math.round((item.success_rate || 0) * 10 || 5))),
        }));
      }

      setWords(dailyWords);
      setCameraWords(cameraWordsData);
    } catch (err) {
      console.error("Error loading daily words:", err);
      setError("載入每日詞語失敗，請稍後再試。");
      setWords([]);
      setCameraWords(capturedWords);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Card className="bg-white/80 backdrop-blur-md rounded-4xl border-none shadow-sm p-6">
        <Alert variant="destructive" className="rounded-2xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => void loadDailyWords()} variant="outline" className="rounded-full">
            重新載入
          </Button>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md rounded-[40px] border-4 border-white shadow-sm p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <Skeleton className="h-14 w-full rounded-full mb-6" /> {/* Tab Skeleton */}
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
        </div>
      </Card>
    );
  }

  const displayWords = isExpanded ? currentWords : currentWords.slice(0, 3);
  const activeWord = currentWords.find((w) => w.word_id === selectedWordId) || currentWords[0];

  const handlePlayWord = (word: DailyWordSummary) => {
    const playableWord = buildWord(word);
    void playWord(playableWord, {
      languagePreference: "cantonese",
      speechRate: 0.8,
    });
  };

  return (
    <>
      <WordDetailModal
        word={modalWord}
        onClose={() => setModalWord(null)}
        languagePreference="cantonese"
        childId={childId !== "1" ? childId : undefined}
        onProgressUpdate={(wordId, mastered, exposureCount) => {
          setWords((prev) =>
            prev.map((w) =>
              w.word_id === wordId
                ? { ...w, used_actively: mastered || w.used_actively, exposure_count: exposureCount }
                : w
            )
          );
          onWordLearned?.();
        }}
      />
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* Main Container Card */}
        <Card className="bg-white/80 backdrop-blur-md rounded-[40px] border-4 border-white shadow-sm overflow-hidden">
          
          {/* Header Section */}
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-2xl font-black text-slate-700 tracking-tight">
                <span className="bg-yellow-400 text-white p-2 rounded-2xl shadow-sm rotate-3">
                  <Sparkles className="w-6 h-6 fill-white" />
                </span>
                今日學習
              </CardTitle>
              <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none px-4 py-1.5 text-sm font-bold rounded-full">
                共 {currentWords.length} 個詞語
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            
            {/* --- TAB SWITCHER --- */}
            <div className="flex bg-slate-100/80 p-1.5 rounded-full mb-6">
              <button
                onClick={() => { setActiveTab("default"); setIsExpanded(false); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-bold text-sm md:text-base transition-all duration-300",
                  activeTab === "default"
                    ? "bg-white text-[#38BDF8] shadow-md scale-[1.02]"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <BookOpen className="w-5 h-5" />
                預設字庫
              </button>
              <button
                onClick={() => { setActiveTab("camera"); setIsExpanded(false); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-bold text-sm md:text-base transition-all duration-300",
                  activeTab === "camera"
                    ? "bg-white text-purple-500 shadow-md scale-[1.02]"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Camera className="w-5 h-5" />
                相機探索
              </button>
            </div>

            <p className="text-slate-500 font-bold text-center mb-6 text-sm">
              {activeTab === "default" 
                ? "這些詞語將會出現在你的睡前故事中！" 
                : "這些是你用相機發現的新鮮事物！"}
            </p>

            {/* Word List */}
            {displayWords.length > 0 ? (
              <div className="grid gap-3">
                {displayWords.map((word, index) => (
                  <div
                    key={word.word_id}
                    onClick={() => {
                      setSelectedWordId(word.word_id);
                      setModalWord(buildWord(word));
                    }}
                    className={cn(
                      "relative group cursor-pointer transition-all duration-300",
                      "flex items-center gap-4 p-4 rounded-3xl",
                      selectedWordId === word.word_id
                        ? "bg-yellow-50 border-2 border-yellow-400 shadow-md scale-[1.02]"
                        : "bg-white border-2 border-slate-100 hover:border-yellow-200 hover:shadow-sm"
                    )}
                  >
                    {/* Priority / Number Badge */}
                    <div className="shrink-0">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm transition-transform group-hover:scale-110",
                          activeTab === "camera" 
                            ? "bg-linear-to-br from-purple-400 to-fuchsia-400 text-white"
                            : word.story_priority >= 8
                              ? "bg-linear-to-br from-yellow-400 to-orange-400 text-white"
                              : word.story_priority >= 5
                                ? "bg-linear-to-br from-blue-400 to-cyan-400 text-white"
                                : "bg-linear-to-br from-slate-200 to-slate-300 text-slate-500"
                        )}
                      >
                        {index + 1}
                      </div>
                    </div>

                    {/* Word Info (Cantonese Only) */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-black text-2xl text-slate-700">
                          {word.word_cantonese || word.word}
                        </span>
                        {word.jyutping && (
                          <span className="text-sm font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {word.jyutping}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-400 line-clamp-1">
                        {word.definition_cantonese}
                      </p>
                    </div>

                    <div className="flex gap-2">
                       <button
                         onClick={(event) => {
                           event.stopPropagation();
                           handlePlayWord(word);
                         }}
                         className="w-12 h-12 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors text-[#38BDF8]"
                         aria-label={`Listen to ${word.word_cantonese}`}
                       >
                         <Volume2 className={cn("w-6 h-6", (isPlaying || isLoading) && "animate-pulse")} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <div className="py-12 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                     {activeTab === "default" ? <BookOpen className="w-10 h-10 text-slate-300" /> : <Camera className="w-10 h-10 text-slate-300" />}
                  </div>
                  <p className="text-slate-500 font-bold text-lg">
                     {activeTab === "default" ? "暫時未有今日詞語。" : "尚未發現新詞語。"}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                     {activeTab === "default" ? "開始學習後會自動產生建議。" : "請用相機探索周圍的世界！"}
                  </p>
               </div>
            )}

            {/* Expand Button */}
            {currentWords.length > 3 && (
              <Button
                variant="ghost"
                className="w-full rounded-full hover:bg-slate-100 text-slate-400 font-bold mt-2"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <div className="flex items-center gap-2"><ChevronUp className="w-5 h-5" /> 收起</div>
                ) : (
                  <div className="flex items-center gap-2"><ChevronDown className="w-5 h-5" /> 顯示全部 ({currentWords.length})</div>
                )}
              </Button>
            )}

            {/* Summary Stats Footer */}
            <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-100 grid grid-cols-3 gap-4">
              <StatBox
                icon={<Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                label="高優先級"
                value={currentWords.filter((w) => w.story_priority >= 7).length}
                color="bg-yellow-50 text-yellow-700 border border-yellow-100"
              />
              <StatBox
                icon={<BookOpen className="w-5 h-5 text-blue-500" />}
                label="平均練習"
                value={(currentWords.reduce((sum, w) => sum + w.exposure_count, 0) / (currentWords.length || 1)).toFixed(1)}
                color="bg-blue-50 text-blue-700 border border-blue-100"
              />
              <StatBox
                icon={<Trophy className="w-5 h-5 text-orange-500" />}
                label="已掌握"
                value={currentWords.filter((w) => w.used_actively).length}
                color="bg-orange-50 text-orange-700 border border-orange-100"
              />
            </div>
          </CardContent>
        </Card>

        {/* --- AI SENTENCES INTEGRATION --- */}
        {activeWord && (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
            <AISentences
              wordId={activeWord.word_id}
              languagePreference="cantonese"
            />
          </div>
        )}
      </div>
    </>
  );
}

// Helper Component for the bottom stats
function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string; }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-3 rounded-2xl shadow-sm", color)}>
      <div className="mb-1 opacity-90">{icon}</div>
      <div className="text-2xl font-black leading-none mb-1">{value}</div>
      <div className="text-xs font-bold uppercase tracking-wide opacity-80">{label}</div>
    </div>
  );
}