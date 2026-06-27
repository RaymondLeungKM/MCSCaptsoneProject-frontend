import { apiRequest } from "./client";

export type FoundationRowCounts = {
  analytics_event_log: number;
  child_day_analytics: number;
  mission_outcome_analytics: number;
  content_performance_analytics: number;
};

export type FoundationCoverage = {
  total_children: number;
  children_with_aggregate_rows: number;
  coverage_ratio: number;
};

export type EventTypeCount = {
  event_type: string;
  count: number;
};

export type DailyEventCount = {
  day: string;
  count: number;
};

export type SuppressionInfo = {
  is_suppressed: boolean;
  reason: string | null;
  minimum_cohort_threshold: number;
};

export type CohortPrivacyDiagnostic = {
  age_band: string;
  cohort_size: number;
  allowed: boolean;
  suppression: SuppressionInfo;
};

export type AnalyticsFoundationHealthResponse = {
  window_days: number;
  start_day: string;
  end_day: string;
  row_counts: FoundationRowCounts;
  coverage: FoundationCoverage;
  daily_event_counts: DailyEventCount[];
  event_type_counts: EventTypeCount[];
  cohort_diagnostics: CohortPrivacyDiagnostic[];
};

export async function getAnalyticsFoundationHealth(
  days = 28,
  minimumCohortThreshold = 25,
): Promise<AnalyticsFoundationHealthResponse> {
  return apiRequest<AnalyticsFoundationHealthResponse>(
    `/admin/analytics/foundation/health?days=${days}&minimum_cohort_threshold=${minimumCohortThreshold}`,
  );
}

export type ParticipationTrendPoint = {
  day: string;
  dau: number;
  wau: number;
  avg_active_days_7d: number;
  return_rate_7d: number;
};

export type ParticipationSummary = {
  start_day: string;
  end_day: string;
  window_days: number;
  total_active_children: number;
  average_dau: number;
  average_wau: number;
  average_return_rate_7d: number;
};

export type ParticipationTrendsResponse = {
  summary: ParticipationSummary;
  points: ParticipationTrendPoint[];
};

export type FunnelMetrics = {
  assigned: number;
  started: number;
  completed: number;
  skipped: number;
  expired: number;
  start_rate: number;
  completion_rate: number;
  completion_from_started_rate: number;
};

export type FunnelSegment = {
  key: string;
  label: string;
  metrics: FunnelMetrics;
};

export type MissionFunnelResponse = {
  start_day: string;
  end_day: string;
  age_band: string | null;
  context: string | null;
  source: string | null;
  overall: FunnelMetrics;
  by_context: FunnelSegment[];
  by_source: FunnelSegment[];
  by_age_band: FunnelSegment[];
};

export type EngagementTrendPoint = {
  day: string;
  avg_session_minutes: number;
  avg_engagement_score: number;
  active_children: number;
};

export type EngagementDistribution = {
  low: number;
  medium: number;
  high: number;
};

export type EngagementSummary = {
  start_day: string;
  end_day: string;
  window_days: number;
  average_session_minutes: number;
  average_engagement_score: number;
  average_active_days_28d: number;
  high_engagement_ratio: number;
};

export type EngagementRawInputs = {
  session_events_count: number;
  average_interactions_per_minute: number;
  average_interactions_per_session: number;
  average_activities_per_session: number;
  average_words_encountered_per_session: number;
  average_words_used_actively_per_session: number;
  average_active_word_usage_ratio: number;
  average_usage_minutes_per_day: number;
  average_usage_minutes_per_week: number;
  average_words_learned_per_day: number;
  mission_completion_rate: number;
  mission_median_completion_minutes: number;
  average_game_minutes_per_day: number;
  average_due_revision_cards_per_active_child: number;
  overdue_revision_ratio: number;
  average_photo_captures_per_day_proxy: number;
  story_reads_per_week: number;
  story_completion_rate: number;
  shared_photo_posts_per_week: number;
  average_reactions_per_shared_photo: number;
  private_challenges_initiated_per_week: number;
  public_challenge_participations_per_week: number;
};

export type EngagementTrendsResponse = {
  summary: EngagementSummary;
  raw_inputs: EngagementRawInputs;
  distribution: EngagementDistribution;
  points: EngagementTrendPoint[];
};

export type ContentPerformanceRow = {
  content_type: string;
  content_id: string;
  category_id: string | null;
  exposure_count: number;
  completion_count: number;
  success_count: number;
  completion_rate: number;
  success_rate: number;
  avg_mastery_delta: number;
  avg_retention_proxy_score: number;
  effectiveness_score: number;
  confidence_signal: string;
};

export type ContentPerformanceSummary = {
  start_day: string;
  end_day: string;
  window_days: number;
  evaluated_items: number;
  average_effectiveness_score: number;
};

export type ContentPerformanceResponse = {
  summary: ContentPerformanceSummary;
  top_content: ContentPerformanceRow[];
  underperforming_content: ContentPerformanceRow[];
};

export type AdminAnalyticsFilters = {
  from: string;
  to: string;
  ageBand?: string;
  context?: string;
  source?: string;
  category?: string;
  contentType?: string;
  topN?: number;
};

function buildQuery(
  filters: Record<string, string | number | undefined>,
): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export async function getParticipationTrends(
  filters: AdminAnalyticsFilters,
): Promise<ParticipationTrendsResponse> {
  const query = buildQuery({
    from: filters.from,
    to: filters.to,
    age_band: filters.ageBand,
  });
  return apiRequest<ParticipationTrendsResponse>(
    `/admin/analytics/participation?${query}`,
  );
}

export async function getMissionFunnel(
  filters: AdminAnalyticsFilters,
): Promise<MissionFunnelResponse> {
  const query = buildQuery({
    from: filters.from,
    to: filters.to,
    age_band: filters.ageBand,
    context: filters.context,
    source: filters.source,
  });
  return apiRequest<MissionFunnelResponse>(
    `/admin/analytics/missions/funnel?${query}`,
  );
}

export async function getEngagementTrends(
  filters: AdminAnalyticsFilters,
): Promise<EngagementTrendsResponse> {
  const query = buildQuery({
    from: filters.from,
    to: filters.to,
    age_band: filters.ageBand,
  });
  return apiRequest<EngagementTrendsResponse>(
    `/admin/analytics/engagement?${query}`,
  );
}

export async function getContentPerformance(
  filters: AdminAnalyticsFilters,
): Promise<ContentPerformanceResponse> {
  const query = buildQuery({
    from: filters.from,
    to: filters.to,
    age_band: filters.ageBand,
    category: filters.category,
    content_type: filters.contentType,
    top_n: filters.topN,
  });
  return apiRequest<ContentPerformanceResponse>(
    `/admin/analytics/content-performance?${query}`,
  );
}
