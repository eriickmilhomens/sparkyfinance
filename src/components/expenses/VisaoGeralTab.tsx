import StatusCards from "@/components/expenses/StatusCards";
import TrendChart from "@/components/expenses/TrendChart";
import DonutChart from "@/components/expenses/DonutChart";
import PaceBar from "@/components/expenses/PaceBar";
import BudgetAlert from "@/components/expenses/BudgetAlert";
import SyncBanner from "@/components/expenses/SyncBanner";

const balanceHistory = [
  { name: "Jan", value: 3200 }, { name: "Fev", value: 2800 },
  { name: "Mar", value: 3500 }, { name: "Abr", value: 3100 },
  { name: "Mai", value: 4200 }, { name: "Jun", value: 3800 },
];

const projectionData = [
  { name: "Sem 1", value: 4800 }, { name: "Sem 2", value: 4200 },
  { name: "Sem 3", value: 3600 }, { name: "Sem 4", value: 3247 },
];

const dailyPower = [
  { name: "Seg", value: 150 }, { name: "Ter", value: 120 },
  { name: "Qua", value: 95 }, { name: "Qui", value: 108 },
  { name: "Sex", value: 130 }, { name: "Sáb", value: 85 },
  { name: "Dom", value: 108 },
];

const VisaoGeralTab = () => (
  <div className="space-y-3">
    <SyncBanner />
    <BudgetAlert />
    <StatusCards />
    <TrendChart title="Histórico de Saldo" data={balanceHistory} color="hsl(var(--primary))" gradientId="balGrad" />
    <TrendChart title="Projeção de Saldo" data={projectionData} color="hsl(var(--success))" gradientId="projGrad" />
    <TrendChart title="Poder de Compra Diário" data={dailyPower} color="hsl(var(--warning))" gradientId="dailyGrad" />
    <DonutChart />
    <PaceBar />
  </div>
);

export default VisaoGeralTab;
