// src/components/islands/BackToTopButton.jsx
// FIXED: this was a simplified stub (bottom-right, plain button, no progress
// ring) — caught via screenshot audit while fixing WhatsAppBubble, since the
// stub's position would have collided with that widget's taller stack. The
// real original (App.jsx line ~13091) sits bottom-LEFT with a circular
// scroll-progress ring, so it never shares space with WhatsApp/phone widgets
// on the opposite corner in the first place.
import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { useCookieBannerOffset } from "../../hooks/useCookieBannerOffset";

const RADIUS = 19;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hover, setHover] = useState(false);
  const bannerOffset = useCookieBannerOffset();

  useEffect(() => {
    // Read scrollHeight/scrollY inside a rAF-batched handler rather than on
    // every raw 'scroll' event — this widget is mounted on every page, so an
    // unthrottled handler was one of the biggest contributors to the
    // main-thread Style & Layout time (forced-reflow-insight audit): each
    // native scroll tick forced a synchronous layout read, then the resulting
    // setState wrote a new style before the next tick could coalesce with it.
    let ticking = false;
    const measure = () => {
      const scrollY = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(scrollY > 400);
      setProgress(docH > 0 ? Math.min(100, (scrollY / docH) * 100) : 0);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      // FIX (UX audit — focus consistency): no custom focus style existed
      // here, unlike nearly every other interactive element on the site.
      //
      // FIX (mobile overlap): MobileStickyCTA now runs a full-width bar
      // fixed to the bottom of the viewport on screens <768px. This
      // button's old `bottom: 1.5rem` sat well inside that bar's height,
      // so it would render on top of/underneath the Call/WhatsApp bar
      // instead of above it. The extra mobile-only clearance is set via
      // className (bottom-*, media-query capable) instead of the inline
      // `style`, since inline styles can't express a breakpoint; the
      // cookie-banner offset and hover/visible animation still shift it
      // further via `transform`, which composes fine with the base
      // position set in the class.
      //
      // FIX (mobile overlap, round 2 — screenshot audit): bottom-left also
      // means this fixed circle can end up parked directly over left-aligned
      // in-page controls it scrolls past at a given viewport position — e.g.
      // the product page's "Materials"/"Standards" spec sub-tabs, which
      // start right at the same left edge. The comment above explains why
      // it's on the *left* on desktop (md:left-6): to stay clear of
      // WhatsAppBubble, which only renders on desktop (`hidden md:flex`).
      // On mobile that widget doesn't exist — WhatsAppBubble is hidden and
      // MobileStickyCTA spans full-width either side — so bottom-right is
      // free there and doesn't sit over any left-aligned content. Desktop
      // keeps its original left-6 position unchanged via md:left-6/md:right-auto.
      className="fixed right-6 left-auto md:left-6 md:right-auto bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      style={{
        zIndex: 50,
        width: "2.75rem",
        height: "2.75rem",
        background: hover ? "#2563eb" : "#0f172a",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
        transition: "opacity .25s ease, transform .25s ease, background .2s",
        opacity: visible ? 1 : 0,
        transform: visible
          ? hover
            ? `translateY(${-2 - bannerOffset}px) scale(1.08)`
            : `translateY(${-bannerOffset}px) scale(1)`
          : `translateY(${10 - bannerOffset}px) scale(0.85)`,
        pointerEvents: visible ? "auto" : "none",
        border: "none",
        cursor: "pointer",
      }}
    >
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        <circle
          cx="22"
          cy="22"
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2.5"
        />
        <circle
          cx="22"
          cy="22"
          r={RADIUS}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeDasharray={`${CIRCUMFERENCE}`}
          strokeDashoffset={`${CIRCUMFERENCE * (1 - progress / 100)}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .1s linear" }}
        />
      </svg>
      <ChevronUp className="w-4 h-4 text-white relative z-10" aria-hidden="true" />
    </button>
  );
}
