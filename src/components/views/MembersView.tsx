import { useState, useEffect } from "react";
import { Copy, Check, Crown, Star, Shield, Users, Trophy, Zap, Gift, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { usePoints, POINTS_RULES } from "@/hooks/usePoints";

const MembersView = () => {
  const [copied, setCopied] = useState(false);
  const [showPointsGuide, setShowPointsGuide] = useState(false);
  const { profile } = useProfile();
  const { currentPoints, monthlyEarnings, recentActivity } = usePoints();
  const [members, setMembers] = useState<any[]>([]);

  const groupCode = profile?.invite_code || "--------";

  useEffect(() => {
    const load = async () => {
      if (!profile) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("points", { ascending: false });
      if (data) setMembers(data);
    };
    load();
  }, [profile]);

  const handleCopy = () => {
    navigator.clipboard.writeText(groupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return { icon: Crown, color: "text-warning", bg: "bg-warning/15", label: "Líder" };
    if (index === 1) return { icon: Star, color: "text-primary", bg: "bg-primary/15", label: "2º lugar" };
    if (index === 2) return { icon: Star, color: "text-success", bg: "bg-success/15", label: "3º lugar" };
    return { icon: Star, color: "text-muted-foreground", bg: "bg-muted", label: `${index + 1}º` };
  };

  const getLevel = (pts: number) => {
    if (pts >= 100) return { name: "Mestre Financeiro", color: "text-warning", min: 100 };
    if (pts >= 50) return { name: "Investidor", color: "text-primary", min: 50 };
    if (pts >= 20) return { name: "Economizador", color: "text-success", min: 20 };
    if (pts >= 5) return { name: "Iniciante", color: "text-muted-foreground", min: 5 };
    return { name: "Novato", color: "text-muted-foreground", min: 0 };
  };

  const level = getLevel(currentPoints);
  const nextLevel = currentPoints >= 100
    ? null
    : currentPoints >= 50 ? { name: "Mestre Financeiro", min: 100 }
    : currentPoints >= 20 ? { name: "Investidor", min: 50 }
    : currentPoints >= 5 ? { name: "Economizador", min: 20 }
    : { name: "Iniciante", min: 5 };

  const progressToNext = nextLevel
    ? Math.min(100, ((currentPoints - level.min) / (nextLevel.min - level.min)) * 100)
    : 100;

  return (
    <div className="px-4 pb-24 space-y-4">
      <div className="pt-3">
        <h1 className="text-xl font-bold">Ranking & Membros</h1>
      </div>

      {/* Your Points Card */}
      <div className="card-zelo fade-in-up relative overflow-hidden">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-warning/5" />
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/15">
              <Trophy size={22} className="text-warning" />
            </div>
            <div>
              <p className="text-sm font-bold">Seus Pontos</p>
              <p className={`text-[11px] font-semibold ${level.color}`}>{level.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold tabular-nums text-warning">{currentPoints}</p>
            <p className="text-[10px] text-muted-foreground">pontos</p>
          </div>
        </div>

        {/* Progress to next level */}
        {nextLevel && (
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>{level.name}</span>
              <span>{nextLevel.name} ({nextLevel.min} pts)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-warning transition-all duration-700" style={{ width: `${progressToNext}%` }} />
            </div>
          </div>
        )}

        {monthlyEarnings > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            <Zap size={12} className="text-success" />
            <span className="text-[11px] text-success font-medium">+{monthlyEarnings} pts este mês</span>
          </div>
        )}
      </div>

      {/* Points System Explainer */}
      <div className="card-zelo fade-in-up stagger-1">
        <button
          onClick={() => setShowPointsGuide(!showPointsGuide)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Gift size={18} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">Como ganhar pontos?</p>
              <p className="text-[10px] text-muted-foreground">Entenda o sistema e as recompensas</p>
            </div>
          </div>
          {showPointsGuide ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </button>

        {showPointsGuide && (
          <div className="mt-4 space-y-4">
            {/* Rules */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">COMO GANHAR</p>
              <div className="space-y-2">
                {POINTS_RULES.map(rule => (
                  <div key={rule.id} className="flex items-start gap-2.5 rounded-xl bg-muted/50 border border-border px-3 py-2.5">
                    <span className="text-base mt-0.5">{rule.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold">{rule.label}</p>
                        <span className="text-xs font-bold text-warning tabular-nums">+{rule.points} pts</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Levels */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">NÍVEIS</p>
              <div className="space-y-1.5">
                {[
                  { name: "Novato", min: 0, color: "text-muted-foreground" },
                  { name: "Iniciante", min: 5, color: "text-muted-foreground" },
                  { name: "Economizador", min: 20, color: "text-success" },
                  { name: "Investidor", min: 50, color: "text-primary" },
                  { name: "Mestre Financeiro", min: 100, color: "text-warning" },
                ].map(lvl => (
                  <div key={lvl.name} className={`flex items-center justify-between rounded-lg px-3 py-2 ${currentPoints >= lvl.min ? "bg-muted/50 border border-border" : "opacity-50"}`}>
                    <span className={`text-xs font-semibold ${lvl.color}`}>{lvl.name}</span>
                    <span className="text-[10px] text-muted-foreground">{lvl.min}+ pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What points do */}
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
              <p className="text-xs font-bold text-primary mb-1">🎁 Para que servem os pontos?</p>
              <ul className="text-[11px] text-muted-foreground space-y-1">
                <li>• <strong>Ranking familiar</strong> — compita com membros do grupo</li>
                <li>• <strong>Níveis de conquista</strong> — evolua seu perfil financeiro</li>
                <li>• <strong>Reconhecimento</strong> — mostre sua disciplina financeira</li>
                <li>• <strong>Em breve:</strong> troque pontos por recompensas exclusivas</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Group Code */}
      <div className="card-zelo fade-in-up stagger-2">
        <p className="text-label mb-2">CÓDIGO DE CONVITE DO GRUPO</p>
        <div className="flex items-center gap-3">
          <span className="flex-1 rounded-xl bg-muted/50 border border-border px-4 py-3 text-lg font-mono font-bold tracking-[0.3em] text-center">
            {groupCode}
          </span>
          <button
            onClick={handleCopy}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary active:scale-95 transition-all"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card-zelo fade-in-up stagger-3 border-l-primary">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
              <Users size={14} className="text-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">Participantes</span>
          </div>
          <p className="text-2xl font-bold">{members.length || 1}</p>
        </div>
        <div className="card-zelo fade-in-up stagger-4 border-l-warning">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15">
              <Shield size={14} className="text-warning" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">Administradores</span>
          </div>
          <p className="text-2xl font-bold">{members.filter(m => m.role === "admin").length || 1}</p>
        </div>
      </div>

      {/* Members Ranking */}
      <div className="fade-in-up stagger-4">
        <p className="text-label mb-2 px-1">RANKING DO GRUPO</p>
        <div className="card-zelo !p-0 divide-y divide-border border-l-warning">
          {members.length === 0 && profile && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-warning/40 to-warning/10 text-sm font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <Crown size={12} className="absolute -top-1 -right-1 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{profile.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
                    <Crown size={8} /> Líder
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{currentPoints} pontos</span>
                </div>
              </div>
            </div>
          )}
          {members.map((member, index) => {
            const badge = getRankBadge(index);
            const BadgeIcon = badge.icon;
            const colors = [
              "from-warning/40 to-warning/10",
              "from-primary/40 to-primary/10",
              "from-success/40 to-success/10",
              "from-destructive/40 to-destructive/10",
            ];
            return (
              <div key={member.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="relative">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${colors[index % colors.length]} text-sm font-bold`}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <BadgeIcon size={12} className={`absolute -top-1 -right-1 ${badge.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{member.name}</p>
                    {member.user_id === profile?.user_id && (
                      <span className="text-[9px] text-primary font-medium">(você)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center gap-1 rounded-full ${badge.bg} px-2 py-0.5 text-[10px] font-semibold ${badge.color}`}>
                      <BadgeIcon size={8} /> {badge.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{member.points} pontos</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="fade-in-up">
          <p className="text-label mb-2 px-1">ATIVIDADE RECENTE</p>
          <div className="card-zelo !p-0 divide-y divide-border border-l-success">
            {recentActivity.map((entry, i) => {
              const rule = POINTS_RULES.find(r => r.id === entry.ruleId);
              return (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{rule?.icon || "⭐"}</span>
                    <div>
                      <p className="text-xs font-medium">{entry.description}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(entry.date).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-warning tabular-nums">+{entry.points}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersView;
