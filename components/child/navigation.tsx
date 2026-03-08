"use client";

import { Home, BookOpen, Gamepad2, Trophy, User, Moon } from "lucide-react";
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
    <div className="fixed bottom-4 left-2 right-2 z-50 flex justify-center safe-area-inset-bottom">
      {/* 🏝️ Floating Glass Island */}
      <nav className="flex items-end justify-between w-full max-w-lg px-2 py-3 bg-white/95 backdrop-blur-xl border-[3px] border-white/50 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.15)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="group relative flex flex-col items-center justify-end w-full gap-1"
            >
              {/* ✨ Icon Container */}
              <div
                className={cn(
                  "flex items-center justify-center rounded-full transition-all duration-300",
                  isActive
                    ? `w-12 h-12 ${item.activeBg} -translate-y-4 shadow-md border-4 border-white` // Active: Big, colored bubble, pops up
                    : "w-8 h-8 bg-transparent text-slate-400 group-hover:bg-slate-100", // Inactive: Small, gray
                )}
              >
                <Icon
                  className={cn(
                    "transition-all duration-300",
                    isActive
                      ? "w-6 h-6 text-white stroke-[3]"
                      : "w-6 h-6 stroke-[2.5]",
                  )}
                />
              </div>

              {/* 📝 The Label (Now sitting INSIDE the white box) */}
              <span
                className={cn(
                  "text-[11px] font-black tracking-wide transition-all duration-300",
                  isActive
                    ? `${item.activeText} -translate-y-2 opacity-100` // Active: Colored, moves up
                    : "text-slate-400 opacity-0 h-0 overflow-hidden", // Inactive: Hidden to save space
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
