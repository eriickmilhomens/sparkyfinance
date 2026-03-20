import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const transactions = [
  { id: 1, name: "Aluguel", category: "Moradia", value: -1800, date: "20 Mar", day: "20 DE MARÇO", type: "out" },
  { id: 8, name: "iFood", category: "Alimentação", value: -67.8, date: "20 Mar", day: "20 DE MARÇO", type: "out" },
  { id: 2, name: "Salário", category: "Receita", value: 6500, date: "19 Mar", day: "19 DE MARÇO", type: "in" },
  { id: 3, name: "Supermercado Extra", category: "Alimentação", value: -342.5, date: "19 Mar", day: "19 DE MARÇO", type: "out" },
  { id: 4, name: "Uber", category: "Transporte", value: -28.9, date: "19 Mar", day: "19 DE MARÇO", type: "out" },
  { id: 5, name: "Netflix", category: "Lazer", value: -55.9, date: "17 Mar", day: "17 DE MARÇO", type: "out" },
  { id: 6, name: "Freelance", category: "Receita", value: 1200, date: "12 Mar", day: "12 DE MARÇO", type: "in" },
  { id: 7, name: "Conta de Luz", category: "Moradia", value: -185, date: "10 Mar", day: "10 DE MARÇO", type: "out" },
  { id: 9, name: "Nubank", category: "Cartão", value: -790.71, date: "19 Mar", day: "19 DE MARÇO", type: "out" },
  { id: 10, name: "Pix Recebido", category: "Receita", value: 2600, date: "20 Mar", day: "20 DE MARÇO", type: "in" },
];

const filterOptions = ["Todos", "Receitas", "Despesas"];

const ExtratoTab = () => {
  const [filter, setFilter] = useState("Todos");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filtered = transactions.filter((t) => {
    if (filter === "Receitas") return t.type === "in";
    if (filter === "Despesas") return t.type === "out";
    return true;
  });

  const totalIn = filtered.filter(t => t.type === "in").reduce((s, t) => s + t.value, 0);
  const totalOut = filtered.filter(t => t.type === "out").reduce((s, t) => s + Math.abs(t.value), 0);

  // Group by day
  const grouped: Record<string, typeof transactions> = {};
  filtered.forEach((t) => {
    if (!grouped[t.day]) grouped[t.day] = [];
    grouped[t.day].push(t);
  });

  return (
    <div className="space-y-3">
      {/* Month header + filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Março 2026</h2>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground active:scale-95 transition-all"
          >
            {filter}
            <ChevronDown size={12} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 w-32 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
              {filterOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setFilter(opt); setDropdownOpen(false); }}
                  className={cn(
                    "w-full px-3 py-2.5 text-xs font-medium text-left transition-colors active:scale-[0.98]",
                    filter === opt ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card-zelo fade-in-up stagger-1">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight size={14} className="text-success" />
            <span className="text-[10px] text-muted-foreground font-medium">Entradas</span>
          </div>
          <p className="text-base font-bold tabular-nums text-success">
            R$ {totalIn.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card-zelo fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft size={14} className="text-destructive" />
            <span className="text-[10px] text-muted-foreground font-medium">Saídas</span>
          </div>
          <p className="text-base font-bold tabular-nums text-destructive">
            R$ {totalOut.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Grouped transaction list */}
      {Object.entries(grouped).map(([day, items]) => (
        <div key={day} className="fade-in-up">
          <p className="text-label px-1 mb-2">{day}</p>
          <div className="card-zelo !p-0 divide-y divide-border">
            {items.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl",
                  t.type === "in" ? "bg-success/15" : "bg-destructive/15"
                )}>
                  {t.type === "in"
                    ? <ArrowUpRight size={14} className="text-success" />
                    : <ArrowDownLeft size={14} className="text-destructive" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.category}</p>
                </div>
                <span className={cn(
                  "text-sm font-bold tabular-nums",
                  t.type === "in" ? "text-success" : "text-foreground"
                )}>
                  {t.type === "in" ? "+" : "−"} R$ {Math.abs(t.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExtratoTab;
