'use client';

import { Flame, Star, Settings } from 'lucide-react';
import type { ChildProfile } from '@/lib/types';
import { Progress } from '@/components/ui/progress';

interface ProfileHeaderProps {
  profile: ChildProfile;
  onSettingsClick?: () => void;
}

export function ProfileHeader({ profile, onSettingsClick }: ProfileHeaderProps) {
  const xpProgress = (profile.xp % 100);
  const dailyProgress = (profile.todayProgress / profile.dailyGoal) * 100;

  return (
    <header className="bg-card rounded-3xl p-4 shadow-lg border-4 border-primary/20">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-sunny flex items-center justify-center text-4xl border-4 border-primary shadow-md">
            {profile.avatar}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            Lv.{profile.level}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">
              Hi, {profile.name}!
            </h1>
            <button 
              onClick={onSettingsClick}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          
          {/* XP Bar */}
          <div className="mt-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-sunny fill-sunny" />
                {profile.xp} XP
              </span>
              <span>{100 - xpProgress} to next level</span>
            </div>
            <Progress value={xpProgress} className="h-2 bg-muted" />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        {/* Streak */}
        <div className="flex items-center gap-2 bg-coral/10 px-3 py-2 rounded-2xl">
          <Flame className="w-5 h-5 text-coral" />
          <div>
            <p className="text-lg font-bold text-foreground">{profile.currentStreak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
        </div>

        {/* Words Learned */}
        <div className="flex items-center gap-2 bg-mint/20 px-3 py-2 rounded-2xl">
          <span className="text-2xl">📚</span>
          <div>
            <p className="text-lg font-bold text-foreground">{profile.wordsLearned}</p>
            <p className="text-xs text-muted-foreground">Words Learned</p>
          </div>
        </div>

        {/* Daily Goal */}
        <div className="flex items-center gap-2 bg-sky/20 px-3 py-2 rounded-2xl">
          <div className="relative">
            <svg className="w-10 h-10 -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-muted"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${dailyProgress} ${100 - dailyProgress}`}
                strokeLinecap="round"
                className="text-primary"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
              {profile.todayProgress}/{profile.dailyGoal}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Today</p>
        </div>
      </div>
    </header>
  );
}
