"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Baby,
  LayoutGrid,
  TrendingUp,
  Target,
  WifiOff,
  BarChart3,
  Settings,
  PieChart,
  Loader2,
  Users,
} from "lucide-react";

// --- UI IMPORTS ---
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CozyPageWrapper from "@/components/CozyPageWrapper";

// --- COMPONENT IMPORTS ---
import { OverviewTab } from "@/components/parent/overview-tab";
import { ProgressTab } from "@/components/parent/progress-tab";
import { MissionsTab } from "@/components/parent/missions-tab";
import { OfflineMissionsTab } from "@/components/parent/offline-missions-tab";
import { InsightsTab } from "@/components/parent/insights-tab";
import { SettingsTab } from "@/components/parent/settings-tab";
import { SocialTab } from "@/components/parent/social-tab";
import { AnalyticsDashboard } from "@/components/parent/analytics-dashboard";
import { Alert, AlertDescription } from "@/components/ui/alert";
<<<<<<< HEAD
import { PrivacyConsentModal } from "@/components/modals/privacy-consent-modal";
import { useAuth } from "@/lib/auth-context";
// import { getChildren, toChildProfile } from "@/lib/api"; // Commented out to prevent errors
=======
import { getChildren, toChildProfile } from "@/lib/api/children";
import { getProgressStats } from "@/lib/api/progress";
import { getDailyMissions } from "@/lib/api/missions";
import { getAuthToken } from "@/lib/api/client";
>>>>>>> ff6b61650ea17596c8961297f520cd0dce48d11c
import type {
  ChildProfile,
  DailyMission,
  ProgressStats,
  Word,
} from "@/lib/types";

// --- INTERNAL CONTENT COMPONENT ---
function ParentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // --- MOCK DATA ---
  const MOCK_PROFILE: ChildProfile = {
    id: "mock-123",
    name: "Emma",
    age: 5,
    avatar: "👧",
    level: 1,
    xp: 0,
    wordsLearned: 0,
    currentStreak: 0,
    learningStyle: "mixed",
    languagePreference: "cantonese",
    interests: ["Animals", "Space"],
    dailyGoal: 10,
    todayProgress: 5,
    attentionSpan: 15,
    preferredTimeOfDay: "afternoon",
  };

  const fallbackStats: ProgressStats = {
  const [stats, setStats] = useState<ProgressStats>({
    totalWords: 42,
    masteredWords: 15,
    weeklyProgress: [2, 5, 8, 4, 10, 6, 7],
    streakDays: 3,
    categoryProgress: [],
    averageExposuresPerWord: 3.5,
    activeVocabulary: 10,
    passiveVocabulary: 32,
    multiSensoryEngagement: 85,
  });
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const fallbackWords: Word[] = [];

  // Handle URL parameters for deep linking
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    void loadParentDashboardProfile();
  }, []);

  async function loadParentDashboardProfile() {
    setIsLoadingProfile(true);
    setProfileError(null);

    const token = getAuthToken();
    if (!token) {
      // Not authenticated – use mock data for demo
      setProfile({
        id: "mock-123",
        name: "小明",
        age: 5,
        avatar: "👦",
        learningStyle: "mixed",
        languagePreference: "cantonese",
        interests: ["Animals", "Space"],
        dailyGoal: 5,
        todayProgress: 3,
        level: 5,
        xp: 350,
        wordsLearned: 47,
        currentStreak: 7,
        attentionSpan: 15,
        preferredTimeOfDay: "morning",
      });
      setIsLoadingProfile(false);
      return;
    }

    try {
      const children = await getChildren();
      if (children.length === 0) {
        setProfile(null);
        setIsLoadingProfile(false);
        return;
      }

      const childProfile = toChildProfile(children[0]);
      setProfile(childProfile);

      // Fetch stats and missions in parallel with graceful fallbacks
      const [statsResult, missionsResult] = await Promise.allSettled([
        getProgressStats(childProfile.id),
        getDailyMissions(childProfile.id),
      ]);

      if (statsResult.status === "fulfilled") {
        const s = statsResult.value;
        setStats({
          totalWords: s.total_words,
          masteredWords: s.mastered_words,
          weeklyProgress: s.weekly_progress,
          streakDays: s.streak_days,
          categoryProgress: s.category_progress.map((cp) => ({
            category: cp.category,
            progress: cp.progress,
          })),
          averageExposuresPerWord: s.average_exposures_per_word,
          activeVocabulary: s.active_vocabulary,
          passiveVocabulary: s.passive_vocabulary,
          multiSensoryEngagement: s.multi_sensory_engagement,
        });
      }

      if (missionsResult.status === "fulfilled") {
        setMissions(
          missionsResult.value.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            targetWord: m.target_words[0] ?? "",
            completed: false,
            context: m.context,
          })),
        );
      }
    } catch (error) {
      console.error("Failed to load parent dashboard:", error);
      setProfileError("載入家長中心失敗，請稍後再試。");
    } finally {
      setIsLoadingProfile(false);
    }
  }

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
                    跟進 <span className="text-[#38BDF8]">{profile?.name}</span>{" "}
                    的學習進度
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push("/child")}
                className="group flex items-center gap-2 bg-linear-to-r from-[#38BDF8] to-[#818CF8] hover:from-[#0EA5E9] hover:to-[#6366F1] text-white pl-2.5 pr-4 py-2 md:pl-3 md:pr-5 md:py-2.5 rounded-full font-black text-sm md:text-base shadow-lg shadow-sky-200/60 transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                <span className="flex items-center justify-center w-7 h-7 bg-white/25 rounded-full shrink-0">
                  <Baby className="w-4 h-4" />
                </span>
                <span className="hidden sm:inline">兒童模式</span>
                <span className="sm:hidden">童</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
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
                  value="offline"
                  icon={<WifiOff className="w-4 h-4" />}
                  label="離線"
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
              {profile && <OverviewTab profile={profile} stats={stats} />}
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
              <MissionsTab missions={missions} />
            </TabsContent>

            <TabsContent
              value="offline"
              className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
            >
              {profile && <OfflineMissionsTab childId={profile.id} />}
            </TabsContent>

            <TabsContent
              value="insights"
              className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
            >
              {profile && <InsightsTab childId={profile.id} />}
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
