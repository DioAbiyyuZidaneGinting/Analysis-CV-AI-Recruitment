import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Briefcase,
  CheckCircle,
  X,
} from "lucide-react";

import { signInWithGoogle, signInWithGithub } from "../utils/auth";
import { apiUrl } from "../utils/apiConfig";

type Role = "candidate" | "recruiter";

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const isLogin = location.pathname === "/login";

  const [role, setRole] = useState<Role>(
    isLogin ? "recruiter" : "recruiter"
  );

  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [errorMsg, setErrorMsg] = useState("");

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const cursorRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -100, y: -100 });

  // Cursor + Spotlight
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

    // Hover expand via event delegation
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const hoverable = target.closest("button, a, .hoverable, [role='button'], .cursor-pointer, input, select, textarea");
      if (hoverable) {
        cursor.classList.add("cursor-hover");
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const hoverable = target.closest("button, a, .hoverable, [role='button'], .cursor-pointer, input, select, textarea");
      if (hoverable) {
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!relatedTarget || !relatedTarget.closest("button, a, .hoverable, [role='button'], .cursor-pointer, input, select, textarea")) {
          cursor.classList.remove("cursor-hover");
        }
      }
    };

    window.addEventListener("mouseover", onMouseOver);
    window.addEventListener("mouseout", onMouseOut);

    return () => {
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotLoading(false);
      if (res.ok) {
        setForgotSuccess(true);
      } else {
        const data = await res.json();
        setForgotError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setForgotLoading(false);
      setForgotError("Could not connect to server. Please try again.");
    }
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setErrorMsg("");
    setIsLoading(true);

    try {
      const response = await fetch(
        isLogin
          ? apiUrl("/api/auth/login")
          : apiUrl("/api/auth/register"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            role,
            firstName:
              isLogin ? "" : firstName,
            lastName:
              isLogin ? "" : lastName,
          }),
        }
      );

      const data = await response.json();

      setIsLoading(false);

      if (response.ok) {
        if (data.user) {
          localStorage.setItem(
            "user",
            JSON.stringify(data.user)
          );
        }

        if (data.access_token) {
          localStorage.setItem(
            "access_token",
            data.access_token
          );

          localStorage.setItem(
            "token_expires_at",
            String(
              Date.now() +
              55 * 60 * 1000
            )
          );
        }

        if (data.refresh_token) {
          localStorage.setItem(
            "refresh_token",
            data.refresh_token
          );
        }

        if (isLogin || data.access_token) {
          navigate(
            data.user.role ===
              "candidate"
              ? "/candidate/dashboard"
              : "/recruiter/dashboard"
          );
        } else {
          navigate("/login");
        }
      } else {
        setErrorMsg(
          data.error ??
          "Authentication failed"
        );
      }
    } catch (err) {
      console.error(err);

      setIsLoading(false);

      setErrorMsg(
        "Could not connect to server."
      );
    }
  };

  const handleGoogleSignIn =
    async () => {
      setGoogleLoading(true);

      try {
        await signInWithGoogle();
      } catch (err: any) {
        setGoogleLoading(false);

        setErrorMsg(
          err.message ??
          "Google sign in failed"
        );
      }
    };

  const handleGithubSignIn =
    async () => {
      setGithubLoading(true);

      try {
        await signInWithGithub();
      } catch (err: any) {
        setGithubLoading(false);

        setErrorMsg(
          err.message ??
          "Github sign in failed"
        );
      }
    };

  return (
    <div
      className="
      min-h-screen
      bg-[#f5f5f3]
      text-black
      overflow-hidden
      relative
      custom-cursor-active
    "
      style={{
        cursor: "none",
      }}
    >
      {/* Spotlight + Cursor */}
      <div className="spotlight-overlay" ref={spotlightRef} />
      <div className="custom-cursor" ref={cursorRef} />

      {/* Grid */}

      <div
        className="
        absolute
        inset-0
        pointer-events-none
      "
        style={{
          backgroundImage: `
          linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
        `,
          backgroundSize:
            "40px 40px",
        }}
      />
      <main className={`relative z-10 w-full overflow-hidden ${isLogin
        ? "min-h-screen flex items-center justify-center p-4 md:py-8 md:px-12"
        : "h-screen"
        }`}>
        {isLogin ? (
          <div className="w-full max-w-[960px] grid md:grid-cols-2 gap-8 md:gap-12 items-center">

            <div className="space-y-6 md:space-y-8">

              <button
                type="button"
                onClick={() => navigate("/")}
                className="
                flex
                items-center
                justify-center
                md:justify-start
                gap-2
                text-black/50
                hover:text-black
                transition-colors
                mx-auto
                md:mx-0
              "
              >
                <ArrowLeft size={18} />
                <span
                  className="
                  uppercase
                  tracking-wider
                  text-xs
                "
                >
                  Back To Home
                </span>
              </button>

              <div className="space-y-2 text-center md:text-left">

                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                  <div className="w-2.5 h-2.5 bg-black" />
                  <span
                    className="
                    text-[9px]
                    uppercase
                    tracking-[0.15em]
                    font-bold
                  "
                  >
                    Intelligence OS
                  </span>
                </div>

                <h1
                  className="
                  text-4xl
                  md:text-[46px]
                  font-black
                  tracking-tight
                  leading-none
                "
                  style={{
                    fontFamily:
                      "var(--font-display)",
                  }}
                >
                  TalentLens<span className="text-[#0052CC]">AI</span>
                </h1>

                <p
                  className="
                  text-xs
                  text-black/60
                  max-w-sm
                  mx-auto
                  md:mx-0
                  leading-relaxed
                "
                  style={{
                    fontFamily:
                      "var(--font-mono)",
                  }}
                >
                  High density interface for modern recruitment pipelines and career velocity management.
                </p>
              </div>

              {/* ROLE SELECT */}

              <div className="space-y-3">

                <span
                  className="
                  block
                  text-[9px]
                  uppercase
                  tracking-[0.15em]
                  font-bold
                  text-black/50
                "
                >
                  Terminal Selection
                </span>

                <div className="grid gap-3">

                  {/* Candidate */}

                  <button
                    type="button"
                    onClick={() =>
                      setRole(
                        "candidate"
                      )
                    }
                    className={`
                    flex
                    items-center
                    gap-4
                    p-4
                    rounded-[18px]
                    border
                    transition-all

                    ${role ===
                        "candidate"
                        ? "bg-black text-white border-black"
                        : "bg-white/60 border-black/5"
                      }
                  `}
                  >
                    <div
                      className={`
                      w-10
                      h-10
                      rounded-lg
                      flex
                      items-center
                      justify-center

                      ${role ===
                          "candidate"
                          ? "bg-white/20"
                          : "bg-black/5"
                        }
                    `}
                    >
                      <User
                        size={18}
                      />
                    </div>

                    <div className="flex-1 text-left">

                      <div className="flex justify-between items-center">

                        <span
                          className="
                          uppercase
                          tracking-wider
                          font-semibold
                          text-xs
                        "
                        >
                          Candidate
                        </span>

                        {role ===
                          "candidate" && (
                            <span className="text-xs">
                              ✓
                            </span>
                          )}
                      </div>

                      <span
                        className="
                        block
                        mt-0.5
                        text-[9px]
                        uppercase
                        opacity-60
                      "
                      >
                        Access Talent Profile & Apps
                      </span>
                    </div>
                  </button>

                  {/* Recruiter */}

                  <button
                    type="button"
                    onClick={() =>
                      setRole(
                        "recruiter"
                      )
                    }
                    className={`
                    flex
                    items-center
                    gap-4
                    p-4
                    rounded-[18px]
                    border
                    transition-all

                    ${role ===
                        "recruiter"
                        ? "bg-black text-white border-black"
                        : "bg-white/60 border-black/5"
                      }
                  `}
                  >
                    <div
                      className={`
                      w-10
                      h-10
                      rounded-lg
                      flex
                      items-center
                      justify-center

                      ${role ===
                          "recruiter"
                          ? "bg-white/20"
                          : "bg-black/5"
                        }
                    `}
                    >
                      <Briefcase
                        size={18}
                      />
                    </div>

                    <div className="flex-1 text-left">

                      <div className="flex justify-between items-center">

                        <span
                          className="
                          uppercase
                          tracking-wider
                          font-semibold
                          text-xs
                        "
                        >
                          Recruiter
                        </span>

                        {role ===
                          "recruiter" && (
                            <span className="text-xs">
                              ✓
                            </span>
                          )}
                      </div>

                      <span
                        className="
                        block
                        mt-0.5
                        text-[9px]
                        uppercase
                        opacity-60
                      "
                      >
                        Manage Hiring & Pipeline
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE */}

            <div>

              <div
                className="
                bg-white
                rounded-[2.5rem]
                p-6
                md:p-8
                border
                border-black/[0.03]
                shadow-[0_10px_80px_-20px_rgba(0,0,0,0.08)]
              "
              >

                <div className="mb-6 text-center">

                  <h2
                    className="
                    text-2xl
                    font-bold
                    mb-1
                  "
                    style={{
                      fontFamily:
                        "var(--font-display)",
                    }}
                  >
                    Welcome Back
                  </h2>

                  <p className="text-xs text-black/50">
                    Sign in to manage your talent intelligence platform.
                  </p>
                </div>

                {errorMsg && (
                  <div
                    className="
                    mb-4
                    rounded-lg
                    border
                    border-red-200
                    bg-red-50
                    p-3
                    text-red-600
                    text-xs
                  "
                  >
                    {errorMsg}
                  </div>
                )}

                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="space-y-4"
                >

                  <div>

                    <label
                      className="
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-[0.15em]
                      ml-1
                      block
                      mb-1.5
                    "
                    >
                      EMAIL ADDRESS
                    </label>

                    <div className="relative">

                      <Mail
                        className="
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        text-black/40
                      "
                        size={16}
                      />

                      <input
                        type="email"
                        value={email}
                        onChange={(
                          e
                        ) =>
                          setEmail(
                            e.target
                              .value
                          )
                        }
                        placeholder="name@company.com"
                        className="
                        w-full
                        bg-black/[0.04]
                        rounded-xl
                        py-3
                        pl-12
                        pr-4
                        text-sm
                      "
                      />
                    </div>
                  </div>
                  <div>

                    <label
                      className="
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-[0.15em]
                      ml-1
                      block
                      mb-1.5
                    "
                    >
                      PASSWORD
                    </label>

                    <div className="relative">

                      <Lock
                        className="
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        text-black/40
                      "
                        size={16}
                      />

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={password}
                        onChange={(e) =>
                          setPassword(
                            e.target.value
                          )
                        }
                        placeholder="••••••••"
                        className="
                        w-full
                        bg-black/[0.04]
                        rounded-xl
                        py-3
                        pl-12
                        pr-12
                        text-sm
                      "
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            !showPassword
                          )
                        }
                        className="
                        absolute
                        right-4
                        top-1/2
                        -translate-y-1/2
                        text-black/40
                      "
                      >
                        {showPassword ? (
                          <EyeOff
                            size={16}
                          />
                        ) : (
                          <Eye
                            size={16}
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">

                    <button
                      type="button"
                      id="forgot-password-btn"
                      onClick={() => {
                        setForgotEmail(email);
                        setForgotError("");
                        setForgotSuccess(false);
                        setShowForgotModal(true);
                      }}
                      className="
                      text-xs
                      text-black/50
                      hover:text-black
                    "
                    >
                      Forgot password?
                    </button>

                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="
                    w-full
                    bg-black
                    text-white
                    py-3.5
                    rounded-xl
                    font-semibold
                    hover:opacity-90
                    transition-all
                    text-sm
                  "
                  >
                    {isLoading
                      ? "Signing In..."
                      : "Sign In"}
                  </button>
                </form>

                {/* Divider */}

                <div className="relative my-5">

                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-black/10" />
                  </div>

                  <div className="relative flex justify-center">

                    <span
                      className="
                      bg-white
                      px-4
                      text-[9px]
                      uppercase
                      tracking-[0.15em]
                      text-black/40
                    "
                    >
                      Or Continue With
                    </span>

                  </div>
                </div>

                {/* Social */}

                <div className="grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={
                      handleGoogleSignIn
                    }
                    disabled={
                      googleLoading
                    }
                    className="
                    h-11
                    rounded-xl
                    border
                    border-black/10
                    hover:bg-black/[0.03]
                    text-sm
                    flex
                    items-center
                    justify-center
                    gap-2
                    font-medium
                    text-slate-700
                    transition-all
                    active:scale-[0.98]
                    disabled:opacity-50
                  "
                  >
                    {googleLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-650 rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                        </svg>
                        <span>Google</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleGithubSignIn
                    }
                    disabled={
                      githubLoading
                    }
                    className="
                    h-11
                    rounded-xl
                    border
                    border-black/10
                    hover:bg-black/[0.03]
                    text-sm
                    flex
                    items-center
                    justify-center
                    gap-2
                    font-medium
                    text-slate-700
                    transition-all
                    active:scale-[0.98]
                    disabled:opacity-50
                  "
                  >
                    {githubLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-650 rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-slate-900" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                        </svg>
                        <span>GitHub</span>
                      </>
                    )}
                  </button>

                </div>

                <div
                  className="
                  mt-5
                  text-center
                  text-xs
                  text-black/50
                "
                >
                  Don't have an account?

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/register"
                      )
                    }
                    className="
                    ml-2
                    text-black
                    font-semibold
                  "
                  >
                    Create Account
                  </button>
                </div>

              </div>
            </div>
          </div>
        ) : (

          /* ===========================
             REGISTER PAGE START
          =========================== */

          <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-[#fbfbfb]">
            <section
              className="
            hidden
            md:flex
            md:w-5/12
            lg:w-1/2
            p-8
            lg:p-12
            flex-col
            justify-between
            relative
            border-r
            border-black/5
            bg-[#f0ede8]/30
            h-full
          "
            >

              <div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/")
                  }
                  className="
                flex
                items-center
                gap-2
                text-black/50
                hover:text-black
                transition-colors
              "
                >
                  <ArrowLeft size={18} />
                  <span
                    className="
                  uppercase
                  tracking-wider
                  text-xs
                "
                  >
                    Back To Home
                  </span>
                </button>

                <div className="mt-8">

                  <div
                    className="
                  flex
                  items-center
                  gap-3
                  mb-4
                "
                  >
                    <div
                      className="
                    w-2
                    h-2
                    rounded-full
                    bg-black/30
                    animate-pulse
                  "
                    />

                    <span
                      className="
                    text-[10px]
                    uppercase
                    tracking-[0.15em]
                    text-black/50
                  "
                    >
                      [SYSTEM ACCESS:SECURED]
                    </span>
                  </div>

                  <h1
                    className="
                  text-[54px]
                  lg:text-[68px]
                  font-black
                  leading-[0.85]
                  tracking-[-0.06em]
                "
                    style={{
                      fontFamily:
                        "var(--font-display)",
                    }}
                  >
                    Start
                    <br />
                    your
                    <br />
                    journey
                    <span className="text-black/20">
                      .
                    </span>
                  </h1>

                  <p
                    className="
                  mt-4
                  max-w-xs
                  text-xs
                  leading-relaxed
                  text-black/55
                "
                  >
                    Create an account
                    to start analyzing
                    your CV, mapping
                    your career
                    trajectory, and
                    landing your dream
                    job.
                  </p>

                </div>
              </div>

              {/* Testimonial */}

              <div
                className="
              relative
              max-w-md
            "
              >

                <div
                  className="
                bg-white/70
                backdrop-blur-xl
                border
                border-black/5
                rounded-[20px]
                p-5
              "
                >

                  <p
                    className="
                  italic
                  leading-relaxed
                  mb-4
                  text-xs
                  text-black/80
                "
                  >
                    "This platform
                    revolutionized our
                    hiring. The
                    candidate
                    classification
                    accuracy and hiring
                    chance predictions
                    match our real world
                    hiring outcomes with
                    incredible
                    precision."
                  </p>

                  <div
                    className="
                  flex
                  items-center
                  gap-4
                "
                  >

                    <div
                      className="
                    w-8
                    h-8
                    rounded-full
                    bg-black/10
                  "
                    />

                    <div>

                      <p
                        className="
                      font-semibold
                      text-xs
                    "
                      >
                        Crishtofer
                      </p>

                      <p
                        className="
                      text-[10px]
                      uppercase
                      tracking-wider
                      text-black/50
                    "
                      >
                        Head Of TalentLens AI At
                        Stripe
                      </p>

                    </div>

                  </div>
                </div>

                <div
                  className="
                absolute
                -right-24
                -bottom-12
                w-64
                h-64
                bg-black/5
                blur-[100px]
              "
                />

              </div>

            </section>

            {/* RIGHT REGISTER PANEL */}

            <section
              className="
            flex-1
            flex
            items-center
            justify-center
            p-4
            md:p-8
            lg:p-12
            md:overflow-y-auto
            h-full
          "
            >

              <div
                className="
              w-full
              max-w-[460px]
            "
              >

                <div className="mb-2">

                  <h2
                    className="
                  text-2xl
                  font-semibold
                  tracking-tight
                "
                    style={{
                      fontFamily:
                        "var(--font-display)",
                    }}
                  >
                    Create Account
                  </h2>

                  <div
                    className="
                  mt-1
                  flex
                  items-center
                  gap-2
                  text-xs
                  text-black/50
                "
                  >

                    <span>
                      Already have an
                      account?
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/login"
                        )
                      }
                      className="
                    text-black
                    font-semibold
                  "
                    >
                      Sign In
                    </button>

                  </div>

                </div>

                {errorMsg && (
                  <div
                    className="
                  mb-4
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  p-3
                  text-xs
                  text-red-600
                "
                  >
                    {errorMsg}
                  </div>
                )}

                <div
                  className="
                bg-white/70
                backdrop-blur-xl
                rounded-[24px]
                border
                border-black/5
                p-4
                md:p-5
              "
                >

                  <form
                    onSubmit={
                      handleSubmit
                    }
                    className="
                  space-y-4
                "
                  >
                    {/* ROLE */}

                    <div>

                      <label
                        className="
                      block
                      mb-2
                      text-[10px]
                      uppercase
                      tracking-[0.2em]
                      text-black/50
                    "
                      >
                        I AM A...
                      </label>

                      <div className="grid grid-cols-2 gap-3">

                        {/* Candidate */}

                        <button
                          type="button"
                          onClick={() =>
                            setRole(
                              "candidate"
                            )
                          }
                          className={`
                        role-card
                        border
                        rounded-xl
                        p-3.5
                        text-left
                        transition-all

                        ${role ===
                              "candidate"
                              ? "bg-white border-black shadow-md"
                              : "bg-black/[0.02] border-black/5"
                            }
                      `}
                        >
                          <div
                            className="
                          flex
                          justify-between
                          mb-3
                        "
                          >

                            <div
                              className="
                            w-8
                            h-8
                            rounded-lg
                            border
                            border-black/10
                            flex
                            items-center
                            justify-center
                          "
                            >
                              <User
                                size={16}
                              />
                            </div>

                            {role ===
                              "candidate" && (
                                <div
                                  className="
                              w-5
                              h-5
                              rounded-full
                              bg-black
                              text-white
                              flex
                              items-center
                              justify-center
                              text-[10px]
                            "
                                >
                                  ✓
                                </div>
                              )}

                          </div>

                          <h4
                            className="
                          font-semibold
                          text-xs
                        "
                          >
                            Candidate
                          </h4>

                          <p
                            className="
                          text-[10px]
                          text-black/50
                        "
                          >
                            Looking for a job
                          </p>

                        </button>

                        {/* Recruiter */}

                        <button
                          type="button"
                          onClick={() =>
                            setRole(
                              "recruiter"
                            )
                          }
                          className={`
                        role-card
                        border
                        rounded-xl
                        p-3.5
                        text-left
                        transition-all

                        ${role ===
                              "recruiter"
                              ? "bg-white border-black shadow-md"
                              : "bg-black/[0.02] border-black/5"
                            }
                      `}
                        >
                          <div
                            className="
                          flex
                          justify-between
                          mb-3
                        "
                          >

                            <div
                              className="
                            w-8
                            h-8
                            rounded-lg
                            border
                            border-black/10
                            flex
                            items-center
                            justify-center
                          "
                            >
                              <Briefcase
                                size={16}
                              />
                            </div>

                            {role ===
                              "recruiter" && (
                                <div
                                  className="
                              w-5
                              h-5
                              rounded-full
                              bg-black
                              text-white
                              flex
                              items-center
                              justify-center
                              text-[10px]
                            "
                                >
                                  ✓
                                </div>
                              )}

                          </div>

                          <h4
                            className="
                            font-semibold
                            text-xs
                        "
                          >
                            Recruiter
                          </h4>

                          <p
                            className="
                          text-[10px]
                          text-black/50
                        "
                          >
                            Hiring talent
                          </p>

                        </button>

                      </div>
                    </div>

                    {/* FIRST LAST NAME */}

                    <div className="grid sm:grid-cols-2 gap-4">

                      <div>

                        <label
                          className="
                        block
                        mb-1
                        text-[10px]
                        uppercase
                        tracking-[0.2em]
                        text-black/50
                      "
                        >
                          First Name
                        </label>

                        <input
                          value={
                            firstName
                          }
                          onChange={(e) =>
                            setFirstName(
                              e.target.value
                            )
                          }
                          placeholder="Enter First Name"
                          className="
                        w-full
                        rounded-xl
                        bg-black/[0.04]
                        px-3.5
                        py-2
                        text-xs
                      "
                        />

                      </div>

                      <div>

                        <label
                          className="
                        block
                        mb-1
                        text-[10px]
                        uppercase
                        tracking-[0.2em]
                        text-black/50
                      "
                        >
                          Last Name
                        </label>

                        <input
                          value={
                            lastName
                          }
                          onChange={(e) =>
                            setLastName(
                              e.target.value
                            )
                          }
                          placeholder="Enter Last Name"
                          className="
                        w-full
                        rounded-xl
                        bg-black/[0.04]
                        px-3.5
                        py-2
                        text-xs
                      "
                        />

                      </div>

                    </div>

                    {/* EMAIL */}

                    <div>

                      <label
                        className="
                      block
                      mb-1
                      text-[10px]
                      uppercase
                      tracking-[0.2em]
                      text-black/50
                    "
                      >
                        Email Address
                      </label>

                      <div className="relative">

                        <Mail
                          size={16}
                          className="
                        absolute
                        left-3.5
                        top-1/2
                        -translate-y-1/2
                        text-black/40
                      "
                        />

                        <input
                          type="email"
                          value={email}
                          onChange={(e) =>
                            setEmail(
                              e.target.value
                            )
                          }
                          placeholder="name@company.com"
                          className="
                        w-full
                        rounded-xl
                        bg-black/[0.04]
                        pl-10
                        pr-3.5
                        py-2
                        text-xs
                      "
                        />

                      </div>

                    </div>

                    {/* PASSWORD */}

                    <div>

                      <label
                        className="
                      block
                      mb-1
                      text-[10px]
                      uppercase
                      tracking-[0.2em]
                      text-black/50
                    "
                      >
                        Password
                      </label>

                      <div className="relative">

                        <Lock
                          size={16}
                          className="
                        absolute
                        left-3.5
                        top-1/2
                        -translate-y-1/2
                        text-black/40
                      "
                        />

                        <input
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          value={password}
                          onChange={(e) =>
                            setPassword(
                              e.target.value
                            )
                          }
                          placeholder="••••••••"
                          className="
                        w-full
                        rounded-xl
                        bg-black/[0.04]
                        pl-10
                        pr-10
                        py-2
                        text-xs
                      "
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              !showPassword
                            )
                          }
                          className="
                        absolute
                        right-3.5
                        top-1/2
                        -translate-y-1/2
                      "
                        >
                          {showPassword ? (
                            <EyeOff
                              size={16}
                            />
                          ) : (
                            <Eye
                              size={16}
                            />
                          )}
                        </button>

                      </div>

                    </div>

                    {/* SUBMIT */}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="
                    w-full
                    bg-black
                    text-white
                    rounded-xl
                    py-3
                    text-sm
                    font-semibold
                  "
                    >
                      {isLoading
                        ? "Creating Account..."
                        : "Create Account"}
                    </button>

                  </form>

                  {/* Divider */}

                  <div className="relative my-4">

                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-black/10" />
                    </div>

                    <div className="relative flex justify-center">

                      <span
                        className="
                      bg-white
                      px-4
                      text-[10px]
                      uppercase
                      tracking-[0.2em]
                      text-black/40
                    "
                      >
                        Or Continue With
                      </span>

                    </div>

                  </div>

                  {/* SOCIAL */}

                  <div className="grid grid-cols-2 gap-3">

                    <button
                      onClick={
                        handleGoogleSignIn
                      }
                      disabled={
                        googleLoading
                      }
                      type="button"
                      className="
                    h-11
                    text-sm
                    rounded-xl
                    border
                    border-black/10
                    hover:bg-black/[0.03]
                    flex
                    items-center
                    justify-center
                    gap-2
                    font-medium
                    text-slate-700
                    transition-all
                    active:scale-[0.98]
                    disabled:opacity-50
                  "
                    >
                      {googleLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-650 rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                          </svg>
                          <span>Google</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={
                        handleGithubSignIn
                      }
                      disabled={
                        githubLoading
                      }
                      type="button"
                      className="
                    h-11
                    text-sm
                    rounded-xl
                    border
                    border-black/10
                    hover:bg-black/[0.03]
                    flex
                    items-center
                    justify-center
                    gap-2
                    font-medium
                    text-slate-700
                    transition-all
                    active:scale-[0.98]
                    disabled:opacity-50
                  "
                    >
                      {githubLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-650 rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-slate-900" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                          </svg>
                          <span>GitHub</span>
                        </>
                      )}
                    </button>

                  </div>

                </div>



              </div>

            </section>

          </div>

        )}

      </main>

      {/* ── Forgot Password Modal ─────────────────────────────────────────── */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForgotModal(false);
              setForgotSuccess(false);
            }
          }}
        >
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-[420px] shadow-[0_20px_80px_-10px_rgba(0,0,0,0.2)] relative">
            {/* Close button */}
            <button
              type="button"
              id="forgot-modal-close"
              onClick={() => { setShowForgotModal(false); setForgotSuccess(false); }}
              className="absolute top-5 right-5 text-black/30 hover:text-black transition-colors"
            >
              <X size={20} />
            </button>

            {forgotSuccess ? (
              /* Success state */
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-green-500" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">Check Your Email</h3>
                <p className="text-sm text-black/50 leading-relaxed mb-6">
                  If an account exists for <strong>{forgotEmail}</strong>, we've
                  sent a password reset link. Please check your inbox and spam folder.
                </p>
                <button
                  type="button"
                  onClick={() => { setShowForgotModal(false); setForgotSuccess(false); }}
                  className="w-full bg-black text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              /* Form state */
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-black" />
                    <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-black/50">
                      Account Recovery
                    </span>
                  </div>
                  <h3
                    className="text-2xl font-bold mb-1"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Forgot Password?
                  </h3>
                  <p className="text-xs text-black/50 leading-relaxed">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                {forgotError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-xs">
                    {forgotError}
                  </div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.15em] ml-1 block mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40"
                        size={16}
                      />
                      <input
                        id="forgot-email-input"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@company.com"
                        required
                        className="w-full bg-black/[0.04] rounded-xl py-3 pl-12 pr-4 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    id="forgot-submit-btn"
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-black text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-all text-sm disabled:opacity-60"
                  >
                    {forgotLoading ? "Sending…" : "Send Reset Link"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full text-xs text-black/40 hover:text-black transition-colors py-1"
                  >
                    Cancel
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}