"use client";

import type { Category, LanguagePreference } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getCategoryName } from "@/lib/language-utils";

interface CategoryGridProps {
  categories: Category[];
  onCategorySelect: (category: Category) => void;
  languagePreference?: LanguagePreference;
}

export function CategoryGrid({
  categories,
  onCategorySelect,
  languagePreference = "cantonese",
}: CategoryGridProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📚</span>
        <h2 className="text-lg font-bold text-foreground">Explore Words</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {categories.map((category) => {
          const categoryName = getCategoryName(category, languagePreference);
          return (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category)}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-2xl border-4 border-transparent",
                "transition-all duration-200 hover:scale-105 active:scale-95",
                "shadow-md hover:shadow-lg",
                category.color,
                "hover:border-foreground/20",
              )}
              aria-label={`${categoryName} - ${category.wordCount} words`}
            >
              <span className="text-4xl mb-2" role="img" aria-hidden="true">
                {category.icon}
              </span>
              <span className="text-sm font-bold text-foreground text-center">
                {categoryName}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {category.wordCount} words
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
