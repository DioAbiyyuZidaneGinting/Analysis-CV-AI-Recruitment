/**
 * Shared auth utility for recruiter pages.
 * Handles token refresh automatically before API calls.
 */

/** Get current Authorization header with the stored JWT */
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Attempt to refresh the Supabase access token using the stored refresh_token.
 * Returns true if refresh succeeded, false otherwise.
 */
export async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return false;

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem(
        "token_expires_at",
        String(Date.now() + 55 * 60 * 1000)
      );
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Check if the stored token is expired (or will expire in the next 60 seconds).
 */
export function isTokenExpired(): boolean {
  const expiresAt = localStorage.getItem("token_expires_at");
  if (!expiresAt) return false; // assume OK if we don't know
  return Date.now() > Number(expiresAt) - 60_000;
}

/**
 * Make an authenticated fetch request.
 * Automatically refreshes the token if it's expired.
 * If still unauthorized after refresh, redirects to /login.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // If token is expired, try refreshing before the request
  if (isTokenExpired()) {
    const refreshed = await tryRefreshToken();
    if (!refreshed) {
      // Can't refresh — clear session and redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("token_expires_at");
      window.location.href = "/login";
      return new Response(null, { status: 401 });
    }
  }

  const headers = {
    ...(options.headers || {}),
    ...getAuthHeaders(),
  };

  const response = await fetch(url, { ...options, headers });

  // If still 401 after refresh attempt, token is truly invalid → re-login
  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry once with new token
      return fetch(url, { ...options, headers: { ...(options.headers || {}), ...getAuthHeaders() } });
    }
    // Give up — redirect to login
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expires_at");
    window.location.href = "/login";
  }

  return response;
}
