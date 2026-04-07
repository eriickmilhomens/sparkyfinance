import { useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import BalanceCard from "@/components/dashboard/BalanceCard";
import SpendingOverview from "@/components/dashboard/SpendingOverview";
import SuggestionsCard from "@/components/dashboard/SuggestionsCard";
import BiggestExpenseCard from "@/components/dashboard/BiggestExpenseCard";
import { useFinancialData } from "@/hooks/useFinancialData";

const SkeletonCard = () => (
  <div className="card-zelo animate-pulse">
    <div className="h-3 w-24 bg-muted rounded-lg mb-3" />
    <div className="h-8 w-40 bg-muted rounded-lg mb-2" />
    <div className="h-2 w-32 bg-muted/60 rounded-lg" />
  </div>
);

const DashboardView = () => {
  const [hideValues, setHideValues] = useState(false);
  const { loading } = useFinancialData();
  const now = new Date();
  const dayNames = ["Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"];
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} De ${monthNames[now.getMonth()]}`;

  const handleVisibilityChange = useCallback((visible: boolean) => {
    setHideValues(!visible);
  }, []);

  if (loading) {
    return (
      <div className="relative space-y-3 px-4 pb-4">
        <div className="pointer-events-none absolute -top-20 right-[-20%] h-[300px] w-[300px] rounded-full bg-primary/5 blur-[100px]" />
        <Header />
        <div className="text-center space-y-1.5 fade-in-up">
          <h1 className="text-xl sm:text-2xl font-display font-bold">Resumo De Hoje</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{dateStr}</p>
        </div>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="relative space-y-3 px-4 pb-4">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute -top-20 right-[-20%] h-[300px] w-[300px] rounded-full bg-primary/6 blur-[100px]" />
      <div className="pointer-events-none absolute top-[40%] left-[-15%] h-[200px] w-[200px] rounded-full bg-primary/4 blur-[80px]" />

      <Header />
      <div className="text-center space-y-1.5 fade-in-up relative z-10">
        <h1 className="text-xl sm:text-2xl font-display font-bold">Resumo De Hoje</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">{dateStr}</p>
      </div>
      <BalanceCard onVisibilityChange={handleVisibilityChange} />
      <SpendingOverview hideValues={hideValues} />
      <BiggestExpenseCard hideValues={hideValues} />
      <SuggestionsCard />
    </div>
  );
};

export default DashboardView;
