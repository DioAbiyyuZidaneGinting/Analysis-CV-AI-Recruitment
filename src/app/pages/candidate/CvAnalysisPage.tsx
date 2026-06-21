import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, Sparkles, BookOpen, AlertCircle, FileText, Search } from "lucide-react";
import { useCandidateContext } from "./candidateContext";
import { CVUploadArea, ScoreRing } from "./candidateShared";

export function CvAnalysisPage() {
  const navigate = useNavigate();
  const {
    candidate,
    analyzed,
    analyzing,
    handleFileSelect,
  } = useCandidateContext();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end border-b border-black/[0.08] pb-4">
        <div>
          <p className="font-mono text-[10px] text-[#0052CC] uppercase tracking-wider mb-1">
            [ CV SCANNER ]
          </p>
          <h1
            className="text-3xl font-black text-black tracking-tighter uppercase"
            style={{ fontFamily: "var(--font-display)" }}
          >
            CV Analysis
          </h1>
        </div>
        <div className="font-mono text-[10px] text-black/40 mt-2 md:mt-0">
          ID: {candidate.id || "CAN-589A"} // TIMESTAMP: {new Date().toISOString().slice(0, 10)}
        </div>
      </div>

      <CVUploadArea
        onAnalyze={() => { }}
        onFileSelect={handleFileSelect}
      />

      <AnimatePresence>
        {analyzing && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white border border-black/[0.08] rounded-xl p-8 flex items-center gap-6 shadow-sm relative overflow-hidden"
          >
            <div className="w-10 h-10 border-2 border-black/10 border-t-[#0052CC] rounded-full animate-spin flex-shrink-0" />
            <div>
              <p className="font-mono text-xs text-[#0052CC] mb-1 font-bold">
                &gt; RUNNING PARSER ENGINE...
              </p>
              <p className="font-bold text-black text-lg tracking-tight">
                Analyzing your CV content
              </p>
              <p className="text-xs text-black/50 mt-0.5 font-sans">
                Executing classification matrices and cross referencing industry skill models.
              </p>
            </div>
          </motion.div>
        )}

        {analyzed && !analyzing && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Score overview */}
            <div className="bg-white border border-black/[0.08] rounded-xl p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row items-stretch gap-8">
                {/* Score ring */}
                <div className="flex flex-col items-center justify-center lg:w-48 border-b lg:border-b-0 lg:border-r border-black/[0.08] pb-6 lg:pb-0 lg:pr-8">
                  <span className="font-mono text-xs font-bold text-black/70 uppercase tracking-wider mb-3">[ OVERALL SCORE ]</span>
                  <ScoreRing score={candidate.cvScore} />
                  <p className="text-xs font-mono font-bold text-black/60 mt-4 uppercase tracking-wider">
                    Evaluation Matrix
                  </p>
                </div>

                {/* Score breakdown */}
                <div className="flex-1 space-y-4 py-2">
                  {[
                    {
                      label: "ATS Compatibility",
                      score: candidate.atsScore || 0,
                      comment: "PARSE SUCCESS",
                      color: "#0052CC"
                    },
                    {
                      label: "Skills Relevance",
                      score: candidate.skillsRelevanceScore || 0,
                      comment: "VECTOR MATCH",
                      color: "#007A87"
                    },
                    {
                      label: "Experience Quality",
                      score: candidate.experienceQualityScore || 0,
                      comment: "TIMELINE WEIGHT",
                      color: "#5C6B73"
                    },
                    {
                      label: "Format & Clarity",
                      score: candidate.formatClarityScore || 0,
                      comment: "LAYOUT INTEGRITY",
                      color: "#2E7D32"
                    },
                  ].map(({ label, score, comment, color }) => (
                    <div key={label}>
                      <div className="flex justify-between items-end text-sm mb-1.5">
                        <span className="font-bold text-black tracking-tight">
                          {label}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-medium text-black/60">{comment}</span>
                          <span className="font-mono font-bold" style={{ color }}>
                            {score}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-black/[0.03] border border-black/[0.06] rounded-none overflow-hidden">
                        <motion.div
                          className="h-full"
                          style={{ backgroundColor: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{
                            duration: 1.2,
                            ease: "easeOut",
                            delay: 0.3,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Hiring chance */}
                <div className="flex flex-col items-center justify-center lg:w-48 border-t lg:border-t-0 lg:border-l border-black/[0.08] pt-6 lg:pt-0 lg:pl-8">
                  <span className="font-mono text-xs font-bold text-black/70 uppercase tracking-wider mb-3">[ HIRING CHANCE ]</span>
                  <div className="w-24 h-24 border border-black/[0.08] bg-[#F9F9F7] rounded-xl flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
                    <div className="absolute top-1.5 right-2 font-mono text-[8px] text-black/30">%</div>
                    <p
                      className="text-3xl font-extrabold text-black tracking-tighter"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {candidate.hiringChance}
                    </p>
                  </div>
                  <p className="text-xs font-mono font-black text-[#0052CC] uppercase tracking-wide mt-3">
                    {candidate.hiringRecommendation || "Recommended"}
                  </p>
                </div>
              </div>
            </div>

            {/* Skills + Category + Improvements */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Detected Skills */}
              <div className="bg-white border border-black/[0.08] rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-black/[0.06] pb-2">
                  <Sparkles className="w-4 h-4 text-[#0052CC]" />
                  <h3
                    className="font-bold text-xs uppercase text-black tracking-wider"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    [ Detected Skills ]
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills && candidate.skills.length > 0 ? (
                    candidate.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="bg-black/[0.03] border border-black/10 text-black font-mono text-xs px-3 py-1.5 uppercase font-bold tracking-wide rounded"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-black/50 font-mono italic">
                      NO SKILLS DETECTED
                    </p>
                  )}
                </div>
              </div>

              {/* Job Category */}
              <div className="bg-white border border-black/[0.08] rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-black/[0.06] pb-2">
                  <BookOpen className="w-4 h-4 text-[#0052CC]" />
                  <h3
                    className="font-bold text-xs uppercase text-black tracking-wider"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    [ Job Category ]
                  </h3>
                </div>
                <div className="border border-[#0052CC]/15 bg-[#0052CC]/[0.02] p-4 text-center mb-5">
                  <p
                    className="font-extrabold text-[#0052CC] text-xl tracking-tight uppercase"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {candidate.jobCategory || candidate.predictedCategory}
                  </p>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center border-b border-black/[0.03] pb-1.5">
                    <span className="text-black/65 font-medium">Experience Level</span>
                    <span className="font-bold text-black uppercase font-mono text-xs">
                      {candidate.experienceLevel || "Entry Level"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-black/[0.03] pb-1.5">
                    <span className="text-black/65 font-medium">Professional Experience</span>
                    <span className="font-bold text-black font-mono text-xs">
                      {candidate.experienceYears !== undefined ? candidate.experienceYears : (candidate.details?.experienceYears || 0)} Yrs
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-black/65 font-medium">Demand Projection</span>
                    <span className="font-black text-[#0052CC] uppercase font-mono text-xs">
                      High // Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Improvements */}
              <div className="bg-white border border-black/[0.08] rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-black/[0.06] pb-2">
                  <AlertCircle className="w-4 h-4 text-black" />
                  <h3
                    className="font-bold text-xs uppercase text-black tracking-wider"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    [ Improvement Backlog ]
                  </h3>
                </div>
                <div className="space-y-3">
                  {candidate.improvements &&
                    candidate.improvements.length > 0 ? (
                    candidate.improvements.map(
                      (imp: string, i: number) => (
                        <div key={i} className="flex gap-3 text-xs items-start">
                          <div className="w-5 h-5 border border-black/25 text-black/80 font-mono text-[10px] font-bold flex items-center justify-center bg-black/[0.02] flex-shrink-0 mt-0.5">
                            {String(i + 1).padStart(2, "0")}
                          </div>
                          <p className="text-black text-sm leading-relaxed font-sans font-medium">
                            {imp}
                          </p>
                        </div>
                      ),
                    )
                  ) : (
                    <p className="text-xs text-black/50 font-mono italic">
                      OPTIMIZATION COMPLETE
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => navigate("/candidate/cv-templates")}
                className="flex items-center gap-3 bg-[#0052CC] text-white px-6 py-3 border border-transparent hover:bg-white hover:border-[#0052CC] hover:text-[#0052CC] font-mono text-xs uppercase tracking-wider transition-all duration-200 rounded-lg"
              >
                <FileText className="w-4 h-4" /> Download PDF Templates
              </button>
              <button
                onClick={() => navigate("/candidate/job-matches")}
                className="flex items-center gap-3 bg-white border border-black/10 text-black hover:border-black px-6 py-3 font-mono text-xs uppercase tracking-wider transition-all duration-200 rounded-lg"
              >
                <Search className="w-4 h-4" /> Find Matching Jobs
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
