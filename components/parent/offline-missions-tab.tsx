"use client";

import { useState, useEffect } from "react";
import {
  Check,
  MessageCircle,
  Sparkles,
  Utensils,
  ShoppingBag,
  Gamepad2,
  Trophy,
  Star,
  ChevronDown,
  ChevronUp,
  Moon,
  MapPin,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import type { OfflineMission } from "@/lib/types";
import { offlineMissions as mockOfflineMissions } from "@/lib/mock-data";
import {
  getOfflineMissions,
  getMissionProgress,
  completeMission,
  toOfflineMission,
} from "@/lib/api/missions";
import { getAuthToken } from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface OfflineMissionsTabProps {
  childId?: string;
}

export function OfflineMissionsTab({ childId }: OfflineMissionsTabProps = {}) {
  const [missions, setMissions] =
    useState<OfflineMission[]>(mockOfflineMissions);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMockData =
    !childId ||
    childId === "1" ||
    childId === "mock-child-id" ||
    childId.length < 10;

  useEffect(() => {
    async function loadMissions() {
      if (isMockData) {
        setLoading(false);
        return;
      }

      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const [missionsData, progressData] = await Promise.allSettled([
          getOfflineMissions(childId!),
          getMissionProgress(childId!),
        ]);

        if (missionsData.status === "fulfilled") {
          const progressMap = new Map(
            progressData.status === "fulfilled"
              ? progressData.value.map((p) => [p.mission_id, p])
              : [],
          );
          const mapped = missionsData.value.map((m) =>
            toOfflineMission(m, progressMap.get(m.id)),
          );
          setMissions(mapped);
          console.log(`[Missions] Loaded ${mapped.length} offline missions`);
        } else {
          console.warn("[Missions] Failed to load, using mock fallback");
        }
      } catch (e) {
        console.error("[Missions] Error:", e);
        setError("無法載入任務，顯示示例資料。");
      } finally {
        setLoading(false);
      }
    }

    void loadMissions();
  }, [childId, isMockData]);

  const toggleMissionComplete = (missionId: string) => {
    const target = missions.find((m) => m.id === missionId);
    if (!target) return;
    const newCompleted = !target.completed;

    // Optimistic update
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId
          ? {
              ...m,
              completed: newCompleted,
              completedDate: newCompleted ? new Date() : undefined,
            }
          : m,
      ),
    );

    // Sync with backend (fire-and-forget)
    if (!isMockData && childId) {
      completeMission(missionId, childId, newCompleted).catch((e) =>
        console.warn("[Missions] Could not sync completion:", e),
      );
    }
  };

  const getContextIcon = (context: OfflineMission["context"]) => {
    switch (context) {
      case "mealtime":
        return <Utensils className="w-5 h-5" />;
      case "bedtime":
        return <Moon className="w-5 h-5" />;
      case "playtime":
        return <Gamepad2 className="w-5 h-5" />;
      case "outdoor":
        return <MapPin className="w-5 h-5" />;
      case "shopping":
        return <ShoppingBag className="w-5 h-5" />;
      default:
        return <MessageCircle className="w-5 h-5" />;
    }
  };

  // Translate the context tags that appear on the card
  const getContextLabel = (context: OfflineMission["context"]) => {
    switch (context) {
      case "mealtime":
        return "用餐時間";
      case "bedtime":
        return "睡前時光";
      case "playtime":
        return "遊戲時間";
      case "outdoor":
        return "戶外活動";
      case "shopping":
        return "購物時間";
      default:
        return "日常對話";
    }
  };

  const getContextColorClasses = (context: OfflineMission["context"]) => {
    switch (context) {
      case "mealtime":
        return "bg-orange-100 text-orange-600 border-orange-200";
      case "bedtime":
        return "bg-indigo-100 text-indigo-600 border-indigo-200";
      case "playtime":
        return "bg-pink-100 text-pink-600 border-pink-200";
      case "outdoor":
        return "bg-green-100 text-green-600 border-green-200";
      case "shopping":
        return "bg-blue-100 text-blue-600 border-blue-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const completedCount = missions.filter((m) => m.completed).length;
  const progressPercentage =
    missions.length > 0 ? (completedCount / missions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
        <Skeleton className="h-32 w-full rounded-[32px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 md:p-6 bg-white/50 backdrop-blur-sm rounded-[32px]">
      {/* --- HEADER --- */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl mb-2 shadow-sm">
          <Sparkles className="w-8 h-8 text-orange-500 animate-pulse" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
          生活實戰任務
        </h2>
        <p className="text-slate-500 font-medium max-w-lg mx-auto">
          將學習融入日常生活！完成這些小任務，隨時隨地加強小朋友的詞彙記憶。
        </p>
        {error && (
          <p className="text-xs text-amber-600 font-medium flex items-center justify-center gap-1">
            <RefreshCw className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>

      {/* --- PROGRESS CARD --- */}
      <Card className="border-none shadow-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white overflow-hidden relative rounded-[24px]">
        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10">
          <Trophy className="w-48 h-48" />
        </div>
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-2xl font-bold flex items-center gap-2 justify-center md:justify-start">
                <Trophy className="w-6 h-6 text-yellow-300" />
                本週挑戰
              </h3>
              <p className="text-blue-100 font-medium">
                {completedCount === missions.length
                  ? "🎉 太棒了！你已經完成了所有任務！"
                  : `你已經完成了 ${missions.length} 個任務中的 ${completedCount} 個。繼續加油！`}
              </p>
            </div>
            <div className="w-full md:w-1/2 space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-blue-100">
                <span>完成度</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="h-4 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- WHY THIS MATTERS (3 STATS) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: "🗣️",
            title: "實戰應用",
            desc: "在真實情境中學習最有效",
            color: "bg-purple-50 text-purple-700 border-purple-100",
          },
          {
            icon: "🧠",
            title: "加強記憶",
            desc: "連結日常生活，印象更深刻",
            color: "bg-emerald-50 text-emerald-700 border-emerald-100",
          },
          {
            icon: "🤝",
            title: "親子互動",
            desc: "最好的學習就是陪伴",
            color: "bg-rose-50 text-rose-700 border-rose-100",
          },
        ].map((item, i) => (
          <div
            key={i}
            className={cn(
              "flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-transform hover:-translate-y-1 bg-white",
              item.color,
            )}
          >
            <span className="text-3xl mb-2">{item.icon}</span>
            <h4 className="font-bold text-sm">{item.title}</h4>
            <span className="text-xs opacity-80">{item.desc}</span>
          </div>
        ))}
      </div>

      {/* --- MISSIONS LIST --- */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-700 px-2 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          可進行任務
        </h3>

        <div className="grid gap-4">
          {missions.map((mission) => {
            const isSelected = selectedMissionId === mission.id;
            const contextColors = getContextColorClasses(mission.context);

            return (
              <div
                key={mission.id}
                className={cn(
                  "group relative rounded-3xl border-2 transition-all duration-300 ease-in-out bg-white overflow-hidden",
                  mission.completed
                    ? "border-green-200 bg-green-50/50"
                    : "border-slate-100 hover:border-blue-200 hover:shadow-lg",
                  isSelected ? "ring-2 ring-blue-400 ring-offset-2" : "",
                )}
              >
                {/* Main Card Content */}
                <div
                  className="p-5 cursor-pointer"
                  onClick={() =>
                    setSelectedMissionId(isSelected ? null : mission.id)
                  }
                >
                  <div className="flex items-start gap-5">
                    {/* Icon Box */}
                    <div
                      className={cn(
                        "flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-sm transition-transform group-hover:scale-110",
                        contextColors,
                      )}
                    >
                      {getContextIcon(mission.context)}
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {/* Translated Label */}
                            <span
                              className={cn(
                                "text-xs font-bold tracking-wider px-2 py-0.5 rounded-full border",
                                contextColors,
                              )}
                            >
                              {getContextLabel(mission.context)}
                            </span>
                            {mission.completed && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
                                <Check className="w-3 h-3" /> 已完成
                              </span>
                            )}
                          </div>
                          <h3
                            className={cn(
                              "text-lg font-bold text-slate-800 truncate pr-4",
                              mission.completed && "line-through opacity-60",
                            )}
                          >
                            {mission.title}
                          </h3>
                        </div>

                        {/* Complete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMissionComplete(mission.id);
                          }}
                          className={cn(
                            "flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95",
                            mission.completed
                              ? "bg-green-500 border-green-500 text-white"
                              : "bg-white border-slate-200 text-slate-300 hover:border-green-400 hover:text-green-400",
                          )}
                          title={
                            mission.completed ? "標記為未完成" : "標記為完成"
                          }
                        >
                          <Check className="w-6 h-6 stroke-[3]" />
                        </button>
                      </div>

                      <p className="text-slate-500 text-sm mt-1 line-clamp-1 group-hover:line-clamp-none transition-all">
                        {mission.description}
                      </p>

                      {/* Target Words Pills */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {mission.targetWords.map((word, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-full"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Expand/Collapse Indicator */}
                  <div className="flex justify-center mt-2 -mb-2">
                    {isSelected ? (
                      <ChevronUp className="w-4 h-4 text-slate-300" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                    )}
                  </div>
                </div>

                {/* Expanded Details Section */}
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-in-out bg-slate-50 border-t border-slate-100",
                    isSelected
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="p-5 space-y-4">
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-blue-500" />
                          試吓咁樣問：
                        </h4>
                        <ul className="space-y-3">
                          {mission.conversationPrompts.map((prompt, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg"
                            >
                              <span className="text-blue-500 font-bold text-lg leading-none mt-0.5">
                                •
                              </span>
                              <span className="italic font-medium">
                                「{prompt}」
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-start gap-3 bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-100">
                        <span className="text-xl">
                          <Lightbulb className="w-5 h-5 text-yellow-600" />
                        </span>
                        <div className="text-sm">
                          <strong className="block mb-1 font-bold">
                            家長小貼士
                          </strong>
                          多問開放式問題，並給予小朋友足夠時間思考和回應。就算他們沒有即時用準確的字眼回答也沒關係，多加鼓勵即可！
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- TIPS FOOTER --- */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[32px] p-6 border-2 border-indigo-100">
        <h3 className="text-lg font-black text-indigo-900 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-indigo-500 fill-indigo-500" />
          成功小秘訣
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex gap-3">
            <span className="font-bold text-indigo-400 text-lg">01</span>
            <div>
              <strong className="block text-indigo-900">保持耐性</strong>
              <span className="text-indigo-700/80">
                小朋友可能要聽 6-12 次才會記得一個新詞彙。
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-indigo-400 text-lg">02</span>
            <div>
              <strong className="block text-indigo-900">輕鬆有趣</strong>
              <span className="text-indigo-700/80">
                用有趣的聲線、誇張的動作，令學習變成遊戲。
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-indigo-400 text-lg">03</span>
            <div>
              <strong className="block text-indigo-900">跟隨興趣</strong>
              <span className="text-indigo-700/80">
                談論他們正在注視或感興趣的事物。
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-indigo-400 text-lg">04</span>
            <div>
              <strong className="block text-indigo-900">多加鼓勵</strong>
              <span className="text-indigo-700/80">
                讚賞他們的每一次嘗試，即使發音未完全準確。
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
