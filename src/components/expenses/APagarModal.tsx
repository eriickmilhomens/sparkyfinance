import { useMemo, useState } from "react";
import { X, CheckCircle2, Clock, Trash2, CalendarDays, Tag, Undo2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";
import { usePoints } from "@/hooks/usePoints";
import { useDockVisibility } from "@/hooks/useDockVisibility";
import { toast } from "sonner";
import { useBillingSnapshot } from "@/hooks/useBillingSnapshot";
import {
  addPaidBillIds,
  buildBillingOverview,
  getCardInvoicePaymentId,
  getSubscriptionPaymentId,
  readStoredCards,
  readStoredSubscriptions,
  removePaidBillIds,
  writeStoredCards,
  writeStoredSubscriptions,
} from "@/lib/billingState";

interface APagarModalProps {
  open: boolean;
  onClose: () => void;
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

  const { pendingBills, paidBills, paidTotal, pendingTotal } = useMemo(() => {
    const overview = buildBillingOverview(data.transactions, billingSnapshot, now);

    return {
      pendingBills: overview.pendingBills,
      paidBills: overview.paidBills,
      paidTotal: overview.paidTotal,
      pendingTotal: overview.pendingTotal,
    };
  }, [data.transactions, now, billingSnapshot]);

  const totalBills = pendingTotal + paidTotal;

  // --- Payment handlers for each source ---

  const handlePayTransaction = async (bill: (typeof pendingBills)[number]) => {
    addPaidBillIds([bill.id]);
    await awardPoints("bill_paid", `Pagou: ${bill.description}`);
    toast.success("Conta marcada como paga! +3 pts");
  };

  const handleReverseTransaction = async (bill: (typeof paidBills)[number]) => {
    removePaidBillIds([bill.id]);
    await removePoints("bill_paid", `Pagou: ${bill.description}`);
    toast.info("Conta desmarcada e pontos removidos");
  };

  const handlePaySubscription = async (bill: (typeof pendingBills)[number]) => {
    const previousSubscriptions = readStoredSubscriptions();
    const nextSubscriptions = previousSubscriptions.map((subscription) =>
      subscription.id === bill.id ? { ...subscription, paid: true } : subscription,
    );

    writeStoredSubscriptions(nextSubscriptions);

    try {
      const transactionId = await addTransaction({
        date: new Date().toISOString(),
        description: bill.description,
        amount: bill.amount,
        type: "expense",
        category: "Assinatura",
      });

      addPaidBillIds([getSubscriptionPaymentId(bill.id, now), transactionId]);
      await awardPoints("bill_paid", `Pagou: ${bill.description}`);
      toast.success("Assinatura paga! +3 pts");
    } catch {
      writeStoredSubscriptions(previousSubscriptions);
      toast.error("Não foi possível pagar a assinatura agora.");
    }
  };

  const handleReverseSubscription = async (bill: (typeof paidBills)[number]) => {
    const previousSubscriptions = readStoredSubscriptions();
    const nextSubscriptions = previousSubscriptions.map((subscription) =>
      subscription.id === bill.id ? { ...subscription, paid: false } : subscription,
    );
    const existingTransaction = data.transactions.find(
      (transaction) => transaction.description === bill.description && transaction.category === "Assinatura",
    );

    writeStoredSubscriptions(nextSubscriptions);

    try {
      if (existingTransaction) {
        await deleteTransaction(existingTransaction.id);
      }

      removePaidBillIds([
        getSubscriptionPaymentId(bill.id, now),
        bill.id,
        existingTransaction?.id ?? "",
      ]);
      await removePoints("bill_paid", `Pagou: ${bill.description}`);
      toast.info("Assinatura estornada e pontos removidos");
    } catch {
      writeStoredSubscriptions(previousSubscriptions);
      toast.error("Não foi possível estornar a assinatura agora.");
    }
  };

  const handlePayCard = async (bill: (typeof pendingBills)[number]) => {
    const cardId = bill.id.replace("card-invoice-", "");
    const previousCards = readStoredCards();
    const card = previousCards.find((currentCard) => currentCard.id === cardId);
    if (!card) return;

    const nextCards = previousCards.map((currentCard) =>
      currentCard.id === cardId
        ? {
            ...currentCard,
            invoiceAmount: 0,
            usedAmount: Math.max(0, currentCard.usedAmount - bill.amount),
            paidInvoices: [
              ...(currentCard.paidInvoices || []),
              {
                cycleKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
                month: new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
                amount: bill.amount,
                paidAt: new Date().toLocaleDateString("pt-BR"),
              },
            ],
          }
        : currentCard,
    );

    writeStoredCards(nextCards);

    try {
      const transactionId = await addTransaction({
        date: new Date().toISOString(),
        description: `Fatura: ${card.cardName || card.bankName}`,
        amount: bill.amount,
        type: "expense",
        category: "Fatura",
        cardId,
      });

      addPaidBillIds([getCardInvoicePaymentId(cardId, now), `card-invoice-${cardId}`, transactionId]);
      await awardPoints("bill_paid", `Fatura: ${card.cardName || card.bankName}`);
      toast.success("Fatura paga com sucesso! +3 pts");
    } catch {
      writeStoredCards(previousCards);
      toast.error("Não foi possível pagar a fatura agora.");
    }
  };

  const handleReverseCard = async (bill: (typeof paidBills)[number]) => {
    const cardId = bill.id.replace("card-invoice-", "");

    const previousCards = readStoredCards();
    const card = previousCards.find((currentCard) => currentCard.id === cardId);
    const existingTransaction = data.transactions.find(
      (transaction) => transaction.cardId === cardId || (transaction.description.startsWith("Fatura:") && transaction.category === "Fatura"),
    );

    if (!card) return;

    const lastPaid = card.paidInvoices?.[card.paidInvoices.length - 1];
    const restoreAmount = Number(lastPaid?.amount) || bill.amount;
    const nextCards = previousCards.map((currentCard) =>
      currentCard.id === cardId
          ? {
              ...currentCard,
              invoiceAmount: currentCard.invoiceAmount + restoreAmount,
              usedAmount: currentCard.usedAmount + restoreAmount,
              paidInvoices: (currentCard.paidInvoices || []).slice(0, -1),
            }
          : currentCard,
    );

    writeStoredCards(nextCards);

    try {
      if (existingTransaction) {
        await deleteTransaction(existingTransaction.id);
      }

      removePaidBillIds([
        getCardInvoicePaymentId(cardId, now),
        `card-invoice-${cardId}`,
        existingTransaction?.id ?? "",
      ]);
      await removePoints("bill_paid", "Fatura estornada");
      toast.info("Fatura estornada e pontos removidos");
    } catch {
      writeStoredCards(previousCards);
      toast.error("Não foi possível estornar a fatura agora.");
    }
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
    removePaidBillIds([id]);
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
