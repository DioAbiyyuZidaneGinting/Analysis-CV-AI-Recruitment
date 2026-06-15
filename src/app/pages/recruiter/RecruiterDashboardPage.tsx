import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Brain, Star, MessageSquare, Zap, Briefcase, BarChart2,
  Filter, Plus, Edit3, Trash2, XCircle, ChevronRight, Mail, MapPin, Award, Download, ThumbsUp, ThumbsDown
} from "lucide-react";
import { useNavigate } from "react-router";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? "bg-[#b8f2e6] text-emerald-700" : score >= 75 ? "bg-[#e9d5ff] text-primary" : "bg-[#ffd6a5] text-orange-700";
  return <span className={`${color} text-xs font-black px-2 py-0.5 rounded-full`}>{score}</span>;
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

function CandidateDetailPanel({ candidate, onClose, onAction }: {
  candidate: Candidate; onClose: () => void;
  onAction: (candidateId: string, action: "accepted" | "rejected") => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white border-l border-black/[0.06] z-50 overflow-y-auto shadow-2xl"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${candidate.avatarBg || 'bg-primary'} rounded-2xl flex items-center justify-center text-white font-black text-lg`}>
              {candidate.avatar}
            </div>
            <div>
              <h2 className="font-black text-xl text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{candidate.name}</h2>
              <p className="text-muted-foreground text-sm">{candidate.role}</p>
              <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#bae6fd] text-sky-700`}>
                {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { icon: Mail, text: candidate.email },
            { icon: MapPin, text: candidate.location || "No location provided" },
            { icon: Briefcase, text: candidate.experience || "No experience details" },
            { icon: Award, text: candidate.salary ? `${candidate.salary} expected` : "Salary not specified" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-muted-foreground">
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{text}</span>
            </div>
          ))}
        </div>

        {/* AI Evaluation */}
        <div className="bg-[#f0f0ff] border border-primary/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="font-black text-sm text-primary" style={{ fontFamily: 'var(--font-display)' }}>AI Evaluation</h3>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{candidate.aiNote}</p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white rounded-xl p-3 text-center border border-black/[0.04]">
              <p className="text-2xl font-black text-primary" style={{ fontFamily: 'var(--font-display)' }}>{candidate.cvScore}</p>
              <p className="text-[10px] text-muted-foreground">CV Score</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border border-black/[0.04]">
              <p className="text-2xl font-black text-secondary" style={{ fontFamily: 'var(--font-display)' }}>{candidate.atsScore}</p>
              <p className="text-[10px] text-muted-foreground">ATS Score</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border border-black/[0.04]">
              <p className="text-2xl font-black text-emerald-600" style={{ fontFamily: 'var(--font-display)' }}>{candidate.hiringChance}%</p>
              <p className="text-[10px] text-muted-foreground">Hiring Chance</p>
            </div>
          </div>
        </div>

        {/* Match Analysis */}
        <div>
          <h3 className="font-black text-sm text-foreground mb-3" style={{ fontFamily: 'var(--font-display)' }}>Match Analysis</h3>
          <div className="space-y-3">
            {[
              { label: "Technical Skills Match", score: candidate.cvScore || 0, color: "bg-primary" },
              { label: "AI Cultural Fit Prediction", score: candidate.culturalFitScore || 70, color: "bg-secondary" },
              { label: "AI Communication Assessment", score: candidate.communicationScore || 70, color: "bg-[#f472b6]" },
              { label: "Experience Relevance Alignment", score: candidate.skillScore || 60, color: "bg-[#4ade80]" },
            ].map(({ label, score, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground text-xs">{label}</span>
                  <span className="font-bold text-foreground text-xs">{score}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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

        {/* Skills */}
        <div>
          <h3 className="font-black text-sm text-foreground mb-3" style={{ fontFamily: 'var(--font-display)' }}>Skills</h3>
          <div className="flex flex-wrap gap-2">
            {candidate.skills && candidate.skills.length > 0 ? candidate.skills.map((skill: string) => (
              <span key={skill} className="bg-[#e9d5ff] text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
                {skill}
              </span>
            )) : <span className="text-muted-foreground text-xs italic">No skills analyzed</span>}
          </div>
        </div>

        {/* Actions & CV download */}
        <div className="flex gap-3 pt-2">
          {candidate.status !== "accepted" && candidate.status !== "rejected" && (
            <>
              <button
                onClick={() => onAction(candidate.id, "accepted")}
                className="flex-1 flex items-center justify-center gap-2 bg-[#4ade80] text-emerald-900 py-3 rounded-xl font-bold text-sm hover:bg-[#22c55e] transition-colors"
              >
                <ThumbsUp className="w-4 h-4" /> Accept
              </button>
              <button
                onClick={() => onAction(candidate.id, "rejected")}
                className="flex-1 flex items-center justify-center gap-2 bg-[#fecdd3] text-red-700 py-3 rounded-xl font-bold text-sm hover:bg-[#fca5a5] transition-colors"
              >
                <ThumbsDown className="w-4 h-4" /> Reject
              </button>
            </>
          )}
          
          <button 
            onClick={async () => {
              try {
                const res = await fetch(`/api/recruiter/candidate/${candidate.id}/cv-url`, {
                  headers: getAuthHeaders()
                });
                const data = await res.json();
                if (res.ok && data.signedUrl) {
                  window.open(data.signedUrl, "_blank");
                } else {
                  alert("Failed to download CV: " + (data.error || "No CV uploaded or access denied"));
                }
              } catch (err) {
                console.error(err);
                alert("Error downloading CV");
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-secondary text-white py-3 rounded-xl font-bold text-sm hover:bg-secondary/90 transition-colors"
          >
            <Download className="w-4 h-4" /> View CV
          </button>
        </div>
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

  const fetchCandidates = () => {
    setLoading(true);
    fetch("/api/recruiter/candidates", { headers: getAuthHeaders() })
      .then(res => res.ok ? res.json() : { candidates: [] })
      .then(data => {
        setCandidates(data.candidates || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Recruiter candidates fetch failed", err);
        setCandidates([]);
        setLoading(false);
      });
  };

  const fetchJobs = () => {
    setFetchingJobs(true);
    fetch("/api/recruiter/jobs", { headers: getAuthHeaders() })
      .then(res => res.ok ? res.json() : { jobs: [] })
      .then(data => {
        setJobs(data.jobs || []);
        setFetchingJobs(false);
      })
      .catch(err => {
        console.error("Error fetching jobs", err);
        setJobs([]);
        setFetchingJobs(false);
      });
  };

  useEffect(() => {
    fetchCandidates();
    fetchJobs();
  }, []);

  const handleAction = async (candidateId: string, action: "accepted" | "rejected") => {
    try {
      const res = await fetch(`/api/recruiter/candidate/${candidateId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
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
        alert("Failed to update status on server");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating application status");
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
      alert("Job Title is required!");
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
      const url = editingJob ? `/api/recruiter/jobs/${editingJob.id}` : "/api/recruiter/jobs";
      const method = editingJob ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(editingJob ? "Job updated successfully!" : "New job posted successfully!");
        setJobModalOpen(false);
        setEditingJob(null);
        fetchJobs();
      } else {
        const err = await res.json();
        alert("Failed to save job: " + (err.error || "Server error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error saving job");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to delete this job posting? This cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch(`/api/recruiter/jobs/${jobId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        alert("Job deleted successfully!");
        fetchJobs();
      } else {
        alert("Failed to delete job.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting job.");
    }
  };

  const handleToggleJobStatus = async (job: any, newStatus: string) => {
    try {
      const res = await fetch(`/api/recruiter/jobs/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        alert(`Job status updated to '${newStatus}'!`);
        fetchJobs();
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating status.");
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
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => setJobModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-y-12 inset-x-4 md:inset-x-auto md:right-12 md:w-[600px] bg-white rounded-3xl z-50 shadow-2xl flex flex-col overflow-hidden border border-black/[0.06]"
            >
              <div className="p-6 border-b border-black/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                    {editingJob ? "Edit Job Posting" : "Post a New Vacancy"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Define your requirements to find the ideal match.</p>
                </div>
                <button
                  onClick={() => setJobModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors text-muted-foreground hover:text-foreground"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveJob} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Job Title *</label>
                  <input
                    type="text" required value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-black/[0.08] rounded-xl focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    placeholder="e.g. Senior Frontend Architect"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Department</label>
                    <input
                      type="text" value={jobDept} onChange={e => setJobDept(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/40 border border-black/[0.08] rounded-xl focus:outline-none focus:border-secondary"
                      placeholder="e.g. Product Engineering"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Location</label>
                    <input
                      type="text" value={jobLoc} onChange={e => setJobLoc(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/40 border border-black/[0.08] rounded-xl focus:outline-none focus:border-secondary"
                      placeholder="e.g. Singapore (Hybrid)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Employment Type</label>
                    <select
                      value={jobEmpType} onChange={e => setJobEmpType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/40 border border-black/[0.08] rounded-xl focus:outline-none focus:border-secondary"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Application Deadline</label>
                    <input
                      type="date" value={jobDeadline} onChange={e => setJobDeadline(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/40 border border-black/[0.08] rounded-xl focus:outline-none focus:border-secondary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Min Salary</label>
                    <input
                      type="number" value={jobSalaryMin} onChange={e => setJobSalaryMin(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/40 border border-black/[0.08] rounded-xl focus:outline-none focus:border-secondary"
                      placeholder="e.g. 5000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Max Salary</label>
                    <input
                      type="number" value={jobSalaryMax} onChange={e => setJobSalaryMax(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/40 border border-black/[0.08] rounded-xl focus:outline-none focus:border-secondary"
                      placeholder="e.g. 8000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Currency</label>
                    <input
                      type="text" value={jobCurrency} onChange={e => setJobCurrency(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/40 border border-black/[0.08] rounded-xl focus:outline-none focus:border-secondary"
                      placeholder="USD"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Min Experience (Years)</label>
                    <input
                      type="number" value={jobExpMin} onChange={e => setJobExpMin(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/40 border border-black/[0.08] rounded-xl focus:outline-none focus:border-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Min Education Required</label>
                    <select
                      value={jobEduMin} onChange={e => setJobEduMin(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/40 border border-black/[0.08] rounded-xl focus:outline-none focus:border-secondary"
                    >
                      <option value="1">High School</option>
                      <option value="2">Bachelor's Degree</option>
                      <option value="3">Master's Degree</option>
                      <option value="4">Ph.D.</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Status</label>
                  <select
                    value={jobStatus} onChange={e => setJobStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-black/[0.08] rounded-xl focus:outline-none focus:border-secondary"
                  >
                    <option value="open">Open / Active</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Required Skills (Comma separated)</label>
                  <input
                    type="text" value={jobSkills} onChange={e => setJobSkills(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-black/[0.08] rounded-xl focus:outline-none focus:border-secondary"
                    placeholder="e.g. React, TypeScript, CSS, TailwindCSS"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Requirements (One per line)</label>
                  <textarea
                    rows={3} value={jobReqs} onChange={e => setJobReqs(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-black/[0.08] rounded-xl focus:outline-none focus:border-secondary"
                    placeholder="e.g. 5+ years building production React apps&#10;Excellent clean-code principles"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Description</label>
                  <textarea
                    rows={4} value={jobDesc} onChange={e => setJobDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-black/[0.08] rounded-xl focus:outline-none focus:border-secondary"
                    placeholder="Describe the job vacancy role, responsibilities, culture etc..."
                  />
                </div>

                <div className="pt-2 border-t border-black/[0.06] flex gap-3">
                  <button
                    type="button" onClick={() => setJobModalOpen(false)}
                    className="flex-1 py-3 border border-black/[0.08] text-foreground font-bold rounded-xl hover:bg-muted hover:text-black transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/90 transition-colors"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.04] pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Recruiter Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage active postings and review matching candidates</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-muted p-1 rounded-xl flex gap-1 text-sm font-semibold">
            <button
              onClick={() => setSubTab("overview")}
              className={`px-4 py-1.5 rounded-lg transition-colors ${subTab === "overview" ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Overview
            </button>
            <button
              onClick={() => setSubTab("jobs")}
              className={`px-4 py-1.5 rounded-lg transition-colors ${subTab === "jobs" ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Job Vacancies
            </button>
          </div>

          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-secondary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-secondary/90 transition-all shadow-md shadow-secondary/10"
          >
            <Plus className="w-4 h-4" /> Post Job
          </button>
        </div>
      </div>

      {loading || fetchingJobs ? (
        <div className="text-center py-20 text-muted-foreground text-sm font-semibold">
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
                  { label: "Total Candidates", value: stats.total, icon: Users, bg: "bg-[#bae6fd]", iconColor: "text-sky-600", sub: "Applied to your jobs" },
                  { label: "New Applications", value: stats.newApps, icon: Zap, bg: "bg-[#ffd6a5]", iconColor: "text-orange-600", sub: "Needs review" },
                  { label: "Avg CV Score", value: stats.avgScore, icon: Star, bg: "bg-[#e9d5ff]", iconColor: "text-primary", sub: "Candidate pool quality" },
                  { label: "Interviews Set", value: stats.interviews, icon: MessageSquare, bg: "bg-[#b8f2e6]", iconColor: "text-emerald-600", sub: "Active pipeline stage" },
                ].map(({ label, value, icon: Icon, bg, iconColor, sub }, i) => (
                  <div key={label} className="bg-white rounded-2xl p-5 border border-black/[0.06] hover:shadow-md transition-shadow">
                    <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <p className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
                    <p className="text-xs text-secondary font-medium mt-2">{sub}</p>
                  </div>
                ))}
              </div>

              {/* AI Pick & Recent Apps */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* AI Top Pick */}
                <div className="lg:col-span-1 bg-gradient-to-br from-primary to-violet-600 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="w-5 h-5 text-white" />
                      <h3 className="font-black text-sm uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>AI Top Pick</h3>
                    </div>
                    {candidates.length > 0 ? (() => {
                      const top = [...candidates].sort((a, b) => b.cvScore - a.cvScore)[0];
                      return (
                        <div>
                          <div className={`w-14 h-14 ${top.avatarBg || 'bg-primary'} rounded-2xl flex items-center justify-center text-white font-black text-lg mb-3`}>
                            {top.avatar}
                          </div>
                          <h4 className="font-black text-lg leading-tight" style={{ fontFamily: 'var(--font-display)' }}>{top.name}</h4>
                          <p className="text-white/70 text-sm mb-3">{top.role}</p>
                          <div className="flex gap-3 mb-4">
                            <div className="bg-white/20 rounded-xl p-3 text-center flex-1">
                              <p className="text-xl font-black">{top.cvScore}</p>
                              <p className="text-xs text-white/70">CV Score</p>
                            </div>
                            <div className="bg-white/20 rounded-xl p-3 text-center flex-1">
                              <p className="text-xl font-black">{top.hiringChance}%</p>
                              <p className="text-xs text-white/70">Hire Chance</p>
                            </div>
                          </div>
                          <p className="text-white/80 text-xs leading-relaxed mb-4">{top.aiNote}</p>
                          <button
                            onClick={() => setSelectedCandidate(top)}
                            className="w-full bg-white text-primary py-2.5 rounded-xl text-sm font-bold hover:bg-white/90 transition-colors shadow-md"
                          >
                            View Full Profile
                          </button>
                        </div>
                      );
                    })() : (
                      <div className="flex flex-col items-center justify-center py-10 text-white/80">
                        <p className="text-sm font-semibold">No candidates available</p>
                        <p className="text-xs text-white/60 mt-1">Check back later once candidates apply</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent candidates */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-black/[0.06] p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-black text-base text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Recent Applications</h3>
                      <button onClick={() => navigate("/recruiter/candidates")} className="text-xs text-secondary font-semibold hover:underline">View all</button>
                    </div>
                    {candidates.length > 0 ? (
                      <div className="space-y-3">
                        {candidates.slice(0, 5).map(c => (
                          <div
                            key={c.id}
                            onClick={() => setSelectedCandidate(c)}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <div className={`w-10 h-10 ${c.avatarBg || 'bg-primary'} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                              {c.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground">{c.name}</p>
                              <p className="text-xs text-muted-foreground">{c.experience} · {c.location || "No location"}</p>
                            </div>
                            <ScoreBadge score={c.cvScore} />
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#bae6fd] text-sky-700">
                              {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-black/[0.04] rounded-2xl text-muted-foreground">
                        <p className="text-sm font-semibold">No applications yet</p>
                        <p className="text-xs text-muted-foreground/80 mt-0.5">Job applications will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "View Reports", icon: BarChart2, color: "text-primary", bg: "bg-[#e9d5ff]", action: () => navigate("/recruiter/reports") },
                  { label: "Manage Jobs", icon: Briefcase, color: "text-secondary", bg: "bg-[#bae6fd]", action: () => setSubTab("jobs") },
                  { label: "Filter Pipelines", icon: Filter, color: "text-emerald-600", bg: "bg-[#b8f2e6]", action: () => navigate("/recruiter/pipeline") },
                  { label: "AI Recommendations", icon: Brain, color: "text-[#f472b6]", bg: "bg-[#fce7f3]", action: () => navigate("/recruiter/candidates") },
                ].map(({ label, icon: Icon, color, bg, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="bg-white rounded-2xl border border-black/[0.06] p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left group"
                  >
                    <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{label}</span>
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
              className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden shadow-sm"
            >
              <div className="p-4 bg-muted/30 border-b border-black/[0.06] flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span className="flex-1">Role / Department</span>
                <span className="w-32 hidden md:inline">Employment Type</span>
                <span className="w-28 text-center">Status</span>
                <span className="w-24 text-center">Applicants</span>
                <span className="w-40 text-right">Actions</span>
              </div>

              <div className="divide-y divide-black/[0.04]">
                {jobs.length > 0 ? (
                  jobs.map(job => {
                    const appCount = candidates.filter(
                      c => c.role.toLowerCase() === job.title.toLowerCase() || 
                           c.jobCategory.toLowerCase() === job.title.toLowerCase() ||
                           c.appliedJobs.some((aj: any) => aj.title.toLowerCase() === job.title.toLowerCase())
                    ).length;
                    return (
                      <div key={job.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors text-sm">
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="font-bold text-foreground truncate">{job.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{job.department} · {job.location || "Remote"}</p>
                        </div>
                        <div className="w-32 hidden md:inline text-muted-foreground text-xs font-semibold">
                          {job.employment_type}
                        </div>
                        <div className="w-28 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            job.status === "open" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                            job.status === "closed" ? "bg-red-50 text-red-600 border border-red-200" :
                            "bg-orange-50 text-orange-600 border border-orange-200"
                          }`}>
                            {job.status}
                          </span>
                        </div>
                        <div className="w-24 text-center font-bold text-foreground">
                          {appCount}
                        </div>
                        <div className="w-40 flex items-center justify-end gap-2 text-right">
                          <button
                            onClick={() => handleOpenEditModal(job)}
                            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit vacancy details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {job.status === "open" ? (
                            <button
                              onClick={() => handleToggleJobStatus(job, "closed")}
                              className="px-2.5 py-1 text-[11px] font-bold border border-red-200 text-red-600 bg-red-50/50 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all"
                            >
                              Close
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleJobStatus(job, "open")}
                              className="px-2.5 py-1 text-[11px] font-bold border border-emerald-200 text-emerald-600 bg-emerald-50/50 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                            >
                              Reopen
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="p-1.5 hover:bg-red-50 hover:text-destructive rounded-lg text-muted-foreground transition-colors"
                            title="Delete vacancy"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <p className="font-bold text-sm">No vacancies posted yet</p>
                    <p className="text-xs mt-0.5">Click 'Post Job' to create your first vacancy listing.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
