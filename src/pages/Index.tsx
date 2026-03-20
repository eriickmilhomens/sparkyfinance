import { useState } from "react";
import TabBar from "@/components/layout/TabBar";
import DashboardView from "@/components/views/DashboardView";
import TasksView from "@/components/views/TasksView";
import ExpensesView from "@/components/views/ExpensesView";
import MarketView from "@/components/views/MarketView";
import DocsView from "@/components/views/DocsView";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  const renderView = () => {
    switch (activeTab) {
      case "home": return <DashboardView />;
      case "tasks": return <TasksView />;
      case "expenses": return <ExpensesView />;
      case "market": return <MarketView />;
      case "docs": return <DocsView />;
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
