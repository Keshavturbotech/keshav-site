// src/lib/productImages.ts
//
// Bridges Astro's build-time image optimizer (getImage/<Image>, which only
// runs in .astro frontmatter) into the React islands that actually render
// product photos (RichProductCard, FeaturedProductsStrip,
// ProductDetailInteractive, RecentlyViewedStrip, ProductsGrid).
//
// How it works:
//   1. import.meta.glob eagerly picks up every real file that exists under
//      src/assets/products/ at build time. Today that's a partial set —
//      1,584 filenames are referenced in products.ts but only some have
//      been dropped into this folder so far. That's fine: this module only
//      builds map entries for files it can actually find.
//   2. buildProductImageMap() takes a list of filenames (e.g. every image
//      referenced by the products shown on a given page) and returns
//      { filename: { src, srcSet } } for the ones it found — one AVIF
//      variant per width in PRODUCT_IMAGE_WIDTHS, so a small thumbnail and
//      a large detail-page hero pull from the same map entry and each just
//      pick the right file for their own `sizes`. Filenames with no local
//      file yet are simply omitted from the returned object.
//   3. Callers (the .astro pages) pass this map down as a plain prop to the
//      React islands. Each island does `imageMap[filename]?.src ?? `/${filename}`
//      (plus `srcSet`/`sizes` where it matters) — so any file not yet
//      migrated keeps working exactly as it does today (served raw from
//      public/), and any file that IS present gets optimized automatically.
//      No island code needs to change again as more files get added.
//
// Note on widths: requesting a width larger than the source photo's actual
// width doesn't error or upscale — Astro clamps it down to the source width
// and de-dupes, verified with a real `astro build` against a 500×400 test
// image (widths [200,400,800,1200] produced only 200w/400w/500w, no error).
// So this single fixed width ladder is safe to use even though the real
// photos' resolutions aren't known yet.

import { getImage } from "astro:assets";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const PRODUCT_IMAGE_WIDTHS = [120, 240, 480, 800, 1200];

const productImageFiles = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/products/*.{webp,jpg,jpeg,png,avif}",
  { eager: true },
);

// filename ("180-gpm-lube-filter-1.webp") -> ImageMetadata for every file
// that actually exists on disk right now.
const rawAssetByFilename = new Map<string, ImageMetadata>();
for (const [path, mod] of Object.entries(productImageFiles)) {
  const filename = path.split("/").pop();
  if (filename) rawAssetByFilename.set(filename, mod.default);
}

// public/ is served as-is by Astro (no processing), but during migration
// most real photos still live there rather than under src/assets/products/.
// hasLocalImage() below checks both locations so callers can find products
// with a real photo *right now*, wherever that photo currently sits.
const PUBLIC_DIR = fileURLToPath(new URL("../../public/", import.meta.url));

export interface ResolvedProductImage {
  /** Largest generated variant — safe default `src` for a plain <img>. */
  src: string;
  /** Ready-to-use srcset attribute string, e.g. "a.avif 240w, b.avif 480w". */
  srcSet: string;
}

// Module-level cache so re-processing the same file on a later page during
// the same `astro build` is a map lookup, not a repeat sharp() call.
const resolvedCache = new Map<string, ResolvedProductImage>();

/**
 * Resolves a list of raw product-image filenames to optimized AVIF variants
 * (one per PRODUCT_IMAGE_WIDTHS entry, clamped to the source's real size)
 * for whichever of them exist under src/assets/products/. Filenames with no
 * matching file there are omitted from the returned map — every consumer
 * (FeaturedProductsStrip, RichProductCard, ProductDetailInteractive, etc.)
 * falls back to a raw `/${filename}` passthrough path in that case, so the
 * image still renders exactly as it does today for anything not yet
 * migrated into src/assets/products/, and `<img onError>` still swaps in
 * the category icon for filenames that genuinely don't exist anywhere.
 *
 * An earlier version of this also tried to confirm public/-passthrough
 * files with `existsSync(PUBLIC_DIR + filename)` and omitted the entry
 * (skipping the guessed fallback too) when that check failed, specifically
 * to avoid a 404 in the console for photos that hadn't been migrated yet.
 * That backfired: the existsSync check doesn't reliably reflect reality in
 * every deploy environment, and a false negative made real product photos
 * that load fine on the detail page vanish from FeaturedProductsStrip/
 * RichProductCard instead. Every consumer's own guess+onError fallback is
 * the safe, self-correcting mechanism here — this function only needs to
 * report the confirmed-fast-path (optimized) case.
 */
export async function buildProductImageMap(
  filenames: (string | undefined)[],
): Promise<Record<string, ResolvedProductImage>> {
  const uniqueFilenames = [...new Set(filenames.filter((f): f is string => Boolean(f)))];
  const map: Record<string, ResolvedProductImage> = {};

  await Promise.all(
    uniqueFilenames.map(async (filename) => {
      const cached = resolvedCache.get(filename);
      if (cached) {
        map[filename] = cached;
        return;
      }

      const asset = rawAssetByFilename.get(filename);
      if (!asset) return; // not migrated to src/assets/products/ yet — caller falls back to the public/ passthrough

      const optimized = await getImage({
        src: asset,
        format: "avif",
        // Set to 90 — the standard "visually lossless" threshold for AVIF.
        // Measured on a worst-case (random-noise) test image: quality 100
        // was 437KB vs 90's 265KB, a 39% size penalty concentrated almost
        // entirely in the 95->100 range, for compression that's
        // technically lossless but not visibly different from 90 on real
        // photographic content. 90 avoids that steep, wasted tail while
        // staying well above any visible-artifact threshold.
        quality: 90,
        widths: PRODUCT_IMAGE_WIDTHS,
        sizes: "100vw", // placeholder — the actual `sizes` used in the browser is set per <img> by each island
      });
      const resolved: ResolvedProductImage = {
        src: optimized.src,
        srcSet: optimized.srcSet.attribute,
      };
      resolvedCache.set(filename, resolved);
      map[filename] = resolved;
    }),
  );

  return map;
}

/**
 * True if this filename has a real file right now, either migrated into
 * src/assets/products/ (optimized path) or still sitting in public/
 * (raw passthrough path). Lets callers pick products that will actually
 * show a photo today, regardless of which of the two locations it's in.
 */
export function hasLocalImage(filename: string | undefined): boolean {
  if (!filename) return false;
  if (rawAssetByFilename.has(filename)) return true;
  return existsSync(PUBLIC_DIR + filename);
}

/** How many of the referenced filenames currently have a real file on disk (src/assets/products/ or public/). Useful for a build-time log so migration progress is visible without grepping the folder by hand. */
export function countMigratedFiles(filenames: (string | undefined)[]): {
  migrated: number;
  total: number;
} {
  const unique = new Set(filenames.filter(Boolean));
  let migrated = 0;
  for (const f of unique) if (hasLocalImage(f as string)) migrated++;
  return { migrated, total: unique.size };
}
