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

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [ready, setReady] = useState(false);
  const [, setTick] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
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
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !localStorage.getItem("sparky-demo-mode")) {
        navigate("/login");
      } else if (session?.user) {
        syncLocalDataOwner(session.user.id);
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Always scroll to top on tab change
    window.scrollTo(0, 0);
    const scrollContainer = document.querySelector('[data-main-scroll]');
    if (scrollContainer) scrollContainer.scrollTop = 0;
  };

  if (!ready) return null;

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
        paddingTop: 'env(safe-area-inset-top, 20px)',
        overflow: 'hidden',
        overscrollBehavior: 'none',
      }}
    >
      <div data-main-scroll className={`relative flex-1 min-h-0 overflow-x-hidden ${activeTab === 'chat' ? 'overflow-hidden' : 'overflow-y-auto'}`} style={{ overscrollBehavior: 'none', paddingBottom: activeTab === 'chat' ? '0' : 'calc(100px + env(safe-area-inset-bottom, 0px))' }}>
        {renderView()}
        {/* Bottom fade gradient — inside scroll area so it doesn't cover chart */}
        {activeTab !== 'chat' && (
          <div className="pointer-events-none sticky bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background via-background/60 to-transparent" />
        )}
      </div>
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Index;
