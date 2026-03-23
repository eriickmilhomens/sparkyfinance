import { useRef, useState, useCallback } from "react";
import { Sun, Moon, RefreshCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import ProfileSwitcher from "@/components/layout/ProfileSwitcher";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";

const CatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6l2 6" />
    <path d="M20 6l-2 6" />
    <circle cx="12" cy="14" r="7" />
    <circle cx="9.5" cy="13" r="0.8" fill="hsl(var(--primary))" />
    <circle cx="14.5" cy="13" r="0.8" fill="hsl(var(--primary))" />
    <path d="M12 15.5l-0.8 0.5h1.6L12 15.5z" fill="hsl(var(--primary))" />
    <path d="M6 14h2.5M15.5 14H18M6 16h2.5M15.5 16H18" strokeWidth="1" />
  </svg>
);

const EASTER_EGG_MESSAGES = [
  "🐱 Miau! Você me encontrou!",
  "🐱 Psst... eu sou o Sparky, o gato financeiro!",
  "🐱 Dica secreta: economize 30% do salário todo mês!",
  "🐱 Estou de olho nas suas finanças... 👀",
  "🐱 Você é persistente! Aqui vai um biscoito virtual 🍪",
];

const CACHE_KEYS_TO_CLEAR = [
  "sparky-daily-snapshot",
  "sparky-open-finance-cache",
  "sparky-sync-data",
  "sparky-sync-status",
];

const Header = () => {
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
      // Clear stale cache entries
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
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <button
          onClick={handleCatClick}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 active:scale-90 transition-transform"
        >
          <CatIcon />
        </button>
        <span
          onClick={handleNameClick}
          className="text-lg font-bold tracking-tight select-none cursor-default active:scale-95 transition-transform"
        >
          SPARKY
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground active:scale-95 disabled:opacity-50"
          title="Sincronizar dados"
        >
          <RefreshCcw size={18} className={syncing ? "animate-spin" : ""} />
        </button>
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground active:scale-95"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <ProfileSwitcher />
      </div>
    </header>
  );
};

export default Header;
