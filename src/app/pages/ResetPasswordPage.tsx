import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

type PageState = "loading" | "ready" | "success" | "error";

export function ResetPasswordPage() {
  const navigate = useNavigate();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Spotlight cursor refs
  const cursorRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const cursor = cursorRef.current;
    const spotlight = spotlightRef.current;
    if (!cursor || !spotlight) return;
    let cx = -100, cy = -100, sx = -100, sy = -100;
    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);
    let raf: number;
    const tick = () => {
      const { x: mx, y: my } = mouseRef.current;
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
      sx += (mx - sx) * 0.05; sy += (my - sy) * 0.05;
      cursor.style.left = cx + "px"; cursor.style.top = cy + "px";
      spotlight.style.setProperty("--x", sx + "px");
      spotlight.style.setProperty("--y", sy + "px");
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  // Listen for Supabase PASSWORD_RECOVERY event
  // When the user clicks the reset link in their email, Supabase redirects to
  // /reset-password#access_token=...&type=recovery
  // The Supabase JS client (detectSessionInUrl: true) automatically reads the hash
  // and fires the PASSWORD_RECOVERY event with an active session.
  useEffect(() => {
    // Give Supabase a moment to process the URL hash
    const timeout = setTimeout(() => {
      // Check if Supabase already picked up a recovery session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setPageState("ready");
        } else {
          setPageState("error");
          setErrorMsg(
            "Link reset tidak valid atau sudah kadaluarsa. Silakan minta link baru."
          );
        }
      });
    }, 800);

    // Also listen for the auth state change event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log("[ResetPasswordPage] auth event:", event);
      if (event === "PASSWORD_RECOVERY") {
        clearTimeout(timeout);
        setPageState("ready");
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 6) {
      setErrorMsg("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Password tidak cocok.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Use Supabase JS client directly — no backend needed
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMsg(error.message || "Gagal memperbarui password. Coba lagi.");
        setIsSubmitting(false);
        return;
      }

      setPageState("success");
      // Sign out so user can log in fresh with new password
      await supabase.auth.signOut();
      // Redirect to login after 3 seconds
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan. Coba lagi.");
      setIsSubmitting(false);
    }
  };

  const strengthLevel = (() => {
    if (!password) return 0;
    if (password.length < 6) return 1;
    if (password.length < 8) return 2;
    if (password.length < 12) return 3;
    return 4;
  })();

  const strengthColor = ["#e5e7eb", "#ef4444", "#f59e0b", "#3b82f6", "#16a34a"][strengthLevel];
  const strengthLabel = ["", "Lemah", "Cukup", "Kuat", "Sangat Kuat"][strengthLevel];

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

            {/* Loading */}
            {pageState === "loading" && (
              <div className="text-center py-8">
                <Loader2 className="animate-spin mx-auto mb-3 text-black/40" size={28} />
                <p className="text-sm text-black/50">Memverifikasi link reset password…</p>
              </div>
            )}

            {/* Error */}
            {pageState === "error" && (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h2 className="text-xl font-bold mb-2">Link Tidak Valid</h2>
                <p className="text-sm text-black/50 leading-relaxed mb-6">{errorMsg}</p>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full bg-black text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all"
                >
                  Kembali ke Login
                </button>
              </div>
            )}

            {/* Success */}
            {pageState === "success" && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-green-500" size={32} />
                </div>
                <h2 className="text-xl font-bold mb-2">Password Berhasil Diubah!</h2>
                <p className="text-sm text-black/50 leading-relaxed">
                  Password kamu sudah diperbarui. Mengarahkan ke halaman login…
                </p>
              </div>
            )}

            {/* Ready — Password Form */}
            {pageState === "ready" && (
              <>
                <div className="mb-6 text-center">
                  <h2
                    className="text-2xl font-bold mb-1"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Set New Password
                  </h2>
                  <p className="text-xs text-black/50">
                    Masukkan dan konfirmasi password baru kamu.
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
                      Password Baru
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={16} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 karakter"
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

                    {/* Strength bar */}
                    {password && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="h-1 flex-1 rounded-full transition-all duration-300"
                              style={{ background: i <= strengthLevel ? strengthColor : "#e5e7eb" }}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] mt-1 ml-1" style={{ color: strengthColor }}>
                          {strengthLabel}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.15em] ml-1 block mb-1.5">
                      Konfirmasi Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={16} />
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Ulangi password baru"
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

                    {/* Match indicator */}
                    {confirm && (
                      <p className={`text-[10px] mt-1 ml-1 ${password === confirm ? "text-green-600" : "text-red-500"}`}>
                        {password === confirm ? "✓ Password cocok" : "✗ Password tidak cocok"}
                      </p>
                    )}
                  </div>

                  <button
                    id="reset-password-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    {isSubmitting ? "Memperbarui…" : "Update Password"}
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
