/**
 * Parent Dashboard API
 * Analytics, insights, reports, and parental controls
 */
import { apiRequest } from "./client";
import type {
  DashboardSummary,
  AnalyticsCharts,
  LearningInsight,
  WeeklyReport,
  ParentalControl,
} from "../types";

/**
 * Get comprehensive dashboard summary for a child
 */
export async function getDashboardSummary(
  childId: string,
): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>(`/parent-dashboard/${childId}/summary`);
}

/**
 * Get analytics charts data
 */
export async function getAnalyticsCharts(
  childId: string,
  period: "week" | "month" | "all" = "week",
): Promise<AnalyticsCharts> {
  return apiRequest<AnalyticsCharts>(
    `/parent-dashboard/${childId}/charts?period=${period}`,
  );
}

/**
 * Get learning insights for a child
 */
export async function getLearningInsights(
  childId: string,
  options?: {
    includeRead?: boolean;
    includeDismissed?: boolean;
    limit?: number;
  },
): Promise<LearningInsight[]> {
  const params = new URLSearchParams();
  if (options?.includeRead !== undefined) {
    params.append("include_read", String(options.includeRead));
  }
  if (options?.includeDismissed !== undefined) {
    params.append("include_dismissed", String(options.includeDismissed));
  }
  if (options?.limit !== undefined) {
    params.append("limit", String(options.limit));
  }

  const query = params.toString();
  return apiRequest<LearningInsight[]>(
    `/parent-dashboard/${childId}/insights${query ? `?${query}` : ""}`,
  );
}

/**
 * Mark insight as read or dismissed
 */
export async function updateInsight(
  childId: string,
  insightId: string,
  updates: { isRead?: boolean; isDismissed?: boolean },
): Promise<LearningInsight> {
  return apiRequest<LearningInsight>(
    `/parent-dashboard/${childId}/insights/${insightId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        is_read: updates.isRead,
        is_dismissed: updates.isDismissed,
      }),
    },
  );
}

/**
 * Get weekly reports for a child
 */
export async function getWeeklyReports(
  childId: string,
  limit: number = 10,
): Promise<WeeklyReport[]> {
  return apiRequest<WeeklyReport[]>(
    `/parent-dashboard/${childId}/reports?limit=${limit}`,
  );
}

/**
 * Get parental control settings
 */
export async function getParentalControls(
  childId: string,
): Promise<ParentalControl> {
  return apiRequest<ParentalControl>(`/parent-dashboard/${childId}/controls`);
}

/**
 * Update parental control settings
 */
export async function updateParentalControls(
  childId: string,
  settings: Partial<ParentalControl>,
): Promise<ParentalControl> {
  return apiRequest<ParentalControl>(`/parent-dashboard/${childId}/controls`, {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}
