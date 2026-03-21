import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, ArrowUpRight, Wallet, CreditCard, X, Info, Pencil } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, BarChart, Bar, Tooltip } from "recharts";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";
import PaceBar from "@/components/expenses/PaceBar";

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

interface SpendingOverviewProps {
  hideValues?: boolean;
}

const InfoPopup = ({ title, message, onClose }: { title: string; message: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
    <div className="w-full max-w-sm card-zelo space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
            <Info size={16} className="text-primary" />
          </div>
          <h3 className="text-sm font-bold">{title}</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground"><X size={16} /></button>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
      <button onClick={onClose} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground active:scale-[0.98]">Entendi</button>
    </div>
  </div>
);

const SpendingOverview = ({ hideValues = false }: SpendingOverviewProps) => {
  const [simOpen, setSimOpen] = useState(false);
  const [simValue, setSimValue] = useState(0);
  const [infoPopup, setInfoPopup] = useState<string | null>(null);
  const [editingPercent, setEditingPercent] = useState(false);
  const [spendPercent, setSpendPercent] = useState(() => {
    const saved = localStorage.getItem("sparky-spend-percent");
    return saved ? Number(saved) : 20;
  });
  const { data, available, daysLeft } = useFinancialData();

  useEffect(() => {
    localStorage.setItem("sparky-spend-percent", String(spendPercent));
  }, [spendPercent]);

  const hasData = data.balance > 0 || data.income > 0 || data.expenses > 0;
  const spendablePool = Math.max(0, available * (spendPercent / 100));
  const dailyBudget = daysLeft > 0 ? spendablePool / daysLeft : 0;
  const orcamentoDiarioNovo = Math.max(0, (spendablePool - simValue) / daysLeft);
  const reducao = dailyBudget - orcamentoDiarioNovo;
  const isHealthy = dailyBudget >= 50 || !hasData;

  const buildBalanceHistory = () => {
    if (!hasData) return [];
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const today = now.getDate();
    const txThisMonth = data.transactions
      .filter(t => { const d = new Date(t.date); return d.getMonth() === month && d.getFullYear() === year; })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let netThisMonth = 0;
    txThisMonth.forEach(t => { netThisMonth += t.type === "income" ? t.amount : -t.amount; });
    let cumBalance = data.balance - netThisMonth;
    const points: { d: number; v: number }[] = [];
    for (let day = 1; day <= today; day++) {
      const dayTxs = txThisMonth.filter(t => new Date(t.date).getDate() === day);
      dayTxs.forEach(t => { cumBalance += t.type === "income" ? t.amount : -t.amount; });
      points.push({ d: day, v: Math.round(cumBalance) });
    }
    return points.length > 0 ? points : [{ d: today, v: data.balance }];
  };

  const balanceHistory = buildBalanceHistory();
  const entriesExitsData = Array.from({ length: 31 }, (_, i) => ({ day: i + 1, entradas: 0, saidas: 0 }));
  if (hasData) {
    const now = new Date();
    data.transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        const day = d.getDate() - 1;
        if (day >= 0 && day < 31) {
          if (t.type === "income") entriesExitsData[day].entradas += t.amount;
          else entriesExitsData[day].saidas += t.amount;
        }
      }
    });
  }

  const masked = "••••••";

  return (
    <div className="space-y-3">
      {/* Pode gastar hoje */}
      <div className="card-zelo fade-in-up relative overflow-hidden">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-success/5" />
        <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-success/8" />
        <div className="flex items-center justify-between mb-1">
          <p className="text-label">Pode Gastar Hoje</p>
          <button
            onClick={() => setInfoPopup("podeGastar")}
            className="p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground active:scale-90 transition-all"
          >
            <Info size={11} />
          </button>
        </div>
        <div className="flex items-end gap-3">
          <p className="text-4xl font-extrabold tracking-tight tabular-nums text-success">
            {hideValues ? masked : fmt(dailyBudget).replace("R$\u00a0", "R$ ")}
          </p>
          {hasData && !hideValues && (
            <span className={`mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isHealthy ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
              {isHealthy ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {isHealthy ? "Saudável" : "Atenção"}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          {hasData && !hideValues
            ? <>20% do saldo disponível (<span className="text-foreground font-medium">{fmt(spendablePool)}</span>) ÷ <span className="text-foreground font-medium">{daysLeft} dias</span> restantes</>
            : hideValues ? "Valores ocultos" : "Adicione sua renda e despesas para ver o orçamento diário"
          }
        </p>
        {!hideValues && (
          <div className="mt-2">
            <button onClick={() => setSimOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-3.5 py-1.5 text-[11px] font-semibold text-primary cursor-pointer active:scale-95 transition-all hover:bg-primary/20">
              <CalculatorIcon /> Simular
            </button>
          </div>
        )}
      </div>

      {/* Simulator Modal */}
      {simOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSimOpen(false)} />
          <div className="relative w-full max-w-lg animate-slide-up rounded-t-3xl bg-card border-t border-border p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">Simulador de Impacto</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Veja como uma compra afeta seu orçamento diário (base: 20% do saldo)</p>
              </div>
              <button onClick={() => setSimOpen(false)} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"><X size={20} /></button>
            </div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block">Valor da Compra (R$)</label>
            <div className="flex items-center gap-2 mb-5">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <input type="text" inputMode="numeric" value={simValue || ""} onChange={(e) => { const val = e.target.value.replace(/[^\d.,]/g, "").replace(",", "."); setSimValue(Math.max(0, Number(val) || 0)); }} placeholder="0,00" className="w-full rounded-xl border-2 border-primary bg-muted/50 pl-10 pr-4 py-3 text-sm font-medium outline-none tabular-nums placeholder:text-muted-foreground transition-all" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-muted/50 border border-border px-4 py-3">
                <div><p className="text-[10px] text-muted-foreground">Orçamento diário atual</p><p className="text-sm font-bold tabular-nums text-success">{fmt(dailyBudget)}</p></div>
                <span className="text-[10px] text-muted-foreground">por dia</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/50 border border-border px-4 py-3">
                <div><p className="text-[10px] text-muted-foreground">Novo orçamento diário</p><p className={`text-sm font-bold tabular-nums ${simValue > 0 ? "text-warning" : "text-success"}`}>{fmt(orcamentoDiarioNovo)}</p></div>
                <span className="text-[10px] text-muted-foreground">por dia</span>
              </div>
              {simValue > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
                  <div><p className="text-[10px] text-muted-foreground">Redução diária</p><p className="text-sm font-bold tabular-nums text-destructive">- {fmt(reducao)}</p></div>
                  <span className="text-[10px] text-destructive font-medium">por dia</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card-zelo fade-in-up stagger-1 border-l-4 border-l-success relative">
          <button
            onClick={() => setInfoPopup("receita")}
            className="absolute top-2 right-2 p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground active:scale-90 transition-all"
          >
            <Info size={11} />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15"><Wallet size={14} className="text-primary" /></div>
            <span className="text-[10px] text-muted-foreground font-medium">Receita Mensal</span>
          </div>
          <p className="text-lg font-bold tabular-nums">{hideValues ? masked : fmt(data.income)}</p>
          {hasData && !hideValues && (<span className="text-[10px] text-success font-medium flex items-center gap-0.5"><ArrowUpRight size={10} /> Receita registrada</span>)}
        </div>
        <div className="card-zelo fade-in-up stagger-2 border-l-4 border-l-destructive relative">
          <button
            onClick={() => setInfoPopup("gasto")}
            className="absolute top-2 right-2 p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground active:scale-90 transition-all"
          >
            <Info size={11} />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/15"><CreditCard size={14} className="text-destructive" /></div>
            <span className="text-[10px] text-muted-foreground font-medium">Gasto Mensal</span>
          </div>
          <p className="text-lg font-bold tabular-nums">{hideValues ? masked : fmt(data.expenses)}</p>
          {hasData && !hideValues && (<span className="text-[10px] text-destructive font-medium flex items-center gap-0.5"><ArrowUpRight size={10} className="rotate-90" /> Despesas registradas</span>)}
        </div>
      </div>

      {infoPopup && (
        <InfoPopup
          title={
            infoPopup === "receita" ? "Receita Mensal" 
            : infoPopup === "gasto" ? "Gasto Mensal"
            : "Pode Gastar Hoje"
          }
          message={
            infoPopup === "receita"
              ? "A Receita Mensal representa o total de entradas financeiras registradas no mês atual. Inclui salários, freelances, rendimentos e qualquer outra fonte de renda que você tenha adicionado. Esse valor é atualizado automaticamente a cada novo lançamento de receita."
              : infoPopup === "gasto"
              ? "O Gasto Mensal representa o total de despesas registradas no mês atual. Inclui contas fixas, compras, assinaturas e qualquer saída de dinheiro que você tenha lançado. Acompanhe esse valor para manter o controle do seu orçamento."
              : "O 'Pode Gastar Hoje' calcula quanto você pode gastar de forma segura hoje. Ele pega 20% do seu saldo disponível (uma reserva de segurança) e divide pelos dias restantes do mês. Dessa forma, você evita gastar demais nos primeiros dias e garante que seu dinheiro dure até o fim do mês. Quanto mais verde, mais saudável está seu orçamento diário."
          }
          onClose={() => setInfoPopup(null)}
        />
      )}

      {/* Balance History */}
      {hasData && balanceHistory.length > 1 && (
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
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#balHistGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Ritmo & Autonomia */}
      <PaceBar />

      {/* Entradas vs Saídas */}
      {hasData && (
        <div className="card-zelo fade-in-up stagger-4">
          <p className="text-label mb-3">ENTRADAS VS SAÍDAS</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={entriesExitsData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "11px" }} labelFormatter={(v) => `DIA ${v}`} formatter={(value: number, name: string) => [fmt(value), name === "entradas" ? "Entradas" : "Saídas"]} />
                <Bar dataKey="entradas" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="saidas" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-success" /><span className="text-[10px] text-muted-foreground">Entradas</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-destructive" /><span className="text-[10px] text-muted-foreground">Saídas</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingOverview;