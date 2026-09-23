// src/lib/seo.ts
//
// Google truncates a page's <title> around ~60 characters and its meta
// description around ~155-160 characters before adding "…" in search
// results — these are soft, pixel-width-based limits in reality, but
// 60/155 characters are the conventional safe approximations SEO tooling
// (and this module) uses. Go meaningfully over either and Google either
// cuts your text off mid-word, or — for descriptions well past the limit —
// ignores it entirely and generates its own snippet from page body text,
// so the business loses control of its own search listing.
//
// This module is used ONLY by Layout.astro, and ONLY to derive the
// rendered <title> / <meta name="description"> / Open Graph / Twitter Card
// tag content. It never mutates the `title`/`description` values a page
// passes in — those stay full-length and are free to be reused elsewhere
// on the page (visible H1s/body copy, JSON-LD structured data, etc.),
// where the full, untruncated text is exactly what should appear.
//
// CJK scripts render each character roughly twice as wide as Latin ones,
// so Google fits far fewer of them into the same pixel-width limit —
// budgets are halved for this site's one CJK locale (zh-CN). Scripts with
// no reliable word-spacing (Thai) still get a safe result: see
// truncateAtWordBoundary's fallback below.

const DEFAULT_TITLE_BUDGET = 60;
const DEFAULT_DESCRIPTION_BUDGET = 155;
const CJK_LOCALES = new Set(["zh-CN"]);

function budgetFor(base: number, locale: string): number {
  return CJK_LOCALES.has(locale) ? Math.round(base / 1.8) : base;
}

/**
 * Cuts `text` down to at most `maxLen` characters without breaking a word
 * in half. Prefers the last whitespace boundary at or before the limit.
 * Falls back to a hard character cut when that boundary would throw away
 * too much of the budget (e.g. scripts like Thai that don't reliably use
 * spaces between words, or one long unbroken token) — this guarantees the
 * function always returns something at or under maxLen, never throws, and
 * never returns text so short it stops being a useful title/description.
 */
function truncateAtWordBoundary(text: string, maxLen: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  const slice = trimmed.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > maxLen * 0.4) {
    return slice.slice(0, lastSpace).trim();
  }
  return slice.trim();
}

/**
 * Builds a SERP-safe <title>. Tries `base` plus every suffix part first
 * (parts should be ordered most- to least-essential); if that's over
 * budget, drops suffix parts from the end one at a time — e.g. a brand
 * tag gets dropped before the product name would ever be touched, since
 * search engines commonly append the site name in results on their own
 * anyway. If the bare base is still over budget with zero suffixes left,
 * it's word-boundary-truncated directly so the page still gets a real,
 * readable title instead of a mid-word cutoff.
 */
export function buildSeoTitle(base: string, suffixParts: string[] = [], locale = "en"): string {
  const maxLen = budgetFor(DEFAULT_TITLE_BUDGET, locale);
  const cleanBase = base.trim();
  for (let n = suffixParts.length; n >= 0; n--) {
    const candidate = [cleanBase, ...suffixParts.slice(0, n)].join(" | ");
    if (candidate.length <= maxLen) return candidate;
  }
  return truncateAtWordBoundary(cleanBase, maxLen);
}

/**
 * Builds a SERP-safe meta description. Prefers cutting at the last
 * sentence boundary (. ! ?) at or before the limit, so the visible
 * snippet still reads as a complete thought rather than trailing off
 * mid-clause. Falls back to the last word boundary when the very first
 * sentence already exceeds the budget on its own.
 */
export function buildSeoDescription(text: string, locale = "en"): string {
  const maxLen = budgetFor(DEFAULT_DESCRIPTION_BUDGET, locale);
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  const slice = trimmed.slice(0, maxLen + 1); // +1: catch a sentence end landing exactly on maxLen
  const sentenceEnd = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  if (sentenceEnd > maxLen * 0.4) {
    return trimmed.slice(0, sentenceEnd + 1).trim();
  }
  return truncateAtWordBoundary(trimmed, maxLen);
}
