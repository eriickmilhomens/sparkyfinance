import Header from "@/components/layout/Header";
import BalanceCard from "@/components/dashboard/BalanceCard";
import SpendingOverview from "@/components/dashboard/SpendingOverview";
import RankingCard from "@/components/dashboard/RankingCard";
import SuggestionsCard from "@/components/dashboard/SuggestionsCard";

const DashboardView = () => {
  return (
    <div className="space-y-3 px-4 pb-4">
      <Header />
      <BalanceCard />
      <SpendingOverview />
      <SuggestionsCard />
      <RankingCard />
    </div>
  );
};

export default DashboardView;
