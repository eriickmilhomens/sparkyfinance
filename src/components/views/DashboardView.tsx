import Header from "@/components/layout/Header";
import BalanceCard from "@/components/dashboard/BalanceCard";
import SpendingOverview from "@/components/dashboard/SpendingOverview";
import SuggestionsCard from "@/components/dashboard/SuggestionsCard";

const DashboardView = () => {
  return (
    <div className="space-y-3 px-4 pb-4">
      <Header />
      <BalanceCard />
      <SpendingOverview />
      <SuggestionsCard />
    </div>
  );
};

export default DashboardView;
