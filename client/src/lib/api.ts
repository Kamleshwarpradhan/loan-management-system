import { ApiResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Centralized API client for all HTTP requests.
 * Automatically attaches JWT token from localStorage.
 * Returns typed ApiResponse for consistent error handling.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== "undefined" ? localStorage.getItem("lms_token") : null;

  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Request failed with status ${response.status}`,
        errors: data.errors,
      };
    }

    return data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Network error. Please try again.";
    return {
      success: false,
      message,
    };
  }
}
