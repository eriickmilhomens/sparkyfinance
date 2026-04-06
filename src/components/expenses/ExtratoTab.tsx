import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronDown, Calendar, Pencil, Trash2, Check, X, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";
import { toast } from "sonner";
import { isGoalDepositTransaction } from "@/lib/financialCalculations";

const filterOptions = ["Todos", "Receitas", "Despesas"];
const months = [
  { value: 0, label: "Janeiro" }, { value: 1, label: "Fevereiro" }, { value: 2, label: "Março" },
  { value: 3, label: "Abril" }, { value: 4, label: "Maio" }, { value: 5, label: "Junho" },
  { value: 6, label: "Julho" }, { value: 7, label: "Agosto" }, { value: 8, label: "Setembro" },
  { value: 9, label: "Outubro" }, { value: 10, label: "Novembro" }, { value: 11, label: "Dezembro" },
];
const years = [2024, 2025, 2026];

const parseBRL = (str: string): number => {
  const clean = str.replace(/[^\d.,]/g, "");
  if (clean.includes(",")) {
    const parts = clean.split(",");
    const intPart = parts[0].replace(/\./g, "");
    return parseFloat(`${intPart}.${parts[1]}`) || 0;
  }
  if ((clean.match(/\./g) || []).length > 1) {
    return parseFloat(clean.replace(/\./g, "")) || 0;
  }
  return parseFloat(clean) || 0;
};

const PAGE_SIZE = 30;

const ExtratoTab = () => {
  const [filter, setFilter] = useState("Todos");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data, deleteTransaction, updateTransaction } = useFinancialData();

  const allFiltered = data.transactions.filter((t) => {
    const d = new Date(t.date);
    if (d.getMonth() !== selectedMonth || d.getFullYear() !== selectedYear) return false;
    if (filter === "Receitas") return t.type === "income";
    if (filter === "Despesas") return t.type === "expense" && !isGoalDepositTransaction(t);
    return true;
  });

  const filtered = allFiltered.slice(0, visibleCount);
  const hasMore = allFiltered.length > visibleCount;

  const totalIn = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered.filter(t => t.type === "expense" && !isGoalDepositTransaction(t)).reduce((s, t) => s + t.amount, 0);

  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach((t) => {
    const d = new Date(t.date);
    const dayLabel = d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" }).toUpperCase().replace(" DE ", " DE ");
    if (!grouped[dayLabel]) grouped[dayLabel] = [];
    grouped[dayLabel].push(t);
  });

  const selectedMonthLabel = months.find(m => m.value === selectedMonth)?.label || "";

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      setDeleteConfirm(null);
      toast.success("Transação excluída e saldo recalculado");
    } catch {
      toast.error("Erro ao excluir transação");
    }
  };

  const handleEdit = async (id: string) => {
    const newAmount = parseBRL(editAmount);
    if (newAmount <= 0) { toast.error("Valor inválido"); return; }
    try {
      await updateTransaction(id, { description: editDesc, amount: newAmount });
      setEditingId(null);
      toast.success("Transação atualizada");
    } catch {
      toast.error("Erro ao atualizar transação");
    }
  };

  return (
    <div className="space-y-3">
      {/* Month/Year selector + filter */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setDatePickerOpen(!datePickerOpen)}
            className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-bold active:scale-95 transition-all"
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
            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground active:scale-95 transition-all">
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
        <div className="card-zelo fade-in-up stagger-1 border-l-4 border-l-success">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight size={14} className="text-success" />
            <span className="text-[10px] text-muted-foreground font-medium">Entradas</span>
          </div>
          <p className="text-base font-bold tabular-nums text-success">{fmt(totalIn)}</p>
        </div>
        <div className="card-zelo fade-in-up stagger-2 border-l-4 border-l-destructive">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft size={14} className="text-destructive" />
            <span className="text-[10px] text-muted-foreground font-medium">Saídas</span>
          </div>
          <p className="text-base font-bold tabular-nums text-destructive">{fmt(totalOut)}</p>
        </div>
      </div>

      {/* Grouped transaction list */}
      {Object.keys(grouped).length === 0 && (
        <div className="card-zelo text-center py-8 fade-in-up">
          <p className="text-sm text-muted-foreground">Nenhuma transação neste período</p>
        </div>
      )}
      {Object.entries(grouped).map(([day, items]) => (
        <div key={day} className="fade-in-up">
          <p className="text-label px-1 mb-2">{day}</p>
          <div className="card-zelo !p-0 divide-y divide-border">
            {items.map((t) => (
              <div key={t.id} className="relative">
                {(() => {
                  const isIncomeTx = t.type === "income";
                  const isGoalTx = isGoalDepositTransaction(t);

                  return editingId === t.id ? (
                  <div className="px-4 py-3 space-y-2">
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary"
                      placeholder="Descrição"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary tabular-nums"
                      placeholder="Valor"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(t.id)} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-success/15 py-2 text-xs font-medium text-success active:scale-95">
                        <Check size={14} /> Salvar
                      </button>
                      <button onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-muted py-2 text-xs font-medium text-muted-foreground active:scale-95">
                        <X size={14} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : deleteConfirm === t.id ? (
                  <div className="px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-2">Excluir "{t.description}"? O saldo será recalculado.</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(t.id)} className="flex-1 rounded-lg bg-destructive/15 py-2 text-xs font-medium text-destructive active:scale-95">
                        Confirmar
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-lg bg-muted py-2 text-xs font-medium text-muted-foreground active:scale-95">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl",
                      isIncomeTx ? "bg-success/15" : isGoalTx ? "bg-primary/15" : "bg-destructive/15"
                    )}>
                      {isIncomeTx
                        ? <ArrowUpRight size={14} className="text-success" />
                        : isGoalTx
                          ? <PiggyBank size={14} className="text-primary" />
                          : <ArrowDownLeft size={14} className="text-destructive" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground">{t.category}</p>
                    </div>
                    <span className={cn(
                      "text-sm font-bold tabular-nums mr-2",
                      isIncomeTx ? "text-success" : isGoalTx ? "text-primary" : "text-foreground"
                    )}>
                      {isIncomeTx ? "+" : isGoalTx ? "•" : "−"} {fmt(t.amount)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingId(t.id); setEditDesc(t.description); setEditAmount(t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })); }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary active:scale-95 transition-all"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(t.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive active:scale-95 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
                })()}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExtratoTab;
