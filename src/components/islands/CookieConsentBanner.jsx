// src/components/islands/CookieConsentBanner.jsx — ported core logic (accept/decline -> cookie + analytics gate)
import { useEffect, useRef, useState } from "react";
import { setCookieBannerState } from "../../lib/cookieBannerStore";

const CONSENT_COOKIE = "ke_cookie_consent";

// GA4 and Microsoft Clarity each set their own first-party cookies once
// loaded, independent of ke_cookie_consent. Revoking consent has to clear
// those directly — the analytics scripts are already injected and won't
// stop firing just because the consent cookie's value changed underneath
// them (see the reload in setConsent below).
const GA4_COOKIE_PREFIXES = ["_ga"];
const CLARITY_COOKIE_PREFIXES = ["_clck", "_clsk", "CLID", "ANONCHK", "MR", "MUID", "SM"];

function getConsentCookie() {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  return match ? match.slice(CONSENT_COOKIE.length + 1) : null;
}

function deleteCookie(name, domain) {
  const domainPart = domain ? `;domain=${domain}` : "";
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/${domainPart}`;
}

// Cookies get deleted across every domain scope they could plausibly have
// been set with (bare host, host with a leading dot, and the registrable
// parent domain) since we don't control how GA4/Clarity's own scripts
// scoped them, and an unmatched domain attribute silently no-ops.
function clearAnalyticsCookies() {
  const prefixes = [...GA4_COOKIE_PREFIXES, ...CLARITY_COOKIE_PREFIXES];
  const names = document.cookie
    .split("; ")
    .filter(Boolean)
    .map((c) => c.split("=")[0]);

  const hostname = window.location.hostname;
  const hostParts = hostname.split(".");
  const parentDomain = hostParts.length > 2 ? `.${hostParts.slice(-2).join(".")}` : null;
  const domainScopes = [null, hostname, `.${hostname}`, ...(parentDomain ? [parentDomain] : [])];

  names
    .filter((name) => prefixes.some((prefix) => name.startsWith(prefix)))
    .forEach((name) => domainScopes.forEach((domain) => deleteCookie(name, domain)));
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  // Populated whenever a ke_cookie_consent cookie already exists — used to
  // tell a genuine first-visit prompt apart from a "manage preferences"
  // reopen, and to highlight whichever button matches the saved choice.
  const [activeChoice, setActiveChoice] = useState(null);
  const barRef = useRef(null);

  useEffect(() => {
    const existingChoice = getConsentCookie();
    if (existingChoice) {
      setActiveChoice(existingChoice);
    } else {
      setVisible(true);
    }
  }, []);

  // Reopen on demand (Footer's "Cookie Preferences" link) even when a
  // choice was already made, so visitors can revisit or change it later —
  // matching the privacy policy's "at any time from the consent banner".
  useEffect(() => {
    const onOpenPreferences = () => {
      setActiveChoice(getConsentCookie());
      setVisible(true);
    };
    window.addEventListener("ke:openCookiePreferences", onOpenPreferences);
    return () => window.removeEventListener("ke:openCookiePreferences", onOpenPreferences);
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
    const previousChoice = getConsentCookie();
    document.cookie = `ke_cookie_consent=${value};max-age=31536000;path=/`;
    setActiveChoice(value);
    setVisible(false);

    if (value === "accepted") {
      window.dispatchEvent(new CustomEvent("ke:cookieConsentAccepted"));
      return;
    }

    // Revoking after a prior accept: GA4/Clarity are already injected and
    // running in this tab, so flipping the consent cookie alone wouldn't
    // stop them until some future navigation. Clear their cookies now and
    // reload so AnalyticsLoader remounts fresh (consent is "declined", so
    // it simply won't load them again) instead of leaving the already-
    // running scripts firing for the rest of the session.
    if (previousChoice === "accepted") {
      clearAnalyticsCookies();
      window.location.reload();
    }
  };

  if (!visible) return null;

  // Reopened via the footer's "Cookie Preferences" link with a choice
  // already on file — show it as a preferences view (highlight the saved
  // choice) rather than the fresh first-visit prompt.
  const isReopened = activeChoice !== null;
  const declineActive = isReopened && activeChoice === "declined";
  const acceptActive = isReopened && activeChoice === "accepted";
  const activeRing = "ring-2 ring-offset-1 ring-blue-500";

  return (
    <div
      ref={barRef}
      className="fixed bottom-0 inset-x-0 z-90 bg-white border-t border-slate-200 shadow-2xl p-3 sm:p-5"
    >
      <div className="max-w-5xl mx-auto flex flex-row items-center gap-3 sm:gap-4">
        {/*
          MOBILE UX FIX: the original single <p> (three lines of prose at
          text-sm, stacked above the buttons via flex-col) pushed this bar's
          height on a ~390px-wide phone to roughly a third of the viewport,
          burying the hero/CTA content beneath it and the sticky Call/WhatsApp
          bar together. Below `sm` we now show a one-line summary instead and
          keep the row horizontal (text + buttons side by side) so the whole
          banner fits in ~56px instead of ~230px. `sm:` and up render the
          exact original element, untouched, so tablet/desktop is unchanged.
        */}
        <p className="sm:hidden text-xs text-slate-600 flex-1 leading-snug">
          {isReopened ? "Manage cookie preferences —" : "We use cookies —"}{" "}
          <a href="/privacy-policy" className="underline underline-offset-2 hover:text-slate-900">
            Privacy Policy
          </a>
          .
        </p>
        <p className="hidden sm:block text-sm text-slate-600 flex-1">
          {isReopened ? (
            <>
              Manage your cookie preferences. Your current choice is highlighted below. See our{" "}
              <a
                href="/privacy-policy"
                className="underline underline-offset-2 hover:text-slate-900"
              >
                Privacy Policy
              </a>{" "}
              for details.
            </>
          ) : (
            <>
              We use cookies to improve your experience and analyze site traffic. By continuing,
              you agree to our use of cookies. See our{" "}
              <a
                href="/privacy-policy"
                className="underline underline-offset-2 hover:text-slate-900"
              >
                Privacy Policy
              </a>{" "}
              for details.
            </>
          )}
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
            aria-pressed={declineActive}
            className={`px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${declineActive ? activeRing : ""}`}
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => setConsent("accepted")}
            aria-pressed={acceptActive}
            className={`px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${acceptActive ? activeRing : ""}`}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
