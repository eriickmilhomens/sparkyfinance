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
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/3 blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary/12 border border-primary/15">
            <PiggyBank size={16} className="text-primary" />
          </div>
          <span className="text-label font-semibold">Reserva de Contas</span>
        </div>
        <button onClick={() => setShowInfo(!showInfo)} className="text-muted-foreground hover:text-foreground transition-all duration-300">
          <Info size={14} />
        </button>
      </div>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: showInfo ? "80px" : "0px", opacity: showInfo ? 1 : 0 }}
      >
        <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
          Total de contas pendentes dividido pelos dias restantes do mês.
        </p>
      </div>

      <p className="text-xs text-muted-foreground mb-0.5 relative z-10">Você precisa de</p>
      <p className="text-xl font-display font-extrabold tabular-nums tracking-tight relative z-10">
        {hideValues ? "••••••" : fmt(calc.dailyTarget)}
        <span className="text-xs font-medium text-muted-foreground ml-1">/ dia</span>
      </p>

      <div className="mt-3 space-y-1.5 relative z-10">
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Reservado: {hideValues ? "••••" : fmt(calc.deposited)}</span>
          <span>Meta: {hideValues ? "••••" : fmt(pendingTotal)}</span>
        </div>
        <Progress value={calc.pct} className="h-2.5 bg-muted rounded-full" />
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">
            {calc.daysLeft} {calc.daysLeft === 1 ? "dia restante" : "dias restantes"}
          </span>
          <span className="font-medium text-primary tabular-nums">{Math.round(calc.pct)}%</span>
        </div>
      </div>

      {!showDeposit ? (
        <button
          onClick={() => setShowDeposit(true)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-2xl bg-primary/10 border border-primary/15 text-primary py-2.5 text-xs font-semibold active:scale-[0.98] transition-all duration-300 hover:bg-primary/15 relative z-10"
        >
          <ArrowDownCircle size={14} />
          Depositar
        </button>
      ) : (
        <div className="mt-3 pt-3 border-t border-border/40 space-y-2.5 fade-in-up relative z-10">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Valor para reservar"
            value={depositValue}
            onChange={(e) => setDepositValue(e.target.value)}
            className="w-full rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 tabular-nums"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowDeposit(false)} className="flex-1 rounded-2xl border border-border py-2.5 text-xs font-medium text-muted-foreground transition-all duration-300">Cancelar</button>
            <button onClick={handleDeposit} className="flex-1 rounded-2xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 active:scale-[0.98]">Confirmar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoffGoalCard;
