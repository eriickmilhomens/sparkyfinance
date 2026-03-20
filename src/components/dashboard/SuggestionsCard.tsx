import { Landmark, MessageCircle } from "lucide-react";

const SuggestionsCard = () => {
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
        <button className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-[10px] font-bold text-primary-foreground active:scale-95 transition-transform">
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
        <button className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground active:scale-95 transition-transform">
          Ativar
        </button>
      </div>
    </div>
  );
};

export default SuggestionsCard;
