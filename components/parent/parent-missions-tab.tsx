"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Gamepad2,
  Lightbulb,
  MapPin,
  MessageCircle,
  Moon,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Trophy,
  Utensils,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthToken } from "@/lib/api/client";
import {
  completeMission,
  getDailyMissions,
  getMissionProgress,
  getOfflineMissions,
  toOfflineMission,
} from "@/lib/api/missions";
import { offlineMissions as mockOfflineMissions } from "@/lib/mock-data";
import type { OfflineMission } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ParentMissionsTabProps {
  childId?: string;
}

type ParentMissionSection = {
  id: "daily" | "offline";
  title: string;
  subtitle: string;
  emptyMessage: string;
  missions: OfflineMission[];
};

const mockDailyMissions: OfflineMission[] = [
  {
    id: "daily-m1",
    title: "今日說一說紅色",
    description: "請小朋友找出三樣紅色物件，並逐一說出它們的名字。",
    context: "general",
    targetWords: ["紅色", "蘋果", "氣球"],
    completed: false,
    conversationPrompts: ["我看到紅色蘋果！", "這個氣球也是紅色的。"],
  },
  {
    id: "daily-m2",
    title: "動作詞小挑戰",
    description: "跟著指令做動作，再把動作詞說出來。",
    context: "playtime",
    targetWords: ["跳", "跑", "拍手"],
    completed: false,
    conversationPrompts: ["我會跳高高！", "現在一起拍手吧！"],
  },
  {
    id: "daily-m3",
    title: "心情分享",
    description: "請孩子說出今天的心情，並配上一個表情或動作。",
    context: "general",
    targetWords: ["開心", "傷心", "生氣"],
    completed: false,
    conversationPrompts: ["我今天很開心！", "你可以做一個開心的表情嗎？"],
  },
];

function updateMissionCompletion(
  missions: OfflineMission[],
  missionId: string,
  completed: boolean,
): OfflineMission[] {
  return missions.map((mission) =>
    mission.id === missionId
      ? {
          ...mission,
          completed,
          completedDate: completed ? new Date() : undefined,
        }
      : mission,
  );
}

function getContextIcon(context: OfflineMission["context"]) {
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
}

function getContextLabel(context: OfflineMission["context"]) {
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
}

function getContextColorClasses(context: OfflineMission["context"]) {
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
}

export function ParentMissionsTab({ childId }: ParentMissionsTabProps = {}) {
  const [dailyMissions, setDailyMissions] = useState<OfflineMission[]>([]);
  const [offlineMissions, setOfflineMissions] = useState<OfflineMission[]>([]);
  const [selectedMissionKey, setSelectedMissionKey] = useState<string | null>(
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
        setDailyMissions(mockDailyMissions);
        setOfflineMissions(mockOfflineMissions);
        setLoading(false);
        return;
      }

      const token = getAuthToken();
      if (!token) {
        setDailyMissions(mockDailyMissions);
        setOfflineMissions(mockOfflineMissions);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        setError(null);
        const [dailyResult, offlineResult, progressResult] =
          await Promise.allSettled([
            getDailyMissions(childId!),
            getOfflineMissions(childId!),
            getMissionProgress(childId!),
          ]);

        const progressMap = new Map(
          progressResult.status === "fulfilled"
            ? progressResult.value.map((progress) => [
                progress.mission_id,
                progress,
              ])
            : [],
        );

        const mappedDaily =
          dailyResult.status === "fulfilled"
            ? dailyResult.value.map((mission) =>
                toOfflineMission(mission, progressMap.get(mission.id)),
              )
            : [];

        const mappedOffline =
          offlineResult.status === "fulfilled"
            ? offlineResult.value.map((mission) =>
                toOfflineMission(mission, progressMap.get(mission.id)),
              )
            : [];

        setDailyMissions(mappedDaily);
        setOfflineMissions(mappedOffline);

        if (
          dailyResult.status === "rejected" ||
          offlineResult.status === "rejected" ||
          progressResult.status === "rejected"
        ) {
          setError("部分任務暫時未能載入，現正顯示可用內容。");
        }
      } catch (loadError) {
        console.error("[Parent Missions] Error:", loadError);
        setError("無法載入任務，顯示示例資料。");
        setDailyMissions(mockDailyMissions);
        setOfflineMissions(mockOfflineMissions);
      } finally {
        setLoading(false);
      }
    }

    void loadMissions();
  }, [childId, isMockData]);

  async function toggleMissionComplete(missionId: string) {
    const target = [...dailyMissions, ...offlineMissions].find(
      (mission) => mission.id === missionId,
    );
    if (!target) return;

    const newCompleted = !target.completed;
    const previousDailyMissions = dailyMissions;
    const previousOfflineMissions = offlineMissions;

    setDailyMissions((current) =>
      updateMissionCompletion(current, missionId, newCompleted),
    );
    setOfflineMissions((current) =>
      updateMissionCompletion(current, missionId, newCompleted),
    );

    if (!isMockData && childId) {
      try {
        await completeMission(missionId, childId, newCompleted);
      } catch (completionError) {
        console.warn(
          "[Parent Missions] Could not sync completion:",
          completionError,
        );
        setDailyMissions(previousDailyMissions);
        setOfflineMissions(previousOfflineMissions);
      }
    }
  }

  const sections: ParentMissionSection[] = [
    {
      id: "daily",
      title: "每日互動任務",
      subtitle: "會顯示在小朋友首頁，也會在這裡供家長跟進。",
      emptyMessage: "目前未有可用的每日任務。",
      missions: dailyMissions,
    },
    {
      id: "offline",
      title: "生活實戰任務",
      subtitle: "家長可在真實情境中陪伴小朋友一起完成。",
      emptyMessage: "目前未有可用的生活實戰任務。",
      missions: offlineMissions,
    },
  ];

  const allMissions = sections.flatMap((section) => section.missions);
  const completedCount = allMissions.filter(
    (mission) => mission.completed,
  ).length;
  const progressPercentage =
    allMissions.length > 0 ? (completedCount / allMissions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6 w-full p-4 md:p-6 bg-white/50 backdrop-blur-sm rounded-4xl">
        <Skeleton className="h-32 w-full rounded-4xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full p-4 md:p-6 bg-white/50 backdrop-blur-sm rounded-4xl">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-linear-to-br from-yellow-100 to-orange-100 rounded-2xl mb-2 shadow-sm">
          <Sparkles className="w-8 h-8 text-orange-500 animate-pulse" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
          任務中心
        </h2>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto">
          這裡會同時顯示小朋友的每日任務，以及適合家長陪伴完成的生活實戰任務。
        </p>
        {error && (
          <p className="text-xs text-amber-600 font-medium flex items-center justify-center gap-1">
            <RefreshCw className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>

      <Card className="border-none shadow-xl bg-linear-to-r from-blue-500 to-cyan-400 text-white overflow-hidden relative rounded-3xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10">
          <Trophy className="w-48 h-48" />
        </div>
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-2xl font-bold flex items-center gap-2 justify-center md:justify-start">
                <Trophy className="w-6 h-6 text-yellow-300" />
                今日任務總覽
              </h3>
              <p className="text-blue-100 font-medium">
                {allMissions.length === 0
                  ? "目前未有已發佈任務。"
                  : completedCount === allMissions.length
                    ? "🎉 太棒了！今天的任務已全部完成。"
                    : `目前已完成 ${completedCount} / ${allMissions.length} 個任務。`}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: "🎯",
            title: "每日任務",
            desc: "適合在畫面內完成的小任務。",
            color: "bg-amber-50 text-amber-700 border-amber-100",
          },
          {
            icon: "🏡",
            title: "生活實戰",
            desc: "把詞彙帶進用餐、睡前與外出情境。",
            color: "bg-emerald-50 text-emerald-700 border-emerald-100",
          },
          {
            icon: "🤝",
            title: "兩個介面同步",
            desc: "兩個介面任務會同時在家長與小朋友介面出現。",
            color: "bg-violet-50 text-violet-700 border-violet-100",
          },
        ].map((item, index) => (
          <div
            key={index}
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

      {sections.map((section) => (
        <div key={section.id} className="space-y-4">
          <div className="px-2">
            <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              {section.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              {section.subtitle}
            </p>
          </div>

          {section.missions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 px-5 py-6 text-center text-sm font-medium text-slate-500">
              {section.emptyMessage}
            </div>
          ) : (
            <div className="grid gap-4">
              {section.missions.map((mission) => {
                const missionKey = `${section.id}:${mission.id}`;
                const isSelected = selectedMissionKey === missionKey;
                const contextColors = getContextColorClasses(mission.context);

                return (
                  <div
                    key={missionKey}
                    className={cn(
                      "group relative rounded-3xl border-2 transition-all duration-300 ease-in-out bg-white overflow-hidden",
                      mission.completed
                        ? "border-green-200 bg-green-50/50"
                        : "border-slate-100 hover:border-blue-200 hover:shadow-lg",
                      isSelected ? "ring-2 ring-blue-400 ring-offset-2" : "",
                    )}
                  >
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() =>
                        setSelectedMissionKey(isSelected ? null : missionKey)
                      }
                    >
                      <div className="flex items-start gap-5">
                        <div
                          className={cn(
                            "shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-sm transition-transform group-hover:scale-110",
                            contextColors,
                          )}
                        >
                          {getContextIcon(mission.context)}
                        </div>

                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span
                                  className={cn(
                                    "text-xs font-bold tracking-wider px-2 py-0.5 rounded-full border",
                                    contextColors,
                                  )}
                                >
                                  {getContextLabel(mission.context)}
                                </span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                  {section.title}
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
                                  mission.completed &&
                                    "line-through opacity-60",
                                )}
                              >
                                {mission.title}
                              </h3>
                            </div>

                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                void toggleMissionComplete(mission.id);
                              }}
                              className={cn(
                                "shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95",
                                mission.completed
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "bg-white border-slate-200 text-slate-300 hover:border-green-400 hover:text-green-400",
                              )}
                              title={
                                mission.completed
                                  ? "標記為未完成"
                                  : "標記為完成"
                              }
                            >
                              <Check className="w-6 h-6 stroke-3" />
                            </button>
                          </div>

                          <p className="text-slate-500 text-sm mt-1 line-clamp-1 group-hover:line-clamp-none transition-all">
                            {mission.description}
                          </p>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {mission.targetWords.map((word, index) => (
                              <span
                                key={`${missionKey}:${word}:${index}`}
                                className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-full"
                              >
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center mt-2 -mb-2">
                        {isSelected ? (
                          <ChevronUp className="w-4 h-4 text-slate-300" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                        )}
                      </div>
                    </div>

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
                              可以這樣提問：
                            </h4>
                            <ul className="space-y-3">
                              {mission.conversationPrompts.map(
                                (prompt, index) => (
                                  <li
                                    key={`${missionKey}:prompt:${index}`}
                                    className="flex items-start gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg"
                                  >
                                    <span className="text-blue-500 font-bold text-lg leading-none mt-0.5">
                                      •
                                    </span>
                                    <span className="italic font-medium">
                                      「{prompt}」
                                    </span>
                                  </li>
                                ),
                              )}
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
                              {section.id === "daily"
                                ? "可先讓孩子在畫面內完成任務，再在真實情境中請他們把詞語說出來，幫助從辨認過渡到主動輸出。"
                                : "多問開放式問題，並給予小朋友足夠時間思考和回應。就算他們沒有即時用準確的字眼回答也沒關係，多加鼓勵即可！"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div className="bg-linear-to-br from-indigo-50 to-blue-50 rounded-4xl p-6 border-2 border-indigo-100">
        <h3 className="text-lg font-black text-indigo-900 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-indigo-500 fill-indigo-500" />
          使用小提醒
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex gap-3">
            <span className="font-bold text-indigo-400 text-lg">01</span>
            <div>
              <strong className="block text-indigo-900">每日任務</strong>
              <span className="text-indigo-700/80">
                適合小朋友先在介面上完成，再由家長延伸成口語練習。
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-indigo-400 text-lg">02</span>
            <div>
              <strong className="block text-indigo-900">生活實戰任務</strong>
              <span className="text-indigo-700/80">
                適合家長在用餐、外出、睡前等真實情境陪伴完成。
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-indigo-400 text-lg">03</span>
            <div>
              <strong className="block text-indigo-900">兩個介面任務</strong>
              <span className="text-indigo-700/80">
                兩個介面只決定顯示對象；是否屬於每日任務或生活實戰任務仍由任務類型決定。
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-indigo-400 text-lg">04</span>
            <div>
              <strong className="block text-indigo-900">多加鼓勵</strong>
              <span className="text-indigo-700/80">
                讚賞每一次嘗試，比糾正得快更能建立孩子的信心。
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
