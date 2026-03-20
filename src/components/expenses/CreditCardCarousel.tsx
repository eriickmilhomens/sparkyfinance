import { useState } from "react";
import { CreditCard, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardSummary {
  id: string;
  bankName: string;
  cardName: string;
  limit: number;
  usedAmount: number;
  invoiceAmount: number;
  dueDay: number;
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
  const [cards] = useState<CardSummary[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });

  if (cards.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground font-semibold tracking-wider px-0.5">CARTÕES DE CRÉDITO</p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {cards.map(card => {
          const bankInfo = getBankInfo(card.bankName);
          const available = card.limit - card.usedAmount;
          const now = new Date();
          const dueDate = new Date(now.getFullYear(), now.getMonth(), card.dueDay);
          if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);

          return (
            <div key={card.id} className="card-zelo !p-3 min-w-[200px] flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold", bankInfo.color)}>
                  {bankInfo.abbr}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{card.cardName}</p>
                  <p className="text-[9px] text-muted-foreground">{card.bankName}</p>
                </div>
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
