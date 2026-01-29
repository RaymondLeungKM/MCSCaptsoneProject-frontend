'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Volume2, Moon, Bell, Shield, Heart, LogOut, ExternalLink } from 'lucide-react';
import type { ChildProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';

interface ProfileViewProps {
  profile: ChildProfile;
}

const avatars = ['👧', '👦', '🧒', '👶', '🐰', '🐻', '🦊', '🐼'];

export function ProfileView({ profile }: ProfileViewProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [parentMode, setParentMode] = useState(false);

  const xpProgress = (profile.xp % 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-3xl">👤</span>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-card rounded-3xl p-6 border-4 border-primary/20 shadow-lg text-center">
        {/* Avatar */}
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-sunny flex items-center justify-center text-5xl border-4 border-primary shadow-lg">
            {selectedAvatar}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full">
            Lv.{profile.level}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-4">{profile.name}</h2>
        <p className="text-muted-foreground">Age {profile.age}</p>

        {/* XP Progress */}
        <div className="mt-4 max-w-xs mx-auto">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
            <span>Level {profile.level}</span>
            <span>Level {profile.level + 1}</span>
          </div>
          <Progress value={xpProgress} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">{100 - xpProgress} XP to next level</p>
        </div>

        {/* Choose Avatar */}
        <div className="mt-6">
          <p className="text-sm font-bold text-muted-foreground mb-3">Choose Your Avatar</p>
          <div className="flex flex-wrap justify-center gap-2">
            {avatars.map((avatar) => (
              <button
                key={avatar}
                onClick={() => setSelectedAvatar(avatar)}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all',
                  'border-4',
                  selectedAvatar === avatar 
                    ? 'border-primary bg-primary/10 scale-110' 
                    : 'border-transparent bg-muted hover:bg-muted/80'
                )}
                aria-label={`Select avatar ${avatar}`}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-card rounded-3xl p-5 border-4 border-mint/30 shadow-lg">
        <h3 className="font-bold text-foreground mb-4">My Learning Stats</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Words Learned</span>
            <span className="font-bold text-foreground">{profile.wordsLearned}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Current Streak</span>
            <span className="font-bold text-foreground">{profile.currentStreak} days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Daily Goal</span>
            <span className="font-bold text-foreground">{profile.dailyGoal} words</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Favorite Topics</span>
            <span className="font-bold text-foreground">{profile.interests.join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-card rounded-3xl overflow-hidden border-4 border-transparent shadow-lg">
        <h3 className="font-bold text-foreground p-5 pb-3">Settings</h3>
        
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky/30 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-sky" />
              </div>
              <span className="font-medium text-foreground">Sound Effects</span>
            </div>
            <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-lavender/30 flex items-center justify-center">
                <Bell className="w-5 h-5 text-lavender" />
              </div>
              <span className="font-medium text-foreground">Reminders</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-coral/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-coral" />
              </div>
              <span className="font-medium text-foreground">Parent Mode</span>
            </div>
            <Switch checked={parentMode} onCheckedChange={setParentMode} />
          </div>

          <Link 
            href="/parent"
            className="flex items-center justify-between p-4 w-full hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium text-foreground">Parent Dashboard</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          <button className="flex items-center justify-between p-4 w-full hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-mint/30 flex items-center justify-center">
                <Heart className="w-5 h-5 text-mint" />
              </div>
              <span className="font-medium text-foreground">About WordWorld</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
