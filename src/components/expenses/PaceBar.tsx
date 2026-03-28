import { AlertTriangle, CheckCircle2, Gauge } from "lucide-react";
import { useFinancialData } from "@/hooks/useFinancialData";

const PaceBar = () => {
  const { data, available, daysLeft } = useFinancialData();
  const hasData = data.balance > 0 || data.expenses > 0;
  const dailySpend = data.expenses > 0 ? data.expenses / Math.max(1, new Date().getDate()) : 0;
  const cashDays = dailySpend > 0 ? Math.floor(available / dailySpend) : 0;

  const maxDays = daysLeft * 2;
  const displayCashDays = Math.min(cashDays, maxDays);
  const progress = hasData && (displayCashDays + daysLeft) > 0
    ? Math.min(100, (displayCashDays / (displayCashDays + daysLeft)) * 100)
    : 0;
  const accelerated = hasData && cashDays > 0 && cashDays < daysLeft;

  const getLabel = () => {
    if (!hasData) return "Sem dados";
    if (cashDays === 0) return "Sem reserva";
    if (cashDays >= daysLeft) return "Folga confortável";
    return `Atenção: ${cashDays}d restantes`;
  };

  return (
    <div className="card-zelo fade-in-up relative overflow-hidden">
      <div className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-muted/30 blur-xl pointer-events-none" />
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 border border-border/30">
            <Gauge size={14} className="text-muted-foreground" />
          </div>
          <p className="text-xs font-display font-semibold text-muted-foreground">Ritmo & Autonomia</p>
        </div>
        {hasData && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold border ${accelerated ? "bg-destructive/8 text-destructive border-destructive/20" : "bg-success/8 text-success border-success/20"}`}>
            {accelerated ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
            {accelerated ? "Acelerado" : "Saudável"}
          </span>
        )}
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden relative z-10">
        <div
          className={`h-full rounded-full transition-all duration-700 ${accelerated ? "bg-gradient-to-r from-destructive to-warning" : "bg-gradient-to-r from-success to-primary"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 relative z-10">
        <span className="text-[10px] text-muted-foreground">{getLabel()}</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">Faltam {daysLeft} dias</span>
      </div>
    </div>
  );
};

export default PaceBar;
