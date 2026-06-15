import { useState, useEffect } from "react";
import { motion } from "motion/react";
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
        alert("Application submitted successfully!");
        // Update local status immediately
        setJobs(prev => prev.map(job =>
          job.id === jobId ? { ...job, applied: true } : job
        ));
      } else {
        alert(data.error || "Failed to submit application");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting application");
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
        <p className="text-muted-foreground mt-1">AI-analyzed positions matching your CV qualification profile</p>
      </div>

      {/* Info notice */}
      <div className="bg-[#f0f0ff] border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
        <Zap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-bold text-primary">Dynamic Score System</p>
          <p className="text-muted-foreground mt-0.5">
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
            const badgeColor = overall >= 85 ? "bg-emerald-500/10 text-emerald-600" : overall >= 70 ? "bg-primary/10 text-primary" : "bg-orange-500/10 text-orange-600";
            
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-3xl p-6 border border-black/[0.06] hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge & Match score */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <h2 className="font-black text-base text-foreground leading-tight">{job.title}</h2>
                      <p className="text-xs text-muted-foreground">{job.department}</p>
                    </div>
                    <div className={`flex flex-col items-center p-2.5 rounded-2xl ${badgeColor} text-center min-w-[70px] border border-black/[0.03]`}>
                      <span className="text-xl font-black leading-none">{overall}%</span>
                      <span className="text-[9px] font-black uppercase mt-1 tracking-wide">Match</span>
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
                    <p className="text-[10px] uppercase font-bold text-foreground mb-1.5 tracking-wide">Required Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.required_skills.slice(0, 4).map(s => (
                        <span key={s} className="bg-muted text-foreground text-[10px] font-semibold px-2.5 py-1 rounded-full">{s}</span>
                      ))}
                      {job.required_skills.length > 4 && (
                        <span className="bg-muted text-muted-foreground text-[10px] font-semibold px-2 py-1 rounded-full">+{job.required_skills.length - 4} more</span>
                      )}
                    </div>
                  </div>

                  {/* Score analysis breakdowns */}
                  <div className="bg-[#f8f8fc] rounded-2xl p-4 mb-4 border border-black/[0.02]">
                    <h4 className="flex items-center gap-1 text-[10px] font-black text-foreground uppercase tracking-wide mb-3"><Brain className="w-3.5 h-3.5 text-primary" /> AI Match Breakdown</h4>
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
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${bar.value}%` }} />
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
                      className="w-full flex items-center justify-center gap-2 bg-emerald-100 text-emerald-800 py-3 rounded-xl font-bold text-sm cursor-not-allowed border border-emerald-200"
                    >
                      <Check className="w-4 h-4" /> Applied
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={applyingId === job.id}
                      className="w-full bg-secondary text-white py-3 rounded-xl font-bold text-sm hover:bg-secondary/90 transition-all hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
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
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-black/[0.06] rounded-3xl text-muted-foreground bg-white">
          <Zap className="w-8 h-8 text-muted-foreground/50 mb-3" />
          <p className="font-bold text-sm">No job matches currently found</p>
          <p className="text-xs text-muted-foreground/80 mt-0.5">We couldn't find matches. Try building/enhancing your resume first!</p>
        </div>
      )}
    </div>
  );
}
