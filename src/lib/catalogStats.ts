// src/lib/catalogStats.ts
// Single source of truth for product / category counts shown in copy
// (About, Products hero + meta description). Derived from the catalogue
// itself so the numbers cannot drift when products or categories change.
export interface CatalogStats {
  productCount: number;
  categoryCount: number;
}

export function getCatalogStats(products: ReadonlyArray<{ category: string }>): CatalogStats {
  return {
    productCount: products.length,
    categoryCount: new Set(products.map((p) => p.category)).size,
  };
}
