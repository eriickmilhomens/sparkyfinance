import { useMemo } from "react";
import { CheckCircle2, Clock, CalendarDays, Tag, Undo2, CreditCard, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";
import { usePoints } from "@/hooks/usePoints";
import { useBillingSnapshot } from "@/hooks/useBillingSnapshot";
import { getPendingExpenseSummary } from "@/lib/financialCalculations";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface BillItem {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  source: "transaction" | "card" | "subscription";
  paid: boolean;
}

const BillsAccordion = () => {
  const { data, addTransaction, deleteTransaction } = useFinancialData();
  const { awardPoints, removePoints } = usePoints();
  const billingSnapshot = useBillingSnapshot();

  const now = useMemo(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }, [new Date().toISOString().slice(0, 10)]);

  const paidIds = useMemo(() => new Set(billingSnapshot.paidBillIds), [billingSnapshot.paidBillIds]);

  // Build pending bills (non-subscription)
  const { pendingBills, pendingSubscriptions } = useMemo(() => {
    const summary = getPendingExpenseSummary(data.transactions, {
      now,
      paidBillIds: billingSnapshot.paidBillIds,
    });

    const txPending: BillItem[] = summary.pendingBills.map((bill) => ({
      id: bill.id || crypto.randomUUID(),
      description: bill.description,
      amount: bill.amount,
      date: bill.date,
      category: bill.category,
      source: "transaction",
      paid: false,
    }));

    const cardPending: BillItem[] = billingSnapshot.cards
      .filter((card) => {
        const amount = Number(card.invoiceAmount) || 0;
        return amount > 0 && !paidIds.has(`card-invoice-${card.id}`);
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

    const nonSubBills = [...txPending, ...cardPending].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return { pendingBills: nonSubBills, pendingSubscriptions: subPending };
  }, [data.transactions, now, billingSnapshot, paidIds]);

  // Payment handlers
  const handlePay = async (bill: BillItem) => {
    if (bill.source === "transaction") {
      const newPaid = new Set(paidIds);
      newPaid.add(bill.id);
      localStorage.setItem("sparky-paid-bills", JSON.stringify([...newPaid]));
      window.dispatchEvent(new Event("sparky-paid-bills-updated"));
      await awardPoints("bill_paid", `Pagou: ${bill.description}`);
      toast.success("Conta marcada como paga! +3 pts");
    } else if (bill.source === "subscription") {
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
    } else if (bill.source === "card") {
      const cardId = bill.id.replace("card-invoice-", "");
      const cards = JSON.parse(localStorage.getItem("sparky-credit-cards") || "[]");
      const card = cards.find((c: any) => c.id === cardId);
      if (!card) return;
      const newPaid = new Set(paidIds);
      newPaid.add(bill.id);
      localStorage.setItem("sparky-paid-bills", JSON.stringify([...newPaid]));
      window.dispatchEvent(new Event("sparky-paid-bills-updated"));
      const updatedCards = cards.map((c: any) =>
        c.id === cardId
          ? { ...c, invoiceAmount: 0, usedAmount: Math.max(0, c.usedAmount - bill.amount), paidInvoices: [...(c.paidInvoices || []), { month: new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" }), amount: bill.amount, paidAt: new Date().toLocaleDateString("pt-BR") }] }
          : c
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
      toast.success("Fatura paga! +3 pts");
    }
  };

  const handleReverse = async (bill: BillItem) => {
    if (bill.source === "subscription") {
      const subs = JSON.parse(localStorage.getItem("sparky-subscriptions") || "[]");
      const updated = subs.map((s: any) => s.id === bill.id ? { ...s, paid: false } : s);
      localStorage.setItem("sparky-subscriptions", JSON.stringify(updated));
      window.dispatchEvent(new Event("sparky-subscriptions-updated"));
      window.dispatchEvent(new Event("sparky-paid-bills-updated"));
      const existingTx = data.transactions.find(
        (t) => t.description === bill.description && t.category === "Assinatura"
      );
      if (existingTx) await deleteTransaction(existingTx.id);
      await removePoints("bill_paid", `Pagou: ${bill.description}`);
      toast.info("Assinatura estornada");
    }
  };

  const paidSubscriptions = useMemo(
    () =>
      billingSnapshot.subscriptions
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
          } as BillItem;
        }),
    [billingSnapshot.subscriptions, now]
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  const totalAPagar = pendingBills.reduce((s, b) => s + b.amount, 0) + pendingSubscriptions.reduce((s, b) => s + b.amount, 0);

  const renderItem = (bill: BillItem) => (
    <div
      key={bill.id}
      className={cn(
        "rounded-xl border p-3 transition-all",
        bill.paid ? "bg-muted/30 border-success/20 opacity-80" : "bg-card border-border"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full shrink-0", bill.paid ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
          {bill.paid ? <CheckCircle2 size={16} /> : <Clock size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-xs font-medium truncate", bill.paid && "line-through text-muted-foreground")}>{bill.description}</p>
          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
            <CalendarDays size={9} /> {formatDate(bill.date)}
          </span>
        </div>
        <p className={cn("text-sm font-bold tabular-nums shrink-0", bill.paid ? "text-success" : "text-destructive")}>{fmt(bill.amount)}</p>
      </div>
      <div className="mt-2 flex justify-end">
        {bill.paid ? (
          <button onClick={() => handleReverse(bill)} className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:bg-destructive/15 hover:text-destructive flex items-center gap-1 active:scale-95 transition-all">
            <Undo2 size={10} /> Estornar
          </button>
        ) : (
          <button onClick={() => handlePay(bill)} className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-success/15 text-success hover:bg-success/25 flex items-center gap-1 active:scale-95 transition-all">
            <CheckCircle2 size={10} /> Marcar como pago
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="card-zelo !p-0 overflow-hidden">
      <Accordion type="multiple" defaultValue={["a-pagar", "assinaturas"]}>
        {/* A Pagar */}
        <AccordionItem value="a-pagar" className="border-b border-border">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15">
                <Receipt size={14} className="text-warning" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold">A Pagar</p>
                <p className="text-[9px] text-muted-foreground">
                  {pendingBills.length} pendente{pendingBills.length !== 1 ? "s" : ""} · {fmt(pendingBills.reduce((s, b) => s + b.amount, 0))}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            {pendingBills.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 size={20} className="text-success mx-auto mb-1" />
                <p className="text-[10px] text-muted-foreground">Nenhuma conta pendente</p>
              </div>
            ) : (
              <div className="space-y-2">{pendingBills.map(renderItem)}</div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Assinaturas */}
        <AccordionItem value="assinaturas" className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
                <CreditCard size={14} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold">Assinaturas</p>
                <p className="text-[9px] text-muted-foreground">
                  {pendingSubscriptions.length} pendente{pendingSubscriptions.length !== 1 ? "s" : ""} · {paidSubscriptions.length} paga{paidSubscriptions.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            {pendingSubscriptions.length === 0 && paidSubscriptions.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-[10px] text-muted-foreground">Nenhuma assinatura cadastrada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingSubscriptions.map(renderItem)}
                {paidSubscriptions.map(renderItem)}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Footer total */}
      {totalAPagar > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
          <p className="text-[10px] text-muted-foreground font-medium">Total pendente</p>
          <p className="text-xs font-bold text-warning">{fmt(totalAPagar)}</p>
        </div>
      )}
    </div>
  );
};

export default BillsAccordion;
