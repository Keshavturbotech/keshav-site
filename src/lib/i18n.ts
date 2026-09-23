// src/lib/i18n.ts
// Phase 2, step 3 of the i18n rollout: single shared loader used identically
// across every page. Loads the English namespace as the base, attempts to
// load the target locale's namespace, and deep-merges locale over English
// field by field — so a partially-translated locale never renders a blank
// field; untranslated leaves silently fall back to English.

// LOCALES/DEFAULT_LOCALE/Locale/isLocale now live in ./localeMeta — that
// file has zero dependencies on translated JSON, so client-side code
// (React islands) can import it directly without pulling in the
// import.meta.glob below. Re-exported here so every existing import of
// these four names from "./i18n" (server-side pages/components only)
// keeps working unchanged.
import { LOCALES, DEFAULT_LOCALE, isLocale } from "./localeMeta";
import type { Locale } from "./localeMeta";
export { LOCALES, DEFAULT_LOCALE, isLocale };
export type { Locale };

// Eagerly load every locale/namespace JSON file at build time so Astro's
// static-site build can bundle/tree-shake correctly across all locale
// static paths. Works the same whether a locale folder has 13 files (en)
// or 0 (a Tier-1 locale before Phase 4 translation work starts on it) —
// missing namespaces simply fall back to English below.
const modules = import.meta.glob("/src/i18n/*/*.json", { eager: true }) as Record<
  string,
  { default: unknown }
>;

const NAMESPACE_INDEX: Record<string, Record<string, unknown>> = {};
for (const [filePath, mod] of Object.entries(modules)) {
  const match = filePath.match(/\/src\/i18n\/([^/]+)\/([^/]+)\.json$/);
  if (!match) continue;
  const [, locale, namespace] = match;
  NAMESPACE_INDEX[locale] ??= {};
  NAMESPACE_INDEX[locale][namespace] = mod.default;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Deep-merges `override` onto `base`, field by field. Only plain objects
// recurse; arrays and primitives in `override` fully replace the base value
// (arrays are never concatenated/merged element-by-element — a partially
// translated array would silently produce a mixed-language list, which is
// worse than falling back to English). To leave part of an array-bearing
// namespace untranslated, omit that field from the locale JSON entirely
// rather than truncating the array.
function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined || override === null) return base;
  if (!isPlainObject(base) || !isPlainObject(override)) return override as T;
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(override)) {
    result[key] = deepMerge((base as Record<string, unknown>)[key], override[key]);
  }
  return result as T;
}

/**
 * Returns the localized data for `namespace` in `locale`, deep-merged over
 * the English baseline. Every page/component should go through this single
 * helper instead of importing src/data/*.ts or src/i18n/en/*.json directly,
 * so English-fallback behavior stays consistent everywhere.
 *
 * @example
 *   const products = getLocalizedData<Record<string, Product>>("products", locale);
 *   const productList = Object.values(products);
 */
export function getLocalizedData<T = Record<string, unknown>>(
  namespace: string,
  locale: string,
): T {
  const english = (NAMESPACE_INDEX[DEFAULT_LOCALE]?.[namespace] ?? {}) as T;
  if (locale === DEFAULT_LOCALE) return english;
  const localeData = NAMESPACE_INDEX[locale]?.[namespace];
  return deepMerge(english, localeData);
}

/**
 * Namespaces are stored as id-keyed objects (see migrate-to-i18n-json.ts —
 * "keyed by stable IDs, not array index"). Most existing pages/components
 * expect an array in insertion order, same as the old src/data/*.ts exports.
 * This restores that array shape after localization.
 */
export function getLocalizedList<T = Record<string, unknown>>(
  namespace: string,
  locale: string,
): T[] {
  const data = getLocalizedData<Record<string, T>>(namespace, locale);
  return Object.values(data);
}
