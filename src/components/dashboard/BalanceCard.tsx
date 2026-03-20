import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const BalanceCard = () => {
  const [visible, setVisible] = useState(true);

  return (
    <div className="card-zelo fade-in-up">
      <div className="flex items-center justify-between mb-1">
        <span className="text-label">Saldo Disponível</span>
        <button
          onClick={() => setVisible(!visible)}
          className="text-muted-foreground active:scale-95 transition-transform"
        >
          {visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>
      <p className="text-3xl font-extrabold tracking-tight tabular-nums">
        {visible ? "R$ 3.247,50" : "••••••"}
      </p>
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Receitas: <span className="text-success font-medium">R$ 6.500</span></span>
          <span className="text-border">•</span>
          <span>Despesas: <span className="text-destructive font-medium">R$ 3.252</span></span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Livre após contas agendadas
        </p>
      </div>
    </div>
  );
};

export default BalanceCard;
