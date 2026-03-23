import { useState } from "react";
import { X, CheckCircle2, Clock, Trash2, CalendarDays, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";
import { useDockVisibility } from "@/hooks/useDockVisibility";
import { toast } from "sonner";
import { useBillingActions } from "@/hooks/useBillingActions";
import type { BillingItem } from "@/lib/billing";

interface APagarModalProps {
  open: boolean;
  onClose: () => void;
}

const APagarModal = ({ open, onClose }: APagarModalProps) => {
  const { pendingItems, pendingTotal, pendingCount, paidTotal, totalBills, deleteTransaction } = useFinancialData();
  const { payPlannedExpense, paySubscription, payCardInvoice } = useBillingActions();
  const [processingId, setProcessingId] = useState<string | null>(null);

  useDockVisibility(open);

  const now = new Date();

  const payBill = async (bill: BillingItem) => {
    setProcessingId(bill.id);

    try {
      if (bill.source === "transaction") {
        await payPlannedExpense(bill.id, bill.description);
      } else if (bill.source === "subscription") {
        await paySubscription(bill.id);
      } else {
        await payCardInvoice(bill.id);
      }

      toast.success("Pagamento confirmado e saldo recalculado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir o pagamento.");
    } finally {
      setProcessingId(null);
    }
  };

  const deleteBill = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast.success("Conta removida com sucesso");
    } catch {
      toast.error("Não foi possível remover a conta.");
    }
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
          {pendingItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conta planejada pendente este mês.</p>
          ) : (
            pendingItems.map((bill) => {
              const isProcessing = processingId === bill.id;
              return (
                <div
                  key={bill.id}
                  className="rounded-xl border p-3 transition-all bg-card border-border hover:border-warning/30"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => payBill(bill)}
                      disabled={isProcessing}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-90 flex-shrink-0 bg-warning/15 text-warning",
                        isProcessing && "opacity-60 pointer-events-none",
                      )}
                    >
                      {isProcessing ? <CheckCircle2 size={16} /> : <Clock size={16} />}
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
                    <button
                      onClick={() => payBill(bill)}
                      disabled={isProcessing}
                      className={cn(
                        "text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all active:scale-95 bg-primary/15 text-primary hover:bg-primary/25",
                        isProcessing && "opacity-60 pointer-events-none",
                      )}
                    >
                      {isProcessing ? "Processando..." : "Marcar como pago"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {pendingCount > 0 && (
          <p className="mt-3 text-[10px] text-muted-foreground text-center">
            {pendingCount} pendência{pendingCount !== 1 ? "s" : ""} ativa{pendingCount !== 1 ? "s" : ""} nesta fila unificada.
          </p>
        )}
      </div>
    </div>
  );
};

export default APagarModal;
