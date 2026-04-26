// Mapa centralizado de bancos brasileiros — logos oficiais via múltiplas fontes
// com fallback automático (DuckDuckGo → Google FaviconV2 → icon.horse → sigla).
// Clearbit foi descontinuado em 2024; estas APIs públicas são gratuitas e estáveis.

export interface BankBrand {
  name: string;
  domain: string;          // domínio usado para buscar o logo
  bg: string;              // cor de fundo do "tile" (Tailwind)
  abbr: string;            // fallback caso a imagem não carregue
}

// Chaves em lowercase. getBankBrand() faz match por substring.
export const BANK_BRANDS: Record<string, BankBrand> = {
  "nubank":          { name: "Nubank",          domain: "nubank.com.br",        bg: "bg-[#820AD1]", abbr: "NU" },
  "nu ":             { name: "Nubank",          domain: "nubank.com.br",        bg: "bg-[#820AD1]", abbr: "NU" },
  "itaú":            { name: "Itaú",            domain: "itau.com.br",          bg: "bg-[#EC7000]", abbr: "IT" },
  "itau":            { name: "Itaú",            domain: "itau.com.br",          bg: "bg-[#EC7000]", abbr: "IT" },
  "bradesco":        { name: "Bradesco",        domain: "bradesco.com.br",      bg: "bg-[#CC092F]", abbr: "BR" },
  "santander":       { name: "Santander",       domain: "santander.com.br",     bg: "bg-[#EC0000]", abbr: "SA" },
  "banco do brasil": { name: "Banco do Brasil", domain: "bb.com.br",            bg: "bg-[#FAE128]", abbr: "BB" },
  "bb":              { name: "Banco do Brasil", domain: "bb.com.br",            bg: "bg-[#FAE128]", abbr: "BB" },
  "caixa":           { name: "Caixa",           domain: "caixa.gov.br",         bg: "bg-[#0070AF]", abbr: "CX" },
  "inter":           { name: "Inter",           domain: "bancointer.com.br",    bg: "bg-[#FF7A00]", abbr: "IN" },
  "c6":              { name: "C6 Bank",         domain: "c6bank.com.br",        bg: "bg-[#0F0F0F]", abbr: "C6" },
  "btg":             { name: "BTG Pactual",     domain: "btgpactual.com",       bg: "bg-[#001E62]", abbr: "BT" },
  "xp":              { name: "XP",              domain: "xpi.com.br",           bg: "bg-[#000000]", abbr: "XP" },
  "picpay":          { name: "PicPay",          domain: "picpay.com",           bg: "bg-[#21C25E]", abbr: "PP" },
  "mercado pago":    { name: "Mercado Pago",    domain: "mercadopago.com.br",   bg: "bg-[#00B1EA]", abbr: "MP" },
  "next":            { name: "Next",            domain: "next.me",              bg: "bg-[#00FF5F]", abbr: "NX" },
  "neon":            { name: "Neon",            domain: "neon.com.br",          bg: "bg-[#00E1A0]", abbr: "NE" },
  "pan":             { name: "Pan",             domain: "bancopan.com.br",      bg: "bg-[#0033A0]", abbr: "PN" },
  "original":        { name: "Original",        domain: "original.com.br",      bg: "bg-[#00C853]", abbr: "OR" },
  "safra":           { name: "Safra",           domain: "safra.com.br",         bg: "bg-[#00377B]", abbr: "SF" },
  "sicoob":          { name: "Sicoob",          domain: "sicoob.com.br",        bg: "bg-[#003641]", abbr: "SC" },
  "sicredi":         { name: "Sicredi",         domain: "sicredi.com.br",       bg: "bg-[#3FA535]", abbr: "SI" },
  "will":            { name: "Will Bank",       domain: "willbank.com.br",      bg: "bg-[#00FF85]", abbr: "WI" },
  "pagbank":         { name: "PagBank",         domain: "pagseguro.uol.com.br", bg: "bg-[#00A868]", abbr: "PB" },
  "pagseguro":       { name: "PagBank",         domain: "pagseguro.uol.com.br", bg: "bg-[#00A868]", abbr: "PB" },
};

const FALLBACK: BankBrand = {
  name: "Banco",
  domain: "",
  bg: "bg-muted-foreground",
  abbr: "",
};

export const getBankBrand = (rawName: string): BankBrand => {
  if (!rawName) return FALLBACK;
  const lower = rawName.toLowerCase().trim();
  if (BANK_BRANDS[lower]) return BANK_BRANDS[lower];
  for (const [key, brand] of Object.entries(BANK_BRANDS)) {
    if (lower.includes(key)) return brand;
  }
  return { ...FALLBACK, abbr: rawName.slice(0, 2).toUpperCase() };
};

/**
 * Retorna a lista ordenada de URLs candidatas para o logo, do mais
 * confiável para o menos. O componente tenta cada uma em sequência.
 */
export const getLogoCandidates = (domain: string, size = 128): string[] => {
  if (!domain) return [];
  return [
    // DuckDuckGo: PNG/ICO de alta qualidade, CORS-friendly, sem rate-limit aparente
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    // Google FaviconV2: bom fallback, sempre disponível
    `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=${size}`,
    // icon.horse: terceira opção
    `https://icon.horse/icon/${domain}`,
  ];
};

// Mantido para compatibilidade — retorna a primeira URL candidata
export const getBankLogoUrl = (brand: BankBrand, size = 128): string | null => {
  if (!brand.domain) return null;
  return getLogoCandidates(brand.domain, size)[0];
};

// Lista pública para o seletor de bancos
export const BANK_OPTIONS_LIST: BankBrand[] = [
  BANK_BRANDS["nubank"],
  BANK_BRANDS["itau"],
  BANK_BRANDS["bradesco"],
  BANK_BRANDS["inter"],
  BANK_BRANDS["bb"],
  BANK_BRANDS["caixa"],
  BANK_BRANDS["santander"],
  BANK_BRANDS["c6"],
  BANK_BRANDS["btg"],
  BANK_BRANDS["xp"],
  BANK_BRANDS["picpay"],
  BANK_BRANDS["mercado pago"],
  BANK_BRANDS["next"],
  BANK_BRANDS["neon"],
  BANK_BRANDS["pan"],
  BANK_BRANDS["safra"],
  BANK_BRANDS["sicoob"],
  BANK_BRANDS["sicredi"],
  BANK_BRANDS["will"],
  BANK_BRANDS["pagbank"],
];
