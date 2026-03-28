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
  const { available, data, addTransaction } = useFinancialData();

  useEffect(() => {
    onVisibilityChange?.(visible);
  }, [visible, onVisibilityChange]);

  const handleAdjust = async () => {
    const raw = adjustValue.replace(/\./g, "").replace(",", ".");
    const val = parseFloat(raw);
    if (isNaN(val) || val <= 0) {
      toast.error("Digite um valor válido");
      return;
    }
    try {
      await addTransaction({
        date: new Date().toISOString(),
        description: adjustDesc || "Ajuste de saldo",
        amount: val,
        type: adjustType === "add" ? "income" : "expense",
        category: "Ajuste",
      });
      toast.success(`Saldo ajustado: ${adjustType === "add" ? "+" : "-"}${fmt(val)}`);
      setAdjustValue("");
      setAdjustDesc("");
      setEditing(false);
    } catch {
      toast.error("Erro ao ajustar saldo");
    }
  };

  return (
    <div className="card-zelo fade-in-up relative overflow-hidden">
      {/* Gradient accent orb */}
      <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-br from-primary/12 to-primary/4 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-primary/6 blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-2 relative z-10">
        <span className="text-label">Saldo Disponível</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setEditing(!editing)} className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95 transition-all duration-300" title="Ajustar saldo">
            <Pencil size={13} />
          </button>
          <button onClick={() => setVisible(!visible)} className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95 transition-all duration-300">
            {visible ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
        </div>
      </div>
      <p className="text-3xl font-display font-extrabold tracking-tight tabular-nums relative z-10">
        {visible ? fmt(available) : "••••••"}
      </p>
      <div className="mt-3 relative z-10">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Receitas: <span className="text-success font-semibold tabular-nums">{visible ? fmt(data.income) : "••••••"}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
            Despesas: <span className="text-destructive font-semibold tabular-nums">{visible ? fmt(data.expenses) : "••••••"}</span>
          </span>
        </div>
      </div>

      {editing && (
        <div className="mt-4 pt-4 border-t border-border/40 space-y-3 fade-in-up relative z-10">
          <div className="flex gap-2">
            <button onClick={() => setAdjustType("add")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-semibold transition-all duration-300 ${adjustType === "add" ? "bg-success/12 text-success border border-success/25" : "bg-muted/50 text-muted-foreground border border-transparent"}`}>
              <Plus size={13} /> Adicionar
            </button>
            <button onClick={() => setAdjustType("sub")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-semibold transition-all duration-300 ${adjustType === "sub" ? "bg-destructive/12 text-destructive border border-destructive/25" : "bg-muted/50 text-muted-foreground border border-transparent"}`}>
              <Minus size={13} /> Subtrair
            </button>
          </div>
          <input type="text" inputMode="decimal" placeholder="Digite o valor" value={adjustValue}
            onChange={(e) => setAdjustValue(e.target.value)}
            className="w-full rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 tabular-nums" />
          <input type="text" placeholder="Descrição (opcional)" value={adjustDesc}
            onChange={(e) => setAdjustDesc(e.target.value)}
            className="w-full rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300" />
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex-1 rounded-2xl border border-border py-3 text-xs font-medium text-muted-foreground hover:bg-muted/30 transition-all duration-300">Cancelar</button>
            <button onClick={handleAdjust} className="flex-1 rounded-2xl bg-primary py-3 text-xs font-display font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 active:scale-[0.98]">Salvar Ajuste</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceCard;
