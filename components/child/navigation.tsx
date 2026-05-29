"use client";

import {
  Home,
  BookOpen,
  Gamepad2,
  Trophy,
  User,
  Moon,
  Brain,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// 🎨 RAINBOW PALETTE (High Contrast)
const navItems = [
  {
    id: "home",
    icon: Home,
    label: "首頁",
    activeBg: "bg-blue-400",
    activeText: "text-blue-600",
  },
  {
    id: "learn",
    icon: BookOpen,
    label: "學習",
    activeBg: "bg-emerald-400",
    activeText: "text-emerald-600",
  },
  {
    id: "games",
    icon: Gamepad2,
    label: "遊戲",
    activeBg: "bg-orange-400",
    activeText: "text-orange-600",
  },
  {
    id: "stories",
    icon: Moon,
    label: "故事",
    activeBg: "bg-purple-400",
    activeText: "text-purple-600",
  },
  {
    id: "community",
    icon: Users,
    label: "社區",
    activeBg: "bg-teal-400",
    activeText: "text-teal-600",
  },
  // {
  //   id: "ai",
  //   icon: Brain,
  //   label: "智能",
  //   activeBg: "bg-violet-400",
  //   activeText: "text-violet-600",
  // },
  {
    id: "rewards",
    icon: Trophy,
    label: "獎勵",
    activeBg: "bg-yellow-400",
    activeText: "text-yellow-700", // Darker yellow for readability
  },
  {
    id: "profile",
    icon: User,
    label: "我的",
    activeBg: "bg-slate-400",
    activeText: "text-slate-600",
  },
];

export function ChildNavigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <div
      className="fixed left-1 right-1 z-50 flex justify-center sm:left-2 sm:right-2"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.25rem)" }}
    >
      {/* 🏝️ Floating Glass Island */}
      <nav className="grid w-full max-w-[23rem] grid-cols-7 items-end rounded-[24px] border-[3px] border-white/50 bg-white/95 px-1 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.15)] backdrop-blur-xl sm:max-w-lg sm:rounded-[32px] sm:px-2 sm:py-3.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="group relative flex min-w-0 flex-col items-center justify-end gap-0.5 px-0"
            >
              {/* ✨ Icon Container */}
              <div
                className={cn(
                  "flex items-center justify-center rounded-full transition-all duration-300",
                  isActive
                    ? `h-10 w-10 sm:h-16 sm:w-16 ${item.activeBg} -translate-y-1.5 sm:-translate-y-4 border-[3px] sm:border-4 border-white shadow-md`
                    : "h-8 w-8 sm:h-11 sm:w-11 bg-transparent text-slate-400 group-hover:bg-slate-100",
                )}
              >
                <Icon
                  className={cn(
                    "transition-all duration-300",
                    isActive
                      ? "h-[18px] w-[18px] sm:h-7 sm:w-7 text-white stroke-[3]"
                      : "h-[18px] w-[18px] sm:h-7 sm:w-7 stroke-[2.5]",
                  )}
                />
              </div>

              {/* 📝 The Label (Now sitting INSIDE the white box) */}
              <span
                className={cn(
                  "min-h-[0.72rem] max-w-full truncate text-[8px] font-black leading-none tracking-tight transition-all duration-300 sm:min-h-[1rem] sm:text-xs sm:tracking-wide",
                  isActive
                    ? `${item.activeText} text-[9px] opacity-100 sm:-translate-y-1 sm:text-sm`
                    : "text-slate-500 opacity-100",
                )}
              >
                {item.label}
              </span>

              {/* ⏺️ Active Dot (Visual Anchor) */}
              {isActive && (
                <div
                  className={`w-1.5 h-1.5 rounded-full ${item.activeBg} absolute bottom-0 opacity-50`}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
