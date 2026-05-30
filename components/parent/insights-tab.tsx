"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Brain,
  Target,
  Lightbulb,
  Heart,
  Clock,
  Zap,
  Sparkles,
  ArrowRight,
  Star,
  CheckCircle2,
} from "lucide-react";
import type { ChildProfile, Word, ProgressStats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getAdaptiveLearningRecommendation } from "@/lib/adaptive-learning";
import {
  getRecommendations,
  type AdaptiveLearningRecommendation as ApiAdaptiveLearningRecommendation,
} from "@/lib/api/adaptive";
import {
  words as mockWords,
  childProfile as mockChildProfile,
} from "@/lib/mock-data";
import { getWordsWithProgress, toWord } from "@/lib/api/vocabulary";
import { getAuthToken } from "@/lib/api/client";
import { getDailyStats, type DailyStatsResponse } from "@/lib/api/progress";
import { getChild } from "@/lib/api/children";

interface InsightsTabProps {
  childId?: string;
  stats?: ProgressStats;
  isActive?: boolean;
}

interface InsightsRecommendation {
  focusWords: string[];
  recommendedActivity: string;
  reason: string;
  estimatedDuration: number;
  styleExplanation?: string;
  suggestedActivities?: string[];
}

interface FocusWordDetail {
  id: string;
  label: string;
  categoryLabel: string;
  exposureCount: number;
  daysSincePractice: number | null;
  pendingApproval: boolean;
}

interface DailyWindowStat {
  date: string;
  label: string;
  totalMinutes: number;
  wordsEncountered: number;
  goalAchieved: boolean;
  averageEngagement: number;
  sessionCount: number;
}

const DYNAMIC_PARENT_REMINDERS = [
  {
    title: "輪流對話",
    description: "請孩子回應、補充或指認，不要只停留在大人單向講解。",
  },
  {
    title: "同一詞換情境",
    description: "在吃飯、收拾和遊戲中重用同一個詞，記憶會更穩定。",
  },
  {
    title: "看圖加動作",
    description: "圖片、聲音和手勢放在同一輪，最容易把辨認推向主動輸出。",
  },
] as const;

const ACTIVITY_LABELS = {
  story: "故事時間",
  game: "互動遊戲",
  learn: "開始學習",
  mixed: "綜合練習",
} as const;

type SupportedActivity = keyof typeof ACTIVITY_LABELS;

const ACTIVITY_ALIASES: Record<string, SupportedActivity> = {
  story: "story",
  stories: "story",
  故事時間: "story",
  朗讀故事: "story",
  繪本閱讀: "story",
  game: "game",
  games: "game",
  matching: "game",
  ispy: "game",
  pronunciation: "game",
  charades: "game",
  actions: "game",
  scavenger: "game",
  互動遊戲: "game",
  配對遊戲: "game",
  圖像配對遊戲: "game",
  圖片配對重複練習: "game",
  做動作猜謎: "game",
  肢體動作遊戲: "game",
  實物尋寶: "game",
  走動式重複練習: "game",
  角色扮演: "game",
  learn: "learn",
  learning: "learn",
  flashcards: "learn",
  song: "learn",
  quiz: "learn",
  開始學習: "learn",
  閃卡練習: "learn",
  彩色閃卡: "learn",
  兒歌與韻律: "learn",
  聲音配對: "learn",
  口語重複練習: "learn",
  慢速跟讀與節奏複誦: "learn",
  繪畫與填色: "learn",
  美勞創作: "learn",
  mixed: "mixed",
  綜合活動: "mixed",
  綜合練習: "mixed",
};

function toLocalDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDateByDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDayLabel(value: Date): string {
  return new Intl.DateTimeFormat("zh-HK", { weekday: "narrow" }).format(value);
}

function getWordDisplayLabel(word: Word): string {
  return word.word_cantonese?.trim() || word.word.trim();
}

function getCategoryDisplayLabel(word: Word): string {
  return (
    word.category_name_cantonese?.trim() ||
    word.categoryName?.trim() ||
    word.category
  );
}

function getDaysSincePractice(lastPracticed?: Date): number {
  if (!lastPracticed) {
    return 999;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const baseline = new Date(lastPracticed);
  baseline.setHours(0, 0, 0, 0);

  return Math.max(
    Math.floor((today.getTime() - baseline.getTime()) / (1000 * 60 * 60 * 24)),
    0,
  );
}

function buildMockDailyStats(): DailyStatsResponse[] {
  const minutes = [0, 8, 12, 6, 0, 16, 11, 9, 14, 18, 7, 17, 13, 20];
  const words = [0, 2, 3, 1, 0, 4, 2, 2, 3, 4, 1, 4, 3, 5];
  const goals = [
    false,
    false,
    true,
    false,
    false,
    true,
    true,
    false,
    true,
    true,
    false,
    true,
    true,
    true,
  ];
  const engagements = [
    0, 0.48, 0.56, 0.43, 0, 0.72, 0.68, 0.55, 0.63, 0.79, 0.44, 0.74, 0.69,
    0.82,
  ];

  return minutes.map((totalMinutes, index) => {
    const date = shiftDateByDays(new Date(), index - (minutes.length - 1));
    const wordsEncountered = words[index] ?? 0;

    return {
      date: toLocalDateKey(date),
      total_minutes: totalMinutes,
      words_encountered: wordsEncountered,
      words_mastered:
        totalMinutes > 0 ? Math.max(0, Math.floor(wordsEncountered / 2)) : 0,
      activities_completed:
        totalMinutes > 0 ? Math.max(1, Math.ceil(totalMinutes / 8)) : 0,
      xp_earned: wordsEncountered * 10,
      session_count: totalMinutes > 0 ? (totalMinutes >= 15 ? 2 : 1) : 0,
      average_engagement: engagements[index] ?? 0,
      daily_goal_progress:
        totalMinutes > 0
          ? Math.min(Math.round((wordsEncountered / 5) * 100), 100)
          : 0,
      goal_achieved: goals[index] ?? false,
    };
  });
}

const MOCK_DAILY_STATS = buildMockDailyStats();

function normalizeSupportedActivity(
  activity?: string | null,
): SupportedActivity {
  const normalized = (activity || "").trim().toLowerCase();
  return ACTIVITY_ALIASES[normalized] || "learn";
}

function normalizeSuggestedActivities(
  activities?: string[] | null,
): SupportedActivity[] {
  if (!activities || activities.length === 0) {
    return [];
  }

  return Array.from(
    new Set(activities.map((activity) => normalizeSupportedActivity(activity))),
  );
}

function createEmptyProfile(childId?: string): ChildProfile {
  return {
    id: childId ?? "",
    name: "小朋友",
    avatar: "👧",
    age: 0,
    level: 1,
    xp: 0,
    wordsLearned: 0,
    currentStreak: 0,
    interests: [],
    dailyGoal: 10,
    todayProgress: 0,
    learningStyle: "mixed",
    languagePreference: "bilingual",
    attentionSpan: 15,
    preferredTimeOfDay: "afternoon",
  };
}

function buildFallbackFocusWords(
  allWords: Word[],
  limit: number = 5,
): string[] {
  const prioritizedWords = [...allWords]
    .filter(
      (word) =>
        word.pendingActiveVocabApproval ||
        (!word.mastered && word.exposureCount > 0) ||
        word.exposureCount === 0,
    )
    .sort((left, right) => {
      const pendingDelta =
        Number(Boolean(right.pendingActiveVocabApproval)) -
        Number(Boolean(left.pendingActiveVocabApproval));
      if (pendingDelta !== 0) {
        return pendingDelta;
      }

      if (left.exposureCount !== right.exposureCount) {
        return left.exposureCount - right.exposureCount;
      }

      return (
        getDaysSincePractice(right.lastPracticed) -
        getDaysSincePractice(left.lastPracticed)
      );
    });

  return Array.from(
    new Set(
      prioritizedWords
        .map((word) => getWordDisplayLabel(word))
        .filter((label) => Boolean(label.trim())),
    ),
  ).slice(0, limit);
}

function buildDailyStatsWindow(
  allStats: DailyStatsResponse[],
  days: number,
  offsetDays: number = 0,
): DailyWindowStat[] {
  const statsByDate = new Map(allStats.map((stat) => [stat.date, stat]));

  return Array.from({ length: days }, (_, index) => {
    const daysFromToday = offsetDays + (days - 1 - index);
    const date = shiftDateByDays(new Date(), -daysFromToday);
    const dateKey = toLocalDateKey(date);
    const stat = statsByDate.get(dateKey);

    return {
      date: dateKey,
      label: formatDayLabel(date),
      totalMinutes: stat?.total_minutes ?? 0,
      wordsEncountered: stat?.words_encountered ?? 0,
      goalAchieved: stat?.goal_achieved ?? false,
      averageEngagement: stat?.average_engagement ?? 0,
      sessionCount: stat?.session_count ?? 0,
    };
  });
}

function buildLocalRecommendation(
  allWords: Word[],
  profile: ChildProfile,
): InsightsRecommendation | null {
  if (allWords.length === 0) {
    return null;
  }

  const recommendation = getAdaptiveLearningRecommendation(
    allWords,
    profile,
    profile.attentionSpan || 15,
  );

  return {
    focusWords: recommendation.nextWords
      .map((word) => getWordDisplayLabel(word))
      .filter((label) => Boolean(label.trim())),
    recommendedActivity: normalizeSupportedActivity(
      recommendation.recommendedActivity,
    ),
    reason: recommendation.reason,
    estimatedDuration: recommendation.estimatedDuration,
    styleExplanation: undefined,
    suggestedActivities: undefined,
  };
}

function buildApiRecommendation(
  apiRecommendation: ApiAdaptiveLearningRecommendation,
  allWords: Word[],
  fallbackProfile: ChildProfile,
): InsightsRecommendation | null {
  if (allWords.length === 0 && !apiRecommendation.recommended_activity) {
    return null;
  }

  return {
    focusWords: apiRecommendation.next_words
      .map((wordId) => allWords.find((word) => word.id === wordId))
      .filter((word): word is Word => Boolean(word))
      .map((word) => getWordDisplayLabel(word))
      .filter((label) => Boolean(label.trim())),
    recommendedActivity: normalizeSupportedActivity(
      apiRecommendation.recommended_activity,
    ),
    reason: apiRecommendation.reason,
    estimatedDuration:
      apiRecommendation.estimated_duration ||
      fallbackProfile.attentionSpan ||
      15,
    styleExplanation: apiRecommendation.style_explanation,
    suggestedActivities: normalizeSuggestedActivities(
      apiRecommendation.suggested_activities,
    ),
  };
}

export function InsightsTab({
  childId,
  stats,
  isActive = false,
}: InsightsTabProps = {}) {
  const router = useRouter();

  const isMockData =
    !childId ||
    childId === "1" ||
    childId === "mock-child-id" ||
    childId.length < 10;

  const [profile, setProfile] = useState<ChildProfile>(() =>
    isMockData ? mockChildProfile : createEmptyProfile(childId),
  );
  const [words, setWords] = useState<Word[]>(() =>
    isMockData ? mockWords : [],
  );
  const [dailyStats, setDailyStats] = useState<DailyStatsResponse[]>(() =>
    isMockData ? MOCK_DAILY_STATS : [],
  );
  const [recommendation, setRecommendation] =
    useState<InsightsRecommendation | null>(() =>
      isMockData ? buildLocalRecommendation(mockWords, mockChildProfile) : null,
    );
  const wasActiveRef = useRef(isActive);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRealData = useCallback(
    async (options?: { background?: boolean }) => {
      const isBackgroundRefresh = options?.background === true;

      if (isMockData) {
        setProfile(mockChildProfile);
        setWords(mockWords);
        setDailyStats(MOCK_DAILY_STATS);
        setRecommendation(
          buildLocalRecommendation(mockWords, mockChildProfile),
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const fallbackProfile = createEmptyProfile(childId);

      if (isBackgroundRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setProfile(fallbackProfile);
        setWords([]);
        setDailyStats([]);
        setRecommendation(null);
      }

      try {
        const token = getAuthToken();
        if (!token) {
          console.log("No auth token, using mock data");
          setDailyStats([]);
          setRecommendation(null);
          return;
        }

        const [childResult, wordsResult, statsResult, recommendationResult] =
          await Promise.allSettled([
            getChild(childId!),
            getWordsWithProgress(childId!),
            getDailyStats(childId!, 14),
            getRecommendations(childId!),
          ]);

        let resolvedProfile = fallbackProfile;
        let resolvedWords: Word[] = [];

        // Update profile with real data
        if (childResult.status === "fulfilled") {
          const c = childResult.value;
          resolvedProfile = {
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
            dailyGoal: c.daily_goal || 10,
            todayProgress: 0,
            attentionSpan: c.attention_span || 15,
            preferredTimeOfDay:
              c.preferred_time_of_day || fallbackProfile.preferredTimeOfDay,
          };
          setProfile(resolvedProfile);
        }

        // Update words
        if (wordsResult.status === "fulfilled") {
          resolvedWords = wordsResult.value.map((w) => toWord(w, w.progress));
          setWords(resolvedWords);
          console.log(`[Insights] Loaded ${resolvedWords.length} words`);
        }

        if (statsResult.status === "fulfilled") {
          setDailyStats(statsResult.value);
        }

        let resolvedRecommendation =
          recommendationResult.status === "fulfilled"
            ? buildApiRecommendation(
                recommendationResult.value,
                resolvedWords,
                resolvedProfile,
              )
            : null;

        if (
          (!resolvedRecommendation ||
            resolvedRecommendation.focusWords.length === 0) &&
          resolvedWords.length > 0
        ) {
          resolvedRecommendation = buildLocalRecommendation(
            resolvedWords,
            resolvedProfile,
          );
        }

        if (
          resolvedRecommendation &&
          resolvedRecommendation.focusWords.length === 0
        ) {
          resolvedRecommendation = {
            ...resolvedRecommendation,
            focusWords: buildFallbackFocusWords(resolvedWords),
          };
        }

        setRecommendation(resolvedRecommendation);
      } catch (error) {
        console.error("Failed to load data for insights:", error);
      } finally {
        if (isBackgroundRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [childId, isMockData],
  );

  useEffect(() => {
    void loadRealData();
  }, [loadRealData]);

  useEffect(() => {
    if (isMockData) {
      return;
    }

    const handleWindowFocus = () => {
      void loadRealData({ background: true });
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [isMockData, loadRealData]);

  useEffect(() => {
    if (isMockData) {
      wasActiveRef.current = isActive;
      return;
    }

    if (isActive && !wasActiveRef.current) {
      void loadRealData({ background: true });
    }

    wasActiveRef.current = isActive;
  }, [isActive, isMockData, loadRealData]);

  const activeVocab =
    stats?.activeVocabulary ?? words.filter((w) => w.mastered).length;
  const passiveVocab =
    stats?.passiveVocabulary ??
    words.filter((w) => !w.mastered && w.exposureCount > 0).length;
  const exposureBacklogWords = words.filter(
    (word) =>
      !word.mastered && word.exposureCount > 0 && word.exposureCount < 6,
  );
  const pendingApprovalWords = words.filter(
    (word) => word.pendingActiveVocabApproval,
  );
  const wellLearned = words.filter((word) => word.exposureCount >= 6).length;
  const masteredProgress =
    words.length > 0 ? (wellLearned / words.length) * 100 : 0;
  const averageExposures =
    stats?.averageExposuresPerWord ??
    (words.length > 0
      ? words.reduce((sum, word) => sum + word.exposureCount, 0) / words.length
      : 0);
  const trackedVocabulary = activeVocab + passiveVocab;
  const activeShare =
    trackedVocabulary > 0
      ? Math.round((activeVocab / trackedVocabulary) * 100)
      : 0;
  const averageExposureDescription =
    averageExposures >= 6
      ? "平均接觸次數已達穩定記憶門檻，可逐步加強短句和主動命名。"
      : averageExposures >= 3
        ? "多數詞語已進入記憶建立期，繼續把重點詞帶進日常對話和複習。"
        : "目前仍在累積早期接觸，建議集中重複少量重點詞，把平均次數慢慢拉高。";

  const weeklyWindow = buildDailyStatsWindow(dailyStats, 7);
  const previousWindow = buildDailyStatsWindow(dailyStats, 7, 7);
  const totalMinutesThisWeek = weeklyWindow.reduce(
    (sum, day) => sum + day.totalMinutes,
    0,
  );
  const totalWordsThisWeek = weeklyWindow.reduce(
    (sum, day) => sum + day.wordsEncountered,
    0,
  );
  const totalSessionsThisWeek = weeklyWindow.reduce(
    (sum, day) => sum + day.sessionCount,
    0,
  );
  const activeDaysThisWeek = weeklyWindow.filter(
    (day) => day.totalMinutes > 0 || day.wordsEncountered > 0,
  ).length;
  const goalHitDaysThisWeek = weeklyWindow.filter(
    (day) => day.goalAchieved,
  ).length;
  const previousMinutes = previousWindow.reduce(
    (sum, day) => sum + day.totalMinutes,
    0,
  );
  const previousWords = previousWindow.reduce(
    (sum, day) => sum + day.wordsEncountered,
    0,
  );
  const minuteDelta = totalMinutesThisWeek - previousMinutes;
  const wordDelta = totalWordsThisWeek - previousWords;
  const activeWeekStats = weeklyWindow.filter(
    (day) => day.totalMinutes > 0 || day.wordsEncountered > 0,
  );
  const averageEngagement =
    activeWeekStats.length > 0
      ? activeWeekStats.reduce((sum, day) => sum + day.averageEngagement, 0) /
        activeWeekStats.length
      : 0;
  const engagementPercent = Math.round(averageEngagement * 100);
  const maxDailyMinutes = Math.max(
    ...weeklyWindow.map((day) => day.totalMinutes),
    10,
  );

  const resolveCategoryLabel = (category: string) => {
    const match = words.find(
      (word) =>
        word.category === category ||
        word.categoryName === category ||
        word.category_name_cantonese === category,
    );

    return match?.category_name_cantonese || match?.categoryName || category;
  };

  const weakestCategory =
    [...(stats?.categoryProgress ?? [])]
      .filter(
        (category) =>
          category.total === undefined ||
          category.mastered === undefined ||
          category.total > category.mastered,
      )
      .sort((left, right) => left.progress - right.progress)[0] ?? null;
  const weakestCategoryLabel = weakestCategory
    ? resolveCategoryLabel(weakestCategory.category)
    : null;
  const weakestCategoryRemaining =
    weakestCategory?.total !== undefined &&
    weakestCategory.mastered !== undefined
      ? Math.max(weakestCategory.total - weakestCategory.mastered, 0)
      : null;

  const focusWordDetails: FocusWordDetail[] = [...words]
    .filter((word) => word.pendingActiveVocabApproval || !word.mastered)
    .sort((left, right) => {
      const pendingDelta =
        Number(Boolean(right.pendingActiveVocabApproval)) -
        Number(Boolean(left.pendingActiveVocabApproval));
      if (pendingDelta !== 0) {
        return pendingDelta;
      }

      if (left.exposureCount !== right.exposureCount) {
        return left.exposureCount - right.exposureCount;
      }

      return (
        getDaysSincePractice(right.lastPracticed) -
        getDaysSincePractice(left.lastPracticed)
      );
    })
    .slice(0, 4)
    .map((word) => ({
      id: word.id,
      label: getWordDisplayLabel(word),
      categoryLabel: getCategoryDisplayLabel(word),
      exposureCount: word.exposureCount,
      daysSincePractice:
        word.lastPracticed !== undefined
          ? getDaysSincePractice(word.lastPracticed)
          : null,
      pendingApproval: Boolean(word.pendingActiveVocabApproval),
    }));

  const focusWordLabels =
    recommendation?.focusWords.length && recommendation.focusWords.length > 0
      ? recommendation.focusWords
      : buildFallbackFocusWords(words);

  let momentumTitle = "等待新數據";
  let momentumDescription = `${profile.name} 這一週還未累積足夠練習，完成一次短練習後這裡就會開始變化。`;

  if (totalMinutesThisWeek > 0 || totalWordsThisWeek > 0) {
    if (minuteDelta > 10 || wordDelta > 2) {
      momentumTitle = "節奏正在升溫";
      momentumDescription = `相較上週多了 ${Math.max(minuteDelta, 0)} 分鐘與 ${Math.max(wordDelta, 0)} 個接觸詞彙，近期動能明顯回升。`;
    } else if (minuteDelta < -10 && wordDelta <= 0) {
      momentumTitle = "需要重新拉回節奏";
      momentumDescription = `這週比上週少了 ${Math.abs(minuteDelta)} 分鐘，建議先用短時段把練習頻率拉回來。`;
    } else {
      momentumTitle = "節奏大致穩定";
      momentumDescription = `${profile.name} 這週維持了 ${activeDaysThisWeek} 天活躍，適合在現有節奏上把辨認再推向主動說出。`;
    }
  }

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

  const getTimeLabel = (time: string) => {
    switch (time) {
      case "morning":
        return "早上";
      case "afternoon":
        return "下午";
      case "evening":
        return "晚上";
      default:
        return time;
    }
  };

  const getRecommendedActivities = (style: string) => {
    switch (style) {
      case "kinesthetic":
        return ["game", "learn"];
      case "visual":
        return ["story", "learn"];
      case "auditory":
        return ["story", "learn"];
      default:
        return ["mixed", "story", "game"];
    }
  };

  const getActivityLabel = (activity: string) => {
    return ACTIVITY_LABELS[normalizeSupportedActivity(activity)];
  };

  const getRecommendedTab = (activity: string) => {
    switch (normalizeSupportedActivity(activity)) {
      case "story":
        return "stories";
      case "game":
        return "games";
      default:
        return "learn";
    }
  };

  const handleOpenRecommendedActivity = () => {
    if (!recommendation) {
      return;
    }

    router.push(
      `/child?tab=${getRecommendedTab(recommendation.recommendedActivity)}`,
    );
  };

  const parentActionPlan = (() => {
    const actions: string[] = [];

    if (goalHitDaysThisWeek <= 2) {
      actions.push(
        `把練習固定在${getTimeLabel(profile.preferredTimeOfDay)}，先做 ${Math.min(Math.max(profile.attentionSpan, 5), 10)} 分鐘短練習，先求穩定再加量。`,
      );
    }

    if (
      weakestCategoryLabel &&
      weakestCategory &&
      weakestCategory.progress < 60
    ) {
      actions.push(
        `本週優先補「${weakestCategoryLabel}」，先從還未穩定的 ${weakestCategoryRemaining ?? 0} 個詞中挑 2 個帶入日常情境。`,
      );
    }

    if (pendingApprovalWords.length > 0) {
      actions.push(
        `有 ${pendingApprovalWords.length} 個詞等待家長確認主動使用，今晚可請孩子用完整短句說一次再確認。`,
      );
    }

    if (actions.length < 3 && exposureBacklogWords.length > 0) {
      actions.push(
        `${exposureBacklogWords.length} 個詞仍未達 6 次接觸，優先重複 ${focusWordLabels.slice(0, 2).join("、") || "本週重點詞"}，每個詞做看圖、跟讀和動作各一次。`,
      );
    }

    if (actions.length < 3 && averageExposures < 4) {
      actions.push(
        `平均每個詞目前只接觸 ${averageExposures.toFixed(1)} 次，先集中重複 ${focusWordLabels.slice(0, 2).join("、") || "本週重點詞"}，把接觸次數慢慢拉近 6 次。`,
      );
    }

    if (actions.length < 3 && passiveVocab > activeVocab) {
      actions.push(
        `目前辨認詞彙比主動說出的詞多 ${passiveVocab - activeVocab} 個，可多問「這是什麼？」和「你看到什麼？」。`,
      );
    }

    if (actions.length === 0) {
      actions.push(
        "本週節奏穩定，接下來可把已熟悉詞彙放入故事或角色扮演，從辨認推向主動輸出。",
      );
    }

    return actions.slice(0, 3);
  })();

  const liveSignals = [
    {
      title: "最需加強主題",
      value: weakestCategoryLabel || "等待更多數據",
      description: weakestCategory
        ? `掌握度 ${weakestCategory.progress}%${weakestCategoryRemaining !== null ? `，仍有 ${weakestCategoryRemaining} 個詞待穩定` : ""}`
        : "再多幾次練習後，這裡會自動指出目前最弱的一塊。",
      className: "from-amber-50 to-orange-50 border-amber-100 text-amber-900",
    },
    {
      title: "待鞏固詞彙",
      value: `${exposureBacklogWords.length} 個`,
      description:
        focusWordLabels.length > 0
          ? `優先重複 ${focusWordLabels.slice(0, 2).join("、")}`
          : "完成更多詞彙練習後會自動整理出待鞏固清單。",
      className: "from-sky-50 to-cyan-50 border-sky-100 text-sky-900",
    },
    {
      title: "家長待跟進",
      value:
        pendingApprovalWords.length > 0
          ? `${pendingApprovalWords.length} 個待確認`
          : `${goalHitDaysThisWeek} / 7 天達標`,
      description:
        pendingApprovalWords.length > 0
          ? "這些詞最接近由辨認轉為主動使用。"
          : `最近一週有 ${activeDaysThisWeek} 天出現學習活動。`,
      className:
        "from-emerald-50 to-teal-50 border-emerald-100 text-emerald-900",
    },
  ];

  const learningStyleDescription =
    recommendation?.styleExplanation ||
    getStyleDescription(profile.learningStyle);
  const learningStyleActivities =
    recommendation?.suggestedActivities &&
    recommendation.suggestedActivities.length > 0
      ? recommendation.suggestedActivities
      : getRecommendedActivities(profile.learningStyle);
  const headerHighlights = [
    {
      label: "本週活躍",
      value: `${activeDaysThisWeek} 天`,
      detail:
        goalHitDaysThisWeek > 0
          ? `${goalHitDaysThisWeek} 天達到目標`
          : "先從一次短練習開始累積",
    },
    {
      label: "優先主題",
      value: weakestCategoryLabel || "等待更多數據",
      detail:
        weakestCategoryRemaining !== null
          ? `仍有 ${weakestCategoryRemaining} 個詞待穩定`
          : "完成更多練習後會自動顯示",
    },
    {
      label: "下一步",
      value: getActivityLabel(
        recommendation?.recommendedActivity || learningStyleActivities[0],
      ),
      detail: recommendation
        ? `建議安排 ${recommendation.estimatedDuration} 分鐘`
        : "依目前學習風格整理",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 w-full rounded-4xl bg-white/50 p-4 backdrop-blur-sm md:p-6">
        <Skeleton className="h-32 w-full rounded-4xl" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-4xl" />
          <Skeleton className="h-48 rounded-4xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-4xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full rounded-4xl bg-white/50 p-4 backdrop-blur-sm md:p-6">
      <div className="relative overflow-hidden rounded-4xl border border-white/70 bg-linear-to-br from-white via-sky-50/90 to-violet-50/80 p-6 shadow-[0_24px_60px_-36px_rgba(56,189,248,0.55)] md:p-7">
        <div className="absolute -left-10 top-6 h-32 w-32 rounded-full bg-sky-100/60 blur-3xl" />
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-100/70 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full bg-white/85 px-4 py-2 shadow-sm ring-1 ring-white/80">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  refreshing ? "bg-sky-400 animate-pulse" : "bg-emerald-400",
                )}
              />
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                學習洞察
              </span>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="inline-flex items-center justify-center rounded-[1.75rem] bg-linear-to-br from-violet-100 via-fuchsia-100 to-sky-100 p-4 shadow-sm ring-1 ring-white/80">
                <Brain
                  className={cn(
                    "h-10 w-10 text-violet-500",
                    refreshing && "animate-pulse",
                  )}
                />
              </div>

              <div className="space-y-3">
                <h2 className="text-4xl font-black tracking-tight text-slate-800 sm:text-[3rem]">
                  學習動態雷達
                </h2>
                <p className="max-w-2xl text-base leading-8 text-slate-500">
                  集中查看孩子最近的學習節奏、重點詞和下一步建議。
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-107.5">
            {headerHighlights.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.6rem] bg-white/80 p-4 shadow-sm ring-1 ring-white/90 backdrop-blur-sm"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-xl font-black text-slate-800">
                  {item.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden rounded-4xl border-none bg-linear-to-br from-slate-900 via-slate-800 to-sky-900 text-white shadow-lg">
        <CardHeader className="relative overflow-hidden pb-5">
          <div className="absolute right-0 top-0 p-10 opacity-5">
            <TrendingUp className="h-56 w-56 text-white" />
          </div>
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-200">
                <TrendingUp className="h-3.5 w-3.5" />
                本週學習脈搏
              </div>
              <h3 className="text-3xl font-black tracking-tight">
                {momentumTitle}
              </h3>
              <p className="max-w-xl text-sm leading-6 text-slate-300">
                {momentumDescription}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:min-w-85">
              <div className="rounded-3xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  活躍日
                </p>
                <p className="mt-2 text-3xl font-black">{activeDaysThisWeek}</p>
                <p className="mt-1 text-sm text-slate-300">
                  最近 7 天內有練習的日數
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  完成目標
                </p>
                <p className="mt-2 text-3xl font-black">
                  {goalHitDaysThisWeek}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  最近 7 天中達標的日數
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  平均投入
                </p>
                <p className="mt-2 text-3xl font-black">{engagementPercent}%</p>
                <p className="mt-1 text-sm text-slate-300">
                  按最近活躍日的參與度估算
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  連續學習
                </p>
                <p className="mt-2 text-3xl font-black">
                  {stats?.streakDays ?? profile.currentStreak}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  目前持續中的學習天數
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-0">
          <div className="grid grid-cols-7 gap-2">
            {weeklyWindow.map((day) => {
              const height =
                day.totalMinutes > 0
                  ? Math.max((day.totalMinutes / maxDailyMinutes) * 100, 18)
                  : 8;

              return (
                <div key={day.date} className="space-y-2">
                  <div className="flex h-30 items-end rounded-3xl bg-white/6 p-2">
                    <div
                      className={cn(
                        "w-full rounded-2xl bg-linear-to-t transition-all duration-700",
                        day.totalMinutes > 0
                          ? "from-cyan-400 via-sky-400 to-emerald-300"
                          : "from-slate-700 to-slate-600",
                      )}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <div className="space-y-0.5 text-center">
                    <p className="text-xs font-bold text-slate-300">
                      {day.label}
                    </p>
                    <p className="text-xs text-slate-400">
                      {day.totalMinutes} 分
                    </p>
                    {day.goalAchieved && (
                      <p className="text-[11px] font-bold text-emerald-300">
                        達標
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                本週學習時間
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {totalMinutesThisWeek} 分鐘
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {minuteDelta >= 0 ? "比上週多" : "比上週少"}{" "}
                {Math.abs(minuteDelta)} 分鐘
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                接觸詞彙
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {totalWordsThisWeek} 個
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {wordDelta >= 0 ? "較上週增加" : "較上週減少"}{" "}
                {Math.abs(wordDelta)} 個
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                學習節奏
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {totalSessionsThisWeek} 次
              </p>
              <p className="mt-1 text-sm text-slate-300">
                最近一週累積的學習回合數
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-4xl border-none bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-slate-700">
              <Target className="h-6 w-6 text-orange-500" />
              本週最需要跟進的焦點
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              {liveSignals.map((signal) => (
                <div
                  key={signal.title}
                  className={cn(
                    "rounded-3xl border bg-linear-to-br p-4 shadow-sm",
                    signal.className,
                  )}
                >
                  <p className="text-xs font-black uppercase tracking-wider opacity-70">
                    {signal.title}
                  </p>
                  <p className="mt-2 text-xl font-black">{signal.value}</p>
                  <p className="mt-2 text-sm leading-6 opacity-80">
                    {signal.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-4xl bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-wider text-slate-400">
                    重點詞彙隊列
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    這一列會隨接觸次數、最近練習和家長確認狀態而改變。
                  </p>
                </div>
                <Badge className="border-none bg-slate-900 px-3 py-1 text-white">
                  平均接觸 {averageExposures.toFixed(1)} 次
                </Badge>
              </div>

              <div className="mt-4 grid gap-3">
                {focusWordDetails.length > 0 ? (
                  focusWordDetails.map((detail) => (
                    <div
                      key={detail.id}
                      className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-black text-slate-800">
                            {detail.label}
                          </p>
                          <Badge className="border-none bg-slate-100 text-slate-700">
                            {detail.categoryLabel}
                          </Badge>
                          {detail.pendingApproval && (
                            <Badge className="border-none bg-emerald-100 text-emerald-700">
                              等待主動詞彙確認
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          已接觸 {detail.exposureCount} 次
                          {detail.daysSincePractice !== null
                            ? `，上次練習是 ${detail.daysSincePractice} 天前`
                            : "，尚未出現有效練習紀錄"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        <div className="h-2.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-orange-400 to-rose-400"
                            style={{
                              width: `${Math.min((detail.exposureCount / 6) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span>{Math.min(detail.exposureCount, 6)} / 6</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                    暫時未有足夠的詞彙追蹤資料，完成更多學習後這裡會開始列出最值得跟進的詞。
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-3xl border border-orange-100 bg-linear-to-r from-orange-50 to-amber-50 p-4 text-sm text-orange-900">
                已達 6 次接觸的詞彙共有 {wellLearned} 個，占目前追蹤詞彙的{" "}
                {Math.round(masteredProgress)}%。這個數字每天都會隨練習改變。
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-4xl border-none bg-linear-to-br from-slate-800 to-slate-900 text-white shadow-lg">
          <div className="absolute right-0 top-0 p-10 opacity-5">
            <Lightbulb className="h-44 w-44 text-white" />
          </div>

          <CardHeader className="relative z-10">
            <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              即時建議
            </div>
            <CardTitle className="text-2xl">下一個最值得做的動作</CardTitle>
          </CardHeader>

          <CardContent className="relative z-10 space-y-6">
            {recommendation ? (
              <>
                <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm md:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleOpenRecommendedActivity}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      建議活動
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-xl font-black text-white">
                      {getActivityLabel(recommendation.recommendedActivity)}
                      <ArrowRight className="h-4 w-4 text-emerald-300" />
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      直接跳去孩子頁面開始這個活動
                    </p>
                  </button>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      建議時間
                    </p>
                    <p className="mt-2 text-xl font-black text-white">
                      {recommendation.estimatedDuration} 分鐘
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      適合安排在 {getTimeLabel(profile.preferredTimeOfDay)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">
                    重點詞彙
                  </p>
                  {focusWordLabels.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {focusWordLabels.map((word) => (
                        <Badge
                          key={word}
                          className="border-none bg-white px-4 py-1.5 text-sm font-bold text-slate-900 hover:bg-slate-200"
                        >
                          {word}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-300">
                      暫時未能整理出建議詞彙，完成更多練習後會更新。
                    </p>
                  )}
                </div>

                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <p className="text-sm leading-6 text-emerald-100">
                    <strong className="mb-1 block text-emerald-400">
                      推薦原因
                    </strong>
                    {recommendation.reason}
                  </p>
                </div>

                <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    家長下一步
                  </p>
                  <div className="grid gap-3">
                    {parentActionPlan.map((action) => (
                      <div
                        key={action}
                        className="flex items-start gap-3 rounded-2xl bg-white/6 p-3"
                      >
                        <div className="mt-0.5 rounded-full bg-emerald-400/20 p-1 text-emerald-300">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <p className="text-sm leading-6 text-slate-200">
                          {action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleOpenRecommendedActivity}
                  className="w-full rounded-full bg-emerald-400 font-black text-slate-950 hover:bg-emerald-300"
                >
                  前往 {getActivityLabel(recommendation.recommendedActivity)}
                </Button>
              </>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
                暫時未有足夠的活動建議數據，待孩子完成更多學習後會自動更新。
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-4xl border-none bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-slate-700">
              <Heart className="h-6 w-6 fill-pink-500 text-pink-500" />
              學習風格與輸出轉化
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-6 rounded-3xl border border-pink-100 bg-pink-50 p-6 sm:flex-row">
              <div className="rounded-full bg-white p-4 text-6xl shadow-sm shrink-0">
                {profile.learningStyle === "kinesthetic" && "🤸"}
                {profile.learningStyle === "visual" && "👀"}
                {profile.learningStyle === "auditory" && "👂"}
                {profile.learningStyle === "mixed" && "🎨"}
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <h3 className="text-2xl font-black capitalize text-pink-900">
                  {getStyleLabel(profile.learningStyle)}
                </h3>
                <p className="font-medium text-pink-800/80">
                  {learningStyleDescription}
                </p>
              </div>
            </div>

            <div>
              <h4 className="mb-4 flex items-center gap-2 font-bold text-slate-700">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                建議活動
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {learningStyleActivities.map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                  >
                    <div className="h-2 w-2 shrink-0 rounded-full bg-pink-400" />
                    <span className="text-sm font-medium text-slate-600">
                      {getActivityLabel(activity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  主動詞彙佔比
                </p>
                <p className="mt-2 text-3xl font-black text-slate-800">
                  {activeShare}%
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  目前 {activeVocab} 個主動詞彙，{passiveVocab}{" "}
                  個仍主要停留在辨認階段。
                </p>
              </div>

              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  平均接觸次數
                </p>
                <p className="mt-2 text-3xl font-black text-slate-800">
                  {averageExposures.toFixed(1)} 次
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {averageExposureDescription}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-4xl border-none bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-indigo-900">
              <Lightbulb className="h-6 w-6 text-indigo-500" />
              家長互動提醒
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {DYNAMIC_PARENT_REMINDERS.map((tip) => (
              <div
                key={tip.title}
                className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
              >
                <p className="font-black text-slate-800">{tip.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {tip.description}
                </p>
              </div>
            ))}

            <div className="rounded-3xl border border-sky-100 bg-linear-to-r from-sky-50 to-cyan-50 p-4">
              <p className="text-sm font-black text-sky-900">
                怎樣用會較自然？
              </p>
              <p className="mt-1 text-sm leading-6 text-sky-800/80">
                不用一次把三條都做完。每次練習只要挑一條，放進吃飯、收拾或遊戲中的
                1 到 2 分鐘互動，就已經足夠。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
