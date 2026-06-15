import { motion } from "motion/react";
import { useCandidateContext } from "./candidateContext";
import { PIPELINE_STEPS, STATUS_CONFIG } from "./candidateShared";

export function ApplicationsPage() {
  const { applications } = useCandidateContext();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Applications
          </h1>
          <p className="text-muted-foreground mt-1">
            {applications.length} total applications
          </p>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex gap-2 flex-wrap">
        {(["all", ...Object.keys(STATUS_CONFIG)] as const).map((status) => (
          <button
            key={status}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              status === "all"
                ? "bg-foreground text-background"
                : `${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || "bg-muted text-muted-foreground"}`
            }`}
          >
            {status === "all"
              ? "All"
              : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}{" "}
            (
            {status === "all"
              ? applications.length
              : applications.filter((a: any) => a.status === status).length}
            )
          </button>
        ))}
      </div>

      {/* Applications list */}
      <div className="space-y-3">
        {applications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-semibold">No applications yet</p>
            <p className="text-sm mt-1">
              Go to Job Matches to find and apply for open roles.
            </p>
          </div>
        ) : (
          applications.map((app: any, i: number) => {
            const status = app.status || "submitted";
            const config =
              STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ||
              STATUS_CONFIG.submitted;
            const StatusIcon = config.icon;
            const jobTitle = app.jobs?.title || "Unknown Position";
            const dept = app.jobs?.department || "";
            const loc = app.jobs?.location || "";
            const appliedDate = app.applied_at
              ? app.applied_at.slice(0, 10)
              : "";
            const initials = jobTitle
              .split(" ")
              .map((w: string) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-black/[0.06] p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                  {initials || "J"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-foreground">{jobTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        {dept}
                        {loc ? ` · ${loc}` : ""}
                        {appliedDate ? ` · ${appliedDate}` : ""}
                      </p>
                    </div>
                    {StatusIcon && (
                      <span
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${config.color}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {config.label}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    {PIPELINE_STEPS.map((step, si) => {
                      const stepIndex = PIPELINE_STEPS.indexOf(status);
                      const isPast = si <= stepIndex && status !== "rejected";
                      return (
                        <div key={step} className="flex items-center gap-1.5">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              status === "rejected"
                                ? "bg-[#fecdd3]"
                                : isPast
                                  ? "bg-primary"
                                  : "bg-muted"
                            }`}
                          />
                          {si < PIPELINE_STEPS.length - 1 && (
                            <div
                              className={`h-0.5 w-6 ${isPast && si < stepIndex ? "bg-primary" : "bg-muted"}`}
                            />
                          )}
                        </div>
                      );
                    })}
                    <span className="text-xs text-muted-foreground ml-2">
                      {status === "rejected"
                        ? "Not proceeding"
                        : `Step ${PIPELINE_STEPS.indexOf(status) + 1} of ${PIPELINE_STEPS.length}`}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
