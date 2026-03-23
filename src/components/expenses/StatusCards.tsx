import { useState, useMemo } from "react";
import { PiggyBank, CalendarClock, Banknote, Info, X, CheckCircle } from "lucide-react";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";
import APagarModal from "./APagarModal";
import { cn } from "@/lib/utils";

const InfoPopup = ({ title, message, onClose }: { title: string; message: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
    <div className="w-full max-w-sm card-zelo space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
            <Info size={16} className="text-primary" />
          </div>
          <h3 className="text-sm font-bold">{title}</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground"><X size={16} /></button>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
      <button onClick={onClose} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground active:scale-[0.98]">Entendi</button>
    </div>
  </div>
);

const StatusCards = () => {
  const { data } = useFinancialData();
  const [aPagarOpen, setAPagarOpen] = useState(false);
  const [infoPopup, setInfoPopup] = useState<string | null>(null);

  // SSOT: derive A Pagar from data.transactions — same source as APagarModal
  const { pendingTotal, pendingCount, allPaid } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let paidBillIds: string[] = [];
    try {
      paidBillIds = JSON.parse(localStorage.getItem("sparky-paid-bills") || "[]");
    } catch {}
    const paidSet = new Set(paidBillIds);

    // Same filter as APagarModal: current month expenses
    const bills = data.transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === "expense" && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const unpaid = bills.filter(b => !paidSet.has(b.id));
    const total = unpaid.reduce((s, t) => s + t.amount, 0);

    return {
      pendingTotal: total,
      pendingCount: unpaid.length,
      allPaid: unpaid.length === 0,
    };
  }, [data.transactions]);

  const saldoDisponivel = data.balance - pendingTotal;
  const isNegative = saldoDisponivel < 0;

  const statuses = [
    {
      label: "Saldo Real",
      value: fmt(data.balance),
      color: "text-foreground",
      sub: "em conta agora",
      icon: PiggyBank,
      iconColor: "text-primary",
      clickable: false,
      infoKey: "saldo",
    },
    {
      label: "A Pagar",
      value: allPaid ? "" : fmt(pendingTotal),
      color: "text-warning",
      sub: allPaid ? "✅ Contas todas pagas" : `${pendingCount} pendente(s)`,
      icon: CalendarClock,
      iconColor: allPaid ? "text-success" : "text-warning",
      clickable: true,
      infoKey: "apagar",
    },
    {
      label: "Saldo Disponível",
      value: fmt(saldoDisponivel),
      color: isNegative ? "text-destructive" : "text-success",
      sub: isNegative ? "saldo insuficiente!" : "livre após contas",
      icon: Banknote,
      iconColor: isNegative ? "text-destructive" : "text-success",
      clickable: false,
      infoKey: "disponivel",
    },
  ];

  const infoTexts: Record<string, { title: string; message: string }> = {
    saldo: {
      title: "Saldo Real",
      message: "O Saldo Real representa o valor total que você possui em conta neste momento. Ele é atualizado automaticamente conforme você registra receitas, despesas, pagamentos de faturas e ajustes manuais.",
    },
    apagar: {
      title: "Contas a Pagar",
      message: "O valor A Pagar representa o total de despesas registradas para o mês atual que ainda não foram marcadas como pagas. Inclui todas as categorias. Ao marcar como pago, você ganha pontos de recompensa.",
    },
    disponivel: {
      title: "Saldo Disponível",
      message: "O Saldo Disponível é o valor que sobra após descontar todas as contas pendentes do seu saldo real. Se estiver vermelho, significa que seu saldo é insuficiente para cobrir todas as contas.",
    },
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {statuses.map((s, i) => {
          const Icon = s.icon;
          const content = (
            <>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon size={15} className={s.iconColor} />
                  <p className="text-[11px] font-medium text-muted-foreground">{s.label}</p>
                </div>
                {s.infoKey && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setInfoPopup(s.infoKey!); }}
                    className="p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground active:scale-90 transition-all"
                  >
                    <Info size={11} />
                  </button>
                )}
              </div>
              {s.value ? <p className={cn("text-sm font-bold tabular-nums", s.color)}>{s.value}</p> : null}
              <p className={cn("text-[9px] mt-0.5 leading-tight", isNegative && s.infoKey === "disponivel" ? "text-destructive/80" : "text-muted-foreground")}>{s.sub}</p>
            </>
          );

          if (s.clickable) {
            return (
              <button
                key={s.label}
                onClick={() => setAPagarOpen(true)}
                className={`card-zelo fade-in-up stagger-${i + 1} !py-3 !px-2.5 text-left cursor-pointer hover:border-warning/40 active:scale-[0.97] transition-all`}
              >
                {content}
              </button>
            );
          }

          return (
            <div key={s.label} className={`card-zelo fade-in-up stagger-${i + 1} !py-3 !px-2.5`}>
              {content}
            </div>
          );
        })}
      </div>
      <APagarModal open={aPagarOpen} onClose={() => setAPagarOpen(false)} />
      {infoPopup && infoTexts[infoPopup] && (
        <InfoPopup
          title={infoTexts[infoPopup].title}
          message={infoTexts[infoPopup].message}
          onClose={() => setInfoPopup(null)}
        />
      )}
    </>
  );
};

export default StatusCards;