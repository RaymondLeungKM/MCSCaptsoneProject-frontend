import { Sparkles, Star, Trophy } from "lucide-react";
import type { LanguagePreference } from "@/lib/types";
import { cn } from "@/lib/utils";

export const MEMORY_STARS_GOAL = 6;

interface MemoryStarsProgressProps {
  exposureCount?: number;
  languagePreference?: LanguagePreference;
  variant?: "compact" | "badge";
  className?: string;
}

export function MemoryStarsProgress({
  exposureCount = 0,
  languagePreference: _languagePreference = "cantonese",
  variant = "compact",
  className,
}: MemoryStarsProgressProps) {
  const cappedExposureCount = Math.min(exposureCount, MEMORY_STARS_GOAL);
  const progress = cappedExposureCount;
  const remaining = Math.max(MEMORY_STARS_GOAL - cappedExposureCount, 0);
  const reachedGoal = cappedExposureCount >= MEMORY_STARS_GOAL;

  const countText = `${cappedExposureCount}/${MEMORY_STARS_GOAL}`;
  const label = "記憶小星星";
  const encouragement = reachedGoal
    ? "已達目標！"
    : cappedExposureCount === 0
      ? "點亮第一粒星"
      : `再差 ${remaining} 粒星`;

  if (variant === "badge") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 shadow-sm backdrop-blur-sm",
          reachedGoal
            ? "border-yellow-200 bg-linear-to-r from-yellow-100 to-orange-100 text-yellow-700"
            : "border-white/80 bg-white/80 text-slate-600",
          className,
        )}
      >
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full",
            reachedGoal
              ? "bg-linear-to-br from-yellow-300 to-orange-300 text-yellow-900"
              : "bg-linear-to-br from-sky-300 to-cyan-200 text-white",
          )}
        >
          {reachedGoal ? (
            <Trophy className="h-3 w-3" />
          ) : (
            <Star className="h-3 w-3 fill-current" />
          )}
        </span>

        <span className="text-[10px] font-black tracking-wide">
          {countText}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full max-w-full rounded-3xl border px-3.5 py-3 shadow-sm backdrop-blur-sm",
        reachedGoal
          ? "border-yellow-200 bg-linear-to-r from-yellow-50 via-amber-50 to-orange-50"
          : "border-sky-100 bg-linear-to-r from-sky-50 via-cyan-50 to-emerald-50",
        className,
      )}
    >
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl shadow-sm",
              reachedGoal
                ? "bg-linear-to-br from-yellow-300 to-orange-300 text-yellow-900"
                : "bg-linear-to-br from-sky-300 to-cyan-200 text-white",
            )}
          >
            {reachedGoal ? (
              <Trophy className="h-4.5 w-4.5" />
            ) : (
              <Sparkles className="h-4.5 w-4.5" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              {label}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {Array.from({ length: MEMORY_STARS_GOAL }).map((_, index) => {
                const isLit = index < progress;

                return (
                  <Star
                    key={index}
                    className={cn(
                      "h-3.5 w-3.5",
                      isLit
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-200",
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="self-end rounded-2xl bg-white/90 px-2.5 py-1.5 text-xs font-black text-slate-600 shadow-sm sm:self-auto">
          {countText}
        </div>
      </div>

      <p className="mt-2 text-[11px] font-bold text-slate-500">
        {encouragement}
      </p>
    </div>
  );
}
