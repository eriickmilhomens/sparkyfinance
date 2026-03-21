import { useState, useCallback } from "react";
import { Mail, Lock, Eye, EyeOff, Phone, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

const Login = () => {
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+55");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  const handleLogoTap = useCallback(() => {
    const newCount = tapCount + 1;
    if (tapTimer) clearTimeout(tapTimer);

    if (newCount >= 7) {
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
    if (loginMethod === "email" && (!email || !password)) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (loginMethod === "phone" && (!phone || !password)) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    try {
      const credentials = loginMethod === "email"
        ? { email, password }
        : { phone: `${countryCode}${phone.replace(/\D/g, "")}`, password };

      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) {
        if (error.message === "Invalid login credentials") {
          toast.error("Credenciais incorretas");
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

      {/* Login method toggle */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1 w-full max-w-sm mb-4 fade-in-up stagger-1">
        <button
          type="button"
          onClick={() => setLoginMethod("email")}
          className={cn(
            "flex-1 rounded-lg py-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5",
            loginMethod === "email" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          <Mail size={14} /> E-mail
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod("phone")}
          className={cn(
            "flex-1 rounded-lg py-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5",
            loginMethod === "phone" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          <Phone size={14} /> Telefone
        </button>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 fade-in-up stagger-1">
        {loginMethod === "email" ? (
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
          <input type={showPw ? "text" : "password"} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/50 pl-10 pr-11 py-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground active:scale-95">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50">
          {loading ? "Entrando..." : "Entrar"}
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
