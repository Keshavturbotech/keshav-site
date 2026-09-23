// src/components/islands/CookieConsentBanner.jsx — ported core logic (accept/decline -> cookie + analytics gate)
import { useEffect, useRef, useState } from "react";
import { setCookieBannerState } from "../../lib/cookieBannerStore";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const barRef = useRef(null);

  useEffect(() => {
    const hasChoice = document.cookie.split("; ").some((c) => c.startsWith("ke_cookie_consent="));
    if (!hasChoice) setVisible(true);
  }, []);

  // Publish visibility + measured height so fixed-position widgets
  // (WhatsAppBubble, BackToTopButton) can offset above the banner instead
  // of sitting hidden/underneath it.
  useEffect(() => {
    if (!visible) {
      setCookieBannerState({ visible: false, height: 0 });
      return;
    }
    const measure = () => {
      setCookieBannerState({ visible: true, height: barRef.current?.offsetHeight ?? 0 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [visible]);

  useEffect(() => () => setCookieBannerState({ visible: false, height: 0 }), []);

  const setConsent = (value) => {
    document.cookie = `ke_cookie_consent=${value};max-age=31536000;path=/`;
    setVisible(false);
    if (value === "accepted") window.dispatchEvent(new CustomEvent("ke:cookieConsentAccepted"));
  };

  if (!visible) return null;
  return (
    <div
      ref={barRef}
      className="fixed bottom-0 inset-x-0 z-90 bg-white border-t border-slate-200 shadow-2xl p-4 sm:p-5"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm text-slate-600 flex-1">
          We use cookies to improve your experience and analyze site traffic. By continuing, you
          agree to our use of cookies. See our{" "}
          <a href="/privacy-policy" className="underline underline-offset-2 hover:text-slate-900">
            Privacy Policy
          </a>{" "}
          for details.
        </p>
        <div className="flex gap-2 shrink-0">
          {/*
            FIX (UX audit — focus consistency): these had no custom focus
            style, unlike nearly every other interactive element on the
            site, which fell back to the plain browser-default outline.
            Added the same focus-visible:ring treatment used elsewhere so
            keyboard focus looks consistent across the whole site.
          */}
          <button
            type="button"
            onClick={() => setConsent("declined")}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => setConsent("accepted")}
            className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
