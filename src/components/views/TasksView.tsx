import { useMemo } from "react";
import { Crown, TrendingUp, Star, Trophy, Flame, Target, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useProfile } from "@/hooks/useProfile";
import { useGroupMembers } from "@/hooks/useGroupMembers";

const CompletedBadge = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
    <circle cx="12" cy="12" r="10" fill="hsl(var(--success))" opacity="0.2" />
    <circle cx="12" cy="12" r="8" fill="hsl(var(--success))" opacity="0.3" />
    <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="hsl(var(--success))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface GroupMember {
  name: string;
  points: number;
  avatar: string;
  isCurrentUser: boolean;
  isLeader: boolean;
}

const TasksView = () => {
  const { data } = useFinancialData();
  const { profile } = useProfile();
  const { members: groupMembers, isLeader } = useGroupMembers();

  const members = useMemo<GroupMember[]>(() => groupMembers.map((member) => ({
    name: member.name,
    points: member.points,
    avatar: member.name.charAt(0).toUpperCase(),
    isCurrentUser: member.user_id === profile?.user_id,
    isLeader: isLeader(member),
  })), [groupMembers, isLeader, profile?.user_id]);

  const hasTransactions = data.transactions.length > 0;
  const totalExpenses = data.expenses;
  const consecutiveDays = hasTransactions ? Math.min(7, data.transactions.length) : 0;

  const achievements = [
    {
      icon: Flame,
      label: "Sequência de registros",
      desc: "Registre gastos por 7 dias seguidos",
      pts: 20,
      color: "text-warning",
      bg: "bg-warning/12",
      progress: consecutiveDays,
      total: 7,
    },
    {
      icon: Target,
      label: "Meta do mês",
      desc: "Gaste menos que o orçamento mensal",
      pts: 50,
      color: "text-success",
      bg: "bg-success/12",
      progress: totalExpenses > 0 && data.income > 0 ? Math.min(100, Math.round((1 - totalExpenses / data.income) * 100)) : 0,
      total: 100,
    },
    {
      icon: ShieldCheck,
      label: "Reserva intacta",
      desc: "Não toque na reserva de emergência",
      pts: 30,
      color: "text-primary",
      bg: "bg-primary/12",
      progress: 0,
      total: 1,
    },
    {
      icon: Zap,
      label: "Economia rápida",
      desc: "Economize R$ 100,00 em uma semana",
      pts: 15,
      color: "text-info",
      bg: "bg-info/12",
      progress: data.income > data.expenses ? Math.min(100, Math.round(((data.income - data.expenses) / 100) * 100)) : 0,
      total: 100,
    },
  ];

  const gradients = [
    "from-primary/30 to-primary/5",
    "from-success/30 to-success/5",
    "from-destructive/30 to-destructive/5",
    "from-warning/30 to-warning/5",
  ];

  return (
    <div className="px-4 pb-24 space-y-4">
      <div className="pt-3">
        <h1 className="text-xl font-display font-bold">Ranking & Pontos</h1>
        <p className="text-xs text-muted-foreground mt-1">Compita com seu grupo e ganhe pontos por bons hábitos financeiros</p>
      </div>

      <div>
        <p className="text-label mb-2.5 px-1">RANKING DO GRUPO</p>
        <div className="space-y-2">
          {members.length === 0 ? (
            <div className="card-zelo text-center py-8 fade-in-up">
              <Crown size={24} className="text-warning mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum participante disponível ainda</p>
            </div>
          ) : (
            members.map((member, i) => (
               <div
                key={i}
                className={cn(
                  "card-zelo flex items-center gap-3 fade-in-up",
                  `stagger-${i + 1}`
                )}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-xs font-display font-bold text-muted-foreground">
                  {i + 1}
                </div>
                <div className="relative">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-display font-bold", gradients[i % gradients.length])}>
                    {member.avatar}
                  </div>
                  {i === 0 && <Crown size={11} className="absolute -top-1 -right-1 text-warning" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{member.name}</p>
                  <p className="text-[10px] text-muted-foreground">{member.isLeader ? "Líder" : member.isCurrentUser ? "Você" : "Membro"}</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-warning/10 border border-warning/20 px-2.5 py-1">
                  {i === 0 ? <Trophy size={11} className="text-warning" /> : <Star size={11} className="text-warning" />}
                  <span className="text-[11px] font-display font-bold text-warning tabular-nums">{member.points}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <p className="text-label mb-2.5 px-1">CONQUISTAS</p>
        <div className="space-y-2">
          {achievements.map((a, i) => {
            const Icon = a.icon;
            const pctDone = a.total <= 1 ? (a.progress >= a.total ? 100 : 0) : Math.round((a.progress / a.total) * 100);
            const isDone = pctDone >= 100;
            return (
              <div key={a.label} className={cn("card-zelo fade-in-up", `stagger-${i + 1}`)}>
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", a.bg)}>
                    <Icon size={17} className={a.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{a.label}</p>
                      <span className="text-[10px] font-display font-bold text-warning">+{a.pts} pts</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.desc}</p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", isDone ? "bg-success" : "bg-primary")}
                        style={{ width: `${Math.max(0, pctDone)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {isDone && <CompletedBadge />}
                      <p className="text-[9px] text-muted-foreground tabular-nums">
                        {isDone ? "Conquistado!" : `${Math.max(0, pctDone)}% concluído`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TasksView;
