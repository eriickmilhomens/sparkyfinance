import { useState, useMemo } from "react";
import { Info, PiggyBank, ArrowDownCircle } from "lucide-react";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const PayoffGoalCard = ({ hideValues }: { hideValues?: boolean }) => {
  const { data, pendingTotal, addTransaction } = useFinancialData();
  const [showInfo, setShowInfo] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositValue, setDepositValue] = useState("");

  const calc = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = Math.max(1, daysInMonth - now.getDate());
    const dailyTarget = pendingTotal > 0 ? pendingTotal / daysLeft : 0;

    // Sum all goal_deposit transactions tagged as payoff reserves this month
    const month = now.getMonth();
    const year = now.getFullYear();
    const deposited = data.transactions
      .filter((t) => {
        if (t.type !== "goal_deposit" || t.category !== "Reserva de Contas") return false;
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((s, t) => s + t.amount, 0);

    const remaining = Math.max(0, pendingTotal - deposited);
    const pct = pendingTotal > 0 ? Math.min(100, (deposited / pendingTotal) * 100) : 0;

    return { daysLeft, dailyTarget, deposited, remaining, pct };
  }, [data.transactions, pendingTotal]);

  const handleDeposit = async () => {
    const raw = depositValue.replace(/\./g, "").replace(",", ".");
    const val = parseFloat(raw);
    if (isNaN(val) || val <= 0) {
      toast.error("Digite um valor válido");
      return;
    }
    try {
      await addTransaction({
        date: new Date().toISOString(),
        description: "Depósito: Reserva de Contas",
        amount: val,
        type: "goal_deposit",
        category: "Reserva de Contas",
      });
      toast.success(`${fmt(val)} reservado para quitar contas`);
      setDepositValue("");
      setShowDeposit(false);
    } catch {
      toast.error("Erro ao depositar");
    }
  };

  if (pendingTotal <= 0) return null;

  return (
    <div className="card-zelo fade-in-up relative overflow-hidden">
      {/* Glassmorphism accent */}
      <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <PiggyBank size={16} className="text-primary" />
          <span className="text-label font-semibold">Reserva de Contas</span>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Info size={14} />
        </button>
      </div>

      {showInfo && (
        <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed fade-in-up">
          Este valor é calculado dividindo o total de suas contas pendentes pelos dias restantes do
          mês, ajudando você a planejar seus ganhos diários.
        </p>
      )}

      {/* Daily target highlight */}
      <p className="text-xs text-muted-foreground mb-0.5">Você precisa de</p>
      <p className="text-xl font-extrabold tabular-nums tracking-tight">
        {hideValues ? "••••••" : fmt(calc.dailyTarget)}
        <span className="text-xs font-medium text-muted-foreground ml-1">/ dia</span>
      </p>

      {/* Progress bar */}
      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Reservado: {hideValues ? "••••" : fmt(calc.deposited)}</span>
          <span>Meta: {hideValues ? "••••" : fmt(pendingTotal)}</span>
        </div>
        <Progress value={calc.pct} className="h-2 bg-muted" />
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">
            {calc.daysLeft} {calc.daysLeft === 1 ? "dia restante" : "dias restantes"}
          </span>
          <span className="font-medium text-primary">{Math.round(calc.pct)}%</span>
        </div>
      </div>

      {/* Deposit button / form */}
      {!showDeposit ? (
        <button
          onClick={() => setShowDeposit(true)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 text-primary py-2 text-xs font-semibold active:scale-[0.98] transition-transform"
        >
          <ArrowDownCircle size={14} />
          Depositar
        </button>
      ) : (
        <div className="mt-3 pt-3 border-t border-border space-y-2 fade-in-up">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Valor para reservar"
            value={depositValue}
            onChange={(e) => setDepositValue(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeposit(false)}
              className="flex-1 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeposit}
              className="flex-1 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoffGoalCard;
