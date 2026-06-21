import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Brain, Star, XCircle, Mail, MapPin, Briefcase, Award, Download,
  ThumbsUp, ThumbsDown, ArrowRight, CheckCircle2, ChevronRight, AlertCircle
} from "lucide-react";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Workflow definition ───────────────────────────────────────────────────────
// Each stage maps to its allowed next transitions.
// "accepted" and "rejected" are final states — no further transitions.
const WORKFLOW: Record<string, { next: string[]; reject: boolean }> = {
  submitted: { next: ["screening"], reject: true },
  screening: { next: ["interview"], reject: true },
  interview: { next: ["offered"], reject: true },
  offered: { next: ["accepted"], reject: true },
  accepted: { next: [], reject: false },
  rejected: { next: [], reject: false },
};

// All statuses that a drag-drop into a column is valid from.
// A candidate can only be dragged TO a column that is a valid next step for their current status.
function isValidTransition(fromStatus: string, toStatus: string): boolean {
  if (fromStatus === toStatus) return true;
  const allowed = WORKFLOW[fromStatus]?.next ?? [];
  // Also allow reject from any non-final stage
  if (toStatus === "rejected" && WORKFLOW[fromStatus]?.reject) return true;
  return allowed.includes(toStatus);
}

// ─── Pipeline columns config ───────────────────────────────────────────────────
const PIPELINE_COLUMNS = [
  { id: "submitted", label: "Applied", accent: "bg-[#0052CC]", text: "text-[#0052CC]", border: "border-t-[#0052CC]", badge: "bg-[#0052CC]/[0.08] text-[#0052CC] border-[#0052CC]/15" },
  { id: "screening", label: "Screening", accent: "bg-amber-500", text: "text-amber-600", border: "border-t-amber-500", badge: "bg-amber-500/[0.08] text-amber-700 border-amber-500/15" },
  { id: "interview", label: "Interview", accent: "bg-violet-500", text: "text-violet-600", border: "border-t-violet-500", badge: "bg-violet-500/[0.08] text-violet-700 border-violet-500/15" },
  { id: "offered", label: "Offered", accent: "bg-pink-500", text: "text-pink-600", border: "border-t-pink-500", badge: "bg-pink-500/[0.08] text-pink-700 border-pink-500/15" },
  { id: "accepted", label: "Accepted", accent: "bg-emerald-500", text: "text-emerald-600", border: "border-t-emerald-500", badge: "bg-emerald-500/[0.08] text-emerald-700 border-emerald-500/15" },
  { id: "rejected", label: "Rejected", accent: "bg-rose-500", text: "text-rose-600", border: "border-t-rose-500", badge: "bg-rose-500/[0.08] text-rose-700 border-rose-500/15" },
];

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-[#0052CC]/[0.06] text-[#0052CC] border border-[#0052CC]/15",
  screening: "bg-amber-500/[0.06] text-amber-700 border border-amber-500/15",
  interview: "bg-violet-500/[0.06] text-violet-700 border border-violet-500/15",
  offered: "bg-pink-500/[0.06] text-pink-700 border border-pink-500/15",
  accepted: "bg-emerald-500/[0.06] text-emerald-700 border border-emerald-500/15",
  rejected: "bg-rose-500/[0.06] text-rose-700 border border-rose-500/15",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Applied",
  screening: "Screening",
  interview: "Interview",
  offered: "Offered",
  accepted: "Accepted",
  rejected: "Rejected",
};

const NEXT_LABEL: Record<string, string> = {
  submitted: "Move to Screening",
  screening: "Move to Interview",
  interview: "Move to Offered",
  offered: "Accept Candidate",
};

const NEXT_COLOR: Record<string, string> = {
  submitted: "bg-amber-600 hover:bg-amber-700 text-white shadow-sm",
  screening: "bg-violet-600 hover:bg-violet-700 text-white shadow-sm",
  interview: "bg-pink-600 hover:bg-pink-700 text-white shadow-sm",
  offered: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
};

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Workflow stepper in detail panel ─────────────────────────────────────────

const MAIN_STEPS = ["submitted", "screening", "interview", "offered", "accepted"];

function WorkflowStepper({ status }: { status: string }) {
  const isRejected = status === "rejected";
  const currentIdx = isRejected ? -1 : MAIN_STEPS.indexOf(status);

  return (
    <div className="space-y-3">
      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider font-mono">Recruitment Process</p>
      <div className="flex items-center gap-1">
        {MAIN_STEPS.map((step, idx) => {
          const past = !isRejected && idx < currentIdx;
          const active = !isRejected && idx === currentIdx;
          const future = isRejected || idx > currentIdx;
          return (
            <div key={step} className="flex items-center gap-1 flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div className={`w-5 h-5 rounded border flex items-center justify-center text-[9px] font-mono font-bold transition-all flex-shrink-0
                  ${active ? "bg-[#0052CC] text-white border-[#0052CC] shadow-[0_0_8px_rgba(0,82,204,0.3)]" :
                    past ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" :
                      "bg-black/[0.02] text-muted-foreground border-black/[0.08]"}`}>
                  {past ? "✓" : `0${idx + 1}`}
                </div>
                <p className={`text-[8px] font-mono font-bold mt-1.5 truncate w-full text-center uppercase tracking-wider
                  ${active ? "text-[#0052CC]" : past ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {STATUS_LABELS[step]}
                </p>
              </div>
              {idx < MAIN_STEPS.length - 1 && (
                <div className={`h-[1px] flex-1 mt-[-16px] mx-[-1px] transition-all
                  ${past ? "bg-emerald-400" : "bg-black/[0.08]"}`} />
              )}
            </div>
          );
        })}
      </div>
      {isRejected && (
        <div className="flex items-center gap-2 mt-2 text-[10px] text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded font-mono uppercase font-bold">
          <XCircle className="w-3.5 h-3.5" /> Candidate was rejected
        </div>
      )}
    </div>
  );
}

// ─── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90
    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
    : score >= 75
      ? "bg-[#0052CC]/10 text-[#0052CC] border-[#0052CC]/20"
      : "bg-amber-500/10 text-amber-700 border-amber-500/20";
  return (
    <span className={`${color} text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider`}>
      {score}
    </span>
  );
}

function CandidateDetailPanel({ candidate, onClose, onMove, loading, showToast }: {
  candidate: Candidate;
  onClose: () => void;
  onMove: (candidateId: string, newStatus: string) => Promise<void>;
  loading: boolean;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const workflow = WORKFLOW[candidate.status];
  const isFinal = candidate.status === "accepted" || candidate.status === "rejected";
  const nextStatus = workflow?.next[0] ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white border-l border-black/[0.08] z-50 overflow-y-auto shadow-2xl"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#0052CC]/[0.08] border border-[#0052CC]/15 rounded-lg flex items-center justify-center text-[#0052CC] font-mono font-bold text-lg">
              {candidate.avatar}
            </div>
            <div>
              <h2 className="font-black text-lg text-foreground leading-tight" style={{ fontFamily: 'var(--font-display)' }}>{candidate.name}</h2>
              <p className="text-muted-foreground text-xs mt-0.5">{candidate.role}</p>
              <span className={`inline-block mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[candidate.status] || 'bg-muted text-muted-foreground border border-black/[0.08]'}`}>
                {STATUS_LABELS[candidate.status] ?? candidate.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow stepper */}
        <div className="bg-black/[0.01] border border-black/[0.08] rounded-lg p-4">
          <WorkflowStepper status={candidate.status} />
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-2 gap-3 text-xs border border-black/[0.08] rounded-lg p-3 bg-black/[0.01]">
          {[
            { icon: Mail, text: candidate.email },
            { icon: MapPin, text: candidate.location || "No location provided" },
            { icon: Briefcase, text: candidate.experience || "No experience details" },
            { icon: Award, text: candidate.salary ? `${candidate.salary} expected` : "Salary not specified" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-muted-foreground">
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate text-xs font-medium">{text}</span>
            </div>
          ))}
        </div>

        {/* AI Evaluation */}
        <div className="bg-[#0052CC]/[0.02] border border-[#0052CC]/12 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-[#0052CC]" />
            <h3 className="font-black text-xs text-[#0052CC] uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>AI Evaluation Summary</h3>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed font-sans">{candidate.aiNote}</p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white rounded-lg p-3 text-center border border-black/[0.06]">
              <p className="text-xl font-black text-[#0052CC]" style={{ fontFamily: 'var(--font-display)' }}>{candidate.cvScore}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">CV Score</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-black/[0.06]">
              <p className="text-xl font-black text-slate-700" style={{ fontFamily: 'var(--font-display)' }}>{candidate.atsScore}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">ATS Score</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-black/[0.06]">
              <p className="text-xl font-black text-emerald-600" style={{ fontFamily: 'var(--font-display)' }}>{candidate.hiringChance}%</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Hiring Chance</p>
            </div>
          </div>
        </div>

        {/* Match Analysis */}
        <div className="space-y-4">
          <h3 className="font-black text-xs text-foreground uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Match Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: "Technical Skills Match", score: candidate.cvScore || 0, color: "bg-[#0052CC]" },
              { label: "AI Cultural Fit Prediction", score: candidate.culturalFitScore || 70, color: "bg-slate-700" },
              { label: "AI Communication Assessment", score: candidate.communicationScore || 70, color: "bg-pink-600" },
              { label: "Experience Relevance Alignment", score: candidate.skillScore || 60, color: "bg-emerald-500" },
            ].map(({ label, score, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground text-[10px]">{label}</span>
                  <span className="font-bold text-foreground text-[10px]">{score}%</span>
                </div>
                <div className="h-1 bg-black/[0.04] rounded-full overflow-hidden">
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
        <div className="space-y-3">
          <h3 className="font-black text-xs text-foreground uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Skills</h3>
          <div className="flex flex-wrap gap-2">
            {candidate.skills && candidate.skills.length > 0 ? candidate.skills.map((skill: string) => (
              <span key={skill} className="bg-[#0052CC]/[0.06] text-[#0052CC] border border-[#0052CC]/15 text-[10px] font-bold px-2.5 py-1 rounded-full">
                {skill}
              </span>
            )) : <span className="text-muted-foreground text-xs italic">No skills analyzed</span>}
          </div>
        </div>

        {/* Workflow Actions */}
        <div className="space-y-3 pt-4 border-t border-black/[0.08]">
          <h3 className="font-black text-xs text-foreground uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Actions</h3>

          {isFinal ? (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold
              ${candidate.status === "accepted"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
              {candidate.status === "accepted"
                ? <><CheckCircle2 className="w-4 h-4" /> Candidate Accepted — Final stage</>
                : <><XCircle className="w-4 h-4" /> Candidate Rejected — Final stage</>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {/* Primary: advance to next stage */}
              {nextStatus && (
                <button
                  disabled={loading}
                  onClick={() => onMove(candidate.id, nextStatus)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-sm
                    ${NEXT_COLOR[candidate.status] || "bg-[#0052CC] hover:bg-[#0052CC]/90"}`}
                >
                  {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                  {NEXT_LABEL[candidate.status] ? NEXT_LABEL[candidate.status] : `Move to ${STATUS_LABELS[nextStatus]}`}
                </button>
              )}

              {/* Secondary: reject */}
              {workflow?.reject && (
                <button
                  disabled={loading}
                  onClick={() => onMove(candidate.id, "rejected")}
                  className="flex items-center justify-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <ThumbsDown className="w-3.5 h-3.5" /> Reject
                </button>
              )}
            </div>
          )}

          {/* CV download — always available */}
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
            className="w-full flex items-center justify-center gap-2 border border-black/[0.08] bg-black/[0.02] text-black hover:bg-black/[0.05] py-2.5 rounded-lg text-sm font-bold transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> View Resume
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main pipeline page ────────────────────────────────────────────────────────

export function PipelinePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [dragCandidateId, setDragCandidateId] = useState<string | null>(null);
  const [invalidDropMsg, setInvalidDropMsg] = useState<string | null>(null);

  const normalizeCandidates = (data: Candidate[]): Candidate[] =>
    data.map(c => {
      let status = c.status ? c.status.toLowerCase().trim() : "submitted";
      if (status === "applied") status = "submitted";
      return { ...c, status };
    });

  const fetchCandidates = () => {
    setLoading(true);
    fetch("/api/recruiter/candidates", { headers: getAuthHeaders() })
      .then(res => res.ok ? res.json() : { candidates: [] })
      .then(data => {
        const normalized = normalizeCandidates(data.candidates || []);
        setCandidates(normalized);
        setSelectedCandidate(prev => {
          if (!prev) return null;
          const updated = normalized.find(c => c.id === prev.id);
          return updated || prev;
        });
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching pipeline candidates:", err);
        setCandidates([]);
        setLoading(false);
      });
  };

  useEffect(() => { fetchCandidates(); }, []);

  // Called from both detail panel buttons and drag-drop
  const handleMove = async (candidateId: string, newStatus: string) => {
    setActionLoading(true);
    // Optimistic update
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: newStatus } : c));
    if (selectedCandidate?.id === candidateId) {
      setSelectedCandidate(prev => prev ? { ...prev, status: newStatus } : null);
    }

    try {
      const res = await fetch(`/api/recruiter/candidate/${candidateId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ action: newStatus })
      });
      if (!res.ok) {
        alert("Failed to update pipeline stage on server");
        fetchCandidates(); // rollback
      }
    } catch (err) {
      console.error("Error moving candidate:", err);
      alert("Network error updating status");
      fetchCandidates(); // rollback
    } finally {
      setActionLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    setDragOverCol(null);
    const cid = e.dataTransfer.getData("candidateId");
    if (!cid) return;
    const candidate = candidates.find(c => c.id === cid);
    if (!candidate) return;

    if (!isValidTransition(candidate.status, colId)) {
      setInvalidDropMsg(
        `Cannot move from "${STATUS_LABELS[candidate.status]}" to "${STATUS_LABELS[colId]}". ` +
        `Only valid next step from ${STATUS_LABELS[candidate.status]} is: ` +
        (WORKFLOW[candidate.status]?.next.map(s => STATUS_LABELS[s]).join(", ") || "none") +
        (WORKFLOW[candidate.status]?.reject ? " or Rejected." : ".")
      );
      setTimeout(() => setInvalidDropMsg(null), 4000);
      return;
    }

    if (colId !== candidate.status) {
      handleMove(cid, colId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Invalid drop toast */}
      <AnimatePresence>
        {invalidDropMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider max-w-lg text-center"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {invalidDropMsg}
          </motion.div>
        )}
      </AnimatePresence>

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
              onMove={handleMove}
              loading={actionLoading}
            />
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b border-black/[0.08] pb-4">
        <h1 className="text-xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Recruitment Pipeline</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Structured workflow tracking candidate advancement from application to placement</p>
      </div>

      {/* Workflow guide */}
      <div className="bg-black/[0.01] border border-black/[0.08] rounded-xl px-4 py-3.5 flex flex-wrap gap-2 items-center text-xs font-sans font-bold text-muted-foreground">
        <span className="text-[#0052CC]">01. Applied</span>
        <ChevronRight className="w-3 h-3 text-muted-foreground/45" />
        <span className="text-amber-600">02. Screening</span>
        <ChevronRight className="w-3 h-3 text-muted-foreground/45" />
        <span className="text-violet-600">03. Interview</span>
        <ChevronRight className="w-3 h-3 text-muted-foreground/45" />
        <span className="text-pink-600">04. Offered</span>
        <ChevronRight className="w-3 h-3 text-muted-foreground/45" />
        <span className="text-emerald-600">05. Accepted</span>
        <span className="mx-1 text-muted-foreground/35">/</span>
        <span className="text-rose-600">Rejected</span>
        <span className="ml-auto text-[10px] text-muted-foreground/60 font-medium font-sans">Drag cards only to valid next stages · Click card to open detail panel</span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground text-sm font-sans font-semibold">
          <div className="w-6 h-6 border-2 border-[#0052CC]/30 border-t-[#0052CC] rounded-full animate-spin mx-auto mb-4" />
          Loading recruitment pipeline...
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {PIPELINE_COLUMNS.map(col => {
              const colCandidates = candidates.filter(c => c.status === col.id);

              // When a drag is in progress, determine if this column is a valid drop target
              const dragCandidate = dragCandidateId ? candidates.find(c => c.id === dragCandidateId) : null;
              const isValidDrop = dragCandidate ? isValidTransition(dragCandidate.status, col.id) : true;
              const isHovered = dragOverCol === col.id;

              return (
                <div
                  key={col.id}
                  className={`w-64 rounded-xl border p-4 flex flex-col min-h-[480px] transition-all bg-black/[0.01] border-black/[0.08]
                    ${isHovered && isValidDrop ? "border-[#0052CC] bg-[#0052CC]/[0.02] shadow-[0_0_15px_rgba(0,82,204,0.06)] scale-[1.01]" : ""}
                    ${isHovered && !isValidDrop ? "border-rose-300 bg-rose-50/[0.1] opacity-70" : ""}
                  `}
                  onDragOver={e => {
                    e.preventDefault();
                    setDragOverCol(col.id);
                  }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={e => handleDrop(e, col.id)}
                >
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/[0.06]">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.accent}`} />
                      <h3 className="font-black text-xs uppercase tracking-wide text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{col.label}</h3>
                    </div>
                    <span className={`${col.badge} text-[10px] font-bold px-2 py-0.5 rounded-full border`}>{colCandidates.length}</span>
                  </div>

                  {/* Valid-drop hint */}
                  {isHovered && (
                    <div className={`mb-3 text-[10px] font-sans font-bold text-center py-1.5 rounded-lg border
                      ${isValidDrop ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                      {isValidDrop ? `✓ Drop here` : `✗ Invalid transition`}
                    </div>
                  )}

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                    {colCandidates.map(c => (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData("candidateId", c.id);
                          setDragCandidateId(c.id);
                        }}
                        onDragEnd={() => setDragCandidateId(null)}
                        onClick={() => setSelectedCandidate(c)}
                        className="bg-white rounded-xl p-3.5 border border-black/[0.08] cursor-grab hover:shadow-md transition-all active:cursor-grabbing hover:border-[#0052CC]/40 hover:scale-[1.01] group relative"
                      >
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <div className="w-8 h-8 bg-[#0052CC]/[0.06] border border-[#0052CC]/12 rounded-lg flex items-center justify-center text-[#0052CC] font-mono font-bold text-xs flex-shrink-0">
                            {c.avatar}
                          </div>
                          <div className="min-w-0 flex-1 text-xs">
                            <p className="font-bold text-black truncate leading-snug">{c.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{c.role}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs mb-2">
                          <ScoreBadge score={c.cvScore} />
                          <span className="text-muted-foreground/70 text-[10px] font-medium">{c.appliedDate}</span>
                        </div>

                        <div className="flex gap-1 flex-wrap mb-2.5">
                          {c.skills.slice(0, 2).map(s => (
                            <span key={s} className="text-[10px] bg-black/[0.03] text-muted-foreground border border-black/[0.05] px-1.5 py-0.5 rounded-full font-bold">{s}</span>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-[10px] text-muted-foreground font-sans font-bold">
                          <span>Chance: <strong className="text-[#0052CC]">{c.hiringChance}%</strong></span>
                          {/* Quick-action hint — show next step label on hover */}
                          {!["accepted", "rejected"].includes(c.status) && (
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#0052CC] text-[9px] uppercase tracking-wider font-mono">
                              {NEXT_LABEL[c.status] ? `→ ${NEXT_LABEL[c.status].replace("Move to ", "")}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {colCandidates.length === 0 && (
                      <div className="text-center py-10 text-muted-foreground/60 text-xs flex flex-col items-center justify-center gap-1.5 border border-dashed border-black/[0.08] rounded-xl bg-black/[0.005] h-full min-h-[150px]">
                        {dragCandidateId && dragOverCol === col.id && !isValidDrop ? (
                          <span className="text-rose-600 font-bold text-[10px] font-sans">❌ Invalid drop</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 font-sans">Empty Stage</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
