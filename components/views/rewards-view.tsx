'use client';

import { Trophy, Star, Flame, Lock, Check } from 'lucide-react';
import type { ChildProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface RewardsViewProps {
  profile: ChildProfile;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  requirement: number;
  type: 'words' | 'streak' | 'level';
  unlocked: boolean;
}

const badges: Badge[] = [
  { id: '1', name: 'First Word', icon: '🌟', description: 'Learn your first word', requirement: 1, type: 'words', unlocked: true },
  { id: '2', name: 'Word Explorer', icon: '🔍', description: 'Learn 10 words', requirement: 10, type: 'words', unlocked: true },
  { id: '3', name: 'Word Champion', icon: '🏆', description: 'Learn 25 words', requirement: 25, type: 'words', unlocked: true },
  { id: '4', name: 'Word Master', icon: '👑', description: 'Learn 50 words', requirement: 50, type: 'words', unlocked: false },
  { id: '5', name: 'Word Wizard', icon: '🧙', description: 'Learn 100 words', requirement: 100, type: 'words', unlocked: false },
  { id: '6', name: 'Streak Starter', icon: '🔥', description: '3 day streak', requirement: 3, type: 'streak', unlocked: true },
  { id: '7', name: 'On Fire', icon: '💥', description: '7 day streak', requirement: 7, type: 'streak', unlocked: true },
  { id: '8', name: 'Unstoppable', icon: '⚡', description: '14 day streak', requirement: 14, type: 'streak', unlocked: false },
  { id: '9', name: 'Rising Star', icon: '⭐', description: 'Reach level 3', requirement: 3, type: 'level', unlocked: true },
  { id: '10', name: 'Super Star', icon: '🌠', description: 'Reach level 5', requirement: 5, type: 'level', unlocked: true },
  { id: '11', name: 'Mega Star', icon: '💫', description: 'Reach level 10', requirement: 10, type: 'level', unlocked: false },
];

export function RewardsView({ profile }: RewardsViewProps) {
  const unlockedBadges = badges.filter(b => b.unlocked);
  const lockedBadges = badges.filter(b => !b.unlocked);
  const nextBadge = lockedBadges[0];

  const getProgress = (badge: Badge) => {
    switch (badge.type) {
      case 'words':
        return Math.min((profile.wordsLearned / badge.requirement) * 100, 100);
      case 'streak':
        return Math.min((profile.currentStreak / badge.requirement) * 100, 100);
      case 'level':
        return Math.min((profile.level / badge.requirement) * 100, 100);
      default:
        return 0;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-3xl">🏆</span>
        <h1 className="text-2xl font-bold text-foreground">My Rewards</h1>
      </div>

      {/* Stats Summary */}
      <div className="bg-card rounded-3xl p-5 border-4 border-sunny/50 shadow-lg">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-sunny/30 flex items-center justify-center mb-2">
              <Trophy className="w-6 h-6 text-coral" />
            </div>
            <p className="text-2xl font-bold text-foreground">{unlockedBadges.length}</p>
            <p className="text-xs text-muted-foreground">Badges</p>
          </div>
          
          <div className="w-px h-12 bg-border" />
          
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-sunny/30 flex items-center justify-center mb-2">
              <Star className="w-6 h-6 text-sunny fill-sunny" />
            </div>
            <p className="text-2xl font-bold text-foreground">{profile.xp}</p>
            <p className="text-xs text-muted-foreground">Total XP</p>
          </div>
          
          <div className="w-px h-12 bg-border" />
          
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-sunny/30 flex items-center justify-center mb-2">
              <Flame className="w-6 h-6 text-coral" />
            </div>
            <p className="text-2xl font-bold text-foreground">{profile.currentStreak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
        </div>
      </div>

      {/* Next Badge */}
      {nextBadge && (
        <div className="bg-card rounded-3xl p-5 border-4 border-primary/20 shadow-lg">
          <p className="text-sm font-bold text-muted-foreground mb-3">Next Badge</p>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-4xl">
              {nextBadge.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">{nextBadge.name}</h3>
              <p className="text-sm text-muted-foreground">{nextBadge.description}</p>
              <div className="mt-2">
                <Progress value={getProgress(nextBadge)} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unlocked Badges */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Check className="w-5 h-5 text-mint" />
          Earned Badges ({unlockedBadges.length})
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {unlockedBadges.map((badge) => (
            <div
              key={badge.id}
              className="flex flex-col items-center p-3 rounded-2xl bg-card border-4 border-mint/50 shadow-md"
            >
              <span className="text-4xl mb-1">{badge.icon}</span>
              <p className="text-xs font-bold text-foreground text-center">{badge.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Locked Badges */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Lock className="w-5 h-5 text-muted-foreground" />
          Coming Soon ({lockedBadges.length})
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {lockedBadges.map((badge) => (
            <div
              key={badge.id}
              className="flex flex-col items-center p-3 rounded-2xl bg-muted/50 border-4 border-transparent shadow-md opacity-60"
            >
              <div className="relative">
                <span className="text-4xl mb-1 grayscale">{badge.icon}</span>
                <Lock className="absolute -bottom-1 -right-1 w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs font-bold text-muted-foreground text-center">{badge.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
