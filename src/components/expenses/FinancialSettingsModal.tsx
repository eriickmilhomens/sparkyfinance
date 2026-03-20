import { useState } from "react";
import { X, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const FinancialSettingsModal = ({ open, onClose }: FinancialSettingsModalProps) => {
  const [reserveMode, setReserveMode] = useState<"percent" | "fixed">("percent");
  const [reservePercent, setReservePercent] = useState(10);
  const [weekendWeight, setWeekendWeight] = useState(1.5);
  const [lowBalanceAlert, setLowBalanceAlert] = useState("500");
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  if (!open) return null;

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
          {/* Open Finance */}
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
            <button className="w-full rounded-xl border border-border py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground active:scale-[0.98] transition-all">
              Gerenciar Conexões
            </button>
          </div>

          {/* Reserva de Segurança */}
          <div className="card-zelo">
            <p className="text-sm font-semibold mb-3">Reserva de Segurança</p>
            <div className="flex gap-1 rounded-xl bg-muted/50 p-1 mb-4">
              <button
                onClick={() => setReserveMode("percent")}
                className={cn(
                  "flex-1 rounded-lg py-2 text-xs font-medium transition-all active:scale-[0.97]",
                  reserveMode === "percent" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Porcentagem
              </button>
              <button
                onClick={() => setReserveMode("fixed")}
                className={cn(
                  "flex-1 rounded-lg py-2 text-xs font-medium transition-all active:scale-[0.97]",
                  reserveMode === "fixed" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Valor Fixo
              </button>
            </div>
            {reserveMode === "percent" ? (
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[11px] text-muted-foreground">Percentual</span>
                  <span className="text-sm font-bold text-primary tabular-nums">{reservePercent}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={reservePercent}
                  onChange={(e) => setReservePercent(Number(e.target.value))}
                  className="w-full accent-primary h-1.5"
                />
              </div>
            ) : (
              <input
                type="text"
                placeholder="R$ 0,00"
                className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all tabular-nums"
              />
            )}
          </div>

          {/* Gastos no Fim de Semana */}
          <div className="card-zelo">
            <p className="text-sm font-semibold mb-3">Gastos no Fim de Semana</p>
            <div className="flex justify-between mb-2">
              <span className="text-[11px] text-muted-foreground">Peso</span>
              <span className="text-sm font-bold text-primary tabular-nums">{weekendWeight}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={weekendWeight}
              onChange={(e) => setWeekendWeight(Number(e.target.value))}
              className="w-full accent-primary h-1.5"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">1x</span>
              <span className="text-[9px] text-muted-foreground">3x</span>
            </div>
          </div>

          {/* Notificações e Alertas */}
          <div className="card-zelo">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Notificações e Alertas</p>
              <button
                onClick={() => setAlertsEnabled(!alertsEnabled)}
                className={cn("h-6 w-11 rounded-full transition-colors duration-200", alertsEnabled ? "bg-primary" : "bg-muted")}
              >
                <div className={cn("h-5 w-5 rounded-full bg-foreground transition-transform duration-200 ml-0.5", alertsEnabled && "translate-x-5")} />
              </button>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block">Alerta de saldo baixo (R$)</label>
              <input
                type="text"
                value={lowBalanceAlert}
                onChange={(e) => setLowBalanceAlert(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all tabular-nums"
              />
            </div>
          </div>
        </div>

        <button className="w-full mt-5 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98]">
          Salvar Configurações
        </button>
      </div>
    </div>
  );
};

export default FinancialSettingsModal;
