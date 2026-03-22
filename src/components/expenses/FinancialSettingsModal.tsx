import { useState, useEffect, useCallback } from "react";
import { handleBRLChange } from "@/lib/brlInput";
import { X, Link2, Trash2, AlertTriangle, Info, Bell, BellOff, CreditCard, CalendarClock, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useDockVisibility } from "@/hooks/useDockVisibility";

interface FinancialSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SETTINGS_KEY = "sparky-financial-settings";

interface FinSettings {
  reserveMode: "percent" | "fixed";
  reservePercent: number;
  reserveFixed: string;
  weekendWeight: number;
  lowBalanceAlert: string;
  alertsEnabled: boolean;
  dueDateAlert: boolean;
  invoiceAlert: boolean;
}

const defaultSettings: FinSettings = {
  reserveMode: "percent",
  reservePercent: 10,
  reserveFixed: "",
  weekendWeight: 1.5,
  lowBalanceAlert: "500",
  alertsEnabled: true,
  dueDateAlert: true,
  invoiceAlert: true,
};

const loadSettings = (): FinSettings => {
  try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; }
  catch { return { ...defaultSettings }; }
};

const FinancialSettingsModal = ({ open, onClose }: FinancialSettingsModalProps) => {
  const [settings, setSettings] = useState<FinSettings>(loadSettings);
  useDockVisibility(open);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showConnectionPopup, setShowConnectionPopup] = useState(false);
  const [showReserveInfo, setShowReserveInfo] = useState(false);
  const [showWeekendInfo, setShowWeekendInfo] = useState(false);
  const { clearAll } = useFinancialData();

  // Auto-save on any change
  const updateSetting = useCallback(<K extends keyof FinSettings>(key: K, value: FinSettings[K]) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  if (!open) return null;

  const handleClearAllData = () => {
    clearAll();
    setConfirmClear(false);
    toast.success("Todos os dados foram apagados com sucesso.");
    onClose();
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-slide-up rounded-t-3xl bg-card border-t border-border p-5 pb-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Configurações Financeiras</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Open Finance - Disabled */}
          <div className="card-zelo">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                <Link2 size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Open Finance</p>
                <p className="text-[10px] text-muted-foreground">Conecte suas contas bancárias</p>
              </div>
            </div>
            <button
              onClick={() => setShowConnectionPopup(true)}
              className="w-full rounded-xl border border-border py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground active:scale-[0.98] transition-all"
            >
              Gerenciar Conexões
            </button>
          </div>

          {/* Reserva de Segurança */}
          <div className="card-zelo">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Reserva de Segurança</p>
              <button onClick={() => setShowReserveInfo(true)} className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all">
                <Info size={12} />
              </button>
            </div>
            <div className="flex gap-1 rounded-xl bg-muted/50 p-1 mb-4">
              <button
                onClick={() => updateSetting("reserveMode", "percent")}
                className={cn("flex-1 rounded-lg py-2 text-xs font-medium transition-all active:scale-[0.97]",
                  settings.reserveMode === "percent" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
              >
                Porcentagem
              </button>
              <button
                onClick={() => updateSetting("reserveMode", "fixed")}
                className={cn("flex-1 rounded-lg py-2 text-xs font-medium transition-all active:scale-[0.97]",
                  settings.reserveMode === "fixed" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
              >
                Valor Fixo
              </button>
            </div>
            {settings.reserveMode === "percent" ? (
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[11px] text-muted-foreground">Percentual</span>
                  <span className="text-sm font-bold text-primary tabular-nums">{settings.reservePercent}%</span>
                </div>
                <input type="range" min={0} max={50} value={settings.reservePercent}
                  onChange={(e) => updateSetting("reservePercent", Number(e.target.value))}
                  className="w-full accent-primary h-1.5" />
              </div>
            ) : (
              <input type="text" inputMode="numeric" placeholder="R$ 0,00" value={settings.reserveFixed}
                onChange={(e) => updateSetting("reserveFixed", handleBRLChange(e.target.value))}
                className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary transition-all tabular-nums" />
            )}
          </div>

          {/* Gastos no Fim de Semana */}
          <div className="card-zelo">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Gastos no Fim de Semana</p>
              <button onClick={() => setShowWeekendInfo(true)} className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all">
                <Info size={12} />
              </button>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-[11px] text-muted-foreground">Peso</span>
              <span className="text-sm font-bold text-primary tabular-nums">{settings.weekendWeight.toFixed(1)}x</span>
            </div>
            <input type="range" min={1} max={3} step={0.1} value={settings.weekendWeight}
              onChange={(e) => updateSetting("weekendWeight", Number(e.target.value))}
              className="w-full accent-primary h-1.5" />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">1x</span>
              <span className="text-[9px] text-muted-foreground">3x</span>
            </div>
          </div>

          {/* Notificações e Alertas */}
          <div className="card-zelo">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {settings.alertsEnabled ? <Bell size={16} className="text-primary" /> : <BellOff size={16} className="text-muted-foreground" />}
                <p className="text-sm font-semibold">Notificações e Alertas</p>
              </div>
              <button
                onClick={() => updateSetting("alertsEnabled", !settings.alertsEnabled)}
                className={cn("h-6 w-11 rounded-full transition-colors duration-200", settings.alertsEnabled ? "bg-primary" : "bg-muted")}
              >
                <div className={cn("h-5 w-5 rounded-full bg-foreground transition-transform duration-200 ml-0.5", settings.alertsEnabled && "translate-x-5")} />
              </button>
            </div>
            {settings.alertsEnabled && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block">Alerta de saldo baixo (R$)</label>
                  <input type="text" value={settings.lowBalanceAlert}
                    onChange={(e) => updateSetting("lowBalanceAlert", e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary transition-all tabular-nums" />
                </div>
                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarClock size={14} className="text-warning" />
                    <span className="text-xs">Aviso de vencimento de fatura</span>
                  </div>
                  <button
                    onClick={() => updateSetting("invoiceAlert", !settings.invoiceAlert)}
                    className={cn("h-5 w-9 rounded-full transition-colors duration-200", settings.invoiceAlert ? "bg-primary" : "bg-muted")}
                  >
                    <div className={cn("h-4 w-4 rounded-full bg-foreground transition-transform duration-200 ml-0.5", settings.invoiceAlert && "translate-x-4")} />
                  </button>
                </label>
                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-destructive" />
                    <span className="text-xs">Alerta de data de pagamento</span>
                  </div>
                  <button
                    onClick={() => updateSetting("dueDateAlert", !settings.dueDateAlert)}
                    className={cn("h-5 w-9 rounded-full transition-colors duration-200", settings.dueDateAlert ? "bg-primary" : "bg-muted")}
                  >
                    <div className={cn("h-4 w-4 rounded-full bg-foreground transition-transform duration-200 ml-0.5", settings.dueDateAlert && "translate-x-4")} />
                  </button>
                </label>
              </div>
            )}
          </div>

          {/* Zona de Perigo */}
          <div className="card-zelo border border-destructive/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/15">
                <Trash2 size={16} className="text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-destructive">Zona de Perigo</p>
                <p className="text-[10px] text-muted-foreground">Apague todos os dados financeiros</p>
              </div>
            </div>
            <button onClick={() => setConfirmClear(true)}
              className="w-full rounded-xl border border-destructive/30 bg-destructive/10 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/20 active:scale-[0.98] transition-all">
              Limpar Todos os Dados
            </button>
          </div>
        </div>

        {/* Connection Popup */}
        {showConnectionPopup && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConnectionPopup(false)} />
            <div className="relative w-[85%] max-w-sm rounded-2xl bg-card border border-border p-6 space-y-4 animate-scale-in text-center">
              <div className="h-12 w-12 mx-auto rounded-full bg-primary/15 flex items-center justify-center">
                <Link2 size={22} className="text-primary" />
              </div>
              <h3 className="text-base font-bold">Em desenvolvimento</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                O sistema de conexões bancárias via Open Finance ainda está sendo implementado. Em breve você poderá sincronizar suas contas automaticamente.
              </p>
              <button onClick={() => setShowConnectionPopup(false)}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.98] transition-all">
                Entendi
              </button>
            </div>
          </div>
        )}

        {/* Reserve Info Popup */}
        {showReserveInfo && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReserveInfo(false)} />
            <div className="relative w-[90%] max-w-sm rounded-2xl bg-card border border-border p-6 space-y-4 animate-scale-in">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <TrendingDown size={20} className="text-primary" />
                </div>
                <h3 className="text-base font-bold">Reserva de Segurança</h3>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                <p>A Reserva de Segurança define uma porcentagem (ou valor fixo) do seu saldo que o Sparky vai proteger automaticamente.</p>
                <p>Esse valor fica guardado e não entra no cálculo de "quanto posso gastar hoje", ajudando você a manter uma reserva para emergências.</p>
                <p>Por exemplo, com 10% de reserva sobre R$ 5.000, o Sparky vai considerar apenas R$ 4.500 como disponível para gastos diários.</p>
              </div>
              <button onClick={() => setShowReserveInfo(false)}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.98] transition-all">
                Voltar
              </button>
            </div>
          </div>
        )}

        {/* Weekend Info Popup */}
        {showWeekendInfo && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWeekendInfo(false)} />
            <div className="relative w-[90%] max-w-sm rounded-2xl bg-card border border-border p-6 space-y-4 animate-scale-in">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-warning/15 flex items-center justify-center">
                  <CalendarClock size={20} className="text-warning" />
                </div>
                <h3 className="text-base font-bold">Gastos no Fim de Semana</h3>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                <p>O peso de fim de semana multiplica o limite diário nos sábados e domingos, permitindo que você gaste mais nesses dias.</p>
                <p>Com peso 1.5x, se seu limite diário é R$ 100, nos fins de semana ele sobe para R$ 150. Para compensar, os dias úteis ficam levemente menores.</p>
                <p>Ajuste para 1.0x se prefere manter o mesmo limite todos os dias, ou aumente para 2-3x se seus gastos se concentram nos fins de semana.</p>
              </div>
              <button onClick={() => setShowWeekendInfo(false)}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.98] transition-all">
                Voltar
              </button>
            </div>
          </div>
        )}

        {/* Confirm Clear */}
        {confirmClear && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmClear(false)} />
            <div className="relative w-[90%] max-w-sm rounded-2xl bg-card border border-border p-6 space-y-4 animate-scale-in">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15">
                  <AlertTriangle size={20} className="text-destructive" />
                </div>
                <h3 className="text-base font-bold">Tem certeza?</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Esta ação irá <span className="font-semibold text-destructive">apagar permanentemente</span> todos os seus dados financeiros.
              </p>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setConfirmClear(false)} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground active:scale-[0.97] transition-all">
                  Cancelar
                </button>
                <button onClick={handleClearAllData} className="flex-1 rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground active:scale-[0.97] transition-all">
                  Apagar Tudo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialSettingsModal;
