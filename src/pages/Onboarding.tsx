import { useState } from "react";
import { Ghost, Users, LogIn, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Onboarding = () => {
  const [step, setStep] = useState<"welcome" | "join">("welcome");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const generatedCode = "RFL45QUH";

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateGroup = () => {
    // TODO: create group in DB
    navigate("/");
  };

  const handleJoinGroup = () => {
    // TODO: join group with code
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
          <input
            type="text"
            placeholder="Código de convite (ex: RFL45QUH)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3.5 text-sm text-center font-mono tracking-widest uppercase outline-none placeholder:text-muted-foreground placeholder:tracking-normal placeholder:font-sans focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          <button
            onClick={handleJoinGroup}
            disabled={code.length < 6}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40"
          >
            Entrar no Grupo
          </button>
          <button
            onClick={() => setStep("welcome")}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-3 mb-10 fade-in-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Ghost size={36} className="text-primary" />
        </div>
        <h1 className="text-xl font-bold text-balance text-center">Seja bem-vindo ao seu novo controle financeiro</h1>
        <p className="text-sm text-muted-foreground text-center">Escolha como deseja começar</p>
      </div>

      <div className="w-full max-w-sm space-y-3 fade-in-up stagger-1">
        {/* Create Group */}
        <button
          onClick={handleCreateGroup}
          className="w-full card-zelo flex items-center gap-4 active:scale-[0.98] transition-all hover:border-primary/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Users size={22} className="text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Criar Novo Grupo</p>
            <p className="text-[11px] text-muted-foreground">Inicie um espaço de planejamento do zero</p>
          </div>
        </button>

        {/* Join Group */}
        <button
          onClick={() => setStep("join")}
          className="w-full card-zelo flex items-center gap-4 active:scale-[0.98] transition-all hover:border-primary/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/15">
            <LogIn size={22} className="text-success" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Entrar em um Grupo</p>
            <p className="text-[11px] text-muted-foreground">Use o código de convite para sincronizar</p>
          </div>
        </button>
      </div>

      <p className="mt-8 text-xs text-muted-foreground fade-in-up stagger-2">
        Já tem conta?{" "}
        <button onClick={() => navigate("/login")} className="text-primary font-medium">
          Fazer login
        </button>
      </p>
    </div>
  );
};

export default Onboarding;
