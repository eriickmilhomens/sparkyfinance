import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";

const GlobalNotificationPopup = () => {
  const [notification, setNotification] = useState<{ message: string; id: string } | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    const check = () => {
      const raw = localStorage.getItem("sparky-active-notification");
      if (!raw) return;
      try {
        const notif = JSON.parse(raw);
        if (notif && !notif.read) {
          setNotification({ message: notif.message, id: notif.id });
          setCountdown(notif.minDisplaySeconds || 5);
          setCanClose(false);
        }
      } catch {}
    };

    check();
    window.addEventListener("sparky-notification-push", check);
    return () => window.removeEventListener("sparky-notification-push", check);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!notification || canClose) return;
    if (countdown <= 0) {
      setCanClose(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [notification, countdown, canClose]);

  const handleClose = () => {
    if (!canClose) return;
    // Mark as read
    const raw = localStorage.getItem("sparky-active-notification");
    if (raw) {
      try {
        const notif = JSON.parse(raw);
        notif.read = true;
        localStorage.setItem("sparky-active-notification", JSON.stringify(notif));
      } catch {}
    }
    setNotification(null);
  };

  if (!notification) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm card-zelo space-y-4 text-center animate-scale-in">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-primary/15">
          <Bell size={24} className="text-primary" />
        </div>
        <h3 className="text-base font-bold">Aviso do Administrador</h3>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {notification.message}
        </p>
        <button
          onClick={handleClose}
          disabled={!canClose}
          className={`w-full rounded-xl py-3 text-sm font-semibold active:scale-[0.98] transition-all ${
            canClose
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {canClose ? (
            <span className="flex items-center justify-center gap-2">
              <X size={14} /> Fechar
            </span>
          ) : (
            `Aguarde ${countdown}s...`
          )}
        </button>
      </div>
    </div>
  );
};

export default GlobalNotificationPopup;
