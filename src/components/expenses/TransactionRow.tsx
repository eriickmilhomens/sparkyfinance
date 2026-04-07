import { memo, useState, useCallback } from "react";
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmt } from "@/hooks/useFinancialData";
import { isGoalDepositTransaction } from "@/lib/financialCalculations";
import type { Transaction } from "@/hooks/useFinancialQuery";
import { toast } from "sonner";

const parseBRL = (str: string): number => {
  const clean = str.replace(/[^\d.,]/g, "");
  if (clean.includes(",")) {
    const parts = clean.split(",");
    const intPart = parts[0].replace(/\./g, "");
    return parseFloat(`${intPart}.${parts[1]}`) || 0;
  }
  if ((clean.match(/\./g) || []).length > 1) {
    return parseFloat(clean.replace(/\./g, "")) || 0;
  }
  return parseFloat(clean) || 0;
};

interface TransactionRowProps {
  transaction: Transaction;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, data: { description: string; amount: number }) => Promise<void>;
}

const TransactionRow = memo(({ transaction: t, onDelete, onUpdate }: TransactionRowProps) => {
  const [editing, setEditing] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isIncomeTx = t.type === "income";
  const isGoalTx = isGoalDepositTransaction(t);

  const startEdit = useCallback(() => {
    setEditDesc(t.description);
    setEditAmount(t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
    setEditing(true);
  }, [t.description, t.amount]);

  const handleEdit = useCallback(async () => {
    const newAmount = parseBRL(editAmount);
    if (newAmount <= 0) { toast.error("Valor inválido"); return; }
    try {
      await onUpdate(t.id, { description: editDesc, amount: newAmount });
      setEditing(false);
      toast.success("Transação atualizada");
    } catch {
      toast.error("Erro ao atualizar transação");
    }
  }, [editDesc, editAmount, t.id, onUpdate]);

  const handleDelete = useCallback(async () => {
    try {
      await onDelete(t.id);
      setConfirmDelete(false);
      toast.success("Transação excluída e saldo recalculado");
    } catch {
      toast.error("Erro ao excluir transação");
    }
  }, [t.id, onDelete]);

  if (editing) {
    return (
      <div className="px-4 py-3 space-y-2">
        <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Descrição" />
        <input type="text" inputMode="numeric" value={editAmount} onChange={(e) => setEditAmount(e.target.value)}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary tabular-nums" placeholder="Valor" />
        <div className="flex gap-2">
          <button onClick={handleEdit} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-success/15 py-2 text-xs font-medium text-success active:scale-95">
            <Check size={14} /> Salvar
          </button>
          <button onClick={() => setEditing(false)} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-muted py-2 text-xs font-medium text-muted-foreground active:scale-95">
            <X size={14} /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (confirmDelete) {
    return (
      <div className="px-4 py-3">
        <p className="text-xs text-muted-foreground mb-2">Excluir "{t.description}"? O saldo será recalculado.</p>
        <div className="flex gap-2">
          <button onClick={handleDelete} className="flex-1 rounded-lg bg-destructive/15 py-2 text-xs font-medium text-destructive active:scale-95">Confirmar</button>
          <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-lg bg-muted py-2 text-xs font-medium text-muted-foreground active:scale-95">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl",
        isIncomeTx ? "bg-success/15" : isGoalTx ? "bg-primary/15" : "bg-destructive/15"
      )}>
        {isIncomeTx ? <ArrowUpRight size={14} className="text-success" />
          : isGoalTx ? <PiggyBank size={14} className="text-primary" />
          : <ArrowDownLeft size={14} className="text-destructive" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{t.description}</p>
        <p className="text-[10px] text-muted-foreground">{t.category}</p>
      </div>
      <span className={cn("text-sm font-bold tabular-nums mr-2",
        isIncomeTx ? "text-success" : isGoalTx ? "text-primary" : "text-foreground"
      )}>
        {isIncomeTx ? "+" : isGoalTx ? "•" : "−"} {fmt(t.amount)}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={startEdit} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary active:scale-95 transition-all will-change-transform">
          <Pencil size={13} />
        </button>
        <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive active:scale-95 transition-all will-change-transform">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
});

TransactionRow.displayName = "TransactionRow";

export default TransactionRow;
