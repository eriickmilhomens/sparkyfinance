import { useState, useCallback } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

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

  const handleLogoTap = useCallback(() => {
    const newCount = tapCount + 1;
    if (tapTimer) clearTimeout(tapTimer);

    if (newCount >= 7) {
      // Demo mode
      localStorage.setItem("sparky-demo-mode", "true");
      localStorage.setItem("sparky-profiles", JSON.stringify([
        { id: "demo", name: "Usuário Demo", email: "demo@sparky.app", avatar: "", isOriginal: true }
      ]));
      localStorage.setItem("sparky-active-profile", "demo");
      toast.success("🎮 Modo Demo ativado!");
      setTapCount(0);
      navigate("/");
      return;
    }

    setTapCount(newCount);
    const timer = setTimeout(() => setTapCount(0), 2000);
    setTapTimer(timer);
  }, [tapCount, tapTimer, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message === "Invalid login credentials") {
          toast.error("E-mail ou senha incorretos");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Confirme seu e-mail antes de fazer login");
        } else {
          toast.error(error.message);
        }
      } else {
        localStorage.removeItem("sparky-demo-mode");
        navigate("/");
      }
    } catch {
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error("Erro ao conectar com Google");
      } else {
        localStorage.removeItem("sparky-demo-mode");
      }
    } catch {
      toast.error("Erro ao conectar com Google");
    } finally {
      setLoading(false);
    }
  };

  return (
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
        <p className="text-sm text-muted-foreground">Seu controle financeiro inteligente</p>
        {tapCount >= 3 && tapCount < 7 && (
          <p className="text-[10px] text-muted-foreground/50 animate-pulse">{7 - tapCount} toques para modo demo</p>
        )}
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 fade-in-up stagger-1">
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/50 pl-10 pr-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
        </div>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type={showPw ? "text" : "password"} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/50 pl-10 pr-11 py-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground active:scale-95">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50">
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full rounded-xl border border-border py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar com Google
        </button>
      </form>

      <p className="mt-6 text-xs text-muted-foreground fade-in-up stagger-2">
        Não tem conta?{" "}
        <button onClick={() => navigate("/onboarding")} className="text-primary font-medium">Criar conta</button>
      </p>
    </div>
  );
};

export default Login;
