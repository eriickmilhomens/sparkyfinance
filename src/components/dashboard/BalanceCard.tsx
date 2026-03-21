import { Eye, EyeOff, Pencil, Plus, Minus } from "lucide-react";
import { useState, useEffect } from "react";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";
import { toast } from "sonner";

interface BalanceCardProps {
  onVisibilityChange?: (visible: boolean) => void;
}

const BalanceCard = ({ onVisibilityChange }: BalanceCardProps) => {
  const [visible, setVisible] = useState(true);
  const [editing, setEditing] = useState(false);
  const [adjustType, setAdjustType] = useState<"add" | "sub">("add");
  const [adjustValue, setAdjustValue] = useState("");
  const [adjustDesc, setAdjustDesc] = useState("");
  const { available, data, updateData } = useFinancialData();

  useEffect(() => {
    onVisibilityChange?.(visible);
  }, [visible, onVisibilityChange]);

  const handleAdjust = () => {
    const raw = adjustValue.replace(/\./g, "").replace(",", ".");
    const val = parseFloat(raw);
    if (isNaN(val) || val <= 0) {
      toast.error("Digite um valor válido");
      return;
    }
    const delta = adjustType === "add" ? val : -val;
    const newBalance = data.balance + delta;
    const newTx = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      description: adjustDesc || "Ajuste de saldo",
      amount: Math.abs(val),
      type: (adjustType === "add" ? "income" : "expense") as "income" | "expense",
      category: "Ajuste",
    };
    updateData({
      balance: newBalance,
      income: adjustType === "add" ? data.income + val : data.income,
      expenses: adjustType === "sub" ? data.expenses + val : data.expenses,
      transactions: [newTx, ...data.transactions],
    });
    toast.success(`Saldo ajustado: ${adjustType === "add" ? "+" : "-"}${fmt(val)}`);
    setAdjustValue("");
    setAdjustDesc("");
    setEditing(false);
  };

  return (
    <div className="card-zelo fade-in-up border-l-primary">
      <div className="flex items-center justify-between mb-1">
        <span className="text-label">Saldo Disponível</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="text-muted-foreground active:scale-95 transition-transform"
            title="Ajustar saldo"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setVisible(!visible)}
            className="text-muted-foreground active:scale-95 transition-transform"
          >
            {visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      </div>
      <p className="text-3xl font-extrabold tracking-tight tabular-nums">
        {visible ? fmt(available) : "••••••"}
      </p>
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Receitas: <span className="text-success font-medium">{visible ? fmt(data.income) : "••••••"}</span></span>
          <span className="text-border">•</span>
          <span>Despesas: <span className="text-destructive font-medium">{visible ? fmt(data.expenses) : "••••••"}</span></span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Livre após contas agendadas
        </p>
      </div>

      {editing && (
        <div className="mt-3 pt-3 border-t border-border space-y-2 fade-in-up">
          <div className="flex gap-1.5">
            <button
              onClick={() => setAdjustType("add")}
              className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-all ${adjustType === "add" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
            >
              <Plus size={12} /> Adicionar
            </button>
            <button
              onClick={() => setAdjustType("sub")}
              className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-all ${adjustType === "sub" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}
            >
              <Minus size={12} /> Subtrair
            </button>
          </div>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Digite o valor"
            value={adjustValue}
            onChange={(e) => setAdjustValue(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <input
            type="text"
            placeholder="Descrição (opcional)"
            value={adjustDesc}
            onChange={(e) => setAdjustDesc(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdjust}
              className="flex-1 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground"
            >
              Salvar Ajuste
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceCard;