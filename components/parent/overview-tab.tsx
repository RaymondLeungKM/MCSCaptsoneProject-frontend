'use client';

import { Flame, BookOpen, Trophy, Target, TrendingUp, Calendar } from 'lucide-react';
import type { ChildProfile, ProgressStats } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface OverviewTabProps {
  profile: ChildProfile;
  stats: ProgressStats;
}

export function OverviewTab({ profile, stats }: OverviewTabProps) {
  const dailyProgress = (profile.todayProgress / profile.dailyGoal) * 100;
  const overallProgress = (stats.masteredWords / stats.totalWords) * 100;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-coral/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-coral" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{profile.currentStreak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-mint/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-mint" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.masteredWords}</p>
                <p className="text-xs text-muted-foreground">Words Mastered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sunny/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-sunny" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{profile.level}</p>
                <p className="text-xs text-muted-foreground">Current Level</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-sky" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{profile.todayProgress}/{profile.dailyGoal}</p>
                <p className="text-xs text-muted-foreground">Today&apos;s Goal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              Daily Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Words learned today</span>
                  <span className="font-bold text-foreground">{profile.todayProgress} of {profile.dailyGoal}</span>
                </div>
                <Progress value={dailyProgress} className="h-3" />
              </div>
              <p className="text-sm text-muted-foreground">
                {dailyProgress >= 100 
                  ? 'Daily goal achieved! Great job!' 
                  : `${profile.dailyGoal - profile.todayProgress} more words to reach today's goal.`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 text-primary" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Total vocabulary mastered</span>
                  <span className="font-bold text-foreground">{stats.masteredWords} of {stats.totalWords}</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>
              <p className="text-sm text-muted-foreground">
                {profile.name} has mastered {Math.round(overallProgress)}% of the available vocabulary.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            This Week&apos;s Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-32">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-muted rounded-t-lg relative" style={{ height: '100%' }}>
                  <div 
                    className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all"
                    style={{ height: `${(stats.weeklyProgress[i] / Math.max(...stats.weeklyProgress)) * 100}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-foreground">{stats.weeklyProgress[i]}</p>
                  <p className="text-xs text-muted-foreground">{day}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Progress */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg">Progress by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.categoryProgress.map((cat) => (
              <div key={cat.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground font-medium">{cat.category}</span>
                  <span className="text-muted-foreground">{cat.progress}%</span>
                </div>
                <Progress value={cat.progress} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
