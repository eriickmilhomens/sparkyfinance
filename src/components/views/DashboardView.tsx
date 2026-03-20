import Header from "@/components/layout/Header";
import BalanceCard from "@/components/dashboard/BalanceCard";
import SpendingOverview from "@/components/dashboard/SpendingOverview";
import ShoppingCard from "@/components/dashboard/ShoppingCard";
import RankingCard from "@/components/dashboard/RankingCard";
import TasksCard from "@/components/dashboard/TasksCard";
import SuggestionsCard from "@/components/dashboard/SuggestionsCard";

const DashboardView = () => {
  return (
    <div className="space-y-3 px-4 pb-4">
      <Header />
      <BalanceCard />
      <SpendingOverview />
      <SuggestionsCard />
      <ShoppingCard />
      <RankingCard />
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">Tarefas</p>
        <TasksCard />
      </div>
    </div>
  );
};

export default DashboardView;
