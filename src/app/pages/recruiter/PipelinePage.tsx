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
  submitted:  { next: ["screening"],  reject: true  },
  screening:  { next: ["interview"],  reject: true  },
  interview:  { next: ["offered"],    reject: true  },
  offered:    { next: ["accepted"],   reject: true  },
  accepted:   { next: [],             reject: false },
  rejected:   { next: [],             reject: false },
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
  { id: "submitted",  label: "Applied",    color: "border-sky-200 bg-sky-50",         badge: "bg-sky-100 text-sky-700",         step: 0 },
  { id: "screening",  label: "Screening",  color: "border-orange-200 bg-orange-50",   badge: "bg-orange-100 text-orange-700",   step: 1 },
  { id: "interview",  label: "Interview",  color: "border-violet-200 bg-violet-50",   badge: "bg-violet-100 text-violet-700",   step: 2 },
  { id: "offered",    label: "Offered",    color: "border-pink-200 bg-pink-50",       badge: "bg-pink-100 text-pink-700",       step: 3 },
  { id: "accepted",   label: "Accepted",   color: "border-emerald-200 bg-emerald-50", badge: "bg-emerald-100 text-emerald-700", step: 4 },
  { id: "rejected",   label: "Rejected",   color: "border-red-200 bg-red-50",         badge: "bg-red-100 text-red-600",         step: -1 },
];

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-[#bae6fd] text-sky-700",
  screening: "bg-[#ffd6a5] text-orange-700",
  interview: "bg-[#e9d5ff] text-violet-700",
  offered:   "bg-[#fbcfe8] text-pink-700",
  accepted:  "bg-[#b8f2e6] text-emerald-700",
  rejected:  "bg-[#fecdd3] text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Applied",
  screening: "Screening",
  interview: "Interview",
  offered:   "Offered",
  accepted:  "Accepted",
  rejected:  "Rejected",
};

const NEXT_LABEL: Record<string, string> = {
  submitted: "Move to Screening",
  screening: "Move to Interview",
  interview: "Move to Offered",
  offered:   "Accept Candidate",
};

const NEXT_COLOR: Record<string, string> = {
  submitted: "bg-orange-500 hover:bg-orange-600 text-white",
  screening: "bg-violet-500 hover:bg-violet-600 text-white",
  interview: "bg-pink-500 hover:bg-pink-600 text-white",
  offered:   "bg-emerald-500 hover:bg-emerald-600 text-white",
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
    <div className="space-y-2">
      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Recruitment Progress</p>
      <div className="flex items-center gap-1">
        {MAIN_STEPS.map((step, idx) => {
          const past = !isRejected && idx < currentIdx;
          const active = !isRejected && idx === currentIdx;
          const future = isRejected || idx > currentIdx;
          return (
            <div key={step} className="flex items-center gap-1 flex-1 min-w-0">
              <div className={`flex flex-col items-center flex-1 min-w-0`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all flex-shrink-0
                  ${active ? "bg-primary text-white ring-2 ring-primary/30" :
                    past ? "bg-emerald-500 text-white" :
                    "bg-muted text-muted-foreground"}`}>
                  {past ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <p className={`text-[8px] font-bold mt-0.5 truncate w-full text-center
                  ${active ? "text-primary" : past ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {STATUS_LABELS[step]}
                </p>
              </div>
              {idx < MAIN_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 rounded-full mt-[-12px] mx-[-2px] transition-all
                  ${past ? "bg-emerald-400" : "bg-muted"}`} />
              )}
            </div>
          );
        })}
      </div>
      {isRejected && (
        <div className="flex items-center gap-2 mt-1 text-xs text-red-600 font-semibold">
          <XCircle className="w-3.5 h-3.5" /> Candidate was rejected from the process
        </div>
      )}
    </div>
  );
}

// ─── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? "bg-[#b8f2e6] text-emerald-700" : score >= 75 ? "bg-[#e9d5ff] text-primary" : "bg-[#ffd6a5] text-orange-700";
  return <span className={`${color} text-xs font-black px-2 py-0.5 rounded-full`}>{score}</span>;
}

// ─── Candidate detail panel ────────────────────────────────────────────────────

function CandidateDetailPanel({ candidate, onClose, onMove, loading }: {
  candidate: Candidate;
  onClose: () => void;
  onMove: (candidateId: string, newStatus: string) => Promise<void>;
  loading: boolean;
}) {
  const workflow = WORKFLOW[candidate.status];
  const isFinal = candidate.status === "accepted" || candidate.status === "rejected";
  const nextStatus = workflow?.next[0] ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white border-l border-black/[0.06] z-50 overflow-y-auto shadow-2xl"
    >
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${candidate.avatarBg || 'bg-primary'} rounded-2xl flex items-center justify-center text-white font-black text-lg`}>
              {candidate.avatar}
            </div>
            <div>
              <h2 className="font-black text-xl text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{candidate.name}</h2>
              <p className="text-muted-foreground text-sm">{candidate.role}</p>
              <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[candidate.status] || 'bg-muted text-muted-foreground'}`}>
                {STATUS_LABELS[candidate.status] ?? candidate.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Workflow stepper */}
        <div className="bg-[#f8f8fc] rounded-2xl p-4 border border-black/[0.04]">
          <WorkflowStepper status={candidate.status} />
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

        {/* Match Analysis bars */}
        <div>
          <h3 className="font-black text-sm text-foreground mb-3" style={{ fontFamily: 'var(--font-display)' }}>Match Analysis</h3>
          <div className="space-y-3">
            {[
              { label: "Technical Skills Match",        score: candidate.cvScore || 0,               color: "bg-primary" },
              { label: "AI Cultural Fit Prediction",    score: candidate.culturalFitScore || 70,     color: "bg-secondary" },
              { label: "AI Communication Assessment",   score: candidate.communicationScore || 70,   color: "bg-[#f472b6]" },
              { label: "Experience Relevance Alignment",score: candidate.skillScore || 60,            color: "bg-[#4ade80]" },
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

        {/* ── Workflow Actions ─────────────────────────────── */}
        <div className="space-y-3 pt-1">
          <h3 className="font-black text-sm text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Actions</h3>

          {isFinal ? (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold
              ${candidate.status === "accepted"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-600 border border-red-200"}`}>
              {candidate.status === "accepted"
                ? <><CheckCircle2 className="w-4 h-4" /> Candidate accepted — final stage</>
                : <><XCircle className="w-4 h-4" /> Candidate rejected — final stage</>}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Primary: advance to next stage */}
              {nextStatus && (
                <button
                  disabled={loading}
                  onClick={() => onMove(candidate.id, nextStatus)}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed
                    ${NEXT_COLOR[candidate.status] || "bg-primary hover:bg-primary/90 text-white"}`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  {NEXT_LABEL[candidate.status] ?? `Move to ${STATUS_LABELS[nextStatus]}`}
                </button>
              )}

              {/* Secondary: reject */}
              {workflow?.reject && (
                <button
                  disabled={loading}
                  onClick={() => onMove(candidate.id, "rejected")}
                  className="w-full flex items-center justify-center gap-2 bg-[#fecdd3] text-red-700 py-3 rounded-xl font-bold text-sm hover:bg-[#fca5a5] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <ThumbsDown className="w-4 h-4" /> Reject Candidate
                </button>
              )}

              {/* Stage hint */}
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                {candidate.status === "submitted" && "Only 'Accepted' is reachable from Offered stage onwards."}
                {candidate.status === "offered" && "You may now Accept or Reject this candidate."}
              </p>
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
            className="w-full flex items-center justify-center gap-2 bg-secondary text-white py-3 rounded-xl font-bold text-sm hover:bg-secondary/90 transition-colors"
          >
            <Download className="w-4 h-4" /> View CV
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
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-red-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-semibold max-w-lg text-center"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
      <div>
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Recruitment Pipeline</h1>
        <p className="text-muted-foreground mt-1">
          Structured workflow: <span className="font-semibold text-foreground">Applied → Screening → Interview → Offered → Accepted/Rejected</span>
        </p>
      </div>

      {/* Workflow guide */}
      <div className="bg-[#f8f8fc] border border-black/[0.06] rounded-2xl px-5 py-3 flex flex-wrap gap-2 items-center text-xs font-semibold text-muted-foreground">
        <span className="text-sky-600 font-bold">Applied</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-orange-600 font-bold">Screening</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-violet-600 font-bold">Interview</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-pink-600 font-bold">Offered</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-emerald-600 font-bold">Accepted</span>
        <span className="mx-2 text-muted-foreground/40">or</span>
        <span className="text-red-500 font-bold">Rejected</span>
        <span className="ml-auto text-[10px] text-muted-foreground/60">Drag cards only to valid next stages • Click card to open detail panel</span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground text-sm font-semibold">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
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
                  className={`w-64 rounded-2xl border-2 p-4 flex flex-col min-h-[450px] transition-all
                    ${col.color}
                    ${isHovered && isValidDrop ? "ring-2 ring-secondary/60 scale-[1.01]" : ""}
                    ${isHovered && !isValidDrop ? "ring-2 ring-red-400/60 opacity-70" : ""}
                  `}
                  onDragOver={e => {
                    e.preventDefault();
                    setDragOverCol(col.id);
                  }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={e => handleDrop(e, col.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-sm text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{col.label}</h3>
                    <span className={`${col.badge} text-xs font-bold px-2 py-0.5 rounded-full`}>{colCandidates.length}</span>
                  </div>

                  {/* Valid-drop hint */}
                  {isHovered && (
                    <div className={`mb-2 text-[10px] font-semibold text-center py-1 rounded-lg
                      ${isValidDrop ? "bg-secondary/10 text-secondary" : "bg-red-100 text-red-600"}`}>
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
                        className="bg-white rounded-xl p-4 border border-black/[0.06] cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing hover:border-secondary/35 group"
                      >
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className={`w-8 h-8 ${c.avatarBg || 'bg-primary'} rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {c.avatar}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-foreground truncate">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{c.experience}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <ScoreBadge score={c.cvScore} />
                          <span className="text-muted-foreground font-medium">{c.appliedDate}</span>
                        </div>

                        <div className="mt-2.5 flex gap-1 flex-wrap">
                          {c.skills.slice(0, 2).map(s => (
                            <span key={s} className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">{s}</span>
                          ))}
                        </div>

                        <div className="mt-2 pt-2 border-t border-black/[0.04] flex items-center justify-between text-[9px] text-muted-foreground font-semibold">
                          <span>Chance: <strong className="text-secondary">{c.hiringChance}%</strong></span>
                          {/* Quick-action hint — show next step label on hover */}
                          {!["accepted", "rejected"].includes(c.status) && (
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary">
                              {NEXT_LABEL[c.status] ? `→ ${NEXT_LABEL[c.status].replace("Move to ", "")}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {colCandidates.length === 0 && (
                      <div className="text-center py-10 text-muted-foreground text-xs italic">
                        {dragCandidateId && dragOverCol === col.id && !isValidDrop
                          ? "❌ Invalid drop"
                          : "Drop candidates here"}
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
