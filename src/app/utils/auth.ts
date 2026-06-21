/**
 * Shared auth utilities for Google OAuth + Supabase session management.
 *
 * All localStorage keys used here:
 *   access_token      - Supabase JWT access token
 *   refresh_token     - Supabase refresh token
 *   token_expires_at  - Epoch ms when access_token expires (55-min window)
 *   user              - JSON { id, email, role, firstName, lastName }
 */

import { supabase } from "./supabaseClient";
import { apiUrl } from "./apiConfig";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  email: string;
  role: "candidate" | "recruiter";
  firstName: string;
  lastName: string;
}

// ─── Token helpers ─────────────────────────────────────────────────────────────

/** Persist a Supabase session into localStorage (same keys used by authFetch.ts) */
export function persistSession(
  accessToken: string,
  refreshToken: string,
  user: AppUser
): void {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
  localStorage.setItem("token_expires_at", String(Date.now() + 55 * 60 * 1000));
  localStorage.setItem("user", JSON.stringify(user));
}

/** Clear all session data from localStorage */
export function clearSession(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token_expires_at");
  localStorage.removeItem("user");
}

/** Get the stored AppUser or null */
export function getStoredUser(): AppUser | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Google & GitHub OAuth ──────────────────────────────────────────────────────

/**
 * Initiates the Google OAuth flow via Supabase.
 * The browser is redirected to Google, then back to /auth/callback.
 */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        prompt: "select_account",
      },
    },
  });
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Initiates the GitHub OAuth flow via Supabase.
 * The browser is redirected to GitHub, then back to /auth/callback.
 */
export async function signInWithGithub(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) {
    throw new Error(error.message);
  }
}

// ─── User synchronisation ──────────────────────────────────────────────────────

/**
 * After a successful OAuth login, sync the Google user to our `users` table.
 * - If the email already exists → reuse that record (never duplicate)
 * - If new → create with role=candidate, auth_provider=google
 *
 * Returns the AppUser record from our DB, or throws on error.
 */
export async function syncOAuthUser(accessToken: string): Promise<AppUser> {
  const res = await fetch(apiUrl("/api/auth/sync-oauth-user"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Sync failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.user as AppUser;
}

// ─── Full sign-out ─────────────────────────────────────────────────────────────

/**
 * Signs out from Supabase AND clears all local session data.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut().catch(() => {});
  clearSession();
}

// ─── Role-based redirect helper ───────────────────────────────────────────────

export function getDashboardPath(role: string): string {
  return role === "recruiter" ? "/recruiter/dashboard" : "/candidate/dashboard";
}
