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
import { getChildren, toChildProfile, type ChildResponse } from "@/lib/api";
import { getAuthToken } from "@/lib/api/client";
import type { ChildProfile } from "@/lib/types";

export default function ParentDashboard() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [hideNav, setHideNav] = useState(false);
  const [currentChild, setCurrentChild] = useState<ChildProfile>(childProfile);
  const [loading, setLoading] = useState(true);

  // Fetch real children on mount
  useEffect(() => {
    async function loadChildren() {
      try {
        // Only fetch if user is logged in
        const token = getAuthToken();
        if (!token) {
          console.log("No auth token, using mock data");
          setLoading(false);
          return;
        }

        const children = await getChildren();
        if (children && children.length > 0) {
          // Use the first child
          const child = toChildProfile(children[0]);
          setCurrentChild(child);
          console.log("Loaded real child:", child.name, child.id);
        } else {
          console.log("No children found, using mock data");
        }
      } catch (error) {
        console.error("Failed to load children:", error);
        // Keep using mock data on error
      } finally {
        setLoading(false);
      }
    }
    loadChildren();
  }, []);

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
        return <OverviewTab profile={currentChild} stats={progressStats} />;
      case "progress":
        return <ProgressTab stats={progressStats} words={words} />;
      case "missions":
        return <MissionsTab missions={dailyMissions} />;
      case "offline":
        return <OfflineMissionsTab />;
      case "insights":
        return <InsightsTab />;
      case "settings":
        return <SettingsTab profile={currentChild} />;
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
                  Track {currentChild.name}&apos;s progress
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
