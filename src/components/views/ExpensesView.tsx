import { useState } from "react";
import { Plus, Settings, CreditCard } from "lucide-react";
import AddExpenseModal from "@/components/expenses/AddExpenseModal";
import FinancialSettingsModal from "@/components/expenses/FinancialSettingsModal";
import DebtManagementModal from "@/components/expenses/DebtManagementModal";
import VisaoGeralTab from "@/components/expenses/VisaoGeralTab";
import ExtratoTab from "@/components/expenses/ExtratoTab";
import PlanejamentoTab from "@/components/expenses/PlanejamentoTab";
import { cn } from "@/lib/utils";

const tabs = ["Visão Geral", "Extrato", "Planejamento"];

const ExpensesView = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [debtOpen, setDebtOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Visão Geral");

  const renderTab = () => {
    switch (activeTab) {
      case "Extrato": return <ExtratoTab />;
      case "Planejamento": return <PlanejamentoTab />;
      default: return <VisaoGeralTab />;
    }
  };

  return (
    <>
      <div className="px-4 pb-24 space-y-4">
        <div className="flex items-center justify-between pt-3">
          <h1 className="text-xl font-bold">Despesas</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => setDebtOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            >
              <CreditCard size={18} />
            </button>
          </div>
        </div>

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

        {renderTab()}
      </div>

      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-20 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 text-primary-foreground transition-all active:scale-90 pulse-glow"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <AddExpenseModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <FinancialSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <DebtManagementModal open={debtOpen} onClose={() => setDebtOpen(false)} />
    </>
  );
};

export default ExpensesView;
