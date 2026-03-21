import { useState, useEffect } from "react";
import { X, Zap, Droplets, Wifi, Flame, ShoppingCart, UtensilsCrossed, CreditCard, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  { label: "Cartão", icon: CreditCard, color: "bg-purple-500/20 text-purple-400" },
];

const priorities = [
  { id: "P1", label: "Essencial", desc: "Aluguel, contas básicas" },
  { id: "P2", label: "Importante", desc: "Mercado, transporte" },
  { id: "P3", label: "Desejável", desc: "Lazer, assinaturas" },
  { id: "P4", label: "Opcional", desc: "Compras não essenciais" },
];

const CARDS_KEY = "sparky-credit-cards";
const TRANSACTIONS_KEY = "sparky-transactions";
const BALANCE_KEY = "sparky-balance";

const BANK_COLORS: Record<string, string> = {
  nubank: "bg-purple-600", inter: "bg-orange-500", itaú: "bg-orange-600", itau: "bg-orange-600",
  bradesco: "bg-red-600", santander: "bg-red-700", "banco do brasil": "bg-yellow-500", bb: "bg-yellow-500",
  caixa: "bg-blue-600", c6: "bg-gray-700", picpay: "bg-green-400", "mercado pago": "bg-blue-400",
};

const getBankColor = (name: string) => {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(BANK_COLORS)) {
    if (lower.includes(key)) return val;
  }
  return "bg-primary";
};

const getBankAbbr = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("nubank")) return "NU";
  if (lower.includes("inter")) return "IN";
  if (lower.includes("itaú") || lower.includes("itau")) return "IT";
  if (lower.includes("bradesco")) return "BR";
  if (lower.includes("santander")) return "SA";
  if (lower.includes("banco do brasil") || lower.includes("bb")) return "BB";
  if (lower.includes("caixa")) return "CX";
  if (lower.includes("c6")) return "C6";
  return name.slice(0, 2).toUpperCase();
};

const AddExpenseModal = ({ open, onClose, type = "expense" }: AddExpenseModalProps) => {
  const [selectedPriority, setSelectedPriority] = useState("P3");
  const [recurring, setRecurring] = useState(false);
  const [split, setSplit] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [installments, setInstallments] = useState(1);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");

  const cards = (() => {
    try { return JSON.parse(localStorage.getItem(CARDS_KEY) || "[]"); } catch { return []; }
  })();

  const selectedCard = cards.find((c: any) => c.id === selectedCardId);

  const isIncome = type === "income";
  const isCardCategory = selectedCategory === "Cartão";
  const title = isIncome ? "Adicionar Receita" : "Adicionar Despesa";
  const saveLabel = isIncome ? "Salvar Receita • +10 pts" : isCardCategory ? "Lançar na Fatura • +10 pts" : "Salvar Despesa • +10 pts";

  const updateBalance = (amount: number, isExpense: boolean) => {
    try {
      const bal = JSON.parse(localStorage.getItem(BALANCE_KEY) || "{}");
      if (isExpense) {
        bal.expenses = (bal.expenses || 3252.50) + amount;
        bal.available = (bal.available || 3247.50) - amount;
        bal.toPay = (bal.toPay || 1584.50) + amount;
      } else {
        bal.income = (bal.income || 6500) + amount;
        bal.real = (bal.real || 4832) + amount;
        bal.available = (bal.available || 3247.50) + amount;
      }
      localStorage.setItem(BALANCE_KEY, JSON.stringify(bal));
      window.dispatchEvent(new Event("sparky-balance-update"));
    } catch {}
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Preencha o nome");
      return;
    }
    const numValue = parseFloat(value.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
    if (numValue <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    const transaction = {
      id: crypto.randomUUID(),
      name: name.trim(),
      value: numValue,
      type: isIncome ? "income" : "expense",
      category: selectedCategory || "Outros",
      priority: isIncome ? null : selectedPriority,
      recurring, split,
      installments: isCardCategory ? installments : 1,
      cardId: isCardCategory ? selectedCardId : null,
      date: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || "[]");
      existing.unshift(transaction);
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(existing));
    } catch {}

    // Update balance
    updateBalance(numValue, !isIncome);

    if (isCardCategory && selectedCardId) {
      try {
        const allCards = JSON.parse(localStorage.getItem(CARDS_KEY) || "[]");
        const perInstallment = numValue / installments;
        const updated = allCards.map((c: any) => {
          if (c.id === selectedCardId) {
            const newTx = { id: crypto.randomUUID(), desc: name.trim(), value: perInstallment, date: new Date().toLocaleDateString("pt-BR"), category: "Cartão" };
            return {
              ...c,
              usedAmount: (c.usedAmount || 0) + perInstallment,
              invoiceAmount: (c.invoiceAmount || 0) + perInstallment,
              transactions: [newTx, ...(c.transactions || [])],
              futureInvoices: installments > 1
                ? Array.from({ length: installments - 1 }, (_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + i + 1);
                    return { month: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }), amount: perInstallment };
                  })
                : c.futureInvoices || [],
            };
          }
          return c;
        });
        localStorage.setItem(CARDS_KEY, JSON.stringify(updated));
      } catch {}
    }

    toast.success(isIncome ? "Receita salva com sucesso!" : isCardCategory ? "Lançado na fatura!" : "Despesa salva com sucesso!");
    setName(""); setValue(""); setSelectedCategory(null); setInstallments(1); setSelectedCardId(""); setRecurring(false); setSplit(false);
    onClose();
  };

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

        {!isIncome && (
          <div className="grid grid-cols-4 gap-2 mb-5">
            {shortcuts.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  onClick={() => setSelectedCategory(selectedCategory === s.label ? null : s.label)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all active:scale-95",
                    selectedCategory === s.label ? "ring-2 ring-primary " + s.color : s.color
                  )}
                >
                  <Icon size={20} />
                  <span className="text-[11px] font-medium">{s.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="space-y-3 mb-5">
          <input
            type="text"
            placeholder={isIncome ? "Fonte da receita" : "Nome da categoria"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Valor (R$)"
            value={value}
            onChange={(e) => {
              const nums = e.target.value.replace(/\D/g, "");
              const val = (parseInt(nums) || 0) / 100;
              setValue(val > 0 ? val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "");
            }}
            className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all tabular-nums"
          />
        </div>

        {isCardCategory && (
          <div className="space-y-3 mb-5 card-zelo !bg-purple-500/5 !border-purple-500/20">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <CreditCard size={14} className="text-purple-400" /> Opções do Cartão
            </p>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium mb-1.5 block">Cartão</label>
              {/* Custom card picker */}
              <button
                onClick={() => setShowCardPicker(!showCardPicker)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-left flex items-center justify-between transition-all hover:border-primary/50 active:scale-[0.99]"
              >
                {selectedCard ? (
                  <div className="flex items-center gap-2.5">
                    <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center text-white text-[9px] font-bold", getBankColor(selectedCard.bankName))}>
                      {getBankAbbr(selectedCard.bankName)}
                    </div>
                    <div>
                      <p className="text-xs font-medium">{selectedCard.cardName}</p>
                      <p className="text-[9px] text-muted-foreground">{selectedCard.bankName}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">Selecione o cartão</span>
                )}
                <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", showCardPicker && "rotate-180")} />
              </button>
              {showCardPicker && (
                <div className="mt-2 rounded-xl border border-border bg-card overflow-hidden shadow-lg">
                  {cards.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum cartão cadastrado</p>
                  ) : (
                    cards.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedCardId(c.id); setShowCardPicker(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 text-left transition-all hover:bg-primary/5 active:scale-[0.99] border-b border-border/50 last:border-0",
                          selectedCardId === c.id && "bg-primary/10"
                        )}
                      >
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-white text-[9px] font-bold", getBankColor(c.bankName))}>
                          {getBankAbbr(c.bankName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{c.cardName}</p>
                          <p className="text-[9px] text-muted-foreground">{c.bankName} • {c.cardType || "Crédito"}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground tabular-nums">
                          {(c.limit - (c.usedAmount || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Parcelas</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInstallments(Math.max(1, installments - 1))}
                  className="h-9 w-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary active:scale-95 transition-all"
                >
                  <ChevronDown size={16} />
                </button>
                <div className="flex-1 rounded-xl border-2 border-primary bg-primary/5 py-2 text-center text-sm font-bold tabular-nums">
                  {installments}x
                </div>
                <button
                  onClick={() => setInstallments(Math.min(48, installments + 1))}
                  className="h-9 w-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary active:scale-95 transition-all"
                >
                  <ChevronUp size={16} />
                </button>
              </div>
              {installments > 1 && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Compra será dividida em {installments}x nas próximas faturas
                </p>
              )}
            </div>
          </div>
        )}

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

        <div className="space-y-3 mb-6">
          <label className="flex items-center justify-between">
            <span className="text-sm">{isIncome ? "Receita Recorrente" : "Despesa Recorrente"}</span>
            <button
              onClick={() => setRecurring(!recurring)}
              className={cn("h-6 w-11 rounded-full transition-colors duration-200", recurring ? "bg-primary" : "bg-muted")}
            >
              <div className={cn("h-5 w-5 rounded-full bg-foreground transition-transform duration-200 ml-0.5", recurring && "translate-x-5")} />
            </button>
          </label>
          {!isIncome && (
            <label className="flex items-center justify-between">
              <span className="text-sm">Dividir despesa</span>
              <button
                onClick={() => setSplit(!split)}
                className={cn("h-6 w-11 rounded-full transition-colors duration-200", split ? "bg-primary" : "bg-muted")}
              >
                <div className={cn("h-5 w-5 rounded-full bg-foreground transition-transform duration-200 ml-0.5", split && "translate-x-5")} />
              </button>
            </label>
          )}
        </div>

        <button
          onClick={handleSave}
          className={cn(
            "w-full rounded-xl py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] pulse-glow",
            isIncome ? "bg-success" : isCardCategory ? "bg-purple-600" : "bg-primary"
          )}
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
};

export default AddExpenseModal;
