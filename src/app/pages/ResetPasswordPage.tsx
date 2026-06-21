import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import { apiUrl } from "../utils/apiConfig";

export function ResetPasswordPage() {
  const navigate = useNavigate();

  const [accessToken, setAccessToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  // Extract access_token from the URL hash set by Supabase redirect
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));
    const token = params.get("access_token") || "";
    const type = params.get("type") || "";
    if (token && (type === "recovery" || type === "")) {
      setAccessToken(token);
    } else if (!token) {
      setErrorMsg(
        "Invalid or missing reset link. Please request a new password reset."
      );
    }
  }, []);

  // Spotlight cursor refs
  const cursorRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const cursor = cursorRef.current;
    const spotlight = spotlightRef.current;
    if (!cursor || !spotlight) return;

    let cx = -100,
      cy = -100,
      sx = -100,
      sy = -100;
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);

    let raf: number;
    const tick = () => {
      const { x: mx, y: my } = mouseRef.current;
      cx += (mx - cx) * 0.2;
      cy += (my - cy) * 0.2;
      sx += (mx - sx) * 0.05;
      sy += (my - sy) * 0.05;
      cursor.style.left = cx + "px";
      cursor.style.top = cy + "px";
      spotlight.style.setProperty("--x", sx + "px");
      spotlight.style.setProperty("--y", sy + "px");
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!accessToken) {
      setErrorMsg("Invalid reset link. Please request a new password reset.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          new_password: password,
        }),
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setErrorMsg(data.error || "Failed to reset password. Please try again.");
      }
    } catch {
      setIsLoading(false);
      setErrorMsg("Could not connect to server. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f5f5f3] text-black overflow-hidden relative custom-cursor-active"
      style={{ cursor: "none" }}
    >
      <div className="spotlight-overlay" ref={spotlightRef} />
      <div className="custom-cursor" ref={cursorRef} />

      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <main className="relative z-10 min-h-screen flex items-center justify-center p-4 md:py-8 md:px-12">
        <div className="w-full max-w-[480px]">

          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-black/50 hover:text-black transition-colors mb-8 mx-auto"
          >
            <ArrowLeft size={18} />
            <span className="uppercase tracking-wider text-xs">Back to Login</span>
          </button>

          {/* Card */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-black/[0.03] shadow-[0_10px_80px_-20px_rgba(0,0,0,0.08)]">

            {/* Logo */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 bg-black" />
                <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-black/50">
                  Intelligence OS
                </span>
              </div>
              <h1
                className="text-3xl font-black tracking-tight leading-none"
                style={{ fontFamily: "var(--font-display)" }}
              >
                TalentLensAI
              </h1>
            </div>

            {success ? (
              /* Success State */
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-green-500" size={32} />
                </div>
                <h2 className="text-xl font-bold mb-2">Password Updated!</h2>
                <p className="text-sm text-black/50 leading-relaxed">
                  Your password has been reset successfully. Redirecting you to
                  login&hellip;
                </p>
              </div>
            ) : (
              /* Form */
              <>
                <div className="mb-6 text-center">
                  <h2
                    className="text-2xl font-bold mb-1"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Set New Password
                  </h2>
                  <p className="text-xs text-black/50">
                    Enter and confirm your new password below.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-xs">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New password */}
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.15em] ml-1 block mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40"
                        size={16}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        required
                        className="w-full bg-black/[0.04] rounded-xl py-3 pl-12 pr-12 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.15em] ml-1 block mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40"
                        size={16}
                      />
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Repeat your new password"
                        required
                        className="w-full bg-black/[0.04] rounded-xl py-3 pl-12 pr-12 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Password strength hint */}
                  {password && (
                    <div className="flex gap-1 mt-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all"
                          style={{
                            background:
                              password.length >= (i + 1) * 2
                                ? password.length >= 10
                                  ? "#16a34a"
                                  : password.length >= 6
                                  ? "#f59e0b"
                                  : "#ef4444"
                                : "rgba(0,0,0,0.08)",
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    id="reset-password-submit"
                    disabled={isLoading || !accessToken}
                    className="w-full bg-black text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-all text-sm disabled:opacity-60"
                  >
                    {isLoading ? "Updating Password…" : "Update Password"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
