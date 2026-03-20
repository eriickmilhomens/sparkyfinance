import { useState } from "react";
import { Copy, Check, Crown, Star, Shield, Users } from "lucide-react";

const MembersView = () => {
  const [copied, setCopied] = useState(false);
  const groupCode = "RFL45QUH";

  const handleCopy = () => {
    navigator.clipboard.writeText(groupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-4 pb-24 space-y-4">
      <div className="pt-3">
        <h1 className="text-xl font-bold">Gestão de Membros</h1>
      </div>

      {/* Group Code */}
      <div className="card-zelo fade-in-up">
        <p className="text-label mb-2">CÓDIGO DE CONVITE DO GRUPO</p>
        <div className="flex items-center gap-3">
          <span className="flex-1 rounded-xl bg-muted/50 border border-border px-4 py-3 text-lg font-mono font-bold tracking-[0.3em] text-center">
            {groupCode}
          </span>
          <button
            onClick={handleCopy}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary active:scale-95 transition-all"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card-zelo fade-in-up stagger-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
              <Users size={14} className="text-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">Total de Participantes</span>
          </div>
          <p className="text-2xl font-bold">3</p>
        </div>
        <div className="card-zelo fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15">
              <Shield size={14} className="text-warning" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">Administradores</span>
          </div>
          <p className="text-2xl font-bold">1</p>
        </div>
      </div>

      {/* Admin List */}
      <div className="fade-in-up stagger-3">
        <p className="text-label mb-2 px-1">MEMBROS</p>
        <div className="card-zelo !p-0 divide-y divide-border">
          {/* Admin */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-primary/10 text-sm font-bold">
                E
              </div>
              <Crown size={12} className="absolute -top-1 -right-1 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">erick</p>
                <span className="text-[10px] text-muted-foreground">(eriq)</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
                  <Shield size={8} /> Admin
                </span>
                <span className="text-[10px] text-muted-foreground">60 pontos</span>
              </div>
            </div>
          </div>

          {/* Member */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-success/40 to-success/10 text-sm font-bold">
                A
              </div>
              <Star size={12} className="absolute -top-1 -right-1 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">ana</p>
                <span className="text-[10px] text-muted-foreground">(aninha)</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Membro
                </span>
                <span className="text-[10px] text-muted-foreground">35 pontos</span>
              </div>
            </div>
          </div>

          {/* Member */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-destructive/40 to-destructive/10 text-sm font-bold">
                C
              </div>
              <Star size={12} className="absolute -top-1 -right-1 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">casa</p>
                <span className="text-[10px] text-muted-foreground">(compartilhado)</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Membro
                </span>
                <span className="text-[10px] text-muted-foreground">15 pontos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersView;
