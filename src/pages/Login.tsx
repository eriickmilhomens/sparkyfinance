import { useState, useCallback, useEffect } from "react";
import { seedDemoData } from "@/utils/demoSeed";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("sparky-demo-mode") === "true") return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (localStorage.getItem("sparky-demo-mode") === "true") return;
      if (session?.user) {
        syncLocalDataOwner(session.user.id);
        navigate("/");
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (localStorage.getItem("sparky-demo-mode") === "true") return;
      if (session?.user) {
        syncLocalDataOwner(session.user.id);
        navigate("/");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogoTap = useCallback(async () => {
    const newCount = tapCount + 1;
    if (tapTimer) clearTimeout(tapTimer);
    if (newCount >= 7) {
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

  const isValidDomain = (e: string) => /^[a-zA-Z0-9._%+-]+@sparky\.app$/i.test(e);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (!isValidDomain(email)) {
      toast.error("Utilize um e-mail com domínio @sparky.app");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message === "Invalid login credentials") {
          toast.error("E-mail ou senha incorretos");
        } else {
          toast.error(error.message);
        }
      } else if (data.user) {
        localStorage.removeItem("sparky-demo-mode");
        syncLocalDataOwner(data.user.id);
        navigate("/");
      }
    } catch {
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden" style={{ minHeight: '100dvh', paddingTop: 'env(safe-area-inset-top, 20px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] right-[-15%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/3 blur-3xl pointer-events-none" />

      <div className="flex flex-col items-center gap-4 mb-10 fade-in-up relative z-10">
        <button
          type="button"
          onClick={handleLogoTap}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 active:scale-95 transition-transform select-none shadow-lg shadow-primary/10"
        >
          <CatLogo />
        </button>
        <span className="text-2xl font-display font-extrabold tracking-tight">SPARKY</span>
        <p className="text-sm text-muted-foreground">Seu controle financeiro inteligente</p>
        {tapCount >= 3 && tapCount < 7 && (
          <p className="text-[10px] text-muted-foreground/50 animate-pulse">{7 - tapCount} toques para modo demo</p>
        )}
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-3.5 fade-in-up stagger-1 relative z-10">
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-card/50 backdrop-blur-sm pl-10 pr-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type={showPw ? "text" : "password"} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-card/50 backdrop-blur-sm pl-10 pr-11 py-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground active:scale-95">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-3.5 text-sm font-display font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-xs text-muted-foreground fade-in-up stagger-2 relative z-10">
        Não tem conta?{" "}
        <button onClick={() => navigate("/onboarding")} className="text-primary font-semibold">Criar conta</button>
      </p>
    </div>
  );
};

export default Login;
