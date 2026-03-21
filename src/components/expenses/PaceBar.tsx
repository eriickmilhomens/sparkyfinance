import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useFinancialData } from "@/hooks/useFinancialData";

const PaceBar = () => {
  const { data, available, daysLeft } = useFinancialData();
  const hasData = data.balance > 0 || data.expenses > 0;
  const dailySpend = data.expenses > 0 ? data.expenses / new Date().getDate() : 0;
  const cashDays = dailySpend > 0 ? Math.floor(available / dailySpend) : 0;
  const progress = hasData && (cashDays + daysLeft) > 0 ? (cashDays / (cashDays + daysLeft)) * 100 : 0;
  const accelerated = hasData && cashDays < daysLeft;

  return (
    <div className="card-zelo fade-in-up">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground">Ritmo & Autonomia</p>
        {hasData && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${accelerated ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}>
            {accelerated ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
            {accelerated ? "Ritmo Acelerado" : "Ritmo Saudável"}
          </span>
        )}
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-success to-warning transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-muted-foreground">{cashDays} dias de caixa</span>
        <span className="text-[10px] text-muted-foreground">Faltam {daysLeft} dias no mês</span>
      </div>
    </div>
  );
};

export default PaceBar;
