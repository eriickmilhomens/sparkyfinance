import { useState } from "react";
import { CreditCard, ChevronDown, ChevronUp, Receipt, Calendar, DollarSign, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardTransaction {
  id: string;
  desc: string;
  value: number;
  date: string;
  category: string;
}

interface CreditCardData {
  id: string;
  bankName: string;
  cardName: string;
  limit: number;
  usedAmount: number;
  invoiceAmount: number;
  dueDay: number;
  closeDay: number;
  transactions: CardTransaction[];
  paidInvoices: { month: string; amount: number; paidAt: string }[];
  futureInvoices: { month: string; amount: number }[];
}

const BANK_DATA: Record<string, { color: string; abbr: string }> = {
  "nubank": { color: "bg-purple-600", abbr: "NU" },
  "inter": { color: "bg-orange-500", abbr: "IN" },
  "itaú": { color: "bg-orange-600", abbr: "IT" },
  "itau": { color: "bg-orange-600", abbr: "IT" },
  "bradesco": { color: "bg-red-600", abbr: "BR" },
  "santander": { color: "bg-red-700", abbr: "SA" },
  "banco do brasil": { color: "bg-yellow-500", abbr: "BB" },
  "caixa": { color: "bg-blue-600", abbr: "CX" },
  "c6": { color: "bg-gray-900", abbr: "C6" },
  "pan": { color: "bg-blue-500", abbr: "PN" },
  "neon": { color: "bg-cyan-500", abbr: "NE" },
  "next": { color: "bg-green-500", abbr: "NX" },
  "picpay": { color: "bg-green-400", abbr: "PP" },
  "mercado pago": { color: "bg-blue-400", abbr: "MP" },
};

const getBankInfo = (name: string) => {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(BANK_DATA)) {
    if (lower.includes(key)) return val;
  }
  return { color: "bg-muted-foreground", abbr: name.slice(0, 2).toUpperCase() };
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STORAGE_KEY = "sparky-credit-cards";

const CreditCardCarousel = () => {
  const [cards] = useState<CreditCardData[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [payFull, setPayFull] = useState(true);
  const [payAmount, setPayAmount] = useState("");

  if (cards.length === 0) return null;

  const expandedCard = cards.find(c => c.id === expandedId);

  // Expanded card detail overlay
  if (expandedCard) {
    const available = expandedCard.limit - expandedCard.usedAmount;
    const bankInfo = getBankInfo(expandedCard.bankName);
    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth(), expandedCard.dueDay);
    if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
    const closeDate = new Date(now.getFullYear(), now.getMonth(), expandedCard.closeDay);
    if (closeDate < now) closeDate.setMonth(closeDate.getMonth() + 1);

    return (
      <div className="fixed inset-0 z-[60] flex items-end justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setExpandedId(null); setShowPayment(false); }} />
        <div className="relative w-full max-w-lg animate-slide-up rounded-t-3xl bg-card border-t border-border p-5 pb-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => { setExpandedId(null); setShowPayment(false); }} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2.5 flex-1">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white text-xs font-bold", bankInfo.color)}>
                {bankInfo.abbr}
              </div>
              <div>
                <h2 className="text-base font-bold">{expandedCard.cardName}</h2>
                <p className="text-[10px] text-muted-foreground">{expandedCard.bankName}</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="card-zelo !py-3">
              <p className="text-[10px] text-muted-foreground">Limite</p>
              <p className="text-sm font-bold">{fmt(expandedCard.limit)}</p>
            </div>
            <div className="card-zelo !py-3">
              <p className="text-[10px] text-muted-foreground">Disponível</p>
              <p className="text-sm font-bold text-success">{fmt(available)}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="card-zelo mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-warning" />
                <span className="text-xs">Fechamento</span>
              </div>
              <span className="text-xs font-bold">Dia {expandedCard.closeDay} — {closeDate.toLocaleDateString("pt-BR")}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-destructive" />
                <span className="text-xs">Vencimento</span>
              </div>
              <span className="text-xs font-bold">Dia {expandedCard.dueDay} — {dueDate.toLocaleDateString("pt-BR")}</span>
            </div>
          </div>

          {/* Current invoice */}
          <div className="card-zelo mb-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs font-semibold">Fatura Atual</p>
                <p className="text-[10px] text-muted-foreground">Venc. {dueDate.toLocaleDateString("pt-BR")}</p>
              </div>
              <p className="text-lg font-bold text-warning">{fmt(expandedCard.invoiceAmount)}</p>
            </div>

            {!showPayment ? (
              <button
                onClick={() => setShowPayment(true)}
                className="w-full rounded-xl bg-success/15 py-2.5 text-xs font-semibold text-success active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {/* Credit card SVG icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                Pagar Fatura
              </button>
            ) : (
              <div className="space-y-3 border-t border-border pt-3">
                <div className="flex gap-2">
                  <button onClick={() => setPayFull(true)} className={cn("flex-1 rounded-lg py-2 text-xs font-medium transition-all", payFull ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>Total</button>
                  <button onClick={() => setPayFull(false)} className={cn("flex-1 rounded-lg py-2 text-xs font-medium transition-all", !payFull ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>Parcial</button>
                </div>
                {!payFull && (
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={payAmount}
                    onChange={(e) => {
                      const nums = e.target.value.replace(/\D/g, "");
                      const val = (parseInt(nums) || 0) / 100;
                      setPayAmount(val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
                    }}
                    className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                )}
                <div className="flex gap-2">
                  <button onClick={() => setShowPayment(false)} className="flex-1 rounded-lg border border-border py-2 text-xs text-muted-foreground">Cancelar</button>
                  <button onClick={() => setShowPayment(false)} className="flex-1 rounded-lg bg-success py-2 text-xs font-semibold text-white">Confirmar</button>
                </div>
              </div>
            )}
          </div>

          {/* Gastos do mês */}
          <div className="card-zelo mb-4">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Receipt size={13} className="text-primary" /> Gastos do Mês
            </p>
            <p className="text-lg font-bold text-foreground mb-3">{fmt(expandedCard.usedAmount)}</p>
            {expandedCard.transactions.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-3">Nenhuma transação neste período</p>
            ) : (
              <div className="space-y-2">
                {expandedCard.transactions.map(t => (
                  <div key={t.id} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-xs font-medium">{t.desc}</p>
                      <p className="text-[10px] text-muted-foreground">{t.date} • {t.category}</p>
                    </div>
                    <p className="text-xs font-bold text-destructive">-{fmt(t.value)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Future invoices */}
          {expandedCard.futureInvoices.length > 0 && (
            <div className="card-zelo mb-4">
              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                <Calendar size={13} className="text-warning" /> Faturas Futuras
              </p>
              <div className="space-y-2">
                {expandedCard.futureInvoices.map((inv, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-xs text-muted-foreground">{inv.month}</span>
                    <span className="text-xs font-bold">{fmt(inv.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paid invoices */}
          {expandedCard.paidInvoices.length > 0 && (
            <div className="card-zelo">
              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                <DollarSign size={13} className="text-success" /> Faturas Pagas
              </p>
              <div className="space-y-2">
                {expandedCard.paidInvoices.map((inv, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                    <div>
                      <span className="text-xs">{inv.month}</span>
                      <p className="text-[10px] text-muted-foreground">Pago em {inv.paidAt}</p>
                    </div>
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

  return (
    <div className="space-y-2 fade-in-up stagger-2">
      <p className="text-[10px] text-muted-foreground font-semibold tracking-wider px-0.5">CARTÕES DE CRÉDITO</p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {cards.map((card, idx) => {
          const bankInfo = getBankInfo(card.bankName);
          const available = card.limit - card.usedAmount;
          const now = new Date();
          const dueDate = new Date(now.getFullYear(), now.getMonth(), card.dueDay);
          if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);

          return (
            <div
              key={card.id}
              onClick={() => setExpandedId(card.id)}
              className={`card-zelo !p-3 min-w-[200px] flex-shrink-0 cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98] fade-in-up stagger-${Math.min(idx + 1, 5)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold", bankInfo.color)}>
                  {bankInfo.abbr}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{card.cardName}</p>
                  <p className="text-[9px] text-muted-foreground">{card.bankName}</p>
                </div>
                <ChevronDown size={14} className="text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[9px] text-muted-foreground">Disponível</span>
                  <span className="text-[10px] font-bold text-success">{fmt(available)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] text-muted-foreground">Fatura (venc. {dueDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })})</span>
                  <span className="text-[10px] font-bold text-warning">{fmt(card.invoiceAmount)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CreditCardCarousel;
