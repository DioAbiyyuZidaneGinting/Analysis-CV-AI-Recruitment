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
  size = 32,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          className="transition-transform hover:scale-110 focus:outline-none"
          style={{ fontSize: size }}
          aria-label={`${star} star`}
        >
          <Star
            style={{ width: size, height: size }}
            className={`transition-colors ${
              star <= (hovered || value)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-200 fill-gray-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── NPS Slider Component ─────────────────────────────────────────────────────
function NpsSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const getColor = (score: number) => {
    if (score <= 6) return "#ef4444";
    if (score <= 8) return "#f59e0b";
    return "#22c55e";
  };
  const getLabel = (score: number) => {
    if (score <= 6) return "Detractor";
    if (score <= 8) return "Passive";
    return "Promoter 🎉";
  };

  return (
    <div>
      <div className="flex gap-1.5 flex-wrap justify-center mb-3">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${
              value === n
                ? "text-white scale-110 shadow-lg"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
            style={value === n ? { backgroundColor: getColor(n) } : {}}
            aria-label={`Score ${n}`}
          >
            {n}
          </button>
        ))}
      </div>
      {value >= 0 && (
        <p
          className="text-center text-sm font-bold"
          style={{ color: getColor(value) }}
        >
          {getLabel(value)}
        </p>
      )}
      <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
        <span>Not at all</span>
        <span>Extremely likely</span>
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
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-[#dcfce7] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Thank You! 🙏
          </h1>
          <p className="text-muted-foreground mb-8">
            Your feedback has been submitted. It helps us make TalentLens AI better for everyone.
          </p>
          <button
            onClick={() => navigate("/candidate/dashboard")}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
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
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── No eligible applications ───────────────────────────────────────────────
  if (eligible.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-[#e9d5ff] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-black text-foreground mb-2">No Feedback Pending</h2>
          <p className="text-muted-foreground text-sm mb-6">
            You can submit feedback once an application reaches accepted or rejected status.
          </p>
          <button
            onClick={() => navigate("/candidate/dashboard")}
            className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          Share Your Experience ⭐
        </h1>
        <p className="text-muted-foreground mt-1">
          Help us improve TalentLens AI with your honest feedback.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Application selector */}
        {eligible.length > 1 && (
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
            <h2 className="font-black text-base text-foreground mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Select Application
            </h2>
            <div className="space-y-2">
              {eligible.map((app) => (
                <button
                  key={app.applicationId}
                  type="button"
                  onClick={() => setSelectedAppId(app.applicationId)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    selectedAppId === app.applicationId
                      ? "border-primary bg-primary/5"
                      : "border-black/[0.06] hover:border-primary/30"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm text-foreground">{app.jobTitle}</p>
                    <p className="text-xs text-muted-foreground">{app.department}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      app.status === "accepted"
                        ? "bg-[#dcfce7] text-emerald-700"
                        : "bg-[#fee2e2] text-red-700"
                    }`}
                  >
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedApp && eligible.length === 1 && (
          <div className="bg-white rounded-2xl border border-black/[0.06] p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-foreground">{selectedApp.jobTitle}</p>
              <p className="text-xs text-muted-foreground">{selectedApp.department}</p>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                selectedApp.status === "accepted"
                  ? "bg-[#dcfce7] text-emerald-700"
                  : "bg-[#fee2e2] text-red-700"
              }`}
            >
              {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1)}
            </span>
          </div>
        )}

        {/* Star Ratings */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6 space-y-6">
          <h2 className="font-black text-base text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Rate Your Experience
          </h2>
          {ratings.map(({ key, label, icon, desc }) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{icon}</span>
                <p className="font-semibold text-sm text-foreground">{label}</p>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{desc}</p>
              <StarRating
                value={form[key]}
                onChange={(v) => setForm((prev) => ({ ...prev, [key]: v }))}
              />
            </div>
          ))}
        </div>

        {/* NPS */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="font-black text-base text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Would you recommend TalentLens AI?
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            On a scale of 0–10, how likely are you to recommend TalentLens AI to a friend or colleague?
          </p>
          <NpsSelector
            value={form.recommendation_score}
            onChange={(v) => setForm((prev) => ({ ...prev, recommendation_score: v }))}
          />
        </div>

        {/* Favorite Feature */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-primary" />
            <h2 className="font-black text-base text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              What did you like most?
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Select the feature that impressed you the most.</p>
          <div className="grid grid-cols-2 gap-2">
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
                className={`p-3 rounded-xl border text-sm font-semibold text-left transition-all ${
                  form.favorite_feature === feat
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-black/[0.06] text-foreground hover:border-primary/30 hover:bg-muted/50"
                }`}
              >
                {feat}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h2 className="font-black text-base text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Any additional comments?
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Optional — share anything else you'd like us to know.</p>
          <textarea
            id="feedback-comment"
            value={form.comment}
            onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
            rows={4}
            maxLength={1000}
            placeholder="Your experience, suggestions, or anything you'd like to share..."
            className="w-full border border-black/[0.08] rounded-xl p-3.5 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all placeholder:text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">{form.comment.length}/1000</p>
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
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl font-black text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
          <p className="text-xs text-muted-foreground text-center">
            Please complete all ratings and the NPS score before submitting.
          </p>
        )}
      </form>
    </div>
  );
}
