// src/components/islands/RichProductCard.jsx
// FIXED: caught via screenshot comparison of the Products listing page. My
// original card was missing the "Application" callout box and had a single
// "View Details" link instead of the real RFQ+Specs dual-button footer.
// Full port of ProductCard in App.jsx (line ~9654). This is the ONE shared
// card component used across the product grid, "You May Also Need", and
// "Related Products" — matching the original's actual architecture (a
// single ProductCard reused everywhere) instead of my previous approach of
// writing similar-but-different card markup in each place it appeared.
import { useState } from "react";
import { MessageCircle, ArrowRight, Target, TrendingUp } from "lucide-react";
import { CONTACT_INFO } from "../../data/site-config";
import { formatPrice } from "../../data/currency";
import { useCurrency } from "../../hooks/useCurrency";
import { localizedPath } from "../../lib/localeMeta";

const AVAIL_STYLES = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function RichProductCard({ product, priority = false, imageMap = {}, locale = "en" }) {
  const [imgErr, setImgErr] = useState(false);
  const { code: currencyCode, rates: currencyRates } = useCurrency();
  const [imgLoaded, setImgLoaded] = useState(false);
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
  const av = product.availability;

  const waHref = `https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(`Hello KESHAV ENTERPRISES, I need a quotation for: ${product.title}.`)}`;

  return (
    <article
      aria-label={`${product.title} product card`}
      className="relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 group flex flex-col h-full focus-within:ring-4 focus-within:ring-blue-500/50 w-full text-left"
    >
      {/*
        FIXED: card was only clickable via the image and title — the
        description, Application callout, and price rows were dead click
        zones despite the whole card lifting/highlighting on hover as if it
        were one big target. This stretched-link overlay makes the full card
        clickable; it sits behind (z-0) the RFQ/Specs buttons below (z-10),
        which stay independently clickable and keyboard-focusable.
      */}
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content -- decorative stretched-link; the accessible name/link is the title <a> below */}
      <a
        href={localizedPath(locale, `/products/${product.slug}`)}
        className="absolute inset-0 z-0"
        tabIndex={-1}
        aria-hidden="true"
      />
      <a href={localizedPath(locale, `/products/${product.slug}`)} className="block relative z-0" tabIndex={-1} aria-hidden="true">
        <div className="h-48 sm:h-64 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative overflow-hidden shrink-0">
          <span className="absolute top-3 left-3 bg-white/95 text-slate-900 border border-slate-200 text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest rounded z-20 shadow-sm backdrop-blur-sm">
            {product.category}
          </span>
          {av && (
            <span
              className={`absolute top-3 right-3 z-20 text-[10px] font-bold px-2.5 py-1.5 rounded border uppercase tracking-wider ${AVAIL_STYLES[av.color] || AVAIL_STYLES.green}`}
            >
              {av.label}
            </span>
          )}
          {/*
            FIXED (round 2): the fallback icon now correctly hides once the
            real image finishes loading. Round 1 fixed the "blank box while
            waiting for onError" bug by always rendering this fallback
            underneath the image — but never hid it again once the image DID
            load successfully. Since product photos are typically shot on a
            white/transparent background with `object-contain` padding
            around them, the icon was visibly bleeding through the gaps
            around a fully-working image. Now: visible while loading or on
            error, hidden the instant imgLoaded is true.
          */}
          {(!imgLoaded || imgErr || !pImg) && (
            <div className="absolute inset-0 z-0 flex items-center justify-center bg-slate-100/60">
              <svg
                className="w-14 h-14 text-slate-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
          )}
          {pImg && !imgErr && (
            <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4 z-10">
              <img
                // BUGFIX: the <img> is already in the server-rendered HTML with
                // its real src, so the browser can finish loading it before React
                // hydrates and attaches onLoad — that fired-into-a-void load event
                // left imgLoaded stuck at false forever (image invisible behind the
                // placeholder icon). The ref callback below checks img.complete the
                // instant this node mounts, catching images that already finished
                // loading pre-hydration (very common for priority/eager cards).
                ref={(node) => {
                  if (node?.complete && node.naturalWidth > 0) setImgLoaded(true);
                }}
                src={pImgSrc}
                srcSet={resolvedImg?.srcSet}
                sizes={resolvedImg ? "(min-width: 640px) 320px, 50vw" : undefined}
                alt={`${product.title} — ${product.category}`}
                loading={priority ? "eager" : "lazy"}
                decoding={priority ? "sync" : "async"}
                fetchPriority={priority ? "high" : "low"}
                width="320"
                height="320"
                className={`max-w-full max-h-full w-auto h-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-500 group-hover:scale-110 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setImgLoaded(true)}
                onError={() => {
                  setImgErr(true);
                  setImgLoaded(false);
                }}
              />
            </div>
          )}
        </div>
      </a>

      <div className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col bg-white">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors tracking-tight">
          <a
            href={localizedPath(locale, `/products/${product.slug}`)}
            className="relative z-10 focus:outline-none focus-visible:underline"
          >
            {product.title}
          </a>
        </h3>
        <p className="text-slate-600 font-medium text-sm md:text-base mb-4 leading-relaxed line-clamp-2">
          {product.desc}
        </p>

        {product.usage && (
          <div className="mb-5 flex items-start bg-blue-50/50 p-4 rounded-lg border border-blue-100/50 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
            <Target className="w-5 h-5 text-blue-600 mr-3 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm text-slate-700 font-medium leading-relaxed line-clamp-2">
              <strong className="text-slate-900 font-bold">Application: </strong>
              {product.usage}
            </p>
          </div>
        )}

        {product.priceRange ? (
          <div className="mb-4 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5">
            <TrendingUp className="w-4 h-4 text-blue-500 shrink-0" aria-hidden="true" />
            <span className="text-sm font-black text-slate-900">
              {formatPrice(product.priceRange.min, currencyCode, currencyRates)}
              {product.priceRange.max !== product.priceRange.min && (
                <> – {formatPrice(product.priceRange.max, currencyCode, currencyRates)}</>
              )}
            </span>
            {product.priceRange.unit && (
              <span className="text-xs text-slate-500 font-semibold">
                {product.priceRange.unit}
              </span>
            )}
            {/*
              FIX (UX audit — inconsistent pricing microcopy): "indicative"
              here and "contact for quote" on the Price-on-request state
              below were two different phrasings of the same underlying
              fact — nothing here is final until we've reviewed the spec.
              Both states now use identical wording so a buyer reads them
              as the same promise, not two different policies.
            */}
            <span className="ml-auto text-[10px] text-slate-500 font-medium italic">
              confirmed after review
            </span>
          </div>
        ) : (
          // FIX (UX audit — priced vs. POR scannability): previously used the
          // same filled slate-50 box as a real price range, so a buyer
          // scanning a full grid couldn't tell "has a number" from "needs an
          // inquiry" without reading each card. Now visually distinct
          // (outline, not filled) so POR reads as a different state at a
          // glance, not a blank version of the same state.
          <div className="mb-4 flex items-center gap-2 bg-white border border-dashed border-slate-300 rounded-lg px-4 py-2.5">
            <TrendingUp className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-500">Price on request</span>
            <span className="ml-auto text-[10px] text-slate-500 font-medium italic">
              confirmed after review
            </span>
          </div>
        )}

        <div className="relative z-10 flex flex-row gap-2 mt-auto pt-5 border-t border-slate-100">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            // FIXED: visible text on this link is "RFQ", but the aria-label
            // ("Request quote for ... via WhatsApp") never says "RFQ" — since
            // aria-label overrides the accessible name entirely, the on-screen
            // text was missing from it (axe: label-content-name-mismatch).
            // Leading with "RFQ" keeps the fuller description for screen
            // reader users while containing the visible text.
            aria-label={`RFQ: request quote for ${product.title} via WhatsApp`}
            className="flex-1 bg-whatsapp text-white flex items-center justify-center py-3 text-xs sm:text-sm font-bold rounded-lg hover:bg-whatsapp-hover transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
          >
            <MessageCircle className="w-4 h-4 mr-1.5 shrink-0" aria-hidden="true" />
            RFQ
          </a>
          <a
            href={localizedPath(locale, `/products/${product.slug}`)}
            className="flex-1 bg-slate-900 text-white flex items-center justify-center py-3 text-xs sm:text-sm font-bold rounded-lg hover:bg-blue-600 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`View technical specs for ${product.title}`}
          >
            Specs{" "}
            <ArrowRight
              className="w-4 h-4 ml-2 opacity-70 group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>
    </article>
  );
}
