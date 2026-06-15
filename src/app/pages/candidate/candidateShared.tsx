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
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
        isDragging
          ? "border-primary bg-[#f0f0ff] scale-[1.01]"
          : "border-black/20 hover:border-primary/50 hover:bg-muted/50"
      } ${uploaded ? "border-primary bg-[#f0f0ff]" : ""}`}
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
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-14 h-14 bg-[#b8f2e6] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="font-bold text-foreground">
              {fileName || "Sarah_Johnson_CV.pdf"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Ready to analyze
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div
              className={`w-14 h-14 ${isDragging ? "bg-primary" : "bg-[#e9d5ff]"} rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors`}
            >
              <Upload
                className={`w-7 h-7 ${isDragging ? "text-white" : "text-primary"}`}
              />
            </div>
            <p className="font-bold text-foreground mb-1">Drop your CV here</p>
            <p className="text-sm text-muted-foreground">
              or click to browse • PDF, Word, or plain text
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
  const color = score >= 80 ? "#6366f1" : score >= 60 ? "#ffb86c" : "#ef4444";

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
    color: "bg-[#bae6fd] text-sky-700",
    icon: Clock,
  },
  screening: {
    label: "Screening",
    color: "bg-[#ffd6a5] text-orange-700",
    icon: Eye,
  },
  interview: {
    label: "Interview",
    color: "bg-[#e9d5ff] text-violet-700",
    icon: MessageSquare,
  },
  accepted: {
    label: "Accepted",
    color: "bg-[#b8f2e6] text-emerald-700",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-[#fecdd3] text-red-600",
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
