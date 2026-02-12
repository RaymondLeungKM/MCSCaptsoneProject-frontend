/**
 * Adaptive Learning Engine
 * Personalizes content based on child's progress, learning style, and engagement
 */

import type { Word, ChildProfile, LearningSession } from "./types";

export interface AdaptiveLearningRecommendation {
  nextWords: Word[];
  recommendedActivity: string;
  difficulty: "easy" | "medium" | "hard";
  reason: string;
  estimatedDuration: number; // minutes
}

// --- TRANSLATION HELPERS ---

const getStyleLabel = (style: string) => {
  const map: Record<string, string> = {
    kinesthetic: "動覺型 (Kinesthetic)",
    visual: "視覺型 (Visual)",
    auditory: "聽覺型 (Auditory)",
    mixed: "混合型 (Mixed)",
  };
  return map[style] || style;
};

const getTimeLabel = (time: string) => {
  const map: Record<string, string> = {
    morning: "早上",
    afternoon: "下午",
    evening: "晚上",
  };
  return map[time] || time;
};

const getActivityLabelCN = (activity: string) => {
  const map: Record<string, string> = {
    actions: "動感學習",
    pronunciation: "發音練習",
    matching: "配對遊戲",
    ispy: "找找看 (I Spy)",
    charades: "做動作猜謎",
    story: "故事時間",
    scavenger: "實物尋寶",
  };
  return map[activity] || activity;
};

// --- LOGIC FUNCTIONS ---

/**
 * Determines if a word needs more exposure based on research
 * Research shows children need 6-12 exposures for vocabulary retention
 */
export function needsMoreExposure(word: Word): boolean {
  return word.exposureCount < 6 || (!word.mastered && word.exposureCount < 12);
}

/**
 * Calculates word priority based on multiple factors
 */
export function calculateWordPriority(
  word: Word,
  profile: ChildProfile,
): number {
  let priority = 0;

  // Factor 1: Exposure count (needs repetition)
  if (word.exposureCount < 6) priority += 10;
  else if (word.exposureCount < 12) priority += 5;

  // Factor 2: Interest alignment
  if (profile.interests.includes(word.category)) {
    priority += 8;
  }

  // Factor 3: Not yet mastered
  if (!word.mastered) {
    priority += 7;
  }

  // Factor 4: Difficulty appropriate for level
  const difficultyMap = { easy: 1, medium: 2, hard: 3 };
  const levelDifficulty = Math.min(3, Math.floor(profile.level / 2) + 1);
  if (difficultyMap[word.difficulty] === levelDifficulty) {
    priority += 6;
  }

  // Factor 5: Recent practice (spacing effect)
  if (word.lastPracticed) {
    const daysSince = Math.floor(
      (Date.now() - new Date(word.lastPracticed).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysSince >= 3 && daysSince <= 7) {
      priority += 5; // Optimal spacing
    }
  } else {
    priority += 4; // Never practiced
  }

  return priority;
}

/**
 * Selects the next words to learn based on adaptive learning principles
 */
export function selectNextWords(
  allWords: Word[],
  profile: ChildProfile,
  count: number = 5,
): Word[] {
  // Score all words
  const scoredWords = allWords.map((word) => ({
    word,
    priority: calculateWordPriority(word, profile),
  }));

  // Sort by priority (highest first)
  scoredWords.sort((a, b) => b.priority - a.priority);

  // Mix of high-priority words with some variety
  const selected: Word[] = [];
  const highPriority = scoredWords.slice(0, Math.ceil(count * 0.7));
  const variety = scoredWords.slice(Math.ceil(count * 0.7), count * 2);

  // Add high priority words
  selected.push(...highPriority.map((s) => s.word));

  // Add variety to prevent boredom
  if (selected.length < count) {
    const remaining = count - selected.length;
    const randomVariety = variety
      .sort(() => Math.random() - 0.5)
      .slice(0, remaining)
      .map((s) => s.word);
    selected.push(...randomVariety);
  }

  return selected.slice(0, count);
}

/**
 * Recommends the best activity type based on learning style and time
 */
export function recommendActivity(
  profile: ChildProfile,
  availableMinutes: number,
): AdaptiveLearningRecommendation["recommendedActivity"] {
  const { learningStyle, attentionSpan } = profile;

  // Short session (< 10 minutes)
  if (availableMinutes < 10 || attentionSpan < 10) {
    if (learningStyle === "kinesthetic") return "actions";
    if (learningStyle === "auditory") return "pronunciation";
    if (learningStyle === "visual") return "matching";
    return "ispy";
  }

  // Medium session (10-20 minutes)
  if (availableMinutes < 20 || attentionSpan < 20) {
    if (learningStyle === "kinesthetic") return "charades";
    if (learningStyle === "auditory") return "story";
    return "scavenger";
  }

  // Long session (20+ minutes)
  if (learningStyle === "kinesthetic") return "scavenger";
  return "story";
}

/**
 * Main adaptive learning recommendation function
 */
export function getAdaptiveLearningRecommendation(
  allWords: Word[],
  profile: ChildProfile,
  availableMinutes: number = 15,
): AdaptiveLearningRecommendation {
  const nextWords = selectNextWords(allWords, profile, 5);
  const recommendedActivity = recommendActivity(profile, availableMinutes);

  // Determine difficulty based on selected words
  const avgExposure =
    nextWords.reduce((sum, w) => sum + w.exposureCount, 0) / nextWords.length;
  const difficulty: "easy" | "medium" | "hard" =
    avgExposure < 3 ? "easy" : avgExposure < 8 ? "medium" : "hard";

  // Generate reason (Translated to Chinese)
  const needingExposure = nextWords.filter((w) => w.exposureCount < 6).length;
  const interestMatch = nextWords.filter((w) =>
    profile.interests.includes(w.category),
  ).length;

  let reason = `根據 ${profile.name} 的學習需要而設。`;
  
  if (needingExposure > 0) {
    reason += `當中有 ${needingExposure} 個詞彙需要加強練習。`;
  }
  if (interestMatch > 0) {
    reason += `選了 ${interestMatch} 個符合興趣的詞彙。`;
  }
  
  reason += `推薦活動：${getActivityLabelCN(recommendedActivity)} (最適合 ${getStyleLabel(profile.learningStyle)} 學習風格)。`;

  // Estimate duration
  const estimatedDuration = Math.min(
    availableMinutes,
    profile.attentionSpan || 15,
  );

  return {
    nextWords,
    recommendedActivity,
    difficulty,
    reason,
    estimatedDuration,
  };
}

/**
 * Analyzes learning session to track active vs passive vocabulary
 */
export function analyzeSession(session: LearningSession): {
  activeWords: string[];
  passiveWords: string[];
  engagementScore: number;
} {
  const activeWords = session.wordsUsedActively;
  const passiveWords = session.wordsEncountered.filter(
    (w) => !activeWords.includes(w),
  );

  // Engagement score (0-100)
  const activeRatio =
    activeWords.length / Math.max(1, session.wordsEncountered.length);
  const durationBonus = Math.min(session.duration / 15, 1); // Ideal is 15 min
  const engagementLevelBonus =
    session.engagementLevel === "high"
      ? 1
      : session.engagementLevel === "medium"
        ? 0.7
        : 0.4;

  const engagementScore = Math.round(
    activeRatio * 40 + durationBonus * 30 + engagementLevelBonus * 30,
  );

  return {
    activeWords,
    passiveWords,
    engagementScore,
  };
}

/**
 * Determines if child is ready to move to next difficulty level
 */
export function shouldLevelUp(
  profile: ChildProfile,
  recentSessions: LearningSession[],
): boolean {
  if (recentSessions.length < 5) return false;

  // Check last 5 sessions
  const last5 = recentSessions.slice(-5);

  // Average engagement should be medium or high
  const avgEngagement = last5.filter(
    (s) => s.engagementLevel === "medium" || s.engagementLevel === "high",
  ).length;

  // At least 4 out of 5 sessions with good engagement
  return avgEngagement >= 4;
}

/**
 * Generates personalized learning insights for parents
 * (Translated to Traditional Chinese)
 */
export function generateParentInsights(
  profile: ChildProfile,
  allWords: Word[],
  recentSessions: LearningSession[],
): string[] {
  const insights: string[] = [];

  // Vocabulary growth
  const activeVocab = allWords.filter((w) => w.mastered).length;
  insights.push(
    `${profile.name} 已經自信地掌握了 ${activeVocab} 個詞彙！這佔了課程的 ${Math.round((activeVocab / allWords.length) * 100)}%。`,
  );

  // Learning style match
  const styleAction = profile.learningStyle === "kinesthetic" ? "加入更多肢體動作和動手做的體驗" : "使用更多配合學習風格的教材";
  insights.push(
    `${profile.name} 透過「${getStyleLabel(profile.learningStyle)}」活動學習效果最好。試著${styleAction}！`,
  );

  // Exposure tracking
  const needingMore = allWords.filter((w) => w.exposureCount < 6).length;
  if (needingMore > 0) {
    insights.push(
      `有 ${needingMore} 個詞彙需要更多重複練習。記住，通常需要 6-12 次接觸才能形成長期記憶！`,
    );
  }

  // Engagement trend
  if (recentSessions.length >= 3) {
    const avgEngagement =
      recentSessions.slice(-3).reduce((sum, s) => {
        const score =
          s.engagementLevel === "high"
            ? 3
            : s.engagementLevel === "medium"
              ? 2
              : 1;
        return sum + score;
      }, 0) / 3;

    if (avgEngagement >= 2.5) {
      insights.push(
        `上一次的學習表現非常棒！${profile.name} 非常投入，這是一個很好的鼓勵機會。`,
      );
    } else if (avgEngagement < 1.5) {
      insights.push(
        `試著縮短學習時間或加入更多動感活動來提升專注力。`,
      );
    }
  }

  // Best time recommendation
  if (profile.preferredTimeOfDay) {
    insights.push(
      `${profile.name} 在${getTimeLabel(profile.preferredTimeOfDay)}時專注力最好。試著安排在那段時間進行學習！`,
    );
  }

  return insights;
}