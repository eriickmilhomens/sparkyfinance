import { useState } from "react";
import { handleBRLChange, parseBRLInput } from "@/lib/brlInput";
import { X, Receipt, Wifi, ShoppingCart, UtensilsCrossed, CreditCard, ChevronUp, ChevronDown, ArrowLeftRight, Sparkles, Heart, MoreHorizontal, CalendarDays, Repeat, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useDockVisibility } from "@/hooks/useDockVisibility";

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  type?: "expense" | "income";
}

const shortcuts = [
  { label: "Contas", icon: Receipt, color: "bg-warning/20 text-warning" },
  { label: "Internet", icon: Wifi, color: "bg-info/20 text-info" },
  { label: "Mercado", icon: ShoppingCart, color: "bg-success/20 text-success" },
  { label: "Delivery", icon: UtensilsCrossed, color: "bg-destructive/20 text-destructive" },
  { label: "Cartão", icon: CreditCard, color: "bg-purple-500/20 text-purple-400" },
  { label: "Transferência", icon: ArrowLeftRight, color: "bg-primary/20 text-primary" },
  { label: "Cuidados Pessoais", icon: Heart, color: "bg-pink-500/20 text-pink-400" },
  { label: "Outros", icon: MoreHorizontal, color: "bg-accent/30 text-accent-foreground" },
];

const priorities = [
  { id: "P1", label: "Essencial", desc: "Aluguel, contas básicas" },
  { id: "P2", label: "Importante", desc: "Mercado, transporte" },
  { id: "P3", label: "Desejável", desc: "Lazer, assinaturas" },
  { id: "P4", label: "Opcional", desc: "Compras não essenciais" },
];

const CARDS_KEY = "sparky-credit-cards";

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

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const AddExpenseModal = ({ open, onClose, type = "expense" }: AddExpenseModalProps) => {
  const now = new Date();
  useDockVisibility(open);
  const [selectedPriority, setSelectedPriority] = useState("P3");
  const [recurring, setRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState(String(now.getDate()));
  const [split, setSplit] = useState(false);
  const [splitPeople, setSplitPeople] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState("");
  const [installments, setInstallments] = useState(1);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("R$ 0,00");
  const [expDay, setExpDay] = useState(String(now.getDate()));
  const [expMonth, setExpMonth] = useState(String(now.getMonth()));
  const [expYear, setExpYear] = useState(String(now.getFullYear()));

  const { data, updateData } = useFinancialData();

  const cards = (() => {
    try { return JSON.parse(localStorage.getItem(CARDS_KEY) || "[]"); } catch { return []; }
  })();

  const selectedCard = cards.find((c: any) => c.id === selectedCardId);

  const isIncome = type === "income";
  const isCardCategory = selectedCategory === "Cartão";
  const isOthers = selectedCategory === "Outros";
  const title = isIncome ? "Adicionar Receita" : "Adicionar Despesa";
  const saveLabel = isIncome ? "Salvar Receita • +10 pts" : isCardCategory ? "Lançar na Fatura • +10 pts" : "Salvar Despesa • +10 pts";

  const finalCategory = isOthers && customCategory.trim() ? customCategory.trim() : selectedCategory || "Outros";

  const handleSave = () => {
    if (!name.trim()) { toast.error("Preencha o nome"); return; }
    const numValue = parseBRLInput(value);
    if (numValue <= 0) { toast.error("Informe um valor válido"); return; }

    // If split, divide by number of people
    const finalValue = split ? numValue / splitPeople : numValue;

    const expDate = new Date(parseInt(expYear), parseInt(expMonth), parseInt(expDay) || 1);

    const newTransaction = {
      id: crypto.randomUUID(),
      date: expDate.toISOString(),
      description: name.trim() + (split ? ` (÷${splitPeople})` : "") + (recurring ? " 🔄" : ""),
      amount: finalValue,
      type: (isIncome ? "income" : "expense") as "income" | "expense",
      category: finalCategory,
      cardId: isCardCategory ? selectedCardId : undefined,
    };

    const newTransactions = [newTransaction, ...data.transactions];
    if (isIncome) {
      updateData({ income: data.income + finalValue, balance: data.balance + finalValue, transactions: newTransactions });
    } else {
      updateData({ expenses: data.expenses + finalValue, balance: data.balance - finalValue, transactions: newTransactions });
    }

    if (isCardCategory && selectedCardId) {
      try {
        const allCards = JSON.parse(localStorage.getItem(CARDS_KEY) || "[]");
        const perInstallment = finalValue / installments;
        const updated = allCards.map((c: any) => {
          if (c.id === selectedCardId) {
            const newTx = { id: crypto.randomUUID(), desc: name.trim(), value: perInstallment, date: expDate.toLocaleDateString("pt-BR"), category: "Cartão" };
            return {
              ...c, usedAmount: (c.usedAmount || 0) + perInstallment, invoiceAmount: (c.invoiceAmount || 0) + perInstallment,
              transactions: [newTx, ...(c.transactions || [])],
              futureInvoices: installments > 1
                ? Array.from({ length: installments - 1 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() + i + 1); return { month: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }), amount: perInstallment }; })
                : c.futureInvoices || [],
            };
          }
          return c;
        });
        localStorage.setItem(CARDS_KEY, JSON.stringify(updated));
      } catch {}
    }

    // Save recurring config
    if (recurring) {
      try {
        const recurrings = JSON.parse(localStorage.getItem("sparky-recurrings") || "[]");
        recurrings.push({ name: name.trim(), amount: finalValue, type: isIncome ? "income" : "expense", category: finalCategory, day: parseInt(recurringDay) || now.getDate() });
        localStorage.setItem("sparky-recurrings", JSON.stringify(recurrings));
      } catch {}
    }

    toast.success(isIncome ? "Receita salva com sucesso!" : isCardCategory ? "Lançado na fatura!" : "Despesa salva com sucesso!");
    setName(""); setValue("R$ 0,00"); setSelectedCategory(null); setCustomCategory(""); setInstallments(1); setSelectedCardId(""); setRecurring(false); setSplit(false); setSplitPeople(2);
    setExpDay(String(now.getDate())); setExpMonth(String(now.getMonth())); setExpYear(String(now.getFullYear()));
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
                <button key={s.label} onClick={() => setSelectedCategory(selectedCategory === s.label ? null : s.label)}
                  className={cn("flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all active:scale-95",
                    selectedCategory === s.label ? "ring-2 ring-primary " + s.color : s.color)}>
                  <Icon size={20} />
                  <span className="text-[10px] font-medium leading-tight text-center">{s.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {isOthers && (
          <div className="mb-4">
            <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Nome da categoria personalizada</label>
            <input type="text" placeholder="Ex: Academia, Pet, Educação..." value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary transition-all" />
          </div>
        )}

        <div className="space-y-3 mb-5">
          <input type="text" placeholder={isIncome ? "Fonte da receita" : "Descrição da despesa"} value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary transition-all" />
          <input type="text" inputMode="decimal" placeholder="Digite o valor (R$)" value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d.,]/g, ""))}
            className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary transition-all tabular-nums" />
        </div>

        {/* Date picker */}
        {!isIncome && (
          <div className="mb-5">
            <label className="text-[10px] text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
              <CalendarDays size={12} /> Data do lançamento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] text-muted-foreground font-medium mb-1 block">Dia</label>
                <div className="relative">
                  <select value={expDay} onChange={(e) => setExpDay(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-medium text-foreground outline-none focus:border-primary transition-all appearance-none cursor-pointer">
                    {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, "0")}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground font-medium mb-1 block">Mês</label>
                <div className="relative">
                  <select value={expMonth} onChange={(e) => setExpMonth(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-medium text-foreground outline-none focus:border-primary transition-all appearance-none cursor-pointer">
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground font-medium mb-1 block">Ano</label>
                <div className="relative">
                  <select value={expYear} onChange={(e) => setExpYear(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-medium text-foreground outline-none focus:border-primary transition-all appearance-none cursor-pointer">
                    {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {isCardCategory && (
          <div className="space-y-3 mb-5 card-zelo !bg-purple-500/5 !border-purple-500/20">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <CreditCard size={14} className="text-purple-400" /> Opções do Cartão
            </p>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium mb-1.5 block">Cartão</label>
              <button onClick={() => setShowCardPicker(!showCardPicker)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-left flex items-center justify-between transition-all hover:border-primary/50 active:scale-[0.99]">
                {selectedCard ? (
                  <div className="flex items-center gap-2.5">
                    <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center text-white text-[9px] font-bold", getBankColor(selectedCard.bankName))}>{getBankAbbr(selectedCard.bankName)}</div>
                    <div><p className="text-xs font-medium">{selectedCard.cardName}</p><p className="text-[9px] text-muted-foreground">{selectedCard.bankName}</p></div>
                  </div>
                ) : <span className="text-muted-foreground text-xs">Selecione o cartão</span>}
                <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", showCardPicker && "rotate-180")} />
              </button>
              {showCardPicker && (
                <div className="mt-2 rounded-xl border border-border bg-card overflow-hidden shadow-lg">
                  {cards.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">Nenhum cartão cadastrado</p> : (
                    cards.map((c: any) => (
                      <button key={c.id} onClick={() => { setSelectedCardId(c.id); setShowCardPicker(false); }}
                        className={cn("w-full flex items-center gap-3 px-3 py-3 text-left transition-all hover:bg-primary/5 active:scale-[0.99] border-b border-border/50 last:border-0",
                          selectedCardId === c.id && "bg-primary/10")}>
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-white text-[9px] font-bold", getBankColor(c.bankName))}>{getBankAbbr(c.bankName)}</div>
                        <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{c.cardName}</p><p className="text-[9px] text-muted-foreground">{c.bankName} • {c.cardType || "Crédito"}</p></div>
                        <p className="text-[10px] text-muted-foreground tabular-nums">{(c.limit - (c.usedAmount || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Parcelas</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setInstallments(Math.max(1, installments - 1))}
                  className="h-9 w-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all">
                  <ChevronDown size={16} />
                </button>
                <div className="flex-1 rounded-xl border-2 border-primary bg-primary/5 py-2 text-center text-sm font-bold tabular-nums">{installments}x</div>
                <button onClick={() => setInstallments(Math.min(48, installments + 1))}
                  className="h-9 w-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all">
                  <ChevronUp size={16} />
                </button>
              </div>
              {installments > 1 && (
                <p className="text-[10px] text-muted-foreground mt-1.5">Compra será dividida em {installments}x nas próximas faturas</p>
              )}
            </div>
          </div>
        )}

        {!isIncome && (
          <>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Prioridade</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {priorities.map((p) => (
                <button key={p.id} onClick={() => setSelectedPriority(p.id)}
                  className={cn("rounded-xl border p-3 text-left transition-all active:scale-[0.97]",
                    selectedPriority === p.id ? "border-primary bg-primary/10" : "border-border bg-muted/30")}>
                  <p className="text-xs font-bold">{p.id} – {p.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Recurring & Split - Modern Cards */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <button onClick={() => setRecurring(!recurring)}
            className={cn("rounded-xl border p-3 text-left transition-all active:scale-[0.97] flex items-center gap-2.5",
              recurring ? "border-primary bg-primary/10" : "border-border bg-muted/30")}>
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", recurring ? "bg-primary/20" : "bg-muted")}>
              <Repeat size={14} className={recurring ? "text-primary" : "text-muted-foreground"} />
            </div>
            <div>
              <p className="text-xs font-bold">{isIncome ? "Recorrente" : "Recorrente"}</p>
              <p className="text-[9px] text-muted-foreground">Todo mês</p>
            </div>
          </button>
          {!isIncome && (
            <button onClick={() => setSplit(!split)}
              className={cn("rounded-xl border p-3 text-left transition-all active:scale-[0.97] flex items-center gap-2.5",
                split ? "border-primary bg-primary/10" : "border-border bg-muted/30")}>
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", split ? "bg-primary/20" : "bg-muted")}>
                <Users size={14} className={split ? "text-primary" : "text-muted-foreground"} />
              </div>
              <div>
                <p className="text-xs font-bold">Dividir</p>
                <p className="text-[9px] text-muted-foreground">Entre pessoas</p>
              </div>
            </button>
          )}
        </div>

        {/* Recurring day selector */}
        {recurring && (
          <div className="mb-5 card-zelo !bg-primary/5 !border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Repeat size={14} className="text-primary" />
              <p className="text-xs font-semibold">Repetir todo mês no dia</p>
            </div>
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {[1, 5, 10, 15, 20, 25, 28].map(d => (
                <button key={d} onClick={() => setRecurringDay(String(d))}
                  className={cn("rounded-xl py-2.5 text-xs font-semibold transition-all border",
                    parseInt(recurringDay) === d ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-muted-foreground hover:border-primary/40")}>
                  {String(d).padStart(2, "0")}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays size={12} className="text-muted-foreground shrink-0" />
              <input type="text" inputMode="numeric" value={recurringDay}
                onChange={(e) => setRecurringDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="Dia"
                className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-center outline-none focus:border-primary transition-all" />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">de cada mês</span>
            </div>
          </div>
        )}

        {/* Split people selector */}
        {split && !isIncome && (
          <div className="mb-5 card-zelo !bg-primary/5 !border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-primary" />
              <p className="text-xs font-semibold">Dividir entre</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSplitPeople(Math.max(2, splitPeople - 1))}
                className="h-9 w-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95">
                <ChevronDown size={16} />
              </button>
              <div className="flex-1 rounded-xl border-2 border-primary bg-primary/5 py-2 text-center text-sm font-bold tabular-nums">{splitPeople} pessoas</div>
              <button onClick={() => setSplitPeople(Math.min(20, splitPeople + 1))}
                className="h-9 w-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95">
                <ChevronUp size={16} />
              </button>
            </div>
            {value && (
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Cada pessoa paga: {(parseFloat(value.replace(/\./g, "").replace(",", ".")) / splitPeople || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            )}
          </div>
        )}

        <button onClick={handleSave}
          className={cn("w-full rounded-xl py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] pulse-glow",
            isIncome ? "bg-success" : isCardCategory ? "bg-purple-600" : "bg-primary")}>
          {saveLabel}
        </button>
      </div>
    </div>
  );
};

export default AddExpenseModal;
