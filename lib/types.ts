export interface Word {
  id: string;
  word: string;
  image: string;
  category: string;
  categoryName?: string;
  pronunciation: string;
  definition: string;
  example: string;
  difficulty: "easy" | "medium" | "hard";
  mastered: boolean;
  exposureCount: number;
  lastPracticed?: Date;
  // New fields for enhanced learning
  physicalAction?: string; // e.g., "Flap your arms like wings"
  contexts: string[]; // Different contexts where word appears
  relatedWords: string[]; // For building connections
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  wordCount: number;
}

export interface ChildProfile {
  id: string;
  name: string;
  avatar: string;
  age: number;
  level: number;
  xp: number;
  wordsLearned: number;
  currentStreak: number;
  interests: string[];
  dailyGoal: number;
  todayProgress: number;
  // New fields for adaptive learning
  learningStyle: "visual" | "auditory" | "kinesthetic" | "mixed";
  attentionSpan: number; // in minutes
  preferredTimeOfDay: "morning" | "afternoon" | "evening";
}

export interface DialogicPrompt {
  id: string;
  type: "open-ended" | "recall" | "prediction" | "connection";
  question: string;
  targetWords: string[];
  acceptableResponses?: string[];
}

export interface StoryPage {
  id: string;
  text: string;
  highlightedWords: string[];
  emoji: string;
  // New fields for dialogic reading
  dialogicPrompts?: DialogicPrompt[];
  physicalAction?: string; // Optional gesture to perform
}

export interface Story {
  id: string;
  title: string;
  cover: string;
  words: Word[];
  pages: StoryPage[];
  duration: string;
  completed: boolean;
  // New fields
  comprehensionQuestions?: DialogicPrompt[];
  repeatCount: number; // Track how many times read
}

export interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  type:
    | "matching"
    | "ispy"
    | "spelling"
    | "pronunciation"
    | "charades"
    | "actions"
    | "scavenger";
  // New fields
  physicalActivity: boolean; // Requires movement
  multiSensory: boolean; // Uses multiple senses
  parentParticipation: boolean; // Encourages parent involvement
}

export interface OfflineMission {
  id: string;
  title: string;
  description: string;
  targetWords: string[];
  context:
    | "mealtime"
    | "bedtime"
    | "playtime"
    | "outdoor"
    | "shopping"
    | "general";
  completed: boolean;
  completedDate?: Date;
  parentNotes?: string;
  // Conversation starters for parents
  conversationPrompts: string[];
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  targetWord: string;
  completed: boolean;
  context: string;
}

export interface LearningSession {
  id: string;
  childId: string;
  date: Date;
  duration: number; // minutes
  wordsEncountered: string[];
  wordsUsedActively: string[]; // Words child spoke/acted out
  engagementLevel: "low" | "medium" | "high";
  activitiesCompleted: string[];
}

export interface ProgressStats {
  totalWords: number;
  masteredWords: number;
  weeklyProgress: number[];
  streakDays: number;
  categoryProgress: { category: string; progress: number }[];
  // New analytics
  averageExposuresPerWord: number;
  activeVocabulary: number; // Words used in output
  passiveVocabulary: number; // Words only recognized
  multiSensoryEngagement: number; // Percentage
}
