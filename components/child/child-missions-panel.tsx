"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Sparkles, Target } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  completeMission,
  getDailyMissions,
  getOfflineMissions,
  type MissionContext,
  type MissionResponse,
} from "@/lib/api/missions";
import { cn } from "@/lib/utils";

interface ChildMissionsPanelProps {
  childId: string;
}

const CONTEXT_LABELS: Record<MissionContext, string> = {
  general: "日常對話",
  mealtime: "用餐時間",
  bedtime: "睡前時光",
  playtime: "遊戲時間",
  outdoor: "戶外活動",
  shopping: "購物情境",
};

const CONTEXT_STYLES: Record<MissionContext, string> = {
  general: "bg-slate-100 text-slate-600 border-slate-200",
  mealtime: "bg-orange-100 text-orange-600 border-orange-200",
  bedtime: "bg-indigo-100 text-indigo-600 border-indigo-200",
  playtime: "bg-pink-100 text-pink-600 border-pink-200",
  outdoor: "bg-emerald-100 text-emerald-600 border-emerald-200",
  shopping: "bg-sky-100 text-sky-600 border-sky-200",
};

function isMissionCompleted(mission: MissionResponse): boolean {
  return mission.assignment?.status === "completed";
}

function pickVisibleMissions(
  dailyMissions: MissionResponse[],
  parentMissions: MissionResponse[],
): Array<{ mission: MissionResponse; kind: "daily" | "offline" }> {
  const preferredDaily = dailyMissions.slice(0, 2).map((mission) => ({
    mission,
    kind: "daily" as const,
  }));
  const preferredParent = parentMissions.slice(0, 1).map((mission) => ({
    mission,
    kind: "offline" as const,
  }));

  const visible = [...preferredDaily, ...preferredParent];

  if (visible.length >= 3) {
    return visible;
  }

  const extraDaily = dailyMissions
    .slice(preferredDaily.length)
    .map((mission) => ({
      mission,
      kind: "daily" as const,
    }));
  const extraParent = parentMissions
    .slice(preferredParent.length)
    .map((mission) => ({
      mission,
      kind: "offline" as const,
    }));

  return [...visible, ...extraDaily, ...extraParent].slice(0, 3);
}

export function ChildMissionsPanel({ childId }: ChildMissionsPanelProps) {
  const { toast } = useToast();
  const [missions, setMissions] = useState<MissionResponse[]>([]);
  const [offlineMissions, setOfflineMissions] = useState<MissionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingMissionId, setSubmittingMissionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    async function loadMissions() {
      setLoading(true);
      setError(null);

      try {
        const [missionList, offlineList] = await Promise.allSettled([
          getDailyMissions(childId),
          getOfflineMissions(childId),
        ]);
        if (missionList.status === "fulfilled") setMissions(missionList.value);
        if (offlineList.status === "fulfilled")
          setOfflineMissions(offlineList.value);
        if (
          missionList.status === "rejected" &&
          offlineList.status === "rejected"
        ) {
          setError("暫時未能載入今日任務，請稍後再試。");
        }
      } catch (loadError) {
        console.error("Failed to load child missions:", loadError);
        setError("暫時未能載入今日任務，請稍後再試。");
      } finally {
        setLoading(false);
      }
    }

    void loadMissions();
  }, [childId]);

  async function handleCompleteMission(missionId: string) {
    const previousMissions = missions;
    const previousOfflineMissions = offlineMissions;
    setSubmittingMissionId(missionId);

    setMissions((current) =>
      current.map((mission) =>
        mission.id === missionId
          ? {
              ...mission,
              assignment: mission.assignment
                ? {
                    ...mission.assignment,
                    status: "completed",
                    completed_at: new Date().toISOString(),
                  }
                : mission.assignment,
            }
          : mission,
      ),
    );
    setOfflineMissions((current) =>
      current.map((mission) =>
        mission.id === missionId
          ? {
              ...mission,
              assignment: mission.assignment
                ? {
                    ...mission.assignment,
                    status: "completed",
                    completed_at: new Date().toISOString(),
                  }
                : mission.assignment,
            }
          : mission,
      ),
    );

    try {
      await completeMission(missionId, childId, true);
      toast({
        title: "任務完成",
        description: "做得好，今天的任務已記錄。",
      });
    } catch (completionError) {
      console.error("Failed to complete child mission:", completionError);
      setMissions(previousMissions);
      setOfflineMissions(previousOfflineMissions);
      toast({
        title: "未能更新任務",
        description: "請稍後再試。",
        variant: "destructive",
      });
    } finally {
      setSubmittingMissionId(null);
    }
  }

  const visibleMissions = pickVisibleMissions(missions, offlineMissions);
  const completedCount = visibleMissions.filter(({ mission }) =>
    isMissionCompleted(mission),
  ).length;

  return (
    <section className="rounded-4xl border border-amber-200/70 bg-linear-to-br from-amber-50/95 via-white/95 to-orange-50/90 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-white shadow-sm">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-black text-amber-700">今日任務</p>
            <p className="text-base font-semibold text-slate-400">
              完成小挑戰，將今天的詞彙用出來
            </p>
          </div>
        </div>

        {!loading && visibleMissions.length > 0 && (
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/80 px-3 py-1.5 text-sm font-black text-slate-600 shadow-sm">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {`${completedCount}/${visibleMissions.length} 已完成`}
          </div>
        )}
      </div>

      {error && (
        <Alert className="mt-4 rounded-3xl border-amber-200 bg-amber-50 text-amber-900">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-sm"
            >
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="mt-3 h-7 w-36 rounded-full" />
              <Skeleton className="mt-3 h-14 w-full rounded-2xl" />
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-7 w-16 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-10 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : visibleMissions.length === 0 ? (
        <div className="mt-4 rounded-[28px] border border-dashed border-amber-200 bg-white/80 p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
            🌟
          </div>
          <p className="mt-3 text-lg font-black text-slate-700">
            今天暫時沒有新任務
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            先去學習、玩遊戲或讀故事，稍後再回來看看。
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleMissions.map(({ mission, kind }) => {
            const completed = isMissionCompleted(mission);
            const isSubmitting = submittingMissionId === mission.id;
            const isOffline = kind === "offline";
            const isParentAuthored = mission.assignment?.source === "parent";

            return (
              <article
                key={mission.id}
                className={cn(
                  "rounded-[28px] border border-white/80 bg-white/85 p-4 shadow-sm transition-transform",
                  completed && "ring-2 ring-emerald-200/80",
                  isOffline && "bg-emerald-50/70",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-3 py-1 text-xs font-black",
                        CONTEXT_STYLES[mission.context],
                      )}
                    >
                      {CONTEXT_LABELS[mission.context]}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-3 py-1 text-xs font-black",
                        isOffline
                          ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                          : "border-amber-200 bg-amber-100 text-amber-700",
                      )}
                    >
                      {isOffline ? "親子任務" : "今日任務"}
                    </span>
                    {isParentAuthored && (
                      <span className="inline-flex rounded-full border border-violet-200 bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                        家長自訂
                      </span>
                    )}
                  </div>

                  {completed && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      完成
                    </span>
                  )}
                </div>

                <h3 className="child-tab-section-title !mt-3 !text-3xl !leading-tight">
                  {mission.title}
                </h3>
                <p className="child-tab-card-copy !mt-2 !min-h-14 !text-xl !leading-6">
                  {mission.description}
                </p>

                {mission.target_words.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {mission.target_words.slice(0, 4).map((word) => (
                      <span
                        key={word}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                )}

                {mission.conversation_prompts[0] && (
                  <div className="child-tab-card-copy mt-4 rounded-2xl bg-amber-50 px-3 py-2 !text-base !leading-6 !text-slate-600">
                    <span className="font-black text-amber-700">小提示：</span>
                    {mission.conversation_prompts[0]}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={() => void handleCompleteMission(mission.id)}
                  disabled={completed || isSubmitting}
                  className={cn(
                    "mt-4 h-11 w-full rounded-full font-black text-white",
                    completed
                      ? "bg-emerald-400 hover:bg-emerald-400"
                      : isOffline
                        ? "bg-emerald-400 hover:bg-emerald-500"
                        : "bg-amber-400 hover:bg-amber-500",
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      更新中...
                    </>
                  ) : completed ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      已完成
                    </>
                  ) : isOffline ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      和家長完成了
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      我完成了
                    </>
                  )}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
