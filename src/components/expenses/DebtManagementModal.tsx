import { X, CreditCard, ArrowLeft } from "lucide-react";
import { useDockVisibility } from "@/hooks/useDockVisibility";

interface DebtManagementModalProps {
  open: boolean;
  onClose: () => void;
}

const DebtManagementModal = ({ open, onClose }: DebtManagementModalProps) => {
  useDockVisibility(open);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-slide-up rounded-t-3xl bg-card border-t border-border p-5 pb-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold">Gestão de Dívidas</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CreditCard size={12} className="text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Cartões e Dívidas</span>
            </div>
          </div>
        </div>

        <div className="card-zelo mb-5">
          <p className="text-sm font-semibold mb-4">Novo Cartão / Dívida</p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nome do cartão"
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Juros Mensal (%)"
                className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all tabular-nums"
              />
              <input
                type="text"
                placeholder="Dia Vencimento"
                className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all tabular-nums"
              />
            </div>
            <input
              type="text"
              placeholder="Mínimo (%)"
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all tabular-nums"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground active:scale-[0.98] transition-all"
          >
            Cancelar
          </button>
          <button className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98]">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebtManagementModal;
