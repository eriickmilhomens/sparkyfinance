import StatusCards from "@/components/expenses/StatusCards";
import CreditCardCarousel from "@/components/expenses/CreditCardCarousel";
import TrendChart from "@/components/expenses/TrendChart";
import DonutChart from "@/components/expenses/DonutChart";
import PaceBar from "@/components/expenses/PaceBar";
import BudgetAlert from "@/components/expenses/BudgetAlert";
import SyncBanner from "@/components/expenses/SyncBanner";

const balanceHistory = [
  { name: "Jan", value: 3200.00 }, { name: "Fev", value: 2800.00 },
  { name: "Mar", value: 3500.00 }, { name: "Abr", value: 3100.00 },
  { name: "Mai", value: 4200.00 }, { name: "Jun", value: 3800.00 },
];

const projectionData = [
  { name: "Sem 1", value: 4800.00 }, { name: "Sem 2", value: 4200.00 },
  { name: "Sem 3", value: 3600.00 }, { name: "Sem 4", value: 3247.50 },
];

const dailyPower = [
  { name: "Seg", value: 150.00 }, { name: "Ter", value: 120.00 },
  { name: "Qua", value: 95.00 }, { name: "Qui", value: 108.25 },
  { name: "Sex", value: 130.00 }, { name: "Sáb", value: 85.00 },
  { name: "Dom", value: 108.25 },
];

const VisaoGeralTab = () => (
  <div className="space-y-3">
    <SyncBanner />
    <BudgetAlert />
    <StatusCards />
    <CreditCardCarousel />
    <TrendChart title="Histórico de Saldo" data={balanceHistory} color="hsl(var(--primary))" gradientId="balGrad" />
    <TrendChart title="Projeção de Saldo" data={projectionData} color="hsl(var(--success))" gradientId="projGrad" legend="Estimativa do saldo nas próximas semanas com base nos seus gastos e receitas recorrentes." />
    <TrendChart title="Poder de Compra Diário" data={dailyPower} color="hsl(var(--warning))" gradientId="dailyGrad" legend="Quanto você pode gastar por dia sem comprometer o orçamento do mês." />
    <DonutChart />
    <PaceBar />
  </div>
);

export default VisaoGeralTab;
