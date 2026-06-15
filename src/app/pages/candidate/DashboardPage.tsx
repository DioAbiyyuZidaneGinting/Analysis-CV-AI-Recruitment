import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Star, Target, Briefcase, Zap, Brain, AlertCircle, ChevronRight } from "lucide-react";
import { useCandidateContext } from "./candidateContext";
import { PIPELINE_STEPS, STATUS_CONFIG } from "./candidateShared";

export function DashboardPage() {
  const navigate = useNavigate();
  const { candidate, analyzed, applications, errorMsg } = useCandidateContext();

  const [eligibleFeedback, setEligibleFeedback] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch("/api/candidate/feedback/eligible", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.eligible) setEligibleFeedback(data.eligible);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {/* Feedback Completion Card */}
      {eligibleFeedback.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#7c3aed] to-[#a855f7] rounded-2xl p-5 flex items-center justify-between gap-4 shadow-lg shadow-violet-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-white text-sm" style={{ fontFamily: "var(--font-display)" }}>
                Share Your Experience ⭐
              </p>
              <p className="text-white/80 text-xs mt-0.5">
                You have {eligibleFeedback.length} application{eligibleFeedback.length > 1 ? "s" : ""} awaiting feedback.
                It only takes 2 minutes!
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              navigate(
                `/candidate/feedback?application_id=${eligibleFeedback[0].applicationId}`
              )
            }
            className="flex-shrink-0 flex items-center gap-1.5 bg-white text-violet-700 text-xs font-black px-3.5 py-2 rounded-xl hover:bg-violet-50 transition-colors"
          >
            Leave Feedback <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      <div>
        <h1
          className="text-2xl font-black text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Good morning, {candidate.name.split(" ")[0]}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {analyzed
            ? "Your CV is analyzed. See recommendations below to improve your hiring chances."
            : "Upload your CV to unlock detailed AI recommendations."}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "CV Score",
            value: analyzed ? candidate.cvScore : "--",
            suffix: analyzed ? "/100" : "",
            icon: Star,
            bg: "bg-[#e9d5ff]",
            iconColor: "text-primary",
            trend: analyzed ? "Analyzed" : "Upload required",
          },
          {
            label: "Hiring Chance",
            value: analyzed ? candidate.hiringChance : "--",
            suffix: analyzed ? "%" : "",
            icon: Target,
            bg: "bg-[#b8f2e6]",
            iconColor: "text-emerald-600",
            trend: analyzed
              ? candidate.hiringChance >= 75
                ? "High demand"
                : "Average demand"
              : "Upload required",
          },
          {
            label: "Applications",
            value: applications.length,
            suffix: "",
            icon: Briefcase,
            bg: "bg-[#bae6fd]",
            iconColor: "text-sky-600",
            trend: applications.length > 0 ? `${applications.length} submitted` : "None yet",
          },
          {
            label: "Job Matches",
            value: 0,
            suffix: "",
            icon: Zap,
            bg: "bg-[#ffd6a5]",
            iconColor: "text-orange-600",
            trend: "Browse job board",
          },
        ].map(
          (
            { label, value, suffix, icon: Icon, bg, iconColor, trend },
            i,
          ) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-5 border border-black/[0.06] hover:shadow-md transition-shadow"
            >
              <div
                className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}
              >
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <p
                className="text-2xl font-black text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {value}
                {suffix}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {label}
              </p>
              <p className="text-xs text-muted-foreground font-semibold mt-2">
                {trend}
              </p>
            </motion.div>
          ),
        )}
      </div>

      {/* Pipeline tracker */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
        <h2
          className="font-black text-lg text-foreground mb-5"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Application Pipeline
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {PIPELINE_STEPS.map((step) => {
            const count = applications.filter(
              (a: any) => a.status === step,
            ).length;
            const config =
              STATUS_CONFIG[step as keyof typeof STATUS_CONFIG];
            return (
              <div key={step} className="text-center">
                <div className={`${config.color} rounded-xl p-4 mb-2`}>
                  <p
                    className="text-2xl font-black"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {count}
                  </p>
                  <p className="text-xs font-semibold mt-1 capitalize">
                    {config.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent applications + AI Recommendations */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent apps */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="font-black text-base text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Recent Applications
            </h2>
            <button
              onClick={() => navigate("/candidate/applications")}
              className="text-xs text-primary font-semibold hover:underline"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {applications.length > 0 ? applications.slice(0, 4).map((app: any) => {
              const status = app.status || "submitted";
              const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.submitted;
              const jobTitle = app.jobs?.title || "Unknown Position";
              const dept = app.jobs?.department || "";
              const initials = jobTitle.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
              return (
                <div
                  key={app.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  >
                    {initials || "J"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {jobTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dept}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.color} flex-shrink-0`}
                  >
                    {config.label}
                  </span>
                </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground text-center py-6">No applications yet. Browse job matches to apply.</p>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-primary" />
            <h2
              className="font-black text-base text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              AI Recommendations
            </h2>
          </div>
          <div className="space-y-3">
            {analyzed ? (
              candidate.improvements?.map((imp: string, i: number) => (
                <div
                  key={i}
                  className="flex gap-3 p-3 bg-[#f8f8fc] rounded-xl"
                >
                  <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{imp}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Upload your CV to see AI recommended action items to
                increase your hiring probability.
              </div>
            )}
          </div>
          {analyzed && (
            <button
              onClick={() => navigate("/candidate/cv-analysis")}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-primary/10 text-primary py-2.5 rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors"
            >
              Improve My CV <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
