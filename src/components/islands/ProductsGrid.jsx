// src/components/islands/ProductsGrid.jsx
// Ported from ProductsPage in App.jsx (line ~21663). All filtering/sorting/
// pagination happens client-side against the full PRODUCTS array, same as
// the original — this is inherently an interactive page, so it's one island
// rather than many small ones (avoids duplicating filter state across
// components).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X, ChevronLeft, ChevronRight, AlertTriangle, ChevronDown } from "lucide-react";
import { OEMS } from "../../data/site-config";
import { SUPPORTED_CURRENCIES } from "../../data/currency";
import { useCurrency } from "../../hooks/useCurrency";
import { useURLFilters } from "../../hooks/useURLFilters.js";
import RichProductCard from "./RichProductCard.jsx";

const PAGE_SIZE = 24;
const VALID_SORTS = ["default", "az", "za", "price_asc", "price_desc"];

// `products` and `categories` are resolved server-side (per-locale, via
// getLocalizedList in the parent .astro page) and passed in as props.
// Deliberately NOT imported from src/data or src/lib/i18n here: importing
// the i18n loader directly into a client island would bundle every locale's
// JSON into the browser, not just the current page's locale.
export default function ProductsGrid({ products: PRODUCTS, categories: PRODUCT_CATEGORY_OPTIONS, imageMap = {}, locale = "en" }) {
  // Schema for useURLFilters: every filter + the page number round-trips
  // through the URL, so Back/Forward, reload, and copy-pasted links all
  // restore the exact view (including which page you were on). Free-text /
  // numeric fields are debounced so typing doesn't thrash the address bar;
  // discrete fields (category, sort, OEM, page) write immediately — see
  // useURLFilters.js for why that split matters.
  const filterSchema = useMemo(
    () => [
      {
        key: "category",
        param: "category",
        default: "all",
        parse: (raw) => {
          const match = PRODUCT_CATEGORY_OPTIONS.find(
            (o) => o.slug === raw.toLowerCase() || o.label.toLowerCase() === raw.toLowerCase(),
          );
          return match ? match.slug : "all";
        },
        serialize: (v) => (v !== "all" ? v : ""),
      },
      {
        key: "search",
        param: "search",
        default: "",
        parse: (raw) => raw,
        serialize: (v) => v || "",
        debounce: true,
      },
      {
        key: "sort",
        param: "sort",
        default: "default",
        parse: (raw) => (VALID_SORTS.includes(raw) ? raw : "default"),
        serialize: (v) => (v !== "default" ? v : ""),
      },
      {
        key: "priceMin",
        param: "priceMin",
        default: "",
        parse: (raw) => raw,
        serialize: (v) => v || "",
        debounce: true,
      },
      {
        key: "priceMax",
        param: "priceMax",
        default: "",
        parse: (raw) => raw,
        serialize: (v) => v || "",
        debounce: true,
      },
      {
        key: "oem",
        param: "oem",
        default: "All",
        parse: (raw) => raw,
        serialize: (v) => (v !== "All" ? v : ""),
      },
      {
        key: "page",
        param: "page",
        default: 1,
        parse: (raw) => {
          const n = parseInt(raw, 10);
          return Number.isFinite(n) && n > 0 ? n : 1;
        },
        serialize: (v) => (v > 1 ? String(v) : ""),
      },
    ],
    // PRODUCT_CATEGORY_OPTIONS is effectively static for the lifetime of a
    // mounted island (see the note on the component below) — listed to
    // satisfy exhaustive-deps without implying it's expected to change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const { initial, sync } = useURLFilters(filterSchema);

  const [activeCategory, setActiveCategory] = useState(initial.category);
  const [searchQuery, setSearchQuery] = useState(initial.search);
  const [sortBy, setSortBy] = useState(initial.sort);
  const [priceMin, setPriceMin] = useState(initial.priceMin);
  const [priceMax, setPriceMax] = useState(initial.priceMax);
  const [activeOEM, setActiveOEM] = useState(initial.oem);
  const [showOEMMenu, setShowOEMMenu] = useState(false);
  const [page, setPage] = useState(initial.page);
  const oemMenuRef = useRef(null);
  const topRef = useRef(null);
  const catScrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const { code: currencyCode, rates: currencyRates } = useCurrency();
  const currencySymbol = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode)?.symbol ?? "₹";
  const currencyRate = currencyRates[currencyCode] ?? 1;

  // Reset to page 1 whenever a filter actually changes by user action — but
  // NOT on the initial mount render, where activeCategory/searchQuery/etc.
  // just got set from the URL above. Without this guard, this effect (which
  // always fires once after first render regardless of deps) would stomp a
  // restored `page` back to 1 immediately after it was read from the URL.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setPage(1);
  }, [activeCategory, searchQuery, sortBy, priceMin, priceMax, activeOEM]);

  useEffect(() => {
    if (!showOEMMenu) return;
    const onKey = (e) => {
      if (e.key === "Escape") setShowOEMMenu(false);
    };
    const onClick = (e) => {
      if (oemMenuRef.current && !oemMenuRef.current.contains(e.target)) setShowOEMMenu(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [showOEMMenu]);

  const handleCatScroll = useCallback(() => {
    if (!catScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = catScrollRef.current;
    setShowLeft(scrollLeft > 5);
    setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5);
  }, []);
  useEffect(() => {
    handleCatScroll();
    // Re-check after full page load — web fonts / icons can shift text width
    // after the initial mount measurement, which was silently hiding the
    // right-scroll affordance on some loads.
    window.addEventListener("load", handleCatScroll);
    window.addEventListener("resize", handleCatScroll, { passive: true });
    return () => {
      window.removeEventListener("load", handleCatScroll);
      window.removeEventListener("resize", handleCatScroll);
    };
  }, [handleCatScroll]);
  const scrollCats = (dir) =>
    catScrollRef.current?.scrollBy({ left: dir === "left" ? -350 : 350, behavior: "smooth" });
  // Desktop mouse users have no touch-swipe gesture and no visible scrollbar
  // (hidden for aesthetics) — without this, a plain vertical mouse wheel does
  // nothing over the row and it reads as "not scrollable" even though
  // overflow-x-auto technically supports it. Converting vertical wheel input
  // to horizontal scroll here is what makes the row actually scrollable with
  // a normal mouse.
  const handleCatWheel = useCallback((e) => {
    if (!catScrollRef.current) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // let native horizontal wheel/trackpad through
    e.preventDefault();
    catScrollRef.current.scrollLeft += e.deltaY;
  }, []);

  const pMinN = priceMin !== "" ? Number(priceMin) / currencyRate : null;
  const pMaxN = priceMax !== "" ? Number(priceMax) / currencyRate : null;

  const filtered = useMemo(() => {
    let list = PRODUCTS.filter((p) => {
      if (activeCategory !== "all" && p.categorySlug !== activeCategory) return false;
      const q = searchQuery.toLowerCase().trim();
      if (
        q &&
        !(
          p.title.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q) ||
          p.usage?.toLowerCase().includes(q) ||
          p.features?.some((f) => f.toLowerCase().includes(q))
        )
      )
        return false;
      if (p.priceRange) {
        if (pMinN !== null && p.priceRange.max < pMinN) return false;
        if (pMaxN !== null && p.priceRange.min > pMaxN) return false;
      }
      if (activeOEM !== "All") {
        const haystack =
          `${p.title} ${p.desc} ${p.usage || ""} ${(p.features || []).join(" ")}`.toLowerCase();
        if (!haystack.includes(activeOEM.toLowerCase())) return false;
      }
      return true;
    });
    if (sortBy === "az") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === "za") list = [...list].sort((a, b) => b.title.localeCompare(a.title));
    if (sortBy === "price_asc")
      list = [...list].sort((a, b) => (a.priceRange?.min || 0) - (b.priceRange?.min || 0));
    if (sortBy === "price_desc")
      list = [...list].sort((a, b) => (b.priceRange?.max || 0) - (a.priceRange?.max || 0));
    return list;
  }, [PRODUCTS, activeCategory, searchQuery, sortBy, pMinN, pMaxN, activeOEM]);

  const counts = useMemo(
    () =>
      PRODUCT_CATEGORY_OPTIONS.reduce((a, o) => {
        a[o.slug] =
          o.slug === "all"
            ? PRODUCTS.length
            : PRODUCTS.filter((p) => p.categorySlug === o.slug).length;
        return a;
      }, {}),
    [PRODUCTS, PRODUCT_CATEGORY_OPTIONS],
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;

  // Clamp a page restored from the URL (or left over after a filter change)
  // that's now out of range — e.g. URL said page=5 but a category filter
  // brought the result set down to 2 pages.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // Keep the URL in sync with every filter + the page number (debounced for
  // search/price, immediate for everything else — see useURLFilters.js).
  // This is what makes the whole view, including the page number, survive a
  // Back navigation from a product detail page.
  useEffect(() => {
    sync({
      category: activeCategory,
      search: searchQuery,
      sort: sortBy,
      priceMin,
      priceMax,
      oem: activeOEM,
      page,
    });
  }, [sync, activeCategory, searchQuery, sortBy, priceMin, priceMax, activeOEM, page]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActiveFilters =
    searchQuery ||
    activeCategory !== "all" ||
    priceMin ||
    priceMax ||
    sortBy !== "default" ||
    activeOEM !== "All";

  const clearAll = () => {
    setSearchQuery("");
    setActiveCategory("all");
    setSortBy("default");
    setPriceMin("");
    setPriceMax("");
    setActiveOEM("All");
  };
  const goPage = (n) => {
    setPage(n);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
    .reduce((acc, n, idx, arr) => {
      if (idx > 0 && n - arr[idx - 1] > 1) acc.push("…");
      acc.push(n);
      return acc;
    }, []);

  return (
    <div ref={topRef}>
      <div className="mb-10 flex flex-col gap-4">
        {/* Search + Sort + Price */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <label htmlFor="product-search" className="sr-only">
              Search products by name, specification, or application
            </label>
            <input
              id="product-search"
              type="search"
              placeholder="Search products, specs, applications…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeCategory !== "all") setActiveCategory("all");
              }}
              className="w-full pl-12 pr-6 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-md"
            />
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none"
              aria-hidden="true"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <label htmlFor="sort-select" className="sr-only">
            Sort products
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-md"
          >
            <option value="default">Sort: Default</option>
            <option value="az">Name A–Z</option>
            <option value="za">Name Z–A</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>

          <div className="relative" ref={oemMenuRef}>
            <button
              type="button"
              onClick={() => setShowOEMMenu((v) => !v)}
              aria-expanded={showOEMMenu}
              className="flex items-center gap-2 px-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:border-blue-300 transition-all shadow-md whitespace-nowrap"
            >
              OEM: {activeOEM}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showOEMMenu ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {showOEMMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-30 max-h-72 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setActiveOEM("All");
                    setShowOEMMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-blue-50 ${activeOEM === "All" ? "text-blue-600" : "text-slate-700"}`}
                >
                  All OEMs
                </button>
                {OEMS.map((oem) => (
                  <button
                    key={oem}
                    type="button"
                    onClick={() => {
                      setActiveOEM(oem);
                      setShowOEMMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-blue-50 ${activeOEM === oem ? "text-blue-600" : "text-slate-700"}`}
                  >
                    {oem}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Price range */}
        <div className="flex items-center gap-2">
          <label htmlFor="price-min" className="sr-only">
            Minimum price ({currencyCode})
          </label>
          <input
            id="price-min"
            type="number"
            placeholder={`Min ${currencySymbol}`}
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="w-28 px-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
          <span className="text-slate-600 text-sm font-bold">–</span>
          <label htmlFor="price-max" className="sr-only">
            Maximum price ({currencyCode})
          </label>
          <input
            id="price-max"
            type="number"
            placeholder={`Max ${currencySymbol}`}
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-28 px-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider shrink-0">
            {currencyCode}
          </span>
        </div>

        {/* Category chips */}
        {/* min-w-0 overrides the browser default fieldset { min-width: min-content }
            rule — without it, the fieldset refuses to shrink below the combined
            width of every chip, which forces the whole page to overflow
            horizontally instead of letting the inner overflow-x-auto div scroll
            within its intended width. This was the actual cause of the
            page-wide horizontal scroll, not the chip row itself. */}
        <fieldset className="relative border-0 p-0 m-0 min-w-0">
          <legend className="sr-only">Filter by category</legend>
          {/* Arrows are always visible (not conditionally hidden via JS-computed
              opacity) — clicking left at the start or right at the end is a
              harmless no-op, and this guarantees the scroll affordance always
              shows up rather than silently disappearing if the width
              measurement ever runs before layout settles. */}
          <button
            type="button"
            onClick={() => scrollCats("left")}
            aria-label="Scroll categories left"
            className="absolute left-1 z-20 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white border border-slate-300 shadow-md rounded-full text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!showLeft}
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <div
            ref={catScrollRef}
            onScroll={handleCatScroll}
            onWheel={handleCatWheel}
            className="flex gap-2 overflow-x-auto scrollbar-hide px-10 py-1"
            style={{ scrollbarWidth: "none" }}
          >
            {PRODUCT_CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.slug}
                type="button"
                onClick={() => setActiveCategory(opt.slug)}
                aria-pressed={activeCategory === opt.slug}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border-2 ${
                  activeCategory === opt.slug
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >
                {/* FIXED: opacity-60 dropped contrast below 4.5:1 in both
                    states — 2.82:1 for the active chip (light blue text on
                    the blue-600 fill) and 2.88:1 for inactive chips
                    (slate-600 on white). Removing it lets the count inherit
                    the button's own already-passing text color; it's still
                    visually secondary purely from being smaller/parenthetical. */}
                {opt.label} <span>({counts[opt.slug]})</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollCats("right")}
            aria-label="Scroll categories right"
            className="absolute right-1 z-20 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white border border-slate-300 shadow-md rounded-full text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!showRight}
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </fieldset>

        {hasActiveFilters && (
          <div className="flex items-center gap-3" role="status" aria-live="polite">
            <span className="text-sm font-bold text-slate-500">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
              {totalPages > 1 && ` · page ${page} of ${totalPages}`}
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <X className="w-4 h-4" aria-hidden="true" /> Clear all
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 flex gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-bold text-amber-800">
            Prices shown are indicative estimates only
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Actual pricing depends on turbine model, OEM spec, material grade, surface treatment,
            and order quantity. Figures are indicative and may not reflect current market rates.{" "}
            <a
              href="/contact"
              className="font-bold text-blue-600 hover:underline whitespace-nowrap"
            >
              Contact us for a firm quotation →
            </a>
          </p>
        </div>
      </div>

      {paginated.length > 0 ? (
        <>
          <ul
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
            aria-label={`${filtered.length} products, showing ${paginated.length}`}
          >
            {paginated.map((p, idx) => (
              <li key={p.id}>
                <RichProductCard product={p} priority={idx < 6} imageMap={imageMap} locale={locale} />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav
              aria-label="Product catalog pagination"
              className="mt-14 mb-6 flex items-center justify-center gap-2 flex-wrap"
            >
              <button
                type="button"
                onClick={() => goPage(page - 1)}
                disabled={page === 1}
                aria-label="Previous page"
                className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              {pageNumbers.map((item, i) =>
                item === "…" ? (
                  <span
                    key={`e-${i}`}
                    className="w-10 h-10 flex items-center justify-center text-slate-500 font-bold select-none"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => goPage(item)}
                    aria-current={item === page ? "page" : undefined}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 text-sm font-bold transition-all shadow-sm ${item === page ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-blue-500 hover:text-blue-600"}`}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                type="button"
                onClick={() => goPage(page + 1)}
                disabled={page === totalPages}
                aria-label="Next page"
                className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      ) : (
        <div
          className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-300 shadow-sm"
          role="status"
        >
          <Search className="w-20 h-20 text-slate-200 mx-auto mb-6" aria-hidden="true" />
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            No products found
          </h2>
          <p className="text-slate-500 font-medium text-lg mb-6">
            Try adjusting your search, category, or price filter.
          </p>
          <div className="mt-4 mb-8 flex flex-wrap gap-2 justify-center">
            {PRODUCT_CATEGORY_OPTIONS.filter((o) => o.slug !== "all")
              .slice(0, 4)
              .map((opt) => (
                <button
                  key={opt.slug}
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory(opt.slug);
                    setPriceMin("");
                    setPriceMax("");
                  }}
                  className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  {opt.label} ({counts[opt.slug]})
                </button>
              ))}
          </div>
          <button
            type="button"
            onClick={clearAll}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black hover:bg-blue-700 transition-colors shadow-lg"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
