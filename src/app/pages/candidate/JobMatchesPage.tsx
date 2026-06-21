import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, MapPin, Briefcase, Calendar, Check, Award, Brain, Star } from "lucide-react";

/** Helper: get a valid (auto-refreshed) Authorization header from stored JWT token */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = localStorage.getItem("access_token");
  const expiresAt = parseInt(localStorage.getItem("token_expires_at") || "0", 10);
  const refreshToken = localStorage.getItem("refresh_token");
  const now = Date.now();

  const needsRefresh = !token || (expiresAt > 0 && now >= expiresAt);

  if (needsRefresh && refreshToken) {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("token_expires_at", String(now + 55 * 60 * 1000));
        if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
        return { Authorization: `Bearer ${data.access_token}` };
      }
    } catch (e) {
      console.error("Token refresh error:", e);
    }
  }

  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Job {
  id: string;
  recruiter_id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  description: string;
  requirements: string[];
  required_skills: string[];
  experience_min_years: number;
  education_level_min: number;
  status: string;
  deadline: string | null;
  applied: boolean;
  matchScores: {
    cvScore: number;
    atsScore: number;
    skillsMatch: number;
    requirementsMatch: number;
    overallMatch: number;
  };
}

export function JobMatchesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchJobs = async () => {
    setLoading(true);
    const headers = await getAuthHeaders();
    fetch("/api/candidate/jobs", { headers })
      .then(res => res.ok ? res.json() : { jobs: [] })
      .then(data => {
        setJobs(data.jobs || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching job matches:", err);
        setJobs([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleApply = async (jobId: string) => {
    setApplyingId(jobId);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/candidate/jobs/${jobId}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers
        }
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Application submitted successfully!", "success");
        // Update local status immediately
        setJobs(prev => prev.map(job =>
          job.id === jobId ? { ...job, applied: true } : job
        ));
      } else {
        showToast(data.error || "Failed to submit application", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error submitting application", "error");
    } finally {
      setApplyingId(null);
    }
  };

  const getEduLabel = (level: number) => {
    switch (level) {
      case 1: return "High School";
      case 2: return "Bachelor's Degree";
      case 3: return "Master's Degree";
      case 4: return "Ph.D.";
      default: return "Bachelor's Degree";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: "var(--font-display)" }}>Matched Job Listings</h1>
        <p className="text-muted-foreground mt-1">AI analyzed positions matching your CV qualification profile</p>
      </div>

      {/* Info notice */}
      <div className="bg-black/[0.01] border border-black/[0.08] rounded-xl p-4 flex items-start gap-3">
        <Zap className="w-5 h-5 text-[#0052CC] mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-bold text-foreground text-sm">Dynamic Score System</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your match score increases automatically when you update your resume or upload a new CV. Applied jobs lock your score at application time.
          </p>
        </div>
      </div>

      {/* Job Grid */}
      {loading ? (
        <div className="text-center py-20 text-muted-foreground font-semibold">Analyzing matched job boards...</div>
      ) : jobs.length > 0 ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {jobs.map((job, idx) => {
            const scores = job.matchScores;
            const overall = scores.overallMatch;
            const badgeColor = overall >= 85
              ? "bg-emerald-500/[0.08] text-emerald-700 border-emerald-500/15"
              : overall >= 70
                ? "bg-[#0052CC]/[0.08] text-[#0052CC] border-[#0052CC]/15"
                : "bg-amber-500/[0.08] text-amber-700 border-amber-500/15";

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-xl p-5 border border-black/[0.08] hover:border-black/20 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge & Match score */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <h2 className="font-black text-base text-foreground leading-tight">{job.title}</h2>
                      <p className="text-xs text-muted-foreground">{job.department}</p>
                    </div>
                    <div className={`flex flex-col items-center p-2 rounded-lg ${badgeColor} text-center min-w-[72px] border`}>
                      <span className="text-lg font-black leading-none">{overall}%</span>
                      <span className="text-[9px] font-bold uppercase mt-1 tracking-wide">Match</span>
                    </div>
                  </div>

                  {/* Core info pills */}
                  <div className="flex flex-wrap gap-2.5 mb-4 text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location || "Remote"}</span>
                    <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {job.employment_type}</span>
                    {job.deadline && (
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Deadline: {job.deadline}</span>
                    )}
                  </div>

                  {/* Skills required */}
                  <div className="mb-4">
                    <p className="text-[10px] uppercase font-bold text-foreground mb-1.5 tracking-wide">REQUIRED SKILLS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.required_skills.slice(0, 4).map(s => (
                        <span key={s} className="bg-black/[0.03] border border-black/[0.06] text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded">{s}</span>
                      ))}
                      {job.required_skills.length > 4 && (
                        <span className="bg-black/[0.03] border border-black/[0.06] text-muted-foreground text-[10px] font-mono font-bold px-2 py-0.5 rounded">+{job.required_skills.length - 4} more</span>
                      )}
                    </div>
                  </div>

                  {/* Score analysis breakdowns */}
                  <div className="bg-black/[0.01] rounded-lg p-4 mb-4 border border-black/[0.06]">
                    <h4 className="flex items-center gap-1 text-[10px] font-black text-foreground uppercase tracking-wide mb-3"><Brain className="w-3.5 h-3.5 text-[#0052CC]" /> AI Match Breakdown</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      {[
                        { label: "CV Score", value: scores.cvScore, max: 100 },
                        { label: "ATS Score", value: scores.atsScore, max: 100 },
                        { label: "Skills Match", value: scores.skillsMatch, max: 100 },
                        { label: "Requirements", value: scores.requirementsMatch, max: 100 },
                      ].map(bar => (
                        <div key={bar.label} className="space-y-1">
                          <div className="flex justify-between font-semibold text-[10px]">
                            <span className="text-muted-foreground">{bar.label}</span>
                            <span className="text-foreground">{bar.value}%</span>
                          </div>
                          <div className="h-1 bg-black/[0.06] rounded-full overflow-hidden">
                            <div className="h-full bg-[#0052CC] rounded-full" style={{ width: `${bar.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Requirements details */}
                  <div className="border-t border-black/[0.04] pt-4 mb-4 text-xs space-y-1.5 text-muted-foreground">
                    <p className="font-semibold text-foreground">Minimum Criteria:</p>
                    <p>• Experience: {job.experience_min_years}+ years required</p>
                    <p>• Education: {getEduLabel(job.education_level_min)} or higher</p>
                  </div>
                </div>

                {/* Apply Actions */}
                <div className="pt-2">
                  {job.applied ? (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-850 py-3 rounded-lg font-bold text-sm cursor-not-allowed border border-emerald-200/60 font-mono uppercase tracking-wider"
                    >
                      <Check className="w-4 h-4" /> Applied
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={applyingId === job.id}
                      className="w-full bg-[#0052CC] hover:bg-[#0052CC]/95 text-white py-3 rounded-lg font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-mono uppercase tracking-wider shadow-sm"
                    >
                      {applyingId === job.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Applying...
                        </>
                      ) : (
                        <>Apply Instantly</>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-black/[0.08] rounded-xl text-muted-foreground bg-white p-5">
          <Zap className="w-8 h-8 text-muted-foreground/50 mb-3" />
          <p className="font-bold text-sm text-foreground">No job matches currently found</p>
          <p className="text-xs text-muted-foreground/80 mt-0.5">We couldn't find matches. Try building/enhancing your resume first!</p>
        </div>
      )}

      {/* Custom Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-black text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/10"
          >
            <div className={`w-2 h-2 rounded-full ${toast.type === "success" ? "bg-emerald-500 animate-pulse" :
              toast.type === "error" ? "bg-rose-500 animate-pulse" :
                "bg-blue-500 animate-pulse"
              }`} />
            <span className="text-[12px] font-medium tracking-tight font-sans text-white/90">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-3 text-white/40 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[16px] block">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
