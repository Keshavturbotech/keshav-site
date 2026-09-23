// src/data/currency.ts
// Ported from SUPPORTED_CURRENCIES / FALLBACK_RATES in App.jsx (line ~7501).
export interface Currency {
  code: string;
  symbol: string;
  flag: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: "INR", symbol: "₹", flag: "🇮🇳", name: "Indian Rupee", nativeName: "भारतीय रुपया" },
  { code: "USD", symbol: "$", flag: "🇺🇸", name: "US Dollar", nativeName: "US Dollar" },
  { code: "EUR", symbol: "€", flag: "🇪🇺", name: "Euro", nativeName: "Euro" },
  { code: "GBP", symbol: "£", flag: "🇬🇧", name: "British Pound", nativeName: "British Pound" },
  { code: "AED", symbol: "د.إ", flag: "🇦🇪", name: "UAE Dirham", nativeName: "درهم إماراتي" },
  { code: "SAR", symbol: "﷼", flag: "🇸🇦", name: "Saudi Riyal", nativeName: "ريال سعودي" },
  {
    code: "SGD",
    symbol: "S$",
    flag: "🇸🇬",
    name: "Singapore Dollar",
    nativeName: "Singapore Dollar",
  },
  {
    code: "AUD",
    symbol: "A$",
    flag: "🇦🇺",
    name: "Australian Dollar",
    nativeName: "Australian Dollar",
  },
  { code: "JPY", symbol: "¥", flag: "🇯🇵", name: "Japanese Yen", nativeName: "日本円" },
  { code: "CNY", symbol: "¥", flag: "🇨🇳", name: "Chinese Yuan", nativeName: "人民币" },
  { code: "KRW", symbol: "₩", flag: "🇰🇷", name: "South Korean Won", nativeName: "대한민국 원" },
];

// Fallback rates (INR base). Used as the default — live rate fetching from
// open.er-api.com was in the original but is omitted here to keep this a
// pure static data module; can be re-added as a client fetch in the
// CurrencyDropdown island if live rates matter to you.
export const FALLBACK_RATES: Record<string, number> = {
  INR: 1,
  USD: 0.01195,
  EUR: 0.01098,
  GBP: 0.00942,
  AED: 0.04388,
  SAR: 0.04482,
  SGD: 0.01617,
  AUD: 0.01862,
  JPY: 1.845,
  CNY: 0.08665,
  KRW: 16.52,
};

export function formatPrice(
  inrAmount: number | null | undefined,
  code: string,
  rates: Record<string, number> = FALLBACK_RATES,
): string {
  if (inrAmount == null || Number.isNaN(inrAmount)) return "";
  const rate = rates[code] ?? FALLBACK_RATES[code] ?? 1;
  const converted = inrAmount * rate;
  if (code === "INR") {
    if (converted >= 100000)
      return `₹${(converted / 100000).toFixed(converted % 100000 === 0 ? 0 : 1)}L`;
    if (converted >= 1000) return `₹${(converted / 1000).toFixed(converted % 1000 === 0 ? 0 : 1)}K`;
    return `₹${Math.round(converted).toLocaleString("en-IN")}`;
  }
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      maximumFractionDigits: code === "JPY" ? 0 : 2,
      minimumFractionDigits: code === "JPY" ? 0 : 2,
    }).format(converted);
  } catch {
    return `${converted.toFixed(2)} ${code}`;
  }
}
