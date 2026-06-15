import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Eye, EyeOff, ArrowLeft, User, Briefcase, Mail, Lock, ChevronRight } from "lucide-react";
import { signInWithGoogle, signInWithGithub } from "../utils/auth";

type Role = "candidate" | "recruiter";

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === "/login";
  const [role, setRole] = useState<Role>("candidate");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch(isLogin ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role,
          firstName: isLogin ? "" : firstName,
          lastName: isLogin ? "" : lastName,
        }),
      });
      const data = await response.json();
      setIsLoading(false);
      if (response.ok) {
        if (isLogin) {
          // Login flow
          localStorage.setItem("user", JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
          }));
          if (data.access_token) {
            localStorage.setItem("access_token", data.access_token);
            // Store expiry 55 minutes from now (tokens expire at 60 min)
            localStorage.setItem("token_expires_at", String(Date.now() + 55 * 60 * 1000));
          }
          if (data.refresh_token) {
            localStorage.setItem("refresh_token", data.refresh_token);
          }
          navigate(data.user.role === "candidate" ? "/candidate/dashboard" : "/recruiter/dashboard");
        } else {
          // Register flow
          if (data.access_token) {
            localStorage.setItem("user", JSON.stringify({
              id: data.user.id,
              email: data.user.email,
              role: data.user.role,
              firstName: data.user.firstName,
              lastName: data.user.lastName,
            }));
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("token_expires_at", String(Date.now() + 55 * 60 * 1000));
            if (data.refresh_token) {
              localStorage.setItem("refresh_token", data.refresh_token);
            }
            navigate(data.user.role === "candidate" ? "/candidate/dashboard" : "/recruiter/dashboard");
          } else {
            // No auto-login session returned (e.g. needs email verification)
            alert("Registration successful! Please sign in with your credentials.");
            navigate("/login");
          }
        }
      } else {
        setErrorMsg(data.error || "Authentication failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Auth request failed:", err);
      setIsLoading(false);
      setErrorMsg("Could not connect to server. Please make sure the backend is running.");
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg("");
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setGoogleLoading(false);
      setErrorMsg(err.message || "Failed to start Google sign-in. Please try again.");
    }
  };

  const handleGithubSignIn = async () => {
    setGithubLoading(true);
    setErrorMsg("");
    try {
      await signInWithGithub();
    } catch (err: any) {
      setGithubLoading(false);
      setErrorMsg(err.message || "Failed to start GitHub sign-in. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary flex-col p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/10 rounded-full" />
        </div>
        <div className="relative z-10">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-16">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to home</span>
          </button>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>TalentAI</span>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            {isLogin ? "Welcome back." : "Start your journey."}
          </h2>
          <p className="text-white/70 text-lg leading-relaxed mb-12">
            {isLogin
              ? "Access your dashboard, manage applications, and see what roles match your profile best."
              : "Create an account to start analyzing your CV, mapping your career trajectory, and landing your dream job."}
          </p>
        </div>
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <p className="text-white text-sm leading-relaxed italic mb-4">
              "This platform revolutionized our hiring. The candidate classification accuracy and hiring chance predictions match our real-world hiring outcomes with incredible precision."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-bold">
                MC
              </div>
              <div>
                <p className="text-white text-xs font-bold">Marcus Chen</p>
                <p className="text-white/60 text-[10px]">Head of Talent at Stripe</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 xl:px-32 py-12 relative">
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 lg:hidden flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Home</span>
        </button>

        <div className="max-w-md w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-black text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              {isLogin ? "Sign in" : "Create account"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => navigate(isLogin ? "/register" : "/login")}
                className="text-primary font-semibold hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Role selector */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-foreground mb-3">
                {isLogin ? "Sign in as a..." : "I am a..."}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "candidate", label: "Candidate", icon: User, desc: "Looking for a job", bg: "bg-[#e9d5ff]", color: "text-primary" },
                  { value: "recruiter", label: "Recruiter", icon: Briefcase, desc: "Hiring talent", bg: "bg-[#bae6fd]", color: "text-sky-600" },
                ] as const).map(({ value, label, icon: Icon, desc, bg, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                      role === value
                        ? "border-primary bg-[#f0f0ff]"
                        : "border-black/[0.08] hover:border-black/20"
                    }`}
                  >
                    <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2`}>
                      <Icon className={`w-4.5 h-4.5 ${color}`} />
                    </div>
                    <p className="font-bold text-sm text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                    {role === value && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <ChevronRight className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">First name</label>
                    <input
                      type="text"
                      placeholder="Sarah"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-muted rounded-xl border border-black/[0.08] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Last name</label>
                    <input
                      type="text"
                      placeholder="Johnson"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-muted rounded-xl border border-black/[0.08] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="sarah@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl border border-black/[0.08] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3 bg-muted rounded-xl border border-black/[0.08] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="text-right">
                  <a href="#" className="text-sm text-primary font-medium hover:underline">Forgot password?</a>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isLogin ? "Signing in..." : "Creating account..."}
                    </motion.div>
                  ) : (
                    <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {isLogin ? "Sign in" : "Create account"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/[0.06]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs font-semibold text-muted-foreground uppercase">Or continue with</span>
              </div>
            </div>

            {/* Google / GitHub */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || githubLoading || isLoading}
                className="flex items-center justify-center gap-2 bg-white border border-black/[0.08] py-3.5 rounded-xl text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#ea4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.13-5.136 4.13A5.785 5.785 0 0 1 8.2 12.78a5.785 5.785 0 0 1 5.79-5.75c1.496 0 2.864.55 3.924 1.455l3.125-3.085C19.16 3.633 16.735 2.63 13.99 2.63c-5.18 0-9.39 4.156-9.39 9.385s4.21 9.385 9.39 9.385c5.388 0 9.074-3.723 9.074-9.075 0-.585-.053-1.164-.153-1.72H12.24Z"/>
                  </svg>
                )}
                {googleLoading ? "Redirecting…" : "Google"}
              </button>
              <button
                type="button"
                onClick={handleGithubSignIn}
                disabled={googleLoading || githubLoading || isLoading}
                className="flex items-center justify-center gap-2 bg-white border border-black/[0.08] py-3.5 rounded-xl text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {githubLoading ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                )}
                {githubLoading ? "Redirecting…" : "GitHub"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
