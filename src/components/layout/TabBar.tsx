import { useState, useEffect, useCallback } from "react";
import { Home, CheckSquare, Wallet, FileText, MessageCircle, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

const TabBar = ({ activeTab, onTabChange }: TabBarProps) => {
  const [adjusting, setAdjusting] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [offset, setOffset] = useState(getStoredOffset);
  const [tempOffset, setTempOffset] = useState(offset);

  useEffect(() => {
    const handler = () => {
      setTempOffset(offset);
      setAdjusting(true);
    };
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
      {/* Adjust overlay */}
      {adjusting && (
        <div className="fixed inset-0 z-[59] bg-background/60 backdrop-blur-sm flex flex-col items-center justify-end pb-40">
          <div className="w-[85%] max-w-sm rounded-2xl border border-border bg-card p-5 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Posição da Dock</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/15 text-destructive active:scale-90 transition-transform"
                >
                  <X size={16} />
                </button>
                <button
                  onClick={handleSave}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary active:scale-90 transition-transform"
                >
                  <Check size={16} />
                </button>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              value={tempOffset}
              onChange={(e) => setTempOffset(parseInt(e.target.value, 10))}
              className="w-full accent-primary"
            />
            <p className="text-xs text-muted-foreground text-center">
              Arraste para ajustar • {tempOffset}px do fundo
            </p>
          </div>
        </div>
      )}

      {/* Dock */}
      <nav
        className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-3 transition-all duration-300"
        style={{ bottom: `calc(${currentBottom}px + env(safe-area-inset-bottom, 0px))` }}
      >
        <div className="liquid-dock pointer-events-auto mx-auto flex w-full max-w-lg items-center justify-around rounded-full px-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-3 py-2 transition-all duration-200",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground active:scale-95"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-normal")}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default TabBar;
