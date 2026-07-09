"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Brain,
  Clock3,
  Gamepad2,
  Globe2,
  Loader2,
  Moon,
  Palette,
  Sparkles,
  Star,
  Sun,
  Users,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { toChildProfile, updateChild } from "@/lib/api/children";
import type { ChildProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ProfileViewProps {
  profile: ChildProfile;
  onProfileUpdated?: (profile: ChildProfile) => void;
  onOpenParentDashboard?: () => void;
  onOpenTab?: (tab: "learn" | "games" | "stories") => void;
}

const AVATAR_OPTIONS = [
  "👧",
  "👦",
  "🧒",
  "👶",
  "🐰",
  "🐻",
  "🦊",
  "🐼",
  "🦁",
  "🐯",
  "🐨",
  "🐸",
];

const learningStyleMeta = {
  visual: {
    label: "視覺探索家",
    description: "喜歡看圖像、顏色和畫面來學習。",
  },
  auditory: {
    label: "聲音小高手",
    description: "透過聆聽、朗讀和聲音提示吸收最快。",
  },
  kinesthetic: {
    label: "動作冒險家",
    description: "一邊動一邊學，最容易記住新詞彙。",
  },
  mixed: {
    label: "全能學習家",
    description: "圖像、聲音和互動都能幫助你學得更好。",
  },
} as const;

const languageLabels = {
  cantonese: "粵語",
  english: "英文",
  bilingual: "雙語",
} as const;

const timeOfDayMeta = {
  morning: {
    label: "早上",
    icon: Sun,
    accent: "text-amber-500",
    bg: "bg-amber-50 border-amber-100",
  },
  afternoon: {
    label: "下午",
    icon: Sparkles,
    accent: "text-orange-500",
    bg: "bg-orange-50 border-orange-100",
  },
  evening: {
    label: "晚上",
    icon: Moon,
    accent: "text-indigo-500",
    bg: "bg-indigo-50 border-indigo-100",
  },
} as const;

function getXpProgress(xp: number): number {
  const progress = xp % 100;
  return progress === 0 && xp > 0 ? 100 : progress;
}

function ProfileAvatar({ avatar, name }: { avatar: string; name: string }) {
  const isImage = avatar?.startsWith("http");

  return (
    <Avatar className="h-[96px] w-[96px] shrink-0 border-4 border-white shadow-lg ring-4 ring-sky-100/70">
      {isImage && <AvatarImage src={avatar} alt={name} />}
      <AvatarFallback className="bg-linear-to-br from-orange-100 via-rose-50 to-sky-100 text-5xl font-black text-slate-700">
        {!isImage && avatar ? avatar : name?.[0] || "C"}
      </AvatarFallback>
    </Avatar>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  className,
}: {
  icon: typeof BookOpen;
  label: string;
  description: string;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[28px] border p-4 text-left transition-transform hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <p className="child-tab-card-title !mt-0 !text-base">{label}</p>
      <p className="child-tab-card-copy">{description}</p>
    </button>
  );
}

function StatCard({
  label,
  value,
  helper,
  accent,
}: {
  label: string;
  value: string;
  helper: string;
  accent: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-sm backdrop-blur-md">
      <p className="child-tab-stat-label">
        {label}
      </p>
      <p className={cn("child-tab-stat-value !mt-3", accent)}>{value}</p>
      <p className="child-tab-stat-copy">{helper}</p>
    </div>
  );
}

export function ProfileView({
  profile,
  onProfileUpdated,
  onOpenParentDashboard,
  onOpenTab,
}: ProfileViewProps) {
  const { toast } = useToast();
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    setSelectedAvatar(profile.avatar);
  }, [profile.avatar]);

  const xpProgress = getXpProgress(profile.xp);
  const xpToNextLevel = xpProgress === 100 ? 0 : 100 - xpProgress;
  const dailyGoalProgress =
    profile.dailyGoal > 0
      ? Math.min((profile.todayProgress / profile.dailyGoal) * 100, 100)
      : 0;
  const hasAvatarChange = selectedAvatar !== profile.avatar;
  const hasInterests = profile.interests.length > 0;
  const preferredTime = timeOfDayMeta[profile.preferredTimeOfDay];
  const PreferredTimeIcon = preferredTime.icon;
  const learningStyle = learningStyleMeta[profile.learningStyle];

  const handleSaveAvatar = async () => {
    if (!hasAvatarChange || savingAvatar) {
      return;
    }

    setSavingAvatar(true);

    try {
      const updatedChild = await updateChild(profile.id, {
        avatar: selectedAvatar,
      });
      onProfileUpdated?.(toChildProfile(updatedChild));
      toast({
        title: "頭像已更新",
        description: "你的個人檔案已換上新造型。",
      });
    } catch (error) {
      console.error("Failed to update child avatar:", error);
      setSelectedAvatar(profile.avatar);
      toast({
        title: "更新失敗",
        description: "暫時未能儲存新頭像，請稍後再試。",
        variant: "destructive",
      });
    } finally {
      setSavingAvatar(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[40px] border border-white/60 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="bg-linear-to-r from-[#FDE68A]/50 via-[#FDBA74]/35 to-[#7DD3FC]/35 px-6 py-8 md:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-5">
              <ProfileAvatar avatar={selectedAvatar} name={profile.name} />
              <div className="space-y-2 min-w-0 w-full sm:flex-1 text-center sm:text-left">
                <div>
                  <p className="child-tab-caption !text-slate-400">
                    我的檔案
                  </p>
                  <h2 className="child-tab-hero-title !mt-1 !text-3xl sm:!text-4xl">
                    {profile.name}
                  </h2>
                  <p className="child-tab-hero-copy !max-w-none !text-sm sm:!text-base">
                    {profile.age} 歲 ・ Lv.{profile.level} ・ {profile.xp} XP
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Badge className="rounded-full bg-sky-500 px-4 py-2 text-sm text-white hover:bg-sky-500 font-bold whitespace-nowrap">
                    {languageLabels[profile.languagePreference || "cantonese"]}
                  </Badge>
                  <Badge className="rounded-full bg-emerald-500 px-4 py-2 text-sm text-white hover:bg-emerald-500 font-bold whitespace-nowrap">
                    {learningStyle.label}
                  </Badge>
                  <Badge className="rounded-full bg-violet-500 px-4 py-2 text-sm text-white hover:bg-violet-500 font-bold whitespace-nowrap">
                    專注 {profile.attentionSpan} 分鐘
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/75 p-6 shadow-sm backdrop-blur-md md:w-[360px]">
              <div className="mb-3 flex flex-col gap-1 text-center text-base font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <span>升級進度</span>
                <span>{xpToNextLevel} XP 到下一級</span>
              </div>
              <Progress
                value={xpProgress}
                className="h-4 rounded-full bg-slate-100"
                indicatorClassName="bg-linear-to-r from-yellow-400 via-orange-400 to-pink-400"
              />
              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div className="rounded-2xl bg-amber-50 px-4 py-4">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-500">
                    今日進度
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-800">
                    {profile.todayProgress}/{profile.dailyGoal}
                  </p>
                </div>
                <div className="rounded-2xl bg-rose-50 px-4 py-4">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-500">
                    連續天數
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-800">
                    {profile.currentStreak}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-[1.15fr_0.85fr] md:px-8 md:py-8">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="已掌握詞彙"
                value={String(profile.wordsLearned)}
                helper="繼續努力，字詞會越來越多。"
                accent="text-sky-600"
              />
              <StatCard
                label="今日目標"
                value={`${profile.todayProgress}/${profile.dailyGoal}`}
                helper="每天一點點，最容易養成習慣。"
                accent="text-emerald-600"
              />
              <StatCard
                label="學習節奏"
                value={preferredTime.label}
                helper="在你最有精神的時段練習。"
                accent="text-violet-600"
              />
            </div>

            <div className="rounded-[32px] border border-white/60 bg-white/75 p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="child-tab-section-title !text-xl">
                    我的學習風格
                  </h3>
                  <p className="child-tab-section-copy !text-sm">
                    {learningStyle.description}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-sky-100 bg-sky-50/80 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sky-600">
                    <Globe2 className="h-5 w-5" />
                    <p className="text-sm font-black">語言模式</p>
                  </div>
                  <p className="text-lg font-black text-slate-800">
                    {languageLabels[profile.languagePreference || "cantonese"]}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    會按照這個語言偏好顯示學習內容。
                  </p>
                </div>

                <div
                  className={cn("rounded-[24px] border p-4", preferredTime.bg)}
                >
                  <div
                    className={cn(
                      "mb-2 flex items-center gap-2",
                      preferredTime.accent,
                    )}
                  >
                    <PreferredTimeIcon className="h-5 w-5" />
                    <p className="text-sm font-black">最佳練習時段</p>
                  </div>
                  <p className="text-lg font-black text-slate-800">
                    {preferredTime.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    在這個時間安排短練習，通常最有效率。
                  </p>
                </div>

                <div className="rounded-[24px] border border-amber-100 bg-amber-50/80 p-4">
                  <div className="mb-2 flex items-center gap-2 text-amber-600">
                    <Clock3 className="h-5 w-5" />
                    <p className="text-sm font-black">專注小宇宙</p>
                  </div>
                  <p className="text-lg font-black text-slate-800">
                    {profile.attentionSpan} 分鐘
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    你的活動長度會盡量配合這個專注時間。
                  </p>
                </div>

                <div className="rounded-[24px] border border-rose-100 bg-rose-50/80 p-4">
                  <div className="mb-2 flex items-center gap-2 text-rose-600">
                    <Star className="h-5 w-5" />
                    <p className="text-sm font-black">今日目標完成度</p>
                  </div>
                  <Progress
                    value={dailyGoalProgress}
                    className="h-3 rounded-full bg-white"
                    indicatorClassName="bg-linear-to-r from-emerald-400 to-sky-400"
                  />
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    目前已完成 {Math.round(dailyGoalProgress)}%。
                  </p>
                </div>
              </div>
            </div>

            {hasInterests && (
              <div className="rounded-[32px] border border-white/60 bg-white/75 p-6 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="child-tab-section-title !text-xl">
                      我喜歡的主題
                    </h3>
                    <p className="child-tab-section-copy !text-sm">
                      系統會用這些興趣來安排更貼近你的內容。
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {profile.interests.map((interest) => (
                    <Badge
                      key={interest}
                      className="rounded-full border border-pink-100 bg-pink-50 px-4 py-2 text-sm font-black text-pink-600 hover:bg-pink-50"
                      variant="outline"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-white/60 bg-white/75 p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">
                  <Palette className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="child-tab-section-title !text-xl">
                    換個新頭像
                  </h3>
                  <p className="child-tab-section-copy !text-sm">
                    挑選你喜歡的角色，讓學習空間更像你自己。
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-3">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={cn(
                      "flex h-14 items-center justify-center rounded-2xl border-2 text-3xl transition-all",
                      selectedAvatar === avatar
                        ? "border-sky-400 bg-sky-50 shadow-sm scale-[1.03]"
                        : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50",
                    )}
                    aria-label={`選擇頭像 ${avatar}`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() => void handleSaveAvatar()}
                  disabled={!hasAvatarChange || savingAvatar}
                  className="rounded-full px-5 font-black"
                >
                  {savingAvatar && <Loader2 className="h-4 w-4 animate-spin" />}
                  儲存頭像
                </Button>
                <p className="text-sm font-semibold text-slate-500">
                  {hasAvatarChange
                    ? "按下儲存後，首頁和學習頁都會看到新頭像。"
                    : "目前頭像已是最新設定。"}
                </p>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/60 bg-white/75 p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="child-tab-section-title !text-xl">
                    接下來想做什麼？
                  </h3>
                  <p className="child-tab-section-copy !text-sm">
                    從你的個人檔案，直接跳到下一個活動。
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <QuickActionButton
                  icon={BookOpen}
                  label="去學習單字"
                  description="打開主題卡片，繼續累積今日進度。"
                  onClick={() => onOpenTab?.("learn")}
                  className="border-emerald-100 bg-emerald-50/80 text-emerald-600"
                />
                <QuickActionButton
                  icon={Gamepad2}
                  label="玩互動遊戲"
                  description="用遊戲方式複習剛剛學到的詞彙。"
                  onClick={() => onOpenTab?.("games")}
                  className="border-orange-100 bg-orange-50/80 text-orange-500"
                />
                <QuickActionButton
                  icon={Moon}
                  label="聽睡前故事"
                  description="看看今天有沒有新故事可以閱讀。"
                  onClick={() => onOpenTab?.("stories")}
                  className="border-violet-100 bg-violet-50/80 text-violet-500"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                className="mt-5 w-full rounded-full border-slate-200 font-black text-slate-700"
                onClick={() => onOpenParentDashboard?.()}
              >
                前往家長中心
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
