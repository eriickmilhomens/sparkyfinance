import { useState, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown, Check, UserPlus, User, Trophy, Crown, Star,
  Settings, Users, LogOut, Gift, Camera, Mail, Calendar, X,
  Image, Sparkles, Clock, Trash2, Shield
} from "lucide-react";
import AdminPanel from "@/components/admin/AdminPanel";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useGroupMembers } from "@/hooks/useGroupMembers";

interface Prize {
  name: string;
  cost: number;
  redeemedBy?: string;
  redeemedAt?: string;
}

interface Profile {
  id: string;
  name: string;
  initials: string;
  color: string;
  email: string;
  points: number;
  role: "admin" | "member";
  avatar?: string;
  isOriginal?: boolean;
}

const inspirationalQuotes = [
  "💡 Riqueza não é ter muito, é precisar de pouco.",
  "🚀 Pequenos hábitos financeiros geram grandes resultados.",
  "🎯 Quem controla o dinheiro, controla o futuro.",
  "🌟 Cada centavo economizado é um passo para a liberdade.",
  "🔥 Disciplina hoje, colheita amanhã.",
];

type SubView = null | "profile" | "prizes" | "members" | "ranking" | "admin";

const ProfileSwitcher = () => {
  const navigate = useNavigate();
  const { profile: dbProfile, isDemo } = useProfile();
  const { members: groupMembers, isLeader: isGroupLeader } = useGroupMembers();
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [active, setActive] = useState("");
  const [subView, setSubView] = useState<SubView>(null);
  const [addingProfile, setAddingProfile] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [allPrizes, setAllPrizes] = useState<Record<string, Prize[]>>({});
  const [showNewPrize, setShowNewPrize] = useState(false);
  const [prizeName, setPrizeName] = useState("");
  const [prizeCost, setPrizeCost] = useState("100");

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Initialize profiles from DB profile
  useEffect(() => {
    if (dbProfile && profiles.length === 0) {
      const initial: Profile = {
        id: dbProfile.id,
        name: dbProfile.name,
        initials: dbProfile.name.charAt(0).toUpperCase(),
        color: "from-primary to-primary/60",
        email: dbProfile.email || "",
        points: dbProfile.points,
        role: dbProfile.role as "admin" | "member",
        avatar: dbProfile.avatar_url || undefined,
        isOriginal: true,
      };
      setProfiles([initial]);
      setActive(dbProfile.id);
    } else if (dbProfile) {
      // Update the original profile data from DB
      setProfiles(prev => prev.map(p => p.isOriginal ? {
        ...p,
        name: dbProfile.name,
        email: dbProfile.email || p.email,
        points: dbProfile.points,
        role: dbProfile.role as "admin" | "member",
        avatar: dbProfile.avatar_url || p.avatar,
      } : p));
    }
  }, [dbProfile]);

  const current = profiles.find((p) => p.id === active) || profiles[0];
  const isLoading = !current;
  const prizes = allPrizes[active] || [];

  const setPrizes = (newPrizes: Prize[]) => {
    setAllPrizes(prev => ({ ...prev, [active]: newPrizes }));
  };

  const handleAddProfile = () => {
    if (!newName.trim()) return;
    const id = newName.toLowerCase().replace(/\s/g, "-") + "-" + Date.now();
    const initials = newName.charAt(0).toUpperCase();
    const colors = ["from-emerald-500 to-emerald-500/60", "from-violet-500 to-violet-500/60", "from-cyan-500 to-cyan-500/60", "from-rose-500 to-rose-500/60"];
    const color = colors[profiles.length % colors.length];
    setProfiles([...profiles, { id, name: newName, initials, color, email: newEmail || `${id}@sparky.com`, points: 0, role: "member" }]);
    setActive(id);
    setAddingProfile(false);
    setNewName("");
    setNewEmail("");
  };

  const handleDeleteProfile = (id: string) => {
    const original = profiles.find(p => p.isOriginal);
    if (!original || id === original.id) return;
    setProfiles(prev => prev.filter(p => p.id !== id));
    if (active === id) setActive(original.id);
  };

  const handleAddPrize = () => {
    if (!prizeName.trim()) return;
    const cost = parseInt(prizeCost) || 0;
    setPrizes([...prizes, { name: prizeName, cost }]);
    setPrizeName("");
    setPrizeCost("100");
    setShowNewPrize(false);
  };

  const handleRedeemPrize = (index: number) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const updated = prizes.map((p, i) =>
      i === index ? { ...p, redeemedBy: current.name, redeemedAt: dateStr } : p
    );
    setPrizes(updated);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setProfiles(profiles.map(p => p.id === active ? { ...p, avatar: base64 } : p));
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    closeAll();
    localStorage.removeItem("sparky-demo-mode");
    await supabase.auth.signOut();
    navigate("/login");
  };

  const openSubView = (view: SubView) => {
    if (view === "profile") {
      setEditName(current.name);
      setEditEmail(current.email);
    }
    setSubView(view);
    setOpen(false);
  };

  const closeAll = () => {
    setOpen(false);
    setSubView(null);
    setAddingProfile(false);
    setShowNewPrize(false);
    setShowLogoutConfirm(false);
  };

  const renderLayer = (content: ReactNode) => {
    if (typeof document === "undefined") return null;
    return createPortal(content, document.body);
  };

  const renderAvatar = (profile: Profile, size: string, textSize: string) => {
    if (profile.avatar) {
      return <img src={profile.avatar} alt={profile.name} className={cn(size, "rounded-full object-cover")} />;
    }
    return (
      <div className={cn(size, "rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white", textSize, profile.color)}>
        {profile.initials}
      </div>
    );
  };

  // Logout confirmation modal
  if (showLogoutConfirm) {
    return renderLayer(
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="w-full max-w-sm card-zelo space-y-4 text-center">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-destructive/15">
            <LogOut size={24} className="text-destructive" />
          </div>
          <h3 className="text-lg font-bold">Sair da conta?</h3>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja sair? Você será redirecionado para a tela de login.</p>
          <div className="flex gap-2">
            <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground active:scale-[0.98]">Cancelar</button>
            <button onClick={handleLogout} className="flex-1 rounded-xl bg-destructive py-3 text-sm font-semibold text-destructive-foreground active:scale-[0.98]">Sair</button>
          </div>
        </div>
      </div>,
    );
  }

  // Sub-view: Ranking
  if (subView === "ranking") {
    const sorted = [...groupMembers].sort((a, b) => b.points - a.points);
    const quote = inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];
    const renderGroupAvatar = (member: any, size: string, textSize: string) => {
      if (member.avatar_url) {
        return <img src={member.avatar_url} alt={member.name} className={cn(size, "rounded-full object-cover")} />;
      }
      return (
        <div className={cn(size, "rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center font-bold text-white", textSize)}>
          {member.name?.charAt(0).toUpperCase() || "?"}
        </div>
      );
    };
    return (
      <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSubView(null)} className="text-muted-foreground hover:text-foreground"><ChevronDown size={20} className="rotate-90" /></button>
            <div>
              <h1 className="text-lg font-bold">Ranking do Grupo</h1>
              <p className="text-xs text-muted-foreground">{sorted.length} membro{sorted.length !== 1 ? "s" : ""} no grupo</p>
            </div>
          </div>

          <div className="card-zelo border-warning/20 bg-warning/5">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/80 italic leading-relaxed">{quote}</p>
            </div>
          </div>

          {sorted.length >= 3 && (
            <div className="flex items-end justify-center gap-3 py-4">
              <div className="flex flex-col items-center">
                {renderGroupAvatar(sorted[1], "h-12 w-12", "text-sm")}
                <p className="text-xs font-semibold mt-1">{sorted[1].name}</p>
                <div className="bg-muted rounded-lg px-3 py-1 mt-1">
                  <span className="text-xs font-bold text-warning">{sorted[1].points} pts</span>
                </div>
                <div className="bg-muted/60 rounded-t-lg w-16 h-14 mt-2 flex items-center justify-center text-lg font-bold text-muted-foreground">2º</div>
              </div>
              <div className="flex flex-col items-center">
                <Crown size={16} className="text-warning mb-1" />
                {renderGroupAvatar(sorted[0], "h-14 w-14", "text-base")}
                <p className="text-xs font-bold mt-1">{sorted[0].name}</p>
                <div className="bg-warning/15 rounded-lg px-3 py-1 mt-1">
                  <span className="text-xs font-bold text-warning">{sorted[0].points} pts</span>
                </div>
                <div className="bg-warning/20 rounded-t-lg w-16 h-20 mt-2 flex items-center justify-center text-lg font-bold text-warning">1º</div>
              </div>
              <div className="flex flex-col items-center">
                {renderGroupAvatar(sorted[2], "h-11 w-11", "text-xs")}
                <p className="text-xs font-semibold mt-1">{sorted[2].name}</p>
                <div className="bg-muted rounded-lg px-3 py-1 mt-1">
                  <span className="text-xs font-bold text-warning">{sorted[2].points} pts</span>
                </div>
                <div className="bg-muted/40 rounded-t-lg w-16 h-10 mt-2 flex items-center justify-center text-lg font-bold text-muted-foreground">3º</div>
              </div>
            </div>
          )}

          <p className="text-label px-1">CLASSIFICAÇÃO GERAL</p>
          <div className="space-y-2">
            {sorted.map((member, i) => {
              const isCurrent = member.user_id === dbProfile?.user_id;
              const memberIsLeader = isGroupLeader(member);
              const myPoints = dbProfile?.points || 0;
              const diff = member.points - myPoints;
              return (
                <div key={member.id} className={cn("card-zelo flex items-center gap-3", isCurrent ? "border-primary/30" : "")}>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {i + 1}º
                  </div>
                  {renderGroupAvatar(member, "h-10 w-10", "text-sm")}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold">{member.name}</p>
                      <span className={cn("text-[9px] rounded-full px-1.5 py-0.5 font-semibold", memberIsLeader ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground")}>
                        {memberIsLeader ? "Líder" : "Membro"}
                      </span>
                    </div>
                    {!isCurrent && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {diff > 0 ? `${diff} pts à frente de você` : diff < 0 ? `${Math.abs(diff)} pts atrás de você` : "Mesma pontuação"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1">
                    {i === 0 ? <Trophy size={12} className="text-warning" /> : <Star size={12} className="text-warning" />}
                    <span className="text-xs font-bold text-warning tabular-nums">{member.points} pts</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Como funciona o sistema de pontos */}
          <p className="text-label px-1">COMO FUNCIONA</p>
          <div className="card-zelo space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
                  <Trophy size={16} className="text-primary" />
                </div>
                <p className="text-sm font-bold">Sistema de Pontos</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Ganhe pontos praticando bons hábitos financeiros. Quanto mais disciplinado você for, mais rápido sobe no ranking do grupo.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">COMO GANHAR PONTOS</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">💳</span>
                    <span className="text-[11px]">Pagar contas em dia</span>
                  </div>
                  <span className="text-[10px] font-bold text-warning">+3 pts</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🐷</span>
                    <span className="text-[11px]">Economizar 10% da renda</span>
                  </div>
                  <span className="text-[10px] font-bold text-warning">+5 pts</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🏆</span>
                    <span className="text-[11px]">Economizar 20% da renda</span>
                  </div>
                  <span className="text-[10px] font-bold text-warning">+8 pts</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📈</span>
                    <span className="text-[11px]">Depositar em meta de investimento</span>
                  </div>
                  <span className="text-[10px] font-bold text-warning">+4 pts</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">✅</span>
                    <span className="text-[11px]">Fechar mês no verde</span>
                  </div>
                  <span className="text-[10px] font-bold text-warning">+10 pts</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🔥</span>
                    <span className="text-[11px]">7 dias registrando gastos</span>
                  </div>
                  <span className="text-[10px] font-bold text-warning">+3 pts</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🧘</span>
                    <span className="text-[11px]">Mês sem compra impulsiva</span>
                  </div>
                  <span className="text-[10px] font-bold text-warning">+7 pts</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">NÍVEIS DE EVOLUÇÃO</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-[11px] text-muted-foreground font-semibold">Novato</span>
                  <span className="text-[10px] text-muted-foreground">0+ pts</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-[11px] text-muted-foreground font-semibold">Iniciante</span>
                  <span className="text-[10px] text-muted-foreground">5+ pts</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-success/10 px-3 py-2">
                  <span className="text-[11px] text-success font-semibold">Economizador</span>
                  <span className="text-[10px] text-success">20+ pts</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2">
                  <span className="text-[11px] text-primary font-semibold">Investidor</span>
                  <span className="text-[10px] text-primary">50+ pts</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-warning/10 px-3 py-2">
                  <span className="text-[11px] text-warning font-semibold">Mestre Financeiro</span>
                  <span className="text-[10px] text-warning">100+ pts</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
              <p className="text-xs font-bold text-primary mb-1">🎁 Para que servem os pontos?</p>
              <ul className="text-[11px] text-muted-foreground space-y-1">
                <li>• <strong>Ranking do grupo</strong> — compita e lidere entre os membros</li>
                <li>• <strong>Níveis de conquista</strong> — evolua seu perfil financeiro</li>
                <li>• <strong>Reconhecimento</strong> — mostre sua disciplina financeira</li>
                <li>• <strong>Prêmios</strong> — troque pontos por recompensas no menu de prêmios</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sub-view: Meu Perfil
  if (subView === "profile") {
    return (
      <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSubView(null)} className="text-muted-foreground hover:text-foreground"><ChevronDown size={20} className="rotate-90" /></button>
            <div>
              <h1 className="text-lg font-bold">Meu Perfil</h1>
              <p className="text-xs text-muted-foreground">Gerencie suas informações pessoais</p>
            </div>
          </div>

          <div className="card-zelo flex flex-col items-center py-6">
            <div className="relative">
              {renderAvatar(current, "h-20 w-20", "text-2xl")}
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white">
                <Camera size={12} />
              </button>
            </div>
            <p className="text-sm font-bold mt-3">{current.name}</p>
            <p className="text-xs text-muted-foreground">{current.email}</p>
          </div>

          <div className="card-zelo space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Informações Pessoais</h3>
              <p className="text-[10px] text-muted-foreground">Atualize como você aparece no app.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Nome Completo</label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                  <User size={14} className="text-muted-foreground" />
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-transparent text-sm flex-1 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Email</label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                  <Mail size={14} className="text-muted-foreground" />
                  <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="bg-transparent text-sm flex-1 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Membro desde</label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                  <Calendar size={14} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {dbProfile?.created_at
                      ? new Date(dbProfile.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setProfiles(profiles.map(p => p.id === active ? { ...p, name: editName, initials: editName.charAt(0).toUpperCase(), email: editEmail } : p));
                setSubView(null);
              }}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground active:scale-[0.98] transition-transform"
            >
              Salvar Alterações
            </button>
          </div>

          {/* Developer Signature */}
          <div className="card-zelo space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Sobre o Projeto</h3>
              <p className="text-[10px] text-muted-foreground">Criado com 💙 para você</p>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">ED</span>
                </div>
                <div>
                  <p className="text-sm font-bold">Erick Milhomens</p>
                  <p className="text-[10px] text-muted-foreground">Erick Developer</p>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Nome Real</p>
                  <p className="text-xs font-medium">Erick Milhomens</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Developer</p>
                  <p className="text-xs font-medium">Erick Developer</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Data de Criação</p>
                <p className="text-xs font-medium">19/03/2026</p>
              </div>
              <p className="text-[10px] text-muted-foreground/70 italic text-center pt-1">
                🐱 Sparky (Faísca) — inspirado no gatinho que dá nome ao projeto.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sub-view: Gerenciar Prêmios
  if (subView === "prizes") {
    return (
      <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSubView(null)} className="text-muted-foreground hover:text-foreground"><ChevronDown size={20} className="rotate-90" /></button>
            <div>
              <h1 className="text-lg font-bold">Gerenciar Prêmios</h1>
              <p className="text-xs text-muted-foreground">Crie e gerencie os prêmios disponíveis na loja</p>
            </div>
          </div>

          <button onClick={() => setShowNewPrize(true)} className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <UserPlus size={16} /> Adicionar Prêmio
          </button>

          <p className="text-label px-1">PRÊMIOS DISPONÍVEIS</p>

          {prizes.length === 0 ? (
            <div className="card-zelo flex flex-col items-center py-8">
              <Gift size={32} className="text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum prêmio disponível</p>
              <p className="text-[10px] text-muted-foreground mt-1">Adicione o primeiro prêmio usando o botão acima!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {prizes.map((p, i) => (
                <div key={i} className="card-zelo space-y-2 border-l-warning">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15">
                      <Gift size={18} className="text-warning" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{p.name}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning mt-1">
                        <Star size={8} /> {p.cost} pontos
                      </span>
                    </div>
                    <button onClick={() => setPrizes(prizes.filter((_, j) => j !== i))} className="h-8 w-8 rounded-lg bg-destructive/15 flex items-center justify-center text-destructive active:scale-95">
                      <X size={14} />
                    </button>
                  </div>

                  {p.redeemedBy ? (
                    <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
                      <Check size={12} className="text-success" />
                      <p className="text-[10px] text-success">
                        Resgatado por <span className="font-bold">{p.redeemedBy}</span> em {p.redeemedAt}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRedeemPrize(i)}
                      disabled={current.points < p.cost}
                      className={cn(
                        "w-full rounded-lg py-2 text-xs font-semibold active:scale-[0.98] transition-all",
                        current.points >= p.cost
                          ? "bg-success/15 text-success hover:bg-success/25"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      {current.points >= p.cost ? "🎁 Resgatar Prêmio" : `Pontos insuficientes (${current.points}/${p.cost})`}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {showNewPrize && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
              <div className="w-full max-w-sm card-zelo space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold">Novo Prêmio</h3>
                    <p className="text-[10px] text-muted-foreground">Adicione um novo prêmio à loja</p>
                  </div>
                  <button onClick={() => setShowNewPrize(false)} className="text-muted-foreground"><X size={16} /></button>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Nome do Prêmio*</label>
                  <input value={prizeName} onChange={(e) => setPrizeName(e.target.value)} placeholder="Ex: Sorveteria" className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Custo em Pontos*</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={prizeCost}
                      onChange={(e) => setPrizeCost(e.target.value.replace(/\D/g, ""))}
                      className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1.5 text-[10px] font-bold text-warning">
                      <Star size={8} /> {prizeCost || 0}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowNewPrize(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground active:scale-[0.98]">Cancelar</button>
                  <button onClick={handleAddPrize} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground active:scale-[0.98]">Criar Prêmio</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Sub-view: Gerenciar Membros
  if (subView === "members") {
    const leaders = groupMembers.filter(m => isGroupLeader(m));
    const regularMembers = groupMembers.filter(m => !isGroupLeader(m));
    const renderMemberAvatar = (member: any, size: string, textSize: string) => {
      if (member.avatar_url) {
        return <img src={member.avatar_url} alt={member.name} className={cn(size, "rounded-full object-cover")} />;
      }
      return (
        <div className={cn(size, "rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center font-bold text-white", textSize)}>
          {member.name?.charAt(0).toUpperCase() || "?"}
        </div>
      );
    };
    return (
      <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSubView(null)} className="text-muted-foreground hover:text-foreground"><ChevronDown size={20} className="rotate-90" /></button>
            <div>
              <h1 className="text-lg font-bold">Gerenciar Membros</h1>
              <p className="text-xs text-muted-foreground">Membros reais do grupo sincronizados</p>
            </div>
          </div>

          <div className="card-zelo space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold">Código de Convite</p>
                <p className="text-[10px] text-muted-foreground">Compartilhe para convidar novos membros</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
              <span className="flex-1 text-center text-lg font-mono font-bold tracking-[0.3em]">{dbProfile?.group_code || dbProfile?.invite_code || "------"}</span>
              <button onClick={() => navigator.clipboard.writeText(dbProfile?.group_code || dbProfile?.invite_code || "")} className="text-primary active:scale-95">
                <Check size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="card-zelo flex flex-col items-center py-3">
              <Users size={16} className="text-primary mb-1" />
              <p className="text-lg font-bold">{groupMembers.length}</p>
              <p className="text-[9px] text-muted-foreground">Total</p>
            </div>
            <div className="card-zelo flex flex-col items-center py-3 border-l-warning">
              <Crown size={16} className="text-warning mb-1" />
              <p className="text-lg font-bold">{leaders.length}</p>
              <p className="text-[9px] text-muted-foreground">Líderes</p>
            </div>
            <div className="card-zelo flex flex-col items-center py-3">
              <User size={16} className="text-muted-foreground mb-1" />
              <p className="text-lg font-bold">{regularMembers.length}</p>
              <p className="text-[9px] text-muted-foreground">Membros</p>
            </div>
          </div>

          <div>
            <p className="text-label mb-2 px-1 flex items-center gap-1.5"><Crown size={10} className="text-warning" /> LÍDERES</p>
            <div className="space-y-2">
              {leaders.map(m => (
                <div key={m.id} className="card-zelo flex items-center gap-3">
                  {renderMemberAvatar(m, "h-10 w-10", "text-sm")}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{m.name}</p>
                      {m.user_id === dbProfile?.user_id && <span className="text-[9px] rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">Você</span>}
                      <span className="text-[9px] rounded-full bg-warning/15 px-1.5 py-0.5 text-warning font-semibold">Líder</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={8} className="text-warning" />
                      <span className="text-[10px] text-muted-foreground">{m.points} pontos</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-label mb-2 px-1 flex items-center gap-1.5"><User size={10} className="text-muted-foreground" /> MEMBROS</p>
            {regularMembers.length === 0 ? (
              <div className="card-zelo flex flex-col items-center py-6">
                <Users size={24} className="text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground mt-2">Nenhum membro ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {regularMembers.map(m => (
                  <div key={m.id} className="card-zelo flex items-center gap-3">
                    {renderMemberAvatar(m, "h-10 w-10", "text-sm")}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{m.name}</p>
                        {m.user_id === dbProfile?.user_id && <span className="text-[9px] rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">Você</span>}
                        <span className="text-[9px] rounded-full bg-muted/50 px-1.5 py-0.5 text-muted-foreground">Membro</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={8} className="text-warning" />
                        <span className="text-[10px] text-muted-foreground">{m.points} pontos</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Sub-view: Admin Panel
  if (subView === "admin") {
    return <AdminPanel onClose={() => setSubView(null)} />;
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 active:scale-95 transition-transform">
        {isLoading ? (
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        ) : (
          renderAvatar(current!, "h-8 w-8", "text-xs")
        )}
        <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && !isLoading && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeAll} />
          <div className="absolute right-0 top-11 z-50 w-72 rounded-2xl border border-border bg-card p-3 shadow-xl shadow-black/30 fade-in-up">
            <div className="flex items-center gap-3 mb-3">
              {renderAvatar(current, "h-11 w-11", "text-sm")}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{current.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{current.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-xl bg-muted/40 p-2.5 flex items-center gap-2">
                <Star size={14} className="text-warning" />
                <div>
                  <p className="text-sm font-bold">{current.points}</p>
                  <p className="text-[9px] text-muted-foreground">Pontos</p>
                </div>
              </div>
              <div className="rounded-xl bg-muted/40 p-2.5 flex items-center gap-2">
                <Crown size={14} className="text-warning" />
                <div>
                  <p className="text-sm font-bold capitalize">{current.role}</p>
                  <p className="text-[9px] text-muted-foreground">{current.role === "admin" ? "Admin" : "Membro"}</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-border mb-2" />

            <button onClick={() => openSubView("profile")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted/50 transition-colors active:scale-[0.97]">
              <User size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Meu Perfil</span>
            </button>
            <button onClick={() => openSubView("ranking")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted/50 transition-colors active:scale-[0.97]">
              <Trophy size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Ranking</span>
            </button>

            <div className="h-px bg-border my-2" />
            <p className="text-[9px] text-muted-foreground font-semibold tracking-wider px-3 mb-1">ADMINISTRAÇÃO</p>

            {current?.role === "admin" && current?.email === "admin@sparky.app" && !isDemo && (
              <button onClick={() => { openSubView("admin"); setOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-primary/10 transition-colors active:scale-[0.97]">
                <Shield size={16} className="text-primary" />
                <span className="text-sm font-medium text-primary">Painel Admin</span>
              </button>
            )}
            <button onClick={() => openSubView("prizes")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted/50 transition-colors active:scale-[0.97]">
              <Gift size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Gerenciar Prêmios</span>
            </button>
            <button onClick={() => openSubView("members")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted/50 transition-colors active:scale-[0.97]">
              <Users size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Gerenciar Membros</span>
            </button>

            <div className="h-px bg-border my-2" />

            <p className="text-[9px] text-muted-foreground font-semibold tracking-wider px-3 mb-1">PERFIS</p>
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center gap-1">
                <button
                  onClick={() => { setActive(p.id); setOpen(false); }}
                  className={cn(
                    "flex flex-1 items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors active:scale-[0.97]",
                    active === p.id ? "bg-primary/10" : "hover:bg-muted/50"
                  )}
                >
                  {renderAvatar(p, "h-7 w-7", "text-[10px]")}
                  <span className="text-sm font-medium flex-1">{p.name}</span>
                  {active === p.id && <Check size={14} className="text-primary" />}
                </button>
                {/* Delete button - only for non-original profiles */}
                {!p.isOriginal && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteProfile(p.id); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}

            {addingProfile ? (
              <div className="mt-2 space-y-2 rounded-xl border border-border p-3">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome" className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary" />
                <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email (opcional)" className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary" />
                <div className="flex gap-2">
                  <button onClick={() => setAddingProfile(false)} className="flex-1 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground">Cancelar</button>
                  <button onClick={handleAddProfile} className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground">Salvar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingProfile(true)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-muted-foreground hover:bg-muted/50 transition-colors active:scale-[0.97] mt-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-muted-foreground/40">
                  <UserPlus size={12} />
                </div>
                <span className="text-sm">Adicionar perfil</span>
              </button>
            )}

            <div className="h-px bg-border my-2" />
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors active:scale-[0.97]"
            >
              <LogOut size={16} />
              <span className="text-sm font-medium">Sair da conta</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileSwitcher;
