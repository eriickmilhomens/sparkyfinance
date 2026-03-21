import { useState } from "react";
import { TrendingUp, ShieldCheck, AlertTriangle, ArrowUpRight, Wallet, CreditCard, Pencil, DollarSign, CalendarDays, CheckCircle2, X } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, BarChart, Bar, Tooltip } from "recharts";

const balanceHistory = Array.from({ length: 19 }, (_, i) => ({
  d: i + 1,
  v: i < 18 ? Math.floor(Math.random() * 40 + 10) : 600,
}));
for (let i = 0; i < 18; i++) balanceHistory[i].v = Math.floor(Math.random() * 30 + 5);
balanceHistory[18].v = 600;

const entriesExitsData = Array.from({ length: 31 }, (_, i) => ({
  day: i + 1,
  entradas: 0,
  saidas: 0,
}));
entriesExitsData[18] = { day: 19, entradas: 4200, saidas: 1800 };
entriesExitsData[19] = { day: 20, entradas: 800, saidas: 2400 };

const SALDO = 3247.50;
const DIAS_RESTANTES = 12;

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

// Styled calculator SVG icon
const CalculatorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
    <rect x="4" y="2" width="16" height="20" rx="2" stroke="hsl(var(--primary))" strokeWidth="2" />
    <rect x="7" y="5" width="10" height="4" rx="1" fill="hsl(var(--primary))" opacity="0.3" />
    <circle cx="8.5" cy="13" r="1" fill="hsl(var(--primary))" />
    <circle cx="12" cy="13" r="1" fill="hsl(var(--primary))" />
    <circle cx="15.5" cy="13" r="1" fill="hsl(var(--primary))" />
    <circle cx="8.5" cy="17" r="1" fill="hsl(var(--primary))" />
    <circle cx="12" cy="17" r="1" fill="hsl(var(--primary))" />
    <rect x="14.5" y="16" width="2" height="2" rx="0.5" fill="hsl(var(--primary))" />
  </svg>
);

const SpendingOverview = () => {
  const [simOpen, setSimOpen] = useState(false);
  const [simValue, setSimValue] = useState(0);

  const orcamentoDiarioAtual = SALDO / DIAS_RESTANTES;
  const orcamentoDiarioNovo = Math.max(0, (SALDO - simValue) / DIAS_RESTANTES);
  const reducao = orcamentoDiarioAtual - orcamentoDiarioNovo;

  return (
    <div className="space-y-3">
      {/* Pode gastar hoje - hero card */}
      <div className="card-zelo fade-in-up relative overflow-hidden">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-success/5" />
        <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-success/8" />
        <p className="text-label mb-1">Pode Gastar Hoje</p>
        <div className="flex items-end gap-3">
          <p className="text-4xl font-extrabold tracking-tight tabular-nums text-success">
            R$ 108<span className="text-2xl">,25</span>
          </p>
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
            <TrendingUp size={10} /> Saudável
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Baseado no seu saldo de <span className="text-foreground font-medium">R$ 3.247,50</span> e <span className="text-foreground font-medium">12 dias</span> restantes
        </p>
        <div className="mt-2">
          <button
            onClick={() => setSimOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-3.5 py-1.5 text-[11px] font-semibold text-primary cursor-pointer active:scale-95 transition-all hover:bg-primary/20"
          >
            <CalculatorIcon />
            Simular
          </button>
        </div>
      </div>

      {/* Simulator Modal */}
      {simOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSimOpen(false)} />
          <div className="relative w-full max-w-lg animate-slide-up rounded-t-3xl bg-card border-t border-border p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">Simulador de Impacto</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Veja como uma compra afeta seu orçamento diário até o fim do mês</p>
              </div>
              <button onClick={() => setSimOpen(false)} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95 transition-all">
                <X size={20} />
              </button>
            </div>

            <label className="text-[11px] text-muted-foreground mb-1.5 block">Valor da Compra (R$)</label>
            <div className="flex items-center gap-2 mb-5">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={simValue || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d.,]/g, "").replace(",", ".");
                    setSimValue(Math.max(0, Number(val) || 0));
                  }}
                  placeholder="0,00"
                  className="w-full rounded-xl border-2 border-primary bg-muted/50 pl-10 pr-4 py-3 text-sm font-medium outline-none tabular-nums placeholder:text-muted-foreground transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-muted/50 border border-border px-4 py-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Orçamento diário atual</p>
                  <p className="text-sm font-bold tabular-nums text-success">{fmt(orcamentoDiarioAtual)}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">por dia</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/50 border border-border px-4 py-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Novo orçamento diário</p>
                  <p className={`text-sm font-bold tabular-nums ${simValue > 0 ? "text-warning" : "text-success"}`}>{fmt(orcamentoDiarioNovo)}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">por dia</span>
              </div>
              {simValue > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Redução diária</p>
                    <p className="text-sm font-bold tabular-nums text-destructive">- {fmt(reducao)}</p>
                  </div>
                  <span className="text-[10px] text-destructive font-medium">por dia</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card-zelo fade-in-up stagger-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
              <Wallet size={14} className="text-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">Receita Mensal</span>
          </div>
          <p className="text-lg font-bold tabular-nums">R$ 6.500,00</p>
          <span className="text-[10px] text-success font-medium flex items-center gap-0.5">
            <ArrowUpRight size={10} /> +8% vs mês passado
          </span>
        </div>
        <div className="card-zelo fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/15">
              <CreditCard size={14} className="text-destructive" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">Gasto Mensal</span>
          </div>
          <p className="text-lg font-bold tabular-nums">R$ 3.252,50</p>
          <span className="text-[10px] text-destructive font-medium flex items-center gap-0.5">
            <ArrowUpRight size={10} className="rotate-90" /> +12% vs mês passado
          </span>
        </div>
      </div>

      {/* Balance History Line Chart */}
      <div className="card-zelo fade-in-up stagger-3">
        <p className="text-label mb-0.5">HISTÓRICO DE SALDO</p>
        <p className="text-[11px] text-muted-foreground mb-3">Evolução realizada até hoje</p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={balanceHistory} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="balHistGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 800]} ticks={[0, 200, 400, 600, 800]} tickFormatter={(v: number) => `R$ ${v}`} />
              <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#balHistGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ritmo & Autonomia */}
      <div className="card-zelo fade-in-up stagger-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-label">RITMO & AUTONOMIA</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">11 dias</p>
            <p className="text-[10px] text-muted-foreground">de caixa</p>
          </div>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-warning transition-all duration-700" style={{ width: "45%" }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-muted-foreground">Faltam 12 dias no mês</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive">
            <AlertTriangle size={10} /> Ritmo Acelerado
          </span>
        </div>
      </div>

      {/* Financial Grid Widgets */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card-zelo fade-in-up stagger-1 col-span-1">
          <p className="text-label mb-3">TOP CATEGORIAS</p>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
              <Pencil size={12} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium truncate">Personalizado</p>
              <p className="text-sm font-bold tabular-nums">R$ 1.969,00</p>
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: "72%" }} />
          </div>
        </div>

        <div className="space-y-2 col-span-1">
          <div className="card-zelo fade-in-up stagger-2">
            <p className="text-label mb-1">MAIOR DESPESA</p>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-destructive/15">
                <DollarSign size={12} className="text-destructive" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Nubank</p>
                <p className="text-sm font-bold text-destructive tabular-nums">R$ 790,71</p>
              </div>
            </div>
          </div>
          <div className="card-zelo fade-in-up stagger-3">
            <p className="text-label mb-1">PRÓXIMAS CONTAS</p>
            <div className="flex items-center gap-1.5 py-1">
              <CheckCircle2 size={14} className="text-success" />
              <p className="text-[11px] text-success font-medium text-left">Tudo pago por enquanto!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Entradas vs Saídas */}
      <div className="card-zelo fade-in-up stagger-4">
        <p className="text-label mb-3">ENTRADAS VS SAÍDAS</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={entriesExitsData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "11px" }}
                labelFormatter={(v) => `DIA ${v}`}
                formatter={(value: number, name: string) => [fmt(value), name === "entradas" ? "Entradas" : "Saídas"]}
              />
              <Bar dataKey="entradas" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="saidas" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-[10px] text-muted-foreground">Entradas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-[10px] text-muted-foreground">Saídas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingOverview;
