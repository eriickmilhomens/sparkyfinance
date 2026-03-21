import { Crown, TrendingUp, Users } from "lucide-react";
import { usePoints } from "@/hooks/usePoints";
import { useProfile } from "@/hooks/useProfile";
import { useGroupMembers } from "@/hooks/useGroupMembers";

const RankingCard = () => {
  const { currentPoints, monthlyEarnings } = usePoints();
  const { profile } = useProfile();
  const { members, currentUserRank, isLeader } = useGroupMembers();

  if (!profile) return null;

  const isUserLeader = members.length > 0 && members.find(m => m.user_id === profile.user_id && isLeader(m));
  const roleLabel = isUserLeader ? "Líder" : currentUserRank > 0 ? `${currentUserRank}º lugar` : "Membro";

  return (
    <div className="card-zelo fade-in-up stagger-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15">
            <Crown size={18} className="text-warning" />
          </div>
          <div>
            <p className="text-sm font-semibold">Ranking</p>
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
        {members.length > 1 && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Users size={10} /> {members.length} membros
          </p>
        )}
      </div>
    </div>
  );
};

export default RankingCard;
