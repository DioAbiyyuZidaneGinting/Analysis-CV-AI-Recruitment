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
    fetch("/api/recruiter/reports/stats", {
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

    fetch("/api/recruiter/feedback/analytics", {
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

  const kpis = [
    { label: "Total Candidates", value: stats ? String(stats.totalCandidates) : "0", sub: "Unique pipeline candidates", icon: Users, bg: "bg-[#bae6fd]", iconColor: "text-sky-600", trend: "text-sky-600" },
    { label: "Total Applications", value: stats ? String(stats.totalApplications) : "0", sub: "Active job applications", icon: BarChart3, bg: "bg-[#ffd6a5]", iconColor: "text-orange-600", trend: "text-orange-600" },
    { label: "Average CV Score", value: stats ? `${stats.averageCvScore}/100` : "--", sub: "Recruiter pool quality", icon: Award, bg: "bg-[#b8f2e6]", iconColor: "text-emerald-600", trend: "text-emerald-600" },
    { label: "Pipeline Conversion", value: stats ? stats.pipelineConversion : "0%", sub: "Candidates past screening", icon: TrendingUp, bg: "bg-[#e9d5ff]", iconColor: "text-primary", trend: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              Recruitment Reports
            </h1>
            <p className="text-muted-foreground mt-1">Analytics and insights for your hiring pipeline</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-muted rounded-xl p-1 gap-1">
              {(["week", "month", "quarter"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                    period === p ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 bg-white border border-black/[0.08] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-black/[0.06] mb-6">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`pb-3 px-1 text-sm font-black border-b-2 transition-all relative ${
              activeTab === "pipeline"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Pipeline Analytics
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`pb-3 px-1 text-sm font-black border-b-2 transition-all relative ml-6 ${
              activeTab === "feedback"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Candidate Feedback
          </button>
        </div>

      {activeTab === "pipeline" ? (
        loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map(({ label, value, sub, icon: Icon, bg, iconColor, trend }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl p-5 border border-black/[0.06] hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <p className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
                  <p className={`text-xs font-medium mt-2 ${trend}`}>{sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Main chart — Hiring Trends */}
            <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-black text-lg text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Hiring Trends</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Applications, reviews, and hires over time</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  {[
                    { color: "#06b6d4", label: "Applied" },
                    { color: "#6366f1", label: "Hired" },
                    { color: "#fca5a5", label: "Rejected" },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-muted-foreground font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={hiringTrendsData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="applied" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="hired" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b6b80" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#6b6b80" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="applied" stroke="#06b6d4" strokeWidth={2.5} fill="url(#applied)" name="Applied" />
                  <Area type="monotone" dataKey="hired" stroke="#6366f1" strokeWidth={2.5} fill="url(#hired)" name="Hired" />
                  <Area type="monotone" dataKey="rejected" stroke="#rejected" strokeWidth={2} fill="none" name="Rejected" strokeDasharray="4 4" strokeColor="#fca5a5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Row 2: CV Score distribution + Category pie */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* CV Score Distribution */}
              <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
                <h2 className="font-black text-base text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>CV Score Distribution</h2>
                <p className="text-sm text-muted-foreground mb-6">Breakdown of applicant quality scores</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={cvScoreDistData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" vertical={false} />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#6b6b80" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#6b6b80" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} name="Candidates">
                      {cvScoreDistData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category breakdown */}
              <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
                <h2 className="font-black text-base text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>Candidate Categories</h2>
                <p className="text-sm text-muted-foreground mb-6">Application distribution by job category</p>
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
                        {dynamicCategories.map((entry: any, i: number) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2.5">
                    {dynamicCategories.map(({ name, value, fill }: any) => (
                      <div key={name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: fill }} />
                          <span className="text-sm text-foreground font-medium">{name}</span>
                        </div>
                        <span className="text-sm font-black text-foreground">{value} candidates</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Skill distribution radar + Source breakdown */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Skill radar */}
              <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
                <h2 className="font-black text-base text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>Skill Distribution</h2>
                <p className="text-sm text-muted-foreground mb-4">Most common skills in candidate pool</p>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={skillDistributionData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                    <PolarGrid stroke="#f0f0f8" />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "#6b6b80" }} />
                    <Radar name="Candidates" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Source breakdown */}
              <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
                <h2 className="font-black text-base text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>Application Sources</h2>
                <p className="text-sm text-muted-foreground mb-6">Where your best candidates come from</p>
                <div className="space-y-4">
                  {SOURCE_DATA.map(({ source, count, pct }, i) => {
                    const colors = ["#6366f1", "#06b6d4", "#f472b6", "#ffb86c"];
                    return (
                      <div key={source}>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-semibold text-foreground">{source}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{count} candidates</span>
                            <span className="font-black text-foreground">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: colors[i] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.1 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="bg-[#e9d5ff] rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-primary" style={{ fontFamily: 'var(--font-display)' }}>{totalAppsCount}</p>
                    <p className="text-xs text-primary/70 font-medium">Total Applications</p>
                  </div>
                  <div className="bg-[#b8f2e6] rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-emerald-700" style={{ fontFamily: 'var(--font-display)' }}>{hiredCount}</p>
                    <p className="text-xs text-emerald-600 font-medium">Total Hired</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: Funnel + time metrics */}
            <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
              <h2 className="font-black text-base text-foreground mb-6" style={{ fontFamily: 'var(--font-display)' }}>Recruitment Funnel</h2>
              <div className="flex items-end gap-4 min-h-[220px]">
                {funnelData.map(({ stage, count, color, text }: any, i: number) => {
                  const maxH = 200;
                  const totalCount = funnelData[0].count || 1;
                  const pct = count / totalCount;
                  
                  const nextCount = i < 4 ? funnelData[i + 1].count : 0;
                  const conversionPct = count > 0 ? Math.round((nextCount / count) * 100) : 0;
                  
                  return (
                    <div key={stage} className="flex flex-col items-center gap-2 flex-1">
                      <p className="text-sm font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{count}</p>
                      <motion.div
                        className={`w-full ${color} rounded-t-xl`}
                        initial={{ height: 0 }}
                        animate={{ height: Math.max(pct * maxH, 24) }}
                        transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
                      />
                      <p className={`text-xs font-semibold text-center ${i === 4 ? "text-primary" : "text-muted-foreground"}`}>{stage}</p>
                      {i < 4 && (
                        <p className="text-xs text-muted-foreground font-bold">
                          {conversionPct}% conversion
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
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
                  bg: "bg-[#bae6fd]",
                  iconColor: "text-sky-600",
                },
                {
                  label: "Overall rating",
                  value: feedbackStats ? `${feedbackStats.averageRatings?.overall || 0} / 5` : "0 / 5",
                  sub: "Avg rating",
                  icon: Star,
                  bg: "bg-[#ffd6a5]",
                  iconColor: "text-orange-600",
                },
                {
                  label: "Net Promoter Score",
                  value: feedbackStats ? String(feedbackStats.nps?.score || 0) : "0",
                  sub: `Score (${feedbackStats?.nps?.average || 0}/10)`,
                  icon: Heart,
                  bg: "bg-[#fecdd3]",
                  iconColor: "text-rose-600",
                },
                {
                  label: "AI Quality",
                  value: feedbackStats ? `${feedbackStats.averageRatings?.recommendationAccuracy || 0} / 5` : "0 / 5",
                  sub: "Avg accuracy",
                  icon: Sparkles,
                  bg: "bg-[#b8f2e6]",
                  iconColor: "text-emerald-600",
                },
                {
                  label: "Ease of Use",
                  value: feedbackStats ? `${feedbackStats.averageRatings?.easeOfUse || 0} / 5` : "0 / 5",
                  sub: "Avg usability",
                  icon: MousePointer,
                  bg: "bg-[#e9d5ff]",
                  iconColor: "text-primary",
                },
                {
                  label: "UI Design",
                  value: feedbackStats ? `${feedbackStats.averageRatings?.uiDesign || 0} / 5` : "0 / 5",
                  sub: "Avg visual rating",
                  icon: Palette,
                  bg: "bg-[#fed7aa]",
                  iconColor: "text-orange-500",
                },
              ].map(({ label, value, sub, icon: Icon, bg, iconColor }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl p-5 border border-black/[0.06] hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <p className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                      {value}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground mt-2">{sub}</p>
                </div>
              ))}
            </div>

            {/* Row 2: Rating Distribution Bar Chart & NPS Category Breakdown */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Rating Distribution Bar Chart */}
              <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
                <h2 className="font-black text-base text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Rating Distribution
                </h2>
                <p className="text-sm text-muted-foreground mb-6">Overall experience star breakdown</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={feedbackStats?.ratingDistribution || []} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" vertical={false} />
                    <XAxis dataKey="rating" tick={{ fontSize: 11, fill: "#6b6b80" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#6b6b80" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} name="Responses" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* NPS Category Breakdown */}
              <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
                <h2 className="font-black text-base text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  NPS Segment Breakdown
                </h2>
                <p className="text-sm text-muted-foreground mb-6">Net Promoter Score representation</p>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Promoters (9-10)", value: feedbackStats?.nps?.promoters || 0, fill: "#22c55e" },
                          { name: "Passives (7-8)", value: feedbackStats?.nps?.passives || 0, fill: "#f59e0b" },
                          { name: "Detractors (0-6)", value: feedbackStats?.nps?.detractors || 0, fill: "#ef4444" },
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {[
                          { name: "Promoters (9-10)", value: feedbackStats?.nps?.promoters || 0, fill: "#22c55e" },
                          { name: "Passives (7-8)", value: feedbackStats?.nps?.passives || 0, fill: "#f59e0b" },
                          { name: "Detractors (0-6)", value: feedbackStats?.nps?.detractors || 0, fill: "#ef4444" },
                        ].filter(d => d.value > 0).map((entry: any) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 w-full space-y-3">
                    {[
                      { name: "Promoters (9-10)", value: feedbackStats?.nps?.promoters || 0, fill: "#22c55e" },
                      { name: "Passives (7-8)", value: feedbackStats?.nps?.passives || 0, fill: "#f59e0b" },
                      { name: "Detractors (0-6)", value: feedbackStats?.nps?.detractors || 0, fill: "#ef4444" },
                    ].map(({ name, value, fill }) => {
                      const totalNps = (feedbackStats?.nps?.promoters || 0) + (feedbackStats?.nps?.passives || 0) + (feedbackStats?.nps?.detractors || 0) || 1;
                      const percentage = Math.round((value / totalNps) * 100) || 0;
                      return (
                        <div key={name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: fill }} />
                              <span className="font-semibold text-foreground truncate">{name}</span>
                            </div>
                            <span className="font-bold text-foreground">{percentage}% ({value})</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
              <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
                <h2 className="font-black text-base text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Most Loved Feature
                </h2>
                <p className="text-sm text-muted-foreground mb-6">Features most favored by candidates</p>
                {feedbackStats?.featureDistribution && feedbackStats.featureDistribution.length > 0 ? (
                  <div className="space-y-4">
                    {feedbackStats.featureDistribution.map((item: any, i: number) => {
                      const colors = ["#8b5cf6", "#06b6d4", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
                      return (
                        <div key={item.feature} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-foreground">{item.feature}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-xs">{item.count} choices</span>
                              <span className="font-bold text-foreground">{item.pct}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: colors[i % colors.length] }}
                              initial={{ width: 0 }}
                              animate={{ width: `${item.pct}%` }}
                              transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.1 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No feature popularity votes available.
                  </div>
                )}
              </div>

              {/* Recent Comments */}
              <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
                <h2 className="font-black text-base text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Recent Candidate Comments
                </h2>
                <p className="text-sm text-muted-foreground mb-6">Latest qualitative comments from candidate feedback</p>
                {feedbackStats?.recentComments && feedbackStats.recentComments.length > 0 ? (
                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                    {feedbackStats.recentComments.map((c: any, index: number) => {
                      const avatarColors = [
                        "bg-violet-100 text-violet-700",
                        "bg-emerald-100 text-emerald-700",
                        "bg-sky-100 text-sky-700",
                        "bg-orange-100 text-orange-700",
                        "bg-rose-100 text-rose-700"
                      ];
                      const colorClass = avatarColors[index % avatarColors.length];
                      return (
                        <div
                          key={index}
                          className="p-3.5 rounded-xl bg-gray-50 border border-black/[0.04] space-y-2 text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${colorClass}`}>
                                {c.initials}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-foreground leading-tight">
                                  {c.jobTitle}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {c.date}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, starIdx) => (
                                <Star
                                  key={starIdx}
                                  className={`w-3.5 h-3.5 ${
                                    starIdx < c.rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-200 fill-gray-200"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-foreground/90 italic pl-1 leading-relaxed">
                            "{c.comment}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-sm">
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
