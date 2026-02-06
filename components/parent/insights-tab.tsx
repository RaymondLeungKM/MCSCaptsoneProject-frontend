"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Brain,
  Target,
  Lightbulb,
  Heart,
  Clock,
  Zap,
} from "lucide-react";
import type { ChildProfile, Word, LearningSession } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  generateParentInsights,
  getAdaptiveLearningRecommendation,
} from "@/lib/adaptive-learning";
import { words as mockWords, childProfile } from "@/lib/mock-data";
import { getWordsWithProgress, toWord } from "@/lib/api/vocabulary";
import { getAuthToken } from "@/lib/api/client";

interface InsightsTabProps {
  childId?: string;
}

export function InsightsTab({ childId }: InsightsTabProps = {}) {
  const [profile] = useState<ChildProfile>(childProfile);
  const [words, setWords] = useState<Word[]>(mockWords);
  const [loading, setLoading] = useState(true);

  // Check if we have a real child ID (not mock)
  const isMockData =
    !childId ||
    childId === "1" ||
    childId === "mock-child-id" ||
    childId.length < 10;

  // Fetch real data if we have a real child ID
  useEffect(() => {
    async function loadRealData() {
      if (isMockData) {
        setLoading(false);
        return;
      }

      try {
        const token = getAuthToken();
        if (!token) {
          console.log("No auth token, using mock data");
          setLoading(false);
          return;
        }

        // Fetch all words with progress for this child
        const wordsData = await getWordsWithProgress(childId);
        const loadedWords = wordsData.map((w) => toWord(w, w.progress));

        setWords(loadedWords);
        console.log(`Loaded ${loadedWords.length} words for insights`);
      } catch (error) {
        console.error("Failed to load words for insights:", error);
        // Keep using mock data on error
      } finally {
        setLoading(false);
      }
    }

    loadRealData();
  }, [childId, isMockData]);

  // Mock recent sessions data
  const recentSessions: LearningSession[] = [
    {
      id: "1",
      childId: profile.id,
      date: new Date(),
      duration: 15,
      wordsEncountered: ["elephant", "giraffe", "apple", "butterfly"],
      wordsUsedActively: ["elephant", "apple"],
      engagementLevel: "high",
      activitiesCompleted: ["story", "charades"],
    },
  ];

  const insights = generateParentInsights(profile, words, recentSessions);
  const recommendation = getAdaptiveLearningRecommendation(words, profile, 15);

  // Calculate stats
  const activeVocab = words.filter((w) => w.mastered).length;
  const passiveVocab = words.filter(
    (w) => !w.mastered && w.exposureCount > 0,
  ).length;
  const needingExposure = words.filter((w) => w.exposureCount < 6).length;
  const wellLearned = words.filter((w) => w.exposureCount >= 6).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">
            Learning Insights
          </h2>
        </div>
        <p className="text-muted-foreground">
          Research-based insights into {profile.name}'s vocabulary development
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-mint">
                <Zap className="w-5 h-5" />
                <span className="text-sm font-medium">Active Vocabulary</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {activeVocab}
              </p>
              <p className="text-sm text-muted-foreground">
                Can use confidently
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sky">
                <Brain className="w-5 h-5" />
                <span className="text-sm font-medium">Passive Vocabulary</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {passiveVocab}
              </p>
              <p className="text-sm text-muted-foreground">
                Recognizes but learning
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exposure Tracking */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Optimal Exposure Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Words with 6+ exposures
              </span>
              <span className="font-bold text-foreground">
                {wellLearned} / {words.length}
              </span>
            </div>
            <Progress
              value={(wellLearned / words.length) * 100}
              className="h-2"
            />
          </div>

          <div className="bg-primary/5 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">
              📚 Research Finding:
            </p>
            <p className="text-sm text-muted-foreground">
              Children typically need <strong>6-12 exposures</strong> to a word
              in different contexts before it becomes part of their permanent
              vocabulary. {profile.name} has {needingExposure} words that need
              more practice!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personalized Insights */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-sunny" />
            Personalized Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {insights.map((insight, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
              >
                <span className="text-xl">💡</span>
                <p className="text-sm text-foreground flex-1">{insight}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Next Learning Recommendation */}
      <Card className="border-2 border-mint/30 bg-mint/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-mint" />
            Next Learning Session Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Recommended Activity
              </p>
              <p className="text-lg font-bold text-foreground capitalize">
                {recommendation.recommendedActivity}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Duration</p>
              <p className="text-lg font-bold text-foreground">
                {recommendation.estimatedDuration} minutes
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Focus Words:</p>
            <div className="flex flex-wrap gap-2">
              {recommendation.nextWords.map((word) => (
                <span
                  key={word.id}
                  className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm font-medium border-2 border-mint/30"
                >
                  {word.word}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              <strong>Why:</strong> {recommendation.reason}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Learning Style */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-coral" />
            Learning Style Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-5xl">
              {profile.learningStyle === "kinesthetic" && "🤸"}
              {profile.learningStyle === "visual" && "👀"}
              {profile.learningStyle === "auditory" && "👂"}
              {profile.learningStyle === "mixed" && "🎨"}
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-foreground capitalize">
                {profile.learningStyle} Learner
              </p>
              <p className="text-sm text-muted-foreground">
                {profile.learningStyle === "kinesthetic" &&
                  "Learns best through movement, touch, and hands-on activities"}
                {profile.learningStyle === "visual" &&
                  "Learns best through images, colors, and visual demonstrations"}
                {profile.learningStyle === "auditory" &&
                  "Learns best through sounds, music, and verbal instructions"}
                {profile.learningStyle === "mixed" &&
                  "Benefits from a combination of learning approaches"}
              </p>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">
              💡 Recommended Activities:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {profile.learningStyle === "kinesthetic" && (
                <>
                  <li>• Act It Out (Charades)</li>
                  <li>• Physical action games</li>
                  <li>• Real-world scavenger hunts</li>
                  <li>• Role-play and pretend play</li>
                </>
              )}
              {profile.learningStyle === "visual" && (
                <>
                  <li>• Picture matching games</li>
                  <li>• Colorful flashcards</li>
                  <li>• Story books with illustrations</li>
                  <li>• Drawing and coloring activities</li>
                </>
              )}
              {profile.learningStyle === "auditory" && (
                <>
                  <li>• Songs and rhymes</li>
                  <li>• Read-aloud stories</li>
                  <li>• Sound matching games</li>
                  <li>• Verbal repetition exercises</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card className="bg-sunny/5 border-2 border-sunny/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Research-Based Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔄</span>
            <div>
              <p className="font-medium text-foreground">
                Conversational Turns
              </p>
              <p className="text-muted-foreground">
                Engage in back-and-forth conversations. Ask {profile.name} to
                respond, not just listen.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">🔁</span>
            <div>
              <p className="font-medium text-foreground">Repeated Exposure</p>
              <p className="text-muted-foreground">
                Use new words in different contexts throughout the day. Aim for
                6-12 meaningful encounters.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">🌍</span>
            <div>
              <p className="font-medium text-foreground">Real-World Context</p>
              <p className="text-muted-foreground">
                Connect words to real objects and experiences during daily
                routines.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">👐</span>
            <div>
              <p className="font-medium text-foreground">
                Multisensory Learning
              </p>
              <p className="text-muted-foreground">
                Combine words with visuals, sounds, gestures, and physical
                actions for better retention.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
