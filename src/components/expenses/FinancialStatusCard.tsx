import { useFinancialData } from "@/hooks/useFinancialData";
import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";

const FinancialStatusCard = () => {
  const { data, available } = useFinancialData();

  const hasData = data.balance > 0 || data.income > 0 || data.expenses > 0;
  if (!hasData) return null;

  // "Healthy" = expenses ≤ 60% of income
  // "Attention" = 60–85%
  // "Critical" = > 85%
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
      bg: "bg-success/10",
      border: "border-success/25",
      iconBg: "bg-success/15",
      iconColor: "text-success",
      titleColor: "text-success",
    },
    attention: {
      icon: AlertTriangle,
      title: "Atenção necessária",
      message: `Você está gastando ${overBudgetPct}% acima do seu orçamento saudável. Considere reduzir despesas não essenciais.`,
      bg: "bg-warning/10",
      border: "border-warning/25",
      iconBg: "bg-warning/15",
      iconColor: "text-warning",
      titleColor: "text-warning",
    },
    critical: {
      icon: ShieldAlert,
      title: "Orçamento extrapolado",
      message: `Você está gastando ${overBudgetPct}% acima do limite saudável. Ação imediata recomendada para evitar endividamento.`,
      bg: "bg-destructive/10",
      border: "border-destructive/25",
      iconBg: "bg-destructive/15",
      iconColor: "text-destructive",
      titleColor: "text-destructive",
    },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-3.5 fade-in-up`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${c.iconBg}`}>
          <Icon size={18} className={c.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${c.titleColor}`}>{c.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{c.message}</p>
        </div>
      </div>
    </div>
  );
};

export default FinancialStatusCard;
