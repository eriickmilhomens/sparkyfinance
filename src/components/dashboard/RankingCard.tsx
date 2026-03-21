import { Crown, TrendingUp } from "lucide-react";
import { usePoints } from "@/hooks/usePoints";
import { useProfile } from "@/hooks/useProfile";

const RankingCard = () => {
  const { currentPoints, monthlyEarnings } = usePoints();
  const { profile } = useProfile();

  if (!profile) return null;

  return (
    <div className="card-zelo fade-in-up stagger-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15">
            <Crown size={18} className="text-warning" />
          </div>
          <div>
            <p className="text-sm font-semibold">Ranking</p>
            <p className="text-xs text-muted-foreground">{profile.name} • Líder</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1">
          <TrendingUp size={12} className="text-warning" />
          <span className="text-xs font-bold text-warning tabular-nums">{currentPoints} pts</span>
        </div>
      </div>
      {monthlyEarnings > 0 && (
        <p className="text-[10px] text-success font-medium mt-2">+{monthlyEarnings} pontos este mês</p>
      )}
    </div>
  );
};

export default RankingCard;
