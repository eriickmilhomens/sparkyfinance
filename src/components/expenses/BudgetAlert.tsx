import { AlertCircle } from "lucide-react";
import { useFinancialData } from "@/hooks/useFinancialData";

const BudgetAlert = () => {
  const { data } = useFinancialData();
  
  // Only show alert when expenses exceed 80% of income
  if (data.income <= 0 || data.expenses / data.income < 0.8) return null;

  const pct = Math.round((data.expenses / data.income) * 100 - 100);

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 fade-in-up border-l-4 border-l-destructive">
      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-destructive/20">
        <AlertCircle size={14} className="text-destructive" />
      </div>
      <div>
        <p className="text-xs font-semibold text-destructive">Atenção Necessária</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Você está gastando {pct > 0 ? `${pct}% acima` : "próximo"} do orçamento saudável.
        </p>
      </div>
    </div>
  );
};

export default BudgetAlert;
