import { useState } from "react";
import { Landmark, MessageCircle, X, ArrowLeft } from "lucide-react";
import PluggyConnectModal from "@/components/expenses/PluggyConnectModal";

const SuggestionsCard = () => {
  const [pluggyOpen, setPluggyOpen] = useState(false);
  const [whatsappPopup, setWhatsappPopup] = useState(false);

  return (
    <div className="space-y-2">
      <p className="text-label px-1">SUGESTÕES PARA VOCÊ</p>
      
      <div className="card-zelo fade-in-up stagger-1 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
          <Landmark size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Sincronize suas finanças</p>
          <p className="text-[11px] text-muted-foreground">Importe suas transações bancárias automaticamente.</p>
        </div>
        <button
          onClick={() => setPluggyOpen(true)}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-[10px] font-bold text-primary-foreground active:scale-95 transition-transform"
        >
          Conectar
        </button>
      </div>

      <div className="card-zelo fade-in-up stagger-2 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15">
          <MessageCircle size={18} className="text-success" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Assistente no WhatsApp</p>
          <p className="text-[11px] text-muted-foreground">Converse com nossa IA pelo WhatsApp para lançar gastos.</p>
        </div>
        <button
          onClick={() => setWhatsappPopup(true)}
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground active:scale-95 transition-transform"
        >
          Desativado
        </button>
      </div>

      {/* WhatsApp popup */}
      {whatsappPopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setWhatsappPopup(false)} />
          <div className="relative w-[85%] max-w-sm rounded-2xl bg-card border border-border p-5 shadow-xl animate-scale-in">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-14 w-14 rounded-full bg-success/15 flex items-center justify-center">
                <MessageCircle size={24} className="text-success" />
              </div>
              <h3 className="text-base font-bold">Em breve!</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O assistente via WhatsApp ainda está em implementação. Em breve você poderá lançar gastos e consultar seu saldo diretamente pelo WhatsApp!
              </p>
              <button
                onClick={() => setWhatsappPopup(false)}
                className="w-full rounded-xl border border-border py-2.5 text-xs font-medium text-muted-foreground active:scale-[0.98] transition-all mt-1"
              >
                <ArrowLeft size={12} className="inline mr-1" />
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      <PluggyConnectModal open={pluggyOpen} onClose={() => setPluggyOpen(false)} />
    </div>
  );
};

export default SuggestionsCard;
