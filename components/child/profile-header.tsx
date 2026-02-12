"use client";

import { Flame, Star, BookOpen, Target } from 'lucide-react';
import type { ChildProfile } from '@/lib/types'; 
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileHeaderProps {
  profile: any;
  onSettingsClick?: () => void;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const xpProgress = (profile.xp % 100);
  // Calculate progress safely (avoid divide by zero)
  const dailyProgress = profile.dailyGoal > 0 ? (profile.todayProgress / profile.dailyGoal) * 100 : 0;
  const xpToNextLevel = 100 - xpProgress;

  return (
    <header className="bg-white/80 backdrop-blur-md rounded-[32px] p-6 shadow-sm border border-white/50 w-full">
      <div className="flex items-center gap-5">
        
        {/* Avatar Section */}
        <div className="relative shrink-0">
          <Avatar className="w-20 h-20 border-4 border-white shadow-md">
            {profile.avatar && <AvatarImage src={profile.avatar} alt={profile.name} />}
            <AvatarFallback className="bg-orange-100 text-orange-500 text-3xl font-black">
              {profile.name?.[0] || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-1 bg-[#38BDF8] text-white text-xs font-black px-2.5 py-1 rounded-full border-2 border-white shadow-sm">
            Lv.{profile.level}
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-black text-slate-700 tracking-tight truncate">
              你好，{profile.name}！
            </h1>
            {/* 🗑️ REMOVED THE OLD SETTINGS BUTTON HERE */}
          </div>
          
          {/* XP Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1.5">
              <span className="flex items-center gap-1 text-yellow-500">
                <Star className="w-3.5 h-3.5 fill-yellow-500" />
                {profile.xp} XP
              </span>
              <span>距離下一級 {xpToNextLevel} XP</span>
            </div>
            <Progress value={xpProgress} className="h-3 rounded-full bg-slate-100" indicatorClassName="bg-gradient-to-r from-yellow-400 to-orange-400" />
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
            value={profile.wordsLearned} 
            label="已學詞彙" 
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

function StatBox({ icon, value, label, color }: { icon: React.ReactNode, value: string | number, label: string, color: string }) {
  return (
    <div className={`${color} rounded-[24px] p-3 flex flex-col items-center justify-center text-center border border-opacity-50`}>
      <div className="mb-1">{icon}</div>
      <p className="text-xl font-black text-slate-700 leading-none">{value}</p>
      <p className="text-[10px] font-bold opacity-60 uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}