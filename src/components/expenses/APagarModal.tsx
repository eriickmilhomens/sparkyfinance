import { useMemo, useState } from "react";
import { X, CheckCircle2, Clock, Trash2, CalendarDays, Tag, Undo2, ChevronDown, ChevronUp } from "lucide-react";
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
  paid: boolean;
}

const APagarModal = ({ open, onClose }: APagarModalProps) => {
  const { data, updateData, addTransaction, deleteTransaction } = useFinancialData();
  const { awardPoints, removePoints } = usePoints();
  const billingSnapshot = useBillingSnapshot();
  const [showHistory, setShowHistory] = useState(false);
  useDockVisibility(open);

  const todayKey = new Date().toISOString().slice(0, 10);
  const now = useMemo(() => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    return date;
  }, [todayKey]);

  const paidIds = useMemo(() => new Set(billingSnapshot.paidBillIds), [billingSnapshot.paidBillIds]);

  const { pendingBills, paidBills, paidTotal, pendingTotal } = useMemo(() => {
    const summary = getPendingExpenseSummary(data.transactions, {
      now,
      paidBillIds: billingSnapshot.paidBillIds,
    });

    // Transaction-based bills (pending)
    const txPending: BillItem[] = summary.pendingBills.map((bill) => ({
      id: bill.id || crypto.randomUUID(),
      description: bill.description,
      amount: bill.amount,
      date: bill.date,
      category: bill.category,
      source: "transaction",
      paid: false,
    }));

    // Transaction-based bills (paid)
    const txPaid: BillItem[] = summary.paidBills.map((bill) => ({
      id: bill.id || crypto.randomUUID(),
      description: bill.description,
      amount: bill.amount,
      date: bill.date,
      category: bill.category,
      source: "transaction",
      paid: true,
    }));

    // Card invoices - pending (invoiceAmount > 0 and not in paidIds)
    const cardPending: BillItem[] = billingSnapshot.cards
      .filter((card) => {
        const amount = Number(card.invoiceAmount) || 0;
        const invoiceId = `card-invoice-${card.id}`;
        return amount > 0 && !paidIds.has(invoiceId);
      })
      .map((card) => {
        const dueDate = new Date(now.getFullYear(), now.getMonth(), card.dueDay || 10);
        if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
        return {
          id: `card-invoice-${card.id}`,
          description: `Fatura: ${card.cardName || card.bankName}`,
          amount: Number(card.invoiceAmount) || 0,
          date: dueDate.toISOString(),
          category: "Fatura",
          source: "card" as const,
          paid: false,
        };
      });

    // Card invoices - paid (in paidIds)
    const cardPaid: BillItem[] = billingSnapshot.cards
      .filter((card) => {
        const invoiceId = `card-invoice-${card.id}`;
        return paidIds.has(invoiceId);
      })
      .map((card) => {
        const dueDate = new Date(now.getFullYear(), now.getMonth(), card.dueDay || 10);
        if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
        return {
          id: `card-invoice-${card.id}`,
          description: `Fatura: ${card.cardName || card.bankName}`,
          amount: Number(card.invoiceAmount) || 0,
          date: dueDate.toISOString(),
          category: "Fatura",
          source: "card" as const,
          paid: true,
        };
      });

    // Subscriptions - pending
    const subPending: BillItem[] = billingSnapshot.subscriptions
      .filter((sub) => !sub.paid)
      .map((sub) => {
        const dueDate = new Date(now.getFullYear(), now.getMonth(), sub.dueDay || 10);
        if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
        return {
          id: sub.id,
          description: `Assinatura: ${sub.name}`,
          amount: Number(sub.amount) || 0,
          date: dueDate.toISOString(),
          category: "Assinatura",
          source: "subscription" as const,
          paid: false,
        };
      });

    // Subscriptions - paid
    const subPaid: BillItem[] = billingSnapshot.subscriptions
      .filter((sub) => sub.paid)
      .map((sub) => {
        const dueDate = new Date(now.getFullYear(), now.getMonth(), sub.dueDay || 10);
        if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
        return {
          id: sub.id,
          description: `Assinatura: ${sub.name}`,
          amount: Number(sub.amount) || 0,
          date: dueDate.toISOString(),
          category: "Assinatura",
          source: "subscription" as const,
          paid: true,
        };
      });

    const allPending = [...txPending, ...cardPending, ...subPending].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const allPaid = [...txPaid, ...cardPaid, ...subPaid].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return {
      pendingBills: allPending,
      paidBills: allPaid,
      paidTotal: allPaid.reduce((sum, bill) => sum + bill.amount, 0),
      pendingTotal: allPending.reduce((sum, bill) => sum + bill.amount, 0),
    };
  }, [data.transactions, now, billingSnapshot, paidIds]);

  const totalBills = pendingTotal + paidTotal;

  // --- Payment handlers for each source ---

  const handlePayTransaction = async (bill: BillItem) => {
    const newPaid = new Set(paidIds);
    newPaid.add(bill.id);
    localStorage.setItem("sparky-paid-bills", JSON.stringify([...newPaid]));
    window.dispatchEvent(new Event("sparky-paid-bills-updated"));
    await awardPoints("bill_paid", `Pagou: ${bill.description}`);
    toast.success("Conta marcada como paga! +3 pts");
  };

  const handleReverseTransaction = async (bill: BillItem) => {
    const newPaid = new Set(paidIds);
    newPaid.delete(bill.id);
    localStorage.setItem("sparky-paid-bills", JSON.stringify([...newPaid]));
    window.dispatchEvent(new Event("sparky-paid-bills-updated"));
    await removePoints("bill_paid", `Pagou: ${bill.description}`);
    toast.info("Conta desmarcada e pontos removidos");
  };

  const handlePaySubscription = async (bill: BillItem) => {
    const subs = JSON.parse(localStorage.getItem("sparky-subscriptions") || "[]");
    const updated = subs.map((s: any) => s.id === bill.id ? { ...s, paid: true } : s);
    localStorage.setItem("sparky-subscriptions", JSON.stringify(updated));
    window.dispatchEvent(new Event("sparky-subscriptions-updated"));
    window.dispatchEvent(new Event("sparky-paid-bills-updated"));

    await addTransaction({
      date: new Date().toISOString(),
      description: bill.description,
      amount: bill.amount,
      type: "expense",
      category: "Assinatura",
    });
    await awardPoints("bill_paid", `Pagou: ${bill.description}`);
    toast.success("Assinatura paga! +3 pts");
  };

  const handleReverseSubscription = async (bill: BillItem) => {
    const subs = JSON.parse(localStorage.getItem("sparky-subscriptions") || "[]");
    const updated = subs.map((s: any) => s.id === bill.id ? { ...s, paid: false } : s);
    localStorage.setItem("sparky-subscriptions", JSON.stringify(updated));
    window.dispatchEvent(new Event("sparky-subscriptions-updated"));
    window.dispatchEvent(new Event("sparky-paid-bills-updated"));

    const existingTx = data.transactions.find(
      (t) => t.description === bill.description && t.category === "Assinatura",
    );
    if (existingTx) await deleteTransaction(existingTx.id);
    await removePoints("bill_paid", `Pagou: ${bill.description}`);
    toast.info("Assinatura estornada e pontos removidos");
  };

  const handlePayCard = async (bill: BillItem) => {
    const cardId = bill.id.replace("card-invoice-", "");
    const cards = JSON.parse(localStorage.getItem("sparky-credit-cards") || "[]");
    const card = cards.find((c: any) => c.id === cardId);
    if (!card) return;

    // Mark as paid in paidBillIds
    const newPaid = new Set(paidIds);
    newPaid.add(bill.id);
    localStorage.setItem("sparky-paid-bills", JSON.stringify([...newPaid]));
    window.dispatchEvent(new Event("sparky-paid-bills-updated"));

    // Update card data
    const updatedCards = cards.map((c: any) =>
      c.id === cardId
        ? {
            ...c,
            invoiceAmount: 0,
            usedAmount: Math.max(0, c.usedAmount - bill.amount),
            paidInvoices: [
              ...(c.paidInvoices || []),
              {
                month: new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
                amount: bill.amount,
                paidAt: new Date().toLocaleDateString("pt-BR"),
              },
            ],
          }
        : c,
    );
    localStorage.setItem("sparky-credit-cards", JSON.stringify(updatedCards));
    window.dispatchEvent(new Event("sparky-cards-updated"));

    await addTransaction({
      date: new Date().toISOString(),
      description: `Fatura: ${card.cardName}`,
      amount: bill.amount,
      type: "expense",
      category: "Fatura",
    });
    await awardPoints("bill_paid", `Fatura: ${card.cardName}`);
    toast.success("Fatura paga com sucesso! +3 pts");
  };

  const handleReverseCard = async (bill: BillItem) => {
    const cardId = bill.id.replace("card-invoice-", "");

    // Remove from paidBillIds
    const newPaid = new Set(paidIds);
    newPaid.delete(bill.id);
    localStorage.setItem("sparky-paid-bills", JSON.stringify([...newPaid]));
    window.dispatchEvent(new Event("sparky-paid-bills-updated"));

    // Reverse the card data
    const cards = JSON.parse(localStorage.getItem("sparky-credit-cards") || "[]");
    const card = cards.find((c: any) => c.id === cardId);
    if (card) {
      const lastPaid = card.paidInvoices?.[card.paidInvoices.length - 1];
      const restoreAmount = lastPaid?.amount || bill.amount;
      const updatedCards = cards.map((c: any) =>
        c.id === cardId
          ? {
              ...c,
              invoiceAmount: c.invoiceAmount + restoreAmount,
              usedAmount: c.usedAmount + restoreAmount,
              paidInvoices: (c.paidInvoices || []).slice(0, -1),
            }
          : c,
      );
      localStorage.setItem("sparky-credit-cards", JSON.stringify(updatedCards));
      window.dispatchEvent(new Event("sparky-cards-updated"));
    }

    // Remove the expense transaction
    const existingTx = data.transactions.find(
      (t) => t.description.startsWith("Fatura:") && t.category === "Fatura",
    );
    if (existingTx) await deleteTransaction(existingTx.id);
    await removePoints("bill_paid", `Fatura estornada`);
    toast.info("Fatura estornada e pontos removidos");
  };

  // Unified handlers
  const handlePay = async (bill: BillItem) => {
    if (bill.source === "transaction") return handlePayTransaction(bill);
    if (bill.source === "subscription") return handlePaySubscription(bill);
    if (bill.source === "card") return handlePayCard(bill);
  };

  const handleReverse = async (bill: BillItem) => {
    if (bill.source === "transaction") return handleReverseTransaction(bill);
    if (bill.source === "subscription") return handleReverseSubscription(bill);
    if (bill.source === "card") return handleReverseCard(bill);
  };

  const deleteBill = (id: string) => {
    const newTransactions = data.transactions.filter((t) => t.id !== id);
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

  const sourceLabel = (source: string) => {
    if (source === "card") return "Cartão";
    if (source === "subscription") return "Assinatura";
    return "Conta";
  };

  if (!open) return null;

  const renderBillCard = (bill: BillItem) => (
    <div
      key={bill.id}
      className={cn(
        "rounded-xl border p-3 transition-all",
        bill.paid
          ? "bg-muted/30 border-success/20 opacity-80"
          : "bg-card border-border hover:border-warning/30",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0",
            bill.paid ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
          )}
        >
          {bill.paid ? <CheckCircle2 size={16} /> : <Clock size={16} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn("text-xs font-medium truncate", bill.paid && "line-through text-muted-foreground")}>
            {bill.description}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
              <CalendarDays size={9} /> {formatDate(bill.date)}
            </span>
            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
              <Tag size={9} /> {sourceLabel(bill.source)}
            </span>
          </div>
        </div>

        <p className={cn("text-sm font-bold tabular-nums flex-shrink-0", bill.paid ? "text-success" : "text-destructive")}>
          {fmt(bill.amount)}
        </p>

        {bill.source === "transaction" && !bill.paid && (
          <button
            onClick={() => deleteBill(bill.id)}
            className="text-muted-foreground hover:text-destructive transition-colors active:scale-90 p-1"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold",
            bill.paid ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
          )}
        >
          {bill.paid ? (
            <><CheckCircle2 size={9} /> Pago</>
          ) : (
            <><Clock size={9} /> Aguardando pagamento</>
          )}
        </span>

        {bill.paid ? (
          <button
            onClick={() => handleReverse(bill)}
            className="text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all active:scale-95 bg-muted text-muted-foreground hover:bg-destructive/15 hover:text-destructive flex items-center gap-1"
          >
            <Undo2 size={10} /> Estornar
          </button>
        ) : (
          <button
            onClick={() => handlePay(bill)}
            className="text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all active:scale-95 bg-success/15 text-success hover:bg-success/25 flex items-center gap-1"
          >
            <CheckCircle2 size={10} /> Marcar como pago
          </button>
        )}
      </div>
    </div>
  );

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

        <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
          {/* Pending bills */}
          {pendingBills.length === 0 && paidBills.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 size={32} className="text-success mx-auto mb-2" />
              <p className="text-sm font-medium">Tudo em dia!</p>
              <p className="text-xs text-muted-foreground">Nenhuma conta pendente neste mês.</p>
            </div>
          ) : (
            <>
              {pendingBills.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Pendentes ({pendingBills.length})
                  </p>
                  {pendingBills.map(renderBillCard)}
                </div>
              )}

              {pendingBills.length === 0 && paidBills.length > 0 && (
                <div className="text-center py-4">
                  <CheckCircle2 size={24} className="text-success mx-auto mb-1" />
                  <p className="text-xs font-medium text-success">Contas todas pagas!</p>
                </div>
              )}

              {/* Paid bills history */}
              {paidBills.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors w-full"
                  >
                    Histórico ({paidBills.length})
                    {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {showHistory && paidBills.map(renderBillCard)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default APagarModal;
