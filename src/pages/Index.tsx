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
    window.scrollTo(0, 0);
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
      className="bg-background relative mx-auto max-w-lg lg:max-w-4xl xl:max-w-6xl flex flex-col"
      style={{
        height: '100dvh',
        minHeight: '100dvh',
        maxHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top, 20px)',
        overflow: 'hidden',
        overscrollBehavior: 'none',
      }}
    >
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden" style={{ overscrollBehavior: 'none' }}>
        {renderView()}
      </div>
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Index;
