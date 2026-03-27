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
      {/* Accent glow */}
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/8 blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-1.5">
        <span className="text-label">Saldo Disponível</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setEditing(!editing)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95 transition-all" title="Ajustar saldo">
            <Pencil size={13} />
          </button>
          <button onClick={() => setVisible(!visible)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95 transition-all">
            {visible ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
        </div>
      </div>
      <p className="text-3xl font-display font-extrabold tracking-tight tabular-nums">
        {visible ? fmt(available) : "••••••"}
      </p>
      <div className="mt-2.5">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Receitas: <span className="text-success font-medium">{visible ? fmt(data.income) : "••••••"}</span></span>
          <span className="text-border/60">•</span>
          <span>Despesas: <span className="text-destructive font-medium">{visible ? fmt(data.expenses) : "••••••"}</span></span>
        </div>
      </div>

      {editing && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-2.5 fade-in-up">
          <div className="flex gap-1.5">
            <button onClick={() => setAdjustType("add")}
              className={`flex-1 flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-medium transition-all ${adjustType === "add" ? "bg-success/12 text-success border border-success/20" : "bg-muted text-muted-foreground"}`}>
              <Plus size={12} /> Adicionar
            </button>
            <button onClick={() => setAdjustType("sub")}
              className={`flex-1 flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-medium transition-all ${adjustType === "sub" ? "bg-destructive/12 text-destructive border border-destructive/20" : "bg-muted text-muted-foreground"}`}>
              <Minus size={12} /> Subtrair
            </button>
          </div>
          <input type="text" inputMode="decimal" placeholder="Digite o valor" value={adjustValue}
            onChange={(e) => setAdjustValue(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          <input type="text" placeholder="Descrição (opcional)" value={adjustDesc}
            onChange={(e) => setAdjustDesc(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex-1 rounded-xl border border-border py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/30 transition-all">Cancelar</button>
            <button onClick={handleAdjust} className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-display font-bold text-primary-foreground shadow-sm shadow-primary/15">Salvar Ajuste</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceCard;
