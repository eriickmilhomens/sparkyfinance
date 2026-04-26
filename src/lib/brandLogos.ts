// Logos de marcas para Assinaturas e serviços recorrentes.
// Estratégia em cascata: logo.dev (por domínio) → Simple Icons → fallback avatar.

export interface AppBrand {
  name: string;
  /** Domínio oficial do serviço. */
  domain: string;
  /** Slug do Simple Icons (opcional). */
  slug: string;
  /** Cor hex da marca SEM o "#". */
  hex: string;
  /** Iniciais para o avatar de fallback. */
  abbr: string;
}

const LOGO_DEV_TOKEN = "pk_X-1ZO13GSgeOoUrIuJ6GMQ";

export const APP_BRANDS: Record<string, AppBrand> = {
  "netflix":           { name: "Netflix",           domain: "netflix.com",          slug: "netflix",          hex: "E50914", abbr: "N"  },
  "spotify":           { name: "Spotify",           domain: "spotify.com",          slug: "spotify",          hex: "1DB954", abbr: "S"  },
  "disney":            { name: "Disney+",           domain: "disneyplus.com",       slug: "",                 hex: "0E2A6B", abbr: "D+" },
  "disney+":           { name: "Disney+",           domain: "disneyplus.com",       slug: "",                 hex: "0E2A6B", abbr: "D+" },
  "amazon prime":      { name: "Amazon Prime",      domain: "primevideo.com",       slug: "",                 hex: "00A8E1", abbr: "AP" },
  "prime video":       { name: "Prime Video",       domain: "primevideo.com",       slug: "",                 hex: "00A8E1", abbr: "PV" },
  "amazon":            { name: "Amazon",            domain: "amazon.com",           slug: "amazon",           hex: "FF9900", abbr: "AZ" },
  "youtube premium":   { name: "YouTube Premium",   domain: "youtube.com",          slug: "youtube",          hex: "FF0000", abbr: "YT" },
  "youtube":           { name: "YouTube",           domain: "youtube.com",          slug: "youtube",          hex: "FF0000", abbr: "YT" },
  "icloud":            { name: "iCloud",            domain: "icloud.com",           slug: "icloud",           hex: "3693F3", abbr: "iC" },
  "apple":             { name: "Apple",             domain: "apple.com",            slug: "apple",            hex: "000000", abbr: "AP" },
  "apple music":       { name: "Apple Music",       domain: "music.apple.com",      slug: "applemusic",       hex: "FA243C", abbr: "AM" },
  "apple tv":          { name: "Apple TV+",         domain: "tv.apple.com",         slug: "appletv",          hex: "000000", abbr: "TV" },
  "adobe":             { name: "Adobe",             domain: "adobe.com",            slug: "",                 hex: "FA0F00", abbr: "Ad" },
  "hbo":               { name: "HBO Max",           domain: "max.com",              slug: "hbo",              hex: "0046FF", abbr: "HB" },
  "max":               { name: "Max",               domain: "max.com",              slug: "max",              hex: "0046FF", abbr: "MX" },
  "crunchyroll":       { name: "Crunchyroll",       domain: "crunchyroll.com",      slug: "crunchyroll",      hex: "F47521", abbr: "CR" },
  "xbox":              { name: "Xbox Game Pass",    domain: "xbox.com",             slug: "",                 hex: "107C10", abbr: "XB" },
  "playstation":       { name: "PlayStation Plus",  domain: "playstation.com",      slug: "playstation",      hex: "003791", abbr: "PS" },
  "globoplay":         { name: "Globoplay",         domain: "globoplay.globo.com",  slug: "",                 hex: "FF1F1F", abbr: "GP" },
  "paramount":         { name: "Paramount+",        domain: "paramountplus.com",    slug: "paramountplus",    hex: "0064FF", abbr: "P+" },
  "deezer":            { name: "Deezer",            domain: "deezer.com",           slug: "deezer",           hex: "A238FF", abbr: "DZ" },
  "tidal":             { name: "Tidal",             domain: "tidal.com",            slug: "tidal",            hex: "000000", abbr: "TD" },
  "google one":        { name: "Google One",        domain: "one.google.com",       slug: "",                 hex: "4285F4", abbr: "G1" },
  "google":            { name: "Google",            domain: "google.com",           slug: "google",           hex: "4285F4", abbr: "G"  },
  "microsoft":         { name: "Microsoft 365",     domain: "microsoft.com",        slug: "",                 hex: "0078D4", abbr: "M"  },
  "office":            { name: "Office 365",        domain: "office.com",           slug: "",                 hex: "D83B01", abbr: "OF" },
  "github":            { name: "GitHub",            domain: "github.com",           slug: "github",           hex: "181717", abbr: "GH" },
  "openai":            { name: "ChatGPT",           domain: "openai.com",           slug: "",                 hex: "10A37F", abbr: "AI" },
  "chatgpt":           { name: "ChatGPT",           domain: "openai.com",           slug: "",                 hex: "10A37F", abbr: "AI" },
  "gpt":               { name: "ChatGPT",           domain: "openai.com",           slug: "",                 hex: "10A37F", abbr: "AI" },
  "claude":            { name: "Claude",            domain: "claude.ai",            slug: "",                 hex: "C97757", abbr: "CL" },
  "anthropic":         { name: "Anthropic",         domain: "anthropic.com",        slug: "",                 hex: "C97757", abbr: "AN" },
  "gemini":            { name: "Gemini",            domain: "gemini.google.com",    slug: "",                 hex: "4285F4", abbr: "GE" },
  "perplexity":        { name: "Perplexity",        domain: "perplexity.ai",        slug: "",                 hex: "20808D", abbr: "PX" },
  "notion":            { name: "Notion",            domain: "notion.so",            slug: "notion",           hex: "000000", abbr: "NT" },
  "canva":             { name: "Canva",             domain: "canva.com",            slug: "",                 hex: "00C4CC", abbr: "CV" },
  "figma":             { name: "Figma",             domain: "figma.com",            slug: "figma",            hex: "F24E1E", abbr: "FG" },
  "duolingo":          { name: "Duolingo",          domain: "duolingo.com",         slug: "duolingo",         hex: "58CC02", abbr: "DL" },
  "uber":              { name: "Uber One",          domain: "uber.com",             slug: "uber",             hex: "000000", abbr: "UB" },
  "ifood":             { name: "iFood",             domain: "ifood.com.br",         slug: "ifood",            hex: "EA1D2C", abbr: "iF" },
  "rappi":             { name: "Rappi",             domain: "rappi.com.br",         slug: "",                 hex: "FF441F", abbr: "RP" },
  "claro":             { name: "Claro",             domain: "claro.com.br",         slug: "",                 hex: "E60000", abbr: "CL" },
  "vivo":              { name: "Vivo",              domain: "vivo.com.br",          slug: "vivo",             hex: "660099", abbr: "VV" },
  "tim":               { name: "TIM",               domain: "tim.com.br",           slug: "",                 hex: "003DA5", abbr: "TM" },
  "oi":                { name: "Oi",                domain: "oi.com.br",            slug: "",                 hex: "FFD700", abbr: "OI" },
};

const APP_FALLBACK: AppBrand = {
  name: "App",
  domain: "",
  slug: "",
  hex: "60519B",
  abbr: "",
};

export const getAppBrand = (rawName: string): AppBrand => {
  if (!rawName) return APP_FALLBACK;
  const lower = rawName.toLowerCase().trim();
  if (APP_BRANDS[lower]) return APP_BRANDS[lower];
  for (const [key, brand] of Object.entries(APP_BRANDS)) {
    if (lower.includes(key)) return brand;
  }
  return { ...APP_FALLBACK, abbr: rawName.slice(0, 2).toUpperCase() };
};

/** Cascata de URLs candidatas. */
export const getAppLogoCandidates = (brand: AppBrand): string[] => {
  const urls: string[] = [];
  if (brand.domain) {
    urls.push(`https://img.logo.dev/${brand.domain}?token=${LOGO_DEV_TOKEN}&size=200&format=png`);
  }
  if (brand.slug) {
    urls.push(`https://cdn.simpleicons.org/${brand.slug}/${brand.hex}`);
  }
  return urls;
};

/** Compatibilidade — primeira URL da cascata. */
export const getAppLogoUrl = (brand: AppBrand): string | null => {
  const urls = getAppLogoCandidates(brand);
  return urls[0] ?? null;
};

export const POPULAR_APPS: AppBrand[] = [
  APP_BRANDS["netflix"],
  APP_BRANDS["spotify"],
  APP_BRANDS["disney+"],
  APP_BRANDS["amazon prime"],
  APP_BRANDS["youtube premium"],
  APP_BRANDS["hbo"],
  APP_BRANDS["paramount"],
  APP_BRANDS["globoplay"],
  APP_BRANDS["apple music"],
  APP_BRANDS["deezer"],
  APP_BRANDS["icloud"],
  APP_BRANDS["google one"],
  APP_BRANDS["microsoft"],
  APP_BRANDS["adobe"],
  APP_BRANDS["canva"],
  APP_BRANDS["chatgpt"],
  APP_BRANDS["claude"],
  APP_BRANDS["gemini"],
  APP_BRANDS["crunchyroll"],
  APP_BRANDS["xbox"],
  APP_BRANDS["playstation"],
  APP_BRANDS["duolingo"],
];
