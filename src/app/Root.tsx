import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { AnimatePresence } from "motion/react";
import { supabase } from "./utils/supabaseClient";
import { syncOAuthUser, persistSession, clearSession } from "./utils/auth";

export function Root() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Recover session on initial load/refresh
    async function recoverSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Failed to get initial session:", error);
          return;
        }

        if (session) {
          // If we have an active session, ensure localStorage has matching tokens
          localStorage.setItem("access_token", session.access_token);
          if (session.refresh_token) {
            localStorage.setItem("refresh_token", session.refresh_token);
          }
          localStorage.setItem("token_expires_at", String(Date.now() + 55 * 60 * 1000));

          // If user details are not in localStorage, sync them from backend
          const storedUser = localStorage.getItem("user");
          if (!storedUser) {
            console.log("Session exists but user details missing, syncing...");
            const appUser = await syncOAuthUser(session.access_token);
            persistSession(session.access_token, session.refresh_token || "", appUser);
          }
        }
      } catch (err) {
        console.error("Error recovering session:", err);
      }
    }

    recoverSession();

    // 2. Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("onAuthStateChange event:", event);

      if (session) {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          localStorage.setItem("access_token", session.access_token);
          if (session.refresh_token) {
            localStorage.setItem("refresh_token", session.refresh_token);
          }
          localStorage.setItem("token_expires_at", String(Date.now() + 55 * 60 * 1000));

          const storedUser = localStorage.getItem("user");
          if (!storedUser) {
            try {
              const appUser = await syncOAuthUser(session.access_token);
              persistSession(session.access_token, session.refresh_token || "", appUser);
            } catch (err) {
              console.error("Failed to sync user on auth state change:", err);
            }
          }
        }
      } else {
        if (event === "SIGNED_OUT") {
          clearSession();
          navigate("/login", { replace: true });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <AnimatePresence mode="wait">
        <Outlet />
      </AnimatePresence>
    </div>
  );
}
