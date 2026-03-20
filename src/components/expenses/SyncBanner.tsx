import { Wallet, TrendingDown, TrendingUp, ScanLine, Download, Target } from "lucide-react";

const quickActions = [
  { label: "Despesa", icon: TrendingDown, bg: "bg-destructive/15", color: "text-destructive" },
  { label: "Receita", icon: TrendingUp, bg: "bg-success/15", color: "text-success" },
  { label: "Escanear", icon: ScanLine, bg: "bg-primary/15", color: "text-primary" },
  { label: "Importar", icon: Download, bg: "bg-[hsl(280_60%_35%)]/20", color: "text-[hsl(280_60%_65%)]" },
  { label: "Metas", icon: Target, bg: "bg-warning/15", color: "text-warning" },
];

const SyncBanner = () => {
  return (
    <div className="space-y-4">
      {/* Sync Banner */}
      <div className="card-zelo fade-in-up flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
          <Wallet size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Sincronize suas finanças</p>
          <p className="text-[11px] text-muted-foreground">Conecte seus bancos para importar transações.</p>
        </div>
        <button className="shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-[10px] font-bold text-primary-foreground active:scale-95 transition-transform whitespace-nowrap">
          Conectar Bancos
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-around fade-in-up stagger-1">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button key={action.label} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${action.bg}`}>
                <Icon size={20} className={action.color} />
              </div>
              <span className="text-[10px] text-muted-foreground">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SyncBanner;
