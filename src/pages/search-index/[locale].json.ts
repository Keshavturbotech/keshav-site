// src/pages/search-index/[locale].json.ts
//
// Per-language product search index for the Navbar search dropdown.
//
// WHY THIS EXISTS: Navbar is hydrated on every page (~2,800 of them) and used
// to receive the whole product list as an island prop. Astro serialises island
// props into each page's HTML, so the same ~190 KB (en) / ~400 KB (hi) blob was
// duplicated into every page (~620 MB of the build output). The search box is
// the only consumer, so the list now lives in ONE static JSON file per
// language that the Navbar fetches on demand (and caches for the session).
//
// Output: dist/search-index/<path-code>.json (build.format "file" keeps the
// `.json` name as-is). The URL segment is the astro:i18n path code, so zh-CN
// is served as /search-index/zh-cn.json — the same lowercase rule the page
// routes and Layout.astro's hreflang use (see astro.config.mjs).
//
// Short keys keep the file small. Navbar.jsx maps them back:
//   i id · s slug · t title · d desc · c category · f features · p priceRange · m thumbnail URL
// `categorySlug` is deliberately omitted: neither the search filter nor the
// result rows ever read it.
import type { APIRoute } from "astro";
import { getPathByLocale } from "astro:i18n";
import { getLocalizedList, LOCALES } from "../../lib/i18n";
import { buildProductImageMap } from "../../lib/productImages";
import type { Product } from "../../data/products";

// The dropdown thumbnail is a 48 px box (w-12), so even at 3x DPR it needs
// ~144 px. buildProductImageMap's `src` is the LARGEST variant (up to 1200w),
// which would make every search result download a full detail-page image for
// a tiny icon. Pick the 240w variant from the srcset instead (covers 2x/3x),
// falling back to `src` when the source photo is smaller or the ladder
// changes. Raw public/ passthrough files have no variants and stay as-is.
const THUMB_WIDTH = 240;
function thumbUrl(img?: { src: string; srcSet: string }): string | undefined {
  if (!img) return undefined;
  const hit = img.srcSet
    ?.split(",")
    .map((s) => s.trim().split(/\s+/))
    .find(([, w]) => w === `${THUMB_WIDTH}w`);
  return hit?.[0] ?? img.src;
}

export function getStaticPaths() {
  return LOCALES.map((locale) => ({
    params: { locale: getPathByLocale(locale) },
    props: { locale },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { locale } = props as { locale: string };
  const products = getLocalizedList<Product>("products", locale);

  // Same resolution the Navbar thumbnail used when it received `imageMap` as a
  // prop: first image only, optimised src from buildProductImageMap, and the
  // raw `/${filename}` passthrough for files that still live in public/.
  const imageMap = await buildProductImageMap(products.map((p) => p.images?.[0]));

  const index = products.map((p) => {
    const first = p.images?.[0];
    const entry: Record<string, unknown> = {
      i: p.id,
      s: p.slug,
      t: p.title,
      d: p.desc, // full text: the search filter matches on desc, so don't truncate
      c: p.category,
    };
    if (p.features?.length) entry.f = p.features;
    // Results only render min/max/unit; the long `note` is never shown here.
    if (p.priceRange) {
      entry.p = { min: p.priceRange.min, max: p.priceRange.max, unit: p.priceRange.unit };
    }
    if (first) entry.m = thumbUrl(imageMap[first]) ?? `/${first}`;
    return entry;
  });

  return new Response(JSON.stringify(index), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
