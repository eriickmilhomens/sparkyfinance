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

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [ready, setReady] = useState(false);
  const [, setTick] = useState(0);
  const navigate = useNavigate();

  // Subtle auto-refresh every 30s to keep data fresh
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const isDemo = localStorage.getItem("sparky-demo-mode") === "true";
    if (isDemo) { setReady(true); return; }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && !localStorage.getItem("sparky-demo-mode")) {
        navigate("/login");
      } else {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !localStorage.getItem("sparky-demo-mode")) {
        navigate("/login");
      } else {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
    <div className="min-h-screen bg-background relative mx-auto max-w-lg lg:max-w-4xl xl:max-w-6xl transition-all">
      <div className="pb-20">
        {renderView()}
      </div>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
