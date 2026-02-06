/**
 * Authentication API
 */
import { apiRequest, setAuthToken, clearAuthToken } from "./client";

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
}

/**
 * Register a new user
 */
export async function register(
  data: RegisterRequest,
): Promise<RegisterResponse> {
  const response = await apiRequest<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

  // Store token
  setAuthToken(response.access_token);

  return response;
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

  // Store token
  setAuthToken(response.access_token);

  return response;
}

/**
 * Logout user
 */
export function logout(): void {
  clearAuthToken();
  // Optionally redirect
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<UserResponse> {
  return apiRequest<UserResponse>("/users/me");
}
