/**
 * Authentication service for handling login, logout, and token management
 */

const API_BASE_URL = "http://localhost:3001/api";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    username: string;
    role: string;
  };
}

interface RefreshResponse {
  accessToken: string;
}

/**
 * Login with username and password
 */
export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  return response.json();
}

/**
 * Logout and invalidate refresh token
 */
export async function logout(refreshToken: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (error) {
    console.error("Logout error:", error);
  }

  // Clear local storage regardless of API result
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("username");
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Token refresh failed");
  }

  const data: RefreshResponse = await response.json();
  return data.accessToken;
}

/**
 * Get current user info
 */
export async function getCurrentUser(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get user info");
  }

  return response.json();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  return !!(accessToken && refreshToken);
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem("accessToken");
}

/**
 * Get stored refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

/**
 * Get stored username
 */
export function getUsername(): string | null {
  return localStorage.getItem("username");
}

/**
 * Make authenticated API request with automatic token refresh
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("Not authenticated");
  }

  // First attempt with current access token
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // If token expired, try to refresh
  if (response.status === 401) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error("Not authenticated");
    }

    try {
      // Refresh the token
      const newAccessToken = await refreshAccessToken(refreshToken);
      localStorage.setItem("accessToken", newAccessToken);

      // Retry the request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newAccessToken}`,
        },
      });
    } catch (error) {
      // Refresh failed, clear auth and throw error
      await logout(refreshToken);
      throw new Error("Session expired. Please login again.");
    }
  }

  return response;
}
