// src/components/islands/Navbar.jsx
// Ported from the Navbar component in App.jsx (line ~10746).
// CHANGES FROM ORIGINAL:
//   - `navigate(path)` calls replaced with real `<a href>` / `window.location.assign`
//     since Astro routes are real URLs, not hash fragments.
//   - `currentPath` is now a prop passed from Layout.astro (Astro.url.pathname)
//     instead of being tracked in a custom router's React state.
//   - All visual classes, breakpoints, and interaction logic (scroll-hide,
//     search popover, mobile drawer, focus handling) are preserved verbatim.
//
// TRANSLUCENCY CONVENTIONS (documentation only — no new classes):
//   - "solid-frosted": bg-white/97 backdrop-blur-xl — use for the scrolled
//     navbar or any surface that needs near-full readability.
//   - "glass-light": bg-white/10 or bg-white/20 with backdrop-blur-sm — use
//     only over dark hero/photo backgrounds, never over body copy.
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Menu, Phone, PhoneCall, Search, X, ChevronDown, MessageCircle } from "lucide-react";
import { CONTACT_INFO } from "../../data/site-config";
import { formatPrice } from "../../data/currency";
import { useCurrency } from "../../hooks/useCurrency";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import NavDropdown from "./NavDropdown.jsx";
import MoreDropdown from "./MoreDropdown.jsx";
import BrandLogo from "./BrandLogo.jsx";
import { localizedPath } from "../../lib/localeMeta";
import { useNavAutoHide } from "../../lib/useNavAutoHide";

// Type-specific styling for search results — a color-coded left accent bar
// and badge so Products vs Services are scannable at a glance without
// reading the label. Blue tracks the site's product accent; emerald tracks
// the services accent used elsewhere (e.g. availability badges).
const RESULT_TYPE_STYLES = {
  Product: { badge: "bg-blue-100 text-blue-700", accent: "bg-blue-500" },
  Service: { badge: "bg-emerald-100 text-emerald-700", accent: "bg-emerald-500" },
};

// Wraps the first matching substring of `text` in a <mark> so scanning a
// results list is faster — mirrors browser find-in-page but themed to the
// site's blue accent instead of the default yellow.
function highlightMatch(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-blue-100 text-blue-900 rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

const waMsg = (text) => `https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(text)}`;

/**
 * @param {object} props
 * @param {string} [props.currentPath]
 * @param {Array<{name: string, path: string}>} [props.navLinks]
 * @param {Array<{id?: string, title?: string, slug?: string}>} [props.services]
 * @param {Array<{id?: string, title?: string, slug?: string, category?: string, desc?: string, features?: string[], images?: string[], priceRange?: unknown}>} [props.products]
 * @param {Array<{slug: string, label: string}>} [props.productCategories]
 * @param {Array<{id?: string, slug?: string, title?: string}>} [props.industries]
 * @param {string} [props.currentLocale] - Astro.currentLocale, resolved server-side (Part 2)
 * @param {Record<string, string>} [props.equivalentLocalePaths] - locale code -> this page's URL in that locale (Part 2)
 */
export default function Navbar({
  currentPath = "/",
  navLinks = [],
  services = [],
  products = [],
  productCategories = [],
  industries = [],
  currentLocale = "en",
  equivalentLocalePaths = {},
} = {}) {
  // Each item carries a precomputed `href` so NavDropdown/mobile menu never
  // have to guess navigation logic per-section. `isDetail` marks items that
  // link to a real detail page (used for the chevron affordance) — Products
  // items are category filters on /products, not detail pages, so they don't
  // get one. Derived from props (resolved server-side per-locale in
  // Layout.astro) instead of module-scope constants, so this component never
  // needs to import src/lib/i18n.ts or src/data/* directly — see the shared
  // i18n rule against client-island locale globbing.
  const navServicesMenu = useMemo(
    () =>
      services.map((s) => ({
        id: s.id,
        label: s.title,
        href: localizedPath(currentLocale, `/services/${s.slug}`),
        isDetail: true,
      })),
    [services, currentLocale],
  );
  const navProductsMenu = useMemo(
    () =>
      productCategories
        .filter((o) => o.slug !== "all")
        .map((o) => ({
          label: o.label,
          href: `${localizedPath(currentLocale, "/products")}?category=${o.slug}`,
          isDetail: false,
        })),
    [productCategories, currentLocale],
  );
  const navIndustriesMenu = useMemo(
    () =>
      industries.map((ind) => ({
        id: ind.id,
        slug: ind.slug,
        label: ind.title,
        href: localizedPath(currentLocale, `/industries/${ind.slug}`),
        isDetail: true,
      })),
    [industries, currentLocale],
  );

  // navLinks (Home/About/Contact/etc.) come from nav.json's keys as plain
  // locale-agnostic paths ("/about", "/contact") — same root bug as the menus
  // above. Localized once here and used for every render of these links
  // below (desktop bar, "More" overflow dropdown, mobile drawer, and
  // isActive highlighting) so none of them can drift out of sync with each
  // other.
  const localizedNavLinks = useMemo(
    () => navLinks.map((link) => ({ ...link, path: localizedPath(currentLocale, link.path) })),
    [navLinks, currentLocale],
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { code: currencyCode, rates: currencyRates } = useCurrency();
  const { scrolled, isVisible } = useNavAutoHide({ forceVisible: isOpen || isSearchOpen });
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const queryRef = useRef("");

  useEffect(() => {
    if (isSearchOpen && window.innerWidth >= 1024) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if ((isOpen || isSearchOpen) && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isSearchOpen]);

  const q = query.toLowerCase().trim();
  useEffect(() => {
    queryRef.current = query;
  }, [query]);
  const deferredQ = useDeferredValue(q);
  const searchResultsAll = useMemo(() => {
    if (!deferredQ) return [];
    return [
      ...services.filter(
        (s) =>
          s.title?.toLowerCase().includes(deferredQ) || s.desc?.toLowerCase().includes(deferredQ),
      ).map((s) => ({
        id: s.id,
        title: s.title,
        desc: s.desc,
        type: "Service",
        path: localizedPath(currentLocale, `/services/${s.slug}`),
        image: s.image,
        priceRange: null,
      })),
      ...products.filter(
        (p) =>
          p.title?.toLowerCase().includes(deferredQ) ||
          p.desc?.toLowerCase().includes(deferredQ) ||
          p.category?.toLowerCase().includes(deferredQ) ||
          p.features?.some((f) => f.toLowerCase().includes(deferredQ)),
      ).map((p) => ({
        id: p.id,
        title: p.title,
        desc: p.desc,
        type: "Product",
        category: p.category,
        path: localizedPath(currentLocale, `/products/${p.slug}`),
        image: p.images?.[0],
        priceRange: p.priceRange || null,
      })),
    ];
  }, [deferredQ, services, products, currentLocale]);
  const searchResults = useMemo(() => searchResultsAll.slice(0, 8), [searchResultsAll]);
  const searchResultsTotal = searchResultsAll.length;
  const hasMoreResults = searchResultsTotal > searchResults.length;

  useEffect(() => {
    setActiveIndex(-1);
  }, [deferredQ]);

  useEffect(() => {
    const onMouse = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
        setMobileExpanded(null);
        setIsSearchOpen((prev) => (!queryRef.current ? false : prev));
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setMobileExpanded(null);
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const isActive = useCallback(
    (path) => {
      if (path === "/" && currentPath !== "/") return false;
      // FIXED: these startsWith shortcuts (matching "Products" as active
      // while viewing a product DETAIL page, not just the listing) were
      // comparing against hardcoded unprefixed strings. Since `path` args
      // are now always locale-prefixed (see localizedNavLinks/basePath
      // fixes above), this silently stopped matching on any translated
      // locale — the links worked, but nav-highlighting broke. Compare
      // against the same locale's prefixed form instead of a hardcoded one.
      const productsPath = localizedPath(currentLocale, "/products");
      const servicesPath = localizedPath(currentLocale, "/services");
      const industriesPath = localizedPath(currentLocale, "/industries");
      const blogPath = localizedPath(currentLocale, "/blog");
      const projectsPath = localizedPath(currentLocale, "/projects");
      if (currentPath.startsWith(`${productsPath}/`) && path === productsPath) return true;
      if (currentPath.startsWith(`${servicesPath}/`) && path === servicesPath) return true;
      if (currentPath.startsWith(`${industriesPath}/`) && path === industriesPath) return true;
      if (currentPath.startsWith(`${blogPath}/`) && path === blogPath) return true;
      if (currentPath.startsWith(`${projectsPath}/`) && path === projectsPath) return true;
      return currentPath === path;
    },
    [currentPath, currentLocale],
  );

  // Real navigation — full page nav (Astro can layer View Transitions on top
  // of this for SPA-smooth feel without sacrificing per-route URLs/SEO).
  const handleNav = useCallback((path) => {
    setIsOpen(false);
    setIsSearchOpen(false);
    setQuery("");
    setMobileExpanded(null);
    window.location.assign(path);
  }, []);

  // Roving keyboard navigation for both the desktop popover and the mobile
  // drawer search — Down/Up move the active option, Enter navigates to it,
  // wrapping at either end. Shared across both inputs since only one is
  // ever visible/focused at a time.
  const handleSearchKeyDown = useCallback(
    (e) => {
      if (!searchResults.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % searchResults.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? searchResults.length - 1 : i - 1));
      } else if (e.key === "Enter" && activeIndex >= 0 && searchResults[activeIndex]) {
        e.preventDefault();
        handleNav(searchResults[activeIndex].path);
      }
    },
    [searchResults, activeIndex, handleNav],
  );

  return (
    <nav
      ref={menuRef}
      aria-label="Main navigation"
      className={`fixed top-0 left-0 w-full z-55 transition-all duration-500 ease-[cubic-bezier(0.3,0,0,1)] border-b ${isVisible ? "translate-y-0" : "-translate-y-full"} ${scrolled ? "bg-white/97 backdrop-blur-xl border-slate-200 shadow-lg" : "bg-navy-800/95 backdrop-blur-sm border-white/10"}`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-100 font-bold"
      >
        Skip to main content
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <BrandLogo scrolled={scrolled} locale={currentLocale} />

          <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
            {localizedNavLinks.slice(0, 6).map((link) => {
              if (link.name === "Services") {
                return (
                  <NavDropdown
                    key="Services"
                    label="Services"
                    items={navServicesMenu}
                    basePath={localizedPath(currentLocale, "/services")}
                    scrolled={scrolled}
                    isActive={isActive}
                    navigate={handleNav}
                  />
                );
              }
              if (link.name === "Products") {
                return (
                  <NavDropdown
                    key="Products"
                    label="Products"
                    items={navProductsMenu}
                    basePath={localizedPath(currentLocale, "/products")}
                    scrolled={scrolled}
                    isActive={isActive}
                    navigate={handleNav}
                  />
                );
              }
              if (link.name === "Industries") {
                return (
                  <NavDropdown
                    key="Industries"
                    label="Industries"
                    items={navIndustriesMenu}
                    basePath={localizedPath(currentLocale, "/industries")}
                    scrolled={scrolled}
                    isActive={isActive}
                    navigate={handleNav}
                  />
                );
              }
              return (
                <a
                  key={link.name}
                  href={link.path}
                  aria-current={isActive(link.path) ? "page" : undefined}
                  // FIX (UX audit — nav label readability): bumped from
                  // 11.5/12.5px to 13/14px for a B2B audience skewing 40+;
                  // tracking tightened from -wider to -wide to recover the
                  // horizontal space so labels still fit on one line.
                  className={`relative px-2 py-1.5 text-[13px] xl:text-[14px] font-bold uppercase tracking-wide transition-all duration-200 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 group whitespace-nowrap ${
                    isActive(link.path)
                      ? scrolled
                        ? "text-blue-600"
                        : "text-white"
                      : scrolled
                        ? "text-slate-600 hover:text-slate-900"
                        : "text-slate-300 hover:text-white"
                  }`}
                >
                  {link.name}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full origin-center transition-transform duration-300 ${isActive(link.path) ? "scale-x-75 bg-blue-500" : "scale-x-0 group-hover:scale-x-50 bg-blue-400/60"}`}
                    aria-hidden="true"
                  />
                </a>
              );
            })}

            {localizedNavLinks.length > 6 && (
              <MoreDropdown
                links={localizedNavLinks.slice(6)}
                scrolled={scrolled}
                isActive={isActive}
                handleNav={handleNav}
              />
            )}

            <div
              className={`w-px h-5 mx-1.5 shrink-0 ${scrolled ? "bg-slate-200" : "bg-white/20"}`}
              aria-hidden="true"
            />
            <LanguageSwitcher scrolled={scrolled} currentLocale={currentLocale} equivalentLocalePaths={equivalentLocalePaths} />

            <search className="relative">
              <button
                type="button"
                onClick={() =>
                  setIsSearchOpen((prev) => {
                    if (prev) {
                      setQuery("");
                      return false;
                    }
                    return true;
                  })
                }
                aria-label={isSearchOpen ? "Close search" : "Search products and services"}
                aria-expanded={isSearchOpen}
                aria-controls="desktop-search-popover"
                className={`p-2 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isSearchOpen
                    ? scrolled
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500/80 text-white"
                    : scrolled
                      ? "text-slate-600 hover:bg-slate-100"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {isSearchOpen ? (
                  <X className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Search className="w-4 h-4" aria-hidden="true" />
                )}
              </button>

              {isSearchOpen && (
                <div
                  id="desktop-search-popover"
                  role="search"
                  className="absolute top-[calc(100%+14px)] right-0 w-120 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-200"
                >
                  {/* Branded accent bar — ties the popover back to the navy/blue
                      identity instead of reading as a generic white card. */}
                  <div
                    className="h-1 bg-gradient-to-r from-navy-800 via-blue-600 to-blue-400"
                    aria-hidden="true"
                  />
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    <label htmlFor="nav-search-desktop" className="sr-only">
                      Search products and services
                    </label>
                    <input
                      id="nav-search-desktop"
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search products & services…"
                      value={query}
                      // eslint-disable-next-line jsx-a11y/no-autofocus -- fires on user-opened search popover, not page load
                      autoFocus
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={searchResults.length > 0}
                      aria-controls="desktop-search-listbox"
                      aria-activedescendant={
                        activeIndex >= 0 ? `desktop-search-option-${activeIndex}` : undefined
                      }
                      className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-500 outline-none"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        aria-label="Clear search"
                        className="text-slate-500 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-0.5"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto p-2">
                    {!query ? (
                      <p className="text-center text-xs text-slate-500 py-6">
                        Start typing to search products &amp; services
                      </p>
                    ) : searchResults.length === 0 ? (
                      <div className="p-8 text-center" role="status" aria-live="polite">
                        <Search
                          className="w-9 h-9 text-slate-300 mx-auto mb-3"
                          aria-hidden="true"
                        />
                        <p className="text-sm font-semibold text-slate-600 mb-1">
                          No results for &ldquo;{query}&rdquo;
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Try:{" "}
                          <span className="font-medium text-blue-600">Turbine Overhauling</span>,{" "}
                          <span className="font-medium text-blue-600">Dynamic Balancing</span>,{" "}
                          <span className="font-medium text-blue-600">Lube Oil</span>
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="px-2 pt-1 pb-2 text-[11px] font-bold uppercase tracking-widest text-slate-600">
                          {searchResultsTotal} result{searchResultsTotal === 1 ? "" : "s"} for
                          &ldquo;{query}&rdquo;
                        </p>
                        <ul
                          id="desktop-search-listbox"
                          role="listbox"
                          className="space-y-1"
                          aria-label="Search results"
                        >
                          {searchResults.map((r, i) => {
                            const styles = RESULT_TYPE_STYLES[r.type] || RESULT_TYPE_STYLES.Product;
                            const active = i === activeIndex;
                            return (
                              <li key={`${r.type}-${r.id}`} role="presentation">
                                <a
                                  id={`desktop-search-option-${i}`}
                                  role="option"
                                  aria-selected={active}
                                  href={r.path}
                                  onMouseEnter={() => setActiveIndex(i)}
                                  className={`relative w-full text-left pl-4 pr-3 py-3 rounded-xl transition-colors flex flex-col gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${active ? "bg-blue-50 ring-1 ring-blue-200" : "hover:bg-slate-50"}`}
                                >
                                  <span
                                    className={`absolute left-1 top-2 bottom-2 w-1 rounded-full ${styles.accent}`}
                                    aria-hidden="true"
                                  />
                                  <div className="flex gap-3 w-full items-center">
                                    <div className="w-12 h-12 shrink-0 rounded bg-slate-100 border border-slate-200/50 overflow-hidden flex items-center justify-center relative shadow-sm">
                                      {r.image && (
                                        <img
                                          src={`/${r.image}`}
                                          alt=""
                                          aria-hidden="true"
                                          width="800"
                                          height="600"
                                          className="absolute inset-0 w-full h-full object-contain p-1"
                                          onError={(e) => {
                                            e.target.style.display = "none";
                                          }}
                                        />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900 text-sm line-clamp-1">
                                          {highlightMatch(r.title, query)}
                                        </span>
                                        <span
                                          className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${styles.badge}`}
                                        >
                                          {r.type}
                                        </span>
                                      </div>
                                      {r.desc && (
                                        <span className="text-xs text-slate-500 line-clamp-1">
                                          {r.desc}
                                        </span>
                                      )}
                                      {r.priceRange && (
                                        <span className="text-xs font-bold text-blue-700">
                                          {formatPrice(
                                            r.priceRange.min,
                                            currencyCode,
                                            currencyRates,
                                          )}
                                          {r.priceRange.max !== r.priceRange.min && (
                                            <>
                                              {" "}
                                              –{" "}
                                              {formatPrice(
                                                r.priceRange.max,
                                                currencyCode,
                                                currencyRates,
                                              )}
                                            </>
                                          )}
                                          {r.priceRange.unit && (
                                            <span className="font-medium text-slate-600">
                                              {" "}
                                              / {r.priceRange.unit}
                                            </span>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                        {hasMoreResults && (
                          <button
                            type="button"
                            onClick={() =>
                              handleNav(`/products?search=${encodeURIComponent(query)}`)
                            }
                            className="w-full text-center mt-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-blue-600 hover:bg-blue-50 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                          >
                            View all results for &ldquo;{query}&rdquo;
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </search>

            {/* Get Quote CTA — this was missing entirely, caught via screenshot comparison */}
            <button
              type="button"
              onClick={() => handleNav("/contact")}
              className={`ml-1 px-4 py-2 rounded-lg font-bold text-[12.5px] tracking-wide whitespace-nowrap transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 flex items-center gap-1.5 ${scrolled ? "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600" : "bg-blue-500 text-white hover:bg-blue-400 ring-1 ring-white/20 focus-visible:ring-cyan-300"}`}
            >
              <PhoneCall className="w-3.5 h-3.5" aria-hidden="true" />
              Get Quote
            </button>
          </div>

          {/* ── MOBILE RIGHT SECTION ── */}
          <div className="lg:hidden flex items-center gap-1.5">
            <a
              href={`tel:${CONTACT_INFO.phones[0].replace(/\s/g, "")}`}
              aria-label={`Call us: ${CONTACT_INFO.phones[0]}`}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-200 border mr-1 ${
                scrolled
                  ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              }`}
            >
              <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Call Us</span>
            </a>
            <LanguageSwitcher scrolled={scrolled} currentLocale={currentLocale} equivalentLocalePaths={equivalentLocalePaths} />
            <button
              type="button"
              onClick={() => {
                if (isSearchOpen) {
                  setIsSearchOpen(false);
                  setQuery("");
                } else {
                  setIsSearchOpen(true);
                  setIsOpen(true);
                }
              }}
              aria-label={isSearchOpen ? "Close search" : "Open search"}
              aria-expanded={isSearchOpen}
              aria-controls="mobile-nav"
              className={`p-2.5 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${scrolled ? "bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white" : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"}`}
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                const next = !isOpen;
                setIsOpen(next);
                if (!next) {
                  setIsSearchOpen(false);
                  setQuery("");
                  setMobileExpanded(null);
                }
              }}
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-nav"
              className={`p-2.5 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${scrolled ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"}`}
            >
              {isOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile unified drawer */}
      {(isOpen || isSearchOpen) && (
        <div
          id="mobile-nav"
          className="lg:hidden absolute top-full left-0 w-full bg-white shadow-2xl border-t border-slate-100 max-h-[85dvh] overflow-y-auto overscroll-contain"
          role="menu"
        >
          <div className="px-4 pt-4 pb-3 border-b border-slate-100">
            <div className="relative">
              <Search
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <label htmlFor="mobile-drawer-search" className="sr-only">
                Search products and services
              </label>
              <input
                id="mobile-drawer-search"
                ref={mobileSearchInputRef}
                type="text"
                placeholder="Search products & services…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={searchResults.length > 0}
                aria-controls="mobile-search-listbox"
                aria-activedescendant={
                  activeIndex >= 0 ? `mobile-search-option-${activeIndex}` : undefined
                }
                className="w-full bg-slate-100 border-none rounded-xl py-3 pl-10 pr-10 focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-500 text-sm outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
            {query && (
              <>
                <div className="flex justify-end mt-2 mb-1">
                  <button
                    type="button"
                    onClick={() => mobileSearchInputRef.current?.blur()}
                    className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 px-2 py-1 -mr-2 rounded-lg transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" /> Hide keyboard
                  </button>
                </div>
                <div className="max-h-[40dvh] overflow-y-auto overscroll-contain bg-white rounded-xl border border-slate-100 shadow-inner">
                  {searchResults.length === 0 ? (
                    <div className="p-6 text-center" role="status" aria-live="polite">
                      <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                      <p className="text-sm font-semibold text-slate-600 mb-1">
                        No results for &ldquo;{query}&rdquo;
                      </p>
                      <p className="text-xs text-slate-500">
                        Try: Turbine Overhauling, Dynamic Balancing, Lube Oil
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="px-3 pt-2.5 pb-1 text-[11px] font-bold uppercase tracking-widest text-slate-600">
                        {searchResultsTotal} result{searchResultsTotal === 1 ? "" : "s"} for &ldquo;
                        {query}&rdquo;
                      </p>
                      <ul
                        id="mobile-search-listbox"
                        role="listbox"
                        aria-label="Search results"
                        className="divide-y divide-slate-100"
                      >
                        {searchResults.map((r, i) => {
                          const styles = RESULT_TYPE_STYLES[r.type] || RESULT_TYPE_STYLES.Product;
                          const active = i === activeIndex;
                          return (
                            <li key={`${r.type}-${r.id}`} role="presentation">
                              <a
                                id={`mobile-search-option-${i}`}
                                role="option"
                                aria-selected={active}
                                href={r.path}
                                onMouseEnter={() => setActiveIndex(i)}
                                className={`relative w-full text-left pl-4 pr-3 py-3 transition-colors flex gap-3 items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${active ? "bg-blue-50" : "hover:bg-slate-50"}`}
                              >
                                <span
                                  className={`absolute left-1 top-2 bottom-2 w-1 rounded-full ${styles.accent}`}
                                  aria-hidden="true"
                                />
                                <div className="w-10 h-10 shrink-0 rounded-lg bg-slate-100 border border-slate-200/50 overflow-hidden flex items-center justify-center relative">
                                  {r.image && (
                                    <img
                                      src={`/${r.image}`}
                                      alt=""
                                      aria-hidden="true"
                                      width="800"
                                      height="600"
                                      className="absolute inset-0 w-full h-full object-contain p-1"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                      }}
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm line-clamp-1">
                                      {highlightMatch(r.title, query)}
                                    </span>
                                    <span
                                      className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${styles.badge}`}
                                    >
                                      {r.type}
                                    </span>
                                  </div>
                                  {r.desc && (
                                    <span className="text-xs text-slate-500 line-clamp-1">
                                      {r.desc}
                                    </span>
                                  )}
                                  {r.priceRange && (
                                    <span className="text-xs font-bold text-blue-700">
                                      {formatPrice(r.priceRange.min, currencyCode, currencyRates)}
                                      {r.priceRange.max !== r.priceRange.min && (
                                        <>
                                          {" "}
                                          –{" "}
                                          {formatPrice(
                                            r.priceRange.max,
                                            currencyCode,
                                            currencyRates,
                                          )}
                                        </>
                                      )}
                                      {r.priceRange.unit && (
                                        <span className="font-medium text-slate-600">
                                          {" "}
                                          / {r.priceRange.unit}
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </div>
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                      {hasMoreResults && (
                        <button
                          type="button"
                          onClick={() => handleNav(`/products?search=${encodeURIComponent(query)}`)}
                          className="w-full text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                        >
                          View all results for &ldquo;{query}&rdquo;
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {(isOpen || isSearchOpen) && !query && (
            <div className="px-4 py-5">
              {/*
                FIX (UX audit — mobile drawer CTA position): these were
                previously rendered AFTER the full nav link list, which on a
                6+ item menu can push the primary conversion actions below
                the drawer's visible fold. Moved to the top so WhatsApp/Call
                are reachable in one glance the instant the drawer opens,
                matching the always-visible "Get Quote" pill on desktop.
              */}
              <div className="flex flex-col gap-3 mb-5 pb-5 border-b border-slate-100">
                <a
                  href={waMsg("Hi KESHAV ENTERPRISES, I would like to get a technical quote.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-whatsapp text-white px-5 py-3.5 rounded-xl text-sm font-black tracking-wide shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                >
                  <MessageCircle className="w-5 h-5" aria-hidden="true" /> WhatsApp Us
                </a>
                <a
                  href={`tel:${CONTACT_INFO.phones[0].replace(/\s/g, "")}`}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-black tracking-wide border transition-all bg-slate-900 text-white border-slate-800 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Phone className="w-4 h-4" aria-hidden="true" /> {CONTACT_INFO.phones[0]}
                </a>
              </div>
              <ul className="space-y-1 mb-5">
                {localizedNavLinks.map((link) => {
                  const subItems =
                    link.name === "Services"
                      ? navServicesMenu
                      : link.name === "Products"
                        ? navProductsMenu
                        : link.name === "Industries"
                          ? navIndustriesMenu
                          : null;
                  const expanded = mobileExpanded === link.name;
                  const active = isActive(link.path);
                  return (
                    <li key={link.name}>
                      {subItems && subItems.length > 0 ? (
                        <div
                          className={`flex items-center rounded-xl overflow-hidden border transition-all ${active ? "border-blue-200 bg-blue-50" : expanded ? "border-slate-200 bg-slate-50" : "border-transparent"}`}
                        >
                          <button
                            type="button"
                            onClick={() => handleNav(link.path)}
                            aria-current={active ? "page" : undefined}
                            className={`flex-1 text-left px-4 py-3.5 text-base font-bold tracking-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${active ? "text-blue-600" : "text-slate-700"}`}
                          >
                            {link.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => setMobileExpanded(expanded ? null : link.name)}
                            aria-expanded={expanded}
                            aria-label={`${expanded ? "Collapse" : "Expand"} ${link.name} menu`}
                            className={`px-4 py-3.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 border-l ${expanded ? "border-blue-200 text-blue-500" : "border-slate-200 text-slate-500"}`}
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180 text-blue-500" : ""}`}
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleNav(link.path)}
                          aria-current={active ? "page" : undefined}
                          className={`w-full text-left flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-bold tracking-tight transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${active ? "text-blue-600 bg-blue-50 border border-blue-200" : "text-slate-700 hover:text-blue-600 hover:bg-slate-50 border border-transparent"}`}
                        >
                          {link.name}
                          {active && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      )}

                      {subItems && subItems.length > 0 && expanded && (
                        <ul className="ml-2 mt-1 mb-1 space-y-0.5 border-l-2 border-blue-100 pl-3">
                          {subItems.map((item) => (
                            <li key={item.label}>
                              <button
                                type="button"
                                onClick={() => {
                                  setMobileExpanded(null);
                                  handleNav(item.href ?? link.path);
                                }}
                                className="w-full text-left px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center justify-between gap-2 group"
                              >
                                <span className="flex items-center gap-2">
                                  <span
                                    className="w-1 h-1 rounded-full bg-blue-300 group-hover:bg-blue-500 shrink-0 transition-colors"
                                    aria-hidden="true"
                                  />
                                  {item.label}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
