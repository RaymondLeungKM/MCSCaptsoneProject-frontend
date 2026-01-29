"use client";

// Force dynamic rendering so query params (tab/view/hideNav) are honored in production
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ParentNavigation } from "@/components/parent/navigation";
import { OverviewTab } from "@/components/parent/overview-tab";
import { ProgressTab } from "@/components/parent/progress-tab";
import { MissionsTab } from "@/components/parent/missions-tab";
import { OfflineMissionsTab } from "@/components/parent/offline-missions-tab";
import { InsightsTab } from "@/components/parent/insights-tab";
import { SettingsTab } from "@/components/parent/settings-tab";
import {
  childProfile,
  progressStats,
  dailyMissions,
  words,
} from "@/lib/mock-data";

export default function ParentDashboard() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [hideNav, setHideNav] = useState(false);

  // Handle query parameters
  useEffect(() => {
    // Handle tab parameter
    const tabParam = searchParams.get("tab") || searchParams.get("view");
    if (
      tabParam &&
      [
        "overview",
        "progress",
        "missions",
        "offline",
        "insights",
        "settings",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }

    // Handle hideNav parameter
    const hideNavParam = searchParams.get("hideNav");
    if (hideNavParam === "true" || hideNavParam === "1") {
      setHideNav(true);
    }
  }, [searchParams]);

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab profile={childProfile} stats={progressStats} />;
      case "progress":
        return <ProgressTab stats={progressStats} words={words} />;
      case "missions":
        return <MissionsTab missions={dailyMissions} />;
      case "offline":
        return <OfflineMissionsTab />;
      case "insights":
        return <InsightsTab />;
      case "settings":
        return <SettingsTab profile={childProfile} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {!hideNav && (
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Parent Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Track {childProfile.name}&apos;s progress
                </p>
              </div>
              <a
                href="/"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Switch to Child Mode
              </a>
            </div>
          </div>
        </header>
      )}

      {!hideNav && (
        <ParentNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      <main className="max-w-4xl mx-auto px-4 py-6">{renderContent()}</main>
    </div>
  );
}
