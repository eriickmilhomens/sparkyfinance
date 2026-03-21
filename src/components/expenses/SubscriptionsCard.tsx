import { useState } from "react";
import { MoreVertical, Plus, X, CheckCircle2, Clock, Pencil, Trash2, CalendarDays, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";
import { usePoints } from "@/hooks/usePoints";
import { toast } from "sonner";

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
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDueDay, setNewDueDay] = useState("10");
  const [newLogo, setNewLogo] = useState("");
  const [newColor, setNewColor] = useState("bg-primary");
  const { data, updateData } = useFinancialData();
  const { awardPoints } = usePoints();

  const update = (updated: Subscription[]) => { setSubs(updated); saveSubs(updated); };

  const getDaysLeft = (dueDay: number) => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), dueDay);
    if (target <= now) target.setMonth(target.getMonth() + 1);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const amount = parseFloat(newAmount.replace(/\D/g, "")) / 100 || 0;
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

  const handleDelete = (id: string) => {
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
    setMenuId(null);
  };

  const resetForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setNewName("");
    setNewAmount("");
    setNewDueDay("10");
    setNewLogo("");
    setNewColor("bg-primary");
  };

  const selectPreset = (preset: typeof PRESET_SUBS[0]) => {
    setNewName(preset.name);
    setNewLogo(preset.logo);
    setNewColor(preset.color);
  };

  const totalMonthly = subs.reduce((s, sub) => s + sub.amount, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">Assinaturas Ativas</p>
          <p className="text-[10px] text-muted-foreground">{subs.length} serviço{subs.length !== 1 ? "s" : ""} · {fmt(totalMonthly)}/mês</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[10px] font-semibold text-primary active:scale-95 transition-all">
          <Plus size={12} /> Adicionar
        </button>
      </div>

      {subs.length === 0 ? (
        <div className="card-zelo flex flex-col items-center py-6">
          <CalendarDays size={24} className="text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Nenhuma assinatura cadastrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subs.map(sub => {
            const daysLeft = getDaysLeft(sub.dueDay);
            return (
              <div key={sub.id} className={cn("card-zelo !p-3.5 transition-all", sub.paid ? "opacity-60" : "")}>
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white text-[10px] font-bold shrink-0", sub.color)}>
                    {sub.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{sub.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{fmt(sub.amount)}/mês</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!sub.paid && (
                      <button onClick={() => handleMarkPaid(sub.id)} className="flex items-center gap-1 rounded-lg bg-success/10 px-2 py-1 text-[9px] font-semibold text-success active:scale-95 transition-all">
                        <CheckCircle2 size={10} /> Pagar
                      </button>
                    )}
                    <div className="relative">
                      <button onClick={() => setMenuId(menuId === sub.id ? null : sub.id)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground active:scale-95">
                        <MoreVertical size={14} />
                      </button>
                      {menuId === sub.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                          <div className="absolute right-0 top-7 bg-card border border-border rounded-xl shadow-lg z-20 py-1 min-w-[120px]">
                            <button onClick={() => startEdit(sub)} className="w-full px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted">
                              <Pencil size={12} /> Editar
                            </button>
                            <button onClick={() => handleDelete(sub.id)} className="w-full px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted text-destructive">
                              <Trash2 size={12} /> Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold",
                    sub.paid ? "bg-success/15 text-success" : daysLeft <= 3 ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"
                  )}>
                    {sub.paid ? <><CheckCircle2 size={9} /> Pago este mês</> : <><Clock size={9} /> {daysLeft} dia{daysLeft !== 1 ? "s" : ""} restante{daysLeft !== 1 ? "s" : ""}</>}
                  </span>
                </div>
              </div>
            );
          })}
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
                      className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium border transition-all active:scale-95",
                        newName === p.name ? "border-primary bg-primary/10" : "border-border bg-muted/20")}>
                      <div className={cn("h-5 w-5 rounded flex items-center justify-center text-white text-[7px] font-bold", p.color)}>{p.logo}</div>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Nome do serviço</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Netflix" className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Valor mensal</label>
                <input type="text" inputMode="numeric" value={newAmount} placeholder="R$ 0,00"
                  onChange={e => { const nums = e.target.value.replace(/\D/g, ""); const val = (parseInt(nums) || 0) / 100; setNewAmount(val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })); }}
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Dia do pagamento</label>
                <input type="text" inputMode="numeric" value={newDueDay} onChange={e => setNewDueDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={resetForm} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground active:scale-[0.98]">Cancelar</button>
              <button onClick={handleAdd} className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.98]">{editingId ? "Salvar" : "Adicionar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsCard;
