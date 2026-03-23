import { useMemo } from "react";
import { X, CheckCircle2, Clock, Trash2, CalendarDays, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";
import { usePoints } from "@/hooks/usePoints";
import { useDockVisibility } from "@/hooks/useDockVisibility";
import { toast } from "sonner";
import { getPendingExpenseSummary } from "@/lib/financialCalculations";
import { useBillingSnapshot } from "@/hooks/useBillingSnapshot";

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
  const billingSnapshot = useBillingSnapshot();
  useDockVisibility(open);

  const todayKey = new Date().toISOString().slice(0, 10);
  const now = useMemo(() => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    return date;
  }, [todayKey]);

  const paidIds = useMemo(() => new Set(billingSnapshot.paidBillIds), [billingSnapshot.paidBillIds]);

  const { allBills, paidTotal, pendingTotal } = useMemo(() => {
    const summary = getPendingExpenseSummary(data.transactions, {
      now,
      paidBillIds: billingSnapshot.paidBillIds,
    });

    const transactionBills: BillItem[] = summary.pendingBills.map((bill) => ({
      id: bill.id || crypto.randomUUID(),
      description: bill.description,
      amount: bill.amount,
      date: bill.date,
      category: bill.category,
      source: "transaction",
    }));

    const cardBills: BillItem[] = billingSnapshot.cards
      .filter((card) => (Number(card.invoiceAmount) || 0) > 0)
      .map((card) => {
        const dueDate = new Date(now.getFullYear(), now.getMonth(), card.dueDay || 10);
        if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);

        return {
          id: `card-invoice-${card.id}`,
          description: `Fatura: ${card.cardName || card.bankName}`,
          amount: Number(card.invoiceAmount) || 0,
          date: dueDate.toISOString(),
          category: "Fatura",
          source: "card",
        };
      });

    const subscriptionBills: BillItem[] = billingSnapshot.subscriptions
      .filter((subscription) => !subscription.paid)
      .map((subscription) => {
        const dueDate = new Date(now.getFullYear(), now.getMonth(), subscription.dueDay || 10);
        if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);

        return {
          id: subscription.id,
          description: `Assinatura: ${subscription.name}`,
          amount: Number(subscription.amount) || 0,
          date: dueDate.toISOString(),
          category: "Assinatura",
          source: "subscription",
        };
      });

    const pendingBills = [...transactionBills, ...cardBills, ...subscriptionBills].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return {
      allBills: pendingBills,
      paidTotal: 0,
      pendingTotal: pendingBills.reduce((sum, bill) => sum + bill.amount, 0),
    };
  }, [data.transactions, now, billingSnapshot]);

  const totalBills = pendingTotal;

  const togglePaid = async (bill: BillItem) => {
    if (bill.source !== "transaction") return;

    const newPaid = new Set(paidIds);
    if (newPaid.has(bill.id)) {
      newPaid.delete(bill.id);
      await removePoints("bill_paid", `Pagou: ${bill.description}`);
      toast.info("Conta desmarcada e pontos removidos");
    } else {
      newPaid.add(bill.id);
      await awardPoints("bill_paid", `Pagou: ${bill.description}`);
      toast.success("Conta marcada como paga! +3 pts");
    }

    localStorage.setItem("sparky-paid-bills", JSON.stringify([...newPaid]));
    window.dispatchEvent(new Event("sparky-paid-bills-updated"));
  };

  const deleteBill = (id: string) => {
    const newTransactions = data.transactions.filter((transaction) => transaction.id !== id);
    updateData({ transactions: newTransactions });

    const newPaid = billingSnapshot.paidBillIds.filter((paidId) => paidId !== id);
    localStorage.setItem("sparky-paid-bills", JSON.stringify(newPaid));
    window.dispatchEvent(new Event("sparky-paid-bills-updated"));
    toast.success("Conta removida com sucesso");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-slide-up sm:animate-fade-in rounded-t-3xl sm:rounded-2xl bg-card border-t sm:border border-border p-5 pb-8 max-h-[85vh] overflow-hidden flex flex-col">
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

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {allBills.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conta pendente neste mês.</p>
          ) : (
            allBills.map((bill) => {
              const canToggle = bill.source === "transaction";
              return (
                <div
                  key={bill.id}
                  className={cn("rounded-xl border p-3 transition-all bg-card border-border hover:border-warning/30")}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => canToggle && togglePaid(bill)}
                      disabled={!canToggle}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-90 flex-shrink-0",
                        canToggle ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {canToggle ? <Clock size={16} /> : <CheckCircle2 size={16} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{bill.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                          <CalendarDays size={9} /> {formatDate(bill.date)}
                        </span>
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                          <Tag size={9} /> {bill.category}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm font-bold tabular-nums flex-shrink-0 text-destructive">
                      {fmt(bill.amount)}
                    </p>

                    {bill.source === "transaction" && (
                      <button
                        onClick={() => deleteBill(bill.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors active:scale-90 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold bg-warning/15 text-warning">
                      <Clock size={9} /> Aguardando pagamento
                    </span>
                    {canToggle ? (
                      <button
                        onClick={() => togglePaid(bill)}
                        className="text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all active:scale-95 bg-primary/15 text-primary hover:bg-primary/25"
                      >
                        Marcar como pago
                      </button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        Pague na seção {bill.source === "card" ? "Cartões" : "Assinaturas"}
                      </span>
                    )}
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
