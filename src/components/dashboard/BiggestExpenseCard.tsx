import { useState } from "react";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";
import { InfoButton, InfoPanel } from "@/components/InfoButton";

const VaultIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
    <rect x="2" y="4" width="20" height="16" rx="3" stroke="hsl(var(--primary))" strokeWidth="1.8" />
    <rect x="2" y="4" width="20" height="16" rx="3" fill="hsl(var(--primary))" opacity="0.08" />
    <circle cx="12" cy="12" r="4" stroke="hsl(var(--primary))" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="1.5" fill="hsl(var(--primary))" opacity="0.5" />
    <line x1="16" y1="12" x2="18" y2="12" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="20" y="9" width="2" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.3" />
  </svg>
);

interface BiggestExpenseCardProps {
  hideValues?: boolean;
}

const BiggestExpenseCard = ({ hideValues = false }: BiggestExpenseCardProps) => {
  const { data } = useFinancialData();

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const expensesThisMonth = data.transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === "expense" && d.getMonth() === month && d.getFullYear() === year;
  });

  if (expensesThisMonth.length === 0) return null;

  const biggest = expensesThisMonth.reduce((max, t) => t.amount > max.amount ? t : max, expensesThisMonth[0]);
  const biggestDate = new Date(biggest.date);
  const dateStr = biggestDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  return (
    <div className="card-zelo fade-in-up relative overflow-hidden">
      <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-destructive/6 blur-2xl pointer-events-none" />
      <div className="flex items-center gap-3 relative z-10">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/8 border border-primary/12">
          <VaultIcon />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-0.5">
            <p className="text-label">MAIOR DESPESA</p>
            <InfoButton
              title="Maior Despesa do Mês"
              description="Identifica a transação de maior valor registrada no mês atual. Útil para entender qual gasto pesou mais no orçamento e planejar ajustes."
              align="left"
            />
          </div>
          <p className="text-sm font-display font-bold truncate mt-0.5">
            {hideValues ? "••••••" : biggest.description}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground">{biggest.category}</span>
            <span className="text-[10px] text-muted-foreground/30">•</span>
            <span className="text-[10px] text-muted-foreground">{dateStr}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-display font-extrabold tabular-nums text-destructive">
            {hideValues ? "••••••" : fmt(biggest.amount)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BiggestExpenseCard;
