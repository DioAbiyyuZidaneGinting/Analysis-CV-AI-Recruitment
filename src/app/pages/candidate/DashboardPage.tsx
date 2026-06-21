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
      .catch(() => { });
  }, []);

  return (
    <div className="space-y-12">
      {errorMsg && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {/* Feedback Completion Card */}
      {eligibleFeedback.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0052CC] rounded-xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-md border border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-white text-base" style={{ fontFamily: "var(--font-display)" }}>
                Share Your Experience ⭐
              </p>
              <p className="text-white/80 text-sm mt-1">
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
            className="flex-shrink-0 flex items-center gap-1.5 bg-white text-[#0052CC] text-xs font-bold px-5 py-2.5 rounded-lg hover:bg-white/90 transition-all font-mono uppercase tracking-wider"
          >
            Leave Feedback <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#0052CC] tracking-widest uppercase">
          <span>[ SYSTEM PORTAL: CANDIDATE ACCESS ]</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#0052CC] animate-pulse"></span>
        </div>
        <h1
          className="text-3xl md:text-5xl font-black tracking-tighter text-black leading-none"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Good morning, <span className="text-[#0052CC]">{candidate.name.split(" ")[0]}</span>.
        </h1>
        <p className="text-sm text-[#666666] leading-relaxed max-w-2xl pt-2">
          {analyzed
            ? "System analysis complete. Recommendations generated to optimize application score."
            : "Upload your CV to begin automated system scoring and profile alignment."}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "CV Score",
            value: analyzed ? candidate.cvScore : "--",
            suffix: analyzed ? "/100" : "",
            icon: Star,
            bg: "bg-[#0052CC]/5 border border-[#0052CC]/15 text-[#0052CC]",
            glow: "shadow-sm",
            trend: analyzed ? "Analyzed" : "Upload required",
          },
          {
            label: "Hiring Chance",
            value: analyzed ? candidate.hiringChance : "--",
            suffix: analyzed ? "%" : "",
            icon: Target,
            bg: "bg-[#0052CC]/5 border border-[#0052CC]/15 text-[#0052CC]",
            glow: "shadow-sm",
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
            bg: "bg-[#ff8f00]/5 border border-[#ff8f00]/15 text-[#ff8f00]",
            glow: "shadow-sm",
            trend: applications.length > 0 ? `${applications.length} submitted` : "None yet",
          },
          {
            label: "Job Matches",
            value: 0,
            suffix: "",
            icon: Zap,
            bg: "bg-[#0052CC]/5 border border-[#0052CC]/15 text-[#0052CC]",
            glow: "shadow-sm",
            trend: "Browse job board",
          },
        ].map(
          (
            { label, value, suffix, icon: Icon, bg, glow, trend },
            i,
          ) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`bg-white rounded-xl border border-black/[0.08] p-8 hover:border-black/20 transition-all ${glow}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div
                  className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-black/30"> METRIC</span>
              </div>
              <p
                className="text-4xl md:text-5xl font-black text-black tracking-tighter"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {value}
                <span className="text-xl md:text-2xl font-bold text-black/40">{suffix}</span>
              </p>
              <p className="text-[10px] font-mono text-[#666666] uppercase tracking-widest mt-2">
                [{label}]
              </p>
              <p className="text-[10px] font-mono text-[#0052CC] mt-4 uppercase tracking-wider">
                // {trend}
              </p>
            </motion.div>
          ),
        )}
      </div>

      {/* Pipeline tracker */}
      <div className="bg-white rounded-xl border border-black/[0.08] p-8">
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#0052CC] tracking-widest uppercase mb-2">
          <span>[ PIPELINE STATUS: ACTIVE ]</span>
        </div>
        <h2
          className="font-black text-xl md:text-2xl tracking-tighter text-black mb-6"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Application Pipeline
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PIPELINE_STEPS.map((step) => {
            const count = applications.filter(
              (a: any) => a.status === step,
            ).length;
            const config =
              STATUS_CONFIG[step as keyof typeof STATUS_CONFIG];
            return (
              <div key={step} className="text-center">
                <div className={`${config.color} rounded-lg p-6 border transition-all duration-300`}>
                  <p
                    className="text-3xl font-black text-current animate-in fade-in zoom-in"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {count}
                  </p>
                  <p className="text-[10px] font-mono tracking-widest uppercase mt-2 text-current opacity-80">
                    {config.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent applications + AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent apps */}
        <div className="bg-white rounded-xl border border-black/[0.08] p-8">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="font-black text-xl md:text-2xl tracking-tighter text-black"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Recent Applications
            </h2>
            <button
              onClick={() => navigate("/candidate/applications")}
              className="text-xs text-[#0052CC] font-bold hover:underline font-mono"
            >
              VIEW ALL
            </button>
          </div>
          <div className="space-y-4">
            {applications.length > 0 ? applications.slice(0, 4).map((app: any) => {
              const status = app.status || "submitted";
              const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.submitted;
              const jobTitle = app.jobs?.title || "Unknown Position";
              const dept = app.jobs?.department || "";
              const initials = jobTitle.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
              return (
                <div
                  key={app.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-black/[0.02] border border-black/[0.06] hover:bg-black/[0.04] transition-all"
                >
                  <div
                    className="w-10 h-10 bg-black/[0.04] border border-black/[0.08] rounded-lg flex items-center justify-center text-black font-bold text-sm flex-shrink-0"
                  >
                    {initials || "J"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-black truncate">
                      {jobTitle}
                    </p>
                    <p className="text-[10px] text-[#666666] mt-0.5 font-mono">
                      // {dept}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${config.color} flex-shrink-0`}
                  >
                    {config.label}
                  </span>
                </div>
              );
            }) : (
              <p className="text-sm text-[#666666]/60 text-center py-8">No applications yet. Browse job matches to apply.</p>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-xl border border-black/[0.08] p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <Brain className="w-6 h-6 text-[#0052CC]" />
            <h2
              className="font-black text-xl md:text-2xl tracking-tighter text-black"
              style={{ fontFamily: "var(--font-display)" }}
            >
              AI Recommendations
            </h2>
          </div>
          <div className="space-y-4">
            {analyzed ? (
              candidate.improvements?.map((imp: string, i: number) => (
                <div
                  key={i}
                  className="flex gap-3.5 p-4 bg-black/[0.02] border border-black/[0.06] rounded-xl hover:bg-black/[0.04] transition-colors"
                >
                  <AlertCircle className="w-4 h-4 text-[#ff8f00] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-black/80 leading-relaxed font-semibold">{imp}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-[#666666]/60 text-sm font-mono">
                [ REQUIRE UPLOAD: RUN AI DIAGNOSTICS ]
              </div>
            )}
          </div>
          {analyzed && (
            <button
              onClick={() => navigate("/candidate/cv-analysis")}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-[#0052CC] text-white py-3 rounded-lg text-xs font-bold hover:bg-[#0052CC]/95 transition-all font-mono uppercase tracking-wider shadow-sm"
            >
              Improve My CV <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
