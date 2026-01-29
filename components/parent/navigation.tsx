"use client";

import {
  LayoutDashboard,
  TrendingUp,
  Target,
  Settings,
  Home,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ParentNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "missions", label: "App Missions", icon: Target },
  { id: "offline", label: "Offline Missions", icon: Home },
  { id: "insights", label: "Insights", icon: Brain },
  { id: "settings", label: "Settings", icon: Settings },
];

export function ParentNavigation({
  activeTab,
  onTabChange,
}: ParentNavigationProps) {
  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-4xl mx-auto px-4">
        <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
