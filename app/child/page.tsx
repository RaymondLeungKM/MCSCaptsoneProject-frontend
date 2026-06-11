"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Book,
  Clock3,
  Sparkles,
  ShieldAlert,
  Brain,
  Zap,
  BookMarked,
} from "lucide-react";
import CozyPageWrapper from "@/components/CozyPageWrapper";

// --- COMPONENTS ---
import { ProfileHeader } from "@/components/child/profile-header";
import { DailyWordsViewer } from "@/components/child/daily-words-viewer";
import { CategoryGrid } from "@/components/child/category-grid";
import {
  BedtimeStoryGenerator,
  type BedtimeStoryTheme,
} from "@/components/child/bedtime-story";
import { GamesList } from "@/components/child/game-card";
import { ChildMissionsPanel } from "@/components/child/child-missions-panel";
import { CartoonKeyframes } from "@/components/child/cartoon-characters";
import { OwlCompanion } from "@/components/child/owl-companion";
import { ChildNavigation } from "@/components/child/navigation";
import { StoryCard } from "@/components/child/story-card";
import { ProfileView } from "@/components/views/profile-view";
import { RewardsView } from "@/components/views/rewards-view";

import { BedtimeStoryReader } from "@/components/modals/bedtime-story-reader";
import { CommunityTab } from "@/components/child/community-tab";
import { ParentPinModal } from "@/components/modals/parent-pin-modal";
import { QuizGame } from "@/components/child/games/quiz-game";
import { WordBuilderGame } from "@/components/child/games/word-builder-game";
import { SpeakingGame } from "@/components/child/games/speaking-game";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  getCategories,
  getChild,
  getChildren,
  toCategory,
  toChildProfile,
} from "@/lib/api";
import {
  generateStoryWithExternalProgram,
  getChildStories,
  getStory,
} from "@/lib/api/bedtime-stories";
import {
  endLearningSession,
  getLearningControlStatus,
  startLearningSession,
} from "@/lib/api/progress";
import type { LearningControlStatusResponse } from "@/lib/api/progress";
import { getWordOfTheDay, getNextActivity } from "@/lib/api/adaptive";
import type { WordOfTheDayResponse } from "@/lib/api/adaptive";
import { RevisionLabView } from "@/components/views/revision-lab-view";
import type {
  Category,
  ChildProfile,
  Game,
  GeneratedStory,
  LearningControlStatus,
  StoryGenerationRequest,
} from "@/lib/types";
import type { StoryCardData } from "@/components/child/story-card";
import { API_BASE_URL } from "@/lib/api/client";

// --- STATIC DATA ---
const GAMES_DATA: Game[] = [
  {
    id: "quiz",
    name: "單字大挑戰",
    description: "聽聲音，選出正確的圖片！",
    icon: "🎯",
    color: "purple",
    type: "matching",
    physicalActivity: false,
    multiSensory: true,
    parentParticipation: false,
  },
  {
    id: "word-builder",
    name: "粵語拼字",
    description: "學識廣東話點寫！",
    icon: "🔤",
    color: "green",
    type: "matching",
    physicalActivity: false,
    multiSensory: true,
    parentParticipation: false,
  },
  {
    id: "speaking",
    name: "發音練習",
    description: "大聲讀出單字，贏取獎勵！",
    icon: "🎤",
    color: "orange",
    type: "pronunciation",
    physicalActivity: false,
    multiSensory: true,
    parentParticipation: false,
  },
];

const IDLE_TIMEOUT_MS = 60_000;
const IDLE_CHECK_INTERVAL_MS = 15_000;
const SELECTED_CHILD_STORAGE_KEY = "parent-dashboard:selected-child-id";

function getStoredSelectedChildId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(SELECTED_CHILD_STORAGE_KEY);
}

function persistSelectedChildId(childId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SELECTED_CHILD_STORAGE_KEY, childId);
}

function getLocalDateString(value: Date = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLearningControlStatus(
  response: LearningControlStatusResponse,
): LearningControlStatus {
  return {
    childId: response.child_id,
    localDate: response.local_date,
    todayMinutes: response.today_minutes,
    activeSessionMinutes: response.active_session_minutes,
    sessionCount: response.session_count,
    hasActivityToday: response.has_activity_today,
    dailyScreenTimeLimit: response.daily_screen_time_limit,
    screenTimeWarningThreshold: response.screen_time_warning_threshold,
    enableTimeLimits: response.enable_time_limits,
    remainingMinutes: response.remaining_minutes,
    warningReached: response.warning_reached,
    limitReached: response.limit_reached,
    dailyReminderEnabled: response.daily_reminder_enabled,
    dailyReminderTime: response.daily_reminder_time,
  };
}

function hasReachedReminderTime(now: Date, reminderTime: string): boolean {
  const [hours, minutes] = reminderTime.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return false;
  }

  if (now.getHours() > hours) {
    return true;
  }

  return now.getHours() === hours && now.getMinutes() >= minutes;
}

function getReminderStorageKey(childId: string, localDate: string): string {
  return `practice-reminder:${childId}:${localDate}`;
}

function normalizeLearningStyleLabel(value?: string | null): string {
  const normalized = (value || "")
    .replace(/^LearningStyle\./i, "")
    .trim()
    .toLowerCase();

  switch (normalized) {
    case "visual":
      return "視覺型";
    case "auditory":
      return "聽覺型";
    case "kinesthetic":
      return "動作型";
    case "mixed":
      return "混合型";
    default:
      return "你的學習風格";
  }
}

function getLocalizedActivityLabel(activity?: string | null): string {
  switch ((activity || "").toLowerCase()) {
    case "story":
      return "故事時間";
    case "game":
      return "互動遊戲";
    case "learn":
      return "開始學習";
    case "mixed":
      return "綜合練習";
    default:
      return "下一步練習";
  }
}

function getActivityButtonLabel(activity?: string | null): string {
  switch ((activity || "").toLowerCase()) {
    case "story":
      return "去故事";
    case "game":
      return "去遊戲";
    default:
      return "去學習";
  }
}

function localizeAdaptiveReason(reason?: string | null): string {
  if (!reason) {
    return "系統已為你準備好今天的推薦內容。";
  }

  const trimmedReason = reason.trim();

  const exactReasons: Record<string, string> = {
    "New word to learn!": "這是今天很適合開始學的新詞語。",
    "Needs more practice for retention":
      "這個詞語還需要多練習幾次，會更容易記住。",
    "Almost mastered - one more push!": "差一點就完全掌握了，再努力一次。",
    "Review time!": "現在很適合重溫這個詞語。",
    "Mixed approach for comprehensive learning":
      "今天適合用多種方式一起學，記憶會更穩固。",
  };

  if (exactReasons[trimmedReason]) {
    return exactReasons[trimmedReason];
  }

  if (/^Based on .+ learning style$/i.test(trimmedReason)) {
    const styleToken = trimmedReason
      .replace(/^Based on /i, "")
      .replace(/ learning style$/i, "");
    return `根據你的${normalizeLearningStyleLabel(styleToken)}學習風格，系統幫你安排了最合適的下一步。`;
  }

  return trimmedReason;
}

function ChildDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const requestedChildId = searchParams.get("childId");
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("home");
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storyGenerationTheme, setStoryGenerationTheme] =
    useState<BedtimeStoryTheme>("bedtime");
  const [isStoryGenerating, setIsStoryGenerating] = useState(false);
  const [latestGeneratedStory, setLatestGeneratedStory] =
    useState<GeneratedStory | null>(null);
  const [storyGenerationError, setStoryGenerationError] = useState<string | null>(
    null,
  );
  const [stories, setStories] = useState<GeneratedStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<GeneratedStory | null>(
    null,
  );
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [storiesError, setStoriesError] = useState<string | null>(null);
  const [playingStoryId, setPlayingStoryId] = useState<string | null>(null);
  const [storyAudioLoadingId, setStoryAudioLoadingId] = useState<string | null>(
    null,
  );
  const storyAudioRef = useRef<HTMLAudioElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const sessionChildIdRef = useRef<string | null>(null);
  const currentChildIdRef = useRef<string | null>(null);
  const sessionStartPendingRef = useRef(false);
  const sessionShouldRemainOpenRef = useRef(false);
  const lastInteractionAtRef = useRef<number>(Date.now());
  const endingSessionRef = useRef(false);
  const warningToastKeyRef = useRef<string | null>(null);
  const limitToastKeyRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [learningControl, setLearningControl] =
    useState<LearningControlStatus | null>(null);
  const [isIdle, setIsIdle] = useState(true);
  const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(null);
  const [sessionClockMinutes, setSessionClockMinutes] = useState(0);
  const [wordOfDay, setWordOfDay] = useState<WordOfTheDayResponse | null>(null);
  const [nextActivityRec, setNextActivityRec] = useState<{
    recommended_activity: string;
    reason: string;
  } | null>(null);
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    if (requestedTab === "ai") {
      setActiveTab("revision");
      return;
    }

    if (
      requestedTab === "home" ||
      requestedTab === "learn" ||
      requestedTab === "games" ||
      requestedTab === "stories" ||
      requestedTab === "community" ||
      requestedTab === "revision" ||
      requestedTab === "profile" ||
      requestedTab === "rewards"
    ) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      void loadDashboardData();
    }
  }, [authLoading, requestedChildId, user]);

  const startActiveSession = (
    childId: string,
    startTime: Date = new Date(),
  ) => {
    if (
      sessionIdRef.current ||
      sessionStartPendingRef.current ||
      endingSessionRef.current
    ) {
      return;
    }

    sessionShouldRemainOpenRef.current = true;
    sessionStartPendingRef.current = true;
    sessionChildIdRef.current = childId;

    startLearningSession({
      child_id: childId,
      start_time: startTime.toISOString(),
    })
      .then((session) => {
        sessionStartPendingRef.current = false;

        if (!sessionShouldRemainOpenRef.current) {
          void endLearningSession(session.id, {
            end_time: new Date().toISOString(),
            words_encountered: [],
            activities_completed: [],
            engagement_level: "medium",
            interactions_count: 0,
          }).catch((sessionError) =>
            console.warn(
              "[Session] Could not close deferred session:",
              sessionError,
            ),
          );
          return;
        }

        sessionIdRef.current = session.id;
        setSessionStartedAt(startTime);
        setSessionClockMinutes(0);
        void loadLearningStatus(childId);
      })
      .catch((sessionError) => {
        sessionStartPendingRef.current = false;
        if (sessionShouldRemainOpenRef.current) {
          console.warn("[Session] Could not start:", sessionError);
        }
      });
  };

  const endActiveSession = async (endTime: Date = new Date()) => {
    sessionShouldRemainOpenRef.current = false;
    if (endingSessionRef.current) {
      return;
    }

    const sessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    setSessionStartedAt(null);
    setSessionClockMinutes(0);

    if (!sessionId) {
      return;
    }

    endingSessionRef.current = true;

    try {
      await endLearningSession(sessionId, {
        end_time: endTime.toISOString(),
        words_encountered: [],
        activities_completed: [],
        engagement_level: "medium",
        interactions_count: 0,
      });
    } catch (sessionError) {
      console.warn("[Session] Could not end:", sessionError);
    } finally {
      endingSessionRef.current = false;
    }
  };

  const loadLearningStatus = async (childId: string) => {
    try {
      const status = await getLearningControlStatus(childId, {
        localDate: getLocalDateString(new Date()),
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      });
      setLearningControl(toLearningControlStatus(status));
      return status;
    } catch (statusError) {
      console.warn("[Controls] Could not load learning status:", statusError);
      setLearningControl(null);
      return null;
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    await endActiveSession(new Date());

    try {
      const children = await getChildren();

      if (!children.length) {
        setError("未找到小朋友資料，請先建立小朋友檔案。");
        setLoading(false);
        return;
      }

      const storedChildId = getStoredSelectedChildId();
      const selectedChildRecord =
        children.find((child) => child.id === requestedChildId) ||
        children.find((child) => child.id === storedChildId) ||
        children[0];
      const selectedChild = toChildProfile(selectedChildRecord);
      const childChanged = currentChildIdRef.current !== selectedChild.id;
      persistSelectedChildId(selectedChild.id);
      setProfile(selectedChild);
      currentChildIdRef.current = selectedChild.id;
      if (childChanged) {
        setStoryGenerationTheme("bedtime");
        setIsStoryGenerating(false);
        setLatestGeneratedStory(null);
        setStoryGenerationError(null);
      }
      lastInteractionAtRef.current = Date.now();
      setIsIdle(true);

      const [categoryResponses, controlStatus] = await Promise.all([
        getCategories(selectedChild.id),
        loadLearningStatus(selectedChild.id),
      ]);

      setCategories(
        categoryResponses.map((category, index) => toCategory(category, index)),
      );
      await loadStories(selectedChild.id);

      // Load adaptive recommendations (non-blocking – failures are silent)
      void Promise.all([
        getWordOfTheDay(selectedChild.id)
          .then(setWordOfDay)
          .catch(() => null),
        getNextActivity(selectedChild.id)
          .then(setNextActivityRec)
          .catch(() => null),
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "載入資料失敗，請稍後再試。",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadStories = async (childId: string) => {
    setStoriesLoading(true);
    setStoriesError(null);
    try {
      const response = await getChildStories(childId, 20);
      setStories(response || []);
    } catch (err) {
      setStoriesError(err instanceof Error ? err.message : "載入故事失敗");
      setStories([]);
    } finally {
      setStoriesLoading(false);
    }
  };

  const toStoryCard = (story: GeneratedStory): StoryCardData => ({
    id: story.id,
    title: story.title,
    duration: `${story.reading_time_minutes || 5} min`,
    completed: (story.read_count || 0) > 0,
    color: "blue",
    emoji: "📖",
  });

  const resolveAudioUrl = (audioUrl: string): string => {
    if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
      return audioUrl;
    }
    const backendOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
    return `${backendOrigin}${audioUrl.startsWith("/") ? "" : "/"}${audioUrl}`;
  };

  const stopStoryAudio = () => {
    if (storyAudioRef.current) {
      storyAudioRef.current.pause();
      storyAudioRef.current.currentTime = 0;
      storyAudioRef.current = null;
    }
    setPlayingStoryId(null);
    setStoryAudioLoadingId(null);
  };

  const handlePlayStoryAudio = async (storyId: string) => {
    const targetStory = stories.find((story) => story.id === storyId);
    if (!targetStory?.audio_url) return;

    if (playingStoryId === storyId) {
      stopStoryAudio();
      return;
    }

    stopStoryAudio();
    setStoryAudioLoadingId(storyId);

    try {
      const audio = new Audio(resolveAudioUrl(targetStory.audio_url));
      storyAudioRef.current = audio;

      audio.onplay = () => {
        setStoryAudioLoadingId(null);
        setPlayingStoryId(storyId);
      };
      audio.onended = () => setPlayingStoryId(null);
      audio.onerror = () => {
        setPlayingStoryId(null);
        setStoryAudioLoadingId(null);
      };

      await audio.play();
    } catch {
      stopStoryAudio();
    }
  };

  useEffect(() => {
    if (!sessionStartedAt || learningControl?.limitReached) {
      setSessionClockMinutes(0);
      return;
    }

    const updateSessionClock = () => {
      const elapsedMinutes = Math.max(
        Math.floor((Date.now() - sessionStartedAt.getTime()) / 60000),
        0,
      );
      setSessionClockMinutes(elapsedMinutes);
    };

    updateSessionClock();
    const intervalId = window.setInterval(updateSessionClock, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [learningControl?.limitReached, sessionStartedAt]);

  useEffect(() => {
    return () => {
      stopStoryAudio();
      void endActiveSession(new Date());
    };
  }, []);

  const handlePlayAudio = (url: string) => {
    if (wordAudioRef.current) {
      wordAudioRef.current.pause();
      wordAudioRef.current = null;
    }
    const audio = new Audio(url);
    wordAudioRef.current = audio;
    audio.onended = () => {
      wordAudioRef.current = null;
    };
    audio.play().catch(() => {
      wordAudioRef.current = null;
    });
  };

  const handleReadStory = async (storyId: string) => {
    if (!profile) return;
    try {
      const existing = stories.find((s) => s.id === storyId);
      if (existing?.content_cantonese) {
        setSelectedStory(existing);
        setIsReaderOpen(true);
        return;
      }

      const fullStory = await getStory(profile.id, storyId);
      setSelectedStory(fullStory);
      setIsReaderOpen(true);
    } catch (err) {
      setStoriesError(err instanceof Error ? err.message : "讀取故事失敗");
    }
  };

  const handleStoryGenerated = (story: GeneratedStory) => {
    setStories((prev) => [story, ...prev.filter((s) => s.id !== story.id)]);
    setSelectedStory(story);
    setIsReaderOpen(true);
  };

  const handleGenerateStory = async (request: StoryGenerationRequest) => {
    const story = await generateStoryWithExternalProgram(request);

    if (currentChildIdRef.current !== request.child_id) {
      return;
    }

    setLatestGeneratedStory(story);
    handleStoryGenerated(story);
  };

  const handleReadGeneratedStory = (story: GeneratedStory) => {
    setSelectedStory(story);
    setIsReaderOpen(true);
  };

  const completedMinutes = learningControl
    ? Math.max(
        learningControl.todayMinutes - learningControl.activeSessionMinutes,
        0,
      )
    : null;
  const liveSessionMinutes = sessionStartedAt
    ? sessionClockMinutes
    : (learningControl?.activeSessionMinutes ?? 0);
  const totalMinutesUsed =
    completedMinutes !== null ? completedMinutes + liveSessionMinutes : null;
  const timeLimitsEnabled = Boolean(
    learningControl?.enableTimeLimits &&
    learningControl.dailyScreenTimeLimit !== null &&
    learningControl.dailyScreenTimeLimit !== undefined,
  );
  const remainingMinutes =
    timeLimitsEnabled &&
    learningControl?.dailyScreenTimeLimit !== undefined &&
    learningControl.dailyScreenTimeLimit !== null &&
    totalMinutesUsed !== null
      ? Math.max(learningControl.dailyScreenTimeLimit - totalMinutesUsed, 0)
      : (learningControl?.remainingMinutes ?? null);
  const warningReached = Boolean(
    timeLimitsEnabled &&
    remainingMinutes !== null &&
    remainingMinutes > 0 &&
    learningControl &&
    remainingMinutes <= learningControl.screenTimeWarningThreshold,
  );
  const limitReached = Boolean(
    timeLimitsEnabled && remainingMinutes !== null && remainingMinutes <= 0,
  );
  const hasPracticeToday = Boolean(
    (totalMinutesUsed ?? 0) > 0 || sessionStartedAt,
  );

  useEffect(() => {
    if (!profile) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setIsIdle(true);
        void endActiveSession(new Date());
        return;
      }

      lastInteractionAtRef.current = Date.now();
    };

    const handlePageHide = () => {
      void endActiveSession(new Date());
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [limitReached, profile]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const markInteraction = () => {
      lastInteractionAtRef.current = Date.now();

      if (document.visibilityState !== "visible" || limitReached) {
        return;
      }

      setIsIdle(false);
      startActiveSession(profile.id, new Date(lastInteractionAtRef.current));
    };

    const checkIdle = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const shouldBeIdle =
        Date.now() - lastInteractionAtRef.current >= IDLE_TIMEOUT_MS;

      if (!shouldBeIdle) {
        return;
      }

      setIsIdle(true);
      void endActiveSession(new Date());
    };

    const interactionEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
      "focus",
    ];

    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, markInteraction, { passive: true });
    });

    const intervalId = window.setInterval(checkIdle, IDLE_CHECK_INTERVAL_MS);

    return () => {
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markInteraction);
      });
      window.clearInterval(intervalId);
    };
  }, [limitReached, profile]);

  useEffect(() => {
    if (!learningControl || !warningReached || remainingMinutes === null) {
      return;
    }

    const warningKey = `${learningControl.childId}:${learningControl.localDate}:${remainingMinutes}`;
    if (warningToastKeyRef.current === warningKey) {
      return;
    }

    warningToastKeyRef.current = warningKey;
    toast({
      title: "快到時間上限了",
      description: `今天還剩 ${remainingMinutes} 分鐘學習時間。`,
    });
  }, [learningControl, remainingMinutes, toast, warningReached]);

  useEffect(() => {
    if (!learningControl || !limitReached) {
      return;
    }

    const limitKey = `${learningControl.childId}:${learningControl.localDate}`;
    if (limitToastKeyRef.current !== limitKey) {
      limitToastKeyRef.current = limitKey;
      toast({
        title: "今日學習時間已到",
        description: "請由家長到家長中心調整設定，或明天再繼續。",
        variant: "destructive",
      });
    }

    stopStoryAudio();
    setActiveTab("home");
    setIsReaderOpen(false);
    setSelectedStory(null);
    void endActiveSession(new Date());
  }, [learningControl, limitReached, toast]);

  useEffect(() => {
    if (
      !profile ||
      !learningControl?.dailyReminderEnabled ||
      hasPracticeToday
    ) {
      return;
    }

    const maybeNotify = () => {
      const now = new Date();
      const localDate = getLocalDateString(now);
      const storageKey = getReminderStorageKey(profile.id, localDate);

      if (localStorage.getItem(storageKey) === "sent") {
        return;
      }

      if (!hasReachedReminderTime(now, learningControl.dailyReminderTime)) {
        return;
      }

      localStorage.setItem(storageKey, "sent");
      toast({
        title: "每日練習提醒",
        description: `現在是 ${learningControl.dailyReminderTime}，可以開始今天的粵語學習了。`,
      });

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification("每日練習提醒", {
          body: "現在可以開始今天的粵語詞彙練習。",
        });
      }
    };

    maybeNotify();
    const intervalId = window.setInterval(maybeNotify, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    hasPracticeToday,
    learningControl?.dailyReminderEnabled,
    learningControl?.dailyReminderTime,
    profile,
    toast,
  ]);

  const handleTabChange = (tab: string) => {
    if (limitReached) {
      return;
    }

    setActiveTab(tab === "ai" ? "revision" : tab);
  };

  const proceedToParentDashboard = async () => {
    setShowPinModal(false);
    await endActiveSession(new Date());
    router.push(profile?.id ? `/parent?childId=${profile.id}` : "/parent");
  };

  const handleOpenParentDashboard = () => {
    setShowPinModal(true);
  };

  const refreshChildProfile = async (
    childId: string,
    options?: { incrementRefreshKey?: boolean },
  ) => {
    try {
      const refreshedChild = toChildProfile(await getChild(childId));
      persistSelectedChildId(childId);
      setProfile(refreshedChild);

      if (options?.incrementRefreshKey) {
        setProfileRefreshKey((key) => key + 1);
      }

      return refreshedChild;
    } catch (error) {
      console.warn("[ChildDashboard] Failed to refresh child profile:", error);
      return null;
    }
  };

  const handleLearningProgressUpdated = () => {
    if (!profile) {
      return;
    }

    void refreshChildProfile(profile.id, { incrementRefreshKey: true });
  };

  const handleProfileUpdated = (nextProfile: ChildProfile) => {
    setProfile(nextProfile);
    setProfileRefreshKey((key) => key + 1);
  };

  const showDashboardHeader = activeTab === "home";
  // Force Cantonese for children's mode - no English for young learners (4-7 years)
  const _lang = "cantonese";
  const recommendedWordLabel = wordOfDay?.word_cantonese;
  const localizedWordReason = localizeAdaptiveReason(wordOfDay?.reason);
  const localizedNextStepReason = localizeAdaptiveReason(
    nextActivityRec?.reason,
  );
  const nextStepLabel = getLocalizedActivityLabel(
    nextActivityRec?.recommended_activity,
  );
  const nextStepButtonLabel = getActivityButtonLabel(
    nextActivityRec?.recommended_activity,
  );

  if (authLoading || loading) {
    return (
      <CozyPageWrapper
        type="dashboard"
        hideThemeToggle={!!activeGame}
        hideFloatingStar
      >
        <div className="w-full px-4 py-8 space-y-6">
          <Skeleton className="h-44 w-full rounded-4xl" />
          <Skeleton className="h-72 w-full rounded-[40px]" />
        </div>
      </CozyPageWrapper>
    );
  }

  if (!profile) {
    return (
      <CozyPageWrapper
        type="dashboard"
        hideThemeToggle={!!activeGame}
        hideFloatingStar
      >
        <div className="w-full px-4 py-8">
          <Alert variant="destructive" className="rounded-2xl">
            <AlertDescription>
              {error || "目前沒有可用的小朋友資料。"}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => router.push("/create-child")}>
              建立小朋友檔案
            </Button>
            <Button variant="outline" onClick={() => void loadDashboardData()}>
              重新載入
            </Button>
          </div>
        </div>
      </CozyPageWrapper>
    );
  }

  return (
    <CozyPageWrapper
      type="dashboard"
      hideThemeToggle={!!activeGame}
      hideFloatingStar
    >
      <CartoonKeyframes />
      <OwlCompanion level={profile.level} />
      <div
        className="w-full min-h-screen px-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10.5rem)" }}
      >
        {showDashboardHeader && (
          <header className="flex flex-row items-center gap-2 py-4">
            <ProfileHeader
              childId={profile.id}
              refreshKey={profileRefreshKey}
            />
          </header>
        )}

        {/* --- MAIN CONTENT AREA --- */}
        <main
          className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${showDashboardHeader ? "" : "pt-4 md:pt-4"}`}
        >
          {warningReached && remainingMinutes !== null && (
            <Alert className="rounded-3xl border-amber-300 bg-amber-50/90 text-amber-950 shadow-sm">
              <Clock3 className="h-4 w-4" />
              <AlertDescription className="font-semibold">
                今天已使用 {totalMinutesUsed} 分鐘，還剩 {remainingMinutes}{" "}
                分鐘。
              </AlertDescription>
            </Alert>
          )}

          {!hasPracticeToday && learningControl?.dailyReminderEnabled && (
            <Alert className="rounded-3xl border-sky-300 bg-sky-50/90 text-sky-950 shadow-sm">
              <Bell className="h-4 w-4" />
              <AlertDescription className="font-semibold">
                每日提醒已開啟，系統會在 {learningControl.dailyReminderTime}{" "}
                提醒開始今天的學習。
              </AlertDescription>
            </Alert>
          )}

          {profile && isIdle && !limitReached && (
            <Alert className="rounded-3xl border-slate-300 bg-slate-50/90 text-slate-800 shadow-sm">
              <Clock3 className="h-4 w-4" />
              <AlertDescription className="font-semibold">
                閒置超過 1
                分鐘後會暫停計時。點一下畫面或開始互動後才會繼續計算使用時間。
              </AlertDescription>
            </Alert>
          )}

          {activeTab === "home" && (
            <section className="space-y-6">
              {/* AI Adaptive Recommendation Banner */}
              {(wordOfDay || nextActivityRec) && (
                <div className="rounded-4xl border border-violet-200/70 bg-linear-to-br from-violet-50/95 via-white/95 to-indigo-50/90 p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500 text-white shadow-sm">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="child-tab-section-title !text-sm !text-violet-700">
                        AI 今日推薦
                      </p>
                        <p className="child-tab-section-copy !text-xs !text-slate-400">
                        幫你揀好今日最值得先開始的內容
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {wordOfDay && recommendedWordLabel && (
                      <div className="rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-500">
                            <BookMarked className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="child-tab-caption !tracking-[0.12em]">
                              今日重點詞彙
                            </p>
                            <p className="mt-1 text-2xl font-black leading-tight text-slate-800">
                              {recommendedWordLabel}
                            </p>
                            <p className="child-tab-copy !mt-2 !leading-6">
                              {localizedWordReason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {nextActivityRec && (
                      <div className="rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                        <div className="flex h-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-500">
                              <Zap className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="child-tab-caption !tracking-[0.12em]">
                                建議下一步
                              </p>
                              <p className="mt-1 text-2xl font-black leading-tight text-slate-800">
                                {nextStepLabel}
                              </p>
                              <p className="child-tab-copy !mt-2 !leading-6">
                                {localizedNextStepReason}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              setActiveTab(
                                nextActivityRec.recommended_activity === "story"
                                  ? "stories"
                                  : nextActivityRec.recommended_activity ===
                                      "game"
                                    ? "games"
                                    : "learn",
                              )
                            }
                            className="shrink-0 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-amber-500"
                          >
                            {nextStepButtonLabel}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <ChildMissionsPanel childId={profile.id} />

              <DailyWordsViewer
                childId={profile.id}
                childName={profile.name}
                languagePreference="cantonese"
                onWordLearned={handleLearningProgressUpdated}
                variant="home"
              />
            </section>
          )}

          {activeTab === "learn" && (
            <section>
              <CategoryGrid
                categories={categories}
                languagePreference="cantonese"
                childId={profile.id}
                onWordLearned={handleLearningProgressUpdated}
              />
            </section>
          )}

          {activeTab === "games" && (
            <section>
              <GamesList
                games={GAMES_DATA}
                onPlayGame={(game) => setActiveGame(game.id)}
              />
            </section>
          )}

          {activeTab === "stories" && (
            <div className="space-y-8">
              <section className="bg-white/60 backdrop-blur-md rounded-4xl p-2 shadow-sm border border-white/50">
                <BedtimeStoryGenerator
                  childId={profile.id}
                  childName={profile.name}
                  languagePreference="cantonese"
                  selectedTheme={storyGenerationTheme}
                  isGenerating={isStoryGenerating}
                  generatedStory={latestGeneratedStory}
                  error={storyGenerationError}
                  onSelectedThemeChange={setStoryGenerationTheme}
                  onIsGeneratingChange={setIsStoryGenerating}
                  onGeneratedStoryChange={setLatestGeneratedStory}
                  onErrorChange={setStoryGenerationError}
                  onGenerateStory={handleGenerateStory}
                  onReadStory={handleReadGeneratedStory}
                />
              </section>

              <section className="px-2">
                <div className="flex items-center gap-3 mb-4 pl-2">
                  <div className="bg-blue-400 p-2 rounded-xl -rotate-3 shadow-sm">
                    <Book className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-700">
                    我的故事書
                  </h2>
                </div>

                {storiesError && (
                  <Alert variant="destructive" className="mb-3 rounded-2xl">
                    <AlertDescription>{storiesError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {!storiesLoading &&
                    stories.length > 0 &&
                    stories.map((story) => (
                      <StoryCard
                        key={story.id}
                        story={toStoryCard(story)}
                        onRead={(cardStory) =>
                          void handleReadStory(cardStory.id)
                        }
                        onPlayAudio={
                          story.audio_url
                            ? () => void handlePlayStoryAudio(story.id)
                            : undefined
                        }
                        isAudioPlaying={playingStoryId === story.id}
                        isAudioLoading={storyAudioLoadingId === story.id}
                      />
                    ))}

                  {!storiesLoading && stories.length === 0 && (
                    <div className="min-w-52 h-72 rounded-4xl border-4 border-dashed border-white/50 flex flex-col items-center justify-center text-slate-400 bg-white/20">
                      <Sparkles className="w-10 h-10 mb-3 opacity-50" />
                      <span className="font-bold text-base">
                        生成第一個故事
                      </span>
                    </div>
                  )}

                  {storiesLoading && (
                    <div className="min-w-52 h-72 rounded-4xl border-4 border-dashed border-white/50 flex flex-col items-center justify-center text-slate-400 bg-white/20">
                      <span className="font-bold text-base">載入故事中...</span>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === "community" && (
            <div className="min-h-[60vh]">
              <CommunityTab
                childId={profile.id}
                languagePreference="cantonese"
              />
            </div>
          )}

          {activeTab === "revision" && profile && (
            <section>
              <RevisionLabView
                profile={profile}
                onPlayAudio={handlePlayAudio}
              />
            </section>
          )}

          {activeTab === "profile" && (
            <ProfileView
              profile={profile}
              onProfileUpdated={handleProfileUpdated}
              onOpenParentDashboard={() => handleOpenParentDashboard()}
              onOpenTab={handleTabChange}
            />
          )}

          {activeTab === "rewards" && (
            <RewardsView
              profile={profile}
              onOpenTab={handleTabChange}
              refreshKey={profileRefreshKey}
            />
          )}
        </main>

        <ChildNavigation activeTab={activeTab} onTabChange={handleTabChange} />

        {showPinModal && (
          <ParentPinModal
            onSuccess={() => void proceedToParentDashboard()}
            onCancel={() => setShowPinModal(false)}
          />
        )}

        {limitReached && (
          <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6">
            <div className="w-full max-w-md rounded-4xl bg-white p-8 shadow-2xl border border-white/60 text-center space-y-5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800">
                  今天的學習時間已完成
                </h2>
                <p className="text-slate-600 font-semibold">
                  已使用{" "}
                  {totalMinutesUsed ?? learningControl?.todayMinutes ?? 0} 分鐘
                  {learningControl?.dailyScreenTimeLimit
                    ? ` / ${learningControl.dailyScreenTimeLimit} 分鐘上限`
                    : ""}
                  。
                </p>
                <p className="text-sm text-slate-500">
                  請由家長到家長中心調整設定，或明天再繼續學習。
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  className="rounded-full font-black"
                  onClick={() => handleOpenParentDashboard()}
                >
                  前往家長中心
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full font-black"
                  onClick={() => void loadDashboardData()}
                >
                  重新檢查設定
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal only opens when a story is active */}
        {selectedStory && (
          <BedtimeStoryReader
            isOpen={isReaderOpen}
            onClose={() => {
              setIsReaderOpen(false);
              setSelectedStory(null);
            }}
            story={selectedStory}
            languagePreference="cantonese"
            onComplete={() => {
              if (profile) void loadStories(profile.id);
            }}
          />
        )}
        {/* Game overlays */}
        {activeGame === "quiz" && (
          <QuizGame childId={profile.id} onClose={() => setActiveGame(null)} />
        )}
        {activeGame === "word-builder" && (
          <WordBuilderGame
            childId={profile.id}
            onClose={() => setActiveGame(null)}
          />
        )}
        {activeGame === "speaking" && (
          <SpeakingGame
            childId={profile.id}
            onClose={() => setActiveGame(null)}
          />
        )}
      </div>
    </CozyPageWrapper>
  );
}

export default function ChildDashboard() {
  return (
    <Suspense
      fallback={
        <CozyPageWrapper type="dashboard" hideFloatingStar>
          <div className="w-full px-4 py-8 space-y-6">
            <Skeleton className="h-44 w-full rounded-4xl" />
            <Skeleton className="h-72 w-full rounded-[40px]" />
          </div>
        </CozyPageWrapper>
      }
    >
      <ChildDashboardContent />
    </Suspense>
  );
}
