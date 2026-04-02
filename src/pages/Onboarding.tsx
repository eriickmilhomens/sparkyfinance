import { useState, useEffect, useCallback } from "react";
import { Users, LogIn, Mail, Lock, Eye, EyeOff, User, Copy, CheckCircle2, PartyPopper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { seedDemoData } from "@/utils/demoSeed";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { syncLocalDataOwner } from "@/lib/userLocalData";

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

// Countries removed — only email auth is used

const Onboarding = () => {
  const [step, setStep] = useState<"register" | "welcome" | "join">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

  const handleLogoTap = useCallback(async () => {
    const newCount = tapCount + 1;
    if (tapTimer) clearTimeout(tapTimer);

    if (newCount >= 7) {
      // Set demo flag BEFORE signOut to prevent redirect race condition
      localStorage.setItem("sparky-demo-mode", "true");
      await supabase.auth.signOut().catch(() => {});
      seedDemoData();
      toast.success("Modo Demo ativado!");
      setTapCount(0);
      navigate("/");
      return;
    }

    setTapCount(newCount);
    const timer = setTimeout(() => setTapCount(0), 2000);
    setTapTimer(timer);
  }, [tapCount, tapTimer, navigate]);

  // Only redirect to home if user is authenticated AND on register step (meaning they navigated here while logged in)
  // Don't redirect during welcome/join steps - that's the intended flow
  useEffect(() => {
    if (step !== "register") return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only redirect if this is an existing session, not a fresh signup
      if (event === "INITIAL_SESSION" && session) {
        navigate("/");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, step]);

  const isValidDomain = (e: string) => /^[a-zA-Z0-9._%+-]+@sparky\.app$/i.test(e);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (!isValidDomain(email)) {
      toast.error("Utilize um e-mail com domínio @sparky.app");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const credentials = {
        email,
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: window.location.origin,
        },
      };

      const { data, error } = await supabase.auth.signUp(credentials);
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Este e-mail já está cadastrado. Faça login.");
        } else {
          toast.error(error.message);
        }
      } else if (data.session && data.user) {
        localStorage.removeItem("sparky-demo-mode");
        localStorage.removeItem("sparky-demo-profile");
        syncLocalDataOwner(data.user.id);
        toast.success("Conta criada com sucesso!");
        setStep("welcome");
      } else {
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
        navigate("/login");
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("load failed") || msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("networkerror")) {
        toast.error("Falha de conexão. Verifique sua internet e tente novamente.");
      } else {
        toast.error("Erro ao criar conta. Tente novamente.");
      }
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

    // Validate invite code using secure DB function (bypasses RLS)
    const { data: result, error } = await supabase.rpc("validate_invite_code", { _code: trimmed });

    if (error || !result || !(result as any).valid) {
      setCodeError("Código inválido. Verifique e tente novamente.");
      setJoiningGroup(false);
      return;
    }

    const targetGroup = (result as any).group_code || trimmed;

    // Update current user's group_code to match
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
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
      <div className="bg-background flex flex-col items-center justify-center px-6" style={{ minHeight: '100dvh', paddingTop: 'env(safe-area-inset-top, 20px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
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
      <div className="bg-background flex flex-col items-center justify-center px-6" style={{ minHeight: '100dvh', paddingTop: 'env(safe-area-inset-top, 20px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
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
    <div className="bg-background flex flex-col items-center justify-center px-6" style={{ minHeight: '100dvh', paddingTop: 'env(safe-area-inset-top, 20px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
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

      <form onSubmit={handleRegister} className="w-full max-w-sm space-y-4 fade-in-up stagger-1">
        <div className="relative">
          <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/50 pl-10 pr-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
        </div>

        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/50 pl-10 pr-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
        </div>

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
