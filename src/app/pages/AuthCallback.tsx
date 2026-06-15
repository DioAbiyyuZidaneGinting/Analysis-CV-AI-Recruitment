/**
 * /auth/callback
 *
 * This page is where Supabase redirects after Google OAuth completes.
 * Supabase appends the session tokens as a URL fragment (#access_token=...),
 * or stores them automatically in localStorage via detectSessionInUrl=true.
 *
 * Flow:
 *  1. supabase.auth.getSession() reads the fragment and returns the session
 *  2. Call backend /api/auth/sync-oauth-user to upsert the user in our DB
 *  3. Persist tokens + user in localStorage
 *  4. Redirect to the correct portal based on role
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import { syncOAuthUser, persistSession, clearSession, getDashboardPath } from "../utils/auth";

type Stage = "loading" | "syncing" | "error";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        // ── Step 1: Let Supabase consume the URL fragment / PKCE code ──────
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (cancelled) return;

        if (sessionError) {
          throw new Error(sessionError.message);
        }

        // Check for OAuth error params in URL (e.g. user cancelled)
        const urlParams = new URLSearchParams(window.location.search);
        const oauthError = urlParams.get("error");
        const oauthErrorDesc = urlParams.get("error_description");
        if (oauthError) {
          throw new Error(oauthErrorDesc || oauthError);
        }

        if (!sessionData.session) {
          // No session in fragment — try once more with a short delay
          // (Supabase PKCE code exchange can be async)
          await new Promise((r) => setTimeout(r, 1200));
          const retry = await supabase.auth.getSession();
          if (!retry.data.session) {
            throw new Error(
              "No session returned from the provider. The login may have been cancelled or timed out."
            );
          }
          Object.assign(sessionData, retry.data);
        }

        const session = sessionData.session!;

        // ── Step 2: Sync user to our users table ─────────────────────────
        setStage("syncing");
        const appUser = await syncOAuthUser(session.access_token);

        if (cancelled) return;

        // ── Step 3: Persist to localStorage ──────────────────────────────
        persistSession(session.access_token, session.refresh_token, appUser);

        // ── Step 4: Role-based redirect ───────────────────────────────────
        navigate(getDashboardPath(appUser.role), { replace: true });
      } catch (err: any) {
        if (cancelled) return;
        console.error("[AuthCallback] Error:", err);
        clearSession();
        setErrorMsg(
          err.message ||
          "Something went wrong during sign-in. Please try again."
        );
        setStage("error");
      }
    }

    handleCallback();
    return () => { cancelled = true; };
  }, [navigate]);

  // ── UI ──────────────────────────────────────────────────────────────────────

  if (stage === "error") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-5 max-w-sm"
        >
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-black text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Sign-in failed
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{errorMsg}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            Back to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Animated logo */}
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/25"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>

        <div>
          <h1 className="text-xl font-black text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            {stage === "loading" ? "Completing sign-in…" : "Setting up your account…"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {stage === "loading"
              ? "Verifying your account"
              : "Syncing your profile — almost there"}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
