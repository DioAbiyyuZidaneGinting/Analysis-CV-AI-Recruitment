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
        <h1
          className="text-2xl font-black text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Analysis History
        </h1>
        <p className="text-muted-foreground mt-1">
          Access your past CV analysis reports and compare results.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/[0.06] p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <History className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-black text-foreground">
              No analysis history yet
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Upload and analyze your CV to start building your analysis
              history.
            </p>
          </div>
          <button
            onClick={() => navigate("/candidate/cv-analysis")}
            className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-primary/20"
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
            const scoreColor =
              item.cvScore >= 80
                ? "text-primary bg-primary/10"
                : item.cvScore >= 60
                  ? "text-amber-600 bg-amber-50"
                  : "text-red-600 bg-red-50";
            const chanceColor =
              item.hiringChance >= 75
                ? "text-emerald-700 bg-emerald-50"
                : "text-amber-600 bg-amber-50";

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-black/[0.06] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-bold text-foreground text-base truncate max-w-[250px] sm:max-w-[400px]">
                      {item.fileName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                        {item.jobCategory ||
                          item.predictedCategory ||
                          "Unknown Role"}
                      </span>
                      <span>•</span>
                      <span>{dateStr}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                        CV Score
                      </p>
                      <span
                        className={`inline-block mt-1 text-sm font-black px-2.5 py-0.5 rounded-full ${scoreColor}`}
                      >
                        {item.cvScore}/100
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                        Hiring Chance
                      </p>
                      <span
                        className={`inline-block mt-1 text-sm font-black px-2.5 py-0.5 rounded-full ${chanceColor}`}
                      >
                        {item.hiringChance}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectHistoryItem(item)}
                    className="flex items-center gap-1.5 bg-muted text-foreground font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-primary hover:text-white transition-all group-hover:bg-primary group-hover:text-white"
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
