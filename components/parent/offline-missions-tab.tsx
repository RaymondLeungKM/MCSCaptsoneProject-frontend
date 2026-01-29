"use client";

import { useState } from "react";
import {
  Check,
  Calendar,
  MessageCircle,
  Sparkles,
  Home,
  ShoppingCart,
  Sun,
  Moon,
  PlayCircle,
} from "lucide-react";
import type { OfflineMission } from "@/lib/types";
import { offlineMissions } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OfflineMissionsTab() {
  const [missions, setMissions] = useState(offlineMissions);
  const [selectedMission, setSelectedMission] = useState<OfflineMission | null>(
    null,
  );

  const toggleMissionComplete = (missionId: string) => {
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId
          ? {
              ...m,
              completed: !m.completed,
              completedDate: !m.completed ? new Date() : undefined,
            }
          : m,
      ),
    );
  };

  const getContextIcon = (context: OfflineMission["context"]) => {
    switch (context) {
      case "mealtime":
        return "🍽️";
      case "bedtime":
        return "🌙";
      case "playtime":
        return "🎮";
      case "outdoor":
        return "🌳";
      case "shopping":
        return "🛒";
      default:
        return "💬";
    }
  };

  const getContextColor = (context: OfflineMission["context"]) => {
    switch (context) {
      case "mealtime":
        return "bg-coral/20 border-coral/40";
      case "bedtime":
        return "bg-lavender/20 border-lavender/40";
      case "playtime":
        return "bg-sunny/20 border-sunny/40";
      case "outdoor":
        return "bg-mint/20 border-mint/40";
      case "shopping":
        return "bg-sky/20 border-sky/40";
      default:
        return "bg-muted/20 border-muted/40";
    }
  };

  const completedCount = missions.filter((m) => m.completed).length;
  const progressPercentage = (completedCount / missions.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">
            Offline Missions
          </h2>
        </div>
        <p className="text-muted-foreground">
          Practice vocabulary in real-life situations throughout the day
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Weekly Progress
              </span>
              <span className="text-sm font-bold text-foreground">
                {completedCount} / {missions.length} missions
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primary to-mint h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why This Matters */}
      <Card className="bg-primary/5 border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Why Real-World Practice Matters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            ✅ Children learn best when they use words in{" "}
            <strong>meaningful conversations</strong>
          </p>
          <p>
            ✅ Linking words to daily routines helps{" "}
            <strong>memory and recall</strong>
          </p>
          <p>✅ Parent-child interaction is the most powerful learning tool</p>
        </CardContent>
      </Card>

      {/* Missions List */}
      <div className="space-y-3">
        {missions.map((mission) => (
          <Card
            key={mission.id}
            className={cn(
              "border-2 transition-all hover:shadow-lg cursor-pointer",
              mission.completed && "bg-mint/5 border-mint/30",
            )}
            onClick={() =>
              setSelectedMission(
                selectedMission?.id === mission.id ? null : mission,
              )
            }
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    "text-4xl flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center border-2",
                    getContextColor(mission.context),
                  )}
                >
                  {getContextIcon(mission.context)}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">
                        {mission.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {mission.description}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMissionComplete(mission.id);
                      }}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                        mission.completed
                          ? "bg-mint border-mint text-white"
                          : "border-muted hover:border-primary",
                      )}
                    >
                      {mission.completed && <Check className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Target Words */}
                  <div className="flex flex-wrap gap-2">
                    {mission.targetWords.map((word, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full"
                      >
                        {word}
                      </span>
                    ))}
                  </div>

                  {/* Expanded Details */}
                  {selectedMission?.id === mission.id && (
                    <div className="mt-4 pt-4 border-t space-y-4 animate-in slide-in-from-top duration-200">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          Conversation Starters:
                        </h4>
                        <ul className="space-y-2">
                          {mission.conversationPrompts.map((prompt, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-foreground"
                            >
                              <span className="text-primary">•</span>
                              <span className="italic">"{prompt}"</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                        <strong>💡 Tip:</strong> Ask open-ended questions and
                        give your child time to respond. It's okay if they don't
                        use the exact words right away!
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Tips */}
      <Card className="bg-sunny/5 border-2 border-sunny/30">
        <CardHeader>
          <CardTitle className="text-lg">📱 Quick Tips for Success</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Be Patient:</strong> Children may need to hear a word 6-12
            times before it sticks
          </p>
          <p>
            <strong>Make it Fun:</strong> Use silly voices, gestures, and
            playful repetition
          </p>
          <p>
            <strong>Follow Their Lead:</strong> If they show interest in
            something, talk about it using the target words
          </p>
          <p>
            <strong>Celebrate Attempts:</strong> Praise any effort to use new
            words, even if pronunciation isn't perfect
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
