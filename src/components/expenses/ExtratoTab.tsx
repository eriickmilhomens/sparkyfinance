import { useState, useMemo, useCallback, useRef } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";
import { isGoalDepositTransaction } from "@/lib/financialCalculations";
import TransactionRow from "./TransactionRow";
import { useVirtualizer } from "@tanstack/react-virtual";

const filterOptions = ["Todos", "Receitas", "Despesas"];
const months = [
  { value: 0, label: "Janeiro" }, { value: 1, label: "Fevereiro" }, { value: 2, label: "Março" },
  { value: 3, label: "Abril" }, { value: 4, label: "Maio" }, { value: 5, label: "Junho" },
  { value: 6, label: "Julho" }, { value: 7, label: "Agosto" }, { value: 8, label: "Setembro" },
  { value: 9, label: "Outubro" }, { value: 10, label: "Novembro" }, { value: 11, label: "Dezembro" },
];
const years = [2024, 2025, 2026];

const ExtratoTab = () => {
  const [filter, setFilter] = useState("Todos");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const { data, deleteTransaction, updateTransaction } = useFinancialData();

  const allFiltered = useMemo(() => data.transactions.filter((t) => {
    const d = new Date(t.date);
    if (d.getMonth() !== selectedMonth || d.getFullYear() !== selectedYear) return false;
    if (filter === "Receitas") return t.type === "income";
    if (filter === "Despesas") return t.type === "expense" && !isGoalDepositTransaction(t);
    return true;
  }), [data.transactions, selectedMonth, selectedYear, filter]);

  const totalIn = useMemo(() => allFiltered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [allFiltered]);
  const totalOut = useMemo(() => allFiltered.filter(t => t.type === "expense" && !isGoalDepositTransaction(t)).reduce((s, t) => s + t.amount, 0), [allFiltered]);

  // Flat list with day headers for virtualization
  type VirtualItem = { type: "header"; label: string } | { type: "tx"; tx: typeof allFiltered[0] };
  const flatList = useMemo<VirtualItem[]>(() => {
    const grouped: Record<string, typeof allFiltered> = {};
    allFiltered.forEach((t) => {
      const d = new Date(t.date);
      const dayLabel = d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" }).toUpperCase().replace(" DE ", " DE ");
      if (!grouped[dayLabel]) grouped[dayLabel] = [];
      grouped[dayLabel].push(t);
    });
    const items: VirtualItem[] = [];
    Object.entries(grouped).forEach(([day, txs]) => {
      items.push({ type: "header", label: day });
      txs.forEach(tx => items.push({ type: "tx", tx }));
    });
    return items;
  }, [allFiltered]);

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: flatList.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => flatList[i].type === "header" ? 32 : 56,
    overscan: 10,
  });

  const selectedMonthLabel = months.find(m => m.value === selectedMonth)?.label || "";

  const handleDelete = useCallback(async (id: string) => {
    await deleteTransaction(id);
  }, [deleteTransaction]);

  const handleUpdate = useCallback(async (id: string, updates: { description: string; amount: number }) => {
    await updateTransaction(id, updates);
  }, [updateTransaction]);

  return (
    <div className="space-y-3">
      {/* Month/Year selector + filter */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setDatePickerOpen(!datePickerOpen)}
            className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-bold active:scale-95 transition-transform will-change-transform"
          >
            <Calendar size={14} className="text-primary" />
            {selectedMonthLabel} {selectedYear}
            <ChevronDown size={12} className="text-muted-foreground" />
          </button>
          {datePickerOpen && (
            <div className="absolute left-0 top-full mt-1 z-30 w-56 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
              <div className="p-2 border-b border-border">
                <p className="text-[10px] text-muted-foreground font-medium px-2 mb-1">ANO</p>
                <div className="flex gap-1">
                  {years.map((y) => (
                    <button key={y} onClick={() => setSelectedYear(y)}
                      className={cn("flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors active:scale-[0.97]",
                        selectedYear === y ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
                      )}>{y}</button>
                  ))}
                </div>
              </div>
              <div className="p-2 grid grid-cols-3 gap-1">
                {months.map((m) => (
                  <button key={m.value} onClick={() => { setSelectedMonth(m.value); setDatePickerOpen(false); }}
                    className={cn("rounded-lg py-2 text-[11px] font-medium transition-colors active:scale-[0.97]",
                      selectedMonth === m.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
                    )}>{m.label.slice(0, 3)}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground active:scale-95 transition-transform will-change-transform">
            {filter}<ChevronDown size={12} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 w-32 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
              {filterOptions.map((opt) => (
                <button key={opt} onClick={() => { setFilter(opt); setDropdownOpen(false); }}
                  className={cn("w-full px-3 py-2.5 text-xs font-medium text-left transition-colors active:scale-[0.98]",
                    filter === opt ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted/50"
                  )}>{opt}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card-zelo border-l-4 border-l-success" style={{ minHeight: 68 }}>
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight size={14} className="text-success" />
            <span className="text-[10px] text-muted-foreground font-medium">Entradas</span>
          </div>
          <p className="text-base font-bold tabular-nums text-success">{fmt(totalIn)}</p>
        </div>
        <div className="card-zelo border-l-4 border-l-destructive" style={{ minHeight: 68 }}>
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft size={14} className="text-destructive" />
            <span className="text-[10px] text-muted-foreground font-medium">Saídas</span>
          </div>
          <p className="text-base font-bold tabular-nums text-destructive">{fmt(totalOut)}</p>
        </div>
      </div>

      {/* Virtualized transaction list */}
      {flatList.length === 0 ? (
        <div className="card-zelo text-center py-8">
          <p className="text-sm text-muted-foreground">Nenhuma transação neste período</p>
        </div>
      ) : (
        <div ref={parentRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
          <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = flatList[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    willChange: 'transform',
                  }}
                >
                  {item.type === "header" ? (
                    <p className="text-label px-1 py-1.5">{item.label}</p>
                  ) : (
                    <div className="card-zelo !p-0 !rounded-xl">
                      <TransactionRow
                        transaction={item.tx}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtratoTab;
