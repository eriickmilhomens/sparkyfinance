import { useFinancialData } from "@/hooks/useFinancialData";
import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";

const FinancialStatusCard = () => {
  const { data, available } = useFinancialData();

  const hasData = data.balance > 0 || data.income > 0 || data.expenses > 0;
  if (!hasData) return null;

  const ratio = data.income > 0 ? (data.expenses / data.income) * 100 : 0;
  const overBudgetPct = Math.max(0, Math.round(ratio - 60));

  type Status = "healthy" | "attention" | "critical";
  let status: Status = "healthy";
  if (ratio > 85) status = "critical";
  else if (ratio > 60) status = "attention";

  const config = {
    healthy: {
      icon: ShieldCheck,
      title: "Tudo certo!",
      message: "Seus gastos estão dentro do orçamento saudável. Continue assim!",
      bg: "bg-success/6",
      border: "border-success/20",
      borderLeft: "border-l-success",
      iconBg: "bg-success/12",
      iconColor: "text-success",
      titleColor: "text-success",
    },
    attention: {
      icon: AlertTriangle,
      title: "Atenção necessária",
      message: `Você está gastando ${overBudgetPct}% acima do seu orçamento saudável. Considere reduzir despesas não essenciais.`,
      bg: "bg-warning/6",
      border: "border-warning/20",
      borderLeft: "border-l-warning",
      iconBg: "bg-warning/12",
      iconColor: "text-warning",
      titleColor: "text-warning",
    },
    critical: {
      icon: ShieldAlert,
      title: "Orçamento extrapolado",
      message: `Você está gastando ${overBudgetPct}% acima do limite saudável. Ação imediata recomendada para evitar endividamento.`,
      bg: "bg-destructive/6",
      border: "border-destructive/20",
      borderLeft: "border-l-destructive",
      iconBg: "bg-destructive/12",
      iconColor: "text-destructive",
      titleColor: "text-destructive",
    },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-3.5 fade-in-up border-l-4 ${c.borderLeft}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${c.iconBg}`}>
          <Icon size={17} className={c.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-display font-bold ${c.titleColor}`}>{c.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{c.message}</p>
        </div>
      </div>
    </div>
  );
};

export default FinancialStatusCard;
