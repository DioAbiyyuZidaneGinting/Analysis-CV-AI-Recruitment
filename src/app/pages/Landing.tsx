import { useNavigate } from "react-router";
import { motion, useInView } from "motion/react";
import { useRef, useEffect, useState } from "react";
import {
  Sparkles, Brain, TrendingUp, Users, FileText, CheckCircle,
  ArrowRight, Star, Zap, Shield, BarChart3, Upload, Search,
  ChevronRight, Play, Award, Clock, Target
} from "lucide-react";

function AnimatedCounter({ end, duration = 2, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] } }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export function LandingPage() {
  const navigate = useNavigate();
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]"
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              Talent<span className="text-primary">AI</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Pricing", "Blog"].map((item) => (
              <a key={item} href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-semibold text-foreground px-4 py-2 rounded-xl hover:bg-muted transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate("/register")}
              className="text-sm font-semibold text-white bg-primary px-5 py-2 rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-[5%] w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute top-32 right-[15%] w-72 h-72 border-2 border-dashed border-primary/10 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            className="absolute top-40 right-[20%] w-48 h-48 border border-dashed border-secondary/15 rounded-full"
          />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-2 bg-[#e9d5ff] text-primary px-4 py-2 rounded-full text-sm font-semibold border border-primary/20">
                  <Zap className="w-3.5 h-3.5" />
                  AI-Powered Recruitment Platform
                </span>
              </motion.div>
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-5xl lg:text-6xl xl:text-7xl leading-[1.05] tracking-tight"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
              >
                Find The Right{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-primary">Talent.</span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.5, ease: "easeOut" }}
                    className="absolute bottom-1 left-0 right-0 h-3 bg-[#e9d5ff] -z-0 origin-left"
                  />
                </span>
                <br />
                Build Your Future.
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-md leading-relaxed">
                AI-powered recruitment and CV intelligence platform. Analyze resumes instantly, predict hiring success, and match the perfect candidates — all in one place.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate("/register?role=candidate")}
                  className="flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-2xl font-bold hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Analyze My CV
                </button>
                <button
                  onClick={() => navigate("/register?role=recruiter")}
                  className="flex items-center gap-2 bg-white text-foreground px-7 py-3.5 rounded-2xl font-bold border-2 border-black/10 hover:border-primary/30 hover:bg-[#f8f8fc] transition-all text-sm"
                >
                  <Search className="w-4 h-4" />
                  Recruit Talent
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
              <motion.div variants={fadeUp} custom={4} className="flex items-center gap-6 pt-2">
                <div className="flex -space-x-3">
                  {["bg-primary", "bg-secondary", "bg-accent", "bg-[#f472b6]"].map((bg, i) => (
                    <div key={i} className={`w-9 h-9 ${bg} rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                      {["JD", "SK", "AR", "ML"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" />)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5"><strong className="text-foreground">4.9/5</strong> from 2,400+ reviews</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right — Hero Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Main card */}
              <div className="relative bg-white rounded-3xl border-2 border-black/[0.08] shadow-2xl shadow-black/10 p-6 ml-4">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">AI CV Analysis</p>
                    <p className="font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Sarah Johnson</p>
                  </div>
                  <div className="bg-[#e9d5ff] px-3 py-1.5 rounded-full">
                    <span className="text-primary font-bold text-sm">94/100</span>
                  </div>
                </div>

                {/* Score ring mockup */}
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="38" fill="none" stroke="#f0f0f8" strokeWidth="8" />
                      <motion.circle
                        cx="48" cy="48" r="38" fill="none" stroke="#6366f1" strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="238.76"
                        initial={{ strokeDashoffset: 238.76 }}
                        animate={{ strokeDashoffset: 238.76 * 0.06 }}
                        transition={{ duration: 2, delay: 0.8, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-black text-primary" style={{ fontFamily: 'var(--font-display)' }}>94</span>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    {[
                      { label: "Skills Match", val: 92, color: "bg-primary" },
                      { label: "Experience", val: 88, color: "bg-secondary" },
                      { label: "ATS Score", val: 96, color: "bg-[#4ade80]" },
                    ].map(({ label, val, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-semibold text-foreground">{val}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${color} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${val}%` }}
                            transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Hiring Chance", val: "87%", bg: "bg-[#b8f2e6]", text: "text-emerald-700" },
                    { label: "Job Matches", val: "24", bg: "bg-[#bae6fd]", text: "text-cyan-700" },
                    { label: "Skills Found", val: "18", bg: "bg-[#ffd6a5]", text: "text-orange-700" },
                  ].map(({ label, val, bg, text }) => (
                    <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                      <p className={`font-black text-lg ${text}`} style={{ fontFamily: 'var(--font-display)' }}>{val}</p>
                      <p className="text-xs text-foreground/60 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badge 1 */}
              <motion.div
                animate={{ y: [-6, 6, -6] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-white rounded-2xl border-2 border-black/[0.08] shadow-lg p-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 bg-[#4ade80]/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-[#4ade80]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Interview Scheduled</p>
                  <p className="text-xs text-muted-foreground">Google · 2h ago</p>
                </div>
              </motion.div>

              {/* Floating badge 2 */}
              <motion.div
                animate={{ y: [6, -6, 6] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-2xl border-2 border-black/[0.08] shadow-lg p-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">AI Matching</p>
                  <p className="text-xs text-muted-foreground">312 candidates analyzed</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 px-6 bg-[#f8f8fc] border-y border-black/[0.06]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { val: 50000, suffix: "+", label: "CVs Analyzed", icon: FileText, color: "text-primary", bg: "bg-[#e9d5ff]" },
              { val: 98, suffix: "%", label: "Accuracy Rate", icon: Target, color: "text-secondary", bg: "bg-[#bae6fd]" },
              { val: 12000, suffix: "+", label: "Placements Made", icon: Award, color: "text-[#f472b6]", bg: "bg-[#fce7f3]" },
              { val: 3, suffix: "x", label: "Faster Hiring", icon: Clock, color: "text-[#4ade80]", bg: "bg-[#b8f2e6]" },
            ].map(({ val, suffix, label, icon: Icon, color, bg }, i) => (
              <motion.div key={label} variants={fadeUp} custom={i} className="text-center">
                <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <p className={`text-4xl font-black ${color}`} style={{ fontFamily: 'var(--font-display)' }}>
                  <AnimatedCounter end={val} suffix={suffix} />
                </p>
                <p className="text-sm text-muted-foreground mt-1 font-medium">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-primary font-bold text-sm uppercase tracking-widest mb-4">
              Why TalentAI
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-4xl lg:text-5xl font-black tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              The smarter way to hire
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
              From CV upload to final hire, our AI handles the heavy lifting so you can focus on what matters most — people.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Brain, title: "AI CV Intelligence",
                desc: "Deep learning models extract skills, experience, and potential from any CV format in under 3 seconds.",
                bg: "bg-[#e9d5ff]", iconColor: "text-primary", border: "border-primary/20",
                tag: "Candidate",
              },
              {
                icon: TrendingUp, title: "Hiring Probability Score",
                desc: "Predict interview success and culture fit with our proprietary scoring algorithm trained on 500K+ placements.",
                bg: "bg-[#b8f2e6]", iconColor: "text-emerald-600", border: "border-emerald-200",
                tag: "Both",
              },
              {
                icon: Users, title: "Smart Candidate Ranking",
                desc: "Automatically rank and shortlist candidates by role-specific criteria, saving 70% of screening time.",
                bg: "bg-[#bae6fd]", iconColor: "text-sky-600", border: "border-sky-200",
                tag: "Recruiter",
              },
              {
                icon: BarChart3, title: "Recruitment Analytics",
                desc: "Real-time dashboards showing pipeline health, time-to-hire, diversity metrics, and AI recommendations.",
                bg: "bg-[#ffd6a5]", iconColor: "text-orange-600", border: "border-orange-200",
                tag: "Recruiter",
              },
              {
                icon: Shield, title: "ATS Optimization",
                desc: "Get instant feedback to make your CV ATS-friendly and dramatically increase callback rates.",
                bg: "bg-[#fce7f3]", iconColor: "text-pink-600", border: "border-pink-200",
                tag: "Candidate",
              },
              {
                icon: Zap, title: "One-Click Apply",
                desc: "Apply to perfectly matched roles instantly. TalentAI auto-fills applications from your analyzed CV.",
                bg: "bg-[#e9d5ff]", iconColor: "text-violet-600", border: "border-violet-200",
                tag: "Candidate",
              },
            ].map(({ icon: Icon, title, desc, bg, iconColor, border, tag }, i) => (
              <motion.div
                key={title}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`relative p-6 bg-white rounded-3xl border-2 ${border} hover:shadow-xl hover:shadow-black/5 transition-shadow cursor-default group`}
              >
                <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <span className="absolute top-4 right-4 text-xs font-semibold bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  {tag}
                </span>
                <h3 className="font-black text-lg text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  {title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                <div className="mt-4 flex items-center gap-1 text-primary text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-[#f8f8fc]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary font-bold text-sm uppercase tracking-widest mb-4">How It Works</p>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              From upload to offer
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Candidate flow */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-xl" style={{ fontFamily: 'var(--font-display)' }}>For Candidates</h3>
              </div>
              <div className="space-y-6">
                {[
                  { step: "01", title: "Upload Your CV", desc: "Drag & drop any format — PDF, Word, or plain text.", color: "bg-[#e9d5ff] text-primary" },
                  { step: "02", title: "Get AI Analysis", desc: "Receive your CV score, skill breakdown, and hiring probability in seconds.", color: "bg-[#bae6fd] text-sky-600" },
                  { step: "03", title: "Apply with Confidence", desc: "Apply to matched jobs with one click and track every application in real-time.", color: "bg-[#b8f2e6] text-emerald-600" },
                ].map(({ step, title, desc, color }) => (
                  <div key={step} className="flex gap-4">
                    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm`}>
                      {step}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-1">{title}</h4>
                      <p className="text-muted-foreground text-sm">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/register?role=candidate")}
                className="mt-8 flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all"
              >
                Start as Candidate <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {/* Recruiter flow */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-secondary rounded-2xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-xl" style={{ fontFamily: 'var(--font-display)' }}>For Recruiters</h3>
              </div>
              <div className="space-y-6">
                {[
                  { step: "01", title: "Post & Receive Applications", desc: "Post jobs and let candidates flow in. AI pre-screens all applicants automatically.", color: "bg-[#ffd6a5] text-orange-600" },
                  { step: "02", title: "AI Evaluates & Ranks", desc: "Each candidate gets an AI evaluation score, skill match, and cultural fit prediction.", color: "bg-[#fce7f3] text-pink-600" },
                  { step: "03", title: "Accept or Reject Instantly", desc: "Make informed decisions with AI reasoning. Move candidates through your pipeline effortlessly.", color: "bg-[#e9d5ff] text-violet-600" },
                ].map(({ step, title, desc, color }) => (
                  <div key={step} className="flex gap-4">
                    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm`}>
                      {step}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-1">{title}</h4>
                      <p className="text-muted-foreground text-sm">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/register?role=recruiter")}
                className="mt-8 flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-secondary/90 transition-all"
              >
                Start as Recruiter <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Loved by recruiters & candidates
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "TalentAI cut our time-to-hire by 65%. The AI ranking is scarily accurate — it shortlisted exactly the candidates we ended up hiring.",
                name: "Marcus Chen", role: "Head of Talent, Stripe", avatar: "MC", bg: "bg-primary",
                stars: 5,
              },
              {
                quote: "I uploaded my CV and got a 91/100 score with specific improvements. Within 2 weeks I had 3 interviews. This platform is a game-changer.",
                name: "Priya Sharma", role: "Software Engineer", avatar: "PS", bg: "bg-secondary",
                stars: 5,
              },
              {
                quote: "The recruiter dashboard is intuitive and the candidate cards show everything I need at a glance. My team adopted it in one day.",
                name: "Rachel Torres", role: "Recruiting Manager, Figma", avatar: "RT", bg: "bg-[#f472b6]",
                stars: 5,
              },
            ].map(({ quote, name, role, avatar, bg, stars }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white p-6 rounded-3xl border-2 border-black/[0.06] hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed text-sm mb-6">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                    {avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-primary rounded-3xl p-12 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
                <Play className="w-3.5 h-3.5" /> Free to start
              </span>
              <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Ready to hire smarter?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                Join 12,000+ companies and 50,000+ candidates who use TalentAI to find the perfect match.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => navigate("/register?role=candidate")}
                  className="bg-white text-primary px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/90 transition-all"
                >
                  Analyze My CV — Free
                </button>
                <button
                  onClick={() => navigate("/register?role=recruiter")}
                  className="bg-white/10 border border-white/30 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/20 transition-all"
                >
                  Start Recruiting
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-black/[0.06]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Talent<span className="text-primary">AI</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 TalentAI. All rights reserved.</p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Contact"].map(item => (
              <a key={item} href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
