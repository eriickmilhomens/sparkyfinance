import { useState } from "react";
import { PiggyBank, CalendarClock, Banknote, Info, CheckCircle } from "lucide-react";
import { useFinancialData, fmt } from "@/hooks/useFinancialData";
import APagarModal from "./APagarModal";
import { cn } from "@/lib/utils";

const StatusCards = () => {
  const { data, available, pendingTotal, pendingCount, allPaid } = useFinancialData();
  const [aPagarOpen, setAPagarOpen] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null);
  const saldoDisponivel = available;
  const isNegative = available < 0;

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
      sub: allPaid ? "Contas todas pagas" : `${pendingCount} pendente(s)`,
      allPaid,
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
      message: "O valor A Pagar representa apenas contas planejadas, assinaturas e faturas ainda pendentes no mês atual. Essas pendências não reduzem o saldo real até o pagamento ser confirmado.",
    },
    disponivel: {
      title: "Saldo Disponível",
      message: "O Saldo Disponível é o valor que sobra após descontar contas pendentes e valores já reservados em metas do seu saldo real. Reservar para metas reduz o disponível, mas nunca o saldo real.",
    },
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2" style={{ alignItems: "start" }}>
        {statuses.map((s, i) => {
          const Icon = s.icon;
          const isExpanded = expandedInfo === s.infoKey;
          const infoData = s.infoKey ? infoTexts[s.infoKey] : null;

          const content = (
            <>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon size={15} className={s.iconColor} />
                  <p className="text-[11px] font-medium text-muted-foreground">{s.label}</p>
                </div>
                {s.infoKey && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedInfo(isExpanded ? null : s.infoKey!);
                    }}
                    className={cn(
                      "p-0.5 rounded active:scale-90 transition-all",
                      isExpanded ? "text-primary" : "text-muted-foreground/50 hover:text-muted-foreground"
                    )}
                  >
                    <Info size={11} />
                  </button>
                )}
              </div>
              {s.value ? <p className={cn("text-sm font-bold tabular-nums", s.color)}>{s.value}</p> : null}
              <p className={cn("text-[9px] mt-0.5 leading-tight flex items-center gap-0.5", isNegative && s.infoKey === "disponivel" ? "text-destructive/80" : "text-muted-foreground")}>
                {(s as any).allPaid && s.infoKey === "apagar" && <CheckCircle size={9} className="text-success shrink-0" />}
                {s.sub}
              </p>
              {/* Inline collapsible info */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: isExpanded ? "120px" : "0px",
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                {infoData && (
                  <p className="text-[8px] text-muted-foreground leading-relaxed mt-1.5 pt-1.5 border-t border-border/50">
                    {infoData.message}
                  </p>
                )}
              </div>
            </>
          );

          if (s.clickable) {
            return (
              <button
                key={s.label}
                onClick={() => setAPagarOpen(true)}
                className={`card-zelo fade-in-up stagger-${i + 1} !py-3 !px-2.5 text-left cursor-pointer hover:border-warning/40 active:scale-[0.97] transition-all flex flex-col`}
              >
                {content}
              </button>
            );
          }

          return (
            <div key={s.label} className={`card-zelo fade-in-up stagger-${i + 1} !py-3 !px-2.5 flex flex-col`}>
              {content}
            </div>
          );
        })}
      </div>
      <APagarModal open={aPagarOpen} onClose={() => setAPagarOpen(false)} />
    </>
  );
};

export default StatusCards;