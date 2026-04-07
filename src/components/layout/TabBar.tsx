import { useState, useEffect, useCallback, memo } from "react";
import { Home, CheckSquare, Wallet, FileText, MessageCircle, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const DOCK_OFFSET_KEY = "sparky-dock-offset";

const getStoredOffset = (): number => {
  const v = localStorage.getItem(DOCK_OFFSET_KEY);
  return v ? parseInt(v, 10) : 12;
};

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Hoje", icon: Home },
  { id: "tasks", label: "Ranking", icon: CheckSquare },
  { id: "chat", label: "Sparky", icon: MessageCircle },
  { id: "expenses", label: "Despesas", icon: Wallet },
  { id: "docs", label: "Docs", icon: FileText },
];

const TabBar = memo(({ activeTab, onTabChange }: TabBarProps) => {
  const [adjusting, setAdjusting] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [offset, setOffset] = useState(getStoredOffset);
  const [tempOffset, setTempOffset] = useState(offset);
  const queryClient = useQueryClient();

  // Prefetch financial data on hover/focus of Expenses tab
  const handlePointerEnter = useCallback((tabId: string) => {
    if (tabId === "expenses" && activeTab !== "expenses") {
      queryClient.prefetchQuery({ queryKey: ["financial-data"] });
    }
  }, [activeTab, queryClient]);

  useEffect(() => {
    const handler = () => { setTempOffset(offset); setAdjusting(true); };
    const showHandler = () => setHidden(false);
    const hideHandler = () => setHidden(true);
    window.addEventListener("sparky-dock-adjust", handler);
    window.addEventListener("sparky-dock-show", showHandler);
    window.addEventListener("sparky-dock-hide", hideHandler);
    return () => {
      window.removeEventListener("sparky-dock-adjust", handler);
      window.removeEventListener("sparky-dock-show", showHandler);
      window.removeEventListener("sparky-dock-hide", hideHandler);
    };
  }, [offset]);

  const handleSave = useCallback(() => {
    setOffset(tempOffset);
    localStorage.setItem(DOCK_OFFSET_KEY, String(tempOffset));
    setAdjusting(false);
    toast("Posição salva!", { duration: 2000 });
  }, [tempOffset]);

  const handleCancel = useCallback(() => {
    setTempOffset(offset);
    setAdjusting(false);
  }, [offset]);

  const currentBottom = adjusting ? tempOffset : offset;

  return (
    <>
      {adjusting && (
        <div className="fixed inset-0 z-[59] bg-background/60 backdrop-blur-sm flex flex-col items-center justify-end pb-40">
          <div className="w-[85%] max-w-sm rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-5 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-display font-semibold text-foreground">Posição da Dock</h3>
              <div className="flex gap-2">
                <button onClick={handleCancel} className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/15 text-destructive active:scale-90 transition-all duration-300"><X size={16} /></button>
                <button onClick={handleSave} className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary active:scale-90 transition-all duration-300"><Check size={16} /></button>
              </div>
            </div>
            <input type="range" min={-40} max={80} value={tempOffset} onChange={(e) => setTempOffset(parseInt(e.target.value, 10))} className="w-full accent-primary" />
            <p className="text-xs text-muted-foreground text-center">Arraste para ajustar • {tempOffset}px do fundo</p>
          </div>
        </div>
      )}

      <nav
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center transition-all duration-300",
          hidden && !adjusting && "translate-y-[200%] opacity-0"
        )}
      >
        {/* Dock pill */}
        <div className="w-full flex justify-center px-4" style={{ marginBottom: `${currentBottom}px` }}>
          <div className="liquid-dock pointer-events-auto mx-auto flex w-full max-w-lg items-center justify-around rounded-3xl px-2 py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  onPointerEnter={() => handlePointerEnter(tab.id)}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-2 transition-transform duration-300 will-change-transform",
                    isActive
                      ? "bg-primary/15 text-primary shadow-sm shadow-primary/10"
                      : "text-muted-foreground active:scale-95 hover:text-foreground"
                  )}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className={cn("text-[9px] font-display tabular-nums", isActive ? "font-bold" : "font-medium")}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
      {/* Full-bleed safe area background — always visible, pinned to absolute bottom */}
      <div
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-[59]"
        style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 20px)', background: '#0e1420' }}
      />
    </>
  );
});

TabBar.displayName = "TabBar";

export default TabBar;
