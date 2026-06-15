import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Brain, Star, Search, Filter, ChevronRight, XCircle, Mail, MapPin, Briefcase, Award, Download, ThumbsUp, ThumbsDown, AlertCircle, RefreshCw
} from "lucide-react";

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

export function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const fetchCandidates = () => {
    setLoading(true);
    setError(null);
    fetch("/api/recruiter/candidates", { headers: getAuthHeaders() })
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

      <div>
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Candidates Pool</h1>
        <p className="text-muted-foreground mt-1">Review all active applicants matching your job listings, ranked by AI matching score</p>
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
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-black/[0.08] rounded-xl text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all shadow-sm"
          />
        </div>
        <button className="flex items-center gap-2 bg-white border border-black/[0.08] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted shadow-sm">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Candidate Cards / List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm font-semibold">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            Fetching candidates list...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-red-100 rounded-3xl text-red-500">
            <AlertCircle className="w-10 h-10 mb-3 text-red-400" />
            <p className="font-bold">{error}</p>
            <button
              onClick={fetchCandidates}
              className="mt-4 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90"
            >
              <RefreshCw className="w-4 h-4" /> Retry
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
              className="bg-white rounded-2xl border border-black/[0.06] p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group hover:border-secondary/25"
            >
              {/* Rank */}
              <div className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center text-xs font-black text-muted-foreground flex-shrink-0">
                #{i + 1}
              </div>

              {/* Avatar */}
              <div className={`w-11 h-11 ${c.avatarBg || 'bg-primary'} rounded-2xl flex items-center justify-center text-white font-black flex-shrink-0`}>
                {c.avatar}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-sm">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-foreground">{c.name}</p>
                  {i === 0 && <span className="text-[10px] bg-[#ffd6a5] text-orange-700 font-bold px-2 py-0.5 rounded-full">AI Top Pick</span>}
                </div>
                <p className="text-xs text-muted-foreground">{c.experience} · {c.location || "No location"}</p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {c.skills.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] bg-[#e9d5ff] text-primary px-2 py-0.5 rounded-full font-semibold">{s}</span>
                  ))}
                  {c.skills.length > 3 && <span className="text-[10px] text-muted-foreground">+{c.skills.length - 3}</span>}
                </div>
              </div>

              {/* Scores */}
              <div className="hidden md:flex items-center gap-6 flex-shrink-0 text-xs">
                <div className="text-center">
                  <ScoreBadge score={c.cvScore} />
                  <p className="text-[10px] text-muted-foreground mt-1 font-semibold">CV Score</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-secondary">{c.hiringChance}%</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-semibold">Hire Prob.</p>
                </div>
              </div>

              {/* Status */}
              <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full bg-[#bae6fd] text-sky-700 flex-shrink-0`}>
                {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
              </span>

              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-black/[0.04] rounded-3xl text-muted-foreground">
            <p className="font-bold">No candidate matches found</p>
            <p className="text-xs mt-0.5">We couldn't find any candidate matches. Try expanding your search or jobs pool.</p>
          </div>
        )}
      </div>
    </div>
  );
}
