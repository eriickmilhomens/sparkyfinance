import { useState } from "react";
import { handleBRLChange } from "@/lib/brlInput";
import { X, ArrowLeft, Plus, CreditCard, ChevronRight, Receipt, Calendar, DollarSign, Wallet, Building2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDockVisibility } from "@/hooks/useDockVisibility";
import { usePoints } from "@/hooks/usePoints";

const BANK_DATA: Record<string, { color: string; abbr: string }> = {
  "nubank": { color: "bg-purple-600", abbr: "NU" },
  "inter": { color: "bg-orange-500", abbr: "IN" },
  "itaú": { color: "bg-orange-600", abbr: "IT" },
  "itau": { color: "bg-orange-600", abbr: "IT" },
  "bradesco": { color: "bg-red-600", abbr: "BR" },
  "santander": { color: "bg-red-700", abbr: "SA" },
  "banco do brasil": { color: "bg-yellow-500", abbr: "BB" },
  "bb": { color: "bg-yellow-500", abbr: "BB" },
  "caixa": { color: "bg-blue-600", abbr: "CX" },
  "c6": { color: "bg-gray-900", abbr: "C6" },
  "c6 bank": { color: "bg-gray-900", abbr: "C6" },
  "pan": { color: "bg-blue-500", abbr: "PN" },
  "neon": { color: "bg-cyan-500", abbr: "NE" },
  "next": { color: "bg-green-500", abbr: "NX" },
  "picpay": { color: "bg-green-400", abbr: "PP" },
  "mercado pago": { color: "bg-blue-400", abbr: "MP" },
  "btg": { color: "bg-blue-900", abbr: "BT" },
  "xp": { color: "bg-gray-800", abbr: "XP" },
};

const BANK_OPTIONS = [
  { name: "Nubank", abbr: "NU", color: "bg-purple-600" },
  { name: "Itaú", abbr: "IT", color: "bg-orange-600" },
  { name: "Bradesco", abbr: "BR", color: "bg-red-600" },
  { name: "Inter", abbr: "IN", color: "bg-orange-500" },
  { name: "BB", abbr: "BB", color: "bg-yellow-500" },
  { name: "Caixa", abbr: "CX", color: "bg-blue-600" },
  { name: "Santander", abbr: "SA", color: "bg-red-700" },
  { name: "C6 Bank", abbr: "C6", color: "bg-gray-900" },
  { name: "BTG", abbr: "BT", color: "bg-blue-900" },
  { name: "XP", abbr: "XP", color: "bg-gray-800" },
  { name: "PicPay", abbr: "PP", color: "bg-green-400" },
  { name: "Mercado Pago", abbr: "MP", color: "bg-blue-400" },
];

const FLAG_OPTIONS = [
  { name: "Visa", color: "bg-blue-600" },
  { name: "Mastercard", color: "bg-red-500" },
  { name: "Elo", color: "bg-gray-700" },
  { name: "Amex", color: "bg-blue-500" },
  { name: "Hipercard", color: "bg-red-600" },
  { name: "Outra", color: "bg-muted-foreground" },
];

const CARD_TYPES = ["Crédito", "Débito", "Múltiplo"];

const RANDOM_COLORS = [
  "bg-emerald-600", "bg-violet-600", "bg-rose-600", "bg-amber-600",
  "bg-cyan-600", "bg-indigo-600", "bg-teal-600", "bg-fuchsia-600",
  "bg-lime-600", "bg-pink-600",
];

const getRandomColor = () => RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];

const capitalize = (s: string) => s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

const getBankInfo = (name: string) => {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(BANK_DATA)) {
    if (lower.includes(key)) return val;
  }
  return { color: "bg-muted-foreground", abbr: name.slice(0, 2).toUpperCase() };
};

interface CardTransaction {
  id: string; desc: string; value: number; date: string; category: string;
}

interface CreditCardData {
  id: string; bankName: string; cardName: string; cardType?: string; cardFlag?: string;
  limit: number; usedAmount: number; invoiceAmount: number;
  dueDay: number; closeDay: number;
  transactions: CardTransaction[];
  paidInvoices: { month: string; amount: number; paidAt: string }[];
  futureInvoices: { month: string; amount: number }[];
}

const STORAGE_KEY = "sparky-credit-cards";
const loadCards = (): CreditCardData[] => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } };
const saveCards = (cards: CreditCardData[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

interface Props { open: boolean; onClose: () => void; }

const CreditCardManager = ({ open, onClose }: Props) => {
  const [cards, setCards] = useState<CreditCardData[]>(loadCards);
  useDockVisibility(open);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payFull, setPayFull] = useState(true);

  const [newBank, setNewBank] = useState("");
  const [customBankName, setCustomBankName] = useState("");
  const [showCustomBank, setShowCustomBank] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [newDueDay, setNewDueDay] = useState("10");
  const [newCloseDay, setNewCloseDay] = useState("3");
  const [newType, setNewType] = useState("Crédito");
  const [newFlag, setNewFlag] = useState("");

  const update = (updated: CreditCardData[]) => { setCards(updated); saveCards(updated); };

  const handleAddCard = () => {
    const rawBankName = showCustomBank ? customBankName.trim() : newBank.trim();
    if (!rawBankName || !newName.trim()) {
      toast.error(!rawBankName ? "Selecione ou digite o banco" : "Preencha o nome do cartão");
      return;
    }
    const bankName = capitalize(rawBankName);
    const limit = parseFloat(newLimit.replace(/\D/g, "")) / 100 || 0;

    // For custom banks not in BANK_DATA, assign a random color
    const isKnown = Object.keys(BANK_DATA).some(k => bankName.toLowerCase().includes(k));
    if (!isKnown) {
      const color = getRandomColor();
      const abbr = bankName.slice(0, 2).toUpperCase();
      BANK_DATA[bankName.toLowerCase()] = { color, abbr };
    }

    const card: CreditCardData = {
      id: crypto.randomUUID(), bankName, cardName: capitalize(newName.trim()),
      cardType: newType, cardFlag: newFlag,
      limit, usedAmount: 0, invoiceAmount: 0,
      dueDay: parseInt(newDueDay) || 10, closeDay: parseInt(newCloseDay) || 3,
      transactions: [],
      paidInvoices: [], futureInvoices: [],
    };
    update([...cards, card]);
    setNewBank(""); setCustomBankName(""); setShowCustomBank(false); setNewName(""); setNewLimit(""); setNewDueDay("10"); setNewCloseDay("3"); setNewType("Crédito"); setNewFlag("");
    setShowAdd(false);
    toast.success("Cartão salvo com sucesso!");
  };

  const handlePayInvoice = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card || card.invoiceAmount <= 0) {
      toast.error("Não há fatura a pagar.");
      setShowPayment(false);
      return;
    }
    const amount = payFull ? card.invoiceAmount : parseFloat(payAmount.replace(/\D/g, "")) / 100;
    if (!amount || amount <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    if (amount > card.invoiceAmount) {
      toast.error("Valor maior que a fatura.");
      return;
    }
    const remaining = Math.max(0, card.invoiceAmount - amount);
    update(cards.map(c => c.id === cardId ? {
      ...c, invoiceAmount: remaining, usedAmount: Math.max(0, c.usedAmount - amount),
      paidInvoices: [...c.paidInvoices, { month: new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" }), amount, paidAt: new Date().toLocaleDateString("pt-BR") }],
    } : c));
    setShowPayment(false); setPayAmount("");
    toast.success(payFull ? "Parabéns pelo pagamento da sua fatura! 🎉" : `Pago ${fmt(amount)} — Restante: ${fmt(remaining)}`);
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteCard = (id: string) => { update(cards.filter(c => c.id !== id)); if (selectedCard === id) setSelectedCard(null); setDeleteConfirmId(null); };

  if (!open) return null;

  // Delete confirmation popup
  if (deleteConfirmId) {
    const cardToDelete = cards.find(c => c.id === deleteConfirmId);
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="w-full max-w-sm card-zelo space-y-4 text-center">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-destructive/15">
            <Trash2 size={24} className="text-destructive" />
          </div>
          <h3 className="text-lg font-bold">Excluir cartão?</h3>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir o cartão <strong>{cardToDelete?.cardName}</strong>? Essa ação não pode ser desfeita.</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteConfirmId(null)} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground active:scale-[0.98]">Cancelar</button>
            <button onClick={() => handleDeleteCard(deleteConfirmId)} className="flex-1 rounded-xl bg-destructive py-3 text-sm font-semibold text-destructive-foreground active:scale-[0.98]">Excluir</button>
          </div>
        </div>
      </div>
    );
  }

  const activeCard = cards.find(c => c.id === selectedCard);

  // Card detail view
  if (activeCard) {
    const available = activeCard.limit - activeCard.usedAmount;
    const bankInfo = getBankInfo(activeCard.bankName);
    const usedPct = activeCard.limit > 0 ? Math.round((activeCard.usedAmount / activeCard.limit) * 100) : 0;
    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth(), activeCard.dueDay);
    if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
    const closeDate = new Date(now.getFullYear(), now.getMonth(), activeCard.closeDay);
    if (closeDate < now) closeDate.setMonth(closeDate.getMonth() + 1);

    return (
      <div className="fixed inset-0 z-[60] flex items-end justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCard(null)} />
        <div className="relative w-full max-w-lg animate-slide-up rounded-t-3xl bg-card border-t border-border p-5 pb-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => { setSelectedCard(null); setShowPayment(false); }} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95"><ArrowLeft size={20} /></button>
            <div className="flex items-center gap-2.5 flex-1">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white text-xs font-bold", bankInfo.color)}>{bankInfo.abbr}</div>
              <div>
                <h2 className="text-base font-bold">{activeCard.cardName}</h2>
                <p className="text-[10px] text-muted-foreground">{activeCard.bankName} • {activeCard.cardType || "Crédito"}{activeCard.cardFlag ? ` • ${activeCard.cardFlag}` : ""}</p>
              </div>
            </div>
            <button onClick={() => setDeleteConfirmId(activeCard.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10"><X size={16} /></button>
          </div>

          {/* Progress */}
          <div className="card-zelo mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-muted-foreground">Uso do limite</p>
              <p className="text-xs font-bold">{usedPct}%</p>
            </div>
            <div className="w-full h-2.5 rounded-full bg-muted/40 overflow-hidden mb-2">
              <div className={cn("h-full rounded-full transition-all", usedPct > 80 ? "bg-destructive" : usedPct > 50 ? "bg-warning" : "bg-success")} style={{ width: `${Math.min(usedPct, 100)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Usado: {fmt(activeCard.usedAmount)}</span>
              <span>Limite: {fmt(activeCard.limit)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="card-zelo !py-3"><p className="text-[10px] text-muted-foreground">Limite</p><p className="text-sm font-bold">{fmt(activeCard.limit)}</p></div>
            <div className="card-zelo !py-3"><p className="text-[10px] text-muted-foreground">Disponível</p><p className="text-sm font-bold text-success">{fmt(available)}</p></div>
          </div>

          <div className="card-zelo mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2"><Calendar size={14} className="text-warning" /><span className="text-xs">Fechamento</span></div>
              <span className="text-xs font-bold">Dia {activeCard.closeDay} — {closeDate.toLocaleDateString("pt-BR")}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2"><Calendar size={14} className="text-destructive" /><span className="text-xs">Vencimento</span></div>
              <span className="text-xs font-bold">Dia {activeCard.dueDay} — {dueDate.toLocaleDateString("pt-BR")}</span>
            </div>
          </div>

          <div className="card-zelo mb-4">
            <div className="flex justify-between items-center mb-3">
              <div><p className="text-xs font-semibold">Fatura Atual</p><p className="text-[10px] text-muted-foreground">Venc. {dueDate.toLocaleDateString("pt-BR")}</p></div>
              <p className="text-lg font-bold text-warning">{fmt(activeCard.invoiceAmount)}</p>
            </div>
            {!showPayment ? (
              <button onClick={() => setShowPayment(true)} className="w-full rounded-xl bg-success/15 py-2.5 text-xs font-semibold text-success active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Pagar Fatura
              </button>
            ) : (
              <div className="space-y-3 border-t border-border pt-3">
                <div className="flex gap-2">
                  <button onClick={() => setPayFull(true)} className={cn("flex-1 rounded-lg py-2 text-xs font-medium transition-all", payFull ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>Total</button>
                  <button onClick={() => setPayFull(false)} className={cn("flex-1 rounded-lg py-2 text-xs font-medium transition-all", !payFull ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>Parcial</button>
                </div>
                {!payFull && (
                  <input type="text" inputMode="numeric" placeholder="R$ 0,00" value={payAmount}
                    onChange={(e) => setPayAmount(handleBRLChange(e.target.value))}
                    className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                )}
                <div className="flex gap-2">
                  <button onClick={() => setShowPayment(false)} className="flex-1 rounded-lg border border-border py-2 text-xs text-muted-foreground">Cancelar</button>
                  <button onClick={() => handlePayInvoice(activeCard.id)} className="flex-1 rounded-lg bg-success py-2 text-xs font-semibold text-white">Confirmar</button>
                </div>
              </div>
            )}
          </div>

          <div className="card-zelo mb-4">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Receipt size={13} className="text-primary" /> Gastos do Mês</p>
            <p className="text-lg font-bold text-foreground mb-3">{fmt(activeCard.usedAmount)}</p>
            {activeCard.transactions.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-3">Nenhuma transação neste período</p>
            ) : (
              <div className="space-y-2">
                {activeCard.transactions.map(t => (
                  <div key={t.id} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                    <div><p className="text-xs font-medium">{t.desc}</p><p className="text-[10px] text-muted-foreground">{t.date} • {t.category}</p></div>
                    <p className="text-xs font-bold text-destructive">-{fmt(t.value)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeCard.futureInvoices.length > 0 && (
            <div className="card-zelo mb-4">
              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Calendar size={13} className="text-warning" /> Faturas Futuras</p>
              <div className="space-y-2">
                {activeCard.futureInvoices.map((inv, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-xs text-muted-foreground">{inv.month}</span><span className="text-xs font-bold">{fmt(inv.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeCard.paidInvoices.length > 0 && (
            <div className="card-zelo">
              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><DollarSign size={13} className="text-success" /> Faturas Pagas</p>
              <div className="space-y-2">
                {activeCard.paidInvoices.map((inv, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                    <div><span className="text-xs">{inv.month}</span><p className="text-[10px] text-muted-foreground">Pago em {inv.paidAt}</p></div>
                    <span className="text-xs font-bold text-success">{fmt(inv.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Add card form
  if (showAdd) {
    const bankInfo = getBankInfo(newBank);
    return (
      <div className="fixed inset-0 z-[60] flex items-end justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
        <div className="relative w-full max-w-lg animate-slide-up rounded-t-3xl bg-card border-t border-border p-5 pb-8 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setShowAdd(false)} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95"><ArrowLeft size={20} /></button>
            <div><h2 className="text-lg font-bold">Novo Cartão</h2><p className="text-[10px] text-muted-foreground">Adicione um cartão de crédito</p></div>
          </div>

          {/* Preview */}
          {(showCustomBank ? customBankName : newBank) && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-muted/30 border border-border">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-white text-sm font-bold", getBankInfo(showCustomBank ? customBankName : newBank).color)}>{getBankInfo(showCustomBank ? customBankName : newBank).abbr}</div>
              <div>
                <p className="text-sm font-bold">{showCustomBank ? customBankName : newBank}</p>
                <p className="text-[10px] text-muted-foreground">{newName || "Nome do cartão"} {newFlag && `• ${newFlag}`}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Block 1: Name */}
            <div>
              <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Nome do Cartão*</label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                <CreditCard size={14} className="text-muted-foreground" />
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Cartão Principal" className="bg-transparent text-sm flex-1 outline-none" />
              </div>
            </div>

            {/* Block 2: Card Type */}
            <div>
              <label className="text-[10px] text-muted-foreground font-medium mb-2 block">Tipo de Cartão</label>
              <div className="flex gap-2">
                {CARD_TYPES.map(type => (
                  <button key={type} onClick={() => setNewType(type)}
                    className={cn("flex-1 rounded-xl py-2.5 text-xs font-medium transition-all border", newType === type ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 text-muted-foreground border-border hover:border-primary/40")}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Block 3: Bank */}
            <div>
              <label className="text-[10px] text-muted-foreground font-medium mb-2 block">Instituição Bancária*</label>
              <div className="grid grid-cols-4 gap-2">
                {BANK_OPTIONS.map(bank => (
                  <button key={bank.name} onClick={() => { setNewBank(bank.name); setShowCustomBank(false); setCustomBankName(""); }}
                    className={cn("flex flex-col items-center gap-1 rounded-xl py-2.5 px-1 text-[10px] font-medium transition-all border",
                      newBank === bank.name && !showCustomBank ? "border-primary bg-primary/10" : "border-border bg-muted/20 hover:border-primary/40")}>
                    <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center text-white text-[9px] font-bold", bank.color)}>{bank.abbr}</div>
                    <span className="truncate w-full text-center">{bank.name}</span>
                  </button>
                ))}
                <button onClick={() => { setShowCustomBank(true); setNewBank(""); }}
                  className={cn("flex flex-col items-center gap-1 rounded-xl py-2.5 px-1 text-[10px] font-medium transition-all border",
                    showCustomBank ? "border-primary bg-primary/10" : "border-border bg-muted/20 hover:border-primary/40")}>
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-muted text-muted-foreground text-[9px] font-bold">+</div>
                  <span>Outro</span>
                </button>
              </div>
              {showCustomBank && (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5 mt-2">
                  <Building2 size={14} className="text-muted-foreground" />
                  <input
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    placeholder="Nome do banco..."
                    className="bg-transparent text-sm flex-1 outline-none"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Block 4: Flag */}
            <div>
              <label className="text-[10px] text-muted-foreground font-medium mb-2 block">Bandeira</label>
              <div className="grid grid-cols-3 gap-2">
                {FLAG_OPTIONS.map(flag => (
                  <button key={flag.name} onClick={() => setNewFlag(flag.name)}
                    className={cn("rounded-xl py-2.5 text-xs font-medium transition-all border",
                      newFlag === flag.name ? "border-primary bg-primary/10 text-foreground" : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40")}>
                    {flag.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Limit */}
            <div>
              <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Limite do Cartão</label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                <Wallet size={14} className="text-muted-foreground" />
                <input type="text" inputMode="numeric" value={newLimit}
                  onChange={(e) => setNewLimit(handleBRLChange(e.target.value))}
                  placeholder="R$ 0,00" className="bg-transparent text-sm flex-1 outline-none" />
              </div>
            </div>

            {/* Days */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Dia Fechamento</label>
                <input type="text" inputMode="numeric" value={newCloseDay} onChange={(e) => setNewCloseDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Dia Vencimento</label>
                <input type="text" inputMode="numeric" value={newDueDay} onChange={(e) => setNewDueDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground active:scale-[0.98]">Cancelar</button>
            <button onClick={handleAddCard} className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.98]">Salvar Cartão</button>
          </div>
        </div>
      </div>
    );
  }

  // Main list
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-slide-up rounded-t-3xl bg-card border-t border-border p-5 pb-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95"><ArrowLeft size={20} /></button>
          <div className="flex-1"><h2 className="text-lg font-bold">Meus Cartões</h2><p className="text-[10px] text-muted-foreground">Gerencie seus cartões de crédito</p></div>
        </div>

        <button onClick={() => setShowAdd(true)} className="w-full rounded-xl bg-primary/10 border border-primary/20 py-3 text-sm font-semibold text-primary flex items-center justify-center gap-2 active:scale-[0.98] transition-all mb-4">
          <Plus size={16} /> Adicionar Cartão
        </button>

        {cards.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-3"><CreditCard size={28} className="text-muted-foreground" /></div>
            <p className="text-sm font-medium text-muted-foreground">Nenhum cartão cadastrado</p>
            <p className="text-[10px] text-muted-foreground mt-1">Adicione seu primeiro cartão de crédito</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map(card => {
              const bankInfo = getBankInfo(card.bankName);
              const available = card.limit - card.usedAmount;
              const usedPct = card.limit > 0 ? Math.round((card.usedAmount / card.limit) * 100) : 0;
              const now = new Date();
              const dueDate = new Date(now.getFullYear(), now.getMonth(), card.dueDay);
              if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);

              return (
                <button key={card.id} onClick={() => setSelectedCard(card.id)} className="w-full text-left card-zelo !p-4 active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0", bankInfo.color)}>{bankInfo.abbr}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{card.cardName}</p>
                      <p className="text-[10px] text-muted-foreground">{card.bankName} • {card.cardType || "Crédito"}</p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                  </div>
                  <p className="text-base font-bold mb-2">{fmt(available)}</p>
                  <div className="w-full h-2 rounded-full bg-muted/40 mb-2 overflow-hidden">
                    <div className={cn("h-full rounded-full", usedPct > 80 ? "bg-destructive" : usedPct > 50 ? "bg-warning" : "bg-success")} style={{ width: `${Math.min(usedPct, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Usado: {fmt(card.usedAmount)}</span>
                    <span className="font-bold">{usedPct}%</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/30 flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Fatura (venc. {dueDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })})</span>
                    <span className="font-bold text-warning">{fmt(card.invoiceAmount)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditCardManager;
