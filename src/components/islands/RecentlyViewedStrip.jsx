// src/components/islands/RecentlyViewedStrip.jsx
// FIXED: entirely missing from the product detail page — caught via
// screenshot comparison. Full port from App.jsx (line ~12986/13000):
// tracks up to 6 recently-viewed product IDs in localStorage, shows them
// (excluding the current product) as a simple image+category+title strip.
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import SkeletonImage from "./SkeletonImage.jsx";
import { localizedPath } from "../../lib/localeMeta";

const RV_KEY = "ke_recently_viewed";
const RV_MAX = 6;

function getRecentlyViewed() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RV_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function addRecentlyViewed(productId) {
  try {
    const list = getRecentlyViewed().filter((id) => id !== productId);
    list.unshift(productId);
    localStorage.setItem(RV_KEY, JSON.stringify(list.slice(0, RV_MAX)));
  } catch {
    /* localStorage blocked — recently-viewed just won't persist */
  }
}

/**
 * @param {{ currentProductId: string, products?: Array<Record<string, any>>, imageMap?: Record<string, any>, locale?: string }} props
 */
export default function RecentlyViewedStrip({ currentProductId, products: PRODUCTS = [], imageMap = {}, locale = "en" }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Track this page view first, then read back the list (excluding self).
    addRecentlyViewed(currentProductId);
    const ids = getRecentlyViewed().filter((id) => id !== currentProductId);
    const resolved = ids
      .map((id) => PRODUCTS.find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, 4);
    setItems(resolved);
  }, [currentProductId, PRODUCTS]);

  if (items.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 tracking-tight mb-5">
        <Clock className="w-5 h-5 text-blue-500" aria-hidden="true" />
        Recently Viewed
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map((p) => (
          <a
            key={p.id}
            href={localizedPath(locale, `/products/${p.slug}`)}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all group block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="h-28 bg-slate-100 flex items-center justify-center overflow-hidden">
              {p.images?.[0] ? (
                <SkeletonImage
                  src={imageMap[p.images[0]]?.src ?? `/${p.images[0]}`}
                  srcSet={imageMap[p.images[0]]?.srcSet}
                  sizes={imageMap[p.images[0]] ? "(min-width: 640px) 200px, 45vw" : undefined}
                  alt={p.title}
                  width="200"
                  height="150"
                  wrapperClassName="w-full h-full"
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <svg
                  className="w-8 h-8 text-slate-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              )}
            </div>
            <div className="p-3">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">
                {p.category}
              </span>
              <p className="text-slate-900 font-bold text-sm leading-snug mt-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {p.title}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
