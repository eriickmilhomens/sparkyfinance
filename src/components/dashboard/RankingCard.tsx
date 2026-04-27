import { Crown, TrendingUp, Users } from "lucide-react";
import { usePoints } from "@/hooks/usePoints";
import { useProfile } from "@/hooks/useProfile";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import InfoButton from "@/components/InfoButton";

const RankingCard = () => {
  const { currentPoints, monthlyEarnings } = usePoints();
  const { profile } = useProfile();
  const { members, currentUserRank, isLeader } = useGroupMembers();

  if (!profile) return null;

  const isUserLeader = members.length > 0 && members.find(m => m.user_id === profile.user_id && isLeader(m));
  const roleLabel = isUserLeader ? "Líder" : currentUserRank > 0 ? `${currentUserRank}º lugar` : "Líder";

  // Show leader info even when alone
  const displayMembers = members.length > 0 ? members : [];

  return (
    <div className="card-zelo fade-in-up stagger-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15">
            <Crown size={18} className="text-warning" />
          </div>
          <div>
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-semibold">Ranking</p>
              <InfoButton
                title="Ranking de Pontos"
                description="Você ganha pontos por boas práticas financeiras: pagar contas em dia, registrar despesas, atingir metas. Compare seu desempenho com outros membros do grupo."
                align="left"
              />
            </div>
            <p className="text-xs text-muted-foreground">{profile.name} • {roleLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1">
          <TrendingUp size={12} className="text-warning" />
          <span className="text-xs font-bold text-warning tabular-nums">{currentPoints} pts</span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        {monthlyEarnings > 0 && (
          <p className="text-[10px] text-success font-medium">+{monthlyEarnings} pontos este mês</p>
        )}
        {displayMembers.length > 1 ? (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Users size={10} /> {displayMembers.length} membros
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Users size={10} /> Apenas você no grupo
          </p>
        )}
      </div>
    </div>
  );
};

export default RankingCard;
