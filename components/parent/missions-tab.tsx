'use client';

import { useState } from 'react';
import { Check, Circle, Plus, Lightbulb, Clock, MapPin, Utensils, Moon } from 'lucide-react';
import type { DailyMission } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MissionsTabProps {
  missions: DailyMission[];
}

const suggestedMissions = [
  {
    title: 'Morning Routine',
    description: 'Practice words during getting ready',
    icon: Clock,
    words: ['Brush', 'Teeth', 'Water', 'Mirror'],
  },
  {
    title: 'Walk to School',
    description: 'Name things you see on your walk',
    icon: MapPin,
    words: ['Tree', 'Car', 'Bird', 'House'],
  },
  {
    title: 'Meal Time',
    description: 'Talk about food and table items',
    icon: Utensils,
    words: ['Plate', 'Fork', 'Spoon', 'Cup'],
  },
  {
    title: 'Bedtime Story',
    description: 'Read together and discuss new words',
    icon: Moon,
    words: ['Moon', 'Star', 'Dream', 'Sleep'],
  },
];

export function MissionsTab({ missions }: MissionsTabProps) {
  const [localMissions, setLocalMissions] = useState(missions);

  const toggleMission = (id: string) => {
    setLocalMissions((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, completed: !m.completed } : m
      )
    );
  };

  const completedCount = localMissions.filter((m) => m.completed).length;

  return (
    <div className="space-y-6">
      {/* Mission Overview */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg">Today&apos;s Offline Missions</CardTitle>
          <CardDescription>
            Reinforce learning by using words in daily activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 bg-muted rounded-full h-3">
              <div 
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${(completedCount / localMissions.length) * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold text-foreground">
              {completedCount}/{localMissions.length}
            </span>
          </div>

          <div className="space-y-3">
            {localMissions.map((mission) => (
              <div
                key={mission.id}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all',
                  mission.completed 
                    ? 'border-mint/50 bg-mint/5' 
                    : 'border-border hover:border-primary/30'
                )}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleMission(mission.id)}
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                      mission.completed ? 'bg-mint' : 'border-2 border-muted-foreground'
                    )}
                    aria-label={mission.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {mission.completed && <Check className="w-4 h-4 text-card" />}
                  </button>
                  <div className="flex-1">
                    <h3 className={cn(
                      'font-bold',
                      mission.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                    )}>
                      {mission.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mission.description}
                    </p>
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Target Word:</strong> {mission.targetWord}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong>How to:</strong> {mission.context}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Suggested Missions */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-sunny" />
            Suggested Activities
          </CardTitle>
          <CardDescription>
            Ideas for practicing vocabulary throughout the day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {suggestedMissions.map((mission, index) => {
              const Icon = mission.icon;
              return (
                <div
                  key={index}
                  className="p-4 rounded-xl border-2 border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground">{mission.title}</h4>
                      <p className="text-sm text-muted-foreground">{mission.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {mission.words.map((word) => (
                          <span 
                            key={word}
                            className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-2 border-lavender/30 bg-lavender/5">
        <CardContent className="p-4">
          <h3 className="font-bold text-foreground mb-2">Why Offline Missions Matter</h3>
          <p className="text-sm text-muted-foreground">
            Research shows that children learn vocabulary best when words move from the digital 
            screen into real life with the help of important people. These missions help 
            reinforce learning through meaningful daily interactions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
