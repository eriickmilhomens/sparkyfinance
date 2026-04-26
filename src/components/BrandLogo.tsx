import { useState, memo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getAppBrand, getAppLogoCandidates, type AppBrand } from "@/lib/brandLogos";

interface BrandLogoProps {
  appName?: string;
  brand?: AppBrand;
  size?: number;
  className?: string;
  rounded?: string;
}

/**
 * Logo de app/serviço com cascata: logo.dev → Simple Icons → avatar com inicial.
 */
const BrandLogo = memo(({ appName = "", brand, size = 44, className, rounded = "rounded-xl" }: BrandLogoProps) => {
  const resolved = brand ?? getAppBrand(appName);
  const candidates = getAppLogoCandidates(resolved);
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
        "flex items-center justify-center overflow-hidden shrink-0 shadow-sm",
        rounded,
        showImage ? "bg-white" : "",
        className
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: showImage ? undefined : `#${resolved.hex}`,
      }}
      aria-label={resolved.name || appName}
    >
      {showImage ? (
        <img
          key={currentUrl}
          src={currentUrl}
          alt={resolved.name || appName}
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
          {resolved.abbr || appName.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
});

BrandLogo.displayName = "BrandLogo";

export default BrandLogo;
