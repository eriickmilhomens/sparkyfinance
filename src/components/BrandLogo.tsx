import { useState, memo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getAppBrand, getAppLogoCandidates, type AppBrand } from "@/lib/brandLogos";

interface BrandLogoProps {
  /** Nome bruto do app/serviço (ex: "Netflix") OU brand já resolvida */
  appName?: string;
  brand?: AppBrand;
  size?: number;
  className?: string;
  rounded?: string;
}

/**
 * Logo de aplicativos/serviços (assinaturas) com cascata multi-fonte.
 * Mesma estratégia do BankLogo: DuckDuckGo → Google FaviconV2 → icon.horse → sigla.
 */
const BrandLogo = memo(({ appName = "", brand, size = 44, className, rounded = "rounded-xl" }: BrandLogoProps) => {
  const resolved = brand ?? getAppBrand(appName);
  const candidates = getAppLogoCandidates(resolved, size * 2);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [resolved.domain]);

  const showImage = candidates.length > 0 && idx < candidates.length;

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden shrink-0 shadow-sm",
        rounded,
        resolved.bg,
        className
      )}
      style={{ width: size, height: size }}
      aria-label={resolved.name || appName}
    >
      {showImage ? (
        <img
          key={candidates[idx]}
          src={candidates[idx]}
          alt={resolved.name || appName}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setIdx((i) => i + 1)}
          className="h-full w-full object-contain p-1"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }}
        />
      ) : (
        <span className="text-xs font-bold text-white tracking-tight">
          {resolved.abbr || appName.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
});

BrandLogo.displayName = "BrandLogo";

export default BrandLogo;
