// src/lib/localeMeta.ts
// Client-safe locale metadata — plain constants only, NO translated JSON
// content. Safe to import from a React island (LanguageSwitcher.jsx, etc.)
// or any other client-side bundle.
//
// src/lib/i18n.ts eagerly globs every locale's JSON via import.meta.glob at
// module-eval time — importing THAT file client-side would ship the entire
// translated catalog (all 17 locales × all namespaces) to the browser. This
// file exists so nothing client-side ever has a reason to import i18n.ts.
//
// i18n.ts imports LOCALES/DEFAULT_LOCALE/Locale/isLocale FROM this file
// (not the other way around) so there is exactly one source of truth and no
// risk of the two lists drifting apart.

export const LOCALES = [
  "en",
  "hi",
  "mr",
  "gu",
  "ar",
  "fr",
  "ne",
  "es",
  "pt",
  "ru",
  "de",
  "zh-CN",
  "id",
  "th",
  "vi",
  "tr",
  "sw",
] as const;

export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

// Every locale on this site is left-to-right except Arabic. Kept as a Set
// (not a single ===  "ar" check) since future Tier-1 additions (e.g. Urdu,
// Farsi) would also be RTL. Layout.astro has its own copy of this today —
// safe to leave as-is there (it's a one-line literal, not the JSON glob
// this file protects against), but new client-side code should import it
// from here.
export const RTL_LOCALES = new Set<Locale>(["ar"]);

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

// Prefixes a locale-agnostic path (e.g. "/products/foo", "/about", "/") with
// the correct URL segment for a given locale — the client-safe equivalent of
// astro:i18n's getRelativeLocaleUrl(), which can't be imported into a React
// island (it only works server-side in .astro files). Mirrors the exact
// routing rules in astro.config.mjs: prefixDefaultLocale: false (English
// stays unprefixed), and zh-CN's URL segment is lowercased ("zh-cn") while
// every other locale's code already equals its own URL segment.
//
// This exists because Navbar.jsx and several other client islands build
// their own internal links (mega-menu items, product cards, search
// results, footer links) — every one of those was found hardcoded to a
// plain English path with no locale awareness at all, meaning any click on
// them from a translated page silently dropped the visitor back to
// English. Every internal href built client-side should go through this.
export function localizedPath(locale: string, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return normalized;
  const segment = locale === "zh-CN" ? "zh-cn" : locale;
  return normalized === "/" ? `/${segment}` : `/${segment}${normalized}`;
}
