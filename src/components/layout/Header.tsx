import { useRef, useState, useCallback } from "react";
import { Sun, Moon, RefreshCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import ProfileSwitcher from "@/components/layout/ProfileSwitcher";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";

const SparkBadge = () => (
  <span className="font-display font-extrabold text-base text-primary leading-none select-none">S</span>
);

const EASTER_EGG_MESSAGES = [
  "Você encontrou um easter egg!",
  "Dica: economize 30% do salário todo mês.",
  "De olho nas suas finanças.",
  "Persistente, hein? Continue assim.",
];

const CACHE_KEYS_TO_CLEAR = [
  "sparky-daily-snapshot",
  "sparky-open-finance-cache",
  "sparky-sync-data",
  "sparky-sync-status",
];

interface HeaderProps {
  hidden?: boolean;
}

const Header = ({ hidden = false }: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const catClickCount = useRef(0);
  const catClickTimer = useRef<NodeJS.Timeout | null>(null);
  const nameClickCount = useRef(0);
  const nameClickTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      CACHE_KEYS_TO_CLEAR.forEach((k) => localStorage.removeItem(k));
      window.dispatchEvent(new Event("sparky-profile-refresh"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["financial-data"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["group-members"] }),
        queryClient.refetchQueries({ type: "active" }),
      ]);
      window.dispatchEvent(new Event("sparky-data-cleared"));
      window.dispatchEvent(new Event("sparky-points-updated"));
      toast.success("Dados sincronizados com sucesso! Seu saldo e ranking estão em dia.", { duration: 2500 });
    } catch {
      toast.error("Erro ao sincronizar", { duration: 2000 });
    } finally {
      setSyncing(false);
    }
  }, [syncing, queryClient]);

  const handleCatClick = () => {
    catClickCount.current += 1;
    if (catClickTimer.current) clearTimeout(catClickTimer.current);
    catClickTimer.current = setTimeout(() => { catClickCount.current = 0; }, 2000);
    if (catClickCount.current >= 7) {
      catClickCount.current = 0;
      const msg = EASTER_EGG_MESSAGES[Math.floor(Math.random() * EASTER_EGG_MESSAGES.length)];
      toast(msg, { duration: 4000 });
    }
  };

  const handleNameClick = () => {
    nameClickCount.current += 1;
    if (nameClickTimer.current) clearTimeout(nameClickTimer.current);
    nameClickTimer.current = setTimeout(() => { nameClickCount.current = 0; }, 1500);
    if (nameClickCount.current >= 3) {
      nameClickCount.current = 0;
      window.dispatchEvent(new Event("sparky-dock-adjust"));
    }
  };

  return (
    <header className={`sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background/70 backdrop-blur-2xl transition-transform duration-300 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={handleCatClick}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 glow-ring active:scale-90 transition-all duration-300"
          aria-label="Spark"
        >
          <SparkBadge />
        </button>
        <span
          onClick={handleNameClick}
          className="text-lg font-display font-bold tracking-tight select-none cursor-default active:scale-95 transition-all duration-300 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text"
        >
          SPARK
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="rounded-2xl p-2.5 text-muted-foreground transition-all duration-300 hover:text-foreground hover:bg-muted/50 active:scale-95 disabled:opacity-50"
          title="Sincronizar dados"
        >
          <RefreshCcw size={16} className={syncing ? "animate-spin" : ""} />
        </button>
        <button
          onClick={toggleTheme}
          className="rounded-2xl p-2.5 text-muted-foreground transition-all duration-300 hover:text-foreground hover:bg-muted/50 active:scale-95"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <ProfileSwitcher />
      </div>
    </header>
  );
};

export default Header;
