import { useState, useMemo, useEffect } from "react";
import { Landmark, MessageCircle, ArrowLeft, Lightbulb, TrendingDown, PiggyBank, Target, Sparkles, Zap, BookOpen, Shield, Heart } from "lucide-react";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";

const ALL_TIPS = [
  { icon: Lightbulb, bg: "bg-primary/12", color: "text-primary", title: "Regra 50-30-20", desc: "Divida sua renda: 50% necessidades, 30% desejos, 20% poupança/investimentos." },
  { icon: BookOpen, bg: "bg-accent/12", color: "text-accent-foreground", title: "Revise assinaturas", desc: "Cancele serviços que você não usa. Pequenos valores somam muito no ano." },
  { icon: Shield, bg: "bg-success/12", color: "text-success", title: "Reserva de emergência", desc: "Tenha pelo menos 6 meses de despesas guardados para imprevistos." },
  { icon: Zap, bg: "bg-warning/12", color: "text-warning", title: "Evite compras por impulso", desc: "Espere 48h antes de comprar algo não essencial. A vontade geralmente passa." },
  { icon: Heart, bg: "bg-destructive/12", color: "text-destructive", title: "Invista em você", desc: "Educação financeira é o melhor investimento. Leia, estude e pratique." },
  { icon: PiggyBank, bg: "bg-success/12", color: "text-success", title: "Automatize a poupança", desc: "Configure transferências automáticas no dia do pagamento para sua reserva." },
  { icon: Target, bg: "bg-primary/12", color: "text-primary", title: "Defina metas claras", desc: "Metas específicas com prazo motivam mais do que 'quero economizar'." },
  { icon: Lightbulb, bg: "bg-warning/12", color: "text-warning", title: "Negocie contas fixas", desc: "Ligue para operadoras e peça descontos. Funciona mais do que você imagina." },
  { icon: Zap, bg: "bg-accent/12", color: "text-accent-foreground", title: "Planeje as refeições", desc: "Cozinhar em casa pode economizar até 60% comparado com delivery." },
  { icon: BookOpen, bg: "bg-primary/12", color: "text-primary", title: "Acompanhe diariamente", desc: "Anotar cada gasto cria consciência e reduz desperdícios naturalmente." },
];

const SuggestionsCard = () => {
  const [syncPopup, setSyncPopup] = useState(false);
  const [whatsappPopup, setWhatsappPopup] = useState(false);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * ALL_TIPS.length));
  const { data, available, dailyBudget, daysLeft } = useFinancialData();

  const hasFinancialData = data.balance > 0 || data.income > 0 || data.expenses > 0;

  useEffect(() => {
    const interval = setInterval(() => { setTipIndex(prev => (prev + 1) % ALL_TIPS.length); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const dynamicTips = useMemo(() => {
    const tips: { icon: any; bg: string; color: string; title: string; desc: string }[] = [];
    if (!hasFinancialData) {
      tips.push({ icon: Sparkles, bg: "bg-primary/12", color: "text-primary", title: "Comece agora!", desc: "Adicione sua primeira receita ou despesa para ativar seus insights financeiros." });
      tips.push(ALL_TIPS[tipIndex]);
      return tips;
    }
    const expenseRatio = data.income > 0 ? data.expenses / data.income : 0;
    if (expenseRatio > 0.8) {
      tips.push({ icon: TrendingDown, bg: "bg-destructive/12", color: "text-destructive", title: "Atenção aos gastos!", desc: `Você já gastou ${(expenseRatio * 100).toFixed(0)}% da sua receita. Reduza despesas não essenciais.` });
    } else if (available > 0 && expenseRatio < 0.6) {
      tips.push({ icon: PiggyBank, bg: "bg-success/12", color: "text-success", title: "Ótimo ritmo de economia!", desc: `Você ainda tem ${fmt(available)} disponível. Considere investir parte desse valor.` });
    }
    tips.push(ALL_TIPS[tipIndex]);
    return tips.slice(0, 2);
  }, [hasFinancialData, data, available, dailyBudget, daysLeft, tipIndex]);

  return (
    <div className="space-y-2">
      <p className="text-label px-1">DICAS INTELIGENTES</p>

      {dynamicTips.map((tip, i) => {
        const Icon = tip.icon;
        return (
          <div key={`${tip.title}-${tipIndex}-${i}`} className={`card-zelo fade-in-up stagger-${i + 1} flex items-center gap-3`}>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tip.bg} border border-current/5`}>
              <Icon size={18} className={tip.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{tip.title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{tip.desc}</p>
            </div>
          </div>
        );
      })}

      <div className="card-zelo fade-in-up stagger-3 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 border border-primary/10">
          <Landmark size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Sincronize suas finanças</p>
          <p className="text-[11px] text-muted-foreground">Importe transações bancárias automaticamente.</p>
        </div>
        <button onClick={() => setSyncPopup(true)} className="shrink-0 rounded-xl border border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground active:scale-95 transition-all duration-300">
          Desativado
        </button>
      </div>

      <div className="card-zelo fade-in-up stagger-4 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted border border-border/30">
          <MessageCircle size={18} className="text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Assistente no WhatsApp</p>
          <p className="text-[11px] text-muted-foreground">Converse com nossa IA pelo WhatsApp para lançar gastos.</p>
        </div>
        <button onClick={() => setWhatsappPopup(true)} className="shrink-0 rounded-xl border border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground active:scale-95 transition-all duration-300">
          Desativado
        </button>
      </div>

      {syncPopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSyncPopup(false)} />
          <div className="relative w-[85%] max-w-sm rounded-3xl bg-card/90 backdrop-blur-xl border border-border/50 p-6 shadow-2xl fade-in-up">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-3xl bg-primary/12 flex items-center justify-center glow-ring">
                <Landmark size={28} className="text-primary" />
              </div>
              <h3 className="text-base font-bold">Em desenvolvimento</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">A sincronização bancária ainda não está 100% implementada. Em breve teremos atualizações para conectar seus bancos automaticamente!</p>
              <button onClick={() => setSyncPopup(false)} className="w-full rounded-2xl border border-border py-3 text-xs font-medium text-muted-foreground active:scale-[0.98] transition-all duration-300 mt-1">
                <ArrowLeft size={12} className="inline mr-1" /> Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {whatsappPopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setWhatsappPopup(false)} />
          <div className="relative w-[85%] max-w-sm rounded-3xl bg-card/90 backdrop-blur-xl border border-border/50 p-6 shadow-2xl fade-in-up">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center">
                <MessageCircle size={28} className="text-muted-foreground" />
              </div>
              <h3 className="text-base font-bold">Em desenvolvimento</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">O assistente no WhatsApp ainda não está disponível. Em breve teremos novidades! Por enquanto, use o Spark IA dentro do app.</p>
              <button onClick={() => setWhatsappPopup(false)} className="w-full rounded-2xl border border-border py-3 text-xs font-medium text-muted-foreground active:scale-[0.98] transition-all duration-300 mt-1">
                <ArrowLeft size={12} className="inline mr-1" /> Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionsCard;
