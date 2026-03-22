import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TabBar from "@/components/layout/TabBar";
import DashboardView from "@/components/views/DashboardView";
import TasksView from "@/components/views/TasksView";
import ExpensesView from "@/components/views/ExpensesView";
import DocsView from "@/components/views/DocsView";
import MembersView from "@/components/views/MembersView";
import ChatView from "@/components/views/ChatView";
import { syncLocalDataOwner } from "@/lib/userLocalData";
import GlobalNotificationPopup from "@/components/layout/GlobalNotificationPopup";
import { Settings, Timer, Eye, X, ShieldAlert, Ban } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [ready, setReady] = useState(false);
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
    const isDemo = localStorage.getItem("sparky-demo-mode") === "true";
    if (isDemo) {
      setReady(true);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && !localStorage.getItem("sparky-demo-mode")) {
        navigate("/login");
      } else if (session?.user) {
        syncLocalDataOwner(session.user.id);
        setReady(true);
        // Check if admin
        setIsAdmin(session.user.email === "admin@sparky.app");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !localStorage.getItem("sparky-demo-mode")) {
        navigate("/login");
      } else if (session?.user) {
        syncLocalDataOwner(session.user.id);
        setReady(true);
        setIsAdmin(session.user.email === "admin@sparky.app");
      }
    });

    return () => subscription.unsubscribe();
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

  if (!ready) return null;

  // Check if user is suspended or banned
  const checkAccountStatus = () => {
    try {
      const userId = localStorage.getItem("sparky-current-user-id");
      if (!userId || isAdmin) return null;
      const suspended = JSON.parse(localStorage.getItem("sparky-suspended-users") || "[]");
      if (suspended.includes(userId)) return "suspended";
      const banned = JSON.parse(localStorage.getItem("sparky-banned-users") || "[]");
      if (banned.includes(userId)) return "banned";
    } catch {}
    return null;
  };

  const accountStatus = checkAccountStatus();

  // Suspended/Banned blocking screen
  if (accountStatus) {
    return (
      <div className="bg-background flex flex-col items-center justify-center text-center px-8" style={{ height: '100dvh' }}>
        <div className={`rounded-2xl border p-8 max-w-sm w-full space-y-4 ${accountStatus === "banned" ? "border-destructive/30 bg-destructive/5" : "border-yellow-500/30 bg-yellow-500/5"}`}>
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mx-auto ${accountStatus === "banned" ? "bg-destructive/20" : "bg-yellow-500/20"}`}>
            {accountStatus === "banned"
              ? <Ban size={32} className="text-destructive" />
              : <ShieldAlert size={32} className="text-yellow-500" />
            }
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {accountStatus === "banned" ? "Conta Banida" : "Conta Suspensa"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {accountStatus === "banned"
              ? "Sua conta foi banida por violar os termos de uso. Se acredita que isso foi um erro, entre em contato com o suporte."
              : "Sua conta foi temporariamente suspensa pelo administrador. Seus dados estão preservados e serão restaurados quando a suspensão for removida."
            }
          </p>
          <p className="text-[10px] text-muted-foreground">
            {accountStatus === "banned" ? "Código: ACCOUNT_BANNED" : "Código: ACCOUNT_SUSPENDED"}
          </p>
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
        height: '100dvh',
        minHeight: '100dvh',
        maxHeight: '100dvh',
        paddingTop: activeTab === 'chat' ? '0' : 'env(safe-area-inset-top, 20px)',
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
        {renderView()}
      </div>
      {activeTab !== 'chat' && <TabBar activeTab={activeTab} onTabChange={handleTabChange} />}
    </div>
  );
};

export default Index;
