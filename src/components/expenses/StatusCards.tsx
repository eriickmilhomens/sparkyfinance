import { PiggyBank } from "lucide-react";

const statuses = [
  { label: "Saldo Real", value: "R$ 4.832,00", color: "text-foreground", sub: "em conta agora", showPiggy: true },
  { label: "A Pagar", value: "R$ 1.584,50", color: "text-warning", sub: "total agendado", showPiggy: false },
  { label: "Saldo Disponível", value: "R$ 3.247,50", color: "text-success", sub: "livre após todas as contas agendadas", showPiggy: false },
];

const StatusCards = () => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {statuses.map((s, i) => (
        <div key={s.label} className={`card-zelo text-center fade-in-up stagger-${i + 1} !py-2.5 !px-2`}>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            {s.showPiggy && <PiggyBank size={12} className="text-primary" />}
            <p className="text-label">{s.label}</p>
          </div>
          <p className={`text-xs font-bold tabular-nums ${s.color}`}>{s.value}</p>
          <p className="text-[8px] text-muted-foreground mt-0.5 leading-tight">{s.sub}</p>
        </div>
      ))}
    </div>
  );
};

export default StatusCards;
