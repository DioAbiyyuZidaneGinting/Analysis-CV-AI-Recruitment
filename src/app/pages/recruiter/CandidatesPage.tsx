import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Brain, Star, Search, Filter, ChevronRight, XCircle, Mail, MapPin, Briefcase, Award, Download, ThumbsUp, ThumbsDown, AlertCircle, RefreshCw, X
} from "lucide-react";
import { apiUrl } from "../../utils/apiConfig";

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
                {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
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
              {label: "Technical Skills Match", score: candidate.cvScore || 0, color: "bg-[#0052CC]"},
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
            )) : <span className="text-slate-400 text-xs italic">No skills analyzed</span>}
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
                alert("Failed to download CV: " + (data.error || "No CV uploaded or access denied"));
              }
            } catch (err) {
              console.error(err);
              alert("Error downloading CV");
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

export function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const fetchCandidates = () => {
    setLoading(true);
    setError(null);
    fetch(apiUrl("/api/recruiter/candidates"), { headers: getAuthHeaders() })
      .then(res => {
        if (!res.ok) {
          throw new Error("Failed to fetch candidates");
        }
        return res.json();
      })
      .then(data => {
        setCandidates(data.candidates || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching candidates pool:", err);
        setError(err.message || "Error fetching candidates");
        setCandidates([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCandidates();
    const interval = setInterval(fetchCandidates, 10000); // Polling every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (candidateId: string, action: "accepted" | "rejected") => {
    try {
      const res = await fetch(apiUrl(`/api/recruiter/candidate/${candidateId}/action`), {
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

  const filtered = candidates.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <div className="border-b border-black/[0.08] pb-4">
        <h1 className="text-xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Candidates Pool</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Review all active applicants matching your job listings, ranked by AI matching score</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search candidates by name or role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-black/[0.08] rounded-xl text-sm font-sans focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/20 transition-all shadow-sm placeholder:text-muted-foreground/60"
          />
        </div>
        <button className="flex items-center gap-2 bg-white border border-black/[0.08] px-4 py-2.5 rounded-xl text-sm font-sans hover:bg-black/[0.02] shadow-sm font-bold transition-colors">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" /> Filter
        </button>
      </div>

      {/* Candidate Cards / List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm font-sans font-semibold">
            <div className="w-6 h-6 border-2 border-[#0052CC]/30 border-t-[#0052CC] rounded-full animate-spin mx-auto mb-4" />
            Fetching candidates list...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-red-200 rounded-xl text-red-500 bg-red-50/20">
            <AlertCircle className="w-8 h-8 mb-3 text-red-400" />
            <p className="font-sans text-sm font-bold">{error}</p>
            <button
              onClick={fetchCandidates}
              className="mt-4 flex items-center gap-2 bg-[#0052CC] hover:bg-[#0052CC]/90 text-white px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-bold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        ) : filtered.length > 0 ? (
          [...filtered].sort((a, b) => b.cvScore - a.cvScore).map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedCandidate(c)}
              className="bg-white rounded-xl border border-black/[0.08] p-5 flex items-center gap-4 hover:shadow-md hover:border-black/20 transition-all cursor-pointer group"
            >
              {/* Rank */}
              <div className="w-7 h-7 bg-black/[0.04] border border-black/[0.08] rounded flex items-center justify-center text-[10px] font-mono font-bold text-muted-foreground flex-shrink-0">
                #{i + 1}
              </div>

              {/* Avatar */}
              <div className={`w-11 h-11 ${c.avatarBg || 'bg-[#0052CC]'} flex items-center justify-center text-white font-black flex-shrink-0`} style={{ borderRadius: '0.625rem' }}>
                {c.avatar}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-xs">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-foreground text-sm">{c.name}</p>
                  {i === 0 && (
                    <span className="text-[9px] bg-amber-500/10 text-amber-700 border border-amber-500/20 font-bold px-2 py-0.5 rounded-full">
                      AI Top Pick
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs mt-0.5">{c.experience} · {c.location || "No location"}</p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {c.skills.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] bg-[#0052CC]/[0.06] text-[#0052CC] border border-[#0052CC]/15 px-2.5 py-0.5 rounded-full font-bold">{s}</span>
                  ))}
                  {c.skills.length > 3 && <span className="text-[10px] text-muted-foreground font-semibold">+{c.skills.length - 3}</span>}
                </div>
              </div>

              {/* Scores */}
              <div className="hidden md:flex items-center gap-6 flex-shrink-0 text-xs">
                <div className="text-center font-mono">
                  <ScoreBadge score={c.cvScore} />
                  <p className="text-[10px] text-muted-foreground mt-1 font-bold font-sans">CV Score</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-slate-700">{c.hiringChance}%</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-bold">Hire Prob.</p>
                </div>
              </div>

              {/* Status */}
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#0052CC]/[0.06] text-[#0052CC] border border-[#0052CC]/15 flex-shrink-0">
                {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
              </span>

              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-black/[0.08] rounded-xl text-muted-foreground bg-black/[0.01]">
            <p className="font-bold text-sm text-foreground">No candidate matches found</p>
            <p className="text-xs text-muted-foreground mt-1">Try expanding your search query or jobs pool.</p>
          </div>
        )}
      </div>
    </div>
  );
}
