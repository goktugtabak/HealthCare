import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { ChatDock } from "@/components/ChatDock";
import { toast } from "@/hooks/use-toast";

const SIDEBAR_COLLAPSED_KEY = "health-ai-sidebar-collapsed";
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const INACTIVITY_WARNING_MS = 28 * 60 * 1000;

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, logout } = useAuth();
  const { notifications } = usePlatformData();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  // NFR-06: 30-minute inactivity timeout (with 2-min advance warning)
  useEffect(() => {
    if (!currentUser) return;
    let logoutTimer: ReturnType<typeof setTimeout> | null = null;
    let warningTimer: ReturnType<typeof setTimeout> | null = null;

    const arm = () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      if (warningTimer) clearTimeout(warningTimer);
      warningTimer = setTimeout(() => {
        toast({
          title: "Session expiring soon",
          description: "You will be logged out in 2 minutes due to inactivity.",
        });
      }, INACTIVITY_WARNING_MS);
      logoutTimer = setTimeout(() => {
        toast({
          title: "Logged out",
          description: "You were signed out after 30 minutes of inactivity.",
        });
        logoutRef.current();
        navigateRef.current("/login");
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events: Array<keyof DocumentEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];
    events.forEach((event) => document.addEventListener(event, arm, { passive: true }));
    arm();

    return () => {
      events.forEach((event) => document.removeEventListener(event, arm));
      if (logoutTimer) clearTimeout(logoutTimer);
      if (warningTimer) clearTimeout(warningTimer);
    };
  }, [currentUser]);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {}
      return next;
    });
  };

  if (!currentUser) {
    return null;
  }

  const unreadCount = notifications.filter(
    (notification) =>
      notification.userId === currentUser.id && !notification.read,
  ).length;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav
        unreadCount={unreadCount}
        user={currentUser}
        isMobileMenuOpen={mobileMenuOpen}
        onMenuToggle={() => setMobileMenuOpen((open) => !open)}
        onLogout={handleLogout}
      />

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside
          className={`sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 transition-all duration-300 lg:block ${
            collapsed ? "w-[68px]" : "w-64"
          }`}
        >
          <Sidebar
            role={currentUser.role}
            collapsed={collapsed}
            onToggleCollapse={handleToggleCollapse}
          />
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 top-16 z-40 flex bg-slate-950/40 lg:hidden">
            <aside className="h-[calc(100vh-4rem)] w-64 shadow-2xl animate-fade-in">
              <Sidebar
                role={currentUser.role}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </aside>
            <button
              type="button"
              aria-label="Close sidebar"
              className="flex-1 backdrop-blur-[1px]"
              onClick={() => setMobileMenuOpen(false)}
            />
          </div>
        )}

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6 lg:px-10">
            {children}
          </div>
        </main>
      </div>

      <ChatDock />
    </div>
  );
};
