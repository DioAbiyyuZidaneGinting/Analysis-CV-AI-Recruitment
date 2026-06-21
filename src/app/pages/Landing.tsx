import { useNavigate } from "react-router";
import { useRef, useEffect, useState, useCallback } from "react";
import "../../styles/landing.css";

/* ── Animated Terminal Feed ── */
function TerminalFeed() {
  const [stage, setStage] = useState(0);
  const [loadPct, setLoadPct] = useState(12);
  const [scanScale, setScanScale] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStage((s) => {
        const next = (s + 1) % 3;
        setLoadPct([12, 68, 94][next]);
        if (next === 1) { setScanScale(0); setTimeout(() => setScanScale(1), 50); }
        return next;
      });
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-black text-white rounded-3xl p-8 h-full min-h-[380px] relative overflow-hidden flex flex-col">
      <div className="scan-line" />
      <div className="flex justify-between items-center mb-8 relative z-10 bg-black/50 backdrop-blur-sm -mx-2 px-2 py-1 rounded">
        <span className="mono-label opacity-40 text-[10px]">Live Analysis Feed</span>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      </div>

      <div className="relative flex-grow">
        {/* Stage 1: CV Input */}
        <div className={`stage-view flex flex-col items-center justify-center text-center space-y-4 ${stage === 0 ? "active" : ""}`}>
          <div className="w-16 h-16 border border-white/20 rounded-lg flex items-center justify-center animate-bounce">
            <span className="material-symbols-outlined text-white/40 text-3xl">description</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)" }} className="text-[12px] space-y-2">
            <p className="text-white">INGESTING PAYLOAD...</p>
            <p className="opacity-40">Source: user cv upload.pdf</p>
            <div className="flex justify-center gap-1 mt-2">
              <span className="w-1 h-1 bg-white rounded-full animate-ping" />
              <span className="w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: "0.2s" }} />
              <span className="w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        </div>

        {/* Stage 2: AI Analysis */}
        <div className={`stage-view flex flex-col justify-center space-y-4 ${stage === 1 ? "active" : ""}`} style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
          <div className="space-y-1 overflow-hidden">
            <p className="text-green-500 opacity-60">Initializing Neural Engine v4...</p>
            <p className="text-green-500 opacity-80">&gt; Scanning skill vectors...</p>
            <p className="text-white">&gt; 0x4F2A: Pattern match found</p>
            <p className="text-white">&gt; Semantic analysis: 82% complete</p>
            <p className="text-[#0058be]">&gt; Extracting experience nodes...</p>
            <p className="text-white">&gt; Cross-referencing industry benchmarks</p>
            <p className="text-white">&gt; Entropy reduction active</p>
          </div>
          <div className="w-full h-px bg-white/20 relative">
            <div className="absolute inset-y-0 left-0 bg-green-500 w-full origin-left" style={{ transform: `scaleX(${scanScale})`, transition: "transform 2s linear" }} />
          </div>
          <p className="mono-label text-[9px] opacity-40 text-right">CPU EFFICIENCY: 98%</p>
        </div>

        {/* Stage 3: Results */}
        <div className={`stage-view flex flex-col justify-center space-y-6 ${stage === 2 ? "active" : ""}`}>
          <div className="border border-green-500/30 bg-green-500/5 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="mono-label text-green-500 mb-1">CANDIDATE IDENTIFIED</p>
                <h4 style={{ fontFamily: "var(--font-display)" }} className="text-xl font-bold">SARAH J.</h4>
              </div>
              <div className="text-right">
                <p className="text-[24px] font-bold text-green-500 tracking-tighter">94%</p>
                <p className="mono-label text-[9px] opacity-40">MATCH</p>
              </div>
            </div>
            <div className="space-y-2" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              <p className="flex justify-between"><span className="opacity-40">Role:</span><span>Sr. Software Engineer</span></p>
              <p className="flex justify-between"><span className="opacity-40">Stack:</span><span className="text-[#0058be]">React, Node, PyTorch</span></p>
              <p className="flex justify-between"><span className="opacity-40">Exp:</span><span>8.2 Years</span></p>
            </div>
            <div className="pt-2">
              <button className="w-full py-2 bg-white text-black mono-label text-[10px] rounded-lg hover:bg-green-500 hover:text-white transition-colors">Generate Profile</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom load bar */}
      <div className="pt-6 mt-auto relative z-10 bg-black/50 backdrop-blur-sm -mx-2 px-2 py-1 rounded">
        <div className="flex justify-between mb-1" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
          <span className="opacity-40">PROCESSOR LOAD</span>
          <span>{loadPct}%</span>
        </div>
        <div className="w-full h-1 bg-white/10">
          <div className="h-full bg-white transition-all duration-1000" style={{ width: `${loadPct}%` }} />
        </div>
      </div>
    </div>
  );
}

/* ── Main Landing Page ── */
export function LandingPage() {
  const navigate = useNavigate();
  const cursorRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -100, y: -100 });

  // Cursor + Spotlight
  useEffect(() => {
    const cursor = cursorRef.current;
    const spotlight = spotlightRef.current;
    if (!cursor || !spotlight) return;

    let cx = -100, cy = -100, sx = -100, sy = -100;
    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);

    let raf: number;
    const tick = () => {
      const { x: mx, y: my } = mouseRef.current;
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
      sx += (mx - sx) * 0.05; sy += (my - sy) * 0.05;
      cursor.style.left = cx + "px"; cursor.style.top = cy + "px";
      spotlight.style.setProperty("--x", sx + "px");
      spotlight.style.setProperty("--y", sy + "px");
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Hover expand via event delegation
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const hoverable = target.closest("button, a, .hoverable, [role='button'], .cursor-pointer, input, select, textarea");
      if (hoverable) {
        cursor.classList.add("cursor-hover");
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const hoverable = target.closest("button, a, .hoverable, [role='button'], .cursor-pointer, input, select, textarea");
      if (hoverable) {
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!relatedTarget || !relatedTarget.closest("button, a, .hoverable, [role='button'], .cursor-pointer, input, select, textarea")) {
          cursor.classList.remove("cursor-hover");
        }
      }
    };

    window.addEventListener("mouseover", onMouseOver);
    window.addEventListener("mouseout", onMouseOut);

    return () => {
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll(".landing-reveal");
    const check = () => {
      els.forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight - 80) el.classList.add("active");
      });
    };
    window.addEventListener("scroll", check);
    check();
    return () => window.removeEventListener("scroll", check);
  }, []);

  // Tile grid
  useEffect(() => {
    const hero = heroRef.current;
    const canvas = canvasRef.current;
    if (!hero || !canvas) return;

    const TILE = 48, RADIUS = 2.5, MAX_LIFT = 12, DECAY = 1500;
    const tiles = new Map<string, { el: HTMLDivElement; lastActive: number; active: boolean }>();
    const key = (c: number, r: number) => `${c},${r}`;

    let raf: number;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const rect = hero.getBoundingClientRect();
      if (rect.top >= window.innerHeight || rect.bottom <= 0) return;

      const mx = mouseRef.current.x - rect.left;
      const my = mouseRef.current.y - (rect.top + window.scrollY);
      const cols = Math.ceil(hero.offsetWidth / TILE) + 2;
      const rows = Math.ceil(hero.offsetHeight / TILE) + 2;
      const cxT = Math.floor(mx / TILE), cyT = Math.floor(my / TILE);
      const activeKeys = new Set<string>();
      const isOver = mouseRef.current.x >= rect.left && mouseRef.current.x <= rect.right &&
        mouseRef.current.y >= rect.top && mouseRef.current.y <= rect.bottom;

      if (isOver) {
        for (let dr = -Math.ceil(RADIUS); dr <= Math.ceil(RADIUS); dr++) {
          for (let dc = -Math.ceil(RADIUS); dc <= Math.ceil(RADIUS); dc++) {
            const c = cxT + dc, r = cyT + dr;
            if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
            const tx = c * TILE + TILE / 2, ty = r * TILE + TILE / 2;
            const dist = Math.sqrt((tx - mx) ** 2 + (ty - my) ** 2) / TILE;
            if (dist >= RADIUS) continue;

            const k = key(c, r);
            activeKeys.add(k);
            if (!tiles.has(k)) {
              const el = document.createElement("div");
              el.className = "tile";
              const l = 92 + Math.random() * 5;
              el.style.cssText = `width:${TILE - 4}px;height:${TILE - 4}px;left:${c * TILE + 2}px;top:${r * TILE + 2}px;background:hsl(0,0%,${l}%);border:0.5px solid rgba(0,0,0,0.03);opacity:0;transform:perspective(500px) translateZ(0px);`;
              canvas.appendChild(el);
              tiles.set(k, { el, lastActive: 0, active: false });
            }
            const t = tiles.get(k)!;
            const inf = Math.max(0, 1 - dist / RADIUS);
            const sm = inf * inf * (3 - 2 * inf);
            const lift = sm * MAX_LIFT;
            const dxN = (tx - mx) / TILE, dyN = (ty - my) / TILE;
            t.el.style.opacity = String(0.05 + sm * 0.4);
            t.el.style.transform = `perspective(500px) translateZ(${lift}px) rotateX(${dyN * sm * 10}deg) rotateY(${-dxN * sm * 10}deg)`;
            t.active = true; t.lastActive = now;
          }
        }
      }

      tiles.forEach((t, k) => {
        if (!activeKeys.has(k) && t.active) {
          const fade = Math.max(0, 1 - (now - t.lastActive) / DECAY);
          if (fade <= 0.01) { t.el.remove(); tiles.delete(k); return; }
          t.el.style.opacity = String(fade * 0.05);
          t.el.style.transform = `perspective(500px) translateZ(${fade * 2}px)`;
        }
      });
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="landing-page bg-technical custom-cursor-active" style={{ cursor: "none", fontFamily: "var(--font-body)", fontSize: 14 }}>
      {/* Spotlight + Cursor */}
      <div className="spotlight-overlay" ref={spotlightRef} />
      <div className="custom-cursor" ref={cursorRef} />

      {/* ── NAV ── */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[1440px] z-50">
        <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl h-16 flex justify-between items-center px-8 shadow-sm">
          <div style={{ fontFamily: "var(--font-display)" }} className="text-[18px] font-extrabold tracking-tighter uppercase flex items-center gap-2">
            <span className="w-2 h-2 bg-black rounded-full" />
            TalentLensAI
          </div>
          <div className="hidden lg:flex gap-8 items-center mono-label font-semibold">
            <a href="#" className="hover:opacity-40 transition-opacity">[ Home ]</a>
            <a href="#features" className="hover:opacity-40 transition-opacity">[ Features ]</a>
            <a href="#how-it-works" className="hover:opacity-40 transition-opacity">[ Process ]</a>
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={() => navigate("/login")} className="mono-label hover:opacity-40 transition-opacity hidden sm:block">Sign In</button>
            <button onClick={() => navigate("/register")} className="bg-black text-white px-5 py-2.5 mono-label hover:bg-white hover:text-black border border-black transition-all rounded-full text-[10px]">Get Started</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <main ref={heroRef} className="max-w-[1440px] mx-auto px-8 lg:px-16 pt-32 pb-12 relative overflow-hidden">
        <div className="tile-canvas" ref={canvasRef} />
        <div className="relative z-[2] space-y-4">
          {/* Top Bento */}
          <div className="asymmetric-bento items-stretch">
            {/* Headline */}
            <div className="lg:col-span-8 bg-white/40 border-technical rounded-3xl p-10 flex flex-col justify-between landing-reveal active">
              <h1 style={{ fontFamily: "var(--font-display)" }} className="text-[48px] sm:text-[64px] lg:text-[100px] font-extrabold leading-[0.85] tracking-[-0.05em] mb-12">
                FIND THE RIGHT<br />
                <span className="text-[#0058be]">TALENT.</span><br />
                <span className="opacity-20 italic">BUILD FUTURE.</span>
              </h1>
              <div className="flex flex-wrap gap-4 mt-auto">
                <button onClick={() => navigate("/register?role=candidate")} className="bg-black text-white px-8 py-4 mono-label flex items-center gap-4 group rounded-full">
                  Analyze CV
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
                </button>
                <button onClick={() => navigate("/register?role=recruiter")} className="bg-white border border-black/10 text-black px-8 py-4 mono-label hover:bg-black hover:text-white transition-all rounded-full">
                  Hiring Portal
                </button>
              </div>
            </div>
            {/* Terminal */}
            <div className="lg:col-span-4">
              <TerminalFeed />
            </div>
          </div>

          {/* Metrics */}
          <div className="asymmetric-bento items-stretch mt-4">
            <div className="lg:col-span-3 bg-white/60 border-technical rounded-2xl p-6 landing-reveal active" style={{ transitionDelay: "0.2s" }}>
              <div className="mb-2 opacity-30"><span className="material-symbols-outlined text-[18px]">description</span></div>
              <div style={{ fontFamily: "var(--font-display)" }} className="text-[42px] font-extrabold tracking-tighter">50K+</div>
              <div className="mono-label mt-1 opacity-60">CVs Indexed</div>
            </div>
            <div className="lg:col-span-3 bg-white/60 border-technical rounded-2xl p-6 landing-reveal active" style={{ transitionDelay: "0.3s" }}>
              <div className="mb-2 opacity-30"><span className="material-symbols-outlined text-[18px]">target</span></div>
              <div style={{ fontFamily: "var(--font-display)" }} className="text-[42px] font-extrabold tracking-tighter text-[#0058be]">98%</div>
              <div className="mono-label mt-1 opacity-60">AI Accuracy</div>
            </div>
            <div className="lg:col-span-6 bg-white/60 border-technical rounded-2xl p-6 flex items-center landing-reveal active" style={{ transitionDelay: "0.4s" }}>
              <p className="text-[16px] leading-tight opacity-70 max-w-sm">
                Leveraging neural networks to eliminate manual screening and find hidden potential in seconds.
              </p>
              <div className="ml-auto flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200" />
                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-300" />
                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── FEATURES ── */}
      <section className="max-w-[1440px] mx-auto px-8 lg:px-16 py-12" id="features">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 landing-reveal active">
          <div>
            <div className="mono-label opacity-40 mb-3">PLATFORM FEATURES</div>
            <h2 style={{ fontFamily: "var(--font-display)" }} className="text-[48px] lg:text-[64px] font-extrabold tracking-[-0.04em] uppercase leading-[0.9]">
              CORE ENGINE
            </h2>
          </div>
          <p className="max-w-xs opacity-50 text-[16px]">Integrated intelligence layers for high performance recruitment infrastructure.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 md:row-span-2 bg-white/60 border-technical p-10 rounded-3xl relative overflow-hidden group landing-reveal active shadow-sm hoverable transition-all hover:bg-white/80 hover:border-black/10">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-[80px]">terminal</span>
            </div>
            <div className="mono-label opacity-30 mb-20">[1]</div>
            <h3 style={{ fontFamily: "var(--font-display)" }} className="text-3xl font-extrabold mb-4 uppercase tracking-tight">AI CV Intelligence</h3>
            <p className="opacity-60 leading-relaxed text-lg mb-8">Deep learning models extract skills, experience, and potential from any CV format in under 3 seconds.</p>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-black/5 rounded-full mono-label text-[9px]">Neural Parsing</span>
              <span className="px-3 py-1 bg-black/5 rounded-full mono-label text-[9px]">Multi format</span>
            </div>
          </div>
          {[
            { id: "2", title: "Hiring Probability", desc: "Predict interview success and culture fit with proprietary scoring algorithms." },
            { id: "3", title: "Smart Ranking", desc: "Automatically rank and shortlist candidates by role specific criteria instantly." },
          ].map((f) => (
            <div key={f.id} className="bg-white/60 border-technical p-8 rounded-3xl group landing-reveal active shadow-sm hoverable transition-all hover:bg-white/80 hover:border-black/10">
              <div className="mono-label opacity-30 mb-8">{`[${f.id}]`}</div>
              <h3 style={{ fontFamily: "var(--font-display)" }} className="text-xl font-extrabold mb-3 uppercase tracking-tight">{f.title}</h3>
              <p className="opacity-60 leading-relaxed text-[13px]">{f.desc}</p>
            </div>
          ))}
          <div className="md:col-span-2 bg-white/60 border-technical p-8 rounded-3xl flex items-center justify-between group landing-reveal active shadow-sm hoverable transition-all hover:bg-white/80 hover:border-black/10">
            <div className="max-w-[60%]">
              <div className="mono-label opacity-30 mb-4">[4]</div>
              <h3 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-extrabold mb-2 uppercase tracking-tight">Analytics Suite</h3>
              <p className="opacity-60 leading-relaxed text-[14px]">Real time dashboards showing pipeline health and AI recommendations.</p>
            </div>
            <div className="w-32 h-20 bg-black/5 rounded-xl border border-black/5 flex items-end gap-1 p-3">
              <div className="flex-grow bg-black/20 h-[40%] rounded-sm" />
              <div className="flex-grow bg-black/40 h-[70%] rounded-sm" />
              <div className="flex-grow bg-black/60 h-[90%] rounded-sm" />
              <div className="flex-grow bg-black/30 h-[50%] rounded-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="max-w-[1440px] mx-auto px-8 lg:px-16 py-12" id="how-it-works">
        <div className="bg-black text-white rounded-[3rem] p-12 lg:p-20 relative overflow-hidden landing-reveal active">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 translate-x-1/2" />
          <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <div className="mono-label opacity-40 mb-6">WORKFLOW OPTIMIZATION</div>
              <h2 style={{ fontFamily: "var(--font-display)" }} className="text-[48px] lg:text-[72px] font-extrabold tracking-tighter uppercase leading-[0.9] mb-10">
                From upload<br />to offer.
              </h2>
              <button onClick={() => navigate("/register")} className="bg-white text-black px-10 py-4 mono-label rounded-full hover:bg-[#0058be] hover:text-white transition-all">
                Start System Test
              </button>
            </div>
            <div className="lg:col-span-7 space-y-6">
              {[
                { n: "01", title: "Ingestion", desc: "Drag & drop any format PDF, Word, or plain text. Our system parses structure instantly." },
                { n: "02", title: "Inference", desc: "Neural engines calculate match scores based on 400+ distinct professional vectors." },
                { n: "03", title: "Placement", desc: "Apply with precision. Integrated tracking ensures you never lose a high value candidate." },
              ].map((s) => (
                <div key={s.n} className="group py-6 border-b border-white/10 flex gap-8 items-start hover:border-white/30 transition-colors landing-reveal">
                  <span className="mono-label text-[#0058be] text-[14px]">{s.n}</span>
                  <div>
                    <h4 style={{ fontFamily: "var(--font-display)" }} className="text-xl font-bold uppercase mb-2">{s.title}</h4>
                    <p className="opacity-40 text-sm max-w-sm">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="pt-24 pb-12 bg-transparent border-t border-black/5 mt-12">
        <div className="max-w-[1440px] mx-auto px-8 lg:px-16">
          <div className="grid grid-cols-12 gap-8 mb-20">
            <div className="col-span-12 lg:col-span-6">
              <div style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-extrabold uppercase tracking-tighter mb-8 flex items-center gap-2">
                <div className="w-3 h-3 bg-black rounded-sm" />
                TalentLensAI
              </div>
              <p className="opacity-60 max-w-xs text-base leading-relaxed">
                Precision recruitment architecture. System build 2026.06.20 // Distributed via Neural Grid.
              </p>
            </div>
            <div className="col-span-6 lg:col-span-3">
              <h6 className="mono-label mb-8 opacity-50 text-[13px]">Infrastructure</h6>
              <ul className="space-y-4 mono-label text-[14px] opacity-80">
                <li><a href="#features" className="hover:text-black transition-colors">System Features</a></li>
                <li><a href="#" className="hover:text-black transition-colors">API Nodes</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Security Auth</a></li>
              </ul>
            </div>
            <div className="col-span-6 lg:col-span-3">
              <h6 className="mono-label mb-8 opacity-50 text-[13px]">Connect</h6>
              <ul className="space-y-4 mono-label text-[14px] opacity-80">
                <li><a href="#" className="hover:text-black transition-colors">Terminal Access</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Network Status</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Support Logs</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-black/5">
            <div className="mono-label opacity-50 text-[11px]">© 2026 TALENTLENSAI SYSTEMS CORE / ALL RIGHTS RESERVED</div>
            <div className="flex gap-6 mono-label opacity-50 text-[11px] mt-4 md:mt-0">
              <span>LATENCY: 12ms</span>
              <span>REGION: EU-W1</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
