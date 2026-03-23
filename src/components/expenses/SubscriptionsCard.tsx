import { useState, useEffect } from "react";
import { handleBRLChange, parseBRLInput } from "@/lib/brlInput";
import { MoreVertical, Plus, X, CheckCircle2, Clock, Pencil, Trash2, CalendarDays, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";
import { usePoints } from "@/hooks/usePoints";
import { toast } from "sonner";
import { useDockVisibility } from "@/hooks/useDockVisibility";

interface Subscription {
  id: string;
  name: string;
  logo: string;
  amount: number;
  dueDay: number;
  paid: boolean;
  color: string;
}

const STORAGE_KEY = "sparky-subscriptions";

const PRESET_SUBS = [
  { name: "Netflix", logo: "N", color: "bg-red-600" },
  { name: "Spotify", logo: "S", color: "bg-green-500" },
  { name: "Disney+", logo: "D+", color: "bg-blue-700" },
  { name: "Amazon Prime", logo: "AP", color: "bg-sky-500" },
  { name: "YouTube Premium", logo: "YT", color: "bg-red-500" },
  { name: "iCloud", logo: "iC", color: "bg-gray-500" },
  { name: "Adobe", logo: "Ad", color: "bg-red-700" },
  { name: "HBO Max", logo: "HB", color: "bg-purple-700" },
  { name: "Crunchyroll", logo: "CR", color: "bg-orange-500" },
  { name: "Xbox Game Pass", logo: "XB", color: "bg-green-600" },
  { name: "PlayStation Plus", logo: "PS", color: "bg-blue-600" },
];

const loadSubs = (): Subscription[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
};
const saveSubs = (subs: Subscription[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));

const SubscriptionsCard = () => {
  const [subs, setSubs] = useState<Subscription[]>(loadSubs);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("R$ 0,00");
  const [newDueDay, setNewDueDay] = useState("10");
  const [newLogo, setNewLogo] = useState("");
  const [newColor, setNewColor] = useState("bg-primary");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const { data, updateData } = useFinancialData();
  const { awardPoints, removePoints } = usePoints();
  useDockVisibility(showAdd);

  // Re-read from localStorage when data changes (e.g. demo mode activation)
  useEffect(() => {
    const handler = () => setSubs(loadSubs());
    window.addEventListener("sparky-data-cleared", handler);
    return () => window.removeEventListener("sparky-data-cleared", handler);
  }, []);

  const update = (updated: Subscription[]) => {
    setSubs(updated);
    saveSubs(updated);
    // Notify dashboard to re-compute pending totals
    window.dispatchEvent(new Event("sparky-paid-bills-updated"));
  };

  const getDaysLeft = (dueDay: number) => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), dueDay);
    if (target <= now) target.setMonth(target.getMonth() + 1);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const amount = parseBRLInput(newAmount);
    const preset = PRESET_SUBS.find(p => p.name.toLowerCase() === newName.toLowerCase());
    const sub: Subscription = {
      id: editingId || crypto.randomUUID(),
      name: newName.trim(),
      logo: preset?.logo || newLogo || newName.slice(0, 2).toUpperCase(),
      amount,
      dueDay: parseInt(newDueDay) || 10,
      paid: false,
      color: preset?.color || newColor,
    };
    if (editingId) {
      update(subs.map(s => s.id === editingId ? sub : s));
      toast.success("Assinatura atualizada");
    } else {
      update([...subs, sub]);
      toast.success("Assinatura adicionada");
    }
    resetForm();
  };

  const handleMarkPaid = (id: string) => {
    const sub = subs.find(s => s.id === id);
    if (!sub || sub.paid) return;
    update(subs.map(s => s.id === id ? { ...s, paid: true } : s));
    const newTx = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      description: `Assinatura: ${sub.name}`,
      amount: sub.amount,
      type: "expense" as const,
      category: "Assinatura",
    };
    updateData({
      expenses: data.expenses + sub.amount,
      balance: data.balance - sub.amount,
      transactions: [newTx, ...data.transactions],
    });
    awardPoints("bill_paid", `Pagou assinatura: ${sub.name}`);
    toast.success(`${sub.name} marcada como paga! +3 pts`);
  };

  const handleUnmarkPaid = async (id: string) => {
    const sub = subs.find(s => s.id === id);
    if (!sub || !sub.paid) return;
    update(subs.map(s => s.id === id ? { ...s, paid: false } : s));
    // Refund: remove from expenses, add back to balance
    const updatedTx = data.transactions.filter(t => t.description !== `Assinatura: ${sub.name}`);
    updateData({
      expenses: Math.max(0, data.expenses - sub.amount),
      balance: data.balance + sub.amount,
      transactions: updatedTx,
    });
    await removePoints("bill_paid", `Pagou assinatura: ${sub.name}`);
    toast.success(`${sub.name} desmarcada — estorno e pontos removidos`);
  };

  const handleDelete = async (id: string) => {
    const sub = subs.find(s => s.id === id);
    // If sub was paid, refund the financial data and remove points
    if (sub && sub.paid) {
      const updatedTx = data.transactions.filter(t => t.description !== `Assinatura: ${sub.name}`);
      updateData({
        expenses: Math.max(0, data.expenses - sub.amount),
        balance: data.balance + sub.amount,
        transactions: updatedTx,
      });
      await removePoints("bill_paid", `Pagou assinatura: ${sub.name}`);
    }
    update(subs.filter(s => s.id !== id));
    setMenuId(null);
    toast.success("Assinatura removida");
  };

  const startEdit = (sub: Subscription) => {
    setEditingId(sub.id);
    setNewName(sub.name);
    setNewAmount(fmt(sub.amount));
    setNewDueDay(String(sub.dueDay));
    setNewLogo(sub.logo);
    setNewColor(sub.color);
    setShowAdd(true);
    setShowCustomInput(false);
    setMenuId(null);
  };

  const resetForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setNewName("");
    setNewAmount("R$ 0,00");
    setNewDueDay("10");
    setNewLogo("");
    setNewColor("bg-primary");
    setShowCustomInput(false);
  };

  const selectPreset = (preset: typeof PRESET_SUBS[0]) => {
    setNewName(preset.name);
    setNewLogo(preset.logo);
    setNewColor(preset.color);
    setShowCustomInput(false);
  };

  const totalMonthly = subs.reduce((s, sub) => s + sub.amount, 0);
  const paidCount = subs.filter(s => s.paid).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">Assinaturas</p>
          <p className="text-[10px] text-muted-foreground">
            {subs.length} serviço{subs.length !== 1 ? "s" : ""} · {fmt(totalMonthly)}/mês
            {subs.length > 0 && ` · ${paidCount}/${subs.length} pagas`}
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowAdd(true); }} className="flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 text-[10px] font-semibold text-primary active:scale-95 transition-all">
          <Plus size={12} /> Nova
        </button>
      </div>

      {subs.length === 0 ? (
        <div className="card-zelo flex flex-col items-center py-8 gap-2">
          <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
            <CalendarDays size={22} className="text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Nenhuma assinatura</p>
          <p className="text-[10px] text-muted-foreground">Adicione seus serviços recorrentes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subs.map(sub => {
            const daysLeft = getDaysLeft(sub.dueDay);
            const isUrgent = !sub.paid && daysLeft <= 3;
            return (
              <div key={sub.id} className={cn(
                "card-zelo !p-0 overflow-hidden transition-all",
                sub.paid && "opacity-70"
              )}>
                {/* Colored left accent */}
                <div className="flex">
                  <div className={cn("w-1 shrink-0 rounded-l-xl", sub.paid ? "bg-success" : isUrgent ? "bg-destructive" : "bg-warning")} />
                  <div className="flex-1 p-3.5">
                    <div className="flex items-center gap-3">
                      {/* Logo */}
                      <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm", sub.color)}>
                        {sub.logo}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{sub.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs font-semibold tabular-nums">{fmt(sub.amount)}<span className="text-muted-foreground font-normal">/mês</span></p>
                          <span className="text-muted-foreground">·</span>
                          <p className="text-[10px] text-muted-foreground">Dia {sub.dueDay}</p>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {sub.paid ? (
                          <button onClick={() => handleUnmarkPaid(sub.id)} className="flex items-center gap-1 rounded-xl bg-muted/50 px-2.5 py-1.5 text-[9px] font-semibold text-muted-foreground active:scale-95 transition-all" title="Desfazer pagamento">
                            <Undo2 size={10} /> Estornar
                          </button>
                        ) : (
                          <button onClick={() => handleMarkPaid(sub.id)} className="flex items-center gap-1 rounded-xl bg-success/15 px-2.5 py-1.5 text-[9px] font-semibold text-success active:scale-95 transition-all">
                            <CheckCircle2 size={10} /> Pagar
                          </button>
                        )}
                        <div className="relative">
                          <button onClick={() => setMenuId(menuId === sub.id ? null : sub.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground active:scale-95">
                            <MoreVertical size={14} />
                          </button>
                          {menuId === sub.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                              <div className="absolute right-0 top-8 bg-card border border-border rounded-xl shadow-xl z-20 py-1 min-w-[130px]">
                                <button onMouseDown={(e) => { e.stopPropagation(); startEdit(sub); }} className="w-full px-3 py-2.5 text-xs flex items-center gap-2 hover:bg-muted transition-colors">
                                  <Pencil size={12} /> Editar
                                </button>
                                <button onMouseDown={(e) => { e.stopPropagation(); handleDelete(sub.id); }} className="w-full px-3 py-2.5 text-xs flex items-center gap-2 hover:bg-muted text-destructive transition-colors">
                                  <Trash2 size={12} /> Excluir
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Status bar */}
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-semibold",
                        sub.paid ? "bg-success/15 text-success" : isUrgent ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"
                      )}>
                        {sub.paid ? <><CheckCircle2 size={9} /> Pago este mês</> : <><Clock size={9} /> {daysLeft} dia{daysLeft !== 1 ? "s" : ""}</>}
                      </span>
                      {!sub.paid && isUrgent && (
                        <span className="text-[9px] text-destructive font-medium animate-pulse">Vence em breve!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Monthly summary */}
          <div className="flex items-center justify-between px-1 pt-1">
            <p className="text-[10px] text-muted-foreground">Total mensal</p>
            <p className="text-xs font-bold">{fmt(totalMonthly)}</p>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-[85%] max-w-sm rounded-2xl bg-card border border-border p-5 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-destructive/15 flex items-center justify-center">
              <Trash2 size={22} className="text-destructive" />
            </div>
            <h3 className="text-base font-bold mb-1">Excluir assinatura?</h3>
            <p className="text-xs text-muted-foreground mb-5">
              Tem certeza que deseja excluir <span className="font-semibold text-foreground">{subs.find(s => s.id === deleteTargetId)?.name}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground active:scale-[0.98]">Cancelar</button>
              <button onClick={() => { if (deleteTargetId) handleDelete(deleteTargetId); setShowDeleteConfirm(false); resetForm(); }} className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-bold text-destructive-foreground active:scale-[0.98]">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetForm} />
          <div className="relative w-full max-w-lg animate-slide-up rounded-t-3xl bg-card border-t border-border p-5 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editingId ? "Editar Assinatura" : "Nova Assinatura"}</h2>
              <button onClick={resetForm} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95">
                <X size={20} />
              </button>
            </div>

            {!editingId && (
              <div className="mb-4">
                <p className="text-[10px] text-muted-foreground font-medium mb-2">Serviços populares</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SUBS.map(p => (
                    <button key={p.name} onClick={() => selectPreset(p)}
                      className={cn("flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-medium border transition-all active:scale-95",
                        newName === p.name ? "border-primary bg-primary/10" : "border-border bg-muted/20")}>
                      <div className={cn("h-5 w-5 rounded flex items-center justify-center text-white text-[7px] font-bold", p.color)}>{p.logo}</div>
                      {p.name}
                    </button>
                  ))}
                  <button onClick={() => { setShowCustomInput(true); setNewName(""); setNewLogo(""); setNewColor("bg-primary"); }}
                    className={cn("flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-medium border transition-all active:scale-95",
                      showCustomInput ? "border-primary bg-primary/10" : "border-border bg-muted/20")}>
                    <div className="h-5 w-5 rounded flex items-center justify-center bg-muted text-muted-foreground text-[7px] font-bold">+</div>
                    Outros
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Nome do serviço</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Netflix, Gym, etc." className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Valor mensal</label>
                <input type="text" inputMode="numeric" value={newAmount} placeholder="R$ 0,00"
                  onChange={e => setNewAmount(handleBRLChange(e.target.value))}
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Dia do pagamento</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {[1, 5, 10, 15, 20, 25, 28].map(d => (
                    <button key={d} onClick={() => setNewDueDay(String(d))}
                      className={cn("rounded-xl py-2 text-xs font-medium transition-all border",
                        parseInt(newDueDay) === d ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/20 text-muted-foreground")}>
                      {d}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <input type="text" inputMode="numeric" value={newDueDay} onChange={e => setNewDueDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    placeholder="Ou digite o dia" className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs outline-none focus:border-primary text-center" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={resetForm} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground active:scale-[0.98]">Cancelar</button>
              <button onClick={handleAdd} className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.98]">{editingId ? "Salvar" : "Adicionar"}</button>
            </div>

            {editingId && (
              <button onClick={() => { setDeleteTargetId(editingId); setShowDeleteConfirm(true); }}
                className="w-full mt-3 rounded-xl border border-destructive/30 bg-destructive/10 py-3 text-sm font-semibold text-destructive active:scale-[0.98] flex items-center justify-center gap-2 transition-all">
                <Trash2 size={15} /> Excluir Assinatura
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsCard;
