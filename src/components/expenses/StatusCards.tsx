import { useState } from "react";
import { PiggyBank, CalendarClock, Banknote, Info, X } from "lucide-react";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";
import APagarModal from "./APagarModal";

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
  const { data, available } = useFinancialData();
  const [aPagarOpen, setAPagarOpen] = useState(false);
  const [infoPopup, setInfoPopup] = useState<string | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthExpenses = data.transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === "expense" && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const nextMonth = (currentMonth + 1) % 12;
  const nextYear = nextMonth === 0 ? currentYear + 1 : currentYear;
  const nextMonthExpenses = data.transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === "expense" && d.getMonth() === nextMonth && d.getFullYear() === nextYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const aPagar = data.scheduled > 0 ? data.scheduled : (currentMonthExpenses > 0 ? currentMonthExpenses : nextMonthExpenses);
  const aPagarLabel = data.scheduled > 0 ? "total agendado" : (currentMonthExpenses > 0 ? "gastos este mês" : "gastos próximo mês");

  const statuses = [
    { label: "Saldo Real", value: fmt(data.balance), color: "text-foreground", sub: "em conta agora", icon: PiggyBank, iconColor: "text-primary", clickable: false, infoKey: "saldo" },
    { label: "A Pagar", value: fmt(aPagar), color: "text-warning", sub: aPagarLabel, icon: CalendarClock, iconColor: "text-warning", clickable: true, infoKey: null },
    { label: "Saldo Disponível", value: fmt(available), color: "text-success", sub: "livre após contas", icon: Banknote, iconColor: "text-success", clickable: false, infoKey: "disponivel" },
  ];

  const infoTexts: Record<string, { title: string; message: string }> = {
    saldo: {
      title: "Saldo Real",
      message: "O Saldo Real representa o valor total que você possui em conta neste momento. Ele é atualizado automaticamente conforme você registra receitas, despesas, pagamentos de faturas e ajustes manuais. É o valor bruto antes de descontar contas pendentes.",
    },
    disponivel: {
      title: "Saldo Disponível",
      message: "O Saldo Disponível é o valor que sobra após descontar todas as contas agendadas e pendentes do seu saldo real. Este é o valor que você realmente pode gastar sem comprometer suas obrigações financeiras do mês.",
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
              <p className={`text-sm font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{s.sub}</p>
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
