import { useState } from "react";
import TabBar from "@/components/layout/TabBar";
import DashboardView from "@/components/views/DashboardView";
import TasksView from "@/components/views/TasksView";
import ExpensesView from "@/components/views/ExpensesView";
import DocsView from "@/components/views/DocsView";
import MembersView from "@/components/views/MembersView";
import ChatView from "@/components/views/ChatView";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

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
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <div className="pb-20">
        {renderView()}
      </div>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
