import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell, CheckCircle, Clock, Eye, MessageSquare, XCircle,
  Sparkles, AlertCircle
} from "lucide-react";
import { getAuthHeaders } from "./candidateContext";
import { apiUrl } from "../../utils/apiConfig";

const TYPE_CONFIG = {
  screening: {
    label: "Screening",
    color: "bg-[#ffd6a5] text-orange-700 border border-orange-200",
    icon: Eye,
  },
  interview: {
    label: "Interview",
    color: "bg-[#e9d5ff] text-violet-700 border border-violet-200",
    icon: MessageSquare,
  },
  offered: {
    label: "Job Offered",
    color: "bg-[#bae6fd] text-sky-700 border border-sky-200",
    icon: Sparkles,
  },
  accepted: {
    label: "Accepted",
    color: "bg-[#b8f2e6] text-emerald-700 border border-emerald-200",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-[#fecdd3] text-red-600 border border-red-200",
    icon: XCircle,
  },
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifs = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(apiUrl("/api/candidate/notifications"), { headers });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while loading notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    
    // Dispatch layout update event instantly
    window.dispatchEvent(new Event("candidate-notif-updated"));

    try {
      const headers = getAuthHeaders();
      const res = await fetch(apiUrl("/api/candidate/notifications/read"), {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ all: true })
      });
      if (!res.ok) throw new Error("Failed to mark all notifications as read");
    } catch (err) {
      console.error(err);
      // Re-fetch from server if there is an error to ensure accuracy
      fetchNotifs();
    }
  };

  const handleNotifClick = async (n: any) => {
    if (!n.is_read) {
      // Optimistic UI update for click item
      setNotifications(prev => prev.map(item =>
        item.id === n.id ? { ...item, is_read: true } : item
      ));

      // Dispatch layout update event instantly
      window.dispatchEvent(new Event("candidate-notif-updated"));

      try {
        const headers = getAuthHeaders();
        const res = await fetch(apiUrl("/api/candidate/notifications/read"), {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ notification_id: n.id })
        });
        if (!res.ok) throw new Error("Failed to mark notification as read");
      } catch (err) {
        console.error(err);
      }
    }

    // Always navigate to candidate applications as requested
    navigate("/candidate/applications");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : "You are all caught up!"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 text-sm font-bold rounded-xl transition-colors self-start sm:self-auto flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-black/[0.06] rounded-3xl p-12 text-center"
          >
            <div className="w-16 h-16 bg-[#e9d5ff]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-1">All caught up!</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              There are no notifications for you at the moment. We'll update you here when your application status changes.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {notifications.map((n, i) => {
              const config = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG] || {
                label: "Update",
                color: "bg-muted text-muted-foreground border border-border",
                icon: Bell,
              };
              const IconComponent = config.icon;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  onClick={() => handleNotifClick(n)}
                  className={`relative overflow-hidden bg-white border rounded-2xl p-5 flex gap-4 cursor-pointer hover:shadow-md transition-all duration-200 group ${
                    !n.is_read
                      ? "border-primary/30 bg-[#e9d5ff]/05 hover:bg-[#e9d5ff]/10"
                      : "border-black/[0.06] hover:bg-muted/30"
                  }`}
                >
                  {/* Unread indicator strip */}
                  {!n.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm sm:text-base group-hover:text-primary transition-colors">
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                        {n.created_at
                          ? new Date(n.created_at).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-3xl">
                      {n.message}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
