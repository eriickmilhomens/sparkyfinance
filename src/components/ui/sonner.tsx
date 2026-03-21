import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      position="top-center"
      style={{ top: '15%' }}
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:relative group-[.toaster]:animate-[slideDown_0.35s_cubic-bezier(0.16,1,0.3,1)]",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton: "!right-2 !left-auto !top-1/2 !-translate-y-1/2 !bg-destructive !text-white !border-0 !rounded-full !h-5 !w-5 !flex !items-center !justify-center hover:!bg-destructive/80 !transition-all active:!scale-90 !shadow-sm",
        },
        duration: 2500,
      }}
      closeButton
      {...props}
    />
  );
};

export { Toaster, toast };
