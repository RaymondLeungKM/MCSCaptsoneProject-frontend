"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Baby,
  BarChart3,
  LayoutGrid,
  Loader2,
  LogOut,
  PieChart,
  Settings,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

// --- UI IMPORTS ---
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CozyPageWrapper from "@/components/CozyPageWrapper";

// --- COMPONENT IMPORTS ---
import { OverviewTab } from "@/components/parent/overview-tab";
import { ProgressTab } from "@/components/parent/progress-tab";
import { ParentMissionsTab } from "@/components/parent/parent-missions-tab";
import { InsightsTab } from "@/components/parent/insights-tab";
import { SettingsTab } from "@/components/parent/settings-tab";
import { SocialTab } from "@/components/parent/social-tab";
import { AnalyticsDashboard } from "@/components/parent/analytics-dashboard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PrivacyConsentModal } from "@/components/modals/privacy-consent-modal";
import { useAuth } from "@/lib/auth-context";
import { getChildren, toChildProfile } from "@/lib/api/children";
import { getDashboardSummary } from "@/lib/api/parent-dashboard";
import { getProgressStats } from "@/lib/api/progress";
import { getAuthToken } from "@/lib/api/client";
import type {
  ChildProfile,
  LearningInsight,
  ProgressStats,
  WeeklyDeltaSummary,
  Word,
} from "@/lib/types";

const MOCK_PROFILE: ChildProfile = {
  id: "mock-123",
  name: "小明",
  age: 5,
  avatar: "👦",
  level: 5,
  xp: 350,
  wordsLearned: 47,
  currentStreak: 7,
  learningStyle: "mixed",
  languagePreference: "cantonese",
  interests: ["Animals", "Space"],
  dailyGoal: 5,
  todayProgress: 3,
  attentionSpan: 15,
  preferredTimeOfDay: "morning",
};

const MOCK_STATS: ProgressStats = {
  totalWords: 42,
  masteredWords: 15,
  weeklyProgress: [2, 5, 8, 4, 10, 6, 7],
  streakDays: 7,
  categoryProgress: [
    { category: "Nature", progress: 33, mastered: 3, total: 9 },
    { category: "Food", progress: 44, mastered: 4, total: 9 },
    { category: "Vehicles", progress: 50, mastered: 3, total: 6 },
    { category: "Animals", progress: 78, mastered: 7, total: 9 },
    { category: "Colors", progress: 100, mastered: 9, total: 9 },
  ],
  averageExposuresPerWord: 3.5,
  activeVocabulary: 10,
  passiveVocabulary: 32,
  multiSensoryEngagement: 74,
};

const MOCK_INSIGHTS: LearningInsight[] = [
  {
    id: "mock-tip-goal",
    child_id: MOCK_PROFILE.id,
    insight_type: "recommendation",
    priority: "high",
    category: "Nature",
    title: "今日可先完成短練習再進行複習",
    description:
      "距離今日目標還差 2 個詞彙，現在最適合安排一段 10 分鐘短練習。",
    action_items: [
      "先複習「大自然」主題，再請孩子用口語說出剛看過的圖片或實物。",
    ],
    data: {},
    is_read: false,
    is_dismissed: false,
    generated_at: "2026-05-01T08:00:00.000Z",
  },
  {
    id: "mock-tip-engagement",
    child_id: MOCK_PROFILE.id,
    insight_type: "weakness",
    priority: "medium",
    category: "Food",
    title: "多感官提示仍有提升空間",
    description: "本週較多停留在圖片辨認，可以再加入動作、實物和口語輸出。",
    action_items: [
      "晚餐前可用真實食物做指認遊戲，並引導孩子描述顏色、味道和用途。",
    ],
    data: {},
    is_read: false,
    is_dismissed: false,
    generated_at: "2026-05-01T07:30:00.000Z",
  },
  {
    id: "mock-tip-strength",
    child_id: MOCK_PROFILE.id,
    insight_type: "strength",
    priority: "low",
    category: "Animals",
    title: "動物主題掌握較穩定",
    description: "孩子在動物詞彙上的辨認速度和準確度較高。",
    action_items: [
      "可把已掌握的動物詞彙加入故事或角色扮演，幫助從辨認轉向主動輸出。",
    ],
    data: {},
    is_read: false,
    is_dismissed: false,
    generated_at: "2026-05-01T07:00:00.000Z",
  },
];

const MOCK_WEEKLY_DELTA: WeeklyDeltaSummary = {
  current_week_start_date: "2026-04-28",
  current_week_end_date: "2026-05-04",
  previous_week_start_date: "2026-04-21",
  previous_week_end_date: "2026-04-27",
  words_learned: { current: 18, previous: 12, delta: 6 },
  learning_time: { current: 92, previous: 74, delta: 18 },
  sessions: { current: 7, previous: 5, delta: 2 },
  xp_earned: { current: 180, previous: 120, delta: 60 },
  active_days: { current: 5, previous: 4, delta: 1 },
};

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

function getChildDisplayLabel(
  child: ChildProfile,
  children: ChildProfile[],
): string {
  const hasDuplicateName = children.some(
    (candidate) =>
      candidate.id !== child.id && candidate.name.trim() === child.name.trim(),
  );

  if (!hasDuplicateName) {
    return child.name;
  }

  const ageLabel =
    child.age > 0 ? `${child.age}歲` : `ID ${child.id.slice(-4)}`;
  return `${child.name} · ${ageLabel} · ${child.id.slice(-4)}`;
}

// --- INTERNAL CONTENT COMPONENT ---
function ParentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const requestedChildId = searchParams.get("childId");
  const { user, refreshUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [availableChildren, setAvailableChildren] = useState<ChildProfile[]>(
    [],
  );
  const [selectedChildId, setSelectedChildId] = useState("");
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [weeklyDelta, setWeeklyDelta] = useState<WeeklyDeltaSummary | null>(
    MOCK_WEEKLY_DELTA,
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [stats, setStats] = useState<ProgressStats>(MOCK_STATS);

  const fallbackWords: Word[] = [];

  // Handle URL parameters for deep linking
  useEffect(() => {
    if (requestedTab) {
      setActiveTab(requestedTab);
    }

    if (requestedChildId) {
      setSelectedChildId(requestedChildId);
      persistSelectedChildId(requestedChildId);
    }
  }, [requestedChildId, requestedTab]);

  const loadParentDashboardProfile = useCallback(
    async ({ background = false }: { background?: boolean } = {}) => {
      if (!background) {
        setIsLoadingProfile(true);
      }
      setProfileError(null);

      const token = getAuthToken();
      if (!token) {
        // Not authenticated – use mock data for demo
        setProfile(MOCK_PROFILE);
        setStats(MOCK_STATS);
        setInsights(MOCK_INSIGHTS);
        setWeeklyDelta(MOCK_WEEKLY_DELTA);
        if (!background) {
          setIsLoadingProfile(false);
        }
        return;
      }

      try {
        const children = await getChildren();
        const mappedChildren = children.map((child) => toChildProfile(child));
        setAvailableChildren(mappedChildren);

        if (mappedChildren.length === 0) {
          setProfile(null);
          setInsights([]);
          setWeeklyDelta(null);
          if (!background) {
            setIsLoadingProfile(false);
          }
          return;
        }

        const storedChildId = getStoredSelectedChildId();
        const resolvedChildId =
          mappedChildren.find((child) => child.id === selectedChildId)?.id ||
          mappedChildren.find((child) => child.id === requestedChildId)?.id ||
          mappedChildren.find((child) => child.id === storedChildId)?.id ||
          mappedChildren[0]?.id ||
          "";

        if (!resolvedChildId) {
          setProfile(null);
          setInsights([]);
          setWeeklyDelta(null);
          if (!background) {
            setIsLoadingProfile(false);
          }
          return;
        }

        if (resolvedChildId !== selectedChildId) {
          setSelectedChildId(resolvedChildId);
        }
        persistSelectedChildId(resolvedChildId);

        const childProfile =
          mappedChildren.find((child) => child.id === resolvedChildId) ||
          mappedChildren[0];
        setProfile(childProfile);

        const [statsResult, summaryResult] = await Promise.allSettled([
          getProgressStats(childProfile.id),
          getDashboardSummary(childProfile.id),
        ]);

        if (statsResult.status === "rejected") {
          throw statsResult.reason;
        }

        setStats({
          totalWords: statsResult.value.total_words,
          masteredWords: statsResult.value.mastered_words,
          weeklyProgress: statsResult.value.weekly_progress,
          streakDays: statsResult.value.streak_days,
          categoryProgress: statsResult.value.category_progress.map((cp) => ({
            category: cp.category,
            progress: cp.progress,
            mastered: cp.mastered,
            total: cp.total,
          })),
          averageExposuresPerWord: statsResult.value.average_exposures_per_word,
          activeVocabulary: statsResult.value.active_vocabulary,
          passiveVocabulary: statsResult.value.passive_vocabulary,
          multiSensoryEngagement: statsResult.value.multi_sensory_engagement,
        });

        if (summaryResult.status === "fulfilled") {
          setInsights((summaryResult.value.recent_insights || []).slice(0, 3));
          setWeeklyDelta(summaryResult.value.weekly_delta ?? null);
        } else {
          console.warn(
            "Failed to load parent dashboard summary:",
            summaryResult.reason,
          );
          setInsights([]);
          setWeeklyDelta(null);
        }
      } catch (error) {
        console.error("Failed to load parent dashboard:", error);
        setProfileError("載入家長中心失敗，請稍後再試。");
      } finally {
        if (!background) {
          setIsLoadingProfile(false);
        }
      }
    },
    [requestedChildId, selectedChildId],
  );

  useEffect(() => {
    void loadParentDashboardProfile();
  }, [loadParentDashboardProfile]);

  useEffect(() => {
    const handleWindowFocus = () => {
      void loadParentDashboardProfile({ background: true });
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [loadParentDashboardProfile]);

  const activeChildLabel = profile
    ? getChildDisplayLabel(
        profile,
        availableChildren.length > 0 ? availableChildren : [profile],
      )
    : "";

  const handleSignOut = () => {
    logout();
  };

  if (isLoadingProfile) {
    return (
      <CozyPageWrapper type="dashboard">
        <div className="container mx-auto px-4 py-6 max-w-2xl md:max-w-6xl pb-32">
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-4xl shadow-sm border border-white/50 flex items-center justify-center gap-3 text-slate-600 font-bold">
            <Loader2 className="w-5 h-5 animate-spin" />
            載入家長中心中...
          </div>
        </div>
      </CozyPageWrapper>
    );
  }

  // Show privacy consent modal if parent hasn't consented yet
  if (user && !user.consent_given) {
    return (
      <PrivacyConsentModal
        onConsented={async () => {
          await refreshUser();
        }}
      />
    );
  }

  if (!profile && !isLoadingProfile) {
    return (
      <CozyPageWrapper type="dashboard">
        <div className="container mx-auto px-4 py-6 max-w-2xl md:max-w-6xl pb-32 space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              {profileError || "目前沒有可用的小朋友資料。"}
            </AlertDescription>
          </Alert>
          <button
            onClick={() => router.push("/create-child")}
            className="bg-[#38BDF8] hover:bg-[#0EA5E9] text-white px-8 py-3.5 rounded-full font-black text-lg shadow-lg shadow-blue-200/50 transition-all hover:scale-105 active:scale-95"
          >
            建立小朋友檔案
          </button>
        </div>
      </CozyPageWrapper>
    );
  }

  return (
    <CozyPageWrapper type="dashboard">
      <div className="container mx-auto px-4 py-6 max-w-2xl md:max-w-6xl pb-32">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* --- UNIFIED HEADER + NAV CARD --- */}
          <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md rounded-4xl shadow-sm border border-white/50 mb-6 overflow-hidden">
            {/* Header row */}
            <div className="flex flex-row items-center justify-between px-4 py-3 md:px-5 md:py-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2.5 md:p-3.5 rounded-full shadow-inner shrink-0">
                  <Baby className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
                    家長中心
                  </h1>
                  <p className="text-slate-500 font-bold text-xs md:text-sm">
                    跟進{" "}
                    <span className="text-[#38BDF8]">{activeChildLabel}</span>{" "}
                    的學習進度
                  </p>
                  {availableChildren.length > 1 && (
                    <div className="mt-2">
                      <Select
                        value={selectedChildId || profile?.id || ""}
                        onValueChange={(nextChildId) => {
                          setSelectedChildId(nextChildId);
                          persistSelectedChildId(nextChildId);
                        }}
                      >
                        <SelectTrigger className="h-8 min-w-44 rounded-full border-slate-200 bg-white/80 text-xs font-bold text-slate-600 shadow-none">
                          <SelectValue placeholder="選擇小朋友" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableChildren.map((child) => (
                            <SelectItem key={child.id} value={child.id}>
                              {getChildDisplayLabel(child, availableChildren)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSignOut}
                  className="group flex items-center gap-2 bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 pl-2.5 pr-4 py-2 md:pl-3 md:pr-5 md:py-2.5 rounded-full font-black text-sm md:text-base shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  <span className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 bg-slate-100 rounded-full shrink-0">
                    <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </span>
                  <span>登出</span>
                </button>

                <button
                  onClick={() =>
                    router.push(
                      profile?.id ? `/child?childId=${profile.id}` : "/child",
                    )
                  }
                  className="group flex items-center gap-2 bg-linear-to-r from-[#38BDF8] to-[#818CF8] hover:from-[#0EA5E9] hover:to-[#6366F1] text-white pl-2.5 pr-4 py-2 md:pl-3 md:pr-5 md:py-2.5 rounded-full font-black text-sm md:text-base shadow-lg shadow-sky-200/60 transition-all hover:scale-105 active:scale-95"
                >
                  <span className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 bg-white/25 rounded-full shrink-0">
                    <Baby className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </span>
                  <span>兒童模式</span>
                  <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100 mx-4" />

            {/* Tab bar row */}
            <div className="overflow-x-auto scrollbar-hide px-2 py-2">
              <TabsList className="bg-transparent p-0 h-auto flex-nowrap inline-flex w-max mx-auto gap-1 md:gap-2 min-w-full justify-start md:justify-center">
                <TabItem
                  value="overview"
                  icon={<LayoutGrid className="w-4 h-4" />}
                  label="概覽"
                />
                <TabItem
                  value="progress"
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="進度"
                />
                <TabItem
                  value="charts"
                  icon={<PieChart className="w-4 h-4" />}
                  label="圖表"
                />
                <TabItem
                  value="missions"
                  icon={<Target className="w-4 h-4" />}
                  label="任務"
                />
                <TabItem
                  value="insights"
                  icon={<BarChart3 className="w-4 h-4" />}
                  label="分析"
                />
                <TabItem
                  value="settings"
                  icon={<Settings className="w-4 h-4" />}
                  label="設定"
                />
                <TabItem
                  value="social"
                  icon={<Users className="w-4 h-4" />}
                  label="社群"
                />
              </TabsList>
            </div>
          </div>

          {/* --- CONTENT AREA --- */}
          <div className="min-h-125">
            <TabsContent
              value="overview"
              className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
            >
              {profile && (
                <OverviewTab
                  profile={profile}
                  stats={stats}
                  insights={insights}
                  weeklyDelta={weeklyDelta}
                  onActiveVocabularyApproved={() =>
                    loadParentDashboardProfile({ background: true })
                  }
                />
              )}
            </TabsContent>

            <TabsContent
              value="progress"
              className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
            >
              {profile && (
                <ProgressTab
                  childId={profile.id}
                  stats={stats}
                  words={fallbackWords}
                />
              )}
            </TabsContent>

            <TabsContent
              value="charts"
              className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
            >
              {profile && <AnalyticsDashboard childId={profile.id} />}
            </TabsContent>

            <TabsContent
              value="missions"
              className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
            >
              {profile && <ParentMissionsTab childId={profile.id} />}
            </TabsContent>

            <TabsContent
              value="insights"
              className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
            >
              {profile && (
                <InsightsTab
                  childId={profile.id}
                  stats={stats}
                  isActive={activeTab === "insights"}
                />
              )}
            </TabsContent>

            <TabsContent
              value="settings"
              className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
            >
              {profile && (
                <SettingsTab profile={profile} onProfileUpdated={setProfile} />
              )}
            </TabsContent>

            <TabsContent
              value="social"
              className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
            >
              <SocialTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </CozyPageWrapper>
  );
}

// --- MAIN EXPORT COMPONENT ---
export default function ParentDashboard() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold animate-pulse">
              正在載入家長中心...
            </p>
          </div>
        </div>
      }
    >
      <ParentDashboardContent />
    </Suspense>
  );
}

// --- HELPER COMPONENTS ---

function TabItem({
  value,
  icon,
  label,
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <TabsTrigger
      value={value}
      className="rounded-full px-3 py-2 md:px-5 md:py-2.5 data-[state=active]:bg-[#38BDF8] data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold text-slate-500 hover:text-slate-700 hover:bg-white/50 gap-1.5 md:gap-2 data-[state=active]:scale-105 text-xs md:text-sm whitespace-nowrap"
    >
      {icon}
      {label}
    </TabsTrigger>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
