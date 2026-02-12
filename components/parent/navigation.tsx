"use client";

import { 
  LayoutDashboard, 
  TrendingUp, 
  Target, 
  WifiOff, 
  LineChart, 
  Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ParentNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ParentNavigation({ activeTab, onTabChange }: ParentNavigationProps) {
  
  // Define tabs with Chinese Labels & Icons
  const tabs = [
    { id: "overview", label: "概覽", icon: LayoutDashboard },
    { id: "progress", label: "進度", icon: TrendingUp },
    { id: "missions", label: "任務", icon: Target },
    { id: "offline", label: "離線", icon: WifiOff },
    { id: "insights", label: "分析", icon: LineChart },
    { id: "settings", label: "設定", icon: Settings },
  ];

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-full text-sm font-black transition-all duration-200",
              // Active State: Cyan Background, White Text, Shadow
              isActive 
                ? "bg-[#29B6F6] text-white shadow-[0_4px_0_#0288D1] -translate-y-[2px]" 
                // Inactive State: Transparent, Grey Text, Hover Effect
                : "bg-transparent text-[#90A4AE] hover:bg-[#E1F5FE] hover:text-[#0277BD]"
            )}
          >
            <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-[#B0BEC5]")} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}