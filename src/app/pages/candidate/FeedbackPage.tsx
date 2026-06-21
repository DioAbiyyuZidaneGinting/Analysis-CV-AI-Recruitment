import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Star, CheckCircle, ChevronRight, MessageSquare, Sparkles, Heart, Cpu } from "lucide-react";
import { apiUrl } from "../../utils/apiConfig";

const API_BASE = apiUrl("/api/candidate");

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

// ─── Star Rating Component ────────────────────────────────────────────────────
function StarRating({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-2" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          className="transition-all hover:scale-125 focus:outline-none"
          aria-label={`${star} star`}
        >
          <Star
            style={{ width: size, height: size }}
            className={`transition-all duration-200 ${
              star <= (hovered || value)
                ? "text-[#ff8f00] fill-[#ff8f00] scale-110 drop-shadow-sm"
                : "text-black/[0.08] fill-transparent"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── NPS Slider Component ─────────────────────────────────────────────────────
function NpsSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const getColorClass = (score: number, isSelected: boolean) => {
    if (!isSelected) return "bg-white text-black border border-black/[0.08] hover:border-black/20 hover:bg-black/[0.01]";
    if (score <= 6) return "bg-red-500 border border-red-600 text-white shadow-sm";
    if (score <= 8) return "bg-amber-500 border border-amber-600 text-white shadow-sm";
    return "bg-emerald-500 border border-emerald-600 text-white shadow-sm";
  };
  const getTextColor = (score: number) => {
    if (score <= 6) return "text-red-600";
    if (score <= 8) return "text-amber-600";
    return "text-emerald-600";
  };
  const getLabel = (score: number) => {
    if (score <= 6) return "Detractor";
    if (score <= 8) return "Passive";
    return "Promoter 🎉";
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-11 gap-1 md:gap-1.5">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => {
          const isSelected = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`py-3 rounded-lg text-xs font-bold font-mono transition-all text-center ${getColorClass(n, isSelected)}`}
              aria-label={`Score ${n}`}
            >
              {n}
            </button>
          );
        })}
      </div>
      {value >= 0 && (
        <p className={`text-center text-xs font-mono uppercase tracking-wider ${getTextColor(value)}`}>
          // Status: {getLabel(value)}
        </p>
      )}
      <div className="flex justify-between text-[10px] font-mono text-[#666666] uppercase px-1">
        <span>[ 0 - Not at all likely ]</span>
        <span>[ 10 - Extremely likely ]</span>
      </div>
    </div>
  );
}

// ─── Eligible Application Selector ───────────────────────────────────────────
type EligibleApp = {
  applicationId: string;
  status: "accepted" | "rejected";
  appliedAt: string;
  jobTitle: string;
  department: string;
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export function FeedbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const prefilledAppId = searchParams.get("application_id") || "";

  const [eligible, setEligible] = useState<EligibleApp[]>([]);
  const [selectedAppId, setSelectedAppId] = useState(prefilledAppId);
  const [loadingEligible, setLoadingEligible] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const FEATURES = [
    "CV Analysis",
    "Job Matching",
    "Resume Builder",
    "Application Tracking",
    "Email Notifications",
    "Overall Experience",
  ];

  const [form, setForm] = useState({
    overall_rating: 0,
    ease_of_use_rating: 0,
    ui_design_rating: 0,
    recommendation_accuracy_rating: 0,
    recommendation_score: -1,
    favorite_feature: "",
    comment: "",
  });

  // Load eligible applications
  useEffect(() => {
    fetch(`${API_BASE}/feedback/eligible`, { headers: getAuthHeaders() })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const list: EligibleApp[] = data?.eligible || [];
        setEligible(list);
        // If URL param matches one of the eligible apps, keep it; otherwise clear
        if (prefilledAppId && list.some((a) => a.applicationId === prefilledAppId)) {
          setSelectedAppId(prefilledAppId);
        } else if (list.length > 0 && !prefilledAppId) {
          setSelectedAppId(list[0].applicationId);
        }
        setLoadingEligible(false);
      })
      .catch(() => setLoadingEligible(false));
  }, [prefilledAppId]);

  const selectedApp = eligible.find((a) => a.applicationId === selectedAppId);

  const ratings = [
    { key: "overall_rating" as const, label: "Overall Experience", icon: "⭐", desc: "How was your overall recruitment journey?" },
    { key: "ease_of_use_rating" as const, label: "Ease of Use", icon: "🖱️", desc: "How easy was it to use TalentLens AI?" },
    { key: "ui_design_rating" as const, label: "UI Design", icon: "🎨", desc: "How did you find the visual design and layout?" },
    { key: "recommendation_accuracy_rating" as const, label: "AI Recommendation Quality", icon: "🤖", desc: "How accurate were the job and skill recommendations?" },
  ];

  const canSubmit =
    selectedAppId &&
    form.overall_rating > 0 &&
    form.ease_of_use_rating > 0 &&
    form.ui_design_rating > 0 &&
    form.recommendation_accuracy_rating > 0 &&
    form.recommendation_score >= 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/feedback/submit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ application_id: selectedAppId, ...form }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to submit feedback.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success State ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md bg-white rounded-xl border border-black/[0.08] p-12 shadow-sm"
        >
          <div className="w-16 h-16 bg-[#dcfce7] border border-emerald-200/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black text-black tracking-tighter mb-3" style={{ fontFamily: "var(--font-display)" }}>
            Thank You! 🙏
          </h1>
          <p className="text-sm text-[#666666] leading-relaxed mb-8">
            Your feedback has been successfully registered. This helps us optimize and refine TalentLens AI for future candidates.
          </p>
          <button
            onClick={() => navigate("/candidate/dashboard")}
            className="bg-[#0052CC] text-white px-6 py-3 rounded-lg font-bold text-xs hover:bg-[#0052CC]/90 transition-all font-mono uppercase tracking-wider"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Loading eligible apps ──────────────────────────────────────────────────
  if (loadingEligible) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── No eligible applications ───────────────────────────────────────────────
  if (eligible.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm bg-white rounded-xl border border-black/[0.08] p-10 shadow-sm">
          <div className="w-16 h-16 bg-[#0052CC]/5 border border-[#0052CC]/15 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-[#0052CC]" />
          </div>
          <h2 className="text-2xl font-black text-black tracking-tighter mb-2" style={{ fontFamily: "var(--font-display)" }}>
            No Feedback Pending
          </h2>
          <p className="text-[#666666] text-sm leading-relaxed mb-8">
            You can submit feedback once an application reaches accepted or rejected status.
          </p>
          <button
            onClick={() => navigate("/candidate/dashboard")}
            className="bg-[#0052CC] text-white px-6 py-3 rounded-lg font-bold text-xs hover:bg-[#0052CC]/90 transition-all font-mono uppercase tracking-wider"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#0052CC] tracking-widest uppercase">
          <span>[ SYSTEM PORTAL: CANDIDATE FEEDBACK ]</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#0052CC] animate-pulse"></span>
        </div>
        <h1
          className="text-3xl md:text-5xl font-black tracking-tighter text-black leading-none"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Share Your <span className="text-[#0052CC]">Experience</span>.
        </h1>
        <p className="text-sm text-[#666666] leading-relaxed max-w-2xl pt-2">
          Help us improve TalentLens AI by submitting your system feedback below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Application selector */}
        {eligible.length > 1 && (
          <div className="bg-white rounded-xl border border-black/[0.08] p-8 space-y-4">
            <div className="text-[10px] font-mono text-[#0052CC] tracking-widest uppercase">
              [ SELECT AN APPLICATION TO REVIEW ]
            </div>
            <h2 className="font-black text-xl tracking-tighter text-black" style={{ fontFamily: "var(--font-display)" }}>
              Target Application
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {eligible.map((app) => (
                <button
                  key={app.applicationId}
                  type="button"
                  onClick={() => setSelectedAppId(app.applicationId)}
                  className={`p-5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    selectedAppId === app.applicationId
                      ? "border-[#0052CC] bg-[#0052CC]/5 shadow-sm"
                      : "border-black/[0.08] hover:border-black/20 hover:bg-black/[0.01]"
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm text-black">{app.jobTitle}</p>
                    <p className="text-[10px] font-mono text-[#666666] uppercase mt-1">[{app.department}]</p>
                  </div>
                  <div className="mt-4 flex justify-between items-center w-full">
                    <span
                      className={`text-[9px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-md border ${
                        app.status === "accepted"
                          ? "bg-emerald-50 border-emerald-200/50 text-emerald-700"
                          : "bg-red-50 border-red-200/50 text-red-700"
                      }`}
                    >
                      {app.status}
                    </span>
                    {selectedAppId === app.applicationId && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0052CC]"></span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedApp && eligible.length === 1 && (
          <div className="bg-white rounded-xl border border-black/[0.08] p-6 flex items-center justify-between">
            <div>
              <p className="font-bold text-base text-black">{selectedApp.jobTitle}</p>
              <p className="text-[10px] font-mono text-[#666666] uppercase mt-0.5">[{selectedApp.department}]</p>
            </div>
            <span
              className={`text-[9px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-md border ${
                selectedApp.status === "accepted"
                  ? "bg-emerald-50 border-emerald-200/50 text-emerald-700"
                  : "bg-red-50 border-red-200/50 text-red-700"
              }`}
            >
              {selectedApp.status}
            </span>
          </div>
        )}

        {/* Star Ratings */}
        <div className="bg-white rounded-xl border border-black/[0.08] p-8 space-y-6">
          <div className="text-[10px] font-mono text-[#0052CC] tracking-widest uppercase">
            [ RATING METRICS ]
          </div>
          <h2 className="font-black text-xl tracking-tighter text-black" style={{ fontFamily: "var(--font-display)" }}>
            Rate Your Experience
          </h2>
          <div className="space-y-6 divide-y divide-black/[0.06]">
            {ratings.map(({ key, label, icon, desc }, idx) => (
              <div key={key} className={idx > 0 ? "pt-6" : ""}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{icon}</span>
                  <p className="font-bold text-sm text-black">{label}</p>
                </div>
                <p className="text-[10px] font-mono text-[#666666] uppercase mb-4">// {desc}</p>
                <StarRating
                  value={form[key]}
                  onChange={(v) => setForm((prev) => ({ ...prev, [key]: v }))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* NPS */}
        <div className="bg-white rounded-xl border border-black/[0.08] p-8 space-y-4">
          <div className="text-[10px] font-mono text-[#0052CC] tracking-widest uppercase">
            [ PROMOTER SCORE ]
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#0052CC]" />
            <h2 className="font-black text-xl tracking-tighter text-black" style={{ fontFamily: "var(--font-display)" }}>
              Would you recommend TalentLens AI?
            </h2>
          </div>
          <p className="text-xs text-[#666666]">
            On a scale of 0–10, how likely are you to recommend TalentLens AI to a friend or colleague?
          </p>
          <NpsSelector
            value={form.recommendation_score}
            onChange={(v) => setForm((prev) => ({ ...prev, recommendation_score: v }))}
          />
        </div>

        {/* Favorite Feature */}
        <div className="bg-white rounded-xl border border-black/[0.08] p-8 space-y-4">
          <div className="text-[10px] font-mono text-[#0052CC] tracking-widest uppercase">
            [ METRIC ALIGNMENT ]
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-[#0052CC]" />
            <h2 className="font-black text-xl tracking-tighter text-black" style={{ fontFamily: "var(--font-display)" }}>
              What did you like most?
            </h2>
          </div>
          <p className="text-xs text-[#666666]">Select the platform features that impressed you the most during your journey.</p>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((feat) => (
              <button
                key={feat}
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    favorite_feature: prev.favorite_feature === feat ? "" : feat,
                  }))
                }
                className={`p-4 rounded-lg border text-xs font-bold text-left transition-all ${
                  form.favorite_feature === feat
                    ? "border-[#0052CC] bg-[#0052CC]/5 text-black shadow-sm"
                    : "border-black/[0.08] text-[#666666] hover:border-black/20 hover:text-black"
                }`}
              >
                {feat}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="bg-white rounded-xl border border-black/[0.08] p-8 space-y-4">
          <div className="text-[10px] font-mono text-[#0052CC] tracking-widest uppercase">
            [ USER THOUGHTS ]
          </div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-[#0052CC]" />
            <h2 className="font-black text-xl tracking-tighter text-black" style={{ fontFamily: "var(--font-display)" }}>
              Any additional comments?
            </h2>
          </div>
          <p className="text-xs text-[#666666]">Optional — share anything else you'd like us to know.</p>
          <textarea
            id="feedback-comment"
            value={form.comment}
            onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
            rows={4}
            maxLength={1000}
            placeholder="Your experience, suggestions, or anything you'd like to share..."
            className="w-full border border-black/[0.08] rounded-lg p-4 text-xs text-black font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#0052CC]/15 focus:border-[#0052CC]/30 transition-all placeholder:text-[#666666]/50 bg-black/[0.005]"
          />
          <p className="text-[10px] font-mono text-[#666666] text-right mt-1">{form.comment.length}/1000</p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3 font-semibold"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full flex items-center justify-center gap-2 bg-[#0052CC] text-white py-4 rounded-lg font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all font-mono uppercase tracking-wider"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Submit Feedback <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>

        {!canSubmit && (
          <p className="text-[10px] font-mono text-[#666666] text-center uppercase tracking-wider pt-2">
            // Fill all ratings and NPS score to enable submission
          </p>
        )}
      </form>
    </div>
  );
}

