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
      <div className="mt-2 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
          Pode gastar hoje: R$ 108,25
        </span>
      </div>
    </div>
  );
};

export default BalanceCard;
