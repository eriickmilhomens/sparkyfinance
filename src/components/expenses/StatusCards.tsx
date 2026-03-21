import { PiggyBank, CalendarClock, Banknote } from "lucide-react";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";

const StatusCards = () => {
  const { data, available } = useFinancialData();

  const statuses = [
    { label: "Saldo Real", value: fmt(data.balance), color: "text-foreground", sub: "em conta agora", icon: PiggyBank, iconColor: "text-primary" },
    { label: "A Pagar", value: fmt(data.scheduled), color: "text-warning", sub: "total agendado", icon: CalendarClock, iconColor: "text-warning" },
    { label: "Saldo Disponível", value: fmt(available), color: "text-success", sub: "livre após todas as contas agendadas", icon: Banknote, iconColor: "text-success" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {statuses.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className={`card-zelo fade-in-up stagger-${i + 1} !py-3 !px-2.5`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={15} className={s.iconColor} />
              <p className="text-[11px] font-medium text-muted-foreground">{s.label}</p>
            </div>
            <p className={`text-sm font-bold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{s.sub}</p>
          </div>
        );
      })}
    </div>
  );
};

export default StatusCards;
