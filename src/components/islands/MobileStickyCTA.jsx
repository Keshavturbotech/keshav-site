// src/components/islands/MobileStickyCTA.jsx
//
// CONVERSION FIX: mobile visitors previously had no thumb-reachable,
// always-legible call-to-action. The only persistent mobile contact point
// was WhatsAppBubble's small bottom-right FAB stack — icon-only on touch
// devices (its phone pill's number only reveals on :hover, which mobile
// can't trigger), and a corner target that's harder to hit one-handed than
// a full-width bar.
//
// This bar is the mobile-only (<768px) counterpart: two big, labelled,
// thumb-width tap targets — "Call Now" and "WhatsApp" — always visible at
// the bottom of the viewport. WhatsAppBubble is hidden on mobile (see its
// `hidden md:flex` wrapper) so the two don't stack/compete; it remains
// desktop-only, where the hover-reveal pattern actually works.
//
// Same offset pattern as WhatsAppBubble/BackToTopButton: shifts above the
// cookie consent banner via useCookieBannerOffset instead of stacking under
// it. Safe-area padding keeps it clear of the iOS home-indicator gesture
// bar. A matching mobile-only padding-bottom on the footer (see
// Footer.astro) keeps this bar from permanently covering the last footer
// row once a visitor scrolls to the bottom of the page.
import { CONTACT_INFO } from "../../data/site-config";
import { useCookieBannerOffset } from "../../hooks/useCookieBannerOffset";

export default function MobileStickyCTA() {
  const bannerOffset = useCookieBannerOffset();
  const phone = CONTACT_INFO.phones[0];
  const waHref = `https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(
    "Hi KESHAV ENTERPRISES, I would like to request a technical quote.",
  )}`;

  return (
    <div
      className="md:hidden fixed inset-x-0 z-80 flex border-t border-slate-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-[bottom] duration-200"
      style={{
        bottom: `${bannerOffset}px`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      role="group"
      aria-label="Quick contact"
    >
      <a
        href={`tel:${phone.replace(/\s/g, "")}`}
        aria-label={`Call Keshav Enterprises: ${phone}`}
        className="flex-1 flex items-center justify-center gap-2 min-h-14 py-3 text-slate-900 font-black text-sm active:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
      >
        <svg
          className="w-5 h-5 text-blue-600 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
        </svg>
        Call Now
      </a>
      <div className="w-px bg-slate-200 my-2" aria-hidden="true" />
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Keshav Enterprises on WhatsApp"
        className="flex-1 flex items-center justify-center gap-2 min-h-14 py-3 bg-whatsapp text-white font-black text-sm active:bg-whatsapp-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-300"
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        </svg>
        WhatsApp
      </a>
    </div>
  );
}
