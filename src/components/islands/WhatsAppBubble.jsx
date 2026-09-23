// src/components/islands/WhatsAppBubble.jsx
// FIXED: this was a plain static button stub — caught via screenshot
// comparison against the live site, which shows a much richer widget: a
// timed greeting bubble ("👋 Hello! Need a quote or tech support?..."),
// a phone pill (desktop only, expands to show the number on hover), and a
// WhatsApp FAB with a hover label. Full port of App.jsx's WhatsAppBubble
// (line ~13189), including the session-based dismiss behavior.
//
// MOBILE FIX: this widget's phone pill only reveals the number on
// :hover, which touch devices can't trigger — on mobile it was reducing to
// an icon-only, unlabelled button, a weaker target than a full-width bar.
// MobileStickyCTA now owns mobile conversion (Call + WhatsApp, labelled,
// full-width, thumb-reachable), so this component is desktop-only (see the
// `hidden md:flex` root class below); nothing is lost since every action
// here has a stronger equivalent in that bar on small screens.
import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, X } from "lucide-react";
import { CONTACT_INFO } from "../../data/site-config";
import { useCookieBannerOffset } from "../../hooks/useCookieBannerOffset";
import {
  isAnyEngagementLayerActive,
  markEngagementLayerActive,
  clearEngagementLayerActive,
} from "../../lib/engagementLayerGate";

const WA_GREETING_DELAY = 4000; // ms after mount before first appearance
const WA_GREETING_VISIBLE = 6000; // ms the bubble stays visible before auto-hiding
const WA_GREETING_INTERVAL = 25000; // ms between re-appearances (if not dismissed for session)
const WA_GREETING_MAX_SHOWS = 3; // cap re-appearances per session so it reads as helpful, not naggy
const WA_RETRY_IF_BLOCKED = 5000; // ms to wait and retry if another engagement layer is up
const ENGAGEMENT_LAYER = "wa-greeting";

export default function WhatsAppBubble() {
  const [showGreeting, setShowGreeting] = useState(false);
  const [sessionDone, setSessionDone] = useState(() => {
    try {
      return !!sessionStorage.getItem("ke_wa_dismissed");
    } catch {
      return false;
    }
  });
  const bannerOffset = useCookieBannerOffset();

  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const repeatTimerRef = useRef(null);
  const showCountRef = useRef(0);

  const clearAll = useCallback(() => {
    clearTimeout(showTimerRef.current);
    clearTimeout(hideTimerRef.current);
    clearTimeout(repeatTimerRef.current);
  }, []);

  useEffect(() => {
    if (sessionDone) return;
    const showBubble = () => {
      // FIX (UX audit — overlapping engagement layers): if the exit-intent
      // popup is currently up, don't pile the greeting bubble on top of it —
      // wait a bit and check again rather than skipping this cycle outright,
      // since the popup is a one-shot overlay that closes on its own.
      if (isAnyEngagementLayerActive(ENGAGEMENT_LAYER)) {
        repeatTimerRef.current = setTimeout(showBubble, WA_RETRY_IF_BLOCKED);
        return;
      }
      showCountRef.current += 1;
      markEngagementLayerActive(ENGAGEMENT_LAYER);
      setShowGreeting(true);
      hideTimerRef.current = setTimeout(() => {
        setShowGreeting(false);
        clearEngagementLayerActive(ENGAGEMENT_LAYER);
        if (showCountRef.current < WA_GREETING_MAX_SHOWS) {
          repeatTimerRef.current = setTimeout(showBubble, WA_GREETING_INTERVAL);
        }
      }, WA_GREETING_VISIBLE);
    };
    showTimerRef.current = setTimeout(showBubble, WA_GREETING_DELAY);
    return () => {
      clearAll();
      clearEngagementLayerActive(ENGAGEMENT_LAYER);
    };
  }, [sessionDone, clearAll]);

  const dismiss = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearAll();
      setShowGreeting(false);
      clearEngagementLayerActive(ENGAGEMENT_LAYER);
      setSessionDone(true);
      try {
        sessionStorage.setItem("ke_wa_dismissed", "1");
      } catch {
        /* ignore */
      }
    },
    [clearAll],
  );

  const waHref = `https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent("Hi KESHAV ENTERPRISES, I would like to request a technical quote.")}`;

  return (
    <div
      className="hidden md:flex fixed right-6 z-50 flex-col items-end gap-2 transition-[bottom] duration-200"
      style={{ bottom: `calc(1.5rem + ${bannerOffset}px)` }}
    >
      {showGreeting && (
        <div
          className="relative bg-white border border-slate-200 rounded-2xl rounded-br-sm shadow-xl px-4 py-3 max-w-55"
          role="status"
          aria-live="polite"
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss greeting"
            className="absolute -top-2 -right-2 w-5 h-5 bg-slate-500 hover:bg-slate-700 text-white rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="w-3 h-3" aria-hidden="true" />
          </button>
          <p className="text-xs font-black text-slate-900 mb-0.5">👋 Hello!</p>
          <p className="text-xs font-medium text-slate-600 leading-snug">
            Need a quote or tech support? Chat with our engineers now.
          </p>
          <span
            className="absolute bottom-0 right-3 translate-y-full w-0 h-0 border-l-8 border-r-0 border-t-8 border-l-transparent border-t-white"
            aria-hidden="true"
          />
        </div>
      )}

      {/* Phone pill — icon-only by default (the number only reveals on
          hover via group-hover:max-w-xs below, which touch devices can't
          trigger anyway, so mobile always shows just the icon — matching
          the live reference design, which shows this alongside the
          WhatsApp FAB on mobile too, not desktop-only). */}
      <a
        href={`tel:${CONTACT_INFO.phones[0].replace(/\s/g, "")}`}
        className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-900 p-3.5 rounded-full shadow-lg hover:bg-slate-50 hover:scale-105 transition-all group font-bold text-sm"
        aria-label={`Call Keshav Enterprises: ${CONTACT_INFO.phones[0]}`}
      >
        <Phone className="w-4 h-4 text-blue-600 shrink-0 translate-x-px" aria-hidden="true" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
          {CONTACT_INFO.phones[0]}
        </span>
      </a>

      {/* WhatsApp FAB — with hover label for discoverability */}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Keshav Enterprises on WhatsApp"
        onClick={() => setShowGreeting(false)}
        className="flex items-center gap-2 bg-whatsapp text-white p-3.5 md:pl-3.5 md:pr-4 md:py-3.5 rounded-full shadow-[0_0_16px_rgba(37,211,102,0.4)] hover:bg-whatsapp-hover transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 group"
      >
        <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        </svg>
        <span
          className="hidden md:inline-block max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-bold text-sm"
          aria-hidden="true"
        >
          Chat
        </span>
      </a>
    </div>
  );
}
