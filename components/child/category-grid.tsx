"use client";

import type { Category, LanguagePreference } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getCategoryName } from "@/lib/language-utils";
import { Sparkles, Play } from "lucide-react";

interface CategoryGridProps {
  categories: Category[];
  onCategorySelect?: (category: Category) => void; // Made optional for safety
  languagePreference?: LanguagePreference;
}

// 🎨 Vivid Pastel Colors for the Cards
const getColorClass = (color: string) => {
  const c = color?.toLowerCase() || "blue";
  const map: Record<string, string> = {
    red: "bg-red-100 text-red-600 border-red-300 hover:bg-red-200 hover:scale-105",
    blue: "bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200 hover:scale-105",
    green: "bg-green-100 text-green-600 border-green-300 hover:bg-green-200 hover:scale-105",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200 hover:scale-105",
    purple: "bg-purple-100 text-purple-600 border-purple-300 hover:bg-purple-200 hover:scale-105",
    orange: "bg-orange-100 text-orange-600 border-orange-300 hover:bg-orange-200 hover:scale-105",
    pink: "bg-pink-100 text-pink-600 border-pink-300 hover:bg-pink-200 hover:scale-105",
    teal: "bg-teal-100 text-teal-600 border-teal-300 hover:bg-teal-200 hover:scale-105",
  };
  return map[c] || map.blue;
};

export function CategoryGrid({
  categories,
  onCategorySelect,
  languagePreference = "cantonese",
}: CategoryGridProps) {
  
  const headerText = languagePreference === "english" ? "Explore Words" : "探索主題";
  const subHeaderText = languagePreference === "english" ? "Choose a category" : "選擇一個主題開始學習";

  return (
    // ✨ WRAPPER: Added a white glass container so text is visible on dark backgrounds
    <div className="bg-white/80 backdrop-blur-md rounded-[40px] p-6 md:p-8 shadow-sm border border-white/50 w-full max-w-xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-yellow-400 p-2.5 rounded-2xl shadow-sm rotate-3">
          <Sparkles className="w-6 h-6 text-white fill-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-700 tracking-tight">
            {headerText}
          </h2>
          <p className="text-sm font-bold text-slate-400">
            {subHeaderText}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {categories.map((category) => {
          const categoryName = getCategoryName(category, languagePreference);
          const colorClasses = getColorClass(category.color);
          
          return (
            <button
              key={category.id}
              onClick={() => onCategorySelect && onCategorySelect(category)}
              className={cn(
                "group relative flex flex-col items-center justify-center p-4 h-44 rounded-[32px] border-[3px]",
                "transition-all duration-300 shadow-sm",
                colorClasses
              )}
            >
              {/* Icon */}
              <span className="text-5xl mb-3 drop-shadow-sm filter transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                {category.icon}
              </span>

              {/* Name */}
              <span className="text-lg font-black tracking-tight text-center leading-tight">
                {categoryName}
              </span>

              {/* Word Count Tag */}
              <span className="mt-2 px-2.5 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase tracking-wide">
                {category.wordCount} {languagePreference === "english" ? "words" : "詞語"}
              </span>

              {/* Play Button Indicator (appears on hover) */}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <div className="bg-white rounded-full p-1.5 shadow-sm">
                   <Play className="w-4 h-4 fill-current" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}