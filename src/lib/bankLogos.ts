// Mapa centralizado de bancos brasileiros — logos vetoriais reais.
// Estratégia em cascata (sem APIs de busca):
//   1) logo.dev (alta qualidade, retorna logo oficial por domínio)
//   2) Simple Icons CDN (quando o slug existe)
//   3) Avatar circular com inicial sobre cor sólida da marca

export interface BankBrand {
  name: string;
  /** Domínio oficial do banco (ex: "nubank.com.br"). */
  domain: string;
  /** Slug do Simple Icons (opcional). */
  slug: string;
  /** Cor hex da marca SEM o "#". */
  hex: string;
  /** Iniciais para o avatar de fallback. */
  abbr: string;
}

// Token público demo do logo.dev — uso permitido para apps em produção.
const LOGO_DEV_TOKEN = "pk_X-1ZO13GSgeOoUrIuJ6GMQ";

export const BANK_BRANDS: Record<string, BankBrand> = {
  "nubank":          { name: "Nubank",          domain: "nubank.com.br",      slug: "nubank",        hex: "820AD1", abbr: "NU" },
  "nu ":             { name: "Nubank",          domain: "nubank.com.br",      slug: "nubank",        hex: "820AD1", abbr: "NU" },
  "itaú":            { name: "Itaú",            domain: "itau.com.br",        slug: "",              hex: "EC7000", abbr: "IT" },
  "itau":            { name: "Itaú",            domain: "itau.com.br",        slug: "",              hex: "EC7000", abbr: "IT" },
  "bradesco":        { name: "Bradesco",        domain: "bradesco.com.br",    slug: "",              hex: "CC092F", abbr: "BR" },
  "santander":       { name: "Santander",       domain: "santander.com.br",   slug: "",              hex: "EC0000", abbr: "SA" },
  "banco do brasil": { name: "Banco do Brasil", domain: "bb.com.br",          slug: "",              hex: "FAE128", abbr: "BB" },
  "bb":              { name: "Banco do Brasil", domain: "bb.com.br",          slug: "",              hex: "FAE128", abbr: "BB" },
  "caixa":           { name: "Caixa",           domain: "caixa.gov.br",       slug: "",              hex: "0070AF", abbr: "CX" },
  "inter":           { name: "Inter",           domain: "bancointer.com.br",  slug: "",              hex: "FF7A00", abbr: "IN" },
  "c6":              { name: "C6 Bank",         domain: "c6bank.com.br",      slug: "",              hex: "0F0F0F", abbr: "C6" },
  "btg":             { name: "BTG Pactual",     domain: "btgpactual.com",     slug: "",              hex: "001E62", abbr: "BT" },
  "xp":              { name: "XP",              domain: "xpi.com.br",         slug: "",              hex: "000000", abbr: "XP" },
  "picpay":          { name: "PicPay",          domain: "picpay.com",         slug: "picpay",        hex: "21C25E", abbr: "PP" },
  "mercado pago":    { name: "Mercado Pago",    domain: "mercadopago.com.br", slug: "mercadopago",   hex: "00B1EA", abbr: "MP" },
  "next":            { name: "Next",            domain: "next.me",            slug: "",              hex: "00FF5F", abbr: "NX" },
  "neon":            { name: "Neon",            domain: "neon.com.br",        slug: "",              hex: "00E1A0", abbr: "NE" },
  "pan":             { name: "Pan",             domain: "bancopan.com.br",    slug: "",              hex: "0033A0", abbr: "PN" },
  "original":        { name: "Original",        domain: "original.com.br",    slug: "",              hex: "00C853", abbr: "OR" },
  "safra":           { name: "Safra",           domain: "safra.com.br",       slug: "",              hex: "00377B", abbr: "SF" },
  "sicoob":          { name: "Sicoob",          domain: "sicoob.com.br",      slug: "",              hex: "003641", abbr: "SC" },
  "sicredi":         { name: "Sicredi",         domain: "sicredi.com.br",     slug: "",              hex: "3FA535", abbr: "SI" },
  "will":            { name: "Will Bank",       domain: "willbank.com.br",    slug: "",              hex: "00FF85", abbr: "WI" },
  "pagbank":         { name: "PagBank",         domain: "pagbank.com.br",     slug: "",              hex: "00A868", abbr: "PB" },
  "pagseguro":       { name: "PagBank",         domain: "pagbank.com.br",     slug: "",              hex: "00A868", abbr: "PB" },
};

const FALLBACK: BankBrand = {
  name: "Banco",
  domain: "",
  slug: "",
  hex: "60519B",
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
 * Lista ordenada de URLs candidatas — o componente tenta uma a uma via onError
 * até encontrar uma que carregue. Se todas falharem, mostra o avatar de fallback.
 */
export const getBankLogoCandidates = (brand: BankBrand): string[] => {
  const urls: string[] = [];
  if (brand.domain) {
    urls.push(`https://img.logo.dev/${brand.domain}?token=${LOGO_DEV_TOKEN}&size=200&format=png`);
  }
  if (brand.slug) {
    urls.push(`https://cdn.simpleicons.org/${brand.slug}/${brand.hex}`);
  }
  return urls;
};

/** Mantido para compatibilidade — retorna a primeira URL candidata. */
export const getBankLogoUrl = (brand: BankBrand): string | null => {
  const urls = getBankLogoCandidates(brand);
  return urls[0] ?? null;
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
