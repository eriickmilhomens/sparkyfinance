const statuses = [
  { label: "Saldo Real", value: "R$ 4.832,00", color: "text-foreground", sub: "em conta agora" },
  { label: "A Pagar", value: "R$ 1.584,50", color: "text-warning", sub: "total agendado" },
  { label: "Saldo Disponível", value: "R$ 3.247,50", color: "text-success", sub: "livre após todas as contas agendadas" },
];

const StatusCards = () => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {statuses.map((s, i) => (
        <div key={s.label} className={`card-zelo text-center fade-in-up stagger-${i + 1}`}>
          <p className="text-label mb-1">{s.label}</p>
          <p className={`text-sm font-bold tabular-nums ${s.color}`}>{s.value}</p>
          <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{s.sub}</p>
        </div>
      ))}
    </div>
  );
};

export default StatusCards;
