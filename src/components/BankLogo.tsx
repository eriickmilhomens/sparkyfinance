import { useState, memo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getBankBrand, getLogoCandidates, type BankBrand } from "@/lib/bankLogos";

interface BankLogoProps {
  bankName?: string;
  brand?: BankBrand;
  size?: number;
  className?: string;
  rounded?: string;
}

/**
 * Renderiza o logotipo oficial do banco com cascata de fontes:
 *   DuckDuckGo → Google FaviconV2 → icon.horse → fallback (sigla colorida).
 * Cada fonte é tentada quando a anterior falha em carregar.
 */
const BankLogo = memo(({ bankName = "", brand, size = 40, className, rounded = "rounded-xl" }: BankLogoProps) => {
  const resolved = brand ?? getBankBrand(bankName);
  const candidates = getLogoCandidates(resolved.domain, size * 2);
  const [idx, setIdx] = useState(0);

  // Reset quando o banco muda
  useEffect(() => {
    setIdx(0);
  }, [resolved.domain]);

  const showImage = candidates.length > 0 && idx < candidates.length;

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden shrink-0",
        rounded,
        resolved.bg,
        className
      )}
      style={{ width: size, height: size }}
      aria-label={resolved.name || bankName}
    >
      {showImage ? (
        <img
          key={candidates[idx]}
          src={candidates[idx]}
          alt={resolved.name || bankName}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setIdx((i) => i + 1)}
          className="h-full w-full object-contain p-1"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}
        />
      ) : (
        <span className="text-xs font-bold text-white tracking-tight">
          {resolved.abbr || bankName.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
});

BankLogo.displayName = "BankLogo";

export default BankLogo;
