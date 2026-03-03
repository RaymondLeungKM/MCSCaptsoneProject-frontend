"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Brain,
  Target,
  Lightbulb,
  Heart,
  Clock,
  Zap,
  BookOpen,
  Sparkles,
  ArrowRight,
  Info,
  Star, // <--- Added missing import
  CheckCircle2, // Used for the check icons
} from "lucide-react";
import type { ChildProfile, Word, LearningSession } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  generateParentInsights,
  getAdaptiveLearningRecommendation,
} from "@/lib/adaptive-learning";
import {
  words as mockWords,
  childProfile as mockChildProfile,
} from "@/lib/mock-data";
import { getWordsWithProgress, toWord } from "@/lib/api/vocabulary";
import { getAuthToken } from "@/lib/api/client";
import { getDailyStats } from "@/lib/api/progress";
import { getChild } from "@/lib/api/children";
import { cn } from "@/lib/utils";

interface InsightsTabProps {
  childId?: string;
}

export function InsightsTab({ childId }: InsightsTabProps = {}) {
  const [profile, setProfile] = useState<ChildProfile>(mockChildProfile);
  const [words, setWords] = useState<Word[]>(mockWords);
  const [recentSessions, setRecentSessions] = useState<LearningSession[]>([
    {
      id: "mock-1",
      childId: mockChildProfile.id,
      date: new Date(),
      duration: 15,
      wordsEncountered: ["elephant", "giraffe", "apple", "butterfly"],
      wordsUsedActively: ["elephant", "apple"],
      engagementLevel: "high",
      activitiesCompleted: ["story", "charades"],
    },
  ]);
  const [loading, setLoading] = useState(true);

  // Check if we have a real child ID (not mock)
  const isMockData =
    !childId ||
    childId === "1" ||
    childId === "mock-child-id" ||
    childId.length < 10;

  // Fetch real data if we have a real child ID
  useEffect(() => {
    async function loadRealData() {
      if (isMockData) {
        setLoading(false);
        return;
      }

      try {
        const token = getAuthToken();
        if (!token) {
          console.log("No auth token, using mock data");
          setLoading(false);
          return;
        }

        // Fetch child profile, words, and daily stats in parallel
        const [childResult, wordsResult, statsResult] =
          await Promise.allSettled([
            getChild(childId!),
            getWordsWithProgress(childId!),
            getDailyStats(childId!, 7),
          ]);

        // Update profile with real data
        if (childResult.status === "fulfilled") {
          const c = childResult.value;
          setProfile({
            id: c.id,
            name: c.name,
            avatar: c.avatar,
            age: c.age,
            level: c.level,
            xp: c.xp,
            wordsLearned: c.words_learned,
            currentStreak: c.current_streak,
            interests: c.interests || [],
            learningStyle: c.learning_style || "mixed",
            languagePreference: c.language_preference || "bilingual",
          });
        }

        // Update words
        if (wordsResult.status === "fulfilled") {
          const loadedWords = wordsResult.value.map((w) =>
            toWord(w, w.progress),
          );
          setWords(loadedWords);
          console.log(`[Insights] Loaded ${loadedWords.length} words`);
        }

        // Build approximate LearningSession objects from daily stats
        if (
          statsResult.status === "fulfilled" &&
          statsResult.value.length > 0
        ) {
          const sessions: LearningSession[] = statsResult.value.map(
            (s: any) => ({
              id: `session-${s.date}`,
              childId: childId!,
              date: new Date(s.date),
              duration: s.total_minutes || 0,
              // daily stats only give counts, not word IDs – use empty array
              wordsEncountered: Array(s.words_encountered || 0).fill(""),
              wordsUsedActively: [],
              engagementLevel:
                s.average_engagement >= 0.7
                  ? "high"
                  : s.average_engagement >= 0.4
                    ? "medium"
                    : "low",
              activitiesCompleted: Array(s.activities_completed || 0).fill(
                "game",
              ),
            }),
          );
          setRecentSessions(sessions);
          console.log(
            `[Insights] Built ${sessions.length} sessions from stats`,
          );
        }
      } catch (error) {
        console.error("Failed to load data for insights:", error);
      } finally {
        setLoading(false);
      }
    }

    loadRealData();
  }, [childId, isMockData]);

  const insights = generateParentInsights(profile, words, recentSessions);
  const recommendation = getAdaptiveLearningRecommendation(words, profile, 15);

  // Calculate stats
  const activeVocab = words.filter((w) => w.mastered).length;
  const passiveVocab = words.filter(
    (w) => !w.mastered && w.exposureCount > 0,
  ).length;
  const needingExposure = words.filter((w) => w.exposureCount < 6).length;
  const wellLearned = words.filter((w) => w.exposureCount >= 6).length;

  // Translation Helper for Learning Styles
  const getStyleLabel = (style: string) => {
    switch (style) {
      case "kinesthetic":
        return "動覺型 (Kinesthetic)";
      case "visual":
        return "視覺型 (Visual)";
      case "auditory":
        return "聽覺型 (Auditory)";
      case "mixed":
        return "混合型 (Mixed)";
      default:
        return style;
    }
  };

  const getStyleDescription = (style: string) => {
    switch (style) {
      case "kinesthetic":
        return "透過肢體動作、觸摸和實踐活動學習效果最佳。";
      case "visual":
        return "透過圖像、顏色和視覺演示學習效果最佳。";
      case "auditory":
        return "透過聲音、音樂和口頭指令學習效果最佳。";
      case "mixed":
        return "結合多種學習方式能達到最佳效果。";
      default:
        return "";
    }
  };

  const getRecommendedActivities = (style: string) => {
    switch (style) {
      case "kinesthetic":
        return [
          "做動作猜謎",
          "肢體動作遊戲",
          "實物尋寶",
          "角色扮演",
        ];
      case "visual":
        return ["圖像配對遊戲", "彩色閃卡", "繪本閱讀", "繪畫與填色"];
      case "auditory":
        return ["兒歌與韻律", "朗讀故事", "聲音配對", "口語重複練習"];
      default:
        return ["綜合活動", "講故事", "互動遊戲", "美勞創作"];
    }
  };

  // Translation Helper for Activities
  const getActivityLabel = (activity: string) => {
    const map: { [key: string]: string } = {
      story: "故事時間",
      game: "互動遊戲",
      flashcards: "閃卡練習",
      song: "唱遊時間",
      quiz: "小測驗",
      charades: "做動作猜謎",
    };
    return map[activity.toLowerCase()] || activity;
  };

  if (loading) {
    return (
      <div className="space-y-6 w-full p-4 md:p-6 bg-white/50 backdrop-blur-sm rounded-[32px]">
        <Skeleton className="h-32 w-full rounded-[32px]" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-[28px]" />
          <Skeleton className="h-48 rounded-[28px]" />
        </div>
        <Skeleton className="h-64 w-full rounded-[28px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full p-4 md:p-6 bg-white/50 backdrop-blur-sm rounded-[32px]">
      {/* --- HEADER --- */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded-2xl mb-2 shadow-sm">
          <Brain className="w-8 h-8 text-violet-500 animate-pulse" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
          AI 學習洞察
        </h2>
        <p className="text-slate-500 font-medium max-w-lg mx-auto">
          深入分析 {profile.name} 的詞彙發展，提供有科學根據的學習建議。
        </p>
      </div>

      {/* --- KEY METRICS (Active vs Passive) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Vocab Card */}
        <Card className="border-none shadow-md bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 rounded-[28px] relative overflow-hidden transition-transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Zap className="w-32 h-32 text-emerald-600" />
          </div>
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                <Zap className="w-5 h-5" />
              </div>
              <span className="font-bold text-emerald-900 uppercase tracking-wider text-sm">
                主動詞彙
              </span>
            </div>
            <div>
              <span className="text-5xl font-black text-emerald-700">
                {activeVocab}
              </span>
              <span className="text-emerald-600/80 ml-2 font-bold text-lg">
                個
              </span>
            </div>
            <p className="text-sm text-emerald-700/70 mt-3 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> 能自信地在對話中使用
            </p>
          </CardContent>
        </Card>

        {/* Passive Vocab Card */}
        <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 rounded-[28px] relative overflow-hidden transition-transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <BookOpen className="w-32 h-32 text-blue-600" />
          </div>
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                <Brain className="w-5 h-5" />
              </div>
              <span className="font-bold text-blue-900 uppercase tracking-wider text-sm">
                被動詞彙
              </span>
            </div>
            <div>
              <span className="text-5xl font-black text-blue-700">
                {passiveVocab}
              </span>
              <span className="text-blue-600/80 ml-2 font-bold text-lg">
                個
              </span>
            </div>
            <p className="text-sm text-blue-700/70 mt-3 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> 聽得懂但仍在學習中
            </p>
          </CardContent>
        </Card>
      </div>

      {/* --- EXPOSURE TRACKING --- */}
      <Card className="border-none shadow-sm bg-white rounded-[28px]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-slate-700 text-xl">
            <Target className="w-6 h-6 text-orange-500" />
            詞彙接觸頻率追蹤
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="text-slate-500">已掌握詞彙 (接觸 6 次以上)</span>
              <span className="font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                {wellLearned} / {words.length}
              </span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(wellLearned / words.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-5 flex gap-4 items-start">
            <div className="bg-white p-2 rounded-full shadow-sm shrink-0 text-orange-500">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-orange-900">專家研究指出</p>
              <p className="text-sm text-orange-800/80 leading-relaxed">
                兒童通常需要在不同情境下接觸一個新詞彙 <strong>6-12 次</strong>
                ，才能將其轉化為長期記憶。
                {profile.name} 還有 <strong>{needingExposure}</strong>{" "}
                個詞彙需要更多練習！
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- PERSONALIZED INSIGHTS --- */}
      <Card className="border-none shadow-sm bg-gradient-to-br from-yellow-50 to-amber-50 rounded-[28px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-amber-800 text-xl">
            <Lightbulb className="w-6 h-6 text-amber-500 fill-amber-500" />
            個人化學習建議
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {/* Note: In a real app, these insights strings should also be localized in the generator function */}
            {insights.map((insight, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 bg-white/80 rounded-2xl shadow-sm border border-amber-100/50"
              >
                <div className="shrink-0 mt-0.5 text-xl">💡</div>
                <p className="text-slate-700 font-medium leading-relaxed">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* --- RECOMMENDATION CARD (HERO) --- */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-[28px] overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <TrendingUp className="w-64 h-64 text-white" />
        </div>

        <CardHeader>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit mb-2">
            <Sparkles className="w-3 h-3" /> 為你推薦
          </div>
          <CardTitle className="flex items-center gap-3 text-2xl">
            推薦學習活動
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          <div className="grid grid-cols-2 gap-6 p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold mb-1">
                活動類型
              </p>
              <p className="text-xl font-bold capitalize text-white flex items-center gap-2">
                {getActivityLabel(recommendation.recommendedActivity)}{" "}
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold mb-1">
                建議時間
              </p>
              <p className="text-xl font-bold text-white">
                {recommendation.estimatedDuration} 分鐘
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-400 font-bold uppercase mb-3">
              重點詞彙
            </p>
            <div className="flex flex-wrap gap-2">
              {recommendation.nextWords.map((word) => (
                <Badge
                  key={word.id}
                  className="bg-white text-slate-900 hover:bg-slate-200 px-4 py-1.5 text-sm font-bold border-none"
                >
                  {word.word}
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-sm text-emerald-100 leading-relaxed">
              <strong className="text-emerald-400 block mb-1">推薦原因</strong>
              {recommendation.reason}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* --- LEARNING STYLE --- */}
      <Card className="border-none shadow-sm bg-white rounded-[28px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-700 text-xl">
            <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
            學習風格分析
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-pink-50 rounded-[24px] border border-pink-100">
            <div className="text-6xl bg-white p-4 rounded-full shadow-sm shrink-0">
              {profile.learningStyle === "kinesthetic" && "🤸"}
              {profile.learningStyle === "visual" && "👀"}
              {profile.learningStyle === "auditory" && "👂"}
              {profile.learningStyle === "mixed" && "🎨"}
            </div>
            <div className="text-center sm:text-left space-y-2">
              <h3 className="font-black text-2xl text-pink-900 capitalize">
                {getStyleLabel(profile.learningStyle)}
              </h3>
              <p className="text-pink-800/80 font-medium">
                {getStyleDescription(profile.learningStyle)}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              建議活動
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {getRecommendedActivities(profile.learningStyle).map(
                (activity, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                  >
                    <div className="w-2 h-2 rounded-full bg-pink-400 shrink-0" />
                    <span className="text-slate-600 font-medium text-sm">
                      {activity}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- BEST PRACTICES GRID --- */}
      <Card className="border-none shadow-sm bg-white rounded-[28px] overflow-hidden">
        <CardHeader className="bg-indigo-50 border-b border-indigo-100/50">
          <CardTitle className="flex items-center gap-3 text-indigo-900 text-xl">
            <Clock className="w-6 h-6 text-indigo-500" />
            專家學習錦囊
          </CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="p-6 hover:bg-slate-50 transition-colors">
            <div className="flex items-start gap-4">
              <span className="text-3xl bg-indigo-100 p-2 rounded-xl">🔄</span>
              <div>
                <p className="font-bold text-slate-800 text-lg mb-1">
                  輪流對話
                </p>
                <p className="text-slate-500 text-sm leading-relaxed">
                  進行一來一往的對話。引導 {profile.name} 回應，而不僅僅是聆聽。
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 hover:bg-slate-50 transition-colors">
            <div className="flex items-start gap-4">
              <span className="text-3xl bg-indigo-100 p-2 rounded-xl">🔁</span>
              <div>
                <p className="font-bold text-slate-800 text-lg mb-1">
                  重複接觸
                </p>
                <p className="text-slate-500 text-sm leading-relaxed">
                  在日常生活中不同情境下使用新詞彙。目標是創造 6-12
                  次有意義的接觸。
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 hover:bg-slate-50 transition-colors border-t border-slate-100 md:border-none">
            <div className="flex items-start gap-4">
              <span className="text-3xl bg-indigo-100 p-2 rounded-xl">🌍</span>
              <div>
                <p className="font-bold text-slate-800 text-lg mb-1">
                  生活應用
                </p>
                <p className="text-slate-500 text-sm leading-relaxed">
                  在日常作息中，將詞彙與真實的物體和體驗連結起來。
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 hover:bg-slate-50 transition-colors border-t border-slate-100 md:border-none">
            <div className="flex items-start gap-4">
              <span className="text-3xl bg-indigo-100 p-2 rounded-xl">👐</span>
              <div>
                <p className="font-bold text-slate-800 text-lg mb-1">
                  多感官學習
                </p>
                <p className="text-slate-500 text-sm leading-relaxed">
                  結合視覺、聲音、手勢和肢體動作，能顯著提升記憶效果。
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
