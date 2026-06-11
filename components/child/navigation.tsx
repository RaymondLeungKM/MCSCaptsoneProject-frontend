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
  {
    id: "revision",
    icon: Brain,
    label: "複習",
    activeBg: "bg-violet-400",
    activeText: "text-violet-600",
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
    <div
      // Outer wrapper: pinned to the viewport bottom, full width, never
      // intercepts pointer events outside the nav island. Uses the iOS safe
      // area inset so the nav clears the home indicator on every device.
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-2 sm:px-4"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.5rem)",
      }}
    >
      {/* 🏝️ Floating Glass Island */}
      <nav
        aria-label="兒童主導覽"
        className="pointer-events-auto isolate grid w-full items-end rounded-[26px] border-[3px] border-white/50 bg-white/95 shadow-[0_10px_34px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:rounded-[34px] lg:rounded-[38px]"
        style={{
          maxWidth: "min(100%, 52rem)",
          paddingInline: "clamp(0.375rem, 1.4vw, 1rem)",
          paddingBlock: "clamp(0.5rem, 1.4vw, 1rem)",
          columnGap: "clamp(0.125rem, 0.4vw, 0.5rem)",
          gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))`,
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          // Fluid sizes — phones land near the lower bound, tablets/desktops
          // near the upper bound, with a smooth transition in between.
          // Targets: mobile ~36/30px bubble, ~16/14px icon, ~11/10px label
          const bubbleSize = isActive
            ? "clamp(36px, 8vw, 72px)"
            : "clamp(30px, 6.75vw, 60px)";
          const iconSize = isActive
            ? "clamp(16px, 3.6vw, 34px)"
            : "clamp(14px, 3.1vw, 29px)";
          const labelSize = isActive
            ? "clamp(10px, 3.1vw, 17px)"
            : "clamp(9px, 2.8vw, 15px)";

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className="group relative flex min-w-0 flex-col items-center justify-end gap-1 rounded-2xl px-0.5 outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:gap-1.5 lg:gap-2"
            >
              {/* ✨ Icon Container */}
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-full transition-all duration-300",
                  isActive
                    ? `${item.activeBg} -translate-y-2 border-[3px] border-white shadow-md sm:-translate-y-3 lg:-translate-y-4`
                    : "bg-transparent text-slate-400 group-hover:bg-slate-100",
                )}
                style={{ width: bubbleSize, height: bubbleSize }}
              >
                <Icon
                  className={cn(
                    "transition-all duration-300",
                    isActive ? "text-white stroke-[3]" : "stroke-[2.5]",
                  )}
                  style={{ width: iconSize, height: iconSize }}
                />
              </span>

              {/* 📝 The Label (Now sitting INSIDE the white box) */}
              <span
                className={cn(
                  "child-tab-caption max-w-full truncate !leading-none tracking-tight transition-all duration-300 font-bold",
                  isActive
                    ? `${item.activeText} font-black opacity-100 sm:-translate-y-1`
                    : "text-slate-500 opacity-100",
                )}
                style={{ fontSize: labelSize }}
              >
                {item.label}
              </span>

              {/* ⏺️ Active Dot (Visual Anchor) */}
              {isActive && (
                <span
                  aria-hidden
                  className={`absolute bottom-0 h-1.5 w-1.5 rounded-full ${item.activeBg} opacity-50 sm:h-2 sm:w-2 lg:h-2.5 lg:w-2.5`}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
