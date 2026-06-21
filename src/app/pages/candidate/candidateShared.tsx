import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  XCircle,
} from "lucide-react";

// ─── CVUploadArea ─────────────────────────────────────────────────────────────

export function CVUploadArea({
  onAnalyze,
  onFileSelect,
}: {
  onAnalyze: () => void;
  onFileSelect: (file: File) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        setFileName(file.name);
        setUploaded(true);
        onFileSelect(file);
      }
    },
    [onFileSelect],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setUploaded(true);
      onFileSelect(file);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative border border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
        isDragging
          ? "border-[#0052CC] bg-[#0052CC]/[0.02] scale-[1.01]"
          : "border-black/15 hover:border-black/40 hover:bg-black/[0.01]"
      } ${uploaded ? "border-[#0052CC]/20 bg-[#F9F9F7]" : ""}`}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.doc,.txt"
        className="hidden"
      />
      <AnimatePresence mode="wait">
        {uploaded ? (
          <motion.div
            key="uploaded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-12 h-12 border border-black/10 bg-white rounded-lg flex items-center justify-center mb-3 shadow-sm">
              <CheckCircle className="w-6 h-6 text-black" />
            </div>
            <p className="font-bold text-black font-mono text-sm">
              {fileName || "Sarah_Johnson_CV.pdf"}
            </p>
            <p className="text-xs text-black/50 font-mono mt-1">
              // ATTACHMENT_STATUS: READY_FOR_ANALYSIS
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div
              className={`w-12 h-12 border border-black/10 rounded-lg flex items-center justify-center mb-4 transition-colors bg-[#F9F9F7] shadow-sm`}
            >
              <Upload
                className="w-5 h-5 text-black"
              />
            </div>
            <p className="font-bold text-black tracking-tight mb-1">Upload your curriculum vitae</p>
            <p className="text-xs text-black/50">
              Drag & drop or click to upload (PDF, DOCX, TXT max 5MB)
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ScoreRing ────────────────────────────────────────────────────────────────

export function ScoreRing({
  score,
  size = 120,
  strokeWidth = 10,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color = score >= 80 ? "#0052CC" : score >= 60 ? "#ff8f00" : "#b71c1c";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f0f0f8"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-black"
          style={{ color, fontFamily: "var(--font-display)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground font-medium">/ 100</span>
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const STATUS_CONFIG = {
  submitted: {
    label: "Submitted",
    color: "bg-[#0052CC]/5 text-[#0052CC] border border-[#0052CC]/15 shadow-sm",
    icon: Clock,
  },
  screening: {
    label: "Screening",
    color: "bg-[#ff8f00]/5 text-[#ff8f00] border border-[#ff8f00]/15 shadow-sm",
    icon: Eye,
  },
  interview: {
    label: "Interview",
    color: "bg-[#6200ee]/5 text-[#6200ee] border border-[#6200ee]/15 shadow-sm",
    icon: MessageSquare,
  },
  accepted: {
    label: "Accepted",
    color: "bg-[#1b5e20]/5 text-[#1b5e20] border border-[#1b5e20]/15 shadow-sm",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-[#b71c1c]/5 text-[#b71c1c] border border-[#b71c1c]/15 shadow-sm",
    icon: XCircle,
  },
};

export const PIPELINE_STEPS = [
  "submitted",
  "screening",
  "interview",
  "accepted",
];

export const JOB_MATCHES = [
  {
    role: "Lead UX Designer",
    company: "Airbnb",
    salary: "$140–170K",
    match: 96,
    tags: ["Remote", "Full-time"],
    logo: "A",
    logoColor: "bg-[#ff385c]",
  },
  {
    role: "Product Designer II",
    company: "Spotify",
    salary: "$120–145K",
    match: 92,
    tags: ["Hybrid", "Full-time"],
    logo: "S",
    logoColor: "bg-[#1db954]",
  },
  {
    role: "Senior UI Designer",
    company: "Duolingo",
    salary: "$115–135K",
    match: 89,
    tags: ["On-site", "Full-time"],
    logo: "D",
    logoColor: "bg-[#58cc02]",
  },
];

export const TEMPLATES = [
  {
    id: "harvard",
    name: "Harvard Resume",
    desc: "Traditional, serif-based template preferred by top universities and investment firms.",
    style: "font-serif bg-white text-black border border-gray-200",
  },
  {
    id: "ats_friendly",
    name: "ATS Friendly Resume",
    desc: "Clean, standard layout designed specifically to be parsed flawlessly by scanners.",
    style: "font-sans bg-white text-black border border-gray-200",
  },
];
