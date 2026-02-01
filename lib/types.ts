export interface Word {
  id: string;
  word: string; // English word
  word_cantonese?: string; // Traditional Chinese
  jyutping?: string; // Cantonese romanization
  image: string;
  category: string;
  categoryName?: string;
  category_name_cantonese?: string;
  pronunciation: string; // English pronunciation
  definition: string; // English definition
  definition_cantonese?: string; // Cantonese definition
  example: string; // English example
  example_cantonese?: string; // Cantonese example
  difficulty: "easy" | "medium" | "hard";
  mastered: boolean;
  exposureCount: number;
  lastPracticed?: Date;
  // New fields for enhanced learning
  physicalAction?: string; // e.g., "Flap your arms like wings"
  contexts: string[]; // Different contexts where word appears
  relatedWords: string[]; // For building connections
  audio_url?: string; // Cantonese audio URL
  audio_url_english?: string; // English audio URL
}

export interface Category {
  id: string;
  name: string;
  name_cantonese?: string;
  icon: string;
  color: string;
  wordCount: number;
  description?: string;
  description_cantonese?: string;
}

export type LanguagePreference = "cantonese" | "english" | "bilingual";

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
  languagePreference?: LanguagePreference;
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

// Bedtime Story Types
export interface DailyWordSummary {
  word_id: string;
  word: string;
  word_cantonese: string;
  jyutping: string;
  definition_cantonese: string;
  example_cantonese: string;
  category: string;
  exposure_count: number;
  used_actively: boolean;
  mastery_confidence: number;
  story_priority: number;
}

export interface GeneratedStory {
  id: string;
  child_id: string;
  title: string;
  title_english?: string;
  theme?: string;
  generation_date: string;
  content_cantonese: string;
  content_english?: string;
  jyutping?: string;
  featured_words: string[];
  word_usage?: Record<string, string>;
  audio_url?: string;
  audio_duration_seconds?: number;
  reading_time_minutes: number;
  word_count?: number;
  difficulty_level: string;
  cultural_references?: string[];
  read_count: number;
  is_favorite: boolean;
  parent_approved: boolean;
  ai_model?: string;
  created_at: string;
  updated_at?: string;
}

export interface StoryGenerationRequest {
  child_id: string;
  theme?:
    | "adventure"
    | "family"
    | "animals"
    | "nature"
    | "friendship"
    | "bedtime";
  date?: string;
  word_count_target?: number;
  reading_time_minutes?: number;
  include_english?: boolean;
  include_jyutping?: boolean;
}

export interface StoryGenerationResponse {
  story: GeneratedStory;
  words_used: DailyWordSummary[];
  generation_time_seconds: number;
  success: boolean;
  message?: string;
}

// Parent Analytics Types
export interface DailyLearningStats {
  id: string;
  child_id: string;
  date: string;
  words_learned: number;
  words_reviewed: number;
  new_words_mastered: number;
  total_learning_time: number; // minutes
  active_learning_time: number; // minutes
  session_count: number;
  categories_studied: Record<string, number>;
  games_played: number;
  games_completed: number;
  stories_read: number;
  bedtime_stories_generated: number;
  xp_earned: number;
  average_accuracy: number;
}

export interface LearningInsight {
  id: string;
  child_id: string;
  insight_type: "strength" | "weakness" | "recommendation" | "milestone";
  priority: "high" | "medium" | "low";
  category?: string;
  title: string;
  description: string;
  action_items: string[];
  data: Record<string, any>;
  is_read: boolean;
  is_dismissed: boolean;
  generated_at: string;
  valid_until?: string;
}

export interface WeeklyReport {
  id: string;
  child_id: string;
  week_start_date: string;
  week_end_date: string;
  total_words_learned: number;
  total_learning_time: number;
  total_sessions: number;
  days_active: number;
  milestones_reached: string[];
  new_badges_earned: string[];
  top_categories: Array<{ category: string; words: number }>;
  strengths: string[];
  areas_to_improve: string[];
  recommendations: string[];
  growth_percentage: number;
  is_sent: boolean;
  sent_at?: string;
}

export interface ParentalControl {
  id: string;
  child_id: string;
  enabled_categories: string[];
  disabled_categories: string[];
  max_difficulty: "easy" | "medium" | "hard";
  min_difficulty: "easy" | "medium" | "hard";
  daily_screen_time_limit?: number;
  screen_time_warning_threshold: number;
  tts_voice: string;
  tts_speech_rate: number;
  enable_bilingual_mode: boolean;
  show_jyutping: boolean;
  game_difficulty_multiplier: number;
  enable_time_limits: boolean;
  safe_mode_enabled: boolean;
  require_parent_unlock: boolean;
  daily_reminder_enabled: boolean;
  daily_reminder_time: string;
  bedtime_story_reminder: boolean;
  weekly_report_enabled: boolean;
  achievement_notifications: boolean;
}

export interface CategoryProgress {
  category_id: string;
  category_name: string;
  category_name_cantonese: string;
  words_learned: number;
  total_words: number;
  progress_percentage: number;
  recent_activity: number;
}

export interface DashboardSummary {
  child_id: string;
  child_name: string;
  total_words_learned: number;
  current_streak: number;
  level: number;
  xp: number;
  weekly_learning_time: number;
  weekly_sessions: number;
  weekly_words_learned: number;
  weekly_xp_earned: number;
  category_progress: CategoryProgress[];
  recent_insights: LearningInsight[];
  latest_report?: WeeklyReport;
  parental_control?: ParentalControl;
}

export interface LearningTimeSeriesData {
  dates: string[];
  words_learned: number[];
  learning_time: number[];
  xp_earned: number[];
  accuracy: number[];
}

export interface AnalyticsCharts {
  child_id: string;
  period: "week" | "month" | "all";
  time_series: LearningTimeSeriesData;
  category_breakdown: Record<string, number>;
  learning_style_distribution: Record<string, number>;
  best_time_of_day: string;
  average_session_length: number;
}
