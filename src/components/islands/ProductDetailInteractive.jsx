// src/components/islands/ProductDetailInteractive.jsx
// Ported from ProductDetailPage in App.jsx (line ~14258). Combines the image
// gallery, lightbox, and specs/features tabs into one island since they share
// tightly-coupled state — splitting further would mean prop-drilling between
// islands, which Astro doesn't support directly (islands don't share React
// context). Uses onError-based image filtering instead of the original's
// hidden-probe-image pattern — same visual result (only real images show),
// simpler implementation since Astro doesn't need to guess filenames at runtime.
import { useCallback, useEffect, useMemo, useRef, useState, forwardRef } from "react";
import { localizedPath } from "../../lib/localeMeta";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  MessageCircle,
  Paperclip,
  TrendingUp,
  Wrench,
  X,
} from "lucide-react";
import { CONTACT_INFO } from "../../data/site-config";
import { formatPrice } from "../../data/currency";
import { useCurrency } from "../../hooks/useCurrency";
import CurrencyDropdown from "./CurrencyDropdown.jsx";
import { groupSpecsByTab, labelOfGroup, leadTimeForCategory } from "../../data/spec-groups";
import { useFocusTrap } from "../../lib/useFocusTrap.js";
import InlineRFQForm from "./InlineRFQForm.jsx";
import ReportIssueModal from "./ReportIssueModal.jsx";

const AVAIL_STYLES = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
};

const GalleryImage = forwardRef(function GalleryImage(
  { src, alt, className, onLoad, onError, ...rest },
  ref,
) {
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading="eager"
      decoding="async"
      className={className}
      onLoad={onLoad}
      onError={onError}
      {...rest}
    />
  );
});

export default function ProductDetailInteractive({ product, imageMap = {}, locale = "en" }) {
  const { code: currencyCode, rates: currencyRates } = useCurrency();
  const validImages = useMemo(() => product.images || [], [product.images]);
  // Optimized (AVIF, content-hashed) URL if migrated into src/assets/products/,
  // otherwise the same raw /public path as before.
  // Optimized (AVIF, responsive) variant if migrated into src/assets/products/,
  // otherwise the same raw /public path as before.
  const resolveImg = useCallback(
    (filename) => imageMap[filename] ?? { src: `/${filename}`, srcSet: undefined },
    [imageMap],
  );
  // Returns the SAME Set reference when `item` is already present, so State
  // setters built on this bail out of re-rendering instead of looping.
  // Callback refs (see GalleryImage `ref=` below) re-fire on every render,
  // so if the updater always returned a new Set, each render would trigger
  // a state change, which triggers another render, forever ("Maximum
  // update depth exceeded").
  const addToSet = (set, item) => (set.has(item) ? set : new Set(set).add(item));
  // BUGFIX: was a Set of indices into the already-filtered `images` array,
  // then used to filter `validImages` (a *different* index space) — once any
  // image errored, every index after it was off by one, so the wrong image
  // could get hidden while the actually-broken one stayed in rotation.
  // Tracking by src/filename instead sidesteps index math entirely.
  const [erroredSrcs, setErroredSrcs] = useState(() => new Set());
  // Tracks images that have finished loading successfully, so we can show a
  // skeleton placeholder until we know whether an image will load or 404 —
  // without this, a broken filename briefly renders the browser's ugly
  // broken-image glyph + alt text before onError fires and filters it out.
  const [loadedSrcs, setLoadedSrcs] = useState(() => new Set());
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [tab, setTab] = useState("specs");
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const groupedSpecs = useMemo(
    () => (product.specs ? groupSpecsByTab(product.specs) : {}),
    [product.specs],
  );
  const specGroupIds = useMemo(() => Object.keys(groupedSpecs), [groupedSpecs]);
  const [specSubTab, setSpecSubTab] = useState(() => specGroupIds[0] ?? "general");
  useEffect(() => {
    if (specGroupIds.length && !specGroupIds.includes(specSubTab)) setSpecSubTab(specGroupIds[0]);
  }, [specGroupIds, specSubTab]);
  const thumbStripRef = useRef(null);
  const touchRef = useRef(null);
  const lightboxRef = useRef(null);
  const galleryRef = useRef(null);
  useFocusTrap(lightboxRef, lightbox);

  const images = useMemo(
    () => validImages.filter((src) => !erroredSrcs.has(src)),
    [validImages, erroredSrcs],
  );
  const total = images.length;
  const safeActive = total === 0 ? 0 : Math.min(activeImg, total - 1);
  const activeImage = images[safeActive] || "";

  const goTo = useCallback((idx) => {
    setActiveImg(idx);
    const strip = thumbStripRef.current;
    if (strip)
      strip.children[idx]?.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: "smooth",
      });
  }, []);
  const prev = useCallback(
    () => goTo(safeActive === 0 ? total - 1 : safeActive - 1),
    [goTo, safeActive, total],
  );
  const next = useCallback(
    () => goTo(safeActive === total - 1 ? 0 : safeActive + 1),
    [goTo, safeActive, total],
  );

  useEffect(() => {
    const h = (e) => {
      const tag = document.activeElement?.tagName ?? "";
      const isTyping =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        document.activeElement?.isContentEditable;
      // Only steer arrow keys when the lightbox is open, or focus is actually
      // inside the gallery — otherwise a user reading specs further down the
      // page (or navigating any other control with arrow keys) unexpectedly
      // changes the hero image above the fold.
      const galleryFocused = galleryRef.current?.contains(document.activeElement);
      const shouldHandle = lightbox || (galleryFocused && !isTyping);
      if (e.key === "ArrowLeft" && shouldHandle) {
        e.preventDefault();
        prev();
      }
      if (e.key === "ArrowRight" && shouldHandle) {
        e.preventDefault();
        next();
      }
      if (e.key === "Escape" && lightbox) {
        e.preventDefault();
        setLightbox(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [prev, next, lightbox]);

  // Simple focus trap + body scroll lock while lightbox open
  useEffect(() => {
    if (lightbox) {
      document.body.style.overflow = "hidden";
      lightboxRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  const onTouchStart = (e) => {
    touchRef.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchRef.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    touchRef.current = null;
  };

  const waMsg = (text) => `https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(text)}`;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* ── LEFT: Gallery ── */}
        <div
          ref={galleryRef}
          className="lg:col-span-5 p-6 lg:p-8 bg-white flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100"
        >
          {/* role="img" is intentional here (this is primarily an image display);
              Enter/Space already open the lightbox via the onKeyDown right below,
              so keyboard access is already covered despite the non-interactive role. */}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            className="w-full aspect-square bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center relative overflow-hidden mb-4 shadow-inner cursor-zoom-in select-none"
            role="img"
            aria-label={
              total > 0 ? `${product.title} — image ${safeActive + 1} of ${total}` : product.title
            }
            onClick={() => activeImage && setLightbox(true)}
            onKeyDown={
              activeImage
                ? (e) => (e.key === "Enter" || e.key === " ") && setLightbox(true)
                : undefined
            }
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={activeImage ? 0 : undefined}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {activeImage ? (
              <>
                {!loadedSrcs.has(activeImage) && (
                  <div
                    className="absolute inset-0 z-0 animate-pulse bg-slate-200"
                    aria-hidden="true"
                  />
                )}
                <GalleryImage
                  key={activeImage}
                  ref={(node) => {
                    if (!node || !node.complete) return;
                    if (node.naturalWidth > 0) setLoadedSrcs((s) => addToSet(s, activeImage));
                    else setErroredSrcs((s) => addToSet(s, activeImage));
                  }}
                  src={resolveImg(activeImage).src}
                  srcSet={resolveImg(activeImage).srcSet}
                  sizes="(min-width: 1024px) 600px, 90vw"
                  alt=""
                  aria-hidden="true"
                  className={`relative z-[1] max-w-full max-h-full w-auto h-auto object-contain drop-shadow-lg transition-opacity duration-300 ${loadedSrcs.has(activeImage) ? "opacity-100" : "opacity-0"}`}
                  width={600}
                  height={600}
                  // FIXED: this is the page's LCP element (Lighthouse:
                  // lcp-discovery-insight flagged "fetchpriority=high should
                  // be applied"). It was already loading="eager"/discoverable
                  // in the initial HTML, just missing the priority hint that
                  // tells the browser to fetch it ahead of lower-priority
                  // requests — a load-order hint only, no visual/behavioral
                  // change.
                  fetchPriority="high"
                  onLoad={() => setLoadedSrcs((s) => addToSet(s, activeImage))}
                  onError={() => setErroredSrcs((s) => addToSet(s, activeImage))}
                />
                {total > 1 && (
                  <span className="absolute bottom-3 right-3 z-10 bg-slate-900/75 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none">
                    {safeActive + 1} / {total}
                  </span>
                )}
                <span className="absolute top-3 right-3 z-10 bg-white/85 border border-slate-200 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full pointer-events-none backdrop-blur-sm shadow-sm">
                  🔍 Zoom
                </span>
                {total > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        prev();
                      }}
                      aria-label="Previous image"
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 border border-slate-200 rounded-full shadow-md flex items-center justify-center text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        next();
                      }}
                      aria-label="Next image"
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 border border-slate-200 rounded-full shadow-md flex items-center justify-center text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <ChevronRight className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="text-slate-300">
                <svg
                  className="w-20 h-20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
            )}
          </div>

          {total > 1 && (
            <ul
              ref={thumbStripRef}
              className="flex gap-2 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "thin" }}
              aria-label="Product image thumbnails"
            >
              {images.map((img, idx) => {
                const active = idx === safeActive;
                return (
                  <li key={img} className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => goTo(idx)}
                      aria-label={`View image ${idx + 1}`}
                      aria-current={active}
                      className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${active ? "border-blue-600" : "border-slate-200 hover:border-slate-300"}`}
                    >
                      {!loadedSrcs.has(img) && (
                        <div
                          className="absolute inset-0 z-0 animate-pulse bg-slate-200"
                          aria-hidden="true"
                        />
                      )}
                      <img
                        ref={(node) => {
                          if (!node || !node.complete) return;
                          if (node.naturalWidth > 0) setLoadedSrcs((s) => addToSet(s, img));
                          else setErroredSrcs((s) => addToSet(s, img));
                        }}
                        src={resolveImg(img).src}
                        srcSet={resolveImg(img).srcSet}
                        sizes="64px"
                        alt={`${product.title} view ${idx + 1}`}
                        loading="lazy"
                        width="64"
                        height="64"
                        className={`relative z-[1] w-full h-full object-contain p-0.5 bg-white transition-opacity duration-300 ${loadedSrcs.has(img) ? "opacity-100" : "opacity-0"}`}
                        onLoad={() => setLoadedSrcs((s) => addToSet(s, img))}
                        onError={() => setErroredSrcs((s) => addToSet(s, img))}
                      />
                    </button>
                    {active && (
                      <span
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-600 pointer-events-none"
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── RIGHT: Info panel ── */}
        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col bg-linear-to-br from-white to-slate-50/50">
          <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black px-4 py-2 uppercase tracking-widest rounded-md shadow-sm">
                {product.category}
              </span>
              {product.availability && (
                <span
                  className={`text-xs font-black px-3 py-2 rounded-md border uppercase tracking-wider ${AVAIL_STYLES[product.availability.color] || AVAIL_STYLES.green}`}
                >
                  {product.availability.label}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={async () => {
                const url = typeof window !== "undefined" ? window.location.href : "";
                try {
                  if (navigator.share) await navigator.share({ title: product.title, url });
                  else {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                } catch {
                  /* user cancelled share sheet — ignore */
                }
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-md px-3 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Paperclip className="w-3.5 h-3.5" aria-hidden="true" />
              {copied ? "Link copied!" : "Share"}
            </button>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-[1.1] tracking-tight">
            {product.title}
          </h1>

          {product.priceRange && (
            <div className="mb-5 bg-linear-to-r from-blue-50 to-slate-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" /> Indicative Price
                      Range
                    </p>
                    <CurrencyDropdown />
                  </div>
                  <p className="text-2xl font-black text-slate-900">
                    {formatPrice(product.priceRange.min, currencyCode, currencyRates)}
                    <span className="text-slate-500 mx-2">–</span>
                    {formatPrice(product.priceRange.max, currencyCode, currencyRates)}
                    <span className="text-sm font-bold text-slate-500 ml-2">
                      {product.priceRange.unit}
                    </span>
                  </p>
                  {product.priceRange.note && (
                    <p className="text-xs text-slate-500 mt-1">{product.priceRange.note}</p>
                  )}
                </div>
                <a
                  href={waMsg(
                    `Hello KESHAV ENTERPRISES, I need a quotation for: *${product.title}*. Please share your best price.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 bg-whatsapp text-white px-5 py-3 rounded-xl font-black text-sm hover:bg-whatsapp-hover transition-all shadow-sm flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" /> Get Quote
                </a>
              </div>
              <p className="mt-3 text-[11px] text-slate-500 leading-relaxed border-t border-blue-100 pt-2">
                {currencyCode !== "INR"
                  ? "Prices converted from INR at live market rates (open.er-api.com). Actual invoice will be in INR. Rate is indicative — contact us for a firm quotation."
                  : "Prices vary by turbine model, OEM spec, material grade, and order quantity. The range shown reflects our typical market spread — contact us for a firm quotation."}
              </p>
            </div>
          )}

          <p className="text-slate-600 font-medium text-lg mb-8 leading-relaxed">{product.desc}</p>

          {product.usage && (
            <div className="mb-8 bg-slate-900 p-6 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="font-black text-blue-400 text-sm uppercase tracking-widest mb-3">
                  Primary Industrial Application
                </h2>
                <p className="text-white font-medium text-base leading-relaxed">{product.usage}</p>
              </div>
            </div>
          )}

          {/* FIXED: role="tablist" was on this outer wrapper, which also
              contains the role="tabpanel" div below — a tablist's only
              allowed children are its role="tab" elements, so nesting the
              tabpanel inside it made the ARIA tree invalid (axe:
              aria-required-children). Moving the role down onto the div that
              directly and only wraps the tab buttons keeps the exact same
              markup/behavior, just with a valid parent/child structure. */}
          <div className="mb-6">
            <div
              role="tablist"
              aria-label="Product information"
              className="flex border-b border-slate-200 mb-6 gap-1"
            >
              {[
                ["specs", "Technical Data"],
                ["features", "Key Features"],
              ].map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  id={`tab-${k}`}
                  aria-controls={`panel-${k}`}
                  aria-selected={tab === k}
                  onClick={() => setTab(k)}
                  className={`px-5 py-3 text-sm font-black uppercase tracking-wider rounded-t-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${tab === k ? "bg-blue-600 text-white border-b-2 border-blue-600 -mb-px" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
              {tab === "specs" && product.specs && specGroupIds.length > 0 && (
                <div>
                  {specGroupIds.length > 1 && (
                    <div
                      className="flex flex-wrap gap-1 mb-3 border-b border-slate-200"
                      role="tablist"
                      aria-label="Specification categories"
                    >
                      {specGroupIds.map((gid) => (
                        <button
                          key={gid}
                          type="button"
                          role="tab"
                          aria-selected={specSubTab === gid}
                          onClick={() => setSpecSubTab(gid)}
                          className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-t-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${specSubTab === gid ? "bg-slate-100 text-blue-700 border-b-2 border-blue-600 -mb-px" : "text-slate-500 hover:text-slate-800"}`}
                        >
                          {labelOfGroup(gid)}{" "}
                          {/* FIXED: opacity-60 on top of the active tab's
                              text-blue-700 dropped contrast to 2.86:1 against
                              the bg-slate-100 tab background (axe:
                              color-contrast, needs 4.5:1). Dropping the
                              opacity and inheriting the tab's own text color
                              keeps the same "de-emphasized count" look
                              (it's already smaller/lighter than the label
                              via font sizing) while staying readable. */}
                          <span>({groupedSpecs[gid].length})</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <table className="w-full border border-slate-200 rounded-xl overflow-hidden shadow-sm text-sm">
                    <tbody className="divide-y divide-slate-100">
                      {(groupedSpecs[specSubTab] || []).map(([key, val]) => (
                        <tr key={key} className="odd:bg-white even:bg-slate-50">
                          <th
                            scope="row"
                            className="text-left px-4 py-3 font-bold text-slate-500 w-2/5 align-top uppercase text-xs tracking-wide"
                          >
                            {key}
                          </th>
                          <td className="px-4 py-3 text-slate-800 font-medium">{String(val)}</td>
                        </tr>
                      ))}
                      {product.priceRange && (
                        <tr className="odd:bg-white even:bg-slate-50">
                          <th
                            scope="row"
                            className="text-left px-4 py-3 font-bold text-slate-500 w-2/5 align-top uppercase text-xs tracking-wide"
                          >
                            Est. Price
                          </th>
                          <td className="px-4 py-3">
                            <span className="text-blue-700 font-black">
                              {formatPrice(product.priceRange.min, currencyCode, currencyRates)} –{" "}
                              {formatPrice(product.priceRange.max, currencyCode, currencyRates)}
                            </span>
                            <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                              Indicative estimate · contact for firm quote
                            </span>
                          </td>
                        </tr>
                      )}
                      <tr className="odd:bg-white even:bg-slate-50">
                        <th
                          scope="row"
                          className="text-left px-4 py-3 font-bold text-slate-500 w-2/5 align-top uppercase text-xs tracking-wide"
                        >
                          Lead Time
                        </th>
                        <td className="px-4 py-3 text-slate-800 font-medium">
                          {leadTimeForCategory(product.category)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {specGroupIds.length > 1 && (
                    <p className="text-right text-[11px] text-slate-500 font-medium mt-2">
                      Price &amp; Lead Time shown on every tab
                    </p>
                  )}
                </div>
              )}
              {tab === "features" && product.features && (
                <ul className="border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
                  {product.features.map((f) => (
                    <li
                      key={f}
                      className="bg-white hover:bg-slate-50 transition-colors p-4 md:p-5 text-slate-800 font-medium text-sm flex items-start"
                    >
                      <svg
                        className="w-5 h-5 text-blue-500 mr-4 shrink-0 mt-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-auto pt-8 border-t border-slate-200 flex flex-col gap-3">
            <a
              href={waMsg(
                `Hello KESHAV ENTERPRISES, I am interested in: *${product.title}*. Please share technical specs and quote.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-whatsapp text-white py-5 rounded-xl font-black text-lg hover:bg-whatsapp-hover transition-all shadow-lg hover:-translate-y-0.5 flex items-center justify-center tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            >
              <MessageCircle className="w-6 h-6 mr-3" aria-hidden="true" /> Request Quote via
              WhatsApp
            </a>
            <div className="flex items-center justify-center gap-4 pt-1">
              <a
                href={CONTACT_INFO.indiamart}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-blue-600 text-sm font-bold flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:underline"
              >
                Also on IndiaMART
              </a>
              <span className="text-slate-200" aria-hidden="true">
                |
              </span>
              <a
                href={`tel:${CONTACT_INFO.phones[0].replace(/\s/g, "")}`}
                className="text-slate-500 hover:text-blue-600 text-sm font-bold flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:underline"
              >
                Call us
              </a>
            </div>
            <InlineRFQForm
              productTitle={product.title}
              contactHref={localizedPath(locale, "/contact")}
            />

            {/* FIXED: both boxes below were entirely missing — caught via screenshot comparison */}
            <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
              <Wrench className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  Need installation or maintenance?
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Our field engineers supply, install, and commission everything we sell.
                </p>
                <a
                  href={localizedPath(locale, "/services")}
                  className="inline-flex items-center gap-1 text-blue-600 font-bold text-xs mt-1.5 hover:underline"
                >
                  View engineering services
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowReport(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-bold text-sm py-3 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <Flag className="w-4 h-4" aria-hidden="true" />
              Report an Issue with this Product
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && activeImage && (
        // click-outside-to-dismiss overlay; Escape is handled in the effect above, and the visible Close button covers the keyboard path
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${product.title} full-size image`}
          tabIndex={-1}
          className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Close image viewer"
            className="absolute top-4 right-4 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
          {/* onClick here only stops the click from bubbling to the overlay's
              dismiss handler — clicking the image itself shouldn't close the
              lightbox. Not a real interactive affordance, so no keyboard
              equivalent is needed. */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
          <img
            src={resolveImg(activeImage).src}
            srcSet={resolveImg(activeImage).srcSet}
            sizes="100vw"
            alt=""
            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${loadedSrcs.has(activeImage) ? "opacity-100" : "opacity-0"}`}
            onClick={(e) => e.stopPropagation()}
            onLoad={() => setLoadedSrcs((s) => addToSet(s, activeImage))}
            onError={() => setErroredSrcs((s) => addToSet(s, activeImage))}
          />
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous image"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next image"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight className="w-6 h-6" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      )}

      {showReport && (
        <ReportIssueModal context={{ title: product.title }} onClose={() => setShowReport(false)} />
      )}
    </>
  );
}
