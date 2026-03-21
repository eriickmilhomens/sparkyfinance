import { useState } from "react";
import { Users, LogIn, Mail, Lock, Eye, EyeOff, User, Phone, ChevronDown } from "lucide-react";
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

const VALID_CODES = ["RFL45QUH", "SPARKY01", "DEMO2026"];

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
  const navigate = useNavigate();

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
        // Create profile
        localStorage.setItem("sparky-profiles", JSON.stringify([
          { id: crypto.randomUUID(), name: name.trim(), email: registerMethod === "email" ? email : `${countryCode}${phone}`, avatar: "", isOriginal: true }
        ]));
        localStorage.setItem("sparky-active-profile", "0");
        if (registerMethod === "email") {
          toast.success("Conta criada! Verifique seu e-mail para confirmar.");
        } else {
          toast.success("Conta criada com sucesso!");
        }
        setStep("welcome");
      }
    } catch {
      toast.error("Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    navigate("/");
  };

  const handleJoinGroup = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 6) {
      setCodeError("Código deve ter pelo menos 6 caracteres");
      return;
    }
    if (!VALID_CODES.includes(trimmed)) {
      setCodeError("Código inválido. Verifique e tente novamente.");
      return;
    }
    setCodeError("");
    toast.success("Você entrou no grupo com sucesso!");
    navigate("/");
  };

  if (step === "join") {
    return (
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
          <button onClick={handleJoinGroup} disabled={code.length < 6} className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40">Entrar no Grupo</button>
          <button onClick={() => setStep("welcome")} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">← Voltar</button>
        </div>
      </div>
    );
  }

  if (step === "welcome") {
    return (
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
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-3 mb-10 fade-in-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <CatLogo />
        </div>
        <span className="text-2xl font-extrabold tracking-tight">SPARKY</span>
        <p className="text-sm text-muted-foreground">Crie sua conta para começar</p>
      </div>

      {/* Register method toggle */}
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

      <p className="mt-6 text-xs text-muted-foreground fade-in-up stagger-2">
        Já tem conta?{" "}
        <button onClick={() => navigate("/login")} className="text-primary font-medium">Fazer login</button>
      </p>
    </div>
  );
};

export default Onboarding;
