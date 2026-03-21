import { useState } from "react";
import { Users, LogIn, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

const VALID_CODES = ["RFL45QUH", "SPARKY01", "DEMO2026"];

const Onboarding = () => {
  const [step, setStep] = useState<"welcome" | "join">("welcome");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const navigate = useNavigate();

  const handleCreateGroup = () => {
    // Check if user is logged in
    const profiles = (() => {
      try { return JSON.parse(localStorage.getItem("sparky-profiles") || "[]"); } catch { return []; }
    })();
    if (profiles.length === 0) {
      toast.error("Crie uma conta antes de criar um grupo");
      navigate("/login");
      return;
    }
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
};

export default Onboarding;
