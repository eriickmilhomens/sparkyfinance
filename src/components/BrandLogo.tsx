import { useState, memo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getAppBrand, type AppBrand } from "@/lib/brandLogos";

interface BrandLogoProps {
  appName?: string;
  brand?: AppBrand;
  size?: number;
  className?: string;
  rounded?: string;
}

/**
 * Logo de aplicativos/serviços (assinaturas).
 * Estratégia: SVG branco do Simple Icons sobre tile com cor sólida da marca.
 * Visual padronizado, nítido em qualquer tamanho, sem desalinhamento.
 */
const BrandLogo = memo(({ appName = "", brand, size = 40, className, rounded = "rounded-xl" }: BrandLogoProps) => {
  const resolved = brand ?? getAppBrand(appName);
  // Sempre renderizamos o glifo em branco sobre o tile colorido
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
      aria-label={resolved.name || appName}
    >
      {showImage ? (
        <img
          src={url!}
          alt={resolved.name || appName}
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
          {resolved.abbr || appName.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
});

BrandLogo.displayName = "BrandLogo";

export default BrandLogo;
