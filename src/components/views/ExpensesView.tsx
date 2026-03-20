import { useState } from "react";
import { Plus } from "lucide-react";
import StatusCards from "@/components/expenses/StatusCards";
import TrendChart from "@/components/expenses/TrendChart";
import DonutChart from "@/components/expenses/DonutChart";
import PaceBar from "@/components/expenses/PaceBar";
import BudgetAlert from "@/components/expenses/BudgetAlert";
import AddExpenseModal from "@/components/expenses/AddExpenseModal";
import { cn } from "@/lib/utils";

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

const tabs = ["Visão Geral", "Extrato", "Planejamento"];

const ExpensesView = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Visão Geral");

  return (
    <>
      <div className="px-4 pb-24 space-y-4">
        <div className="flex items-center justify-between pt-3">
          <h1 className="text-xl font-bold">Despesas</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-medium transition-all active:scale-[0.97]",
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <BudgetAlert />
        <StatusCards />
        <TrendChart title="Histórico de Saldo" data={balanceHistory} color="#3B82F6" gradientId="balGrad" />
        <TrendChart title="Projeção de Saldo" data={projectionData} color="#22C55E" gradientId="projGrad" />
        <TrendChart title="Poder de Compra Diário" data={dailyPower} color="#F59E0B" gradientId="dailyGrad" />
        <DonutChart />
        <PaceBar />
      </div>

      {/* FAB */}
      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-20 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 text-primary-foreground transition-all active:scale-90 pulse-glow"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <AddExpenseModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default ExpensesView;
