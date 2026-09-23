// src/data/products.ts
// Auto-extracted verbatim from App.jsx RAW_PRODUCTS (132 products; 133 after
// adding prod_ts_labyrinth_leaf_spring).
// PRODUCT_PRICE_MAP, CATEGORY_PRICE_BANDS, CATEGORY_AVAILABILITY also ported.
// The buildExtraImageNames and image-merging logic from App.jsx is reproduced
// below as a pure TS function (no React dependency).

import { TURBINE_SPARES_PRODUCTS } from "./products/turbine-spares";
import { STRAINERS_PRODUCTS } from "./products/strainers";
import { EXPANSION_JOINTS_PRODUCTS } from "./products/expansion-joints";
import { HOSES_PRODUCTS } from "./products/hoses";
import { FILTRATION_PRODUCTS } from "./products/filtration";
import { MISC_PRODUCTS } from "./products/misc";
import { RAW_PRODUCT_ID_ORDER } from "./products/raw-product-order";
import {
  CATEGORY_PRICE_BANDS,
  CATEGORY_AVAILABILITY,
  PRODUCT_PRICE_MAP,
} from "./products/pricing";

export interface PriceRange {
  min: number;
  max: number;
  unit: string;
  note?: string;
}

export interface Availability {
  label: string;
  color: string;
  leadTime: string;
}

export interface Product {
  id: string;
  /** Stable external part number, independent of the internal routing `id`.
   * Format: KTB-<CATEGORY_CODE>-<SEQUENCE>, e.g. "KTB-TS-014".
   * Category codes: TS=Turbine Spares, ST=Industrial Strainers, EJ=Expansion Joints,
   * FH=Flexible Hoses & Assemblies, IF=Industrial Filtration, RP=Industrial Rubber Products,
   * EE=Electronic Equipments, HC=Hydraulic Components, AF=HVAC, Ducting & Air Filtration,
   * VG=Valves, Gaskets & Steam System Products. */
  sku: string;
  slug: string;
  category: string;
  categorySlug: string;
  title: string;
  desc: string;
  usage?: string;
  features?: string[];
  specs?: Record<string, string | undefined>;
  images: string[];
  priceRange?: PriceRange | null;
  availability?: Availability | null;
  /** Standards/certification codes parsed from the product's own spec text
   * (e.g. ["ISO 16889", "API 614"]). Empty array where none were found in
   * the source data — not populated by inference. */
  certifications?: string[];
}

// ─── MAX IMAGES PER PRODUCT (matches App.jsx MAX_PRODUCT_IMAGES) ────────────
const MAX_PRODUCT_IMAGES = 12;

function buildExtraImageNames(baseImage: string, totalCount: number): string[] {
  const dot = baseImage.lastIndexOf(".");
  if (dot <= 0) return [];
  const ext = baseImage.slice(dot);
  const root = baseImage.slice(0, dot).replace(/-\d+$/, "");
  return Array.from({ length: totalCount }, (_, i) => `${root}-${i + 1}${ext}`);
}

// ─── RAW PRODUCTS ────────────────────────────────────────────────────────────
// Split across src/data/products/*.ts (Parts 1a-1c of the products.ts split).
// Categories are interleaved in the ORIGINAL source file (not grouped in
// contiguous blocks), and both assignUniqueSlugs() below and
// PRODUCT_CATEGORY_OPTIONS/PRODUCT_CATEGORIES depend on RAW_PRODUCTS'
// iteration order (the latter via first-appearance order per category, which
// drives the category filter/tab order in the UI). So rather than simply
// concatenating the six split files — which would silently reorder the
// category filter tabs — we look each product up by id against the exact
// original id sequence, to guarantee byte-for-byte identical downstream
// behavior (slugs, category tab order, everything).
const RAW_PRODUCTS_BY_ID = new Map(
  [
    ...TURBINE_SPARES_PRODUCTS,
    ...STRAINERS_PRODUCTS,
    ...EXPANSION_JOINTS_PRODUCTS,
    ...HOSES_PRODUCTS,
    ...FILTRATION_PRODUCTS,
    ...MISC_PRODUCTS,
  ].map((p) => [p.id, p]),
);

const RAW_PRODUCTS = RAW_PRODUCT_ID_ORDER.map((id) => {
  const p = RAW_PRODUCTS_BY_ID.get(id);
  if (!p) throw new Error(`products.ts: no product found for id "${id}" while reassembling RAW_PRODUCTS`);
  return p;
});

// ─── CATEGORY PRICE BANDS / AVAILABILITY / PER-PRODUCT PRICE MAP ───────────
// Moved to src/data/products/pricing.ts (Part 2 of the products.ts split) —
// same names, same shapes, same values, byte-for-byte (imported above).
// The fallback chain that consumes them (PRODUCT_PRICE_MAP ->
// CATEGORY_PRICE_BANDS -> null, and CATEGORY_AVAILABILITY) is unchanged
// below, in the final PRODUCTS export.

// ─── IMAGE MERGING (mirrors App.jsx _PRODUCTS_SHAPED logic) ──────────────────
function shapeImages(product: (typeof RAW_PRODUCTS)[0]) {
  const imgs = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  if (imgs.length >= MAX_PRODUCT_IMAGES) return imgs.slice(0, MAX_PRODUCT_IMAGES);
  if (imgs.length === 0) return [];
  const generated = buildExtraImageNames(imgs[0], MAX_PRODUCT_IMAGES);
  return [...new Set([...imgs, ...generated])].slice(0, MAX_PRODUCT_IMAGES);
}

// ─── SLUGS (readable /products/<slug> URLs instead of /products/prod_f2) ────
// Kept as a separate field from `id` — `id` stays the stable internal key
// used for pricing lookups, localStorage (recently-viewed), etc.; `slug` is
// purely the public-facing URL segment, derived from the product title.
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function assignUniqueSlugs(products: (typeof RAW_PRODUCTS)[0][]): Map<string, string> {
  const slugById = new Map<string, string>();
  const seen = new Map<string, number>();
  for (const p of products) {
    const base = slugify(p.title) || p.id;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    // First product with a given title keeps the clean slug; any later
    // collision gets a numeric suffix so URLs never overlap.
    slugById.set(p.id, count === 0 ? base : `${base}-${count + 1}`);
  }
  return slugById;
}
const PRODUCT_SLUGS = assignUniqueSlugs(RAW_PRODUCTS);

// ─── CATEGORY SLUGS (stable filter/routing key, decoupled from the ──────────
// translatable `category` display label — see i18n Phase 2 corrections) ────
export const PRODUCT_CATEGORY_OPTIONS: { slug: string; label: string }[] = [
  { slug: "all", label: "All" },
  ...[...new Set(RAW_PRODUCTS.map((p) => p.category))].map((label) => ({
    slug: slugify(label),
    label,
  })),
];
const CATEGORY_LABEL_TO_SLUG = new Map(PRODUCT_CATEGORY_OPTIONS.map((o) => [o.label, o.slug]));

// ─── FINAL PRODUCTS EXPORT (mirrors App.jsx PRODUCTS assembly) ───────────────
export const PRODUCTS: Product[] = RAW_PRODUCTS.map((p) => ({
  ...p,
  slug: PRODUCT_SLUGS.get(p.id)!,
  categorySlug: CATEGORY_LABEL_TO_SLUG.get(p.category) ?? slugify(p.category),
  images: shapeImages(p),
  priceRange:
    PRODUCT_PRICE_MAP[p.id] ?? (p as any).priceRange ?? CATEGORY_PRICE_BANDS[p.category] ?? null,
  availability: (p as any).availability ?? CATEGORY_AVAILABILITY[p.category] ?? null,
}));

export const PRODUCT_CATEGORIES: string[] = ["All", ...new Set(PRODUCTS.map((p) => p.category))];
