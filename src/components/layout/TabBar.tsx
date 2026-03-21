import { Home, CheckSquare, Wallet, FileText, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
  return (
    <nav
      className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-3"
      style={{ bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
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
  );
};

export default TabBar;
