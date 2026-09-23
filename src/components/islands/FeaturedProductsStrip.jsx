// src/components/islands/FeaturedProductsStrip.jsx
// FIXED: the homepage previously had a static 4-card grid here instead of
// this component — caught during a full-homepage re-audit prompted by user
// screenshots. Full port of App.jsx's FeaturedProductsStrip (line ~15325):
// requestAnimationFrame-driven infinite auto-scroll, mouse/touch drag,
// IntersectionObserver-gated so the animation loop fully stops when
// scrolled off-screen, nav arrows, and prefers-reduced-motion support.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { localizedPath } from "../../lib/localeMeta";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Filter,
  Droplets,
  Layers,
  Cog,
  Wind,
  Activity,
  Hexagon,
  Cpu,
  Wrench,
  Settings,
} from "lucide-react";

const CARD_W = 296; // card width (w-72 = 288px) + gap (8px)
const SPEED = 0.7; // px per animation frame (~42px/s at 60fps)

// This island never imports src/lib/i18n.ts directly (see Phase 2 shared
// rule — that loader eager-globs every locale, which would ship ~7MB+ into
// the client bundle). Instead the parent .astro file resolves home.json
// server-side and passes the relevant slice down as the `t` prop. These
// English defaults only cover the case where a caller forgets to pass it.
const DEFAULT_COPY = {
  heading: "Featured Engineering Products",
  scrollLeftLabel: "Scroll left",
  scrollRightLabel: "Scroll right",
  dragToExplore: "drag to explore",
  viewCompleteCatalog: "View Complete Catalog",
  viewDetails: "View Details",
  swipeToBrowse: "Swipe to browse",
};

const CATEGORY_ICONS = {
  "Industrial Filtration": Filter,
  "Industrial Strainers": Droplets,
  "Expansion Joints": Layers,
  "Turbine Spares": Cog,
  "HVAC, Ducting & Air Filtration": Wind,
  "Flexible Hoses & Assemblies": Activity,
  "Industrial Rubber Products": Hexagon,
  "Electronic Equipments": Cpu,
  "Hydraulic Components": Wrench,
  "Valves, Gaskets & Steam System Products": Settings,
};

function getCategoryIcon(category) {
  const Icon = CATEGORY_ICONS[category] || Settings;
  return (
    <Icon
      className="w-16 h-16 text-slate-300 group-hover:scale-110 group-hover:text-blue-500 transition-all duration-500"
      aria-hidden="true"
    />
  );
}

function FeaturedProductImage({ product, imageMap = {} }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const pImg = product.images?.[0];
  // Match ProductDetailInteractive.jsx's resolution exactly: prefer the
  // optimized/confirmed entry from imageMap, but fall back to the raw
  // public/ path when there's no entry, instead of showing nothing.
  //
  // An earlier version of this trusted imageMap alone and treated a missing
  // entry as "no photo exists yet" — that was wrong. buildProductImageMap's
  // existsSync() check (for files that live in public/ rather than
  // src/assets/products/) doesn't reliably reflect reality in every deploy
  // environment, and a false negative there made real, working product
  // photos disappear from this card while the exact same file still loaded
  // fine on the detail page (which never stopped using this same guess+
  // fallback pattern). Guessing and letting onError swap in the icon is the
  // safe default; it's only actually wrong for files that don't exist
  // anywhere, which onError already handles with zero visible difference.
  const resolvedImg = pImg ? imageMap[pImg] : undefined;
  const pImgSrc = resolvedImg?.src ?? (pImg ? `/${pImg}` : undefined);
  return (
    <div
      className="h-48 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative overflow-hidden shrink-0"
      style={{ minHeight: "12rem" }}
    >
      <span className="absolute top-3 left-3 bg-white/95 text-slate-900 border border-slate-200 text-[9px] font-black px-2.5 py-1 uppercase tracking-widest rounded z-20 shadow-sm pointer-events-none backdrop-blur-sm">
        {product.category}
      </span>
      {/*
        FIXED (round 2): fallback now hides once the real image finishes
        loading — round 1 fixed the "blank box while waiting for onError"
        bug by always rendering this underneath, but never hid it again on
        success, so it bled through the transparent/white padding around a
        fully-working product photo. Same fix as RichProductCard.jsx.
      */}
      {(!imgLoaded || imgErr || !pImg) && (
        <div
          className="absolute inset-0 z-0 w-full h-full flex items-center justify-center pointer-events-none bg-slate-100/60"
          aria-hidden="true"
        >
          {getCategoryIcon(product.category)}
        </div>
      )}
      {pImg && !imgErr && (
        <div className="absolute inset-0 flex items-center justify-center p-3 z-10">
          <img
            // BUGFIX: this island uses client:visible, so hydration can happen
            // well after the browser already finished loading the
            // server-rendered <img> — that native `load` event fires into a
            // void (no onLoad listener attached yet), leaving imgLoaded stuck
            // at false forever and the image invisible (opacity-0) behind the
            // fallback icon even though it loaded fine. Same fix as
            // RichProductCard.jsx: check img.complete the instant this node
            // mounts, catching images that already finished loading.
            ref={(node) => {
              if (node?.complete && node.naturalWidth > 0) setImgLoaded(true);
            }}
            src={pImgSrc}
            srcSet={resolvedImg?.srcSet}
            sizes={resolvedImg ? "240px" : undefined}
            alt={`${product.title} — ${product.category}`}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            width="240"
            height="240"
            className={`max-w-full max-h-full w-auto h-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-500 group-hover:scale-110 pointer-events-none ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgErr(true);
              setImgLoaded(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function FeaturedProductsStrip({ products, imageMap = {}, t, locale = "en" }) {
  const copy = { ...DEFAULT_COPY, ...t };
  const trackRef = useRef(null);
  const rafRef = useRef(null);
  const sectionRef = useRef(null);
  const isPaused = useRef(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartSL = useRef(0);
  const resumeTimer = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const doubled = useMemo(() => [...products, ...products], [products]);
  const halfW = useMemo(() => products.length * CARD_W, [products.length]);

  const frameCount = useRef(0);
  const tickRef = useRef(null);
  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useEffect(() => {
    if (prefersReducedMotion) return;
    tickRef.current = () => {
      const el = trackRef.current;
      if (!el) {
        rafRef.current = requestAnimationFrame(tickRef.current);
        return;
      }
      if (!isPaused.current) {
        el.scrollLeft += SPEED;
        if (el.scrollLeft >= halfW) el.scrollLeft -= halfW;
      }
      frameCount.current = (frameCount.current + 1) % 12;
      if (frameCount.current === 0) {
        setCanLeft(el.scrollLeft > 4);
        setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
      }
      rafRef.current = requestAnimationFrame(tickRef.current);
    };
    rafRef.current = requestAnimationFrame(tickRef.current);
    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      clearTimeout(resumeTimer.current);
    };
  }, [halfW, prefersReducedMotion]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!rafRef.current && tickRef.current)
            rafRef.current = requestAnimationFrame(tickRef.current);
        } else if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      },
      { rootMargin: "200px 0px 200px 0px", threshold: 0 },
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  const pause = useCallback(() => {
    isPaused.current = true;
  }, []);
  const resume = useCallback(() => {
    isPaused.current = false;
  }, []);

  const onMouseDown = useCallback(
    (e) => {
      pause();
      isDragging.current = true;
      dragStartX.current = e.pageX;
      dragStartSL.current = trackRef.current?.scrollLeft ?? 0;
      e.currentTarget.style.userSelect = "none";
    },
    [pause],
  );
  const onMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const delta = dragStartX.current - e.pageX;
    if (trackRef.current) trackRef.current.scrollLeft = dragStartSL.current + delta;
  }, []);
  const onMouseUp = useCallback(
    (e) => {
      isDragging.current = false;
      e.currentTarget.style.userSelect = "";
      resume();
    },
    [resume],
  );
  const onMouseLeave = useCallback(
    (e) => {
      if (isDragging.current) {
        isDragging.current = false;
        e.currentTarget.style.userSelect = "";
      }
      resume();
    },
    [resume],
  );
  const onMouseEnter = useCallback(() => {
    pause();
  }, [pause]);

  const onTouchStart = useCallback(
    (e) => {
      pause();
      isDragging.current = true;
      dragStartX.current = e.touches[0].pageX;
      dragStartSL.current = trackRef.current?.scrollLeft ?? 0;
    },
    [pause],
  );
  const onTouchMove = useCallback((e) => {
    if (!isDragging.current) return;
    const delta = dragStartX.current - e.touches[0].pageX;
    if (trackRef.current) trackRef.current.scrollLeft = dragStartSL.current + delta;
  }, []);
  const onTouchEnd = useCallback(() => {
    isDragging.current = false;
    resume();
  }, [resume]);

  const scrollBy = useCallback(
    (dir) => {
      pause();
      clearTimeout(resumeTimer.current);
      const el = trackRef.current;
      if (el) el.scrollBy({ left: dir * CARD_W * 3, behavior: "smooth" });
      resumeTimer.current = setTimeout(resume, 1200);
    },
    [pause, resume],
  );

  const guardClick = useCallback((e) => {
    // BUGFIX: this is a real <a href> — a genuine (non-drag) click already
    // navigates natively via the browser's default action. The old version
    // left that default action alone AND called window.location.assign(href)
    // itself, so every ordinary click double-navigated to the same URL and
    // left a duplicate entry in browser history (back had to be pressed
    // twice to actually leave the page). Now this only ever calls
    // preventDefault — and only when the "click" was actually the tail end
    // of a drag — letting the anchor's own href handle real clicks.
    const dist = Math.abs((trackRef.current?.scrollLeft ?? 0) - dragStartSL.current);
    if (dist > 6) e.preventDefault();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-slate-50 py-20 border-b border-slate-200"
      aria-labelledby="featured-products-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 flex flex-col sm:flex-row justify-between items-end gap-6">
        <div>
          <h2
            id="featured-products-heading"
            className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4"
          >
            {copy.heading}
          </h2>
          <div className="w-20 h-1.5 bg-blue-600 rounded-full shadow-md" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-4">
          <div role="group" className="flex gap-2" aria-label="Scroll products">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              disabled={!canLeft}
              aria-label={copy.scrollLeftLabel}
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${canLeft ? "border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50" : "border-slate-200 text-slate-300 cursor-not-allowed"}`}
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={!canRight}
              aria-label={copy.scrollRightLabel}
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${canRight ? "border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50" : "border-slate-200 text-slate-300 cursor-not-allowed"}`}
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <span
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium select-none"
            aria-hidden="true"
          >
            {copy.dragToExplore}
          </span>
          <a
            href={localizedPath(locale, "/products")}
            className="hidden sm:flex items-center font-black text-blue-600 hover:text-blue-800 transition-colors text-lg tracking-tight group focus:outline-none focus-visible:underline"
          >
            {copy.viewCompleteCatalog}
            <ArrowRight
              className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 w-16 md:w-28 h-full bg-linear-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 w-16 md:w-28 h-full bg-linear-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions --
            mouse enter/leave only pause the auto-scroll; no click/keyboard action is
            gated behind them, and every card inside remains a real, focusable <a>. */}
        <ul
          ref={trackRef}
          className="flex gap-5 px-6 py-5 overflow-x-auto cursor-grab active:cursor-grabbing select-none list-none m-0"
          style={{
            scrollBehavior: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          aria-label="Featured products — scroll to browse"
        >
          {doubled.map((product, i) => {
            // The second half of `doubled` exists purely so the drag/auto-scroll
            // track can loop seamlessly for sighted/mouse users — it's a visual
            // trick, not real content. Without this, keyboard and screen-reader
            // users would tab through every product twice with no indication
            // the second pass is a duplicate.
            const isDuplicate = i >= products.length;
            return (
              <li
                key={`fp-${product.id}-${i}`}
                className="shrink-0 w-64 md:w-72"
                aria-hidden={isDuplicate || undefined}
              >
                <a
                  href={localizedPath(locale, `/products/${product.slug}`)}
                  onClick={guardClick}
                  tabIndex={isDuplicate ? -1 : undefined}
                  className="group flex flex-col w-full bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-left h-full"
                >
                  <FeaturedProductImage product={product} imageMap={imageMap} />
                  <div className="p-5 flex-1 flex flex-col bg-white">
                    <h3 className="text-base font-black text-slate-900 mb-1.5 leading-tight group-hover:text-blue-600 transition-colors tracking-tight line-clamp-2 pointer-events-none">
                      {product.title}
                    </h3>
                    <p className="text-slate-500 font-medium text-xs leading-relaxed mb-3 line-clamp-2 flex-1 pointer-events-none">
                      {product.desc}
                    </p>
                    <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors pointer-events-none">
                        {copy.viewDetails}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors shadow-sm pointer-events-none">
                        <ArrowRight
                          className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <div
        className="flex sm:hidden items-center justify-center gap-1.5 mt-3 mb-1"
        aria-hidden="true"
      >
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          {copy.swipeToBrowse}
        </span>
        <svg
          width="20"
          height="12"
          viewBox="0 0 20 12"
          fill="none"
          className="text-slate-300"
          aria-hidden="true"
        >
          <path
            d="M2 6h16M13 2l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="mt-8 flex justify-center sm:hidden px-4">
        <a
          href={localizedPath(locale, "/products")}
          className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-black hover:bg-blue-700 transition-all shadow-md flex items-center justify-center text-base"
        >
          {copy.viewCompleteCatalog}
          <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
