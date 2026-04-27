import { useState, useRef, useEffect } from "react";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoButtonProps {
  /** Título curto exibido no popover */
  title: string;
  /** Texto explicativo sobre o card/seção */
  description: string;
  /** Tamanho do ícone (padrão 14) */
  size?: number;
  className?: string;
  /** Posicionamento do popover relativo ao botão */
  align?: "left" | "right" | "center";
}

/**
 * Botão de info universal — exibe um popover com explicação contextual
 * sobre o que o card/seção faz. Usado em todos os cards principais do app.
 */
const InfoButton = ({
  title,
  description,
  size = 14,
  className,
  align = "right",
}: InfoButtonProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const alignClass =
    align === "left" ? "left-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "right-0";

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={`Informação sobre ${title}`}
        className={cn(
          "inline-flex items-center justify-center rounded-full text-muted-foreground/80",
          "hover:text-primary hover:bg-primary/10 active:scale-90 transition-all",
          "p-1"
        )}
      >
        <Info size={size} strokeWidth={2.2} />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full mt-2 z-50 w-64 rounded-2xl border border-border/60",
            "bg-popover/95 backdrop-blur-xl shadow-2xl p-3.5 animate-in fade-in slide-in-from-top-1 duration-150",
            alignClass
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-2 mb-1.5">
            <div className="h-6 w-6 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Info size={12} className="text-primary" />
            </div>
            <p className="text-xs font-bold text-foreground flex-1 pt-0.5">{title}</p>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground p-0.5 -mt-0.5 -mr-0.5"
              aria-label="Fechar"
            >
              <X size={12} />
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{description}</p>
        </div>
      )}
    </div>
  );
};

export default InfoButton;
