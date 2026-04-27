import { ShoppingBag, ChevronRight } from "lucide-react";
import InfoButton from "@/components/InfoButton";

const ShoppingCard = () => {
  return (
    <div className="card-zelo fade-in-up stagger-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ShoppingBag size={18} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-semibold">Compras</p>
              <InfoButton
                title="Lista de Compras"
                description="Centralize itens que você precisa comprar. Útil para planejar idas ao mercado e evitar gastos por impulso. (Recurso em desenvolvimento)"
                align="left"
              />
            </div>
            <p className="text-xs text-muted-foreground">3 itens pendentes</p>
          </div>
        </div>
        <button className="flex items-center gap-1 text-xs text-primary font-medium active:scale-95 transition-transform">
          Ver lista <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default ShoppingCard;
