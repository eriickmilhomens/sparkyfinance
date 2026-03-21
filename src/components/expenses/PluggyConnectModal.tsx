import { useState, useEffect } from "react";
import { X, Wifi, WifiOff, RefreshCw, Building2, Loader2, CheckCircle2 } from "lucide-react";
import { usePluggy } from "@/hooks/usePluggy";
import { useDockVisibility } from "@/hooks/useDockVisibility";

interface PluggyConnectModalProps {
  open: boolean;
  onClose: () => void;
}

const PluggyConnectModal = ({ open, onClose }: PluggyConnectModalProps) => {
  const {
    loading,
    error,
    accounts,
    connectedItemId,
    getConnectToken,
    saveItemId,
    fetchAccounts,
    disconnect,
  } = usePluggy();

  const [widgetOpen, setWidgetOpen] = useState(false);
  useDockVisibility(open);
  const [connectToken, setConnectToken] = useState<string | null>(null);

  useEffect(() => {
    if (open && connectedItemId) {
      fetchAccounts();
    }
  }, [open, connectedItemId, fetchAccounts]);

  // Listen for Pluggy widget messages
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "pluggy-connect" && event.data?.itemId) {
        saveItemId(event.data.itemId);
        fetchAccounts(event.data.itemId);
        setWidgetOpen(false);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [saveItemId, fetchAccounts]);

  const handleConnect = async () => {
    const token = await getConnectToken();
    if (token) {
      setConnectToken(token);
      setWidgetOpen(true);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-slide-up rounded-t-3xl bg-card border-t border-border p-5 pb-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Open Finance</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95 transition-all">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Connection Status */}
        <div className="card-zelo mb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${connectedItemId ? 'bg-success/15' : 'bg-muted'}`}>
              {connectedItemId ? <Wifi size={18} className="text-success" /> : <WifiOff size={18} className="text-muted-foreground" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {connectedItemId ? "Banco Conectado" : "Nenhuma conexão ativa"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {connectedItemId
                  ? "Suas contas estão sincronizadas automaticamente."
                  : "Conecte um banco para importar dados."}
              </p>
            </div>
            {connectedItemId && (
              <CheckCircle2 size={20} className="text-success" />
            )}
          </div>
        </div>

        {/* Connected Accounts */}
        {connectedItemId && accounts.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Contas vinculadas</p>
            {accounts.map((acc) => (
              <div key={acc.id} className="card-zelo flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                  <Building2 size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{acc.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{acc.type}</p>
                </div>
                <p className="text-sm font-bold tabular-nums">
                  R$ {acc.balance?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-xs">Processando...</span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {!connectedItemId ? (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Gerando token..." : "Conectar Banco via Pluggy"}
            </button>
          ) : (
            <>
              <button
                onClick={() => fetchAccounts()}
                disabled={loading}
                className="w-full rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                Atualizar Dados
              </button>
              <button
                onClick={handleConnect}
                disabled={loading}
                className="w-full rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-all active:scale-[0.98]"
              >
                Adicionar Outro Banco
              </button>
              <button
                onClick={disconnect}
                className="w-full rounded-xl py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all active:scale-[0.98]"
              >
                Desconectar
              </button>
            </>
          )}
        </div>

        {/* Pluggy Widget iframe */}
        {widgetOpen && connectToken && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70" onClick={() => setWidgetOpen(false)} />
            <div className="relative w-full max-w-md h-[600px] rounded-2xl overflow-hidden bg-card">
              <button
                onClick={() => setWidgetOpen(false)}
                className="absolute top-3 right-3 z-10 rounded-full bg-card p-1.5 shadow"
              >
                <X size={16} />
              </button>
              <iframe
                src={`https://connect.pluggy.ai/?connect_token=${connectToken}`}
                className="w-full h-full border-0"
                allow="camera"
                title="Pluggy Connect"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PluggyConnectModal;
