import { useState } from "react";
import { X, Zap, Droplets, Wifi, Flame, ShoppingCart, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  type?: "expense" | "income";
}

const shortcuts = [
  { label: "Luz", icon: Zap, color: "bg-warning/20 text-warning" },
  { label: "Água", icon: Droplets, color: "bg-primary/20 text-primary" },
  { label: "Internet", icon: Wifi, color: "bg-info/20 text-info" },
  { label: "Gás", icon: Flame, color: "bg-orange-500/20 text-orange-400" },
  { label: "Mercado", icon: ShoppingCart, color: "bg-success/20 text-success" },
  { label: "Delivery", icon: UtensilsCrossed, color: "bg-destructive/20 text-destructive" },
];

const priorities = [
  { id: "P1", label: "Essencial", desc: "Aluguel, contas básicas" },
  { id: "P2", label: "Importante", desc: "Mercado, transporte" },
  { id: "P3", label: "Desejável", desc: "Lazer, assinaturas" },
  { id: "P4", label: "Opcional", desc: "Compras não essenciais" },
];

const AddExpenseModal = ({ open, onClose, type = "expense" }: AddExpenseModalProps) => {
  const [selectedPriority, setSelectedPriority] = useState("P3");
  const [recurring, setRecurring] = useState(false);
  const [split, setSplit] = useState(false);

  const isIncome = type === "income";
  const title = isIncome ? "Adicionar Receita" : "Adicionar Despesa";
  const saveLabel = isIncome ? "Salvar Receita • +10 pts" : "Salvar Despesa • +10 pts";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-slide-up rounded-t-3xl bg-card border-t border-border p-5 pb-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Quick shortcuts - only for expenses */}
        {!isIncome && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {shortcuts.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  className={cn("flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all active:scale-95", s.color)}
                >
                  <Icon size={20} />
                  <span className="text-[11px] font-medium">{s.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-3 mb-5">
          <input
            type="text"
            placeholder={isIncome ? "Fonte da receita" : "Nome da categoria"}
            className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          <input
            type="text"
            placeholder="Valor (R$)"
            className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all tabular-nums"
          />
        </div>

        {/* Priority - only for expenses */}
        {!isIncome && (
          <>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Prioridade</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {priorities.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPriority(p.id)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all active:scale-[0.97]",
                    selectedPriority === p.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/30"
                  )}
                >
                  <p className="text-xs font-bold">{p.id} – {p.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Toggles */}
        <div className="space-y-3 mb-6">
          <label className="flex items-center justify-between">
            <span className="text-sm">{isIncome ? "Receita Recorrente" : "Despesa Recorrente"}</span>
            <button
              onClick={() => setRecurring(!recurring)}
              className={cn(
                "h-6 w-11 rounded-full transition-colors duration-200",
                recurring ? "bg-primary" : "bg-muted"
              )}
            >
              <div className={cn(
                "h-5 w-5 rounded-full bg-foreground transition-transform duration-200 ml-0.5",
                recurring && "translate-x-5"
              )} />
            </button>
          </label>
          {!isIncome && (
            <label className="flex items-center justify-between">
              <span className="text-sm">Dividir despesa</span>
              <button
                onClick={() => setSplit(!split)}
                className={cn(
                  "h-6 w-11 rounded-full transition-colors duration-200",
                  split ? "bg-primary" : "bg-muted"
                )}
              >
                <div className={cn(
                  "h-5 w-5 rounded-full bg-foreground transition-transform duration-200 ml-0.5",
                  split && "translate-x-5"
                )} />
              </button>
            </label>
          )}
        </div>

        {/* Save */}
        <button className={cn(
          "w-full rounded-xl py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] pulse-glow",
          isIncome ? "bg-success" : "bg-primary"
        )}>
          {saveLabel}
        </button>
      </div>
    </div>
  );
};

export default AddExpenseModal;
