/**
 * API Base URL configuration.
 *
 * In development, Vite proxies /api → http://127.0.0.1:5000 (see vite.config.ts).
 * In production (Vercel), there is NO proxy, so we must use the full Railway URL.
 *
 * Set VITE_API_URL in your .env (local) and in Vercel Environment Variables (production):
 *   VITE_API_URL=https://web-production-4f4a0.up.railway.app
 *
 * If VITE_API_URL is not set (e.g. local dev without it), falls back to empty string
 * so that the Vite proxy still handles /api/* correctly.
 */
const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string) ||
  (isLocal ? "" : "https://web-production-4f4a0.up.railway.app");

/**
 * Build a full API URL.
 * Usage:  apiUrl("/api/auth/login")  →  "https://web-production-4f4a0.up.railway.app/api/auth/login"
 */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
