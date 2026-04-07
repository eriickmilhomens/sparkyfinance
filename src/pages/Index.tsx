import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TabBar from "@/components/layout/TabBar";
import { syncLocalDataOwner } from "@/lib/userLocalData";
import GlobalNotificationPopup from "@/components/layout/GlobalNotificationPopup";
import { Settings, Timer, Eye, X } from "lucide-react";

const DashboardView = lazy(() => import("@/components/views/DashboardView"));
const TasksView = lazy(() => import("@/components/views/TasksView"));
const ExpensesView = lazy(() => import("@/components/views/ExpensesView"));
const DocsView = lazy(() => import("@/components/views/DocsView"));
const MembersView = lazy(() => import("@/components/views/MembersView"));
const ChatView = lazy(() => import("@/components/views/ChatView"));

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [, setTick] = useState(0);
  const navigate = useNavigate();

  // Maintenance mode blocking
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [maintenanceCountdown, setMaintenanceCountdown] = useState("");

  // Impersonate mode
  const [impersonating, setImpersonating] = useState<{ id: string; name: string; email: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Check maintenance mode
  useEffect(() => {
    const checkMaintenance = () => {
      const active = localStorage.getItem("sparky-maintenance-mode") === "true";
      setMaintenanceActive(active);

      // Check timer
      const timerData = localStorage.getItem("sparky-maintenance-timer");
      if (timerData) {
        try {
          const { active: timerActive, endsAt } = JSON.parse(timerData);
          if (timerActive && endsAt) {
            const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
            if (remaining > 0) {
              const m = Math.floor(remaining / 60);
              const s = remaining % 60;
              setMaintenanceCountdown(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
            } else {
              setMaintenanceCountdown("");
            }
          }
        } catch {}
      } else {
        setMaintenanceCountdown("");
      }
    };

    checkMaintenance();
    const interval = setInterval(checkMaintenance, 1000);
    window.addEventListener("sparky-maintenance-update", checkMaintenance);
    return () => {
      clearInterval(interval);
      window.removeEventListener("sparky-maintenance-update", checkMaintenance);
    };
  }, []);

  // Check impersonate mode
  useEffect(() => {
    const checkImpersonate = () => {
      const data = localStorage.getItem("sparky-impersonate");
      if (data) {
        try { setImpersonating(JSON.parse(data)); } catch { setImpersonating(null); }
      } else {
        setImpersonating(null);
      }
    };
    checkImpersonate();
    window.addEventListener("sparky-impersonate-update", checkImpersonate);
    return () => window.removeEventListener("sparky-impersonate-update", checkImpersonate);
  }, []);

  useEffect(() => {
    const markReady = () => {
      readyRef.current = true;
      setReady(true);
      setAuthChecked(true);
    };

    const isDemo = localStorage.getItem("sparky-demo-mode") === "true";
    if (isDemo) {
      markReady();
      return;
    }

    const checkBanStatus = async (session: any) => {
      if (!session?.user) return false;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        const isBanned = user.user_metadata?.banned === true;
        const isSuspended = user.user_metadata?.suspended === true;
        if (isBanned || isSuspended) {
          await supabase.auth.signOut();
          navigate("/login");
          return true;
        }
      } catch {
        // ignore errors during ban check
      }
      return false;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session && !localStorage.getItem("sparky-demo-mode")) {
        setAuthChecked(true);
        navigate("/login");
      } else if (session?.user) {
        const blocked = await checkBanStatus(session);
        if (blocked) return;
        syncLocalDataOwner(session.user.id);
        markReady();
        // Check admin role from profiles table
        const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", session.user.id).single();
        setIsAdmin(profile?.role === "admin");
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session && !localStorage.getItem("sparky-demo-mode")) {
        setAuthChecked(true);
        navigate("/login");
      } else if (session?.user) {
        const blocked = await checkBanStatus(session);
        if (blocked) return;
        syncLocalDataOwner(session.user.id);
        markReady();
        const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", session.user.id).single();
        setIsAdmin(profile?.role === "admin");
      } else {
        setAuthChecked(true);
      }
    });

    // Safety timeout — only redirect if auth truly hasn't resolved
    const safetyTimer = setTimeout(() => {
      if (!readyRef.current) {
        setAuthChecked(true);
        navigate("/login");
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, [navigate]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo(0, 0);
    const scrollContainer = document.querySelector('[data-main-scroll]');
    if (scrollContainer) scrollContainer.scrollTop = 0;
  };

  const exitImpersonate = () => {
    localStorage.removeItem("sparky-impersonate");
    setImpersonating(null);
    window.dispatchEvent(new Event("sparky-impersonate-update"));
  };

  // Register global callback for chat back button
  useEffect(() => {
    (window as any).__sparkyGoHome = () => handleTabChange("home");
    return () => { delete (window as any).__sparkyGoHome; };
  }, []);

  if (!ready) {
    return (
      <div className="bg-background flex items-center justify-center" style={{ height: '100dvh' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          {authChecked && (
            <p className="text-xs text-muted-foreground">Redirecionando...</p>
          )}
        </div>
      </div>
    );
  }

  // Maintenance blocking screen — only for non-admins
  if (maintenanceActive && !isAdmin) {
    return (
      <div className="bg-background flex flex-col items-center justify-center text-center px-8" style={{ height: '100dvh' }}>
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-8 max-w-sm w-full space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center mx-auto">
            <Settings size={32} className="text-yellow-500 animate-spin" style={{ animationDuration: "3s" }} />
          </div>
          <h1 className="text-xl font-bold text-foreground">Em Manutenção</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O Sparky está passando por uma manutenção programada. Voltaremos em breve!
          </p>
          {maintenanceCountdown && (
            <div className="rounded-xl bg-muted/50 py-3 px-4">
              <p className="text-[10px] text-muted-foreground mb-1">TEMPO ESTIMADO</p>
              <p className="text-2xl font-mono font-bold text-yellow-500 flex items-center justify-center gap-2">
                <Timer size={20} /> {maintenanceCountdown}
              </p>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">
            Pedimos desculpa pelo inconveniente. ⚡
          </p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeTab) {
      case "home": return <DashboardView />;
      case "tasks": return <TasksView />;
      case "chat": return <ChatView />;
      case "expenses": return <ExpensesView />;
      case "docs": return <DocsView />;
      case "members": return <MembersView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div
      className="bg-background relative mx-auto flex w-full max-w-lg flex-col lg:max-w-4xl xl:max-w-6xl"
      style={{
        height: '100svh',
        minHeight: '100svh',
        maxHeight: '100svh',
        paddingTop: activeTab === 'chat' ? '0' : 'env(safe-area-inset-top, 20px)',
        paddingBottom: '0',
        overflow: 'hidden',
        overscrollBehavior: 'none',
      }}
    >
      {/* Global Notification Popup */}
      <GlobalNotificationPopup />

      {/* Impersonate floating bar */}
      {impersonating && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/30" style={{ zIndex: 55 }}>
          <Eye size={14} className="text-yellow-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-yellow-500 truncate">
              Visualizando como: {impersonating.name}
            </p>
          </div>
          <button
            onClick={exitImpersonate}
            className="flex items-center gap-1 rounded-lg bg-yellow-500/20 px-2.5 py-1 text-[10px] font-semibold text-yellow-500 active:scale-95 shrink-0"
          >
            <X size={10} /> Sair
          </button>
        </div>
      )}

      {/* Maintenance countdown bar for admin */}
      {isAdmin && maintenanceCountdown && !maintenanceActive && (
        <div className="shrink-0 flex items-center justify-center gap-2 px-4 py-1.5 bg-yellow-500/10 border-b border-yellow-500/30">
          <Timer size={12} className="text-yellow-500" />
          <p className="text-[10px] font-mono font-bold text-yellow-500">
            Manutenção em: {maintenanceCountdown}
          </p>
        </div>
      )}

      <div data-main-scroll className={`relative flex-1 min-h-0 overflow-x-hidden ${activeTab === 'chat' ? 'overflow-hidden' : 'overflow-y-auto'}`} style={{ overscrollBehavior: 'none', paddingBottom: activeTab === 'chat' ? '0' : 'calc(100px + env(safe-area-inset-bottom, 0px))' }}>
        <Suspense fallback={
          <div className="space-y-3 px-4 pt-4">
            <div className="h-10 w-40 bg-muted rounded-xl animate-pulse" />
            <div className="h-28 w-full bg-muted rounded-2xl animate-pulse" />
            <div className="h-20 w-full bg-muted rounded-2xl animate-pulse" />
            <div className="h-20 w-full bg-muted rounded-2xl animate-pulse" />
          </div>
        }>
          <div className="animate-in fade-in duration-200">
            {renderView()}
          </div>
        </Suspense>
      </div>
      {activeTab !== 'chat' && <TabBar activeTab={activeTab} onTabChange={handleTabChange} />}
    </div>
  );
};

export default Index;
