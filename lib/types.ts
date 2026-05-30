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
  pendingActiveVocabApproval?: boolean;
  activeVocabRequestedAt?: Date;
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
  birthYear?: number | null;
  birthMonth?: number | null;
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
  communityEnabled?: boolean;
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
  categoryProgress: {
    category: string;
    progress: number;
    mastered?: number;
    total?: number;
  }[];
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
  generated_at: string;
  generated_by?: string;
  content_cantonese: string;
  content_english?: string;
  jyutping?: string;
  vocab_used?: string;
  story_text: string;
  story_text_ssml: string;
  story_generate_provdier?: string;
  story_generate_model?: string;
  featured_words: string[];
  word_usage?: Record<string, string>;
  audio_url?: string;
  audio_duration_seconds?: number;
  audio_filename: string;
  audio_generate_provider?: string;
  audio_generate_voice_name?: string;
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
  /** AI-generated illustration URLs for each of the 4 story parts */
  part_images?: string[];
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
  daily_screen_time_limit?: number | null;
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

export interface LearningControlStatus {
  childId: string;
  localDate: string;
  todayMinutes: number;
  activeSessionMinutes: number;
  sessionCount: number;
  hasActivityToday: boolean;
  dailyScreenTimeLimit?: number | null;
  screenTimeWarningThreshold: number;
  enableTimeLimits: boolean;
  remainingMinutes?: number | null;
  warningReached: boolean;
  limitReached: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
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

export interface WeeklyDeltaMetric {
  current: number;
  previous: number;
  delta: number;
}

export interface WeeklyDeltaSummary {
  current_week_start_date: string;
  current_week_end_date: string;
  previous_week_start_date: string;
  previous_week_end_date: string;
  words_learned: WeeklyDeltaMetric;
  learning_time: WeeklyDeltaMetric;
  sessions: WeeklyDeltaMetric;
  xp_earned: WeeklyDeltaMetric;
  active_days: WeeklyDeltaMetric;
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
  weekly_delta?: WeeklyDeltaSummary;
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

// ---------------------------------------------------------------------------
// Phase 8 – Advanced AI & Personalization
// ---------------------------------------------------------------------------

export type RelationshipType =
  | "semantic"
  | "category"
  | "phonetic"
  | "contextual"
  | "opposite";

// Epic 8.1 – Knowledge Graph

export interface WordNode {
  word_id: string;
  word: string;
  word_cantonese?: string;
  jyutping?: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  mastered: boolean;
  exposure_count: number;
}

export interface WordEdge {
  source_id: string;
  target_id: string;
  relationship_type: RelationshipType;
  strength: number;
}

export interface WordGraph {
  centre_word_id: string;
  nodes: WordNode[];
  edges: WordEdge[];
}

export interface GraphRecommendation {
  recommended_words: WordNode[];
  reason: string;
  bridge_concepts: string[];
}

// Epic 8.2 – Spaced Repetition (SM-2)

export interface SpacedRepetitionCard {
  id: number;
  child_id: string;
  word_id: string;
  easiness_factor: number;
  interval: number; // days
  repetitions: number;
  last_quality?: number; // 0-5
  next_review: string; // ISO datetime
  last_reviewed?: string;
  is_new: boolean;
  is_graduated: boolean;
  // enriched word fields
  word?: string;
  word_cantonese?: string;
  jyutping?: string;
  image_url?: string;
  audio_url?: string;
  definition_cantonese?: string;
}

export interface ReviewQueue {
  cards: SpacedRepetitionCard[];
  total_due: number;
  new_cards_today: number;
}

export interface ReviewResult {
  word_id: string;
  new_interval: number;
  easiness_factor: number;
  next_review: string;
  is_graduated: boolean;
  message: string;
}

export interface LearningSpeedProfile {
  avg_easiness_factor: number;
  avg_interval: number;
  graduation_rate: number;
  total_cards: number;
  assessment: string;
}

export interface LearningStyleResponse {
  child_id: string;
  learning_style: "visual" | "auditory" | "kinesthetic" | "mixed";
  confidence: number;
  explanation: string;
}

// Epic 8.2.4 – AI Tutor Chat

export interface TutorChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TutorChatResponse {
  answer: string;
  referenced_words: string[];
  safe_mode: boolean;
}
