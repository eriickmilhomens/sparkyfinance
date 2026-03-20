import Header from "@/components/layout/Header";
import BalanceCard from "@/components/dashboard/BalanceCard";
import ShoppingCard from "@/components/dashboard/ShoppingCard";
import RankingCard from "@/components/dashboard/RankingCard";
import TasksCard from "@/components/dashboard/TasksCard";

const DashboardView = () => {
  return (
    <div className="space-y-3 px-4 pb-4">
      <Header />
      <BalanceCard />
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
