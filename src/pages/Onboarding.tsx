import { useState, useEffect, useCallback } from "react";
import { Users, LogIn, Mail, Lock, Eye, EyeOff, User, Phone, ChevronDown, Copy, CheckCircle2, PartyPopper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { seedDemoData } from "@/utils/demoSeed";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CatLogo = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6l2 6" />
    <path d="M20 6l-2 6" />
    <circle cx="12" cy="14" r="7" />
    <circle cx="9.5" cy="13" r="0.8" fill="hsl(var(--primary))" />
    <circle cx="14.5" cy="13" r="0.8" fill="hsl(var(--primary))" />
    <path d="M12 15.5l-0.8 0.5h1.6L12 15.5z" fill="hsl(var(--primary))" />
    <path d="M6 14h2.5M15.5 14H18M6 16h2.5M15.5 16H18" strokeWidth="1" />
  </svg>
);

const COUNTRIES = [
  { code: "+55", flag: "🇧🇷", name: "Brasil" },
  { code: "+1", flag: "🇺🇸", name: "EUA" },
  { code: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "+34", flag: "🇪🇸", name: "Espanha" },
  { code: "+44", flag: "🇬🇧", name: "Reino Unido" },
  { code: "+33", flag: "🇫🇷", name: "França" },
  { code: "+49", flag: "🇩🇪", name: "Alemanha" },
  { code: "+39", flag: "🇮🇹", name: "Itália" },
  { code: "+81", flag: "🇯🇵", name: "Japão" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+91", flag: "🇮🇳", name: "Índia" },
  { code: "+54", flag: "🇦🇷", name: "Argentina" },
  { code: "+56", flag: "🇨🇱", name: "Chile" },
  { code: "+57", flag: "🇨🇴", name: "Colômbia" },
  { code: "+52", flag: "🇲🇽", name: "México" },
];

const Onboarding = () => {
  const [step, setStep] = useState<"register" | "welcome" | "join">("register");
  const [registerMethod, setRegisterMethod] = useState<"email" | "phone">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+55");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [groupPopup, setGroupPopup] = useState<{ show: boolean; inviteCode: string }>({ show: false, inviteCode: "" });
  const [welcomePopup, setWelcomePopup] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const navigate = useNavigate();

  const handleLogoTap = useCallback(() => {
    const newCount = tapCount + 1;
    if (tapTimer) clearTimeout(tapTimer);

    if (newCount >= 7) {
      localStorage.setItem("sparky-demo-mode", "true");
      seedDemoData();
      toast.success("🎮 Modo Demo ativado!");
      setTapCount(0);
      navigate("/");
      return;
    }

    setTapCount(newCount);
    const timer = setTimeout(() => setTapCount(0), 2000);
    setTapTimer(timer);
  }, [tapCount, tapTimer, navigate]);

  // Redirect if already authenticated (e.g. after Google OAuth redirect)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/");
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && step === "register") {
        navigate("/");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, step]);

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (registerMethod === "email" && !email) {
      toast.error("Preencha o e-mail");
      return;
    }
    if (registerMethod === "phone" && !phone) {
      toast.error("Preencha o telefone");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const credentials = registerMethod === "email"
        ? {
            email,
            password,
            options: {
              data: { full_name: name.trim() },
              emailRedirectTo: window.location.origin,
            },
          }
        : {
            phone: `${countryCode}${phone.replace(/\D/g, "")}`,
            password,
            options: {
              data: { full_name: name.trim() },
            },
          };

      const { error } = await supabase.auth.signUp(credentials);
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Este e-mail já está cadastrado. Faça login.");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Conta criada com sucesso!");
        setStep("welcome");
      }
    } catch {
      toast.error("Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("profiles").select("invite_code").eq("user_id", user.id).single();
      if (data?.invite_code) {
        setGroupPopup({ show: true, inviteCode: data.invite_code });
        return;
      }
    }
    navigate("/");
  };

  const handleJoinGroup = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 6) {
      setCodeError("Código deve ter pelo menos 6 caracteres");
      return;
    }
    setJoiningGroup(true);
    setCodeError("");

    // Check if invite code exists in any profile
    const { data: groupProfiles } = await supabase
      .from("profiles")
      .select("invite_code, group_code")
      .eq("invite_code", trimmed);

    if (!groupProfiles || groupProfiles.length === 0) {
      setCodeError("Código inválido. Verifique e tente novamente.");
      setJoiningGroup(false);
      return;
    }

    // Update current user's group_code to match
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const targetGroup = groupProfiles[0].group_code || trimmed;
      await supabase
        .from("profiles")
        .update({ group_code: targetGroup, role: "member" })
        .eq("user_id", user.id);
    }

    setJoiningGroup(false);
    setWelcomePopup(true);
  };

  let content: React.ReactNode;

  if (step === "join") {
    content = (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-3 mb-10 fade-in-up">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <LogIn size={28} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold">Entrar em um Grupo</h1>
          <p className="text-sm text-muted-foreground text-center">Insira o código de convite para sincronizar dados com outros membros</p>
        </div>
        <div className="w-full max-w-sm space-y-4 fade-in-up stagger-1">
          <div>
            <input
              type="text"
              placeholder="código de convite ex: rfl45quh"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeError(""); }}
              maxLength={8}
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3.5 text-sm text-center font-mono tracking-widest uppercase outline-none placeholder:text-muted-foreground placeholder:tracking-normal placeholder:font-sans placeholder:normal-case placeholder:lowercase focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {codeError && (
              <p className="text-[11px] text-destructive mt-1.5 text-center">{codeError}</p>
            )}
          </div>
          <button onClick={handleJoinGroup} disabled={code.length < 6 || joiningGroup} className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40">
            {joiningGroup ? "Entrando..." : "Entrar no Grupo"}
          </button>
          <button onClick={() => setStep("welcome")} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">← Voltar</button>
        </div>
      </div>
    );
  } else if (step === "welcome") {
    content = (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-3 mb-10 fade-in-up">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <CatLogo />
          </div>
          <h1 className="text-xl font-bold text-balance text-center">Seja bem-vindo ao seu novo controle financeiro</h1>
          <p className="text-sm text-muted-foreground text-center">Escolha como deseja começar</p>
        </div>

        <div className="w-full max-w-sm space-y-3 fade-in-up stagger-1">
          <button onClick={handleCreateGroup} className="w-full card-zelo flex items-center gap-4 active:scale-[0.98] transition-all hover:border-primary/50">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15"><Users size={22} className="text-primary" /></div>
            <div className="text-left">
              <p className="text-sm font-semibold">Criar Novo Grupo</p>
              <p className="text-[11px] text-muted-foreground">Inicie um espaço de planejamento do zero</p>
            </div>
          </button>
          <button onClick={() => setStep("join")} className="w-full card-zelo flex items-center gap-4 active:scale-[0.98] transition-all hover:border-primary/50">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/15"><LogIn size={22} className="text-success" /></div>
            <div className="text-left">
              <p className="text-sm font-semibold">Entrar em um Grupo</p>
              <p className="text-[11px] text-muted-foreground">Use o código de convite para sincronizar</p>
            </div>
          </button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground fade-in-up stagger-2">
          Já tem conta?{" "}
          <button onClick={() => navigate("/login")} className="text-primary font-medium">Fazer login</button>
        </p>
      </div>
    );
  } else {
    content = (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-3 mb-10 fade-in-up">
        <button
          type="button"
          onClick={handleLogoTap}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 active:scale-95 transition-transform select-none"
        >
          <CatLogo />
        </button>
        <span className="text-2xl font-extrabold tracking-tight">SPARKY</span>
        <p className="text-sm text-muted-foreground">Crie sua conta para começar</p>
        {tapCount >= 3 && tapCount < 7 && (
          <p className="text-[10px] text-muted-foreground/50 animate-pulse">{7 - tapCount} toques para modo demo</p>
        )}
      </div>

      <div className="flex gap-1 rounded-xl bg-muted/50 p-1 w-full max-w-sm mb-4 fade-in-up stagger-1">
        <button
          type="button"
          onClick={() => setRegisterMethod("email")}
          className={cn(
            "flex-1 rounded-lg py-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5",
            registerMethod === "email" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          <Mail size={14} /> E-mail
        </button>
        <button
          type="button"
          onClick={() => setRegisterMethod("phone")}
          className={cn(
            "flex-1 rounded-lg py-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5",
            registerMethod === "phone" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          <Phone size={14} /> Telefone
        </button>
      </div>

      <form onSubmit={handleRegister} className="w-full max-w-sm space-y-4 fade-in-up stagger-1">
        <div className="relative">
          <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/50 pl-10 pr-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
        </div>

        {registerMethod === "email" ? (
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/50 pl-10 pr-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
          </div>
        ) : (
          <div className="relative flex gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCountryPicker(!showCountryPicker)}
                className="flex items-center gap-1 rounded-xl border border-border bg-muted/50 px-3 py-3.5 text-sm transition-all hover:border-primary/50"
              >
                <span className="text-base">{selectedCountry.flag}</span>
                <span className="text-xs font-medium">{selectedCountry.code}</span>
                <ChevronDown size={12} className="text-muted-foreground" />
              </button>
              {showCountryPicker && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto min-w-[180px]">
                  {COUNTRIES.map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => { setCountryCode(c.code); setShowCountryPicker(false); }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-primary/5 transition-all",
                        countryCode === c.code && "bg-primary/10"
                      )}
                    >
                      <span>{c.flag}</span>
                      <span className="font-medium">{c.code}</span>
                      <span className="text-muted-foreground">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="tel" placeholder="Número do telefone" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/50 pl-10 pr-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
          </div>
        )}

        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type={showPw ? "text" : "password"} placeholder="Senha (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/50 pl-10 pr-11 py-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground active:scale-95">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50">
          {loading ? "Criando conta..." : "Criar Conta"}
        </button>
      </form>

      <div className="w-full max-w-sm mt-4 fade-in-up stagger-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-muted-foreground">ou continue com</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <button
          type="button"
          onClick={async () => {
            const { error } = await lovable.auth.signInWithOAuth("google", {
              redirect_uri: window.location.origin,
              extraParams: { prompt: "consent" },
            });
            if (error) toast.error("Erro ao entrar com Google");
          }}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 py-3 text-sm font-medium transition-all active:scale-[0.98] hover:border-primary/50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Criar conta com Google
        </button>
      </div>

      <p className="mt-6 text-xs text-muted-foreground fade-in-up stagger-2">
        Já tem conta?{" "}
        <button onClick={() => navigate("/login")} className="text-primary font-medium">Fazer login</button>
      </p>
    </div>
    );
  }

  return (
    <>
      {content}

      {/* Group Created Popup */}
      {groupPopup.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 space-y-4 text-center shadow-xl">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 size={32} className="text-success" />
            </div>
            <h3 className="text-lg font-bold">Grupo criado com sucesso! 🎉</h3>
            <p className="text-sm text-muted-foreground">Compartilhe o código abaixo com amigos para que eles entrem no seu grupo:</p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-xl font-bold tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-xl">
                {groupPopup.inviteCode}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(groupPopup.inviteCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="p-2 rounded-lg hover:bg-muted transition-colors active:scale-95"
              >
                {copiedCode ? <CheckCircle2 size={18} className="text-success" /> : <Copy size={18} className="text-muted-foreground" />}
              </button>
            </div>
            {copiedCode && <p className="text-xs text-success font-medium">Código copiado!</p>}
            <button
              onClick={() => { setGroupPopup({ show: false, inviteCode: "" }); navigate("/"); }}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.98] transition-all"
            >
              Começar a usar o Sparky
            </button>
          </div>
        </div>
      )}

      {/* Welcome Popup after joining group */}
      {welcomePopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 space-y-4 text-center shadow-xl">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary/15">
              <PartyPopper size={32} className="text-primary" />
            </div>
            <h3 className="text-lg font-bold">Bem-vindo ao grupo! 🥳</h3>
            <p className="text-sm text-muted-foreground">Você entrou com sucesso! Agora vocês podem compartilhar e organizar as finanças juntos.</p>
            <button
              onClick={() => { setWelcomePopup(false); navigate("/"); }}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.98] transition-all"
            >
              Curtir o app!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Onboarding;
