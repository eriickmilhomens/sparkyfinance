import { useState } from "react";
import { Wallet, Info, X, TrendingDown } from "lucide-react";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";
import { cn } from "@/lib/utils";
import { isDiscretionaryExpenseTransaction } from "@/lib/financialCalculations";

const DailyBudgetWidget = () => {
  const { data, dailyBudget, daysLeft, pendingTotal } = useFinancialData();
  const [showPopup, setShowPopup] = useState(false);

  const reservePct = (() => {
    try { return parseInt(localStorage.getItem("sparky-reserve-pct") || "20") / 100; } catch { return 0.20; }
  })();

  // Today's expenses
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const todayExpenses = data.transactions
    .filter(t => isDiscretionaryExpenseTransaction(t) && t.date.startsWith(todayStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const remainingToday = Math.max(0, dailyBudget - todayExpenses);
  const monthlyPool = dailyBudget * daysLeft;
  const progressPct = dailyBudget > 0 ? Math.min(100, (todayExpenses / dailyBudget) * 100) : 0;
  const isOver = todayExpenses > dailyBudget;

  // For popup display
  const reserve = Math.max(0, data.balance * reservePct);
  const afterObligations = Math.max(0, data.balance - reserve - pendingTotal);

  return (
    <>
      <button
        onClick={() => setShowPopup(true)}
        className="card-zelo fade-in-up w-full text-left active:scale-[0.98] transition-all hover:border-primary/30"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
              <Wallet size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold">Pode Gastar Hoje</p>
              <p className="text-[9px] text-muted-foreground">{daysLeft} dias restantes no mês</p>
            </div>
          </div>
          <Info size={14} className="text-muted-foreground/50" />
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <p className={cn("text-2xl font-extrabold tabular-nums", isOver ? "text-destructive" : "text-primary")}>
            {fmt(remainingToday)}
          </p>
          {isOver && (
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-destructive">
              <TrendingDown size={10} /> Acima do limite
            </span>
          )}
        </div>

        {/* Daily progress bar */}
        <div className="space-y-1">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", isOver ? "bg-destructive" : "bg-primary")}
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>Gasto hoje: {fmt(todayExpenses)}</span>
            <span>Limite: {fmt(dailyBudget)}</span>
          </div>
        </div>

        {/* Monthly pool */}
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">Saldo acumulado restante</span>
            <span className="text-xs font-bold tabular-nums text-foreground">{fmt(monthlyPool)}</span>
          </div>
        </div>
      </button>

      {/* Educational popup */}
      {showPopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm card-zelo space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
                  <Wallet size={16} className="text-primary" />
                </div>
                <h3 className="text-sm font-bold">Como funciona?</h3>
              </div>
              <button onClick={() => setShowPopup(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-muted/30 border border-border p-3">
                <p className="text-xs font-semibold mb-1">📊 Reserva Dinâmica ({Math.round(reservePct * 100)}%)</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  O sistema separa {Math.round(reservePct * 100)}% do seu saldo como reserva de segurança.
                  O restante é dividido pelos dias faltantes do mês para gerar seu limite diário.
                </p>
              </div>

              <div className="rounded-xl bg-warning/5 border border-warning/20 p-3">
                <p className="text-xs font-semibold mb-1 text-warning">💡 Fórmula do limite diário</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  O valor de hoje considera apenas seu saldo real, as contas pendentes do mês e a sua reserva de segurança.
                  Depósitos em metas são reservas internas e não entram no cálculo do limite diário.
                </p>
              </div>

              <div className="rounded-xl bg-success/5 border border-success/20 p-3">
                <p className="text-xs font-semibold mb-1 text-success">🎯 Na Prática</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Exemplo: se você receber R$ 3.000, tiver R$ 800 em contas pendentes e reservar 20% de segurança,
                  o valor diário será calculado sobre o restante disponível para sobrevivência no mês.
                  Poupar para uma meta não reduz esse limite novamente.
                </p>
              </div>

              <div className="rounded-xl bg-muted/30 border border-border p-3">
                <p className="text-xs font-semibold mb-1">📈 Seus Números Hoje</p>
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Saldo Real</span>
                    <span className="font-medium">{fmt(data.balance)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Reserva ({Math.round(reservePct * 100)}%)</span>
                    <span className="font-medium text-warning">-{fmt(reserve)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Contas pendentes</span>
                    <span className="font-medium text-destructive">-{fmt(pendingTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] pt-1 border-t border-border">
                    <span className="text-muted-foreground font-semibold">Disponível para gastar</span>
                    <span className="font-bold text-primary">{fmt(afterObligations)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">÷ {daysLeft} dias restantes</span>
                    <span className="font-bold text-primary">{fmt(dailyBudget)}/dia</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPopup(false)}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground active:scale-[0.98]"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DailyBudgetWidget;
