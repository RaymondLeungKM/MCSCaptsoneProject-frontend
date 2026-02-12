"use client";

import {
  Flame,
  BookOpen,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Layers
} from "lucide-react";
import type { ChildProfile, ProgressStats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AnalyticsDashboard } from "./analytics-dashboard";

interface OverviewTabProps {
  profile: ChildProfile;
  stats: ProgressStats;
}

// --- 1. DEFINE TRANSLATIONS HERE (Outside the function) ---
const categoryTranslations: Record<string, string> = {
  "Animals": "動物",
  "Food": "食物",
  "Colors": "顏色",
  "Nature": "大自然",
  "Vehicles": "交通工具",
  "Family": "家庭",
  "Numbers": "數字",
  "Body": "身體部位",
  "Actions": "動作"
};

export function OverviewTab({ profile, stats }: OverviewTabProps) {
  const isMockData =
    !profile.id ||
    profile.id === "1" ||
    profile.id === "mock-child-id" ||
    profile.id.length < 10;

  if (!isMockData) {
    return <AnalyticsDashboard childId={profile.id} />;
  }

  const dailyProgress = Math.min((profile.todayProgress / profile.dailyGoal) * 100, 100);
  const overallProgress = (stats.masteredWords / stats.totalWords) * 100;
  const remaining = Math.max(0, profile.dailyGoal - profile.todayProgress);
  const days = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];

  return (
    <div className="space-y-6 font-zen">
      {/* 1. QUICK STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Streak */}
        <Card className="rounded-[24px] border-none shadow-sm bg-[#FFF8E1]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-800">
                {profile.currentStreak} <span className="text-sm font-bold text-gray-500">日</span>
              </p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">連續打卡</p>
            </div>
          </CardContent>
        </Card>

        {/* Mastered Words */}
        <Card className="rounded-[24px] border-none shadow-sm bg-[#E1F5FE]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-6 h-6 text-sky-500" />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-800">
                {stats.masteredWords}
              </p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">已學詞彙</p>
            </div>
          </CardContent>
        </Card>

        {/* Level */}
        <Card className="rounded-[24px] border-none shadow-sm bg-[#FFF3E0]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-800">
                {profile.level}
              </p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">目前等級</p>
            </div>
          </CardContent>
        </Card>

        {/* Today's Goal */}
        <Card className="rounded-[24px] border-none shadow-sm bg-[#E8F5E9]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Target className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-800">
                {profile.todayProgress}<span className="text-xl text-gray-400">/{profile.dailyGoal}</span>
              </p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                今日目標
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. PROGRESS OVERVIEW */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-[32px] border-2 border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-black text-gray-700">
              <TrendingUp className="w-6 h-6 text-[#29B6F6]" />
              每日進度 (Daily Progress)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-bold text-gray-500">
                <span>今日學習詞彙</span>
                <span>{profile.todayProgress} / {profile.dailyGoal}</span>
              </div>
              <Progress value={dailyProgress} className="h-4 rounded-full bg-gray-100" indicatorClassName="bg-[#FF9800]" />
              <p className="text-sm text-gray-500 font-medium">
                {dailyProgress >= 100
                  ? "太棒了！今日目標已達成！🎉"
                  : `加油！再學 ${remaining} 個生字就達標啦！`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-2 border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-black text-gray-700">
              <BookOpen className="w-6 h-6 text-[#29B6F6]" />
              總進度 (Overall)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-bold text-gray-500">
                <span>總詞彙掌握量</span>
                <span>{stats.masteredWords} / {stats.totalWords}</span>
              </div>
              <Progress value={overallProgress} className="h-4 rounded-full bg-gray-100" indicatorClassName="bg-[#29B6F6]" />
              <p className="text-sm text-gray-500 font-medium">
                {profile.name} 已經掌握了課程嘅 {Math.round(overallProgress)}% 生字！
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. WEEKLY ACTIVITY */}
      <Card className="rounded-[32px] border-2 border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-black text-gray-700">
            <Calendar className="w-6 h-6 text-[#FF9800]" />
            本週活躍度 (Weekly Activity)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-40 pt-4 px-2">
            {days.map((day, i) => {
              const maxVal = Math.max(...stats.weeklyProgress, 1);
              const heightPercent = (stats.weeklyProgress[i] / maxVal) * 100;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full h-full bg-[#F5F5F5] rounded-[16px] relative overflow-hidden">
                    <div
                      className="absolute bottom-0 w-full bg-[#29B6F6] rounded-[16px] transition-all duration-1000 group-hover:bg-[#FF9800]"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-gray-700 mb-0.5">{stats.weeklyProgress[i]}</p>
                    <p className="text-[10px] font-bold text-gray-400">{day}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 4. CATEGORY PROGRESS (With Color Logic) */}
      <Card className="rounded-[32px] border-2 border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-black text-gray-700">
            <Layers className="w-6 h-6 text-[#66BB6A]" />
            類別進度 (By Category)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {stats.categoryProgress.map((cat) => {
              // Color Logic: 80+ Green, 40+ Cyan, <40 Orange
              let colorClass = "bg-[#FF9800]";
              let textClass = "text-[#FF9800]";
              if (cat.progress >= 80) {
                colorClass = "bg-[#66BB6A]";
                textClass = "text-[#66BB6A]";
              } else if (cat.progress >= 40) {
                colorClass = "bg-[#29B6F6]";
                textClass = "text-[#29B6F6]";
              }

              return (
                <div key={cat.category}>
                  <div className="flex justify-between text-sm mb-2 font-bold">
                    {/* TRANSLATE HERE */}
                    <span className="text-gray-600">
                       {categoryTranslations[cat.category] || cat.category}
                    </span>
                    <span className={textClass}>{cat.progress}%</span>
                  </div>
                  <Progress 
                    value={cat.progress} 
                    className="h-3 rounded-full bg-gray-100" 
                    indicatorClassName={colorClass} 
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}