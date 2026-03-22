import StatusCards from "@/components/expenses/StatusCards";
import CreditCardCarousel from "@/components/expenses/CreditCardCarousel";
import TrendChart from "@/components/expenses/TrendChart";
import DonutChart from "@/components/expenses/DonutChart";
import PaceBar from "@/components/expenses/PaceBar";
import BudgetAlert from "@/components/expenses/BudgetAlert";
import SyncStatusBanner from "@/components/expenses/SyncStatusBanner";
import SyncBanner from "@/components/expenses/SyncBanner";
import FinancialStatusCard from "@/components/expenses/FinancialStatusCard";
import SubscriptionsCard from "@/components/expenses/SubscriptionsCard";
import DailyBudgetWidget from "@/components/expenses/DailyBudgetWidget";
import { useFinancialData } from "@/hooks/useFinancialData";

interface VisaoGeralTabProps {
  onNavigateToMetas?: () => void;
}

const VisaoGeralTab = ({ onNavigateToMetas }: VisaoGeralTabProps) => {
  const { data, available, dailyBudget } = useFinancialData();
  const hasData = data.balance > 0 || data.income > 0 || data.expenses > 0;

  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  const balanceHistory = months.map(name => ({
    name,
    value: hasData ? Math.round(data.balance * (0.6 + Math.random() * 0.5)) : 0,
  }));
  if (hasData) balanceHistory[balanceHistory.length - 1].value = Math.round(data.balance);

  const projectionData = [
    { name: "Sem 1", value: hasData ? Math.round(available * 1.2) : 0 },
    { name: "Sem 2", value: hasData ? Math.round(available * 1.05) : 0 },
    { name: "Sem 3", value: hasData ? Math.round(available * 0.9) : 0 },
    { name: "Sem 4", value: hasData ? Math.round(available) : 0 },
  ];

  const dailyPower = [
    { name: "Seg", value: hasData ? Math.round(dailyBudget * 1.3) : 0 },
    { name: "Ter", value: hasData ? Math.round(dailyBudget * 1.1) : 0 },
    { name: "Qua", value: hasData ? Math.round(dailyBudget * 0.85) : 0 },
    { name: "Qui", value: hasData ? Math.round(dailyBudget) : 0 },
    { name: "Sex", value: hasData ? Math.round(dailyBudget * 1.2) : 0 },
    { name: "Sáb", value: hasData ? Math.round(dailyBudget * 0.75) : 0 },
    { name: "Dom", value: hasData ? Math.round(dailyBudget) : 0 },
  ];

  return (
    <div className="space-y-3">
      <SyncStatusBanner />
      <SyncBanner onNavigateToMetas={onNavigateToMetas} hideSyncBanner />
      <FinancialStatusCard />
      <BudgetAlert />
      <StatusCards />
      <DailyBudgetWidget />
      <CreditCardCarousel />
      <SubscriptionsCard />
      <TrendChart title="Histórico de Saldo" data={balanceHistory} color="hsl(var(--primary))" gradientId="balGrad" />
      <TrendChart title="Projeção de Saldo" data={projectionData} color="hsl(var(--success))" gradientId="projGrad" legend="Estimativa do saldo nas próximas semanas com base nos seus gastos e receitas recorrentes." />
      <TrendChart title="Poder de Compra Diário" data={dailyPower} color="hsl(var(--warning))" gradientId="dailyGrad" legend="Quanto você pode gastar por dia sem comprometer o orçamento do mês." />
      <DonutChart />
      <PaceBar />
    </div>
  );
};

export default VisaoGeralTab;
