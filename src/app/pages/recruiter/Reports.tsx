import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import {
  TrendingUp, Award, Download, BarChart3, Users,
  MessageSquare, Star, Heart, Sparkles, MousePointer, Palette
} from "lucide-react";
import { apiUrl } from "../../utils/apiConfig";

/** Helper: get Authorization header from stored JWT token */
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const HIRING_TRENDS = [
  { month: "Jan", hired: 0, rejected: 0, applied: 0 },
  { month: "Feb", hired: 0, rejected: 0, applied: 0 },
  { month: "Mar", hired: 0, rejected: 0, applied: 0 },
  { month: "Apr", hired: 0, rejected: 0, applied: 0 },
  { month: "May", hired: 0, rejected: 0, applied: 0 },
  { month: "Jun", hired: 0, rejected: 0, applied: 0 },
];

const CV_SCORE_DIST = [
  { range: "0–59", count: 0, fill: "#fecdd3" },
  { range: "60–69", count: 0, fill: "#ffd6a5" },
  { range: "70–79", count: 0, fill: "#bae6fd" },
  { range: "80–89", count: 0, fill: "#e9d5ff" },
  { range: "90–100", count: 0, fill: "#b8f2e6" },
];

const DEFAULT_CATEGORIES = [
  { name: "No Data", value: 0, fill: "#6366f1" }
];

const SKILL_DISTRIBUTION = [
  { skill: "Figma", A: 0 },
  { skill: "React", A: 0 },
  { skill: "Research", A: 0 },
  { skill: "Leadership", A: 0 },
  { skill: "Agile", A: 0 },
  { skill: "Data", A: 0 },
];

const SOURCE_DATA = [
  { source: "TalentAI Platform", count: 0, pct: 0 },
  { source: "LinkedIn", count: 0, pct: 0 },
  { source: "Referrals", count: 0, pct: 0 },
  { source: "Job Boards", count: 0, pct: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-black/[0.08] rounded-xl p-3 shadow-lg">
        <p className="font-bold text-xs text-foreground mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-xs" style={{ color: p.color }}>
            {p.name}: <span className="font-black">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ReportsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");
  const [activeTab, setActiveTab] = useState<"pipeline" | "feedback">("pipeline");
  const [stats, setStats] = useState<any>(null);
  const [feedbackStats, setFeedbackStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/recruiter/reports/stats"), {
      headers: getAuthHeaders()
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setStats(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load reports stats", err);
        setLoading(false);
      });

    fetch(apiUrl("/api/recruiter/feedback/analytics"), {
      headers: getAuthHeaders()
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setFeedbackStats(data);
        }
        setLoadingFeedback(false);
      })
      .catch(err => {
        console.error("Failed to load feedback analytics", err);
        setLoadingFeedback(false);
      });
  }, []);

  const colors = ["#6366f1", "#06b6d4", "#ffb86c", "#f472b6", "#4ade80"];
  
  const dynamicCategories = stats && stats.topCategories && stats.topCategories.length > 0
    ? stats.topCategories.map((c: any, index: number) => ({
        name: c.category,
        value: c.count,
        fill: colors[index % colors.length]
      }))
    : DEFAULT_CATEGORIES;

  const hiringTrendsData = stats && stats.hiringTrends && stats.hiringTrends.length > 0
    ? stats.hiringTrends
    : HIRING_TRENDS;

  const cvScoreDistData = stats && stats.cvScoreDist && stats.cvScoreDist.length > 0
    ? stats.cvScoreDist
    : CV_SCORE_DIST;

  const skillDistributionData = stats && stats.skillDistribution && stats.skillDistribution.length > 0
    ? stats.skillDistribution
    : SKILL_DISTRIBUTION;

  const funnelData = stats && stats.funnel && stats.funnel.length > 0
    ? stats.funnel
    : [
        { stage: "Applied", count: 0, color: "bg-[#bae6fd]", text: "text-sky-700" },
        { stage: "Screened", count: 0, color: "bg-[#e9d5ff]", text: "text-violet-700" },
        { stage: "Interview", count: 0, color: "bg-[#ffd6a5]", text: "text-orange-700" },
        { stage: "Offer", count: 0, color: "bg-[#b8f2e6]", text: "text-emerald-700" },
        { stage: "Hired", count: 0, color: "bg-primary", text: "text-white" }
      ];

  const totalAppsCount = stats ? stats.totalApplications : 0;
  const hiredCount = stats && stats.funnel && stats.funnel[4] ? stats.funnel[4].count : 0;

  const handleExport = () => {
    if (activeTab === "pipeline") {
      if (!stats) return;
      const csvContent = [
        "TalentAI Recruitment Reports - Pipeline Analytics Export",
        `Period,${period}`,
        `Exported At,${new Date().toLocaleString()}`,
        "",
        "--- OVERVIEW ---",
        "Metric,Value,Description",
        `Total Candidates,${stats.totalCandidates || 0},Unique pipeline candidates`,
        `Total Applications,${stats.totalApplications || 0},Active job applications`,
        `Average CV Score,${stats.averageCvScore || 0},Recruiter pool quality`,
        `Pipeline Conversion,${stats.pipelineConversion || "0%"},Candidates past screening`,
        "",
        "--- FUNNEL STAGES ---",
        "Stage,Count",
        ...funnelData.map((f: any) => `"${f.stage}",${f.count}`),
        "",
        "--- TOP CATEGORIES ---",
        "Category,Count",
        ...dynamicCategories.map((c: any) => `"${c.name}",${c.value}`),
        "",
        "--- CV SCORE DISTRIBUTION ---",
        "Score Range,Count",
        ...cvScoreDistData.map((d: any) => `"${d.range}",${d.count}`),
        "",
        "--- SKILL DISTRIBUTION ---",
        "Skill,Count",
        ...skillDistributionData.map((s: any) => `"${s.skill}",${s.A || s.value || 0}`)
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `recruitment_pipeline_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (!feedbackStats) return;
      const csvContent = [
        "TalentAI Recruitment Reports - Candidate Feedback Export",
        `Exported At,${new Date().toLocaleString()}`,
        "",
        "--- OVERVIEW ---",
        "Metric,Value,Description",
        `Total Responses,${feedbackStats.totalResponses || 0},Submissions`,
        `Overall Experience Rating,${feedbackStats.averageRatings?.overall || 0} / 5,Avg rating`,
        `Recommendation Accuracy (AI Quality),${feedbackStats.averageRatings?.recommendationAccuracy || 0} / 5,Avg accuracy`,
        `Ease of Use,${feedbackStats.averageRatings?.easeOfUse || 0} / 5,Avg usability`,
        `UI Design,${feedbackStats.averageRatings?.uiDesign || 0} / 5,Avg visual rating`,
        `Net Promoter Score (NPS),${feedbackStats.nps?.score || 0},NPS Score (-100 to 100)`,
        `NPS Average,${feedbackStats.nps?.average || 0} / 10,Avg rating`,
        "",
        "--- NPS SEGMENTS ---",
        "Segment,Percentage,Count",
        `Promoters,${Math.round(((feedbackStats.nps?.promoters || 0) / (feedbackStats.totalResponses || 1)) * 100)}%,${feedbackStats.nps?.promoters || 0}`,
        `Passives,${Math.round(((feedbackStats.nps?.passives || 0) / (feedbackStats.totalResponses || 1)) * 100)}%,${feedbackStats.nps?.passives || 0}`,
        `Detractors,${Math.round(((feedbackStats.nps?.detractors || 0) / (feedbackStats.totalResponses || 1)) * 100)}%,${feedbackStats.nps?.detractors || 0}`,
        "",
        "--- STAR RATING DISTRIBUTION ---",
        "Rating,Count",
        ...(feedbackStats.ratingDistribution || []).map((r: any) => `"${r.rating} Stars",${r.count}`),
        "",
        "--- FEATURE POPULARITY ---",
        "Feature,Count",
        ...(feedbackStats.featureDistribution || []).map((f: any) => `"${f.feature}",${f.count}`),
        "",
        "--- CANDIDATE COMMENTS ---",
        "Comment",
        ...(feedbackStats.comments || []).map((c: any) => `"${c.comment.replace(/"/g, '""')}"`)
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `candidate_feedback_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const kpis = [
    { label: "Total Candidates", value: stats ? String(stats.totalCandidates) : "0", sub: "Unique pipeline candidates", icon: Users, bg: "bg-sky-500/[0.08]", iconColor: "text-sky-700", border: "border-sky-500/15" },
    { label: "Total Applications", value: stats ? String(stats.totalApplications) : "0", sub: "Active job applications", icon: BarChart3, bg: "bg-amber-500/[0.08]", iconColor: "text-amber-700", border: "border-amber-500/15" },
    { label: "Average CV Score", value: stats ? `${stats.averageCvScore}/100` : "--", sub: "Recruiter pool quality", icon: Award, bg: "bg-[#0052CC]/[0.08]", iconColor: "text-[#0052CC]", border: "border-[#0052CC]/15" },
    { label: "Pipeline Conversion", value: stats ? stats.pipelineConversion : "0%", sub: "Candidates past screening", icon: TrendingUp, bg: "bg-emerald-500/[0.08]", iconColor: "text-emerald-700", border: "border-emerald-500/15" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.08] pb-4">
        <div>
          <h1 className="text-xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Recruitment Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Analytics and insights for your hiring pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-black/[0.04] border border-black/[0.08] p-0.5 rounded-lg flex gap-0.5 text-xs font-mono">
            {(["week", "month", "quarter"] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  period === p 
                    ? "bg-white border border-black/[0.08] shadow-sm text-foreground font-bold" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-white border border-black/[0.08] px-3.5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-black/[0.02] hover:border-black/[0.12] transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-4 mb-6 mt-4">
        <div className="bg-black/[0.04] border border-black/[0.08] p-0.5 rounded-lg flex gap-0.5 text-xs font-mono">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === "pipeline" 
                ? "bg-white border border-black/[0.08] shadow-sm text-foreground font-bold" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pipeline Analytics
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === "feedback" 
                ? "bg-white border border-black/[0.08] shadow-sm text-foreground font-bold" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Candidate Feedback
          </button>
        </div>
      </div>

      {activeTab === "pipeline" ? (
        loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="w-6 h-6 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map(({ label, value, sub, icon: Icon, bg, iconColor, border }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl p-5 border border-black/[0.08] hover:border-black/20 transition-all"
                >
                  <div className={`w-9 h-9 ${bg} ${border} border rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <p className="text-3xl font-black text-foreground leading-tight" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
                  <p className="text-xs font-bold text-foreground mt-1">{label}</p>
                  <p className="text-[9px] font-mono uppercase text-muted-foreground mt-2">{sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Main chart — Hiring Trends */}
            <div className="bg-white rounded-xl border border-black/[0.08] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-black text-xs text-foreground uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Hiring Trends</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Applications, reviews, and hires over time</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono uppercase font-bold tracking-wider">
                  {[
                    { color: "#0052CC", label: "Applied" },
                    { color: "#10B981", label: "Hired" },
                    { color: "#EF4444", label: "Rejected" },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={hiringTrendsData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="applied" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0052CC" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#0052CC" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="hired" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#888899", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#888899", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="applied" stroke="#0052CC" strokeWidth={2} fill="url(#applied)" name="Applied" />
                  <Area type="monotone" dataKey="hired" stroke="#10B981" strokeWidth={2} fill="url(#hired)" name="Hired" />
                  <Area type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={1.5} fill="none" name="Rejected" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Row 2: CV Score distribution + Category pie */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* CV Score Distribution */}
              <div className="bg-white rounded-xl border border-black/[0.08] p-6">
                <h3 className="font-black text-xs text-foreground uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>CV Score Distribution</h3>
                <p className="text-xs text-muted-foreground mb-6">Breakdown of applicant quality scores</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={cvScoreDistData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" vertical={false} />
                    <XAxis dataKey="range" tick={{ fontSize: 9, fill: "#888899", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#888899", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]} name="Candidates">
                      {cvScoreDistData.map((entry: any, i: number) => {
                        const distColors = ["#EF4444", "#F59E0B", "#3B82F6", "#6366F1", "#10B981"];
                        return <Cell key={i} fill={distColors[i % distColors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category breakdown */}
              <div className="bg-white rounded-xl border border-black/[0.08] p-6">
                <h3 className="font-black text-xs text-foreground uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>Candidate Categories</h3>
                <p className="text-xs text-muted-foreground mb-6">Application distribution by job category</p>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={dynamicCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {dynamicCategories.map((entry: any, i: number) => {
                          const pieColors = ["#0052CC", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"];
                          return <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />;
                        })}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2 font-mono text-xs uppercase tracking-wider font-bold">
                    {dynamicCategories.map(({ name, value, fill }: any) => (
                      <div key={name} className="flex items-center justify-between py-1 border-b border-black/[0.03]">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: fill }} />
                          <span className="text-muted-foreground font-bold">{name}</span>
                        </div>
                        <span className="text-black font-bold">{value} <span className="text-[10px] text-muted-foreground font-normal">candidates</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Skill distribution radar + Source breakdown */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Skill radar */}
              <div className="bg-white rounded-xl border border-black/[0.08] p-6">
                <h3 className="font-black text-xs text-foreground uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>Skill Distribution</h3>
                <p className="text-xs text-muted-foreground mb-4">Most common skills in candidate pool</p>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={skillDistributionData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                    <PolarGrid stroke="#f0f0f8" />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 9, fill: "#888899", fontFamily: "var(--font-mono)" }} />
                    <Radar name="Candidates" dataKey="A" stroke="#0052CC" fill="#0052CC" fillOpacity={0.1} strokeWidth={1.5} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Source breakdown */}
              <div className="bg-white rounded-xl border border-black/[0.08] p-6">
                <h3 className="font-black text-xs text-foreground uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>Application Sources</h3>
                <p className="text-xs text-muted-foreground mb-6">Where your best candidates come from</p>
                <div className="space-y-4">
                  {SOURCE_DATA.map(({ source, count, pct }, i) => {
                    const colors = ["#0052CC", "#10B981", "#F59E0B", "#8B5CF6"];
                    return (
                      <div key={source} className="font-mono text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-black uppercase tracking-wider">{source}</span>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-muted-foreground">{count} candidates</span>
                            <span className="font-bold text-black">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-black/[0.03] border border-black/[0.05] rounded overflow-hidden">
                          <motion.div
                             className="h-full rounded-full"
                             style={{ backgroundColor: colors[i % colors.length] }}
                             initial={{ width: 0 }}
                             animate={{ width: `${pct}%` }}
                             transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.05 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="bg-black/[0.01] border border-black/[0.08] rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-black font-mono leading-none mb-1">{totalAppsCount}</p>
                    <p className="text-[9px] text-muted-foreground font-mono font-bold uppercase tracking-wider">Total Applications</p>
                  </div>
                  <div className="bg-black/[0.01] border border-black/[0.08] rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-emerald-600 font-mono leading-none mb-1">{hiredCount}</p>
                    <p className="text-[9px] text-muted-foreground font-mono font-bold uppercase tracking-wider">Total Hired</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: Funnel + time metrics */}
            <div className="bg-white rounded-xl border border-black/[0.08] p-6">
              <h3 className="font-black text-xs text-foreground uppercase tracking-wide mb-6" style={{ fontFamily: 'var(--font-display)' }}>Recruitment Funnel</h3>
              <div className="flex items-end gap-4 min-h-[220px]">
                {funnelData.map(({ stage, count, color, text }: any, i: number) => {
                  const maxH = 200;
                  const totalCount = funnelData[0].count || 1;
                  const pct = count / totalCount;
                  
                  const nextCount = i < 4 ? funnelData[i + 1].count : 0;
                  const conversionPct = count > 0 ? Math.round((nextCount / count) * 100) : 0;
                  
                  const stageColors = [
                    "bg-[#0052CC]/15 border-[#0052CC]/30 text-[#0052CC]", // Applied
                    "bg-amber-500/15 border-amber-500/30 text-amber-700", // Screened
                    "bg-violet-500/15 border-violet-500/30 text-violet-700", // Interview
                    "bg-pink-500/15 border-pink-500/30 text-pink-700", // Offered
                    "bg-emerald-500/20 border-emerald-500/40 text-emerald-800", // Hired
                  ];
                  
                  return (
                    <div key={stage} className="flex flex-col items-center gap-2 flex-1">
                      <p className="text-xs font-bold text-black font-mono">{count}</p>
                      <motion.div
                        className={`w-full ${stageColors[i % stageColors.length].split(" ")[0]} border ${stageColors[i % stageColors.length].split(" ")[1]} rounded-t`}
                        initial={{ height: 0 }}
                        animate={{ height: Math.max(pct * maxH, 20) }}
                        transition={{ duration: 1, ease: "easeOut", delay: i * 0.05 }}
                      />
                      <p className={`text-[10px] font-sans font-bold uppercase tracking-wider text-center ${stageColors[i % stageColors.length].split(" ")[2]}`}>
                        {stage}
                      </p>
                      {i < 4 ? (
                        <p className="text-[9px] text-muted-foreground font-sans font-semibold uppercase tracking-wider mt-0.5">
                          {conversionPct}% conv
                        </p>
                      ) : (
                        <p className="text-[9px] text-transparent select-none font-sans font-semibold uppercase tracking-wider mt-0.5">
                          hidden
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )
      ) : (
        loadingFeedback ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="w-6 h-6 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[
                {
                  label: "Total Responses",
                  value: feedbackStats ? String(feedbackStats.totalResponses) : "0",
                  sub: "Submissions",
                  icon: MessageSquare,
                  bg: "bg-sky-500/[0.08]", iconColor: "text-sky-700", border: "border-sky-500/15"
                },
                {
                  label: "Overall rating",
                  value: feedbackStats ? `${feedbackStats.averageRatings?.overall || 0} / 5` : "0 / 5",
                  sub: "Avg rating",
                  icon: Star,
                  bg: "bg-amber-500/[0.08]", iconColor: "text-amber-700", border: "border-amber-500/15"
                },
                {
                  label: "Net Promoter",
                  value: feedbackStats ? String(feedbackStats.nps?.score || 0) : "0",
                  sub: `Score (${feedbackStats?.nps?.average || 0}/10)`,
                  icon: Heart,
                  bg: "bg-[#0052CC]/[0.08]", iconColor: "text-[#0052CC]", border: "border-[#0052CC]/15"
                },
                {
                  label: "AI Quality",
                  value: feedbackStats ? `${feedbackStats.averageRatings?.recommendationAccuracy || 0} / 5` : "0 / 5",
                  sub: "Avg accuracy",
                  icon: Sparkles,
                  bg: "bg-emerald-500/[0.08]", iconColor: "text-emerald-700", border: "border-emerald-500/15"
                },
                {
                  label: "Ease of Use",
                  value: feedbackStats ? `${feedbackStats.averageRatings?.easeOfUse || 0} / 5` : "0 / 5",
                  sub: "Avg usability",
                  icon: MousePointer,
                  bg: "bg-violet-500/[0.08]", iconColor: "text-violet-700", border: "border-violet-500/15"
                },
                {
                  label: "UI Design",
                  value: feedbackStats ? `${feedbackStats.averageRatings?.uiDesign || 0} / 5` : "0 / 5",
                  sub: "Avg visual rating",
                  icon: Palette,
                  bg: "bg-pink-500/[0.08]", iconColor: "text-pink-700", border: "border-pink-500/15"
                },
              ].map(({ label, value, sub, icon: Icon, bg, iconColor, border }, i) => (
                <div
                  key={label}
                  className="bg-white rounded-xl p-5 border border-black/[0.08] hover:border-black/20 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono font-bold leading-tight truncate">{label}</span>
                    <div className={`w-7.5 h-7.5 ${bg} ${border} border rounded flex items-center justify-center text-muted-foreground flex-shrink-0`}>
                      <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                    </div>
                  </div>
                  <p className="text-xl font-black text-foreground font-mono leading-none mt-1">{value}</p>
                  <p className="text-[9px] font-mono text-muted-foreground/70 uppercase tracking-wider mt-3 pt-1 border-t border-black/[0.04]">{sub}</p>
                </div>
              ))}
            </div>

            {/* Row 2: Rating Distribution Bar Chart & NPS Category Breakdown */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Rating Distribution Bar Chart */}
              <div className="bg-white rounded-xl border border-black/[0.08] p-6">
                <h3 className="font-black text-xs text-foreground uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>Rating Distribution</h3>
                <p className="text-xs text-muted-foreground mb-6">Overall experience star breakdown</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={feedbackStats?.ratingDistribution || []} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" vertical={false} />
                    <XAxis dataKey="rating" tick={{ fontSize: 9, fill: "#888899", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#888899", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]} name="Responses" fill="#0052CC" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* NPS Category Breakdown */}
              <div className="bg-white rounded-xl border border-black/[0.08] p-6">
                <h3 className="font-black text-xs text-foreground uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>NPS Segment Breakdown</h3>
                <p className="text-xs text-muted-foreground mb-6">Net Promoter Score representation</p>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Promoters (9-10)", value: feedbackStats?.nps?.promoters || 0, fill: "#10B981" },
                          { name: "Passives (7-8)", value: feedbackStats?.nps?.passives || 0, fill: "#F59E0B" },
                          { name: "Detractors (0-6)", value: feedbackStats?.nps?.detractors || 0, fill: "#EF4444" },
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {[
                          { name: "Promoters (9-10)", value: feedbackStats?.nps?.promoters || 0, fill: "#10B981" },
                          { name: "Passives (7-8)", value: feedbackStats?.nps?.passives || 0, fill: "#F59E0B" },
                          { name: "Detractors (0-6)", value: feedbackStats?.nps?.detractors || 0, fill: "#EF4444" },
                        ].filter(d => d.value > 0).map((entry: any) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 w-full space-y-3 font-mono text-[10px] uppercase font-bold tracking-wider">
                    {[
                      { name: "Promoters (9-10)", value: feedbackStats?.nps?.promoters || 0, fill: "#10B981" },
                      { name: "Passives (7-8)", value: feedbackStats?.nps?.passives || 0, fill: "#F59E0B" },
                      { name: "Detractors (0-6)", value: feedbackStats?.nps?.detractors || 0, fill: "#EF4444" },
                    ].map(({ name, value, fill }) => {
                      const totalNps = (feedbackStats?.nps?.promoters || 0) + (feedbackStats?.nps?.passives || 0) + (feedbackStats?.nps?.detractors || 0) || 1;
                      const percentage = Math.round((value / totalNps) * 100) || 0;
                      return (
                        <div key={name} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: fill }} />
                              <span className="font-bold text-muted-foreground truncate">{name}</span>
                            </div>
                            <span className="font-bold text-black">{percentage}% ({value})</span>
                          </div>
                          <div className="h-1.5 bg-black/[0.03] border border-black/[0.05] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: fill }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Most Loved Feature & Recent Candidate Comments */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Most Loved Feature Breakdown */}
              <div className="bg-white rounded-xl border border-black/[0.08] p-6">
                <h3 className="font-black text-xs text-foreground uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>Most Loved Feature</h3>
                <p className="text-xs text-muted-foreground mb-6">Features most favored by candidates</p>
                {feedbackStats?.featureDistribution && feedbackStats.featureDistribution.length > 0 ? (
                  <div className="space-y-4">
                    {feedbackStats.featureDistribution.map((item: any, i: number) => {
                      const colors = ["#0052CC", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#EC4899"];
                      return (
                        <div key={item.feature} className="space-y-1 font-mono text-[10px] uppercase font-bold tracking-wider">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-black">{item.feature}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground font-normal">{item.count} votes</span>
                              <span className="text-black">{item.pct}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-black/[0.03] border border-black/[0.05] rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: colors[i % colors.length] }}
                              initial={{ width: 0 }}
                              animate={{ width: `${item.pct}%` }}
                              transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.05 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-xs font-mono uppercase tracking-wider">
                    No feature popularity votes available.
                  </div>
                )}
              </div>

              {/* Recent Comments */}
              <div className="bg-white rounded-xl border border-black/[0.08] p-6">
                <h3 className="font-black text-xs text-foreground uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>Recent Candidate Comments</h3>
                <p className="text-xs text-muted-foreground mb-6">Latest qualitative comments from candidate feedback</p>
                {feedbackStats?.recentComments && feedbackStats.recentComments.length > 0 ? (
                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                    {feedbackStats.recentComments.map((c: any, index: number) => {
                      const avatarColors = [
                        "bg-violet-50 border-violet-100 text-violet-700",
                        "bg-emerald-50 border-emerald-100 text-emerald-700",
                        "bg-sky-50 border-sky-100 text-sky-700",
                        "bg-orange-50 border-orange-100 text-orange-700",
                        "bg-rose-50 border-rose-100 text-rose-700"
                      ];
                      const colorClass = avatarColors[index % avatarColors.length];
                      return (
                        <div
                          key={index}
                          className="p-3.5 rounded-lg bg-black/[0.005] border border-black/[0.06] space-y-2 text-left"
                        >
                          <div className="flex items-center justify-between font-mono">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded border flex items-center justify-center text-xs font-bold ${colorClass}`}>
                                {c.initials}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-black uppercase tracking-wide leading-tight">
                                  {c.jobTitle}
                                </p>
                                <p className="text-[9px] text-muted-foreground mt-0.5">
                                  {c.date}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, starIdx) => (
                                <Star
                                  key={starIdx}
                                  className={`w-3 h-3 ${
                                    starIdx < c.rating
                                      ? "text-amber-500 fill-amber-500"
                                      : "text-black/[0.08]"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-foreground/80 italic pl-1 leading-relaxed">
                            "{c.comment}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-xs font-mono uppercase tracking-wider">
                    No comments submitted yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
