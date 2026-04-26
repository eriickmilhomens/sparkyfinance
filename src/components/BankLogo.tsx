import { useState, memo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getBankBrand, getBankLogoCandidates, type BankBrand } from "@/lib/bankLogos";

interface BankLogoProps {
  bankName?: string;
  brand?: BankBrand;
  size?: number;
  className?: string;
  rounded?: string;
}

/**
 * Logo do banco com cascata de fallbacks: logo.dev → Simple Icons → avatar com inicial.
 * 100% determinístico, sem APIs de busca.
 */
const BankLogo = memo(({ bankName = "", brand, size = 40, className, rounded = "rounded-xl" }: BankLogoProps) => {
  const resolved = brand ?? getBankBrand(bankName);
  const candidates = getBankLogoCandidates(resolved);
  const [idx, setIdx] = useState(0);
  const [allFailed, setAllFailed] = useState(candidates.length === 0);

  useEffect(() => {
    setIdx(0);
    setAllFailed(candidates.length === 0);
  }, [resolved.domain, resolved.slug, candidates.length]);

  const currentUrl = candidates[idx];
  const showImage = !allFailed && !!currentUrl;

  const handleError = () => {
    if (idx < candidates.length - 1) {
      setIdx(idx + 1);
    } else {
      setAllFailed(true);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden shrink-0",
        rounded,
        showImage ? "bg-white" : "",
        className
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: showImage ? undefined : `#${resolved.hex}`,
      }}
      aria-label={resolved.name || bankName}
    >
      {showImage ? (
        <img
          key={currentUrl}
          src={currentUrl}
          alt={resolved.name || bankName}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={handleError}
          className="h-full w-full p-1"
          style={{ objectFit: "contain" }}
        />
      ) : (
        <span
          className="font-bold tracking-tight text-white"
          style={{ fontSize: Math.max(10, size * 0.34) }}
        >
          {resolved.abbr || bankName.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
});

BankLogo.displayName = "BankLogo";

export default BankLogo;
