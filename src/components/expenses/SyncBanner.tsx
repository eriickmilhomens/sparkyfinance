import { useState, useRef } from "react";
import { Wallet, TrendingDown, TrendingUp, ScanLine, Download, Target } from "lucide-react";
import AddExpenseModal from "@/components/expenses/AddExpenseModal";
import PluggyConnectModal from "./PluggyConnectModal";
import ImportModal from "./ImportModal";

interface SyncBannerProps {
  onNavigateToMetas?: () => void;
  hideSyncBanner?: boolean;
}

const SyncBanner = ({ onNavigateToMetas, hideSyncBanner }: SyncBannerProps) => {
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseModalType, setExpenseModalType] = useState<"expense" | "income">("expense");
  const [pluggyOpen, setPluggyOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDespesa = () => {
    setExpenseModalType("expense");
    setExpenseModalOpen(true);
  };

  const handleReceita = () => {
    setExpenseModalType("income");
    setExpenseModalOpen(true);
  };

  const handleScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      stream.getTracks().forEach(t => t.stop());
      alert("Funcionalidade de escaneamento de NFC-e será implementada com OCR/IA.");
    } catch {
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`Arquivo "${file.name}" selecionado. A categorização por IA será processada.`);
    }
    e.target.value = "";
  };

  const quickActions = [
    { label: "Despesa", icon: TrendingDown, bg: "bg-destructive/15", color: "text-destructive", onClick: handleDespesa },
    { label: "Receita", icon: TrendingUp, bg: "bg-success/15", color: "text-success", onClick: handleReceita },
    { label: "Escanear", icon: ScanLine, bg: "bg-primary/15", color: "text-primary", onClick: handleScan },
    { label: "Importar", icon: Download, bg: "bg-purple-500/15", color: "text-purple-400", onClick: () => setImportOpen(true) },
    { label: "Metas", icon: Target, bg: "bg-warning/15", color: "text-warning", onClick: () => onNavigateToMetas?.() },
  ];

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.ofx,.txt,.pdf,.xlsx"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Sync Banner — hidden when prop is true */}
      {!hideSyncBanner && (
        <div className="card-zelo fade-in-up flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <Wallet size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Sincronize suas finanças</p>
            <p className="text-[11px] text-muted-foreground">Conecte seus bancos para importar transações.</p>
          </div>
          <button
            onClick={() => setPluggyOpen(true)}
            className="shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-[10px] font-bold text-primary-foreground active:scale-95 transition-transform whitespace-nowrap"
          >
            Conectar Bancos
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center justify-around fade-in-up stagger-1">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${action.bg}`}>
                <Icon size={20} className={action.color} />
              </div>
              <span className="text-[10px] text-muted-foreground">{action.label}</span>
            </button>
          );
        })}
      </div>

      <AddExpenseModal open={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} type={expenseModalType} />
      <PluggyConnectModal open={pluggyOpen} onClose={() => setPluggyOpen(false)} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
};

export default SyncBanner;
