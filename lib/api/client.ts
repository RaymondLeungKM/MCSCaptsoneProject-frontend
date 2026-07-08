/**
 * API Client Configuration
 * Handles all communication with FastAPI backend with retry logic and error handling
 */

// NEXT_PUBLIC_API_URL is set in .env.local to "/api/v1" so all browser requests
// go through the Next.js Route Handler proxy at app/api/v1/[...path]/route.ts,
// which forwards them server-side to http://localhost:8000 — no CORS needed.
// Falls back to the direct backend URL for server-side rendering or if the env
// var is ever unset.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// API Error class for better error handling
export class APIError extends Error {
  constructor(
    public status: number,
    public detail: string,
    message?: string,
  ) {
    super(message || detail);
    this.name = "APIError";
  }
}

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504], // Timeout, Too Many Requests, Server errors
};

function isRetryableMethod(method?: string): boolean {
  const normalized = (method || "GET").toUpperCase();
  return normalized === "GET" || normalized === "HEAD";
}

/**
 * Get stored auth token
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

/**
 * Set auth token
 */
export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_token", token);
  logDebug("Token stored");
}

/**
 * Clear auth token
 */
export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
  logDebug("Token cleared");
}

/**
 * Simple debug logging
 */
function logDebug(message: string, data?: any): void {
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    console.log(`[API] ${message}`, data || "");
  }
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toFriendlyErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("incorrect email or password")) {
    return "登入電郵或密碼不正確。";
  }

  if (normalized.includes("not a valid email address")) {
    return "請輸入有效的電郵地址（例如：name@example.com）。";
  }

  return message;
}

/**
 * Parse error response from server
 */
async function parseErrorResponse(
  response: Response,
): Promise<{ detail: string; [key: string]: any }> {
  const fallbackDetail = `HTTP ${response.status}: ${response.statusText}`;

  const normalizeDetail = (value: unknown): string => {
    if (typeof value === "string" && value.trim()) {
      return toFriendlyErrorMessage(value);
    }

    if (Array.isArray(value)) {
      const messages = value
        .map((item) => {
          if (typeof item === "string" && item.trim()) return item;
          if (
            item &&
            typeof item === "object" &&
            "msg" in item &&
            typeof item.msg === "string" &&
            item.msg.trim()
          ) {
            return item.msg;
          }
          return null;
        })
        .filter((msg): msg is string => Boolean(msg));

      if (messages.length > 0) {
        return toFriendlyErrorMessage(messages.join(" "));
      }
    }

    if (value && typeof value === "object") {
      if ("message" in value && typeof value.message === "string") {
        return toFriendlyErrorMessage(value.message);
      }
      if ("msg" in value && typeof value.msg === "string") {
        return toFriendlyErrorMessage(value.msg);
      }
    }

    return fallbackDetail;
  };

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    try {
      const data: unknown = await response.json();

      if (data && typeof data === "object" && !Array.isArray(data)) {
        const jsonData = data as Record<string, unknown>;
        return {
          ...jsonData,
          detail: normalizeDetail(jsonData.detail),
        };
      }

      return {
        detail: normalizeDetail(data),
      };
    } catch {
      return { detail: fallbackDetail };
    }
  }
  return { detail: fallbackDetail };
}

/**
 * Make an authenticated API request with retry logic
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const isAuthEndpoint = endpoint.startsWith("/auth/");
  const allowRetry = isRetryableMethod(options.method);
  let lastError: Error | null = null;
  let delayMs = RETRY_CONFIG.initialDelayMs;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      logDebug(
        `Request [${attempt}/${RETRY_CONFIG.maxAttempts}]: ${options.method || "GET"} ${endpoint}`,
      );

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);

        // Handle 401 Unauthorized
        if (response.status === 401) {
          if (!isAuthEndpoint) {
            logDebug("Unauthorized (401) - clearing token");
            clearAuthToken();
            if (typeof window !== "undefined") {
              // Redirect to login only if we're in browser
              const currentPath = window.location.pathname;
              if (
                !currentPath.includes("/login") &&
                !currentPath.includes("/register")
              ) {
                window.location.href = "/login";
              }
            }
            throw new APIError(
              response.status,
              errorData.detail || "Unauthorized",
              "Your session has expired. Please login again.",
            );
          }

          throw new APIError(
            response.status,
            errorData.detail || "Unauthorized",
          );
        }

        // Check if we should retry
        if (
          allowRetry &&
          RETRY_CONFIG.retryableStatuses.includes(response.status) &&
          attempt < RETRY_CONFIG.maxAttempts
        ) {
          logDebug(
            `Retryable error ${response.status} - retrying in ${delayMs}ms`,
          );
          lastError = new APIError(
            response.status,
            errorData.detail || response.statusText,
          );
          await sleep(delayMs);
          delayMs = Math.min(
            delayMs * RETRY_CONFIG.backoffMultiplier,
            RETRY_CONFIG.maxDelayMs,
          );
          continue;
        }

        // Non-retryable error
        throw new APIError(
          response.status,
          errorData.detail || response.statusText,
        );
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        logDebug(`Response successful with empty body: ${endpoint}`);
        return undefined as T;
      }

      const contentType = response.headers.get("content-type") || "";
      const result = contentType.includes("application/json")
        ? JSON.parse(responseText)
        : responseText;

      logDebug(`Response successful: ${endpoint}`);
      return result as T;
    } catch (error) {
      if (error instanceof APIError) {
        lastError = error;
        // Don't retry on 401, 403, 422 (validation)
        if ([401, 403, 422].includes(error.status)) {
          throw error;
        }
        // Retry if attempts remaining
        if (allowRetry && attempt < RETRY_CONFIG.maxAttempts) {
          logDebug(`Retrying... (${attempt}/${RETRY_CONFIG.maxAttempts})`);
          await sleep(delayMs);
          delayMs = Math.min(
            delayMs * RETRY_CONFIG.backoffMultiplier,
            RETRY_CONFIG.maxDelayMs,
          );
          continue;
        }
      } else if (error instanceof TypeError) {
        // Network error
        lastError = new Error(
          "Network error: Unable to reach server. Check your connection.",
        );
        logDebug(`Network error on attempt ${attempt}:`, error.message);
        if (allowRetry && attempt < RETRY_CONFIG.maxAttempts) {
          await sleep(delayMs);
          delayMs = Math.min(
            delayMs * RETRY_CONFIG.backoffMultiplier,
            RETRY_CONFIG.maxDelayMs,
          );
          continue;
        }
      } else {
        lastError = error as Error;
      }
      throw lastError;
    }
  }

  throw (
    lastError || new Error(`Failed after ${RETRY_CONFIG.maxAttempts} attempts`)
  );
}

export { API_BASE_URL };
