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
      <div>
        <h1
          className="text-2xl font-black text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          CV Analysis
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload your CV and get instant AI-powered feedback.
        </p>
      </div>

      <CVUploadArea
        onAnalyze={() => {}}
        onFileSelect={handleFileSelect}
      />

      <AnimatePresence>
        {analyzing && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center gap-4"
          >
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <div>
              <p className="font-bold text-primary">
                Analyzing your CV...
              </p>
              <p className="text-sm text-muted-foreground">
                Running ML category classification and parser metrics
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
            <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-8">
                {/* Score ring */}
                <div className="text-center">
                  <ScoreRing score={candidate.cvScore} />
                  <p className="text-sm font-semibold text-muted-foreground mt-2">
                    Overall Score
                  </p>
                </div>

                {/* Score breakdown */}
                <div className="flex-1 space-y-4">
                  {[
                    {
                      label: "ATS Compatibility",
                      score: candidate.atsScore || 0,
                      color: "bg-primary",
                    },
                    {
                      label: "Skills Relevance",
                      score: candidate.skillsRelevanceScore || 0,
                      color: "bg-secondary",
                    },
                    {
                      label: "Experience Quality",
                      score: candidate.experienceQualityScore || 0,
                      color: "bg-[#f472b6]",
                    },
                    {
                      label: "Format & Clarity",
                      score: candidate.formatClarityScore || 0,
                      color: "bg-[#4ade80]",
                    },
                  ].map(({ label, score, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-foreground">
                          {label}
                        </span>
                        <span className="font-black text-foreground">
                          {score}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${color} rounded-full`}
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
                <div className="text-center">
                  <div className="w-28 h-28 bg-[#b8f2e6] rounded-3xl flex flex-col items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-6 h-6 text-emerald-600 mb-1" />
                    <p
                      className="text-2xl font-black text-emerald-700"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {candidate.hiringChance}%
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Hiring Chance
                  </p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    {candidate.hiringRecommendation || "Recommended"}
                  </p>
                </div>
              </div>
            </div>

            {/* Skills + Category + Improvements */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Detected Skills */}
              <div className="bg-white rounded-2xl border border-black/[0.06] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3
                    className="font-black text-sm text-foreground"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Detected Skills
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills && candidate.skills.length > 0 ? (
                    candidate.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="bg-[#e9d5ff] text-primary text-xs font-semibold px-3 py-1.5 rounded-full"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No technical skills detected.
                    </p>
                  )}
                </div>
              </div>

              {/* Job Category */}
              <div className="bg-white rounded-2xl border border-black/[0.06] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-4 h-4 text-secondary" />
                  <h3
                    className="font-black text-sm text-foreground"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Job Category
                  </h3>
                </div>
                <div className="bg-[#bae6fd] rounded-xl p-4 text-center mb-4">
                  <p
                    className="font-black text-sky-700 text-lg"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {candidate.jobCategory || candidate.predictedCategory}
                  </p>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Experience Level</span>
                    <span className="font-semibold text-foreground">
                      {candidate.experienceLevel || "Entry Level"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Professional Experience</span>
                    <span className="font-semibold text-foreground">
                      {candidate.experienceYears !== undefined ? candidate.experienceYears : (candidate.details?.experienceYears || 0)} years
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Demand</span>
                    <span className="font-semibold text-emerald-600">
                      High
                    </span>
                  </div>
                </div>
              </div>

              {/* Improvements */}
              <div className="bg-white rounded-2xl border border-black/[0.06] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-accent" />
                  <h3
                    className="font-black text-sm text-foreground"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Improvements
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {candidate.improvements &&
                  candidate.improvements.length > 0 ? (
                    candidate.improvements.map(
                      (imp: string, i: number) => (
                        <div key={i} className="flex gap-2.5 text-sm">
                          <div className="w-5 h-5 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-accent text-xs font-bold">
                              {i + 1}
                            </span>
                          </div>
                          <p className="text-foreground leading-relaxed">
                            {imp}
                          </p>
                        </div>
                      ),
                    )
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No improvements required!
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/candidate/cv-templates")}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-primary/20"
              >
                <FileText className="w-4 h-4" /> Download PDF Templates
              </button>
              <button
                onClick={() => navigate("/candidate/job-matches")}
                className="flex items-center gap-2 bg-white border border-black/[0.08] text-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-muted transition-colors"
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
