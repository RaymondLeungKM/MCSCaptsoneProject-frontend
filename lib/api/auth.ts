/**
 * Authentication API
 * Handles login, register, and user management
 */
import { apiRequest, setAuthToken, clearAuthToken, APIError } from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
}

export interface RegisterResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  consent_given: boolean;
  consent_given_at?: string;
}

/**
 * Register a new parent user
 */
export async function register(
  data: RegisterRequest,
): Promise<RegisterResponse> {
  if (!data.email || !data.full_name || !data.password) {
    throw new Error("Email, full name, and password are required");
  }

  const response = await apiRequest<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

  // Store token
  setAuthToken(response.access_token);

  return response;
}

/**
 * Login user with email and password
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  if (!data.email || !data.password) {
    throw new Error("Email and password are required");
  }

  const response = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

  // Store token
  setAuthToken(response.access_token);

  return response;
}

/**
 * Logout user and clear session
 */
export function logout(): void {
  clearAuthToken();
  // Redirect to login
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

/**
 * Get current user profile
 * Requires valid auth token
 */
export async function getCurrentUser(): Promise<UserResponse> {
  return apiRequest<UserResponse>("/users/me");
}
