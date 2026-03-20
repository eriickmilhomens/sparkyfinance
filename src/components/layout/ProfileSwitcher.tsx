import { useState } from "react";
import {
  ChevronDown, Check, UserPlus, User, Trophy, Crown, Star,
  Settings, Users, LogOut, Gift, Camera, Mail, Calendar, X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  name: string;
  initials: string;
  color: string;
  email: string;
  points: number;
  role: "admin" | "member";
}

const defaultProfiles: Profile[] = [
  { id: "erick", name: "Erick", initials: "E", color: "from-primary to-primary/60", email: "erick@sparky.com", points: 60, role: "admin" },
  { id: "ana", name: "Ana", initials: "A", color: "from-pink-500 to-pink-500/60", email: "ana@sparky.com", points: 35, role: "member" },
  { id: "casa", name: "Casa", initials: "C", color: "from-amber-500 to-amber-500/60", email: "casa@sparky.com", points: 15, role: "member" },
];

type SubView = null | "profile" | "prizes" | "members";

const ProfileSwitcher = () => {
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>(defaultProfiles);
  const [active, setActive] = useState("erick");
  const [subView, setSubView] = useState<SubView>(null);
  const [addingProfile, setAddingProfile] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // Prizes state
  const [prizes, setPrizes] = useState<{ name: string; cost: number }[]>([]);
  const [showNewPrize, setShowNewPrize] = useState(false);
  const [prizeName, setPrizeName] = useState("");
  const [prizeCost, setPrizeCost] = useState(100);

  // Profile edit state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const current = profiles.find((p) => p.id === active)!;

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

  const handleAddPrize = () => {
    if (!prizeName.trim()) return;
    setPrizes([...prizes, { name: prizeName, cost: prizeCost }]);
    setPrizeName("");
    setPrizeCost(100);
    setShowNewPrize(false);
  };

  const openSubView = (view: SubView) => {
    setSubView(view);
    if (view === "profile") {
      setEditName(current.name);
      setEditEmail(current.email);
    }
  };

  const closeAll = () => {
    setOpen(false);
    setSubView(null);
    setAddingProfile(false);
    setShowNewPrize(false);
  };

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
              <div className={cn("h-20 w-20 rounded-full bg-gradient-to-br flex items-center justify-center text-2xl font-bold text-white", current.color)}>
                {current.initials}
              </div>
              <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white">
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
                  <span className="text-sm text-muted-foreground">19/03/2026</span>
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
                <div key={i} className="card-zelo flex items-center gap-3">
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
              ))}
            </div>
          )}

          {/* New Prize Modal */}
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
                  <input value={prizeName} onChange={(e) => setPrizeName(e.target.value)} placeholder="Ex: Sorvete Extra" className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Custo em Pontos*</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={prizeCost} onChange={(e) => setPrizeCost(Number(e.target.value))} className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1.5 text-[10px] font-bold text-warning">
                      <Star size={8} /> {prizeCost}
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
    const admins = profiles.filter(p => p.role === "admin");
    const members = profiles.filter(p => p.role === "member");
    return (
      <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSubView(null)} className="text-muted-foreground hover:text-foreground"><ChevronDown size={20} className="rotate-90" /></button>
            <div>
              <h1 className="text-lg font-bold">Gerenciar Membros</h1>
              <p className="text-xs text-muted-foreground">Gerencie os membros do grupo</p>
            </div>
          </div>

          {/* Invite Code */}
          <div className="card-zelo space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold">Código de Convite</p>
                <p className="text-[10px] text-muted-foreground">Compartilhe para convidar novos membros</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
              <span className="flex-1 text-center text-lg font-mono font-bold tracking-[0.3em]">RFL45QUH</span>
              <button onClick={() => navigator.clipboard.writeText("RFL45QUH")} className="text-primary active:scale-95">
                <Check size={16} />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="card-zelo flex flex-col items-center py-3">
              <Users size={16} className="text-primary mb-1" />
              <p className="text-lg font-bold">{profiles.length}</p>
              <p className="text-[9px] text-muted-foreground">Total</p>
            </div>
            <div className="card-zelo flex flex-col items-center py-3">
              <Crown size={16} className="text-warning mb-1" />
              <p className="text-lg font-bold">{admins.length}</p>
              <p className="text-[9px] text-muted-foreground">Admins</p>
            </div>
            <div className="card-zelo flex flex-col items-center py-3">
              <User size={16} className="text-muted-foreground mb-1" />
              <p className="text-lg font-bold">{members.length}</p>
              <p className="text-[9px] text-muted-foreground">Membros</p>
            </div>
          </div>

          {/* Admins */}
          <div>
            <p className="text-label mb-2 px-1 flex items-center gap-1.5"><Crown size={10} className="text-warning" /> ADMINISTRADORES</p>
            <div className="space-y-2">
              {admins.map(p => (
                <div key={p.id} className="card-zelo flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center text-sm font-bold text-white", p.color)}>
                    {p.initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{p.name}</p>
                      {p.id === active && <span className="text-[9px] rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">Você</span>}
                      <span className="text-[9px] rounded-full bg-primary/15 px-1.5 py-0.5 text-primary font-semibold">Admin</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={8} className="text-warning" />
                      <span className="text-[10px] text-muted-foreground">{p.points} pontos</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Members */}
          <div>
            <p className="text-label mb-2 px-1 flex items-center gap-1.5"><User size={10} className="text-muted-foreground" /> MEMBROS</p>
            {members.length === 0 ? (
              <div className="card-zelo flex flex-col items-center py-6">
                <Users size={24} className="text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {members.map(p => (
                  <div key={p.id} className="card-zelo flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center text-sm font-bold text-white", p.color)}>
                      {p.initials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{p.name}</p>
                        {p.id === active && <span className="text-[9px] rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">Você</span>}
                        <span className="text-[9px] rounded-full bg-muted/50 px-1.5 py-0.5 text-muted-foreground">Membro</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={8} className="text-warning" />
                        <span className="text-[10px] text-muted-foreground">{p.points} pontos</span>
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

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 active:scale-95 transition-transform"
      >
        <div className={cn("h-8 w-8 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white", current.color)}>
          {current.initials}
        </div>
        <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeAll} />
          <div className="absolute right-0 top-11 z-50 w-72 rounded-2xl border border-border bg-card p-3 shadow-xl shadow-black/30 fade-in-up">
            {/* User Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("h-11 w-11 rounded-full bg-gradient-to-br flex items-center justify-center text-sm font-bold text-white", current.color)}>
                {current.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{current.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{current.email}</p>
              </div>
            </div>

            {/* Stats */}
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

            {/* Navigation */}
            <button onClick={() => openSubView("profile")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted/50 transition-colors active:scale-[0.97]">
              <User size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Meu Perfil</span>
            </button>
            <button onClick={() => { closeAll(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted/50 transition-colors active:scale-[0.97]">
              <Trophy size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Ranking</span>
            </button>

            <div className="h-px bg-border my-2" />
            <p className="text-[9px] text-muted-foreground font-semibold tracking-wider px-3 mb-1">ADMINISTRAÇÃO</p>

            <button onClick={() => openSubView("prizes")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted/50 transition-colors active:scale-[0.97]">
              <Gift size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Gerenciar Prêmios</span>
            </button>
            <button onClick={() => openSubView("members")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted/50 transition-colors active:scale-[0.97]">
              <Users size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Gerenciar Membros</span>
            </button>

            <div className="h-px bg-border my-2" />

            {/* Profile Switcher */}
            <p className="text-[9px] text-muted-foreground font-semibold tracking-wider px-3 mb-1">PERFIS</p>
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => { setActive(p.id); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors active:scale-[0.97]",
                  active === p.id ? "bg-primary/10" : "hover:bg-muted/50"
                )}
              >
                <div className={cn("h-7 w-7 rounded-full bg-gradient-to-br flex items-center justify-center text-[10px] font-bold text-white", p.color)}>
                  {p.initials}
                </div>
                <span className="text-sm font-medium flex-1">{p.name}</span>
                {active === p.id && <Check size={14} className="text-primary" />}
              </button>
            ))}

            {/* Add Profile */}
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
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors active:scale-[0.97]">
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
