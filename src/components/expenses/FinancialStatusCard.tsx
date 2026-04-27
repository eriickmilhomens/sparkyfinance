import { useState } from "react";
import { useFinancialData } from "@/hooks/useFinancialData";
import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import { InfoButton, InfoPanel } from "@/components/InfoButton";

const FinancialStatusCard = () => {
  const { data, available } = useFinancialData();
  const [showInfo, setShowInfo] = useState(false);

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
      iconBg: "bg-success/12",
      iconColor: "text-success",
      titleColor: "text-success",
      accentBg: "bg-success/5",
    },
    attention: {
      icon: AlertTriangle,
      title: "Atenção necessária",
      message: `Você está gastando ${overBudgetPct}% acima do seu orçamento saudável. Considere reduzir despesas não essenciais.`,
      bg: "bg-warning/6",
      border: "border-warning/20",
      iconBg: "bg-warning/12",
      iconColor: "text-warning",
      titleColor: "text-warning",
      accentBg: "bg-warning/5",
    },
    critical: {
      icon: ShieldAlert,
      title: "Orçamento extrapolado",
      message: `Você está gastando ${overBudgetPct}% acima do limite saudável. Ação imediata recomendada para evitar endividamento.`,
      bg: "bg-destructive/6",
      border: "border-destructive/20",
      iconBg: "bg-destructive/12",
      iconColor: "text-destructive",
      titleColor: "text-destructive",
      accentBg: "bg-destructive/5",
    },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <div className={`rounded-3xl border ${c.border} ${c.bg} p-4 fade-in-up relative overflow-hidden transition-all duration-300`}>
      <div className={`absolute -top-6 -right-6 h-16 w-16 rounded-full ${c.accentBg} blur-2xl pointer-events-none`} />
      <div className="flex items-start gap-3 relative z-10">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${c.iconBg}`}>
          <Icon size={18} className={c.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-0.5">
            <p className={`text-sm font-display font-bold ${c.titleColor}`}>{c.title}</p>
            <InfoButton
              title="Status Financeiro"
              description="Avalia automaticamente sua saúde financeira comparando despesas com receita. Saudável (<60%), Atenção (60–85%) ou Crítico (>85%)."
              align="left"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{c.message}</p>
        </div>
      </div>
    </div>
  );
};

export default FinancialStatusCard;
