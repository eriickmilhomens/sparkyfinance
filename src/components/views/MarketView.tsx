import { ShoppingCart, Plus, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const initialItems = [
  { id: 1, name: "Arroz 5kg", done: false, price: "R$ 28,90" },
  { id: 2, name: "Leite integral", done: true, price: "R$ 6,50" },
  { id: 3, name: "Café 500g", done: false, price: "R$ 18,00" },
  { id: 4, name: "Detergente", done: false, price: "R$ 3,20" },
  { id: 5, name: "Papel toalha", done: true, price: "R$ 8,90" },
];

const MarketView = () => {
  const [items, setItems] = useState(initialItems);

  const toggle = (id: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  const pending = items.filter((i) => !i.done).length;

  return (
    <div className="px-4 pb-24 space-y-4">
      <div className="flex items-center justify-between pt-3">
        <div>
          <h1 className="text-xl font-bold">Mercado</h1>
          <p className="text-xs text-muted-foreground mt-1">{pending} itens pendentes</p>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary active:scale-95 transition-transform">
          <Plus size={18} />
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            className={cn(
              "card-zelo w-full flex items-center gap-3 text-left transition-all active:scale-[0.98] fade-in-up",
              `stagger-${i + 1}`
            )}
          >
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-lg border transition-colors",
              item.done ? "bg-success/20 border-success/30" : "border-border"
            )}>
              {item.done && <Check size={14} className="text-success" />}
            </div>
            <span className={cn("text-sm flex-1", item.done && "line-through text-muted-foreground")}>
              {item.name}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">{item.price}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MarketView;
