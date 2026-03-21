import { useState, useEffect } from "react";
import { AlertTriangle, X, WifiOff } from "lucide-react";

const SYNC_STATUS_KEY = "sparky-sync-status";
const SNAPSHOT_KEY = "sparky-daily-snapshot";

export const useSyncStatus = () => {
  const [manualMode, setManualMode] = useState(() => {
    try {
      const status = JSON.parse(localStorage.getItem(SYNC_STATUS_KEY) || "{}");
      return status.manual === true;
    } catch { return false; }
  });

  // Save daily snapshot
  useEffect(() => {
    const saveSnapshot = () => {
      try {
        const snapshot = {
          date: new Date().toISOString(),
          balance: localStorage.getItem("sparky-balance"),
          transactions: localStorage.getItem("sparky-transactions"),
          cards: localStorage.getItem("sparky-credit-cards"),
        };
        const snapshots = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || "[]");
        const today = new Date().toDateString();
        const alreadySaved = snapshots.some((s: any) => new Date(s.date).toDateString() === today);
        if (!alreadySaved) {
          snapshots.push(snapshot);
          // Keep last 30 days
          if (snapshots.length > 30) snapshots.shift();
          localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots));
        }
      } catch {}
    };
    saveSnapshot();
  }, []);

  const enableManualMode = () => {
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({ manual: true, since: new Date().toISOString() }));
    setManualMode(true);
  };

  const disableManualMode = () => {
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({ manual: false }));
    setManualMode(false);
  };

  return { manualMode, enableManualMode, disableManualMode };
};

const SyncStatusBanner = () => {
  const { manualMode } = useSyncStatus();
  const [dismissed, setDismissed] = useState(false);

  if (!manualMode || dismissed) return null;

  return (
    <div className="card-zelo !border-warning/30 !bg-warning/5 fade-in-up flex items-start gap-3 border-l-warning">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/15">
        <WifiOff size={16} className="text-warning" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <AlertTriangle size={12} className="text-warning" />
          Modo Manual Ativo
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
          A sincronização automática via Open Finance está desativada. Seus dados precisam ser inseridos manualmente. Use o botão "Importar" para adicionar transações.
        </p>
      </div>
      <button onClick={() => setDismissed(true)} className="shrink-0 text-muted-foreground hover:text-foreground">
        <X size={14} />
      </button>
    </div>
  );
};

export default SyncStatusBanner;
