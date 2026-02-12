"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Baby, 
  LayoutGrid, 
  TrendingUp, 
  Target, 
  WifiOff, 
  BarChart3, 
  Settings, 
  PieChart 
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

// --- COMPONENT IMPORTS ---
import { OverviewTab } from "@/components/parent/overview-tab";
import { ProgressTab } from "@/components/parent/progress-tab";
import { MissionsTab } from "@/components/parent/missions-tab";
import { OfflineMissionsTab } from "@/components/parent/offline-missions-tab";
import { InsightsTab } from "@/components/parent/insights-tab"; 
import { SettingsTab } from "@/components/parent/settings-tab";
import { AnalyticsDashboard } from "@/components/parent/analytics-dashboard";
import CozyPageWrapper from "@/components/CozyPageWrapper";

// --- DATA IMPORTS (Fixed) ---
import { 
  childProfile, 
  dailyMissions, 
  progressStats, // <--- Added this
  words          // <--- Added this
} from "@/lib/mock-data";

export default function ParentDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");

  // Handle URL parameters for deep linking
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  return (
    <CozyPageWrapper type="dashboard">
      <div className="container mx-auto px-4 py-6 max-w-6xl pb-32">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 bg-white/90 backdrop-blur-md p-5 rounded-[40px] shadow-sm border border-white/50">
          <div className="flex items-center gap-5 mb-4 md:mb-0">
            <div className="bg-orange-100 p-3.5 rounded-full shadow-inner">
              <Baby className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">家長中心</h1>
              <p className="text-slate-500 font-bold text-sm">
                跟進 <span className="text-[#38BDF8]">{childProfile.name}</span> 嘅學習進度
              </p>
            </div>
          </div>
          
          <button
            onClick={() => router.push("/child")}
            className="bg-[#38BDF8] hover:bg-[#0EA5E9] text-white px-8 py-3.5 rounded-full font-black text-lg shadow-lg shadow-blue-200/50 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
          >
            切換至兒童模式 <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* --- NAVIGATION TABS --- */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          
          <div className="flex justify-center sticky top-4 z-40">
            <TabsList className="bg-white/80 backdrop-blur-xl p-1.5 rounded-full shadow-lg shadow-slate-200/50 border border-white/60 h-auto flex-wrap justify-center gap-2">
              <TabItem value="overview" icon={<LayoutGrid className="w-4 h-4" />} label="概覽" />
              <TabItem value="progress" icon={<TrendingUp className="w-4 h-4" />} label="進度" />
              <TabItem value="charts" icon={<PieChart className="w-4 h-4" />} label="圖表" />
              <TabItem value="missions" icon={<Target className="w-4 h-4" />} label="任務" />
              <TabItem value="offline" icon={<WifiOff className="w-4 h-4" />} label="離線" />
              <TabItem value="insights" icon={<BarChart3 className="w-4 h-4" />} label="分析" />
              <TabItem value="settings" icon={<Settings className="w-4 h-4" />} label="設定" />
            </TabsList>
          </div>

          {/* --- CONTENT AREA --- */}
          <div className="min-h-[500px]">
            
            <TabsContent value="overview" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <OverviewTab profile={childProfile} stats={progressStats} />
            </TabsContent>
            
            <TabsContent value="progress" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <ProgressTab childId={childProfile.id} stats={progressStats} words={words} />
            </TabsContent>

            <TabsContent value="charts" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <AnalyticsDashboard childId={childProfile.id} />
            </TabsContent>
            
            <TabsContent value="missions" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <MissionsTab missions={dailyMissions} />
            </TabsContent>
            
            <TabsContent value="offline" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <OfflineMissionsTab />
            </TabsContent>
            
            <TabsContent value="insights" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <InsightsTab childId={childProfile.id} />
            </TabsContent>
            
            <TabsContent value="settings" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <SettingsTab profile={childProfile} />
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </CozyPageWrapper>
  );
}

// --- HELPER COMPONENTS ---

function TabItem({ value, icon, label }: { value: string; icon: React.ReactNode; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="rounded-full px-5 py-2.5 data-[state=active]:bg-[#38BDF8] data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold text-slate-500 hover:text-slate-700 hover:bg-white/50 gap-2 data-[state=active]:scale-105"
    >
      {icon}
      {label}
    </TabsTrigger>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}