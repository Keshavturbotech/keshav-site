// src/components/islands/AnalyticsLoader.jsx
// Ported from App.jsx loadAnalyticsScripts() (line ~8940).
// GA4 + Microsoft Clarity only load after the visitor accepts analytics
// cookies via CookieConsentBanner (or had previously accepted). Cloudflare
// Turnstile is NOT gated here — it sets no tracking cookie and is loaded
// directly by TurnstileWidget.jsx wherever it's used.
//
// CHANGE FROM ORIGINAL: no manual trackPageView()/popstate wiring — that
// existed because the old SPA never did a real page load on navigation, so
// GA4 needed to be told about each route change by hand. With real Astro
// routes, every navigation IS a real page load, so GA4's own script fires
// pageviews automatically. Nothing to reimplement here.
import { useEffect } from "react";

const GA4_ID = import.meta.env.PUBLIC_GA4_ID ?? "";
const CLARITY_ID = import.meta.env.PUBLIC_CLARITY_ID ?? "";
const COOKIE_CONSENT_KEY = "ke_cookie_consent";

function loadGA4() {
  if (!GA4_ID || document.getElementById("ga4-script")) return;
  const s1 = document.createElement("script");
  s1.id = "ga4-script";
  s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  s1.async = true;
  document.head.appendChild(s1);

  const s2 = document.createElement("script");
  s2.id = "ga4-init";
  s2.text =
    `window.dataLayer=window.dataLayer||[];` +
    `function gtag(){dataLayer.push(arguments);}` +
    `gtag('js',new Date());` +
    `gtag('config','${GA4_ID}');`; // real page loads — GA4's own script handles page_view
  document.head.appendChild(s2);
}

function loadClarity() {
  if (!CLARITY_ID || document.getElementById("clarity-script")) return;
  const cs = document.createElement("script");
  cs.id = "clarity-script";
  cs.type = "text/javascript";
  cs.text =
    `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};` +
    `t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;` +
    `y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);` +
    `})(window,document,"clarity","script","${CLARITY_ID}");`;
  document.head.appendChild(cs);
}

// BUGFIX: the original App.jsx deferred Clarity's injection with
// requestIdleCallback to keep it off the main thread during initial
// render/hydration — that deferral was dropped in the Astro port, so
// Clarity was loading synchronously again. GA4 stays eager (its own script
// needs to observe the very first navigation), but Clarity has no such
// requirement, so it goes back to idle time. Falls back to a short
// setTimeout on browsers without requestIdleCallback (e.g. Safari).
function loadClarityDeferred() {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(loadClarity, { timeout: 4000 });
  } else {
    setTimeout(loadClarity, 1000);
  }
}

function loadAnalytics() {
  loadGA4();
  loadClarityDeferred();
}

function hasAcceptedConsent() {
  return document.cookie.split("; ").some((c) => c === `${COOKIE_CONSENT_KEY}=accepted`);
}

export default function AnalyticsLoader() {
  useEffect(() => {
    if (hasAcceptedConsent()) loadAnalytics();
    const onAccept = () => loadAnalytics();
    window.addEventListener("ke:cookieConsentAccepted", onAccept);
    return () => window.removeEventListener("ke:cookieConsentAccepted", onAccept);
  }, []);
  return null;
}
