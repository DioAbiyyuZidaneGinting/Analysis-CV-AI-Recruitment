import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Brain, Star, MessageSquare, Zap, Briefcase, BarChart2,
  Filter, Plus, Edit3, Trash2, XCircle, ChevronRight, Mail, MapPin, Award, Download, ThumbsUp, ThumbsDown, X
} from "lucide-react";
import { useNavigate } from "react-router";
import { apiUrl } from "../../utils/apiConfig";
import { authFetch, getAuthHeaders } from "../../utils/authFetch";

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90
    ? "bg-emerald-500/[0.08] text-emerald-700 border-emerald-500/15"
    : score >= 75
      ? "bg-[#0052CC]/[0.08] text-[#0052CC] border-[#0052CC]/15"
      : "bg-amber-500/[0.08] text-amber-700 border-amber-500/15";
  return <span className={`${color} border font-mono text-[10px] font-bold px-1.5 py-0.5 rounded`}>{score}</span>;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  avatar: string;
  avatarBg: string;
  role: string;
  cvScore: number;
  atsScore: number;
  communicationScore: number;
  culturalFitScore: number;
  skillScore: number;
  hiringChance: number;
  hiringRecommendation: string;
  status: string;
  appliedDate: string;
  skills: string[];
  jobCategory: string;
  location: string;
  experience: string;
  salary: string;
  matchScore: number;
  aiNote: string;
  cvAnalyzed: boolean;
  improvements: string[];
  strengths: string[];
  cvFilePath: string;
  cvFileName: string;
  education: any[];
  experienceList: any[];
  certifications: any[];
  appliedJobs: any[];
}

function CandidateDetailPanel({ candidate, onClose, onAction, showToast }: {
  candidate: Candidate; onClose: () => void;
  onAction: (candidateId: string, action: "accepted" | "rejected") => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const statusColors = (status: string) => {
    const s = status.toLowerCase();
    if (s === "accepted") return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
    if (s === "rejected") return "bg-rose-50 text-rose-700 border-rose-200/60";
    return "bg-sky-50 text-sky-700 border-sky-200/60";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-slate-50/95 backdrop-blur-xl border-l border-slate-200/80 z-50 overflow-y-auto shadow-2xl flex flex-col"
    >
      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${candidate.avatarBg || 'bg-gradient-to-tr from-[#0052CC] to-indigo-600'} rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-sm`}>
              {candidate.avatar}
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800 leading-tight tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>{candidate.name}</h2>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">{candidate.role}</p>
              <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColors(candidate.status)}`}>
                <span className="w-1 h-1 rounded-full bg-current" />
                {candidate.status.toUpperCase()}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-650 hover:bg-slate-200/60 p-2 rounded-full transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Mail, label: "Email", value: candidate.email, color: "text-blue-500 bg-blue-50" },
            { icon: MapPin, label: "Location", value: candidate.location || "Not specified", color: "text-orange-500 bg-orange-50" },
            { icon: Briefcase, label: "Experience", value: candidate.experience || "0 years", color: "text-indigo-500 bg-indigo-50" },
            { icon: Award, label: "Expected Salary", value: candidate.salary || "Not specified", color: "text-emerald-500 bg-emerald-50" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white border border-slate-200/50 rounded-xl p-3 flex items-center gap-3 shadow-sm hover:shadow transition-shadow">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
                <p className="text-xs text-slate-700 font-bold truncate mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* AI Evaluation */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-indigo-950">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-2 mb-3 relative z-10">
            <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md">
              <Brain className="w-4 h-4 text-purple-300 animate-pulse" />
            </div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-purple-200" style={{ fontFamily: 'var(--font-display)' }}>AI Candidate Insights</h3>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-normal relative z-10 mb-4">{candidate.aiNote}</p>
          
          <div className="grid grid-cols-3 gap-3 relative z-10">
            {[
              { score: candidate.cvScore, label: "CV Score", color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-300" },
              { score: candidate.atsScore, label: "ATS Score", color: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300" },
              { score: candidate.hiringChance + "%", label: "Hiring Chance", color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300" },
            ].map(({ score, label, color }) => (
              <div key={label} className={`bg-gradient-to-b ${color} border rounded-xl p-3 text-center backdrop-blur-sm`}>
                <p className="text-xl font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>{score}</p>
                <p className="text-[9px] font-bold opacity-70 mt-1 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Match Analysis */}
        <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Match Performance</h3>
          <div className="space-y-3.5">
            {[
              { label: "Technical Skills Match", score: candidate.cvScore || 0, color: "bg-[#0052CC]" },
              { label: "AI Cultural Fit Prediction", score: candidate.culturalFitScore || 70, color: "bg-indigo-600" },
              { label: "AI Communication Assessment", score: candidate.communicationScore || 70, color: "bg-pink-500" },
              { label: "Experience Relevance Alignment", score: candidate.skillScore || 60, color: "bg-emerald-500" },
            ].map(({ label, score, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500 font-medium">{label}</span>
                  <span className="font-bold text-slate-800">{score}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Applied Positions */}
        <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Applied Positions ({candidate.appliedJobs?.length || 0})
          </h3>
          <div className="space-y-2">
            {candidate.appliedJobs && candidate.appliedJobs.length > 0 ? (
              candidate.appliedJobs.map((job: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="font-bold text-xs text-slate-700">{job.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{job.department} · {job.appliedAt}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                    job.status.toLowerCase() === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                    job.status.toLowerCase() === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200/60' :
                    'bg-sky-50 text-sky-700 border-sky-200/60'
                  }`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No other applications found.</p>
            )}
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Verified Skills</h3>
          <div className="flex flex-wrap gap-2">
            {candidate.skills && candidate.skills.length > 0 ? candidate.skills.map((skill: string) => (
              <span key={skill} className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200/60 transition-colors">
                {skill}
              </span>
            )) : <span className="text-slate-400 text-xs italic font-sans">No skills analyzed</span>}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="p-4 bg-white border-t border-slate-100 flex gap-3 shadow-inner">
        {candidate.status !== "accepted" && candidate.status !== "rejected" && (
          <>
            <button
              onClick={() => onAction(candidate.id, "accepted")}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-500/10 active:scale-[0.98]"
            >
              <ThumbsUp className="w-4 h-4" /> Accept
            </button>
            <button
              onClick={() => onAction(candidate.id, "rejected")}
              className="flex-1 flex items-center justify-center gap-2 bg-rose-500 text-white hover:bg-rose-600 py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-rose-500/10 active:scale-[0.98]"
            >
              <ThumbsDown className="w-4 h-4" /> Reject
            </button>
          </>
        )}
        
        <button 
          onClick={async () => {
            try {
              const res = await fetch(apiUrl(`/api/recruiter/candidate/${candidate.id}/cv-url`), {
                headers: getAuthHeaders()
              });
              const data = await res.json();
              if (res.ok && data.signedUrl) {
                window.open(data.signedUrl, "_blank");
              } else {
                showToast("Failed to download CV: " + (data.error || "No CV uploaded or access denied"), "error");
              }
            } catch (err) {
              console.error(err);
              showToast("Error downloading CV", "error");
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-[0.98]"
        >
          <Download className="w-4 h-4" /> View Resume
        </button>
      </div>
    </motion.div>
  );
}

export function RecruiterDashboardPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingJobs, setFetchingJobs] = useState(true);

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Dashboard Sub-tabs: Overview or Manage Jobs
  const [subTab, setSubTab] = useState<"overview" | "jobs">("overview");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Job Modal States
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDept, setJobDept] = useState("");
  const [jobLoc, setJobLoc] = useState("");
  const [jobEmpType, setJobEmpType] = useState("Full-time");
  const [jobSalaryMin, setJobSalaryMin] = useState("");
  const [jobSalaryMax, setJobSalaryMax] = useState("");
  const [jobCurrency, setJobCurrency] = useState("USD");
  const [jobDesc, setJobDesc] = useState("");
  const [jobReqs, setJobReqs] = useState("");
  const [jobSkills, setJobSkills] = useState("");
  const [jobExpMin, setJobExpMin] = useState("0");
  const [jobEduMin, setJobEduMin] = useState("1");
  const [jobStatus, setJobStatus] = useState("open");
  const [jobDeadline, setJobDeadline] = useState("");

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await authFetch(apiUrl("/api/recruiter/candidates"));
      const data = res.ok ? await res.json() : { candidates: [] };
      setCandidates(data.candidates || []);
    } catch (err) {
      console.error("Recruiter candidates fetch failed", err);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    setFetchingJobs(true);
    try {
      const res = await authFetch(apiUrl("/api/recruiter/jobs"));
      const data = res.ok ? await res.json() : { jobs: [] };
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Error fetching jobs", err);
      setJobs([]);
    } finally {
      setFetchingJobs(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchJobs();
  }, []);

  const handleAction = async (candidateId: string, action: "accepted" | "rejected") => {
    try {
      const res = await authFetch(apiUrl(`/api/recruiter/candidate/${candidateId}/action`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        setCandidates(prev => prev.map(c =>
          c.id === candidateId ? { ...c, status: action } : c
        ));
        if (selectedCandidate && selectedCandidate.id === candidateId) {
          setSelectedCandidate(prev => prev ? { ...prev, status: action } : null);
        }
      } else {
        showToast("Failed to update status on server", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating application status", "error");
    }
  };

  const handleOpenCreateModal = () => {
    setEditingJob(null);
    setJobTitle("");
    setJobDept("");
    setJobLoc("");
    setJobEmpType("Full-time");
    setJobSalaryMin("");
    setJobSalaryMax("");
    setJobCurrency("USD");
    setJobDesc("");
    setJobReqs("");
    setJobSkills("");
    setJobExpMin("0");
    setJobEduMin("1");
    setJobStatus("open");
    setJobDeadline("");
    setJobModalOpen(true);
  };

  const handleOpenEditModal = (job: any) => {
    setEditingJob(job);
    setJobTitle(job.title || "");
    setJobDept(job.department || "");
    setJobLoc(job.location || "");
    setJobEmpType(job.employment_type || "Full-time");
    setJobSalaryMin(job.salary_min ? String(job.salary_min) : "");
    setJobSalaryMax(job.salary_max ? String(job.salary_max) : "");
    setJobCurrency(job.currency || "USD");
    setJobDesc(job.description || "");
    setJobReqs((job.requirements || []).join("\n"));
    setJobSkills((job.required_skills || []).join(", "));
    setJobExpMin(String(job.experience_min_years || 0));
    setJobEduMin(String(job.education_level_min || 1));
    setJobStatus(job.status || "open");
    setJobDeadline(job.deadline || "");
    setJobModalOpen(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) {
      showToast("Job Title is required!", "error");
      return;
    }

    const payload = {
      title: jobTitle,
      department: jobDept,
      location: jobLoc,
      employment_type: jobEmpType,
      salary_min: jobSalaryMin ? parseInt(jobSalaryMin) : null,
      salary_max: jobSalaryMax ? parseInt(jobSalaryMax) : null,
      currency: jobCurrency,
      description: jobDesc,
      requirements: jobReqs.split("\n").map(r => r.trim()).filter(r => r !== ""),
      required_skills: jobSkills.split(",").map(s => s.trim()).filter(s => s !== ""),
      experience_min_years: parseInt(jobExpMin),
      education_level_min: parseInt(jobEduMin),
      status: jobStatus,
      deadline: jobDeadline || null
    };

    try {
      const url = editingJob ? apiUrl(`/api/recruiter/jobs/${editingJob.id}`) : apiUrl("/api/recruiter/jobs");
      const method = editingJob ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingJob ? "Job updated successfully!" : "New job posted successfully!", "success");
        setJobModalOpen(false);
        setEditingJob(null);
        fetchJobs();
      } else {
        const err = await res.json();
        showToast("Failed to save job: " + (err.error || "Server error"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving job", "error");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to delete this job posting? This cannot be undone.")) {
      return;
    }
    try {
      const res = await authFetch(apiUrl(`/api/recruiter/jobs/${jobId}`), {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Job deleted successfully!", "success");
        fetchJobs();
      } else {
        showToast("Failed to delete job.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting job.", "error");
    }
  };

  const handleToggleJobStatus = async (job: any, newStatus: string) => {
    try {
      const res = await authFetch(apiUrl(`/api/recruiter/jobs/${job.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Job status updated to '${newStatus}'!`, "success");
        fetchJobs();
      } else {
        showToast("Failed to update status.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating status.", "error");
    }
  };

  const stats = {
    total: candidates.length,
    newApps: candidates.filter(c => c.status === "submitted").length,
    avgScore: candidates.length > 0 ? Math.round(candidates.reduce((s, c) => s + c.cvScore, 0) / candidates.length) : 0,
    interviews: candidates.filter(c => c.status === "interview").length,
  };

  return (
    <div className="space-y-6">
      {/* Candidate Details Overlay */}
      <AnimatePresence>
        {selectedCandidate && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSelectedCandidate(null)}
            />
            <CandidateDetailPanel
              candidate={selectedCandidate}
              onClose={() => setSelectedCandidate(null)}
              onAction={handleAction}
              showToast={showToast}
            />
          </>
        )}
      </AnimatePresence>

      {/* Post New / Edit Job Modal */}
      <AnimatePresence>
        {jobModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
              onClick={() => setJobModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-y-12 inset-x-4 md:inset-x-auto md:right-12 md:w-[600px] bg-white rounded-xl z-50 shadow-xl flex flex-col overflow-hidden border border-black/[0.08]"
            >
              <div className="p-6 border-b border-black/[0.08] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                    {editingJob ? "Edit Job Posting" : "Post a New Vacancy"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">DEFINE VACANCY REQUIREMENTS</p>
                </div>
                <button
                  onClick={() => setJobModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-black/[0.04] border border-black/[0.08] flex items-center justify-center hover:bg-black/[0.08] transition-colors text-muted-foreground hover:text-foreground"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveJob} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-[10px] font-bold text-foreground mb-1.5 uppercase tracking-wide">Job Title *</label>
                  <input
                    type="text" required value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0052CC] font-sans text-sm"
                    placeholder="e.g. Senior Frontend Architect"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-foreground mb-1.5 uppercase tracking-wide">Department</label>
                    <input
                      type="text" value={jobDept} onChange={e => setJobDept(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0052CC] font-sans text-sm"
                      placeholder="e.g. Product Engineering"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-foreground mb-1.5 uppercase tracking-wide">Location</label>
                    <input
                      type="text" value={jobLoc} onChange={e => setJobLoc(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0052CC] font-sans text-sm"
                      placeholder="e.g. Singapore (Hybrid)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-foreground mb-1.5 uppercase tracking-wide">Employment Type</label>
                    <select
                      value={jobEmpType} onChange={e => setJobEmpType(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0052CC] font-sans text-sm"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-foreground mb-1.5 uppercase tracking-wide">Application Deadline</label>
                    <input
                      type="date" value={jobDeadline} onChange={e => setJobDeadline(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0052CC] font-sans text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-foreground mb-1.5 uppercase tracking-wide">Min Salary</label>
                    <input
                      type="number" value={jobSalaryMin} onChange={e => setJobSalaryMin(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0052CC] font-sans text-sm"
                      placeholder="e.g. 5000"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-foreground mb-1.5 uppercase tracking-wide">Max Salary</label>
                    <input
                      type="number" value={jobSalaryMax} onChange={e => setJobSalaryMax(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0052CC] font-sans text-sm"
                      placeholder="e.g. 8000"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-foreground mb-1.5 uppercase tracking-wide">Currency</label>
                    <input
                      type="text" value={jobCurrency} onChange={e => setJobCurrency(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0052CC] font-sans text-sm"
                      placeholder="USD"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-foreground mb-1.5 uppercase tracking-wide">Min Experience (Years)</label>
                    <input
                      type="number" value={jobExpMin} onChange={e => setJobExpMin(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0052CC] font-sans text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-foreground mb-1.5 uppercase tracking-wide">Min Education Required</label>
                    <select
                      value={jobEduMin} onChange={e => setJobEduMin(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0052CC] font-sans text-sm"
                    >
                      <option value="1">High School</option>
                      <option value="2">Bachelor's Degree</option>
                      <option value="3">Master's Degree</option>
                      <option value="4">Ph.D.</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-foreground mb-1.5 uppercase tracking-wide">Status</label>
                  <select
                    value={jobStatus} onChange={e => setJobStatus(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0052CC] font-sans text-sm"
                  >
                    <option value="open">Open / Active</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-foreground mb-1.5 uppercase tracking-wide">Required Skills (Comma separated)</label>
                  <input
                    type="text" value={jobSkills} onChange={e => setJobSkills(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0052CC] font-sans text-sm"
                    placeholder="e.g. React, TypeScript, CSS, TailwindCSS"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-foreground mb-1.5 uppercase tracking-wide">Requirements (One per line)</label>
                  <textarea
                    rows={3} value={jobReqs} onChange={e => setJobReqs(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0052CC] font-sans text-sm"
                    placeholder="e.g. 5+ years building production React apps&#10;Excellent clean-code principles"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-foreground mb-1.5 uppercase tracking-wide">Description</label>
                  <textarea
                    rows={4} value={jobDesc} onChange={e => setJobDesc(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:border-[#0052CC] font-sans text-sm"
                    placeholder="Describe the job vacancy role, responsibilities, culture etc..."
                  />
                </div>

                <div className="pt-2 border-t border-black/[0.08] flex gap-3">
                  <button
                    type="button" onClick={() => setJobModalOpen(false)}
                    className="flex-1 py-2.5 border border-black/[0.08] text-foreground font-mono uppercase tracking-wider rounded-lg hover:bg-black/[0.04] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#0052CC] text-white font-mono uppercase tracking-wider rounded-lg hover:bg-[#0052CC]/90 transition-colors shadow-sm"
                  >
                    {editingJob ? "Save Changes" : "Publish Listing"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.08] pb-4">
        <div>
          <h1 className="text-xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Recruiter Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage active postings and review matching candidates</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-black/[0.04] border border-black/[0.08] p-0.5 rounded-lg flex gap-0.5 text-xs font-mono">
            <button
              onClick={() => setSubTab("overview")}
              className={`px-3 py-1 rounded-md transition-colors ${subTab === "overview" ? "bg-white border border-black/[0.08] shadow-sm text-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
            >
              Overview
            </button>
            <button
              onClick={() => setSubTab("jobs")}
              className={`px-3 py-1 rounded-md transition-colors ${subTab === "jobs" ? "bg-white border border-black/[0.08] shadow-sm text-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
            >
              Job Vacancies
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 bg-[#0052CC] text-white px-3.5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[#0052CC]/95 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Post Job
          </button>
        </div>
      </div>

      {loading || fetchingJobs ? (
        <div className="text-center py-20 text-muted-foreground text-sm font-semibold font-mono">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          Loading dashboard content...
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {subTab === "overview" ? (
            <motion.div
              key="overview-content"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Candidates", value: stats.total, icon: Users, bg: "bg-sky-500/[0.08]", iconColor: "text-sky-700", border: "border-sky-500/15", sub: "Applied to jobs" },
                  { label: "New Applications", value: stats.newApps, icon: Zap, bg: "bg-amber-500/[0.08]", iconColor: "text-amber-700", border: "border-amber-500/15", sub: "Needs review" },
                  { label: "Avg CV Score", value: stats.avgScore, icon: Star, bg: "bg-[#0052CC]/[0.08]", iconColor: "text-[#0052CC]", border: "border-[#0052CC]/15", sub: "Pool quality" },
                  { label: "Interviews Set", value: stats.interviews, icon: MessageSquare, bg: "bg-emerald-500/[0.08]", iconColor: "text-emerald-700", border: "border-emerald-500/15", sub: "Active stages" },
                ].map(({ label, value, icon: Icon, bg, iconColor, border, sub }) => (
                  <div key={label} className="bg-white rounded-xl p-5 border border-black/[0.08] hover:border-black/20 transition-all">
                    <div className={`w-9 h-9 ${bg} ${border} border rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                    <p className="text-3xl font-black text-foreground leading-tight" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
                    <p className="text-xs font-bold text-foreground mt-1">{label}</p>
                    <p className="text-[9px] font-mono uppercase text-muted-foreground mt-2">{sub}</p>
                  </div>
                ))}
              </div>

              {/* AI Pick & Recent Apps */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* AI Top Pick */}
                <div className="lg:col-span-1 bg-[#0052CC] border border-black/[0.08] rounded-xl p-6 text-white shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="w-4 h-4 text-white" />
                      <h3 className="font-black text-xs uppercase tracking-wider font-mono">AI Top Pick</h3>
                    </div>
                    {candidates.length > 0 ? (() => {
                      const top = [...candidates].sort((a, b) => b.cvScore - a.cvScore)[0];
                      return (
                        <div>
                          <div className={`w-14 h-14 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center text-white font-mono font-bold text-lg mb-3`}>
                            {top.avatar}
                          </div>
                          <h4 className="font-black text-lg leading-tight" style={{ fontFamily: 'var(--font-display)' }}>{top.name}</h4>
                          <p className="text-white/80 text-xs mb-3 font-mono">{top.role}</p>
                          <div className="flex gap-3 mb-4">
                            <div className="bg-white/10 border border-white/15 rounded-lg p-3 text-center flex-1">
                              <p className="text-xl font-black">{top.cvScore}</p>
                              <p className="text-[9px] font-mono text-white/70 uppercase">CV Score</p>
                            </div>
                            <div className="bg-white/10 border border-white/15 rounded-lg p-3 text-center flex-1">
                              <p className="text-xl font-black">{top.hiringChance}%</p>
                              <p className="text-[9px] font-mono text-white/70 uppercase">Hire Chance</p>
                            </div>
                          </div>
                          <p className="text-white/90 text-xs leading-relaxed mb-4 font-sans line-clamp-3">{top.aiNote}</p>
                          <button
                            onClick={() => setSelectedCandidate(top)}
                            className="w-full bg-white text-[#0052CC] border border-transparent py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider hover:bg-white/90 transition-colors shadow-sm"
                          >
                            View Full Profile
                          </button>
                        </div>
                      );
                    })() : (
                      <div className="flex flex-col items-center justify-center py-10 text-white/80 font-mono">
                        <p className="text-xs font-semibold">NO CANDIDATES AVAILABLE</p>
                        <p className="text-[10px] text-white/60 mt-1">Check back later once candidates apply</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent candidates */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-black/[0.08] p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-black text-xs text-foreground uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Recent Applications</h3>
                      <button onClick={() => navigate("/recruiter/candidates")} className="text-xs font-mono font-bold text-[#0052CC] hover:underline uppercase tracking-wider">VIEW ALL</button>
                    </div>
                    {candidates.length > 0 ? (
                      <div className="space-y-3">
                        {candidates.slice(0, 5).map(c => (
                          <div
                            key={c.id}
                            onClick={() => setSelectedCandidate(c)}
                            className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-black/[0.06] hover:bg-black/[0.01] cursor-pointer transition-all"
                          >
                            <div className="w-10 h-10 bg-black/[0.04] border border-black/[0.08] rounded-lg flex items-center justify-center text-black font-mono font-bold text-sm flex-shrink-0">
                              {c.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-foreground truncate">{c.name}</p>
                              <p className="text-xs text-muted-foreground truncate font-sans">{c.experience} · {c.location || "No location"}</p>
                            </div>
                            <ScoreBadge score={c.cvScore} />
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-black/[0.02] text-muted-foreground border-black/[0.08]">
                              {c.status.toUpperCase()}
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-black/[0.08] rounded-lg text-muted-foreground font-mono">
                        <p className="text-xs font-semibold">NO APPLICATIONS YET</p>
                        <p className="text-[10px] text-muted-foreground/80 mt-0.5">Job applications will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "View Reports", icon: BarChart2, color: "text-[#0052CC]", bg: "bg-[#0052CC]/[0.08]", border: "border-[#0052CC]/15", action: () => navigate("/recruiter/reports") },
                  { label: "Manage Jobs", icon: Briefcase, color: "text-sky-700", bg: "bg-sky-500/[0.08]", border: "border-sky-500/15", action: () => setSubTab("jobs") },
                  { label: "Filter Pipelines", icon: Filter, color: "text-emerald-700", bg: "bg-emerald-500/[0.08]", border: "border-emerald-500/15", action: () => navigate("/recruiter/pipeline") },
                  { label: "AI Pool Pick", icon: Brain, color: "text-amber-700", bg: "bg-amber-500/[0.08]", border: "border-amber-500/15", action: () => navigate("/recruiter/candidates") },
                ].map(({ label, icon: Icon, color, bg, border, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="bg-white rounded-xl border border-black/[0.08] p-4 flex items-center gap-3 hover:border-black/20 hover:shadow-sm transition-all text-left group"
                  >
                    <div className={`w-9 h-9 ${bg} ${border} border rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <span className="font-bold text-xs text-foreground group-hover:text-[#0052CC] transition-colors">{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="jobs-content"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="bg-white rounded-xl border border-black/[0.08] overflow-hidden shadow-sm"
            >
              <div className="p-4 bg-black/[0.01] border-b border-black/[0.08] flex items-center justify-between text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                <span className="flex-1">Role / Department</span>
                <span className="w-32 hidden md:inline">Employment Type</span>
                <span className="w-28 text-center">Status</span>
                <span className="w-24 text-center">Applicants</span>
                <span className="w-40 text-right">Actions</span>
              </div>

              <div className="divide-y divide-black/[0.08]">
                {jobs.length > 0 ? (
                  jobs.map(job => {
                    const appCount = candidates.filter(
                      c => c.role.toLowerCase() === job.title.toLowerCase() ||
                        c.jobCategory.toLowerCase() === job.title.toLowerCase() ||
                        c.appliedJobs.some((aj: any) => aj.title.toLowerCase() === job.title.toLowerCase())
                    ).length;
                    return (
                      <div key={job.id} className="p-4 flex items-center justify-between hover:bg-black/[0.01] transition-all text-xs">
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="font-bold text-sm text-foreground truncate">{job.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{job.department} · {job.location || "Remote"}</p>
                        </div>
                        <div className="w-32 hidden md:inline text-muted-foreground text-xs font-mono font-semibold">
                          {job.employment_type}
                        </div>
                        <div className="w-28 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded border text-[9px] font-mono font-bold uppercase tracking-wider ${job.status === "open" ? "bg-emerald-50 text-emerald-700 border-emerald-500/15" :
                            job.status === "closed" ? "bg-rose-50 text-rose-700 border-rose-500/15" :
                              "bg-amber-50 text-amber-700 border-amber-500/15"
                            }`}>
                            {job.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="w-24 text-center font-mono font-bold text-foreground">
                          {appCount}
                        </div>
                        <div className="w-40 flex items-center justify-end gap-2 text-right">
                          <button
                            onClick={() => handleOpenEditModal(job)}
                            className="p-1.5 border border-black/[0.08] hover:bg-black/[0.04] rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit vacancy details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {job.status === "open" ? (
                            <button
                              onClick={() => handleToggleJobStatus(job, "closed")}
                              className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border border-rose-500/15 text-rose-700 bg-rose-50/50 rounded-lg hover:bg-rose-100 transition-all"
                            >
                              Close
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleJobStatus(job, "open")}
                              className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-500/15 text-emerald-700 bg-emerald-50/50 rounded-lg hover:bg-emerald-100 transition-all"
                            >
                              Reopen
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="p-1.5 border border-transparent hover:border-rose-500/15 hover:bg-rose-50/50 hover:text-rose-600 rounded-lg text-muted-foreground transition-colors"
                            title="Delete vacancy"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground font-mono">
                    <p className="font-bold text-xs">NO VACANCIES POSTED</p>
                    <p className="text-[10px] mt-0.5">Click 'Post Job' to create your first vacancy listing.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
