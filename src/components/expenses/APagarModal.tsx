import { useState, useMemo, useEffect, useCallback } from "react";
import { X, CheckCircle2, Clock, Trash2, CalendarDays, Tag, DollarSign, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinancialData, fmt, Transaction } from "@/hooks/useFinancialData";
import { usePoints } from "@/hooks/usePoints";
import { useDockVisibility } from "@/hooks/useDockVisibility";
import { toast } from "sonner";
import { getPendingExpenseSummary, readPaidBillIds } from "@/lib/financialCalculations";

interface APagarModalProps {
  open: boolean;
  onClose: () => void;
}

interface BillItem {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  source: "transaction" | "card" | "subscription";
}

const APagarModal = ({ open, onClose }: APagarModalProps) => {
  const { data, updateData } = useFinancialData();
  const { awardPoints, removePoints } = usePoints();
  useDockVisibility(open);
  const [paidIds, setPaidIds] = useState<Set<string>>(() => {
    return new Set(readPaidBillIds());
  });
  const [revision, setRevision] = useState(0);

  // Re-sync when payments happen externally (subscriptions, cards)
  useEffect(() => {
    const handler = () => {
      setPaidIds(new Set(readPaidBillIds()));
      setRevision(r => r + 1);
    };
    window.addEventListener("sparky-paid-bills-updated", handler);
    window.addEventListener("sparky-cards-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("sparky-paid-bills-updated", handler);
      window.removeEventListener("sparky-cards-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  // Stable month reference — only changes when revision bumps
  const now = useMemo(() => new Date(), [revision]);

  const { allBills, paidTotal, pendingTotal } = useMemo(() => {
    const summary = getPendingExpenseSummary(data.transactions, {
      now,
      paidBillIds: [...paidIds],
    });

    const items: BillItem[] = summary.bills.map(b => ({
      id: b.id || crypto.randomUUID(),
      description: b.description,
      amount: b.amount,
      date: b.date,
      category: b.category,
      source: "transaction" as const,
    }));

    // Add credit card invoices
    try {
      const cards = JSON.parse(localStorage.getItem("sparky-credit-cards") || "[]");
      for (const card of cards) {
        const invoice = Number(card.invoiceAmount) || 0;
        if (invoice > 0) {
          const dueDay = card.dueDay || 10;
          const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
          if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
          items.push({
            id: `card-invoice-${card.id}`,
            description: `Fatura: ${card.cardName || card.bankName}`,
            amount: invoice,
            date: dueDate.toISOString(),
            category: "Fatura",
            source: "card",
          });
        }
      }
    } catch {}

    // Add unpaid subscriptions
    try {
      const subs = JSON.parse(localStorage.getItem("sparky-subscriptions") || "[]");
      for (const sub of subs) {
        if (!sub.paid && !paidIds.has(sub.id)) {
          const dueDate = new Date(now.getFullYear(), now.getMonth(), sub.dueDay || 10);
          if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
          items.push({
            id: sub.id,
            description: `Assinatura: ${sub.name}`,
            amount: Number(sub.amount) || 0,
            date: dueDate.toISOString(),
            category: "Assinatura",
            source: "subscription",
          });
        }
      }
    } catch {}

    const sorted = items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const paid = sorted.filter(b => paidIds.has(b.id));
    const pending = sorted.filter(b => !paidIds.has(b.id));

    return {
      allBills: sorted,
      paidTotal: paid.reduce((s, b) => s + b.amount, 0),
      pendingTotal: pending.reduce((s, b) => s + b.amount, 0),
    };
  }, [data.transactions, now, paidIds, revision]);

  const totalBills = paidTotal + pendingTotal;

  const togglePaid = async (id: string) => {
    const bill = allBills.find(b => b.id === id);
    if (!bill) return;

    const newPaid = new Set(paidIds);
    if (newPaid.has(id)) {
      // Unmark as paid — restore balance and remove points
      newPaid.delete(id);
      await removePoints("bill_paid", `Pagou: ${bill.description}`);
      toast.info("Conta desmarcada e pontos removidos");
    } else {
      // Mark as paid — award points
      newPaid.add(id);
      await awardPoints("bill_paid", `Pagou: ${bill.description}`);
      toast.success("Conta marcada como paga! +3 pts");
    }
    setPaidIds(newPaid);
    localStorage.setItem("sparky-paid-bills", JSON.stringify([...newPaid]));
    window.dispatchEvent(new Event("sparky-paid-bills-updated"));
  };

  const deleteBill = (id: string) => {
    const bill = allBills.find(b => b.id === id);
    if (!bill) return;
    const newTransactions = data.transactions.filter(t => t.id !== id);
    updateData({
      transactions: newTransactions,
    });
    // Also remove from paid if it was there
    const newPaid = new Set(paidIds);
    newPaid.delete(id);
    setPaidIds(newPaid);
    localStorage.setItem("sparky-paid-bills", JSON.stringify([...newPaid]));
    window.dispatchEvent(new Event("sparky-paid-bills-updated"));
    toast.success("Conta removida com sucesso");
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-slide-up sm:animate-fade-in rounded-t-3xl sm:rounded-2xl bg-card border-t sm:border border-border p-5 pb-8 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CalendarDays size={20} className="text-warning" />
              Contas a Pagar
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl bg-muted/50 border border-border p-3 text-center">
            <p className="text-[9px] text-muted-foreground mb-0.5">Total</p>
            <p className="text-sm font-bold tabular-nums">{fmt(totalBills)}</p>
          </div>
          <div className="rounded-xl bg-success/10 border border-success/20 p-3 text-center">
            <p className="text-[9px] text-success mb-0.5">Pago</p>
            <p className="text-sm font-bold tabular-nums text-success">{fmt(paidTotal)}</p>
          </div>
          <div className="rounded-xl bg-warning/10 border border-warning/20 p-3 text-center">
            <p className="text-[9px] text-warning mb-0.5">Pendente</p>
            <p className="text-sm font-bold tabular-nums text-warning">{fmt(pendingTotal)}</p>
          </div>
        </div>

        {/* Bills list */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {allBills.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conta planejada pendente este mês.</p>
          ) : (
            allBills.map((bill) => {
              const isPaid = paidIds.has(bill.id);
              return (
                <div
                  key={bill.id}
                  className={cn(
                    "rounded-xl border p-3 transition-all",
                    isPaid
                      ? "bg-success/5 border-success/20"
                      : "bg-card border-border hover:border-warning/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Status indicator */}
                    <button
                      onClick={() => togglePaid(bill.id)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-90 flex-shrink-0",
                        isPaid
                          ? "bg-success/20 text-success"
                          : "bg-warning/15 text-warning"
                      )}
                    >
                      {isPaid ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                    </button>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-medium truncate", isPaid && "line-through text-muted-foreground")}>
                        {bill.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                          <CalendarDays size={9} /> {formatDate(bill.date)}
                        </span>
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                          <Tag size={9} /> {bill.category}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <p className={cn("text-sm font-bold tabular-nums flex-shrink-0", isPaid ? "text-success" : "text-destructive")}>
                      {fmt(bill.amount)}
                    </p>

                    {/* Delete — only for transaction-based bills */}
                    {bill.source === "transaction" && (
                      <button
                        onClick={() => deleteBill(bill.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors active:scale-90 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold",
                        isPaid
                          ? "bg-success/15 text-success"
                          : "bg-warning/15 text-warning"
                      )}
                    >
                      {isPaid ? <><CheckCircle2 size={9} /> Pago</> : <><Clock size={9} /> Aguardando pagamento</>}
                    </span>
                    <button
                      onClick={() => togglePaid(bill.id)}
                      className={cn(
                        "text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all active:scale-95",
                        isPaid
                          ? "bg-muted text-muted-foreground hover:bg-muted/80"
                          : "bg-primary/15 text-primary hover:bg-primary/25"
                      )}
                    >
                      {isPaid ? "Desmarcar" : "Marcar como pago"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default APagarModal;
