import { useState, memo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getBankBrand, type BankBrand } from "@/lib/bankLogos";

interface BankLogoProps {
  bankName?: string;
  brand?: BankBrand;
  size?: number;
  className?: string;
  rounded?: string;
}

/**
 * Logo do banco em estilo "tile" iOS:
 * SVG branco do Simple Icons sobre fundo da cor oficial da marca.
 * Nítido, alinhado e padronizado em todos os tamanhos.
 */
const BankLogo = memo(({ bankName = "", brand, size = 40, className, rounded = "rounded-xl" }: BankLogoProps) => {
  const resolved = brand ?? getBankBrand(bankName);
  const url = resolved.slug ? `https://cdn.simpleicons.org/${resolved.slug}/ffffff` : null;
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [resolved.slug]);

  const showImage = !!url && !errored;
  const padding = Math.max(6, Math.round(size * 0.22));

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden shrink-0 shadow-sm",
        rounded,
        className
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: `#${resolved.hex}`,
      }}
      aria-label={resolved.name || bankName}
    >
      {showImage ? (
        <img
          src={url!}
          alt={resolved.name || bankName}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
          style={{
            width: size - padding * 2,
            height: size - padding * 2,
            objectFit: "contain",
            display: "block",
          }}
        />
      ) : (
        <span
          className="font-bold tracking-tight text-white"
          style={{ fontSize: Math.max(11, size * 0.4), lineHeight: 1 }}
        >
          {resolved.abbr || bankName.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
});

BankLogo.displayName = "BankLogo";

export default BankLogo;
