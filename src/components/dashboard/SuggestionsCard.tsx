import { useState, useMemo } from "react";
import { Landmark, MessageCircle, ArrowLeft, Lightbulb, TrendingDown, PiggyBank, Target, Sparkles } from "lucide-react";
import PluggyConnectModal from "@/components/expenses/PluggyConnectModal";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";

const SuggestionsCard = () => {
  const [pluggyOpen, setPluggyOpen] = useState(false);
  const [whatsappPopup, setWhatsappPopup] = useState(false);
  const { data, available, dailyBudget, daysLeft } = useFinancialData();

  const hasFinancialData = data.balance > 0 || data.income > 0 || data.expenses > 0;

  // Dynamic tips based on user's real financial data
  const dynamicTips = useMemo(() => {
    const tips: { icon: any; bg: string; color: string; title: string; desc: string }[] = [];

    if (!hasFinancialData) {
      tips.push({
        icon: Sparkles, bg: "bg-primary/15", color: "text-primary",
        title: "Comece agora!",
        desc: "Adicione sua primeira receita ou despesa para ativar seus insights financeiros.",
      });
      return tips;
    }

    const expenseRatio = data.income > 0 ? data.expenses / data.income : 0;

    // High spending warning
    if (expenseRatio > 0.8) {
      tips.push({
        icon: TrendingDown, bg: "bg-destructive/15", color: "text-destructive",
        title: "Atenção aos gastos!",
        desc: `Você já gastou ${(expenseRatio * 100).toFixed(0)}% da sua receita. Reduza despesas não essenciais.`,
      });
    }

    // Savings encouragement
    if (available > 0 && expenseRatio < 0.6) {
      tips.push({
        icon: PiggyBank, bg: "bg-success/15", color: "text-success",
        title: "Ótimo ritmo de economia!",
        desc: `Você ainda tem ${fmt(available)} disponível. Considere investir parte desse valor.`,
      });
    }

    // Daily budget tip
    if (dailyBudget > 0) {
      tips.push({
        icon: Target, bg: "bg-warning/15", color: "text-warning",
        title: `${fmt(dailyBudget)}/dia`,
        desc: `Seu limite diário para os próximos ${daysLeft} dias. Fique dentro para fechar o mês no verde!`,
      });
    }

    // General motivation
    if (tips.length === 0) {
      tips.push({
        icon: Lightbulb, bg: "bg-primary/15", color: "text-primary",
        title: "Dica do Sparky",
        desc: "Revise seus gastos semanalmente para identificar oportunidades de economia.",
      });
    }

    return tips.slice(0, 2);
  }, [hasFinancialData, data, available, dailyBudget, daysLeft]);

  return (
    <div className="space-y-2">
      <p className="text-label px-1">SUGESTÕES PARA VOCÊ</p>

      {dynamicTips.map((tip, i) => {
        const Icon = tip.icon;
        return (
          <div key={i} className={`card-zelo fade-in-up stagger-${i + 1} flex items-center gap-3`}>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tip.bg}`}>
              <Icon size={18} className={tip.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{tip.title}</p>
              <p className="text-[11px] text-muted-foreground">{tip.desc}</p>
            </div>
          </div>
        );
      })}

      <div className="card-zelo fade-in-up stagger-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
          <Landmark size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Sincronize suas finanças</p>
          <p className="text-[11px] text-muted-foreground">Importe transações bancárias automaticamente.</p>
        </div>
        <button
          onClick={() => setPluggyOpen(true)}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-[10px] font-bold text-primary-foreground active:scale-95 transition-transform"
        >
          Conectar
        </button>
      </div>

      <div className="card-zelo fade-in-up stagger-4 flex items-center gap-3">
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
