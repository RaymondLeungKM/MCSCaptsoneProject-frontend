"use client";

import { useEffect, useState } from "react";
import { Flame, Star, BookOpen, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getChild, getProgressStats, toChildProfile } from "@/lib/api";
import type { ChildProfile } from "@/lib/types";

interface ProfileHeaderProps {
  childId: string;
  refreshKey?: number;
  onSettingsClick?: () => void;
}

export function ProfileHeader({ childId, refreshKey }: ProfileHeaderProps) {
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [masteredWords, setMasteredWords] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) return;

    let cancelled = false;

    async function fetchProfile() {
      setLoading(true);
      try {
        const [childData, statsData] = await Promise.allSettled([
          getChild(childId),
          getProgressStats(childId),
        ]);

        if (cancelled) return;

        if (childData.status === "fulfilled") {
          setProfile(toChildProfile(childData.value));
        }

        if (statsData.status === "fulfilled") {
          setMasteredWords(statsData.value.mastered_words);
        }
      } catch (err) {
        console.error("[ProfileHeader] Failed to load profile:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchProfile();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, refreshKey]);

  if (loading) {
    return <ProfileHeaderSkeleton />;
  }

  if (!profile) return null;

  const xpProgress = profile.xp % 100;
  const xpToNextLevel = 100 - xpProgress;
  const displayedWordsLearned = masteredWords ?? profile.wordsLearned;

  return (
    <header className="bg-white/80 backdrop-blur-md rounded-[32px] p-6 shadow-sm border border-white/50 w-full">
      <div className="flex items-center gap-5">
        {/* Avatar Section */}
        <div className="relative shrink-0">
          <Avatar className="w-20 h-20 border-4 border-white shadow-md">
            {profile.avatar && profile.avatar.startsWith("http") && (
              <AvatarImage src={profile.avatar} alt={profile.name} />
            )}
            <AvatarFallback className="bg-orange-100 text-orange-500 text-3xl font-black">
              {profile.avatar && !profile.avatar.startsWith("http")
                ? profile.avatar
                : profile.name?.[0] || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-1 bg-[#38BDF8] text-white text-xs font-black px-2.5 py-1 rounded-full border-2 border-white shadow-sm">
            Lv.{profile.level}
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-black text-slate-700 tracking-tight truncate">
              你好，{profile.name}！
            </h1>
          </div>

          {/* XP Bar */}
          <div>
            <div className="flex items-center justify-between text-base font-bold text-slate-400 mb-1.5">
              <span className="flex items-center gap-1 text-yellow-500">
                <Star className="w-3.5 h-3.5 fill-yellow-500" />
                {profile.xp} XP
              </span>
              <span>距離下一級 {xpToNextLevel} XP</span>
            </div>
            <Progress
              value={xpProgress}
              className="h-3 rounded-full bg-slate-100"
              indicatorClassName="bg-gradient-to-r from-yellow-400 to-orange-400"
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <StatBox
          icon={<Flame className="w-6 h-6 text-orange-500 fill-orange-500" />}
          value={profile.currentStreak}
          label="連續打卡"
          color="bg-orange-50 border-orange-100"
        />
        <StatBox
          icon={<BookOpen className="w-6 h-6 text-blue-500" />}
          value={displayedWordsLearned}
          label="已掌握詞彙"
          color="bg-blue-50 border-blue-100"
        />
        <StatBox
          icon={<Target className="w-6 h-6 text-green-500" />}
          value={`${profile.todayProgress}/${profile.dailyGoal}`}
          label="今日目標"
          color="bg-green-50 border-green-100"
        />
      </div>
    </header>
  );
}

function ProfileHeaderSkeleton() {
  return (
    <header className="bg-white/80 backdrop-blur-md rounded-[32px] p-6 shadow-sm border border-white/50 w-full">
      <div className="flex items-center gap-5">
        <Skeleton className="w-20 h-20 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-36 rounded-xl" />
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-24 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-6">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-[24px]" />
        ))}
      </div>
    </header>
  );
}

function StatBox({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div
      className={`${color} rounded-[24px] p-3 flex flex-col items-center justify-center text-center border border-opacity-50`}
    >
      <div className="mb-1">{icon}</div>
      <p className="text-2xl font-black text-slate-700 leading-none">{value}</p>
      <p className="text-xs font-bold opacity-60 uppercase tracking-wide mt-1">
        {label}
      </p>
    </div>
  );
}
