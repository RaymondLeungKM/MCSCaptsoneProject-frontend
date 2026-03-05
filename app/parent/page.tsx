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
// import { getChildren, toChildProfile } from "@/lib/api"; // Commented out to prevent errors
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
    learningStyle: "mixed",
    languagePreference: "cantonese",
    interests: ["Animals", "Space"],
  };

  const fallbackStats: ProgressStats = {
    totalWords: 42,
    masteredWords: 15,
    weeklyProgress: [2, 5, 8, 4, 10, 6, 7],
    streakDays: 3,
    categoryProgress: [],
    averageExposuresPerWord: 3.5,
    activeVocabulary: 10,
    passiveVocabulary: 32,
    multiSensoryEngagement: 85,
  };

  const fallbackWords: Word[] = [];
  const fallbackMissions: DailyMission[] = [];

  // Handle URL parameters for deep linking
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    async function loadParentDashboardProfile() {
      setIsLoadingProfile(true);
      setProfileError(null);

      try {
        // --- MAGIC FIX: Mock Network Request ---
        // Pretend to load data for 0.5 seconds, then set the mock profile
        setTimeout(() => {
          setProfile(MOCK_PROFILE);
          setIsLoadingProfile(false);
        }, 500);
      } catch (error) {
        setProfileError("載入家長中心失敗，請稍後再試。");
        setIsLoadingProfile(false);
      }
    }

    void loadParentDashboardProfile();
  }, []);

  if (isLoadingProfile) {
    return (
      <CozyPageWrapper type="dashboard">
        <div className="container mx-auto px-4 py-6 max-w-2xl md:max-w-6xl pb-32">
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-[32px] shadow-sm border border-white/50 flex items-center justify-center gap-3 text-slate-600 font-bold">
            <Loader2 className="w-5 h-5 animate-spin" />
            載入家長中心中...
          </div>
        </div>
      </CozyPageWrapper>
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
          <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md rounded-[32px] shadow-sm border border-white/50 mb-6 overflow-hidden">
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
                className="group flex items-center gap-2 bg-gradient-to-r from-[#38BDF8] to-[#818CF8] hover:from-[#0EA5E9] hover:to-[#6366F1] text-white pl-2.5 pr-4 py-2 md:pl-3 md:pr-5 md:py-2.5 rounded-full font-black text-sm md:text-base shadow-lg shadow-sky-200/60 transition-all hover:scale-105 active:scale-95 shrink-0"
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
              {profile && (
                <OverviewTab profile={profile} stats={fallbackStats} />
              )}
            </TabsContent>

            <TabsContent
              value="progress"
              className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
            >
              {profile && (
                <ProgressTab
                  childId={profile.id}
                  stats={fallbackStats}
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
              <MissionsTab missions={fallbackMissions} />
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
              {profile && <SettingsTab profile={profile} />}
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
