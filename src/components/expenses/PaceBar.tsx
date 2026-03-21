import { AlertTriangle, CheckCircle2, Gauge } from "lucide-react";
import { useFinancialData } from "@/hooks/useFinancialData";

const PaceBar = () => {
  const { data, available, daysLeft } = useFinancialData();
  const hasData = data.balance > 0 || data.expenses > 0;
  const dailySpend = data.expenses > 0 ? data.expenses / Math.max(1, new Date().getDate()) : 0;
  const cashDays = dailySpend > 0 ? Math.floor(available / dailySpend) : 0;

  // Cap display to a reasonable range (max = days left in month * 2)
  const maxDays = daysLeft * 2;
  const displayCashDays = Math.min(cashDays, maxDays);
  const progress = hasData && (displayCashDays + daysLeft) > 0
    ? Math.min(100, (displayCashDays / (displayCashDays + daysLeft)) * 100)
    : 0;
  const accelerated = hasData && cashDays > 0 && cashDays < daysLeft;

  // Descriptive label instead of raw number
  const getLabel = () => {
    if (!hasData) return "Sem dados";
    if (cashDays === 0) return "Sem reserva";
    if (cashDays >= daysLeft) return "Folga confortável";
    return `Atenção: ${cashDays}d restantes`;
  };

  return (
    <div className="card-zelo fade-in-up">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Gauge size={12} className="text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground">Ritmo & Autonomia</p>
        </div>
        {hasData && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${accelerated ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}>
            {accelerated ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
            {accelerated ? "Ritmo Acelerado" : "Ritmo Saudável"}
          </span>
        )}
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${accelerated ? "bg-gradient-to-r from-destructive to-warning" : "bg-gradient-to-r from-success to-primary"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-muted-foreground">{getLabel()}</span>
        <span className="text-[10px] text-muted-foreground">Faltam {daysLeft} dias no mês</span>
      </div>
    </div>
  );
};

export default PaceBar;
