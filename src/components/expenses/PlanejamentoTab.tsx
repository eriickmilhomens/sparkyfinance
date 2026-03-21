import { useState, useEffect } from "react";
import { Target, PiggyBank, TrendingUp, Calendar, Lightbulb, Plus, X, Wallet, Shield, Sparkles, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFinancialData } from "@/hooks/useFinancialData";
import { usePoints } from "@/hooks/usePoints";

const BUDGET_KEY = "sparky-budgets";
const GOALS_KEY = "sparky-investment-goals";

const defaultBudgets = [
  { name: "Moradia", budget: 0, spent: 0, color: "hsl(var(--primary))" },
  { name: "Alimentação", budget: 0, spent: 0, color: "hsl(var(--success))" },
  { name: "Transporte", budget: 0, spent: 0, color: "hsl(var(--warning))" },
  { name: "Lazer", budget: 0, spent: 0, color: "hsl(var(--info))" },
  { name: "Outros", budget: 0, spent: 0, color: "hsl(var(--destructive))" },
];

const fmtLocal = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

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

const tips = [
  { title: "Reduza delivery", desc: "Cozinhar mais vezes por semana pode economizar bastante no final do mês.", icon: "🍳" },
  { title: "Revise assinaturas", desc: "Cancele serviços que não usa para economizar mensalmente.", icon: "📺" },
  { title: "Energia em horário reduzido", desc: "Use eletrodomésticos após 22h para reduzir a conta de luz em até 15%.", icon: "⚡" },
  { title: "Compras no atacado", desc: "Itens de uso frequente saem mais baratos em atacarejos.", icon: "🛒" },
  { title: "Metas semanais", desc: "Dividir o orçamento em semanas facilita o controle dos gastos.", icon: "📅" },
  { title: "Cashback e cupons", desc: "Use apps de cashback e cupons para economizar nas compras do dia a dia.", icon: "💰" },
  { title: "Transporte alternativo", desc: "Considere caronas, bicicleta ou transporte público para economizar.", icon: "🚲" },
  { title: "Lista de compras", desc: "Ir ao mercado com lista reduz compras por impulso em até 40%.", icon: "📝" },
];

const goalTypes = [
  { id: "emergency", label: "Reserva de Emergência", icon: Shield, color: "text-destructive", bg: "bg-destructive/15" },
  { id: "personal", label: "Cuidado Pessoal", icon: Sparkles, color: "text-info", bg: "bg-info/15" },
  { id: "travel", label: "Viagem", icon: Wallet, color: "text-warning", bg: "bg-warning/15" },
  { id: "investment", label: "Investimento", icon: TrendingUp, color: "text-success", bg: "bg-success/15" },
];

interface InvestmentGoal {
  id: string;
  type: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
}

const PlanejamentoTab = () => {
  const { data, updateData } = useFinancialData();
  const { awardPoints } = usePoints();
  const [budgetCategories, setBudgetCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem(BUDGET_KEY) || "null") || defaultBudgets; } catch { return defaultBudgets; }
  });
  const [investmentGoals, setInvestmentGoals] = useState<InvestmentGoal[]>(() => {
    try { return JSON.parse(localStorage.getItem(GOALS_KEY) || "[]"); } catch { return []; }
  });
  const totalBudget = budgetCategories.reduce((s: number, c: any) => s + c.budget, 0);
  const totalSpent = budgetCategories.reduce((s: number, c: any) => s + c.spent, 0);
  const [activeTip, setActiveTip] = useState(0);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editBudgetOpen, setEditBudgetOpen] = useState(false);
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [editingBudgets, setEditingBudgets] = useState(budgetCategories.map((c: any) => ({ ...c })));
  const [newGoal, setNewGoal] = useState({ type: "emergency", name: "", targetAmount: "" });
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  // Compute savings goal from real data
  const totalSaved = investmentGoals.reduce((s, g) => s + g.savedAmount, 0);
  const totalTarget = investmentGoals.reduce((s, g) => s + g.targetAmount, 0);
  const savingsPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
  const savingsGoal = [{ name: "meta", value: savingsPct, fill: "hsl(var(--success))" }];

  const monthComparison = budgetCategories[0]?.budget > 0
    ? [
        { m: "Plan", plan: totalBudget, real: 0 },
        { m: "Real", plan: 0, real: totalSpent },
      ]
    : [];

  const saveBudgets = () => {
    setBudgetCategories(editingBudgets);
    localStorage.setItem(BUDGET_KEY, JSON.stringify(editingBudgets));
    setEditBudgetOpen(false);
    toast.success("Orçamento atualizado!");
  };

  const saveGoal = () => {
    if (!newGoal.name.trim()) { toast.error("Preencha o nome"); return; }
    const target = parseBRL(newGoal.targetAmount);
    if (target <= 0) { toast.error("Informe um valor"); return; }
    const goal: InvestmentGoal = {
      id: crypto.randomUUID(),
      type: newGoal.type,
      name: newGoal.name.trim(),
      targetAmount: target,
      savedAmount: 0,
    };
    const updated = [...investmentGoals, goal];
    setInvestmentGoals(updated);
    localStorage.setItem(GOALS_KEY, JSON.stringify(updated));
    setNewGoal({ type: "emergency", name: "", targetAmount: "" });
    setNewGoalOpen(false);
    toast.success("Meta criada!");
  };

  const deleteGoal = (id: string) => {
    const updated = investmentGoals.filter(g => g.id !== id);
    setInvestmentGoals(updated);
    localStorage.setItem(GOALS_KEY, JSON.stringify(updated));
  };

  const handleDeposit = () => {
    const amount = parseBRL(depositAmount);
    if (amount <= 0) { toast.error("Informe um valor válido"); return; }
    const updated = investmentGoals.map(g =>
      g.id === depositGoalId ? { ...g, savedAmount: g.savedAmount + amount } : g
    );
    setInvestmentGoals(updated);
    localStorage.setItem(GOALS_KEY, JSON.stringify(updated));

    // Deduct from balance as an expense
    updateData({
      balance: data.balance - amount,
      expenses: data.expenses + amount,
      transactions: [
        ...data.transactions,
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          description: `Depósito: ${investmentGoals.find(g => g.id === depositGoalId)?.name || "Meta"}`,
          amount,
          type: "expense" as const,
          category: "Investimento",
        },
      ],
    });

    setDepositGoalId(null);
    setDepositAmount("");
    awardPoints("invest_deposit", `Depósito: ${investmentGoals.find(g => g.id === depositGoalId)?.name || "Meta"}`);
    toast.success(`R$ ${fmtLocal(amount)} depositado na meta! +2 pts 📈`);
  };

  return (
    <div className="space-y-3">
      {/* Savings goal radial */}
      <div className="card-zelo fade-in-up">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15">
            <PiggyBank size={14} className="text-success" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold">Meta de Economia</p>
            <p className="text-[10px] text-muted-foreground">
              {totalTarget > 0 ? `R$ ${fmtLocal(totalSaved)} de R$ ${fmtLocal(totalTarget)}` : "Nenhuma meta definida"}
            </p>
          </div>
          <button onClick={() => setGoalModalOpen(true)} className="text-[10px] text-primary font-medium active:scale-95 transition-transform">Editar</button>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={savingsGoal} startAngle={90} endAngle={-270}>
                <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 flex-1">
            <div>
              <p className="text-2xl font-extrabold tabular-nums text-success">{savingsPct}%</p>
              <p className="text-[10px] text-muted-foreground">da meta atingida</p>
            </div>
            {savingsPct > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                <TrendingUp size={10} /> {savingsPct >= 100 ? "Meta atingida!" : "No ritmo certo"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Smart Tips */}
      <div className="card-zelo fade-in-up stagger-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15">
            <Lightbulb size={14} className="text-warning" />
          </div>
          <p className="text-xs font-semibold">Dicas Inteligentes</p>
        </div>
        <div className="rounded-xl bg-muted/30 border border-border p-3">
          <div className="flex items-start gap-3">
            <span className="text-xl">{tips[activeTip].icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold mb-0.5">{tips[activeTip].title}</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{tips[activeTip].desc}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {tips.map((_, i) => (
            <button key={i} onClick={() => setActiveTip(i)} className={cn("h-1.5 rounded-full transition-all", activeTip === i ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30")} />
          ))}
        </div>
      </div>

      {/* Investment Goals */}
      <div className="card-zelo fade-in-up stagger-2" id="metas-investimento">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15">
              <TrendingUp size={14} className="text-success" />
            </div>
            <p className="text-xs font-semibold">Metas de Investimento</p>
          </div>
          <button onClick={() => setNewGoalOpen(true)} className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary active:scale-95 transition-all">
            <Plus size={14} />
          </button>
        </div>
        {investmentGoals.length === 0 ? (
          <div className="text-center py-4">
            <Wallet size={24} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-[11px] text-muted-foreground">Nenhuma meta criada</p>
            <p className="text-[10px] text-muted-foreground/70">Crie metas de investimento, reserva de emergência e mais.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {investmentGoals.map(goal => {
              const goalType = goalTypes.find(t => t.id === goal.type);
              const Icon = goalType?.icon || Wallet;
              const pct = goal.targetAmount > 0 ? Math.round((goal.savedAmount / goal.targetAmount) * 100) : 0;
              return (
                <div key={goal.id} className="rounded-xl border border-border p-3 relative">
                  <button onClick={() => deleteGoal(goal.id)} className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:text-destructive active:scale-95">
                    <X size={12} />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", goalType?.bg)}>
                      <Icon size={14} className={goalType?.color} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{goal.name}</p>
                      <p className="text-[9px] text-muted-foreground">{goalType?.label}</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-1">
                    <div className="h-full rounded-full bg-success transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground mb-2">
                    <span>R$ {fmtLocal(goal.savedAmount)}</span>
                    <span>R$ {fmtLocal(goal.targetAmount)} ({pct}%)</span>
                  </div>

                  {/* Deposit button */}
                  {depositGoalId === goal.id ? (
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="R$ 0,00"
                        className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs outline-none tabular-nums focus:border-primary"
                      />
                      <button onClick={handleDeposit} className="rounded-lg bg-success/15 px-3 py-2 text-xs font-medium text-success active:scale-95">
                        Depositar
                      </button>
                      <button onClick={() => { setDepositGoalId(null); setDepositAmount(""); }} className="rounded-lg bg-muted px-2 py-2 text-xs text-muted-foreground active:scale-95">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDepositGoalId(goal.id)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 py-2 text-[11px] font-semibold text-primary active:scale-[0.97] transition-all"
                    >
                      <DollarSign size={13} /> Depositar valor
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Budget by category */}
      <div className="card-zelo fade-in-up stagger-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-primary" />
            <p className="text-xs font-semibold">Orçamento por Categoria</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground tabular-nums">R$ {fmtLocal(totalSpent)} / R$ {fmtLocal(totalBudget)}</span>
            <button onClick={() => { setEditingBudgets(budgetCategories.map((c: any) => ({ ...c }))); setEditBudgetOpen(true); }} className="text-[10px] text-primary font-medium active:scale-95">Editar</button>
          </div>
        </div>
        <div className="space-y-3">
          {budgetCategories.map((cat: any) => {
            const pct = cat.budget > 0 ? Math.round((cat.spent / cat.budget) * 100) : 0;
            const over = pct > 90;
            return (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{cat.name}</span>
                  <span className={cn("text-[10px] font-semibold tabular-nums", over ? "text-destructive" : "text-muted-foreground")}>{pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: over ? "hsl(var(--destructive))" : cat.color }} />
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[9px] text-muted-foreground tabular-nums">R$ {fmtLocal(cat.spent)}</span>
                  <span className="text-[9px] text-muted-foreground tabular-nums">R$ {fmtLocal(cat.budget)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Planned vs Real */}
      {totalBudget > 0 && (
        <div className="card-zelo fade-in-up stagger-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-warning" />
            <p className="text-xs font-semibold">Planejado vs Real</p>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthComparison} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(0 0% 40%)" }} />
                <Bar dataKey="plan" radius={[3, 3, 0, 0]} fill="hsl(var(--muted))" />
                <Bar dataKey="real" radius={[3, 3, 0, 0]} fill="hsl(var(--primary))" opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-muted" />
              <span className="text-[10px] text-muted-foreground">Planejado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-[10px] text-muted-foreground">Real</span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {editBudgetOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditBudgetOpen(false)} />
          <div className="relative w-full max-w-lg animate-slide-up rounded-t-3xl bg-card border-t border-border p-5 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Editar Orçamento</h2>
              <button onClick={() => setEditBudgetOpen(false)} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95">
                <X size={20} />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mb-4">Defina o limite de gastos por categoria para o mês</p>
            <div className="space-y-3">
              {editingBudgets.map((cat: any, i: number) => (
                <div key={cat.name}>
                  <label className="text-[11px] text-muted-foreground mb-1 block">{cat.name}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cat.budget}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setEditingBudgets((prev: any) => prev.map((c: any, j: number) => j === i ? { ...c, budget: val } : c));
                    }}
                    className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm outline-none tabular-nums focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              ))}
            </div>
            <button onClick={saveBudgets} className="w-full mt-5 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98]">
              Salvar Orçamento
            </button>
          </div>
        </div>
      )}

      {/* New Investment Goal Modal */}
      {newGoalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNewGoalOpen(false)} />
          <div className="relative w-full max-w-lg animate-slide-up rounded-t-3xl bg-card border-t border-border p-5 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Nova Meta</h2>
              <button onClick={() => setNewGoalOpen(false)} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-muted-foreground mb-2 block">Tipo de Meta</label>
                <div className="grid grid-cols-2 gap-2">
                  {goalTypes.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setNewGoal(prev => ({ ...prev, type: t.id }))}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border p-3 transition-all active:scale-[0.97]",
                          newGoal.type === t.id ? "border-primary bg-primary/10" : "border-border"
                        )}
                      >
                        <Icon size={16} className={t.color} />
                        <span className="text-[11px] font-medium">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1.5 block">Nome da Meta</label>
                <input type="text" placeholder="Ex: Reserva de emergência" value={newGoal.name} onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1.5 block">Valor da Meta (R$)</label>
                <input type="text" inputMode="numeric" placeholder="R$ 0,00" value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none tabular-nums focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>
            </div>
            <button onClick={saveGoal} className="w-full mt-5 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98]">
              Criar Meta
            </button>
          </div>
        </div>
      )}

      {/* Goal edit modal */}
      {goalModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setGoalModalOpen(false)} />
          <div className="relative w-full max-w-lg animate-slide-up rounded-t-3xl bg-card border-t border-border p-5 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Editar Meta de Economia</h2>
              <button onClick={() => setGoalModalOpen(false)} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95 transition-all">
                <X size={20} />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">As metas de economia são calculadas automaticamente com base nas suas metas de investimento criadas abaixo.</p>
            <button onClick={() => setGoalModalOpen(false)} className="w-full mt-3 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98]">
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanejamentoTab;
