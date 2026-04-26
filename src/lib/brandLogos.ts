// Logos de marcas para Assinaturas e serviços recorrentes.
// Mesma estratégia de multi-fallback usada em bankLogos.ts.

import { getLogoCandidates } from "./bankLogos";

export interface AppBrand {
  name: string;
  domain: string;
  bg: string;     // cor de fundo Tailwind (cor oficial da marca)
  abbr: string;   // fallback se a imagem não carregar
}

export const APP_BRANDS: Record<string, AppBrand> = {
  "netflix":           { name: "Netflix",           domain: "netflix.com",          bg: "bg-[#E50914]", abbr: "N"  },
  "spotify":           { name: "Spotify",           domain: "spotify.com",          bg: "bg-[#1DB954]", abbr: "S"  },
  "disney":            { name: "Disney+",           domain: "disneyplus.com",       bg: "bg-[#0E2A6B]", abbr: "D+" },
  "disney+":           { name: "Disney+",           domain: "disneyplus.com",       bg: "bg-[#0E2A6B]", abbr: "D+" },
  "amazon prime":      { name: "Amazon Prime",      domain: "primevideo.com",       bg: "bg-[#00A8E1]", abbr: "AP" },
  "prime video":       { name: "Prime Video",       domain: "primevideo.com",       bg: "bg-[#00A8E1]", abbr: "PV" },
  "amazon":            { name: "Amazon",            domain: "amazon.com.br",        bg: "bg-[#FF9900]", abbr: "AZ" },
  "youtube premium":   { name: "YouTube Premium",   domain: "youtube.com",          bg: "bg-[#FF0000]", abbr: "YT" },
  "youtube":           { name: "YouTube",           domain: "youtube.com",          bg: "bg-[#FF0000]", abbr: "YT" },
  "icloud":            { name: "iCloud",            domain: "icloud.com",           bg: "bg-[#3693F3]", abbr: "iC" },
  "apple":             { name: "Apple",             domain: "apple.com",            bg: "bg-[#000000]", abbr: "AP" },
  "apple music":       { name: "Apple Music",       domain: "music.apple.com",      bg: "bg-[#FA243C]", abbr: "AM" },
  "apple tv":          { name: "Apple TV+",         domain: "tv.apple.com",         bg: "bg-[#000000]", abbr: "TV" },
  "adobe":             { name: "Adobe",             domain: "adobe.com",            bg: "bg-[#FA0F00]", abbr: "Ad" },
  "hbo":               { name: "HBO Max",           domain: "max.com",              bg: "bg-[#0046FF]", abbr: "HB" },
  "max":               { name: "Max",               domain: "max.com",              bg: "bg-[#0046FF]", abbr: "MX" },
  "crunchyroll":       { name: "Crunchyroll",       domain: "crunchyroll.com",      bg: "bg-[#F47521]", abbr: "CR" },
  "xbox":              { name: "Xbox Game Pass",    domain: "xbox.com",             bg: "bg-[#107C10]", abbr: "XB" },
  "playstation":       { name: "PlayStation Plus",  domain: "playstation.com",      bg: "bg-[#003791]", abbr: "PS" },
  "globoplay":         { name: "Globoplay",         domain: "globoplay.globo.com",  bg: "bg-[#FF1F1F]", abbr: "GP" },
  "paramount":         { name: "Paramount+",        domain: "paramountplus.com",    bg: "bg-[#0064FF]", abbr: "P+" },
  "deezer":            { name: "Deezer",            domain: "deezer.com",           bg: "bg-[#A238FF]", abbr: "DZ" },
  "tidal":             { name: "Tidal",             domain: "tidal.com",            bg: "bg-[#000000]", abbr: "TD" },
  "google one":        { name: "Google One",        domain: "one.google.com",       bg: "bg-[#4285F4]", abbr: "G1" },
  "google":            { name: "Google",            domain: "google.com",           bg: "bg-[#4285F4]", abbr: "G"  },
  "microsoft":         { name: "Microsoft 365",     domain: "microsoft.com",        bg: "bg-[#0078D4]", abbr: "M"  },
  "office":            { name: "Office 365",        domain: "office.com",           bg: "bg-[#D83B01]", abbr: "OF" },
  "github":            { name: "GitHub",            domain: "github.com",           bg: "bg-[#181717]", abbr: "GH" },
  "openai":            { name: "ChatGPT",           domain: "openai.com",           bg: "bg-[#10A37F]", abbr: "AI" },
  "chatgpt":           { name: "ChatGPT",           domain: "openai.com",           bg: "bg-[#10A37F]", abbr: "AI" },
  "notion":            { name: "Notion",            domain: "notion.so",            bg: "bg-[#000000]", abbr: "NT" },
  "canva":             { name: "Canva",             domain: "canva.com",            bg: "bg-[#00C4CC]", abbr: "CV" },
  "figma":             { name: "Figma",             domain: "figma.com",            bg: "bg-[#F24E1E]", abbr: "FG" },
  "duolingo":          { name: "Duolingo",          domain: "duolingo.com",         bg: "bg-[#58CC02]", abbr: "DL" },
  "uber":              { name: "Uber One",          domain: "uber.com",             bg: "bg-[#000000]", abbr: "UB" },
  "ifood":             { name: "iFood",             domain: "ifood.com.br",         bg: "bg-[#EA1D2C]", abbr: "iF" },
  "rappi":             { name: "Rappi",             domain: "rappi.com.br",         bg: "bg-[#FF441F]", abbr: "RP" },
  "claro":             { name: "Claro",             domain: "claro.com.br",         bg: "bg-[#E60000]", abbr: "CL" },
  "vivo":              { name: "Vivo",              domain: "vivo.com.br",          bg: "bg-[#660099]", abbr: "VV" },
  "tim":               { name: "TIM",               domain: "tim.com.br",           bg: "bg-[#003DA5]", abbr: "TM" },
  "oi":                { name: "Oi",                domain: "oi.com.br",            bg: "bg-[#FFD700]", abbr: "OI" },
};

const APP_FALLBACK: AppBrand = {
  name: "App",
  domain: "",
  bg: "bg-primary",
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

export const getAppLogoCandidates = (brand: AppBrand, size = 128): string[] => {
  return getLogoCandidates(brand.domain, size);
};

// Lista para o seletor de assinaturas populares
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
  APP_BRANDS["crunchyroll"],
  APP_BRANDS["xbox"],
  APP_BRANDS["playstation"],
  APP_BRANDS["duolingo"],
];
