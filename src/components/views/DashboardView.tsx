import { useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import BalanceCard from "@/components/dashboard/BalanceCard";
import SpendingOverview from "@/components/dashboard/SpendingOverview";
import SuggestionsCard from "@/components/dashboard/SuggestionsCard";

const DashboardView = () => {
  const [hideValues, setHideValues] = useState(false);
  const now = new Date();
  const dayNames = ["Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"];
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} De ${monthNames[now.getMonth()]}`;

  const handleVisibilityChange = useCallback((visible: boolean) => {
    setHideValues(!visible);
  }, []);

  return (
    <div className="space-y-3 px-4 pb-4">
      <Header />
      <div className="text-center space-y-1 fade-in-up">
        <h1 className="text-xl sm:text-2xl font-bold">Resumo De Hoje</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">{dateStr}</p>
      </div>
      <BalanceCard onVisibilityChange={handleVisibilityChange} />
      <SpendingOverview hideValues={hideValues} />
      <SuggestionsCard />
    </div>
  );
};

export default DashboardView;