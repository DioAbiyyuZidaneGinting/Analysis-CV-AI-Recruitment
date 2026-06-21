import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { History, FileText, Eye } from "lucide-react";
import { useCandidateContext } from "./candidateContext";

export function AnalysisHistoryPage() {
  const navigate = useNavigate();
  const { history, handleSelectHistoryItem } = useCandidateContext();

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[10px] text-[#0052CC] font-bold uppercase tracking-wider mb-1">
          [ HISTORY LOG DATABASE ]
        </div>
        <h1
          className="text-2xl font-black text-black tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Analysis History
        </h1>
        <p className="text-black/60 font-medium mt-1 text-sm">
          Access your past CV analysis reports and compare results.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-xl border border-black/[0.08] p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-black/[0.03] border border-black/10 rounded-lg flex items-center justify-center">
            <History className="w-6 h-6 text-black/70" />
          </div>
          <div>
            <p className="font-bold text-black">
              No analysis history yet
            </p>
            <p className="text-xs text-black/55 mt-1.5 max-w-sm mx-auto font-medium">
              Upload and analyze your CV to start building your analysis
              history.
            </p>
          </div>
          <button
            onClick={() => navigate("/candidate/cv-analysis")}
            className="bg-[#0052CC] text-white px-5 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border border-transparent hover:bg-white hover:border-[#0052CC] hover:text-[#0052CC] transition-all"
          >
            Analyze CV Now
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((item, i) => {
            const dateStr = new Date(item.analyzedAt).toLocaleDateString(
              "id-ID",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              },
            );

            const scoreColorClass =
              item.cvScore >= 80
                ? "text-[#0052CC]"
                : item.cvScore >= 60
                  ? "text-[#5C6B73]"
                  : "text-[#C2410C]";

            const chanceColorClass =
              item.hiringChance >= 75
                ? "text-[#2E7D32]"
                : "text-[#C2410C]";

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl border border-black/[0.08] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-black/30 transition-all duration-200 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-black/[0.03] border border-black/10 text-black rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <h3 className="font-bold text-black text-base truncate max-w-[250px] sm:max-w-[400px] tracking-tight">
                      {item.fileName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-black/55 font-medium">
                      <span className="bg-[#0052CC]/[0.06] border border-[#0052CC]/15 text-[#0052CC] px-2 py-0.5 font-mono text-[10px] font-bold uppercase rounded">
                        {item.jobCategory ||
                          item.predictedCategory ||
                          "Unknown Role"}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[11px]">{dateStr}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-black/[0.04]">
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-[10px] text-black/55 font-mono font-bold uppercase tracking-wider">
                        CV Score
                      </p>
                      <span
                        className={`inline-block mt-1 font-mono text-xs font-bold px-2.5 py-0.5 border border-black/10 bg-[#F9F9F7] rounded ${scoreColorClass}`}
                      >
                        {item.cvScore}/100
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-black/55 font-mono font-bold uppercase tracking-wider">
                        Hiring Chance
                      </p>
                      <span
                        className={`inline-block mt-1 font-mono text-xs font-bold px-2.5 py-0.5 border border-black/10 bg-[#F9F9F7] rounded ${chanceColorClass}`}
                      >
                        {item.hiringChance}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectHistoryItem(item)}
                    className="flex items-center gap-1.5 bg-black text-white font-mono text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 border border-transparent hover:bg-white hover:border-black hover:text-black rounded-lg transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Analysis
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
