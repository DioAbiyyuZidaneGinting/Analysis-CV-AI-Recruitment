import { ReactNode, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles, LayoutDashboard, FileText, Briefcase, BarChart3,
  Users, LogOut, Bell, ChevronDown, Menu, X, History, Zap
} from "lucide-react";
import { signOut } from "../utils/auth";

interface NavItem {
  icon: any;
  label: string;
  tabId: string;
  path: string;
}

interface PortalLayoutProps {
  children: ReactNode;
  role: "candidate" | "recruiter";
  userName?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  tabs?: { id: string; label: string }[];
}

const candidateNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", tabId: "overview", path: "/candidate/dashboard" },
  { icon: FileText, label: "CV Analysis", tabId: "cv", path: "/candidate/cv-analysis" },
  { icon: History, label: "Analysis History", tabId: "history", path: "/candidate/analysis-history" },
  { icon: Sparkles, label: "AI Resume Builder", tabId: "resume-builder", path: "/candidate/resume-builder" },
  { icon: FileText, label: "CV Templates", tabId: "cv-templates", path: "/candidate/cv-templates" },
  { icon: Briefcase, label: "Applications", tabId: "applications", path: "/candidate/applications" },
  { icon: Zap, label: "Job Matches", tabId: "matches", path: "/candidate/job-matches" },
  { icon: Bell, label: "Notifications", tabId: "notifications", path: "/candidate/notifications" },
];

const recruiterNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", tabId: "overview", path: "/recruiter/dashboard" },
  { icon: Users, label: "Candidates", tabId: "candidates", path: "/recruiter/candidates" },
  { icon: Briefcase, label: "Pipeline", tabId: "pipeline", path: "/recruiter/pipeline" },
  { icon: BarChart3, label: "Reports", tabId: "reports", path: "/recruiter/reports" },
];

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function PortalLayout({ children, role, userName = "Sarah Johnson", activeTab, onTabChange, tabs }: PortalLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [candidateNotifications, setCandidateNotifications] = useState<any[]>([]);
  const [candidateUnreadCount, setCandidateUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showCandidateNotifMenu, setShowCandidateNotifMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const cursorRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (role === "recruiter") {
      const fetchNotifs = () => {
        const headers = getAuthHeaders();
        if (!headers.Authorization) return;
        fetch("/api/recruiter/notifications", { headers })
          .then(res => res.ok ? res.json() : { notifications: [] })
          .then(data => {
            setNotifications(data.notifications || []);
          })
          .catch(err => console.error("Error fetching notifications", err));
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 10000); // Poll every 10 seconds for instant notification updates
      return () => clearInterval(interval);
    }
  }, [role]);

  useEffect(() => {
    if (role === "candidate") {
      const fetchCandidateNotifs = () => {
        const headers = getAuthHeaders();
        if (!headers.Authorization) return;
        fetch("/api/candidate/notifications", { headers })
          .then(res => res.ok ? res.json() : { notifications: [], unread_count: 0 })
          .then(data => {
            setCandidateNotifications(data.notifications || []);
            setCandidateUnreadCount(data.unread_count || 0);
          })
          .catch(err => console.error("Error fetching candidate notifications", err));
      };
      fetchCandidateNotifs();
      const interval = setInterval(fetchCandidateNotifs, 30000); // Poll every 30 seconds for candidate
      window.addEventListener("candidate-notif-updated", fetchCandidateNotifs);
      return () => {
        clearInterval(interval);
        window.removeEventListener("candidate-notif-updated", fetchCandidateNotifs);
      };
    }
  }, [role]);

  const nav = role === "candidate" ? candidateNav : recruiterNav;
  const accentColor = role === "candidate" ? "bg-primary" : "bg-secondary";
  const accentText = role === "candidate" ? "text-primary" : "text-secondary";
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#f8f8fc] flex custom-cursor-active" style={{ cursor: "none" }}>
      {/* Sidebar */}
      <>
        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        <motion.aside
          initial={false}
          animate={{ x: isMobile ? (sidebarOpen ? 0 : -280) : 0 }}
          className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-black/[0.08] flex flex-col z-50"
          style={{ transition: "transform 0.25s ease" }}
        >
          {/* Logo */}
          <div className="p-5 border-b border-black/[0.08]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                <div className="w-8 h-8 bg-[#0052CC]/[0.08] border border-[#0052CC]/15 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#0052CC]" />
                </div>
                <span className="font-bold text-lg text-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  Talent<span className="text-[#0052CC]">AI</span>
                </span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-black transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${role === 'candidate' ? 'bg-[#0052CC]/[0.06] text-[#0052CC] border-[#0052CC]/15' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {role === "candidate" ? "Candidate Portal" : "Recruiter Portal"}
              </span>
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex-1 p-4 space-y-1">
            {nav.map(({ icon: Icon, label, tabId, path }) => {
              const active = activeTab ? activeTab === tabId : location.pathname === path;
              return (
                <button
                  key={label}
                  onClick={() => {
                    setSidebarOpen(false);
                    if (location.pathname !== path) {
                      navigate(path);
                    }
                    onTabChange?.(tabId);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? "bg-[#0052CC]/[0.06] text-[#0052CC] border border-[#0052CC]/15"
                      : "text-muted-foreground hover:bg-black/[0.02] hover:text-black border border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              );
            })}
          </nav>

          {/* User profile */}
          <div className="p-4 border-t border-black/[0.08]">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/[0.02] border border-transparent hover:border-black/[0.06] cursor-pointer group transition-all">
              <div className="w-8 h-8 bg-[#0052CC]/[0.08] border border-[#0052CC]/15 rounded-lg flex items-center justify-center text-[#0052CC] text-xs font-bold flex-shrink-0">
                {userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-black truncate">{userName}</p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">{role}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-black transition-colors" />
            </div>
            <button
              onClick={async () => {
                await signOut();
                navigate("/login");
              }}
              className="w-full flex items-center gap-2 mt-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              Sign out
            </button>
          </div>
        </motion.aside>
      </>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top bar */}
        <header className="bg-white border-b border-black/[0.06] px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Header tabs removed as requested to keep navigation only in the sidebar */}
          </div>
          <div className="flex items-center gap-3">
            {role === "recruiter" ? (
              <div className="relative">
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="relative w-9 h-9 bg-muted rounded-xl flex items-center justify-center hover:bg-border transition-colors"
                >
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {showNotifMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotifMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-white border border-black/[0.08] rounded-2xl shadow-xl z-50 p-4 space-y-3 max-h-96 overflow-y-auto"
                      >
                        <div className="flex items-center justify-between border-b border-black/[0.04] pb-2">
                          <h4 className="font-bold text-sm text-foreground">Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="text-[10px] bg-destructive/10 text-destructive font-black px-2 py-0.5 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {notifications.length > 0 ? (
                            notifications.map(n => (
                              <div
                                key={n.id}
                                className={`p-2.5 rounded-xl text-left text-xs transition-colors flex flex-col gap-1 cursor-pointer ${
                                  !n.is_read ? 'bg-[#bae6fd]/20 border border-[#bae6fd]/40' : 'bg-muted/40'
                                }`}
                                onClick={async () => {
                                  if (!n.is_read) {
                                    try {
                                      const headers = getAuthHeaders();
                                      await fetch(`/api/recruiter/notifications/${n.id}/read`, {
                                        method: "POST",
                                        headers
                                      });
                                      setNotifications(prev => prev.map(item =>
                                        item.id === n.id ? { ...item, is_read: true } : item
                                      ));
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }
                                }}
                              >
                                <p className="text-foreground leading-relaxed font-medium">{n.message}</p>
                                <span className="text-[10px] text-muted-foreground">
                                  {n.created_at ? n.created_at.replace("T", " ").substring(0, 16) : ""}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-muted-foreground text-xs py-4">No notifications yet</p>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowCandidateNotifMenu(!showCandidateNotifMenu)}
                  className="relative w-9 h-9 bg-muted rounded-xl flex items-center justify-center hover:bg-border transition-colors"
                >
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  {candidateUnreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                      {candidateUnreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {showCandidateNotifMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowCandidateNotifMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-white border border-black/[0.08] rounded-2xl shadow-xl z-50 p-4 space-y-3 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
                      >
                        <div className="flex flex-col border-b border-black/[0.04] pb-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-foreground">Notifications</h4>
                            {candidateUnreadCount > 0 && (
                              <button
                                onClick={async () => {
                                  // Mark all read instantly
                                  setCandidateNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
                                  setCandidateUnreadCount(0);
                                  try {
                                    const headers = getAuthHeaders();
                                    await fetch("/api/candidate/notifications/read", {
                                      method: "POST",
                                      headers: {
                                        ...headers,
                                        "Content-Type": "application/json"
                                      },
                                      body: JSON.stringify({ all: true })
                                    });
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                className="text-[10px] text-primary hover:underline font-bold"
                              >
                                Mark all as read
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-0.5">
                            You have {candidateUnreadCount} unread notification{candidateUnreadCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {candidateNotifications.length > 0 ? (
                            <>
                              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {candidateNotifications.slice(0, 5).map(n => (
                                  <div
                                    key={n.id}
                                    className={`p-2.5 rounded-xl text-left text-xs transition-colors flex flex-col gap-1 cursor-pointer ${
                                      !n.is_read ? 'bg-[#e9d5ff]/20 border border-[#e9d5ff]/40' : 'bg-muted/40 hover:bg-muted/60'
                                    }`}
                                    onClick={async () => {
                                      setShowCandidateNotifMenu(false);
                                      if (!n.is_read) {
                                        // Mark read instantly in local state
                                        setCandidateNotifications(prev => prev.map(item =>
                                          item.id === n.id ? { ...item, is_read: true } : item
                                        ));
                                        setCandidateUnreadCount(prev => Math.max(0, prev - 1));
                                        try {
                                          const headers = getAuthHeaders();
                                          await fetch("/api/candidate/notifications/read", {
                                            method: "POST",
                                            headers: {
                                              ...headers,
                                              "Content-Type": "application/json"
                                            },
                                            body: JSON.stringify({ notification_id: n.id })
                                          });
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      }
                                      // Redirection as requested
                                      navigate("/candidate/applications");
                                    }}
                                  >
                                    <div className="flex justify-between items-start gap-2">
                                      <span className="font-bold text-foreground truncate">{n.title}</span>
                                      <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                                        {n.created_at ? n.created_at.replace("T", " ").substring(0, 16) : ""}
                                      </span>
                                    </div>
                                    <p className="text-foreground leading-relaxed">{n.message}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="border-t border-black/[0.04] pt-2 text-center">
                                <button
                                  onClick={() => {
                                    setShowCandidateNotifMenu(false);
                                    navigate("/candidate/notifications");
                                  }}
                                  className="text-[11px] text-primary hover:underline font-bold"
                                >
                                  View all notifications
                                </button>
                              </div>
                            </>
                          ) : (
                            <p className="text-center text-muted-foreground text-xs py-4">No notifications yet</p>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
            <div className={`w-9 h-9 ${accentColor} rounded-xl flex items-center justify-center text-white text-sm font-bold`}>
              {userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Spotlight + Cursor */}
      <div className="spotlight-overlay" ref={spotlightRef} />
      <div className="custom-cursor" ref={cursorRef} />
    </div>
  );
}
